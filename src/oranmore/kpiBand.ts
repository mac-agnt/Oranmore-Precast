/* Dashboard KPI band: every value derived from the shared state. */
import type { OmState } from "./types";
import { kpis, financeTotals, capacityWeek, pipeline, podQueue, enquiryRows, OPEN_QUOTE } from "./selectors";
import { gbpShort, pct, num } from "./format";

export interface BandKpi { label: string; value: string; delta: string; dir: "up" | "down"; hint: string }

export function bandDefs(s: OmState): Record<string, BandKpi> {
  const k = kpis(s), f = financeTotals(s), c = capacityWeek(s), p = pipeline(s);
  const q = podQueue(s);
  const brandon = c.plants[0], lound = c.plants[1];
  const rows = enquiryRows(s);
  const sent = rows.filter(r => r.q.status === "Quote submitted" || r.q.status === "Negotiation").length;
  const won = s.quotes.filter(x => x.status === "Won").length, lost = s.quotes.filter(x => x.status === "Lost").length;
  return {
    openQuotes: { label: "Open quotations", value: String(k.openQuotes), delta: k.due3 + " due ≤3 days", dir: k.due3 ? "down" : "up", hint: k.overdue + " overdue" },
    pipeline: { label: "Pipeline (weighted)", value: gbpShort(p.deduped), delta: "−" + gbpShort(p.doubleCount), dir: "up", hint: "competing bids removed" },
    won: { label: "Won orders", value: String(k.wonOrders), delta: gbpShort(k.wonValue), dir: "up", hint: "contract value, net" },
    capacity: { label: "Hollowcore committed", value: pct(c.pct, 0), delta: num(c.firm) + " / " + num(c.cap) + " m²", dir: c.pct > 0.95 ? "down" : "up", hint: "w/c 09 Nov" },
    free: { label: "Free hollowcore", value: num(c.free) + " m²", delta: "Brandon " + num(brandon.free), dir: "up", hint: "Lound " + num(lound.free) },
    brandon: { label: "Brandon", value: pct(brandon.pct, 0), delta: num(brandon.firm) + " m²", dir: "up", hint: "of " + num(brandon.cap) + " m²" },
    lound: { label: "Lound", value: pct(lound.pct, 1), delta: num(lound.firm) + " m²", dir: "up", hint: "of " + num(lound.cap) + " m²" },
    proof: { label: "Loads awaiting proof", value: String(k.loadsAwaitingProof), delta: q[0] ? q[0].l.id : "none", dir: k.loadsAwaitingProof ? "down" : "up", hint: q[0] ? q[0].hours + "h oldest" : "" },
    loadsToday: { label: "Loads this week", value: String(s.loads.filter(l => l.collect >= "2026-11-09" && l.collect < "2026-11-16").length), delta: s.loads.filter(l => l.status === "Dispatched" || l.status === "Loaded").length + " moving", dir: "up", hint: "outsourced hauliers" },
    ready: { label: "Invoice-ready", value: gbpShort(f.readyValue), delta: f.ready.length + " drafts", dir: "up", hint: "POD verified, net" },
    held: { label: "Delivery holds", value: gbpShort(f.heldValue), delta: f.held.length + " invoices", dir: f.held.length ? "down" : "up", hint: "awaiting proof or query" },
    debt: { label: "Sage debtors (demo)", value: gbpShort(f.issuedValue), delta: f.buckets[3].items.length + " over 60d", dir: f.buckets[3].items.length ? "down" : "up", hint: "illustrative snapshot" },
    blockers: { label: "Blocked before production", value: String(k.blockedOrders.length), delta: k.rfiBlocking + " blocking RFIs", dir: k.blockedOrders.length ? "down" : "up", hint: "plus design approvals" },
    winRate: { label: "Decided quotes won", value: won + lost ? pct(won / (won + lost)) : "—", delta: won + " won", dir: "up", hint: lost + " lost · " + sent + " out" },
    openValue: { label: "Open quote value", value: gbpShort(rows.filter(r => OPEN_QUOTE.includes(r.q.status)).reduce((t, r) => t + r.q.value, 0)), delta: p.secured.n + " secured", dir: "up", hint: p.tendering.n + " tendering" },
  };
}

export const BAND_KEYS: Record<string, string[]> = {
  executive: ["openQuotes", "capacity", "proof", "ready", "held"],
  commercial: ["openQuotes", "pipeline", "openValue", "winRate", "won"],
  plant: ["capacity", "brandon", "lound", "free", "blockers"],
  logistics: ["loadsToday", "proof", "held", "ready"],
  finance: ["ready", "held", "debt", "won"],
};
export const BAND_TITLE: Record<string, string> = {
  executive: "Oranmore Precast · Executive", commercial: "Oranmore Precast · Commercial", plant: "Oranmore Precast · Brandon & Lound",
  logistics: "Oranmore Precast · Logistics", finance: "Oranmore Precast · Finance",
};
