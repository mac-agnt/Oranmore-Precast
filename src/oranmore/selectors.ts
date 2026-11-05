/* Every count, total and status the UI shows is derived here from the one
   shared state. No KPI is typed in by hand, so no two screens can disagree. */
import type { OmState, Order, Quote, Enquiry, Ref, Load, Invoice, Commitment, QuoteStatus } from "./types";
import { HOLLOWCORE_CAPACITY, SNAPSHOT_DAY, WEEK } from "./fixtures";
import { addDays, daysBetween, gbp, gbpShort, hoursSince, dateShort, stamp } from "./format";

export const TODAY = SNAPSHOT_DAY;
export const VAT = 0.2;
export const nowStamp = (s: OmState) => {
  const mins = 9 * 60 + s.clock;
  return TODAY + " " + String(Math.floor(mins / 60)).padStart(2, "0") + ":" + String(mins % 60).padStart(2, "0");
};

export const byId = <T extends { id: string }>(list: T[], id?: string | null) => list.find(x => x.id === id);
export const account = (s: OmState, id?: string | null) => byId(s.accounts, id);
export const dev = (s: OmState, id?: string | null) => byId(s.devs, id);
export const quoteOf = (s: OmState, e: Enquiry) => byId(s.quotes, e.quoteId)!;
export const enquiryOf = (s: OmState, q: Quote) => byId(s.enquiries, q.enquiryId)!;
export const orderForQuote = (s: OmState, quoteId: string) => s.orders.find(o => o.quoteId === quoteId);

export const OPEN_QUOTE: QuoteStatus[] = ["Inquiry", "Estimating", "Quote submitted", "Negotiation"];
export const PRE_SUBMIT: QuoteStatus[] = ["Inquiry", "Estimating"];

export function orderLabel(s: OmState, o: Order) {
  return (account(s, o.accountId)?.name || "") + " · " + (dev(s, o.devId)?.name || "");
}

/* ── commercial ─────────────────────────────────────────────────────────── */
export interface EnquiryRow {
  e: Enquiry; q: Quote; account: string; dev: string; dueIn: number; overdue: boolean; dueSoon: boolean;
  weighted: number; competing: Enquiry[]; order?: Order;
}
export function enquiryRows(s: OmState): EnquiryRow[] {
  return s.enquiries.map(e => {
    const q = quoteOf(s, e);
    const dueIn = daysBetween(TODAY, e.due);
    const pre = PRE_SUBMIT.includes(q.status);
    const competing = s.enquiries.filter(x => x.devId === e.devId && x.id !== e.id && x.accountId !== e.accountId);
    return {
      e, q, account: account(s, e.accountId)?.name || "", dev: dev(s, e.devId)?.name || "",
      dueIn, overdue: pre && dueIn < 0, dueSoon: pre && dueIn >= 0 && dueIn <= 3,
      weighted: OPEN_QUOTE.includes(q.status) ? q.value * q.probability : 0, competing, order: orderForQuote(s, q.id),
    };
  }).sort((a, b) => b.e.received.localeCompare(a.e.received));
}

/* Pipeline forecast, de-duplicated by building. Competing contractors bidding
   the same development are mutually exclusive: only the best weighted bid counts. */
export function pipeline(s: OmState) {
  const open = enquiryRows(s).filter(r => OPEN_QUOTE.includes(r.q.status));
  const groups = new Map<string, EnquiryRow[]>();
  open.forEach(r => groups.set(r.e.devId, (groups.get(r.e.devId) || []).concat([r])));
  let raw = 0, deduped = 0, rawWeighted = 0;
  const devGroups = [...groups.entries()].map(([devId, rows]) => {
    const best = rows.reduce((m, r) => (r.weighted > m.weighted ? r : m), rows[0]);
    const groupRaw = rows.reduce((t, r) => t + r.q.value, 0);
    const groupWeighted = rows.reduce((t, r) => t + r.weighted, 0);
    raw += groupRaw; rawWeighted += groupWeighted; deduped += best.weighted;
    return { devId, dev: dev(s, devId)?.name || "", rows, best, exclusive: rows.length > 1, groupRaw, counted: best.weighted, excluded: groupWeighted - best.weighted };
  });
  const secured = open.filter(r => r.e.contractorStatus === "Secured");
  const tendering = open.filter(r => r.e.contractorStatus === "Tendering");
  const unknown = open.filter(r => r.e.contractorStatus === "Unknown");
  const sum = (rs: EnquiryRow[]) => rs.reduce((t, r) => t + r.q.value, 0);
  return {
    open, devGroups, raw, rawWeighted, deduped, doubleCount: rawWeighted - deduped,
    secured: { n: secured.length, value: sum(secured) }, tendering: { n: tendering.length, value: sum(tendering) }, unknown: { n: unknown.length, value: sum(unknown) },
  };
}

