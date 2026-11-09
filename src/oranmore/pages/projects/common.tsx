/* Shared helpers for the Projects module: one selected order across tabs. */
import type { Om, Tone } from "../../ui";
import { Badge } from "../../ui";
import type { Order, EventSource } from "../../types";
import { journey, orderLabel, account, dev, TODAY } from "../../selectors";
import { gbpShort, daysBetween, dateShort } from "../../format";
import type { Stage as JStage } from "../../selectors";

export const TABS = ["overview", "awards", "contract", "rfis", "journey", "portal"];
export const DEFAULT_ORDER = "ORD-26-118";

/** The selected order. om.go() writes the per-tab key; picking in any tab writes
    the shared key and clears per-tab keys, so one choice follows you across tabs. */
export function useOrder(om: Om): [Order, (id: string) => void] {
  const tabKey = om.ui["sel:Projects:" + om.sub];
  const shared = om.ui["Projects:order"];
  const find = (id?: string) => (id ? om.s.orders.find(o => o.id === id) : undefined);
  const o = find(tabKey) || find(shared) || find(DEFAULT_ORDER) || om.s.orders[0];
  const set = (id: string) => {
    om.setUi("Projects:order", id);
    TABS.forEach(t => { if (om.ui["sel:Projects:" + t] !== undefined) om.setUi("sel:Projects:" + t, undefined); });
  };
  return [o, set];
}

export const custName = (om: Om, o: Order) => account(om.s, o.accountId)?.name || "";
export const siteName = (om: Om, o: Order) => dev(om.s, o.devId)?.name || "";
export { orderLabel };

export function OrderSelect({ om, value, onChange, orders }: { om: Om; value: string; onChange: (id: string) => void; orders?: Order[] }) {
  const list = orders || om.s.orders;
  return (
    <select className="om-input" style={{ width: "auto", minWidth: 260, height: 32 }} value={value} onChange={e => onChange(e.target.value)} aria-label="Select project">
      {list.map(o => <option key={o.id} value={o.id}>{o.id} · {orderLabel(om.s, o)}</option>)}
    </select>
  );
}

export const SRC_TONE: Record<EventSource, Tone> = { iThesis: "info", Sage: "accent", Carrier: "warn", Customer: "ok", Agent: "accent", Staff: "neutral", Email: "draft", Excel: "draft" };
export const SourceBadge = ({ src }: { src: EventSource }) => <Badge tone={SRC_TONE[src]} dot={false}>{src === "iThesis" ? "iThesis (illus.)" : src === "Sage" ? "Sage (illus.)" : src}</Badge>;

export const stageTone = (st: JStage["state"]): Tone => (st === "done" ? "ok" : st === "blocked" ? "bad" : st === "waiting" ? "warn" : st === "active" ? "accent" : "neutral");
export const stageWord = (st: JStage["state"]) => (st === "done" ? "Done" : st === "blocked" ? "Blocked" : st === "waiting" ? "Waiting" : st === "active" ? "In progress" : "Not started");

/** Where each journey stage is owned, so a stage can jump straight to its module. */
export function stageTarget(x: JStage): [string, string, string | undefined, string] | null {
  const id = x.ref?.id;
  switch (x.key) {
    case "enquiry": return ["Commercial", "inquiries", id, "Open in Commercial"];
    case "quote": return ["Commercial", "quotations", id, "Open quotation"];
    case "contract": return ["Projects", "rfis", id, "Open RFIs & documents"];
    case "design": return ["Plants & Planning", "design", id, "Open design handoff"];
    case "capacity": return ["Plants & Planning", "capacity", undefined, "Open capacity"];
    case "production": return ["Plants & Planning", "production", id, "Open production"];
    case "quality": return ["Plants & Planning", "quality", id, "Open quality & yard"];
    case "dispatch": return ["Logistics", "loads", id, "Open loads"];
    case "pod": return ["Logistics", "pod", id, "Open exceptions & POD"];
    case "invoice": return ["Finance", "readiness", id, "Open invoice readiness"];
    default: return null;
  }
}

export function progressOf(om: Om, o: Order) {
  const st = journey(om.s, o.id);
  const done = st.filter(x => x.state === "done").length;
  return { st, done, total: st.length, blocked: st.filter(x => x.state === "blocked"), current: st.find(x => x.state !== "done") };
}

/** Dense numbers for one order: money, deliveries, lots and open questions. */
export function OrderNumbers({ om, o }: { om: Om; o: Order }) {
  const s = om.s;
  const inv = s.invoices.filter(i => i.orderId === o.id);
  const billed = inv.filter(i => ["Issued", "Paid", "Handoff simulated"].includes(i.stage)).reduce((t, i) => t + i.net, 0);
  const held = inv.filter(i => i.stage === "Held").reduce((t, i) => t + i.net, 0);
  const loads = s.loads.filter(l => l.orderId === o.id);
  const lots = s.lots.filter(l => l.orderId === o.id);
  const rf = s.rfis.filter(r => r.orderId === o.id);
  const cells: [string, string, string?, (() => void)?][] = [
    ["Contract", gbpShort(o.value), undefined, () => om.open({ kind: "order", id: o.id })],
    ["Billed", gbpShort(billed), o.value ? Math.round((billed / o.value) * 100) + "%" : "", () => om.go("Finance", "overview")],
    ["Held", held ? gbpShort(held) : "·", held ? "on proof" : "", () => om.go("Finance", "readiness")],
    ["Loads", loads.filter(l => l.status === "POD verified").length + " / " + loads.length, "verified", () => om.go("Logistics", "loads")],
    ["Lots cast", lots.filter(l => l.status === "Complete").length + " / " + lots.length, lots.reduce((t, l) => t + l.m2, 0).toLocaleString("en-GB") + " m²", () => om.go("Plants & Planning", "production")],
    ["RFIs open", String(rf.filter(r => r.status !== "Resolved").length), rf.length + " raised", () => om.setSub("rfis")],
    ["Since award", daysBetween(o.awarded, TODAY) + "d", dateShort(o.awarded)],
    ["Tonnes sent", loads.filter(l => l.claimed).reduce((t, l) => t + l.tonnes, 0).toFixed(0) + " t", loads.filter(l => l.claimed).length + " deliveries"],
  ];
  return (
    <div className="om-onum">
      {cells.map(([k, v, sub, go]) => (
        <button key={k} onClick={go} disabled={!go} style={go ? undefined : { cursor: "default" }}>
          <span className="k">{k}</span><span className="v">{v}</span>{sub && <span className="s">{sub}</span>}
        </button>
      ))}
    </div>
  );
}
