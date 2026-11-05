/* Every workflow step is a pure function of the shared state. Each one writes
   an Activity event, so the audit trail and the screens can never drift.
   Human gates: nothing here approves pricing, design, QA, POD or invoices on
   its own. Each approval is a separate action a person clicks. */
import type { OmState, Ref, OmEvent, Order, Rfi, Doc, Task, Enquiry, Load, Invoice, QuoteStatus, TaskStatus, EventSource, ContractField } from "./types";
import { SAMPLE_EMAILS, DOC_TYPES } from "./fixtures";
import { byId, nowStamp, blockingOpen, account, dev, gross } from "./selectors";
import { gbp, dateShort } from "./format";

export const YOU = "You (demo)";

const tick = (s: OmState, mins = 3): OmState => ({ ...s, clock: s.clock + mins });
const upd = <T extends { id: string }>(list: T[], id: string, patch: Partial<T> | ((x: T) => Partial<T>)): T[] =>
  list.map(x => (x.id === id ? { ...x, ...(typeof patch === "function" ? patch(x) : patch) } : x));
function log(s: OmState, source: EventSource, actor: string, title: string, note: string, ref: Ref, orderId?: string, status: OmEvent["status"] = "done"): OmState {
  const s2 = tick(s);
  const e: OmEvent = { id: "EV-" + (s2.seq + 1), at: nowStamp(s2), source, actor, title, note, ref, orderId, status };
  return { ...s2, seq: s2.seq + 1, events: [e].concat(s2.events) };
}
const doneTasks = (s: OmState, pred: (t: Task) => boolean): OmState => ({ ...s, tasks: s.tasks.map(t => (pred(t) ? { ...t, status: "Done" as TaskStatus } : t)) });
const lineageNow = (s: OmState, source: any, state: string) => ({ source, updated: nowStamp(s), state, confidence: "High" as const });

/* ── commercial ─────────────────────────────────────────────────────────── */
export function intakeStart(s: OmState): OmState {
  const tpl = SAMPLE_EMAILS[s.intakeSeq % SAMPLE_EMAILS.length];
  const fields = tpl.fields.map(f => ({ ...f, confirmed: f.confidence === "High" }));
  const devName = fields.find(f => f.key === "dev")!.value.toLowerCase();
  const dup = s.devs.find(d => devName.indexOf(d.name.toLowerCase()) === 0 && devName !== d.name.toLowerCase());
  return { ...s, intake: { email: { from: tpl.from, subject: tpl.subject, body: tpl.body, attachments: tpl.attachments, received: tpl.received }, fields, duplicateOf: dup?.id } };
}
export function intakeSet(s: OmState, key: string, value: string): OmState {
  if (!s.intake) return s;
  return { ...s, intake: { ...s.intake, fields: s.intake.fields.map(f => (f.key === key ? { ...f, value, confirmed: true } : f)) } };
}
export function intakeConfirm(s: OmState, key: string): OmState {
  if (!s.intake) return s;
  return { ...s, intake: { ...s.intake, fields: s.intake.fields.map(f => (f.key === key ? { ...f, confirmed: true } : f)) } };
}
export const intakeCancel = (s: OmState): OmState => ({ ...s, intake: null });
export function intakeSave(s: OmState): { s: OmState; id?: string } {
  const it = s.intake;
  if (!it || it.fields.some(f => !f.confirmed)) return { s };
  const get = (k: string) => it.fields.find(f => f.key === k)!.value;
  const acc = s.accounts.find(a => a.name === get("account"));
  if (!acc) return { s };
  const n = 117 + s.intakeSeq;
  const id = "INQ-26-" + n, qid = "QUO-26-" + n, devId = "d-new-" + n;
  const products = get("products").split(",").map(p => p.trim()) as any[];
  const area = parseInt(get("m2").replace(/[^0-9]/g, ""), 10);
  let s2: OmState = { ...s,
    devs: s.devs.concat([{ id: devId, name: get("dev"), town: get("town"), county: "", sector: "To confirm", lineage: lineageNow(s, "Email intake (simulated)", "Created from email, confirmed by you") }]),
    enquiries: ([{ id, received: nowStamp(s).slice(0, 10), accountId: acc.id, devId, contractorStatus: get("contractorStatus") as any, products, drawings: it.email.attachments.filter(a => /\.pdf$/i.test(a)).length,
      estimator: null, due: get("due"), value: 0, urgency: "Normal" as const, quoteId: qid, source: "Email" as const, m2: isNaN(area) ? undefined : area,
      plantPref: get("plant") === "Not specified" ? undefined : (get("plant") as any), lineage: lineageNow(s, "Email intake (simulated)", "Raw email kept. Low-confidence fields confirmed by you") }] as Enquiry[]).concat(s.enquiries),
    quotes: s.quotes.concat([{ id: qid, enquiryId: id, status: "Inquiry" as QuoteStatus, revision: "A", value: 0, probability: 0.25, approved: false, reviewer: null,
      checklist: [{ key: "drawings", label: "ITT drawing pack registered", done: true }, { key: "quantities", label: "Quantities taken off by category", done: false }, { key: "exclusions", label: "Exclusions and assumptions written", done: false }, { key: "design", label: "Design questions logged", done: false }, { key: "review", label: "Manager review complete", done: false }],
      clarifications: [], history: [{ at: nowStamp(s), text: "Created from email intake. " + it.email.attachments.length + " attachments kept" }], exclusions: [] }]),
    tasks: ([{ id: "TSK-" + n, title: "Assign estimator to " + get("dev"), owner: "Estimating lead", due: get("due"), priority: "Medium" as const, dept: "Estimating", status: "Not started" as TaskStatus, ref: { kind: "enquiry" as const, id }, auto: "assign" }] as Task[]).concat(s.tasks),
    intake: null, intakeSeq: s.intakeSeq + 1 };
  s2 = log(s2, "Email", "Inquiry Intake agent", "Enquiry created from email", acc.name + ", " + get("dev") + ". " + it.email.attachments.length + " attachments. Confirmed by you before saving.", { kind: "enquiry", id });
  return { s: s2, id };
}