export function quoteStatusCounts(s: OmState) {
  const out: Record<string, { n: number; value: number }> = {};
  s.quotes.forEach(q => { out[q.status] = out[q.status] || { n: 0, value: 0 }; out[q.status].n++; out[q.status].value += q.value; });
  return out;
}

export function estimatorLoad(s: OmState) {
  const rows = enquiryRows(s).filter(r => PRE_SUBMIT.includes(r.q.status));
  const names = Array.from(new Set(rows.map(r => r.e.estimator || "Unassigned")));
  return names.map(name => {
    const mine = rows.filter(r => (r.e.estimator || "Unassigned") === name);
    return { name, rows: mine.sort((a, b) => a.e.due.localeCompare(b.e.due)), overdue: mine.filter(r => r.overdue).length,
      soon: mine.filter(r => r.dueSoon).length, drawings: mine.reduce((t, r) => t + r.e.drawings, 0), value: mine.reduce((t, r) => t + r.q.value, 0) };
  }).sort((a, b) => (a.name === "Unassigned" ? 1 : b.name === "Unassigned" ? -1 : b.rows.length - a.rows.length));
}

/* ── projects ───────────────────────────────────────────────────────────── */
export const rfisFor = (s: OmState, orderId: string) => s.rfis.filter(r => r.orderId === orderId);
export const blockingOpen = (s: OmState, orderId: string) => rfisFor(s, orderId).filter(r => r.blocking && r.status !== "Resolved");
export const designFor = (s: OmState, orderId: string) => s.designs.find(d => d.orderId === orderId);
export const loadsFor = (s: OmState, orderId: string) => s.loads.filter(l => l.orderId === orderId);
export const invoicesFor = (s: OmState, orderId: string) => s.invoices.filter(i => i.orderId === orderId);
export const lotsFor = (s: OmState, orderId: string) => s.lots.filter(l => l.orderId === orderId);
export const docsFor = (s: OmState, orderId: string) => s.docs.filter(d => d.orderId === orderId);

export type StageState = "done" | "active" | "blocked" | "waiting" | "pending";
export interface Stage { key: string; label: string; team: string; ref?: Ref; refLabel: string; status: string; state: StageState; evidence: string; at: string; next: string; blocker?: string; customer: boolean; customerText: string }

