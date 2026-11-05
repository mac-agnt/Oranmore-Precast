/* Home AI chat: deterministic, local answers built from the live shared state.
   Every figure quoted is the same value the tables show. No model is called. */
import type { OmState, Ref } from "./types";
import { enquiryRows, PRE_SUBMIT, orderLabel, blockingOpen, designFor, podQueue, financeTotals, capacityWeek, byId, account, dev, fmtDue, kpis } from "./selectors";
import { gbp, dateShort, stamp, num, pct } from "./format";

export interface ChatAnswer {
  tool: string; effect: "read" | "write"; text: string; cols?: string[]; rows?: string[][];
  actions?: [string, number][]; refs?: { label: string; ref: Ref }[]; goto?: [string, string, string?];
}

export const PRESETS = [
  "Which quotes need attention this week?",
  "Show projects blocked before production",
  "Which claimed deliveries lack POD?",
  "What can finance invoice now?",
];

export function answer(s: OmState, q: string): ChatAnswer {
  const t = q.toLowerCase();
  if (/(pod|proof|claimed|deliver|haul|carrier|load)/.test(t)) return pods(s);
  if (/(invoice|finance|bill|sage|cash|held)/.test(t)) return invoices(s);
  if (/(block|before production|stuck|rfi|design|riverside|mace|goldbeck)/.test(t)) return blocked(s);
  if (/(capacity|plant|brandon|lound|m2|m²|overload)/.test(t)) return capacity(s);
  if (/(quote|estimat|tender|enquir|inquir|bam|meridian|pipeline|attention)/.test(t)) return quotes(s);
  if (/(brief|today|summary|morning)/.test(t)) return brief(s);
  return { tool: "pulse_search", effect: "read", text: "I answer from the records Pulse holds: enquiries, quotes, orders, RFIs, iThesis snapshots, loads, PODs and Sage drafts. I can't price structural work or approve anything on your behalf. Try one of these:",
    actions: PRESETS.map((p, i) => [p, i === 0 ? 1 : 0] as [string, number]) };
}

function quotes(s: OmState): ChatAnswer {
  const rows = enquiryRows(s).filter(r => PRE_SUBMIT.includes(r.q.status) && r.dueIn <= 7).sort((a, b) => a.dueIn - b.dueIn);
  const top = rows.find(r => r.e.id === "INQ-26-104") || rows[0];
  const over = rows.filter(r => r.overdue);
  const lead = top ? top.account + "'s " + top.dev + " is the one to watch: " + gbp(top.q.value) + " indicative estimate, not sent, " + fmtDue(top.e.due).toLowerCase() + " (" + dateShort(top.e.due) + "). It is " + top.q.status.toLowerCase()
    + (top.q.checklist.find(c => c.key === "review" && !c.done) ? " and still needs manager review." : " and ready to send once approved.") : "No quotes are due this week.";
  return {
    tool: "commercial_quotes_due", effect: "read",
    text: rows.length + " quote" + (rows.length === 1 ? "" : "s") + " need attention in the next seven days" + (over.length ? ", " + over.length + " already overdue" : "") + ". " + lead + " Pricing stays with the estimators; I only track deadlines and review gates.",
    cols: ["Quote", "Customer · site", "Due", "Status"],
    rows: rows.map(r => [r.q.id, r.account + " · " + r.dev, fmtDue(r.e.due), r.q.status + (r.q.checklist.find(c => c.key === "review" && !c.done) ? " · review" : "")]),
    refs: rows.map(r => ({ label: r.q.id, ref: { kind: "quote", id: r.q.id } })),
    actions: [["Open Quotations", 1], ["Show projects blocked before production", 0]], goto: ["Commercial", "quotations", top?.q.id],
  };
}

function blocked(s: OmState): ChatAnswer {
  const out: string[][] = []; const refs: ChatAnswer["refs"] = [];
  s.orders.forEach(o => {
    const b = blockingOpen(s, o.id); const d = designFor(s, o.id);
    if (b.length) { out.push([o.id, orderLabel(s, o), b.length + " blocking RFI" + (b.length > 1 ? "s" : ""), "Customer reply due " + dateShort(b[0].due)]); refs!.push({ label: o.id, ref: { kind: "order", id: o.id } }); b.forEach(x => refs!.push({ label: x.id, ref: { kind: "rfi", id: x.id } })); }
    else if (d && d.status === "Awaiting client approval") { out.push([o.id, orderLabel(s, o), d.id + " " + d.revision + " awaiting approval", "Target " + dateShort(d.target)]); refs!.push({ label: d.id, ref: { kind: "design", id: d.id } }); }
  });
  const mace = s.orders.find(o => o.id === "ORD-26-118");
  const mb = mace ? blockingOpen(s, mace.id) : [];
  return {
    tool: "projects_blockers", effect: "read",
    text: out.length + " awarded project" + (out.length === 1 ? " is" : "s are") + " held before production. "
      + (mb.length ? "Mace Riverside Tower (" + gbp(mace!.value) + ") can't go to design until " + mb.map(x => x.id).join(" and ") + " are answered, both due " + dateShort(mb[0].due) + ". " : mace ? "Mace Riverside Tower has no blocking RFIs left and is ready for design handover. " : "")
      + "Goldbeck's design revision sits with the client; production is not released until it is signed off. iThesis stays the design and production record.",
    cols: ["Order", "Project", "Blocker", "When"], rows: out, refs, actions: [["Open Project Journey", 1], ["Which claimed deliveries lack POD?", 0]], goto: ["Projects", "journey", out[0]?.[0]],
  };
}