export function assignEstimator(s: OmState, enquiryId: string, name: string): OmState {
  const e = byId(s.enquiries, enquiryId); if (!e) return s;
  let s2: OmState = { ...s, enquiries: upd(s.enquiries, enquiryId, { estimator: name }),
    quotes: upd(s.quotes, e.quoteId, q => ({ status: q.status === "Inquiry" ? "Estimating" : q.status, history: q.history.concat([{ at: nowStamp(s), text: "Assigned to " + name }]) })) };
  s2 = doneTasks(s2, t => t.auto === "assign" && t.ref.id === enquiryId);
  return log(s2, "Staff", YOU, "Estimator assigned", enquiryId + " assigned to " + name + ". Quote moved to Estimating.", { kind: "enquiry", id: enquiryId });
}
export function toggleCheck(s: OmState, quoteId: string, key: string): OmState {
  return { ...s, quotes: upd(s.quotes, quoteId, q => ({ checklist: q.checklist.map(c => (c.key === key ? { ...c, done: !c.done } : c)) })) };
}
export function reviewComplete(s: OmState, quoteId: string): OmState {
  const q = byId(s.quotes, quoteId); if (!q) return s;
  let s2: OmState = { ...s, quotes: upd(s.quotes, quoteId, x => ({ checklist: x.checklist.map(c => (c.key === "review" ? { ...c, done: true } : c)), reviewer: x.reviewer || YOU, history: x.history.concat([{ at: nowStamp(s), text: "Manager review complete" }]) })) };
  s2 = doneTasks(s2, t => t.auto === "review" && t.ref.id === quoteId);
  return log(s2, "Staff", YOU, "Quote review complete", quoteId + " reviewed. Price set by estimators, not by AI.", { kind: "quote", id: quoteId });
}
export function sendQuote(s: OmState, quoteId: string): OmState {
  const q = byId(s.quotes, quoteId); if (!q || !q.checklist.every(c => c.done)) return s;
  let s2: OmState = { ...s, quotes: upd(s.quotes, quoteId, x => ({ status: "Quote submitted" as QuoteStatus, approved: true, submitted: nowStamp(s).slice(0, 10), history: x.history.concat([{ at: nowStamp(s), text: "Approved and sent (simulated, no email left the demo)" }]) })) };
  s2 = doneTasks(s2, t => t.auto === "send" && t.ref.id === quoteId);
  return log(s2, "Staff", YOU, "Quotation sent (simulated)", quoteId + " " + gbp(q.value) + " approved and marked sent. No real email.", { kind: "quote", id: quoteId });
}
export function setQuoteStatus(s: OmState, quoteId: string, status: QuoteStatus, reason?: string): OmState {
  const q = byId(s.quotes, quoteId); if (!q) return s;
  const s2: OmState = { ...s, quotes: upd(s.quotes, quoteId, x => ({ status, lostReason: reason || x.lostReason, probability: status === "Won" ? 1 : status === "Lost" ? 0 : x.probability, history: x.history.concat([{ at: nowStamp(s), text: "Status set to " + status + (reason ? ": " + reason : "") }]) })) };
  return log(s2, "Staff", YOU, "Quote status updated", quoteId + " now " + status + (reason ? " (" + reason + ")" : "") + ".", { kind: "quote", id: quoteId });
}
export function addClarification(s: OmState, quoteId: string, text: string): OmState {
  if (!text.trim()) return s;
  const s2: OmState = { ...s, quotes: upd(s.quotes, quoteId, q => ({ clarifications: q.clarifications.concat([{ at: nowStamp(s), text, by: YOU, open: true }]) })) };
  return log(s2, "Staff", YOU, "Clarification requested", quoteId + ": " + text, { kind: "quote", id: quoteId }, undefined, "waiting");
}
export function closeClarification(s: OmState, quoteId: string, idx: number): OmState {
  return { ...s, quotes: upd(s.quotes, quoteId, q => ({ clarifications: q.clarifications.map((c, i) => (i === idx ? { ...c, open: false } : c)) })) };
}