export function journey(s: OmState, orderId: string): Stage[] {
  const o = byId(s.orders, orderId)!;
  const q = byId(s.quotes, o.quoteId)!;
  const e = byId(s.enquiries, q.enquiryId)!;
  const rf = rfisFor(s, orderId);
  const blk = rf.filter(r => r.blocking && r.status !== "Resolved");
  const d = designFor(s, orderId);
  const caps = s.commitments.filter(c => c.ref.kind === "order" && c.ref.id === orderId);
  const lots = lotsFor(s, orderId);
  const loads = loadsFor(s, orderId);
  const invs = invoicesFor(s, orderId);
  const drafts = invs.filter(i => i.loadId);
  const lastLoad = loads.filter(l => l.status !== "Planned").sort((a, b) => (b.claimed || b.collect).localeCompare(a.claimed || a.collect))[0];
  const unverified = loads.filter(l => l.status === "Arrival claimed" || l.status === "POD submitted" || l.status === "Exception");
  const held = drafts.filter(i => i.stage === "Held");

  const st: Stage[] = [];
  st.push({ key: "enquiry", label: "Enquiry", team: "Commercial", ref: { kind: "enquiry", id: e.id }, refLabel: e.id, status: "Received " + dateShort(e.received), state: "done",
    evidence: e.drawings + " drawing packages · " + e.source, at: e.received, next: "", customer: true, customerText: "Enquiry received " + dateShort(e.received) });
  st.push({ key: "quote", label: "Quotation", team: "Estimating", ref: { kind: "quote", id: q.id }, refLabel: q.id + " rev " + q.revision, status: q.status, state: q.status === "Won" ? "done" : "active",
    evidence: "Approved by manager review", at: q.submitted || e.due, next: "", customer: true, customerText: "Quotation " + (q.status === "Won" ? "accepted" : q.status.toLowerCase()) });
  st.push({ key: "contract", label: "Contract & RFIs", team: "Commercial", ref: { kind: "order", id: o.id }, refLabel: o.id,
    status: blk.length ? blk.length + " blocking RFI" + (blk.length > 1 ? "s" : "") + " open" : o.contractApproved ? "Contract summary approved" : "Summary awaiting approval",
    state: blk.length ? "blocked" : o.contractApproved ? "done" : "active",
    evidence: rf.length + " RFIs · " + rf.filter(r => r.status === "Resolved").length + " resolved · " + docsFor(s, o.id).length + " documents",
    at: o.awarded, next: blk.length ? "Customer to answer " + blk.map(b => b.id).join(" and ") + " by " + dateShort(blk[0].due) : o.contractApproved ? "" : "Approve Contract Detail Summary",
    blocker: blk.length ? blk.map(b => b.question).join("; ") : undefined, customer: true,
    customerText: blk.length ? blk.length + " information request" + (blk.length > 1 ? "s" : "") + " need your answer" : "Contract information complete" });
  st.push({ key: "design", label: "iThesis design", team: "Design", ref: d ? { kind: "design", id: d.id } : undefined, refLabel: d ? d.id + " " + d.revision : "—",
    status: d ? d.status : o.design, state: d?.released ? "done" : d?.status === "Awaiting client approval" ? "waiting" : d?.status === "Awaiting information" ? (blk.length ? "blocked" : "active") : "active",
    evidence: d ? "Illustrative iThesis snapshot · synced " + stamp(d.synced) : "", at: d?.revisions.slice(-1)[0]?.at || "", next: d?.status === "Awaiting client approval" ? "Client approval by " + dateShort(d.target) : d?.status === "Awaiting information" ? (blk.length ? "Waiting on blocking RFIs" : "Hand over to design") : "",
    blocker: d?.status === "Awaiting information" && blk.length ? "Design cannot start until RFIs are answered" : undefined, customer: true,
    customerText: d?.released ? "Drawings approved" : d?.status === "Awaiting client approval" ? "Drawings " + d.revision + " awaiting your approval" : "Design not started" });
  const firm = caps.filter(c => c.firm), tent = caps.filter(c => !c.firm);
  st.push({ key: "capacity", label: "Capacity", team: "Plant Operations", ref: { kind: "order", id: o.id }, refLabel: firm.length ? firm.length + " firm slots" : tent.length ? tent.length + " tentative slots" : "—",
    status: o.capacity, state: o.capacity === "Allocated" ? "done" : o.capacity === "Tentative" ? "waiting" : "pending",
    evidence: caps.map(c => c.plant + " " + c.m2.toLocaleString("en-GB") + " m² " + dateShort(c.week)).slice(0, 2).join(" · "), at: "", next: o.capacity === "Tentative" ? "Firm up in iThesis once design is released" : "", customer: false, customerText: "" });
  const casting = lots.filter(l => l.status === "Casting" || l.status === "Scheduled").length;
  st.push({ key: "production", label: "Production", team: "Plant Operations", ref: lots[0] ? { kind: "lot", id: lots[0].id } : undefined, refLabel: lots.length ? lots.length + " lots" : "—",
    status: o.production, state: o.production === "Complete" ? "done" : o.production === "Not released" ? "pending" : "active",
    evidence: lots.length ? lots.filter(l => l.status === "Complete").length + " complete · " + casting + " scheduled/casting" : "Not released", at: lots[0]?.actual || "", next: "", customer: true,
    customerText: o.production === "Not released" ? "Production not started" : "In production" });
  const qaPending = lots.filter(l => l.qa === "Inspection pending" || l.qa === "On hold");
  st.push({ key: "quality", label: "QA & yard", team: "Quality/Yard", ref: qaPending[0] ? { kind: "lot", id: qaPending[0].id } : lots[0] ? { kind: "lot", id: lots[0].id } : undefined,
    refLabel: qaPending.length ? qaPending.map(l => l.id).join(", ") : lots.length ? "All released" : "—",
    status: qaPending.length ? qaPending.length + " awaiting sign-off" : lots.length ? "Released" : "Not started", state: qaPending.length ? "waiting" : lots.length ? "done" : "pending",
    evidence: "Human inspection sign-off only", at: "", next: qaPending.length ? "QA inspector sign-off" : "", customer: false, customerText: "" });
  st.push({ key: "dispatch", label: "Dispatch", team: "Transport", ref: lastLoad ? { kind: "load", id: lastLoad.id } : loads[0] ? { kind: "load", id: loads[0].id } : undefined,
    refLabel: loads.length ? loads.length + " loads" : "—", status: o.dispatch, state: o.dispatch === "Complete" ? "done" : o.dispatch === "Not planned" ? "pending" : "active",
    evidence: loads.length ? loads.filter(l => l.status === "Planned").length + " planned · " + loads.filter(l => l.status === "Dispatched" || l.status === "Loaded").length + " moving" : "", at: lastLoad?.collect || "", next: "", customer: true,
    customerText: loads.length ? "Next delivery " + (loads.filter(l => l.status === "Planned" || l.status === "Loaded")[0]?.deliver.split(" ")[0] ? dateShort(loads.filter(l => l.status === "Planned" || l.status === "Loaded")[0].deliver.split(" ")[0]) : "to be confirmed") : "Deliveries not yet planned" });
  st.push({ key: "pod", label: "Delivery proof", team: "Transport", ref: unverified[0] ? { kind: "load", id: unverified[0].id } : lastLoad ? { kind: "load", id: lastLoad.id } : undefined,
    refLabel: unverified.length ? unverified.map(l => l.id).join(", ") : loads.filter(l => l.status === "POD verified").length + " verified",
    status: unverified.length ? unverified.map(l => l.status === "Arrival claimed" ? "Claimed, no POD" : l.status === "POD submitted" ? "POD review pending" : "Exception").join(" · ") : loads.some(l => l.status === "POD verified") ? "Verified" : "Not due",
    state: unverified.some(l => l.status === "Arrival claimed" || l.status === "Exception") ? "blocked" : unverified.length ? "waiting" : loads.some(l => l.status === "POD verified") ? "done" : "pending",
    evidence: unverified[0] ? (unverified[0].pod.photo ? "Photo" : "No photo") + " · " + (unverified[0].pod.signature ? "signed" : "no signature") : "Photo, receiver and signature reviewed by a person",
    at: unverified[0]?.claimed || lastLoad?.pod.verified || "", next: unverified.length ? "Human review of delivery evidence" : "",
    blocker: unverified.some(l => l.status === "Arrival claimed") ? "Carrier claim is not proof of delivery" : undefined, customer: true,
    customerText: loads.some(l => l.status === "POD verified") ? loads.filter(l => l.status === "POD verified").length + " deliveries confirmed" : "No deliveries yet" });
  const ready = invs.filter(i => i.stage === "Ready for finance review" || i.stage === "Review approved" || i.stage === "Eligible");
  st.push({ key: "invoice", label: "Sage invoice", team: "Finance", ref: (held[0] || ready[0] || invs[0]) ? { kind: "invoice", id: (held[0] || ready[0] || invs[0]).id } : undefined,
    refLabel: (held[0] || ready[0] || invs[0])?.id || "—",
    status: held.length ? "Held · " + gbp(held.reduce((t, i) => t + i.net, 0)) : ready.length ? ready[0].stage + " · " + gbp(ready[0].net) : invs.some(i => i.stage === "Handoff simulated") ? "Handoff simulated" : invs.length ? "Issued (Sage snapshot)" : "Not due",
    state: held.length ? "blocked" : ready.length ? "active" : invs.length ? "done" : "pending",
    evidence: held[0]?.hold || (ready.length ? "POD verified" : invs.length ? invs.length + " invoices in Sage snapshot" : ""), at: "", next: held.length ? "Waits for verified POD" : ready.length ? "Finance review, then simulated Sage handoff" : "",
    blocker: held.length ? held.map(h => h.id + ": " + h.hold).join("; ") : undefined, customer: false, customerText: "" });
  return st;
}

