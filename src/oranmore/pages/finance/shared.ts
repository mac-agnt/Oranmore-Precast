/* Finance helpers shared by the Finance module and the Finance/Executive dashboards.
   Everything is derived from the one shared state. */
import type { OmState, Invoice } from "../../types";
import { byId, account, dev, financeTotals, TODAY } from "../../selectors";
import { SAGE_UNALLOCATED } from "../../fixtures";
import { addDays, daysBetween, dateShort } from "../../format";

export const PAYMENT_TERMS = 30; // illustrative: days after handoff for a new invoice

/** Placeholder Sage customer code. Not a real Sage identifier. */
export function sageCustomerId(name: string) {
  const letters = name.replace(/[^A-Za-z ]/g, "").split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 3).padEnd(3, "X");
  let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
  return letters + String(100 + (h % 900)).padStart(3, "0");
}

export function invoiceContext(s: OmState, i: Invoice) {
  const o = byId(s.orders, i.orderId)!;
  const acc = account(s, o.accountId)!;
  const d = dev(s, o.devId)!;
  const load = i.loadId ? byId(s.loads, i.loadId) : undefined;
  const lots = load ? s.lots.filter(l => load.lotIds.includes(l.id)) : [];
  return { o, acc, d, load, lots };
}

export interface Gate { label: string; ok: boolean; note: string }
export function invoiceGates(s: OmState, i: Invoice): Gate[] {
  const { o, load, lots } = invoiceContext(s, i);
  const podOk = !load || load.status === "POD verified";
  const qaOk = lots.every(l => l.qa === "Released");
  const reviewed = i.stage === "Review approved" || i.stage === "Handoff simulated";
  return [
    { label: "Verified POD", ok: podOk, note: !load ? "Stage invoice" : load.status === "POD verified" ? "Accepted " + (load.pod.verified ? dateShort(load.pod.verified.split(" ")[0]) : "") : load.status === "Arrival claimed" ? "Carrier claim only" : load.status },
    { label: "QA released", ok: qaOk, note: lots.length ? lots.map(l => l.id + " " + l.qa).join(", ") : "No lots linked" },
    { label: "Contract terms", ok: o.contractApproved, note: o.contractApproved ? "Summary approved" : "Contract summary not approved" },
    { label: "Finance review", ok: reviewed, note: reviewed ? "Approved for handoff" : "Not yet reviewed" },
  ];
}

export function orderBilling(s: OmState) {
  return s.orders.map(o => {
    const inv = s.invoices.filter(i => i.orderId === o.id);
    const sum = (f: (i: Invoice) => boolean) => inv.filter(f).reduce((t, i) => t + i.net, 0);
    const billed = sum(i => i.stage === "Issued" || i.stage === "Paid" || i.stage === "Handoff simulated");
    const ready = sum(i => i.stage === "Ready for finance review" || i.stage === "Review approved");
    const held = sum(i => i.stage === "Held");
    const eligible = sum(i => i.stage === "Eligible");
    const paid = sum(i => i.stage === "Paid");
    return { o, acc: account(s, o.accountId)!, d: dev(s, o.devId)!, billed, ready, held, eligible, paid, unbilled: Math.max(0, o.value - billed - ready - held - eligible) };
  });
}

/** Expected receipts by week, eight weeks from the snapshot. Overdue issued invoices land in week 1. */
export function weeklyReceipts(s: OmState, weeks = 8, delay = 0) {
  const starts = Array.from({ length: weeks }, (_, n) => addDays(TODAY, n * 7));
  const rows = starts.map(w => ({ week: w, issued: 0, queued: 0, atRisk: 0, items: [] as { inv: Invoice; kind: "issued" | "queued" | "atRisk"; date: string }[] }));
  const place = (date: string, inv: Invoice, kind: "issued" | "queued" | "atRisk") => {
    const n = Math.max(0, Math.floor(daysBetween(TODAY, date) / 7));
    if (n >= weeks) return;
    rows[n][kind] += inv.net; rows[n].items.push({ inv, kind, date });
  };
  s.invoices.forEach(i => {
    if (i.stage === "Issued" && i.due) place(addDays(i.due < TODAY ? TODAY : i.due, delay), i, "issued");
    else if (i.stage === "Ready for finance review" || i.stage === "Review approved" || i.stage === "Handoff simulated") place(addDays(TODAY, PAYMENT_TERMS + delay), i, "queued");
    else if (i.stage === "Held" || i.stage === "Eligible") place(addDays(TODAY, PAYMENT_TERMS + 7 + delay), i, "atRisk");
  });
  return rows;
}