/* Award: one quote becomes one order. Values are inherited, never retyped. */
export function createOrder(s: OmState, quoteId: string): { s: OmState; id?: string; existing?: boolean } {
  const existing = s.orders.find(o => o.quoteId === quoteId);
  if (existing) return { s, id: existing.id, existing: true };
  const q = byId(s.quotes, quoteId); if (!q) return { s };
  const e = byId(s.enquiries, q.enquiryId)!;
  const acc = account(s, e.accountId)!, d = dev(s, e.devId)!;
  const n = 140 + s.orders.length;
  const id = "ORD-26-" + n;
  const contact = s.contacts.find(c => c.accountId === acc.id);
  const contract: ContractField[] = [
    { key: "customer", label: "Customer", value: acc.name, inherited: "Account" },
    { key: "site", label: "Project site", value: d.name + (d.town ? ", " + d.town : ""), inherited: "Development" },
    { key: "ref", label: "Contractor reference", value: "" },
    { key: "products", label: "Agreed products", value: e.products.join(", ") + (e.m2 ? " (" + e.m2.toLocaleString("en-GB") + " m² hollowcore)" : ""), inherited: "Quotation" },
    { key: "value", label: "Contract value (net)", value: gbp(q.value), inherited: "Quotation" },
    { key: "stages", label: "Stages and milestones", value: "Award · Contract setup · Design · Production · Delivery" },
    { key: "programme", label: "Expected programme", value: "" },
    { key: "contact", label: "Site contact", value: contact ? contact.name : "", inherited: contact ? "Contact" : undefined },
    { key: "access", label: "Site access", value: "" },
    { key: "lifting", label: "Lifting and unloading", value: "" },
    { key: "delivery", label: "Delivery constraints", value: "" },
  ];
  const order: Order = { id, quoteId, accountId: acc.id, devId: d.id, value: q.value, awarded: nowStamp(s).slice(0, 10), lead: "Commercial Lead (demo)", products: e.products, programme: "To confirm",
    portal: "Contract information required", customerContactId: contact?.id || "", contract, contractApproved: false, design: "Awaiting information", capacity: q.value && e.m2 ? "Tentative" : "Not planned",
    production: "Not released", quality: "Not started", dispatch: "Not planned", pod: "Not due", invoice: "Not due", clientUpdated: nowStamp(s), nextHandoff: "Complete Contract Detail Summary", lineage: lineageNow(s, "Pulse", "Created from " + quoteId + " on award") };
  let s2: OmState = { ...s, orders: s.orders.concat([order]), quotes: upd(s.quotes, quoteId, x => ({ status: "Won" as QuoteStatus, probability: 1, history: x.history.concat([{ at: nowStamp(s), text: "Won. " + id + " created" }]) })),
    docs: s.docs.concat([{ id: "DOC-" + n + "-1", orderId: id, type: DOC_TYPES[0], status: "Draft", updated: nowStamp(s), body: docBody(DOC_TYPES[0], acc.name, d.name, id, gbp(q.value)) }]),
    tasks: ([{ id: "TSK-" + n + "c", title: "Complete Contract Detail Summary for " + d.name, owner: "Commercial Lead (demo)", due: nowStamp(s).slice(0, 10), priority: "High" as const, dept: "Commercial", status: "Not started" as TaskStatus, ref: { kind: "order" as const, id }, auto: "contract" }] as Task[]).concat(s.tasks) };
  s2 = log(s2, "Staff", YOU, "Order created from award", id + " for " + acc.name + ", " + d.name + ". " + gbp(q.value) + " inherited from " + quoteId + ". Nothing re-keyed.", { kind: "order", id }, id);
  return { s: s2, id };
}