export function orderBlockers(s: OmState, o: Order) {
  return journey(s, o.id).filter(x => x.state === "blocked");
}

/* ── capacity ───────────────────────────────────────────────────────────── */
export interface Scenario { addLound?: number; addBrandon?: number; move?: { id: string; to: "Brandon" | "Lound" } }
export function capacityWeek(s: OmState, week = WEEK, sc: Scenario = {}) {
  const items = s.commitments.filter(c => c.week === week && c.product === "Hollowcore").map(c =>
    sc.move && sc.move.id === c.id ? { ...c, plant: sc.move.to } : c);
  const plants = (["Brandon", "Lound"] as const).map(p => {
    const cap = HOLLOWCORE_CAPACITY[p];
    const firmItems = items.filter(c => c.plant === p && c.firm);
    const tentItems = items.filter(c => c.plant === p && !c.firm);
    const add = p === "Lound" ? sc.addLound || 0 : sc.addBrandon || 0;
    const firm = firmItems.reduce((t, c) => t + c.m2, 0);
    const hypo = firm + add;
    return { plant: p, cap, firm, tentative: tentItems.reduce((t, c) => t + c.m2, 0), add, hypo, free: cap - hypo, pct: hypo / cap, over: Math.max(0, hypo - cap), firmItems, tentItems };
  });
  const cap = plants.reduce((t, p) => t + p.cap, 0), firm = plants.reduce((t, p) => t + p.firm, 0), hypo = plants.reduce((t, p) => t + p.hypo, 0);
  return { week, plants, cap, firm, hypo, free: cap - hypo, pct: hypo / cap, tentative: plants.reduce((t, p) => t + p.tentative, 0) };
}