function pods(s: OmState): ChatAnswer {
  const q = podQueue(s);
  const claim = q.filter(x => x.l.status === "Arrival claimed");
  const first = claim[0] || q[0];
  return {
    tool: "logistics_pod_gap", effect: "read",
    text: q.length ? q.length + " load" + (q.length === 1 ? "" : "s") + " have a delivery claim without accepted proof. "
      + (first ? first.l.id + " for " + orderLabel(s, byId(s.orders, first.l.orderId)!) + " was marked delivered " + stamp(first.l.claimed) + " with " + (first.l.pod.photo ? "a photo" : "no photo") + " and " + (first.l.pod.signature ? "a signature" : "no receiver signature") + (first.invoice ? ", so " + first.invoice.id + " " + gbp(first.invoice.net) + " stays held" : "") + ". " : "")
      + "A carrier claim is not proof: a person has to accept the evidence before finance can invoice." : "Every delivered load has accepted proof. Nothing is held for POD.",
    cols: ["Load", "Project", "Status", "Since claim"],
    rows: q.map(x => [x.l.id, orderLabel(s, byId(s.orders, x.l.orderId)!), x.l.status, x.hours ? x.hours + " h" : "—"]),
    refs: q.map(x => ({ label: x.l.id, ref: { kind: "load", id: x.l.id } })),
    actions: [["Open Exceptions & POD", 1], ["What can finance invoice now?", 0]], goto: ["Logistics", "pod", first?.l.id],
  };
}

function invoices(s: OmState): ChatAnswer {
  const f = financeTotals(s);
  const ready = f.ready, held = f.held, elig = f.eligible;
  return {
    tool: "finance_readiness", effect: "read",
    text: "Finance can review " + gbp(f.readyValue) + " net now" + (ready.length ? ": " + ready.map(i => i.id + " " + gbp(i.net) + " (" + i.stage.toLowerCase() + ")").join(", ") : "") + ". "
      + (elig.length ? gbp(f.eligibleValue) + " has verified POD and can be released from hold. " : "")
      + (held.length ? gbp(f.heldValue) + " is held: " + held.map(i => i.id + " " + gbp(i.net) + " (" + (i.hold || "").toLowerCase() + ")").join("; ") + ". " : "")
      + "Sage handoff is a simulated step and needs finance approval first. Figures are net of VAT.",
    cols: ["Invoice", "Project", "Net", "Stage"],
    rows: ready.concat(elig, held).map(i => [i.id, orderLabel(s, byId(s.orders, i.orderId)!), gbp(i.net), i.stage + (i.hold ? " · " + i.hold : "")]),
    refs: ready.concat(elig, held).map(i => ({ label: i.id, ref: { kind: "invoice", id: i.id } })),
    actions: [["Open Invoice Readiness", 1], ["Which claimed deliveries lack POD?", 0]], goto: ["Finance", "readiness", ready[0]?.id],
  };
}

function capacity(s: OmState): ChatAnswer {
  const c = capacityWeek(s);
  return {
    tool: "plant_capacity", effect: "read",
    text: "Week commencing 09 Nov: " + num(c.firm) + " of " + num(c.cap) + " m² hollowcore committed (" + pct(c.pct) + "), " + num(c.free) + " m² free. "
      + c.plants.map(p => p.plant + " " + num(p.firm) + " / " + num(p.cap) + " m² (" + pct(p.pct, 1) + ")").join(", ") + ". Kier's Westbridge 2,400 m² is already inside Lound's figure. Tentative demand (" + num(c.tentative) + " m² this week) is not counted. The split is illustrative; iThesis holds the real schedule.",
    cols: ["Plant", "Committed", "Capacity", "Free"],
    rows: c.plants.map(p => [p.plant, num(p.firm) + " m²", num(p.cap) + " m²", num(p.free) + " m²"]),
    actions: [["Open Capacity", 1], ["Show projects blocked before production", 0]], goto: ["Plants & Planning", "capacity"],
  };
}

function brief(s: OmState): ChatAnswer {
  const k = kpis(s); const f = financeTotals(s);
  const bam = s.enquiries.find(e => e.id === "INQ-26-104")!; const bq = byId(s.quotes, bam.quoteId)!;
  const l = s.loads.find(x => x.id === "LOAD-4481")!; const inv = byId(s.invoices, l.invoiceId)!;
  return {
    tool: "briefing", effect: "read",
    text: "This morning: " + account(s, bam.accountId)?.name + " " + dev(s, bam.devId)?.name + " estimate (" + gbp(bq.value) + " indicative) is due " + dateShort(bam.due) + ". "
      + l.id + " is " + (l.status === "POD verified" ? "verified" : l.status.toLowerCase()) + ", " + inv.id + " " + gbp(inv.net) + " is " + inv.stage.toLowerCase() + ". "
      + k.rfiBlocking + " blocking RFI" + (k.rfiBlocking === 1 ? "" : "s") + " open. " + gbp(f.readyValue) + " ready for finance review.",
    actions: PRESETS.map((p, i) => [p, i === 0 ? 1 : 0] as [string, number]),
  };
}