/* ── projects ───────────────────────────────────────────────────────────── */
export function setContractField(s: OmState, orderId: string, key: string, value: string): OmState {
  return { ...s, orders: upd(s.orders, orderId, o => ({ contract: o.contract.map(f => (f.key === key ? { ...f, value } : f)) })) };
}
export function approveContract(s: OmState, orderId: string): OmState {
  if (blockingOpen(s, orderId).length) return s;
  let s2: OmState = { ...s, orders: upd(s.orders, orderId, { contractApproved: true }) };
  s2 = doneTasks(s2, t => t.auto === "contract" && t.ref.id === orderId);
  return log(s2, "Staff", YOU, "Contract Detail Summary approved", orderId + " summary approved.", { kind: "order", id: orderId }, orderId);
}
function syncOrderAfterRfi(s: OmState, orderId: string): OmState {
  const left = blockingOpen(s, orderId).length;
  return { ...s, orders: upd(s.orders, orderId, o => ({
    portal: left ? left + " information request" + (left > 1 ? "s" : "") + " outstanding" : o.design === "Awaiting information" ? "Information complete · design next" : o.portal,
    nextHandoff: left ? "Design handover once " + blockingOpen(s, orderId).map(r => r.id).join(" and ") + (left > 1 ? " are" : " is") + " answered" : o.design === "Awaiting information" ? "Ready to hand over to design (iThesis)" : o.nextHandoff,
    clientUpdated: nowStamp(s) })) ,
    designs: s.designs.map(d => d.orderId === orderId && d.status === "Awaiting information" ? { ...d, missing: blockingOpen(s, orderId).map(r => r.question.split(" ").slice(1, 5).join(" ") + " (" + r.id + ")") } : d) };
}
export function draftRfi(s: OmState, orderId: string, question: string, blocking: boolean, area: string): OmState {
  if (!question.trim()) return s;
  const id = "RFI-" + (1041 + s.rfis.length);
  const r: Rfi = { id, orderId, question, blocking, owner: YOU, due: "2026-11-16", status: "Draft", raised: nowStamp(s).slice(0, 10), reminders: [], area };
  return log({ ...s, rfis: s.rfis.concat([r]) }, "Agent", "Contract & RFI agent", "RFI drafted", id + ": " + question + ". Waiting for you to send.", { kind: "rfi", id }, orderId, "waiting");
}
export function sendRfi(s: OmState, rfiId: string): OmState {
  const r = byId(s.rfis, rfiId); if (!r) return s;
  let s2: OmState = { ...s, rfis: upd(s.rfis, rfiId, { status: "Awaiting customer" }) };
  s2 = syncOrderAfterRfi(s2, r.orderId);
  return log(s2, "Staff", YOU, "RFI sent to customer (simulated)", rfiId + " visible in the customer portal. No email sent.", { kind: "rfi", id: rfiId }, r.orderId, "waiting");
}
export function remindRfi(s: OmState, rfiId: string): OmState {
  const r = byId(s.rfis, rfiId); if (!r) return s;
  const s2: OmState = { ...s, rfis: upd(s.rfis, rfiId, x => ({ reminders: x.reminders.concat([nowStamp(s).slice(0, 10)]) })) };
  return log(s2, "Agent", "Contract & RFI agent", "Reminder sent (simulated)", rfiId + " reminder " + (r.reminders.length + 1) + ". Due " + dateShort(r.due) + ".", { kind: "rfi", id: rfiId }, r.orderId, "waiting");
}
export function resolveRfi(s: OmState, rfiId: string, response: string, by: string, viaPortal = false): OmState {
  const r = byId(s.rfis, rfiId); if (!r || r.status === "Resolved") return s;
  let s2: OmState = { ...s, rfis: upd(s.rfis, rfiId, { status: "Resolved", response: response || "Answered", respondedBy: by }) };
  s2 = doneTasks(s2, t => t.auto === "rfi" && t.ref.id === rfiId);
  s2 = syncOrderAfterRfi(s2, r.orderId);
  const left = blockingOpen(s2, r.orderId).length;
  return log(s2, viaPortal ? "Customer" : "Staff", by, viaPortal ? "Customer answered RFI in portal" : "RFI resolved", rfiId + (r.blocking ? " (blocking)" : "") + ": " + (response || "answered") + ". " + left + " blocking RFI" + (left === 1 ? "" : "s") + " left on " + r.orderId + ".", { kind: "rfi", id: rfiId }, r.orderId);
}
export function handoverDesign(s: OmState, orderId: string): OmState {
  if (blockingOpen(s, orderId).length) return s;
  const s2: OmState = { ...s, orders: upd(s.orders, orderId, { design: "In design", portal: "Design in progress", nextHandoff: "Design package in iThesis" }),
    designs: s.designs.map(d => (d.orderId === orderId && d.status === "Awaiting information" ? { ...d, status: "In design", missing: [] } : d)) };
  return log(s2, "iThesis", "iThesis handoff (illustrative)", "Design handover sent (simulated)", orderId + " contract data and RFI answers packaged for iThesis. No real writeback.", { kind: "order", id: orderId }, orderId);
}