/* ── logistics ──────────────────────────────────────────────────────────── */
export const carrierOf = (s: OmState, l: Load) => byId(s.carriers, l.carrierId);
export const loadAwaitingProof = (l: Load) => l.status === "Arrival claimed" || l.status === "POD submitted" || l.status === "Exception";
export function podQueue(s: OmState) {
  const now = nowStamp(s);
  return s.loads.filter(loadAwaitingProof).map(l => ({ l, hours: l.claimed ? hoursSince(l.claimed, now) : 0, invoice: byId(s.invoices, l.invoiceId) }))
    .sort((a, b) => ((a.l.status === "Arrival claimed" ? 0 : 1) - (b.l.status === "Arrival claimed" ? 0 : 1)) || b.hours - a.hours);
}

/* ── finance ────────────────────────────────────────────────────────────── */
export const READY_STAGES = ["Ready for finance review", "Review approved"];
export function financeTotals(s: OmState) {
  const drafts = s.invoices.filter(i => i.loadId);
  const sum = (xs: Invoice[]) => xs.reduce((t, i) => t + i.net, 0);
  const held = drafts.filter(i => i.stage === "Held");
  const heldPod = held.filter(i => /POD/i.test(i.hold || ""));
  const eligible = drafts.filter(i => i.stage === "Eligible");
  const ready = drafts.filter(i => READY_STAGES.includes(i.stage));
  const handed = s.invoices.filter(i => i.stage === "Handoff simulated");
  const issued = s.invoices.filter(i => i.stage === "Issued");
  const paid = s.invoices.filter(i => i.stage === "Paid");
  const contract = s.orders.reduce((t, o) => t + o.value, 0);
  const billed = sum(issued) + sum(paid) + sum(handed);
  const aging = (inv: Invoice) => inv.due ? daysBetween(inv.due, TODAY) : 0;
  const debt = issued.map(i => ({ inv: i, daysOver: aging(i), age: i.issued ? daysBetween(i.issued, TODAY) : 0 }));
  const bucket = (lo: number, hi: number) => debt.filter(d => d.daysOver >= lo && d.daysOver <= hi);
  const buckets = [
    { label: "Not yet due", items: debt.filter(d => d.daysOver < 0) },
    { label: "1-30 days over", items: bucket(0, 30).filter(d => d.daysOver > 0 || d.daysOver === 0) },
    { label: "31-60 days over", items: bucket(31, 60) },
    { label: "Over 60 days", items: debt.filter(d => d.daysOver > 60) },
  ].map(b => ({ ...b, value: b.items.reduce((t, d) => t + d.inv.net, 0) }));
  return {
    drafts, held, heldPod, eligible, ready, handed, issued, paid,
    heldValue: sum(held), heldPodValue: sum(heldPod), readyValue: sum(ready), eligibleValue: sum(eligible), handedValue: sum(handed),
    issuedValue: sum(issued), paidValue: sum(paid), contract, unbilled: contract - billed - sum(ready) - sum(held) - sum(eligible), debt, buckets,
  };
}
export const gross = (net: number) => net * (1 + VAT);