export interface SageException { id: string; tone: "bad" | "warn" | "info"; title: string; note: string; invId: string }
export function sageExceptions(s: OmState): SageException[] {
  const f = financeTotals(s);
  const out: SageException[] = [];
  f.held.forEach(i => out.push({ id: "h-" + i.id, tone: "bad", title: i.id + " not sent to Sage", note: "Held: " + (i.hold || "reason not recorded"), invId: i.id }));
  f.eligible.forEach(i => out.push({ id: "e-" + i.id, tone: "warn", title: i.id + " eligible, not released", note: "POD verified. Finance must release it to the queue.", invId: i.id }));
  f.ready.filter(i => i.stage === "Review approved").forEach(i => out.push({ id: "r-" + i.id, tone: "info", title: i.id + " approved, handoff pending", note: "Simulated Sage handoff not yet run.", invId: i.id }));
  f.debt.filter(d => d.daysOver > 60).forEach(d => out.push({ id: "o-" + d.inv.id, tone: "bad", title: d.inv.id + " over 60 days", note: d.daysOver + " days past due in the illustrative Sage snapshot.", invId: d.inv.id }));
  s.invoices.filter(i => i.sageNet !== undefined && i.sageNet !== i.net).forEach(i => out.push({ id: "m-" + i.id, tone: "warn", title: i.id + " differs from Sage by " + gbpDiff(i.net - (i.sageNet || 0)), note: i.sageNote || "Sage amount does not match Pulse", invId: i.id }));
  SAGE_UNALLOCATED.forEach(r => { const inv = s.invoices.find(i => i.stage === "Issued" && byId(s.orders, i.orderId)?.accountId === r.accountId); if (inv) out.push({ id: "u-" + r.ref, tone: "warn", title: r.ref + " unallocated receipt " + gbpDiff(r.amount), note: (account(s, r.accountId)?.name || "") + ". " + r.note, invId: inv.id }); });
  // duplicate guard: two invoices against the same load
  const seen = new Map<string, string>();
  s.invoices.forEach(i => { if (!i.loadId) return; if (seen.has(i.loadId)) out.push({ id: "d-" + i.id, tone: "bad", title: "Possible duplicate " + i.id, note: "Same load as " + seen.get(i.loadId), invId: i.id }); else seen.set(i.loadId, i.id); });
  return out;
}
export function duplicateCount(s: OmState) {
  const loads = s.invoices.filter(i => i.loadId).map(i => i.loadId);
  return loads.length - new Set(loads).size;
}
const gbpDiff = (n: number) => "£" + Math.round(Math.abs(n)).toLocaleString("en-GB");

/** Sage-side view of each invoice: the amount Sage holds and whether it matches Pulse. */
export function sageMatch(i: Invoice): { label: string; tone: "ok" | "warn" | "draft"; sage: number | null } {
  if (i.loadId && !i.sageRef) return { label: "Not in Sage", tone: "draft", sage: null };
  if (i.stage === "Handoff simulated") return { label: "Mock handoff", tone: "draft", sage: i.net };
  const sage = i.sageNet ?? (i.stage === "Paid" ? 0 : i.net);
  if (i.sageNet !== undefined && i.sageNet !== i.net) return { label: "Differs " + gbpDiff(i.net - i.sageNet), tone: "warn", sage };
  return { label: "Matched", tone: "ok", sage };
}

/** Per-customer balances, Pulse view against the illustrative Sage ledger. */
export function customerBalances(s: OmState) {
  return s.accounts.map(a => {
    const inv = s.invoices.filter(i => byId(s.orders, i.orderId)?.accountId === a.id && (i.stage === "Issued" || i.stage === "Paid"));
    const open = inv.filter(i => i.stage === "Issued");
    const pulse = open.reduce((t, i) => t + i.net, 0);
    const sage = open.reduce((t, i) => t + (i.sageNet ?? i.net), 0);
    const unalloc = SAGE_UNALLOCATED.filter(r => r.accountId === a.id).reduce((t, r) => t + r.amount, 0);
    const paid = inv.filter(i => i.stage === "Paid" && i.issued && i.paid);
    const overdue = open.filter(i => i.due && i.due < TODAY);
    return { a, inv, open, pulse, sage, diff: pulse - sage, unalloc, paid, overdue, overdueValue: overdue.reduce((t, i) => t + i.net, 0),
      dtp: paid.length ? Math.round(paid.reduce((t, i) => t + daysBetween(i.issued!, i.paid!), 0) / paid.length) : null,
      oldest: overdue.length ? Math.max(...overdue.map(i => daysBetween(i.due!, TODAY))) : 0 };
  }).filter(x => x.inv.length || x.unalloc);
}

/* Illustrative billing phasing by order: months the remaining value is expected to invoice in. */
export const ORDER_PHASING: Record<string, string[]> = {
  "ORD-26-118": ["2027-01", "2027-02", "2027-03", "2027-04"], "ORD-26-121": ["2026-12", "2027-01", "2027-02"],
  "ORD-26-125": ["2026-11", "2026-12", "2027-01"], "ORD-26-130": ["2026-11", "2026-12"], "ORD-26-133": ["2026-11", "2026-12"],
  "ORD-26-112": ["2026-11"], "ORD-26-127": ["2026-11"],
};
export const FORECAST_MONTHS = ["2026-11", "2026-12", "2027-01", "2027-02", "2027-03", "2027-04"];
export function monthlyBilling(s: OmState) {
  const rows = orderBilling(s).map(r => {
    const months = ORDER_PHASING[r.o.id] || [FORECAST_MONTHS[0]];
    const queued = r.ready + r.eligible + r.held;
    const per = r.unbilled / months.length;
    const cells = FORECAST_MONTHS.map(m => (months.includes(m) ? per : 0) + (m === FORECAST_MONTHS[0] ? queued : 0));
    return { ...r, months, cells };
  }).filter(r => r.cells.some(v => v > 0));
  const totals = FORECAST_MONTHS.map((_, i) => rows.reduce((t, r) => t + r.cells[i], 0));
  return { rows, totals };
}