export function docBody(type: string, customer: string, site: string, orderId: string, value: string) {
  const intro = "Dear " + customer + " project team,\n\n";
  const end = "\n\nKind regards,\nOranmore Precast\n\n[Illustrative draft generated in the Pulse demo. Final wording and template to be confirmed with Oranmore.]";
  const lines: Record<string, string> = {
    "Award acknowledgement": "Thank you for awarding Oranmore Precast the precast package for " + site + " (our ref " + orderId + ", " + value + " net). We will issue the Contract Detail Summary and our information requests within two working days.",
    "Contract information request": "To set up " + site + " we need the outstanding items listed in the portal, including crane positions, site access and delivery constraints. Design cannot start until the blocking items are answered.",
    "Programme confirmation": "Please confirm the delivery programme for " + site + ". We will hold indicative plant capacity until the programme and design are agreed.",
    "Design information request": "Our design team needs the following to progress the " + site + " package: structural interfaces, services penetrations and any revisions since tender.",
    "Delivery requirements": "Please confirm the delivery requirements for " + site + ": permitted hours, access route, offloading method and the named receiver who will sign for each load.",
    "QA and documentation handover": "Attached is the QA and documentation pack for units delivered to " + site + " to date, including inspection records and delivery evidence.",
    "Variation / change notice": "We have recorded a change to the " + site + " scope. Details and any effect on value and programme are set out below for your approval.",
  };
  return intro + (lines[type] || "") + end;
}
export function generateDoc(s: OmState, orderId: string, type: string): OmState {
  const o = byId(s.orders, orderId)!; const acc = account(s, o.accountId)!, d = dev(s, o.devId)!;
  const existing = s.docs.find(x => x.orderId === orderId && x.type === type);
  const body = docBody(type, acc.name, d.name, orderId, gbp(o.value));
  const s2: OmState = existing ? { ...s, docs: upd(s.docs, existing.id, { status: "Draft", body, updated: nowStamp(s) }) }
    : { ...s, docs: s.docs.concat([{ id: "DOC-" + orderId.slice(-3) + "-" + (DOC_TYPES.indexOf(type) + 1), orderId, type, status: "Draft", body, updated: nowStamp(s) } as Doc]) };
  return log(s2, "Agent", "Contract & RFI agent", "Document drafted", type + " for " + orderId + ", prefilled from the order. Needs your approval.", { kind: "order", id: orderId }, orderId, "waiting");
}
export const editDoc = (s: OmState, docId: string, body: string): OmState => ({ ...s, docs: upd(s.docs, docId, { body, updated: nowStamp(s) }) });
export function approveDoc(s: OmState, docId: string): OmState {
  const d = byId(s.docs, docId); if (!d) return s;
  return log({ ...s, docs: upd(s.docs, docId, { status: "Approved", updated: nowStamp(s) }) }, "Staff", YOU, "Document approved", d.type + " for " + d.orderId + ".", { kind: "order", id: d.orderId }, d.orderId);
}
export function sendDoc(s: OmState, docId: string): OmState {
  const d = byId(s.docs, docId); if (!d || d.status !== "Approved") return s;
  return log({ ...s, docs: upd(s.docs, docId, { status: "Sent (simulated)", updated: nowStamp(s) }) }, "Staff", YOU, "Document marked sent (simulated)", d.type + " for " + d.orderId + ". No email left the demo.", { kind: "order", id: d.orderId }, d.orderId);
}
export function portalMessage(s: OmState, orderId: string, text: string, from: string): OmState {
  if (!text.trim()) return s;
  const s2: OmState = { ...s, portalMessages: s.portalMessages.concat([{ orderId, at: nowStamp(s), from, text }]) };
  return log(s2, "Customer", from, "Customer question via portal", text, { kind: "order", id: orderId }, orderId, "waiting");
}