/* ── management KPIs (Home rail, Dashboard band, Briefing) ─────────────── */
export function kpis(s: OmState) {
  const rows = enquiryRows(s);
  const openQ = rows.filter(r => OPEN_QUOTE.includes(r.q.status));
  const due3 = rows.filter(r => r.dueSoon);
  const overdue = rows.filter(r => r.overdue);
  const won = s.orders;
  const cap = capacityWeek(s);
  const fin = financeTotals(s);
  const proof = s.loads.filter(loadAwaitingProof);
  const blockedOrders = s.orders.filter(o => blockingOpen(s, o.id).length > 0 || (designFor(s, o.id)?.status === "Awaiting client approval"));
  const rfiBlocking = s.rfis.filter(r => r.blocking && r.status !== "Resolved");
  return {
    openQuotes: openQ.length, openQuoteValue: openQ.reduce((t, r) => t + r.q.value, 0), due3: due3.length, due3Rows: due3, overdue: overdue.length,
    wonOrders: won.length, wonValue: won.reduce((t, o) => t + o.value, 0),
    capPct: cap.pct, capFirm: cap.firm, capTotal: cap.cap, capFree: cap.free,
    loadsAwaitingProof: proof.length, proofLoads: proof,
    invoiceReady: fin.readyValue, invoiceReadyCount: fin.ready.length, holds: fin.held.length, holdValue: fin.heldValue,
    blockedOrders, rfiBlocking: rfiBlocking.length, pipe: pipeline(s),
  };
}

/* ── attention list (Home rail and Ops Watchdog) ───────────────────────── */
export interface Attention { id: string; tone: "bad" | "warn" | "info"; title: string; why: string; ref: Ref; module: string; tab: string; age: string }
export function attention(s: OmState): Attention[] {
  const out: Attention[] = [];
  const now = nowStamp(s);
  enquiryRows(s).filter(r => r.dueSoon || r.overdue).sort((a, b) => a.dueIn - b.dueIn).slice(0, 3).forEach(r =>
    out.push({ id: "q-" + r.q.id, tone: r.overdue || r.dueIn <= 1 ? "bad" : "warn", title: r.account + " · " + r.dev + " quote " + (r.overdue ? "overdue" : "due " + dateShort(r.e.due)),
      why: r.q.status + " · " + gbp(r.q.value) + " indicative, not sent" + (r.q.checklist.find(c => c.key === "review" && !c.done) ? " · manager review needed" : ""),
      ref: { kind: "quote", id: r.q.id }, module: "Commercial", tab: "quotations", age: r.overdue ? Math.abs(r.dueIn) + "d late" : r.dueIn === 0 ? "today" : r.dueIn + "d" }));
  s.orders.forEach(o => {
    const b = blockingOpen(s, o.id);
    if (b.length) out.push({ id: "rfi-" + o.id, tone: "bad", title: orderLabel(s, o) + ": " + b.length + " blocking RFI" + (b.length > 1 ? "s" : ""),
      why: "Design handover waits on " + b.map(x => x.id).join(" and ") + ". Customer response due " + dateShort(b[0].due), ref: { kind: "order", id: o.id }, module: "Projects", tab: "rfis", age: dateShort(b[0].due) });
  });
  s.designs.filter(d => d.status === "Awaiting client approval").forEach(d => {
    const o = byId(s.orders, d.orderId)!;
    out.push({ id: "des-" + d.id, tone: "warn", title: "Design " + d.revision + " pending: " + orderLabel(s, o), why: d.id + " awaiting client approval by " + dateShort(d.target) + ". Production not released.",
      ref: { kind: "design", id: d.id }, module: "Plants & Planning", tab: "design", age: dateShort(d.target) });
  });
  s.loads.filter(l => l.status === "Arrival claimed").forEach(l => {
    const inv = byId(s.invoices, l.invoiceId);
    out.push({ id: "pod-" + l.id, tone: "bad", title: l.id + " claimed delivered, no verified POD", why: "Carrier claim " + stamp(l.claimed) + (inv ? ". " + inv.id + " " + gbp(inv.net) + " held" : ""),
      ref: { kind: "load", id: l.id }, module: "Logistics", tab: "pod", age: hoursSince(l.claimed!, now) + "h" });
  });
  s.loads.filter(l => l.status === "POD submitted" || l.status === "Exception").forEach(l =>
    out.push({ id: "podr-" + l.id, tone: "warn", title: l.id + (l.status === "Exception" ? " delivery exception" : " POD awaiting review"), why: l.exception || "Photo and signature submitted. A person must accept it.",
      ref: { kind: "load", id: l.id }, module: "Logistics", tab: "pod", age: l.pod.submitted ? dateShort(l.pod.submitted.split(" ")[0]) : "" }));
  s.invoices.filter(i => i.stage === "Ready for finance review" || i.stage === "Eligible").forEach(i =>
    out.push({ id: "inv-" + i.id, tone: "info", title: i.id + " " + gbp(i.net) + (i.stage === "Eligible" ? " eligible to release" : " ready for finance review"), why: "POD verified on " + (i.loadId || "") + ". Sage handoff still needs approval.",
      ref: { kind: "invoice", id: i.id }, module: "Finance", tab: "readiness", age: "" }));
  s.lots.filter(l => l.qa === "Inspection pending").forEach(l =>
    out.push({ id: "qa-" + l.id, tone: "warn", title: l.id + " QA sign-off before collection", why: l.note, ref: { kind: "lot", id: l.id }, module: "Plants & Planning", tab: "quality", age: "" }));
  return out;
}