/* ── design & QA (iThesis-owned: Pulse records the human decision only) ── */
export function recordClientApproval(s: OmState, designId: string): OmState {
  const d = byId(s.designs, designId); if (!d) return s;
  let s2: OmState = { ...s, designs: upd(s.designs, designId, x => ({ status: "Released for production", released: true, revisions: x.revisions.concat([{ rev: x.revision, at: nowStamp(s).slice(0, 10), note: "Client approval recorded; released by planner sign-off" }]) })),
    orders: upd(s.orders, d.orderId, { design: "Released for production", production: "Scheduled", portal: "Drawings approved · production scheduling", nextHandoff: "Planner to firm capacity in iThesis" }) };
  s2 = doneTasks(s2, t => t.auto === "design" && t.ref.id === designId);
  return log(s2, "Staff", YOU, "Design approval recorded", designId + " " + d.revision + " approved by client and released by planner sign-off. iThesis remains the schedule of record.", { kind: "design", id: designId }, d.orderId);
}
export function qaRelease(s: OmState, lotId: string): OmState {
  const l = byId(s.lots, lotId); if (!l) return s;
  let s2: OmState = { ...s, lots: upd(s.lots, lotId, { qa: "Released", note: l.note + " · Released by " + YOU }) };
  const pendingLeft = s2.lots.filter(x => x.orderId === l.orderId && (x.qa === "Inspection pending" || x.qa === "On hold")).length;
  s2 = { ...s2, orders: upd(s2.orders, l.orderId, o => ({ quality: pendingLeft ? o.quality : "Released" })) };
  s2 = doneTasks(s2, t => t.auto === "qa" && t.ref.id === lotId);
  return log(s2, "Staff", YOU, "QA sign-off", lotId + " released after inspection. Load can be collected.", { kind: "lot", id: lotId }, l.orderId);
}
export function qaHold(s: OmState, lotId: string, note: string): OmState {
  const l = byId(s.lots, lotId); if (!l) return s;
  return log({ ...s, lots: upd(s.lots, lotId, { qa: "On hold", note }) }, "Staff", YOU, "QA hold", lotId + ": " + note, { kind: "lot", id: lotId }, l.orderId, "waiting");
}