/* ── approvals (Work) — derived from record state, never a separate list ─ */
export interface ApprovalItem { id: string; kind: string; title: string; ref: Ref; dept: string; value?: number; detail: string; action: string; secondary?: string; gate: string; blocked?: string }
export function approvals(s: OmState): ApprovalItem[] {
  const out: ApprovalItem[] = [];
  s.quotes.filter(q => q.status === "Estimating" && !q.checklist.find(c => c.key === "review")!.done && q.checklist.filter(c => c.key !== "review").every(c => c.done)).forEach(q => {
    const e = enquiryOf(s, q);
    out.push({ id: "ap-q-" + q.id, kind: "Pricing", title: "Manager review: " + (account(s, e.accountId)?.name) + " · " + dev(s, e.devId)?.name, ref: { kind: "quote", id: q.id }, dept: "Estimating", value: q.value,
      detail: "Indicative " + gbp(q.value) + ". Not sent. Due " + dateShort(e.due) + ".", action: "Mark review complete", gate: "Human pricing approval. AI never prices structural work." });
  });
  s.quotes.filter(q => q.status === "Estimating" && q.checklist.every(c => c.done)).forEach(q => {
    const e = enquiryOf(s, q);
    out.push({ id: "ap-qs-" + q.id, kind: "Pricing", title: "Release quotation: " + account(s, e.accountId)?.name + " · " + dev(s, e.devId)?.name, ref: { kind: "quote", id: q.id }, dept: "Commercial", value: q.value,
      detail: "Review complete. Sending is simulated: no email leaves the demo.", action: "Approve and send (simulated)", gate: "Commercial sign-off" });
  });
  s.orders.filter(o => !o.contractApproved).forEach(o => out.push({ id: "ap-c-" + o.id, kind: "Contract", title: "Contract Detail Summary: " + orderLabel(s, o), ref: { kind: "order", id: o.id }, dept: "Commercial", value: o.value,
    detail: "Prefilled from the quote. " + blockingOpen(s, o.id).length + " blocking RFIs still open.", action: "Approve summary", gate: "Commercial lead approval", blocked: blockingOpen(s, o.id).length ? "Answer blocking RFIs first" : undefined }));
  s.docs.filter(d => d.status === "Draft").forEach(d => { const o = byId(s.orders, d.orderId)!; out.push({ id: "ap-d-" + d.id, kind: "Document", title: d.type + ": " + orderLabel(s, o), ref: { kind: "order", id: o.id }, dept: "Commercial", detail: "Generated draft. Edit, then approve.", action: "Approve document", gate: "Document release" }); });
  s.lots.filter(l => l.qa === "Inspection pending" || l.qa === "On hold").forEach(l => out.push({ id: "ap-l-" + l.id, kind: "QA", title: "QA release " + l.id + " (" + l.plant + ")", ref: { kind: "lot", id: l.id }, dept: "Quality/Yard",
    detail: l.note, action: l.qa === "On hold" ? "Release after repair" : "Sign off inspection", gate: "Human inspection sign-off" }));
  s.loads.filter(l => l.status === "POD submitted" || l.status === "Exception").forEach(l => { const inv = byId(s.invoices, l.invoiceId); out.push({ id: "ap-p-" + l.id, kind: "POD", title: (l.status === "Exception" ? "Delivery dispute " : "POD review ") + l.id, ref: { kind: "load", id: l.id }, dept: "Transport", value: inv?.net,
    detail: l.exception || "Photo " + (l.pod.photo ? "attached" : "missing") + " · receiver " + (l.pod.receiver || "missing") + " · signature " + (l.pod.signature ? "captured" : "missing"), action: l.status === "Exception" ? "Accept with note" : "Accept POD", secondary: "Reject", gate: "Human review of delivery evidence" }); });
  s.loads.filter(l => l.status === "Arrival claimed").forEach(l => out.push({ id: "ap-pc-" + l.id, kind: "POD", title: "Claimed delivery, no proof: " + l.id, ref: { kind: "load", id: l.id }, dept: "Transport", value: byId(s.invoices, l.invoiceId)?.net,
    detail: "Carrier says delivered " + stamp(l.claimed) + ". Nothing to review yet.", action: "Request POD from carrier", gate: "Cannot be accepted without evidence", blocked: "No evidence submitted" }));
  s.invoices.filter(i => i.stage === "Eligible").forEach(i => out.push({ id: "ap-ie-" + i.id, kind: "Invoice", title: "Release to invoice queue: " + i.id, ref: { kind: "invoice", id: i.id }, dept: "Finance", value: i.net, detail: "POD verified. Hold can be lifted.", action: "Release to queue", gate: "Finance control" }));
  s.invoices.filter(i => i.stage === "Ready for finance review").forEach(i => out.push({ id: "ap-i-" + i.id, kind: "Invoice", title: "Finance review: " + i.id, ref: { kind: "invoice", id: i.id }, dept: "Finance", value: i.net, detail: i.description, action: "Approve for Sage handoff", gate: "Finance lead approval" }));
  return out;
}

export const money = { gbp, gbpShort };
export const fmtDue = (due: string) => { const n = daysBetween(TODAY, due); return n < 0 ? Math.abs(n) + "d overdue" : n === 0 ? "Due today" : n === 1 ? "Due tomorrow" : "Due in " + n + "d"; };
export const weekAfter = (n: number) => addDays(WEEK, 7 * n);
export type { Commitment };