/* ── logistics: carrier app and POD review ──────────────────────────────── */
const syncOrderPod = (s: OmState, orderId: string): OmState => {
  const ls = s.loads.filter(l => l.orderId === orderId);
  const pod = ls.some(l => l.status === "Exception") ? "Exception" : ls.some(l => l.status === "Arrival claimed") ? "Awaiting POD" : ls.some(l => l.status === "POD submitted") ? "POD submitted" : ls.some(l => l.status === "POD verified") ? "Verified" : "Not due";
  const invs = s.invoices.filter(i => i.orderId === orderId && i.loadId);
  const inv = invs.some(i => i.stage === "Held") ? "Held" : invs.some(i => i.stage === "Eligible") ? "Eligible" : invs.some(i => i.stage === "Ready for finance review") ? "Ready for finance review"
    : invs.some(i => i.stage === "Review approved") ? "Review approved" : invs.some(i => i.stage === "Handoff simulated") ? "Handoff simulated" : (byId(s.orders, orderId)?.invoice || "Not due");
  return { ...s, orders: upd(s.orders, orderId, { pod: pod as any, invoice: inv as any }) };
};
export const CARRIER_STEPS = ["Collection check", "Loaded", "En route", "At site", "Unloading photo", "Receiver & signature", "Submitted"];
export function carrierAdvance(s: OmState, loadId: string): OmState {
  const l = byId(s.loads, loadId); if (!l || l.carrierStep >= 5) return s;
  const step = l.carrierStep + 1;
  const status: Load["status"] = step === 1 ? "Loaded" : step === 2 ? "Dispatched" : step >= 3 ? "Arrival claimed" : l.status;
  const claimed = step === 3 ? nowStamp(s) : l.claimed;
  const s2: OmState = { ...s, loads: upd(s.loads, loadId, { carrierStep: step, status: l.status === "Arrival claimed" && step > 3 ? "Arrival claimed" : status, claimed }) };
  const title = ["", "Collection check complete", "Load dispatched", "Carrier at site (claim)", "", ""][step];
  return title ? log(syncOrderPod(s2, l.orderId), "Carrier", carrierName(s, l), title, loadId + (step === 3 ? ": carrier says arrived. This is a claim, not proof." : "."), { kind: "load", id: loadId }, l.orderId, step === 3 ? "waiting" : "done") : s2;
}
const carrierName = (s: OmState, l: Load) => byId(s.carriers, l.carrierId)?.name || "Carrier";
export function carrierSetPod(s: OmState, loadId: string, patch: Partial<Load["pod"]>): OmState {
  return { ...s, loads: upd(s.loads, loadId, l => ({ pod: { ...l.pod, ...patch }, carrierStep: Math.max(l.carrierStep, patch.photo ? 4 : patch.signature || patch.receiver ? 5 : l.carrierStep) })) };
}
export function carrierSubmit(s: OmState, loadId: string): OmState {
  const l = byId(s.loads, loadId); if (!l || !l.pod.photo || !l.pod.receiver || !l.pod.signature) return s;
  let s2: OmState = { ...s, loads: upd(s.loads, loadId, x => ({ status: "POD submitted", carrierStep: 6, claimed: x.claimed || nowStamp(s), pod: { ...x.pod, submitted: nowStamp(s) } })),
    invoices: s.invoices.map(i => (i.id === l.invoiceId && i.stage === "Held" ? { ...i, hold: "POD submitted, review pending", history: i.history.concat([{ at: nowStamp(s), text: "POD submitted by carrier. Still held until a person accepts it" }]) } : i)) };
  s2 = syncOrderPod(s2, l.orderId);
  return log(s2, "Carrier", carrierName(s, l), "POD submitted", loadId + ": photo, receiver " + l.pod.receiver + ", signature. Timestamp and location are demo data, not verified telematics. Review pending.", { kind: "load", id: loadId }, l.orderId, "waiting");
}
export function carrierException(s: OmState, loadId: string, text: string): OmState {
  const l = byId(s.loads, loadId); if (!l) return s;
  const s2 = syncOrderPod({ ...s, loads: upd(s.loads, loadId, { status: "Exception", exception: text }) }, l.orderId);
  return log(s2, "Carrier", carrierName(s, l), "Delivery exception reported", loadId + ": " + text, { kind: "load", id: loadId }, l.orderId, "failed");
}
export function requestPod(s: OmState, loadId: string): OmState {
  const l = byId(s.loads, loadId); if (!l) return s;
  return log(s, "Agent", "Dispatch & POD agent", "POD requested from carrier (simulated)", loadId + ": asked " + carrierName(s, l) + " for unloading photo and receiver signature. No message sent.", { kind: "load", id: loadId }, l.orderId, "waiting");
}
export function reviewPod(s: OmState, loadId: string, accept: boolean, note = ""): OmState {
  const l = byId(s.loads, loadId); if (!l) return s;
  if (accept && l.status === "Arrival claimed") return s; // no evidence: cannot be accepted
  if (!accept) {
    let s2: OmState = { ...s, loads: upd(s.loads, loadId, x => ({ status: "Exception", exception: note || "POD rejected: evidence insufficient", pod: { ...x.pod, rejected: nowStamp(s) } })),
      invoices: s.invoices.map(i => (i.id === l.invoiceId ? { ...i, stage: "Held", hold: "POD rejected", history: i.history.concat([{ at: nowStamp(s), text: "POD rejected by reviewer" }]) } : i)) };
    s2 = syncOrderPod(s2, l.orderId);
    return log(s2, "Staff", YOU, "POD rejected", loadId + ": " + (note || "evidence insufficient") + ". Invoice stays held.", { kind: "load", id: loadId }, l.orderId, "failed");
  }
  const inv = byId(s.invoices, l.invoiceId);
  const adjust = l.status === "Exception" && /35 of 36/.test(l.exception || "") ? Math.round((inv?.net || 0) / 36) : 0;
  let s2: OmState = { ...s, loads: upd(s.loads, loadId, x => ({ status: "POD verified", exception: undefined, pod: { ...x.pod, verified: nowStamp(s), verifiedBy: YOU, note: note || x.pod.note } })),
    invoices: s.invoices.map(i => (i.id === l.invoiceId ? { ...i, stage: "Eligible", hold: undefined, net: i.net - adjust,
      history: i.history.concat([{ at: nowStamp(s), text: "POD accepted by reviewer. Eligible for invoicing" + (adjust ? ". Net reduced by " + gbp(adjust) + " for 1 plank short" : "") }]) } : i)) };
  s2 = syncOrderPod(s2, l.orderId);
  s2 = doneTasks(s2, t => t.auto === "pod" && t.ref.id === loadId);
  return log(s2, "Staff", YOU, "POD accepted", loadId + " verified after human review" + (inv ? ". " + inv.id + " " + gbp(inv.net - adjust) + " now eligible: finance can release it" : "") + ".", { kind: "load", id: loadId }, l.orderId);
}

/* ── finance ────────────────────────────────────────────────────────────── */
export function releaseInvoice(s: OmState, invId: string): OmState {
  const i = byId(s.invoices, invId); if (!i || i.stage !== "Eligible") return s;
  let s2: OmState = { ...s, invoices: upd(s.invoices, invId, x => ({ stage: "Ready for finance review", history: x.history.concat([{ at: nowStamp(s), text: "Released to invoice queue by finance" }]) })) };
  s2 = syncOrderPod(s2, i.orderId);
  return log(s2, "Staff", YOU, "Invoice released to queue", invId + " " + gbp(i.net) + " moved from held to ready for finance review.", { kind: "invoice", id: invId }, i.orderId);
}
export function approveInvoice(s: OmState, invId: string): OmState {
  const i = byId(s.invoices, invId); if (!i || i.stage !== "Ready for finance review") return s;
  let s2: OmState = { ...s, invoices: upd(s.invoices, invId, x => ({ stage: "Review approved", history: x.history.concat([{ at: nowStamp(s), text: "Approved for Sage handoff by finance review" }]) })) };
  s2 = syncOrderPod(s2, i.orderId);
  s2 = doneTasks(s2, t => t.auto === "invoice" && t.ref.id === invId);
  return log(s2, "Staff", YOU, "Invoice review approved", invId + " " + gbp(i.net) + " net, " + gbp(gross(i.net)) + " gross. Ready for simulated Sage handoff.", { kind: "invoice", id: invId }, i.orderId);
}
export function simulateSage(s: OmState, invId: string): OmState {
  const i = byId(s.invoices, invId); if (!i || i.stage !== "Review approved") return s;
  if (s.invoices.some(x => x.id !== invId && x.loadId && x.loadId === i.loadId && x.stage === "Handoff simulated")) return s; // duplicate guard
  let s2: OmState = { ...s, invoices: upd(s.invoices, invId, x => ({ stage: "Handoff simulated", sageRef: "SIM-" + invId.slice(-4), history: x.history.concat([{ at: nowStamp(s), text: "Handoff simulated. Not a real Sage export" }]) })) };
  s2 = syncOrderPod(s2, i.orderId);
  return log(s2, "Sage", "Sage (illustrative, not connected)", "Handoff simulated", invId + " mapped to customer, order and VAT fields. Mock audit entry only: no invoice was created in Sage.", { kind: "invoice", id: invId }, i.orderId);
}
export function chaseDebt(s: OmState, invId: string): OmState {
  const i = byId(s.invoices, invId); if (!i) return s;
  const s2: OmState = { ...s, invoices: upd(s.invoices, invId, x => ({ history: x.history.concat([{ at: nowStamp(s), text: "Reminder drafted (simulated)" }]) })) };
  return log(s2, "Agent", "Finance Readiness agent", "Payment reminder drafted (simulated)", invId + " " + gbp(i.net) + ". Draft only, not sent.", { kind: "invoice", id: invId }, i.orderId, "waiting");
}

/* ── work ───────────────────────────────────────────────────────────────── */
export function setTaskStatus(s: OmState, taskId: string, status: TaskStatus): OmState {
  const t = byId(s.tasks, taskId); if (!t) return s;
  return log({ ...s, tasks: upd(s.tasks, taskId, { status }) }, "Staff", YOU, "Task " + (status === "Done" ? "completed" : "updated"), t.title + " → " + status, t.ref);
}
export function addTask(s: OmState, title: string, owner: string, ref: Ref): OmState {
  if (!title.trim()) return s;
  const id = "TSK-" + (400 + s.tasks.length);
  return log({ ...s, tasks: ([{ id, title, owner, due: "2026-11-13", priority: "Medium" as const, dept: "General", status: "Not started" as TaskStatus, ref }] as Task[]).concat(s.tasks) }, "Staff", YOU, "Task created", title, ref);
}
export const invoiceById = (s: OmState, id: string): Invoice | undefined => byId(s.invoices, id);
