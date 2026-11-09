/* Logistics: outsourced haulage, from the transport plan to verified proof of
   delivery. A carrier's "delivered" is a claim; only a person accepts proof. */
import { useRef, useState, type PointerEvent } from "react";
import "../../styles/om-ops.css";
import type { Om } from "../ui";
import { Page, Head, Grid, Card, Badge, Btn, Seg, Kpi, Bar, Table, Facts, RefLink, LineageChip, Field, Empty, useUi, Dot } from "../ui";
import type { Load, LoadStatus, Carrier } from "../types";
import { orderLabel, byId, dev, podQueue, carrierOf, loadAwaitingProof, nowStamp, carrierStats } from "../selectors";
import { CARRIER_STEPS } from "../actions";
import { gbp, num, dateShort, dayShort, stamp, hoursSince, pct } from "../format";

const DAYS = ["2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13"];
const STATUSES: LoadStatus[] = ["Planned", "Loaded", "Dispatched", "Arrival claimed", "POD submitted", "POD verified", "Exception"];
const EXAMPLE_PHOTOS = ["unload_bay_a.jpg", "planks_stacked.jpg", "crane_lift.jpg", "delivery_note.jpg", "site_gate.jpg", "slab_level2.jpg"];

function Banner({ tone, children }: { tone?: "warn" | "bad" | "ok"; children: React.ReactNode }) {
  return <div className={"om-banner" + (tone ? " " + tone : "")}>{children}</div>;
}
const site = (om: Om, l: Load) => { const o = byId(om.s.orders, l.orderId); return o ? dev(om.s, o.devId) : undefined; };
const project = (om: Om, l: Load) => { const o = byId(om.s.orders, l.orderId); return o ? orderLabel(om.s, o) : l.orderId; };
const carrierShort = (om: Om, l: Load) => (carrierOf(om.s, l)?.name || "").replace(" (illustrative)", "");

function Evidence({ l }: { l: Load }) {
  return (
    <div className="om-ev">
      <div className={l.pod.photo ? "ok" : "bad"}><div className="k">Unloading photo</div><div className="v">{l.pod.photo ? l.pod.photoName || "Attached" : "Missing"}</div></div>
      <div className={l.pod.receiver ? "ok" : "bad"}><div className="k">Receiver</div><div className="v">{l.pod.receiver || "Missing"}</div></div>
      <div className={l.pod.signature ? "ok" : "bad"}><div className="k">Signature</div><div className="v">{l.pod.signature ? "Captured" : "Missing"}</div></div>
    </div>
  );
}
function InvoiceLine({ om, l }: { om: Om; l: Load }) {
  const inv = byId(om.s.invoices, l.invoiceId);
  if (!inv) return <span className="om-faint om-small">No invoice draft linked</span>;
  return <span className="om-row om-small" style={{ gap: 8, flexWrap: "wrap" }}><RefLink om={om} r={{ kind: "invoice", id: inv.id }} /><span className="om-mono">{gbp(inv.net)}</span><Badge>{inv.stage}</Badge>{inv.hold && <span className="om-faint">{inv.hold}</span>}</span>;
}

/* ── 1. Transport planner ──────────────────────────────────────────────── */
function readiness(om: Om, l: Load): { tone: "ok" | "warn" | "bad" | "info"; text: string } {
  if (!["Planned", "Loaded"].includes(l.status)) return { tone: l.status === "Arrival claimed" || l.status === "Exception" ? "bad" : "info", text: l.status };
  const lots = om.s.lots.filter(x => l.lotIds.includes(x.id));
  if (lots.some(x => x.status !== "Complete")) return { tone: "warn", text: "Lot still casting" };
  if (lots.some(x => x.qa !== "Released")) return { tone: "bad", text: "QA sign-off needed" };
  if (/TBC/.test(l.driver)) return { tone: "warn", text: "Driver TBC" };
  return { tone: "ok", text: "Ready to collect" };
}
const timeOf = (s: string) => s.split(" ")[1] || "";
function Planner({ om }: { om: Om }) {
  const s = om.s;
  const [plant, setPlant] = useUi<string>(om, "log:plant", "All");
  const [carrier, setCarrier] = useUi<string>(om, "log:carrier", "All");
  const [view, setView] = useUi<"board" | "list">(om, "log:view", "board");
  const match = (l: Load) => (plant === "All" || l.plant === plant) && (carrier === "All" || l.carrierId === carrier);
  const loads = s.loads.filter(match);
  const open = loads.filter(l => l.collect.slice(0, 10) < DAYS[0] && l.status !== "POD verified");
  const week = loads.filter(l => DAYS.includes(l.collect.slice(0, 10))).sort((a, b) => a.collect.localeCompare(b.collect));
  const past = s.loads.filter(l => l.collect.slice(0, 10) < DAYS[0]);
  const lw = carrierStats({ ...s, loads: past });
  const lotM2 = (l: Load) => s.lots.filter(x => l.lotIds.includes(x.id)).reduce((t, x) => t + x.m2, 0);
  const card = (l: Load) => {
    const d = site(om, l);
    const lots = s.lots.filter(x => l.lotIds.includes(x.id));
    const r = readiness(om, l);
    const deliverDay = l.deliver.split(" ")[0];
    return (
      <button key={l.id} className={"om-lcard" + (l.status === "Arrival claimed" || l.status === "Exception" ? " alert" : "")} onClick={() => om.open({ kind: "load", id: l.id })}>
        <div className="om-row" style={{ gap: 6 }}><span className="om-mono om-small om-ink" style={{ fontWeight: 600 }}>{timeOf(l.collect)}</span><span className="id">{l.id}</span><span style={{ marginLeft: "auto" }}><Badge>{l.status}</Badge></span></div>
        <div className="t">{l.plant} → {d?.name}</div>
        <div className="m">{d?.town} · deliver {deliverDay !== l.collect.slice(0, 10) ? dayShort(deliverDay) + " " : ""}{l.deliver.split(" ").slice(1).join(" ")}</div>
        <div className="om-lines">
          {lots.length ? lots.map(x => <div key={x.id} className="om-line"><span className="om-mono">{x.id}</span><span>{x.product}</span><span className="om-mono" style={{ marginLeft: "auto" }}>{x.units} u{x.m2 ? " · " + num(x.m2) + " m²" : ""}</span></div>) : <div className="om-line om-faint">No lot linked</div>}
        </div>
        <div className="m">{carrierShort(om, l)} · {l.trailer}</div>
        <div className="m" style={{ color: /TBC/.test(l.driver) ? "var(--warn)" : undefined }}>{/TBC/.test(l.driver) ? "Driver not booked" : l.driver.replace(" (mock)", "")} · {l.siteContact.replace(" (demo contact)", "")}</div>
        <div className="om-row" style={{ gap: 6, marginTop: 4 }}><Badge tone={r.tone}>{r.text}</Badge><span className="om-mono om-tiny om-faint" style={{ marginLeft: "auto" }}>{num(l.tonnes)} t · {l.pieces} pcs</span></div>
      </button>
    );
  };
  const totals = (xs: Load[]) => ({ n: xs.length, t: xs.reduce((a, l) => a + l.tonnes, 0), m: xs.reduce((a, l) => a + lotM2(l), 0), tbc: xs.filter(l => l.status === "Planned" && /TBC/.test(l.driver)).length, risk: xs.filter(l => ["warn", "bad"].includes(readiness(om, l).tone)).length });
  const wk = totals(week);
  return (
    <>
      <div className="om-row" style={{ flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
        <Seg options={["All", "Brandon", "Lound"]} value={plant} onChange={setPlant} />
        <select className="om-input" style={{ width: 260 }} value={carrier} onChange={e => setCarrier(e.target.value)} aria-label="Carrier">
          <option value="All">All carriers</option>
          {s.carriers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <Seg options={[["board", "By day"], ["list", "List"]]} value={view} onChange={setView} />
        <span style={{ marginLeft: "auto" }}><LineageChip l={{ source: "Transport planner (mock)", updated: "2026-11-05 16:20", state: "Imported from transport planner (mock Excel). 1 conflict reviewed" }} /></span>
      </div>
      <div className="om-kpis" style={{ marginBottom: 12 }}>
        <Kpi label="Tonnes to collect" value={num(wk.t)} sub={num(wk.m) + " m² hollowcore · " + week.filter(l => /HIAB/.test(l.trailer)).length + " HIAB loads"} />
        <Kpi label="Drivers not booked" value={wk.tbc} tone={wk.tbc ? "warn" : "ok"} sub="carrier to confirm" />
        <Kpi label="Not ready to collect" value={wk.risk} tone={wk.risk ? "warn" : "ok"} sub="casting, QA or driver" />
        <Kpi label="Busiest day" value={(() => { const m = DAYS.map(d => ({ d, n: week.filter(l => l.collect.startsWith(d)).length })).sort((a, b) => b.n - a.n)[0]; return m ? dayShort(m.d) : "·"; })()} sub="most collections" />
      </div>
      <Grid style={{ marginBottom: 14 }}>
        <Card span={7} title="Still open from last week" sub="Collected before 09 Nov, proof not yet verified · these hold invoices">
          {open.length ? <div className="om-board" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))" }}>{open.map(card)}</div> : <Empty title="Nothing open from last week" hint="Every earlier load has verified proof." />}
          {open.length > 0 && (
            <table className="om-tbl" style={{ marginTop: 14 }}>
              <thead><tr><th>Load</th><th>Waiting on</th><th className="r">Since claim</th><th className="r">Invoice held</th><th /></tr></thead>
              <tbody>{open.map(l => { const inv = byId(s.invoices, l.invoiceId); return (
                <tr key={l.id}>
                  <td className="mono ink">{l.id}</td>
                  <td className="om-muted om-small">{l.status === "Arrival claimed" ? "Photo, receiver and signature" : l.exception || "Office review"}</td>
                  <td className="r mono" style={{ color: "var(--bad)" }}>{l.claimed ? hoursSince(l.claimed, nowStamp(s)) + " h" : "·"}</td>
                  <td className="r mono">{inv ? gbp(inv.net) : "·"}</td>
                  <td className="r"><Btn sm kind="primary" onClick={() => { om.setUi("sel:Logistics:pod", l.id); om.setSub("pod"); }}>{l.status === "Arrival claimed" ? "Request POD" : "Review"}</Btn></td>
                </tr>); })}</tbody>
            </table>
          )}
        </Card>
        <Card span={5} title="Last week in numbers" sub={"Collections 02 to 06 Nov plus late October · " + lw.delivered + " delivered"} flush>
          <div className="om-kpis" style={{ padding: "4px 18px 12px", gridTemplateColumns: "repeat(3,minmax(0,1fr))" }}>
            <Kpi label="In window" value={pct(lw.onTimePct)} sub={lw.onTime + " of " + lw.delivered} tone={lw.onTimePct < 0.85 ? "warn" : "ok"} onClick={() => om.setSub("carriers")} />
            <Kpi label="POD turnaround" value={lw.podHours + " h"} sub="claim to accepted" onClick={() => om.setSub("pod")} />
            <Kpi label="Tonnes moved" value={num(lw.tonnes)} sub={"across " + new Set(past.map(l => l.carrierId)).size + " hauliers"} />
          </div>
          <table className="om-tbl">
            <thead><tr><th>Haulier</th><th className="r">Loads</th><th className="r">In window</th><th className="r">POD h</th></tr></thead>
            <tbody>{s.carriers.map(c => { const cs = carrierStats({ ...s, loads: past }, c.id); return cs.delivered ? (
              <tr key={c.id} className="click" onClick={() => { om.setUi("sel:Logistics:carriers", c.id); om.setSub("carriers"); }}>
                <td className="ink">{c.name.replace(" (illustrative)", "")}</td><td className="r mono">{cs.delivered}</td>
                <td className="r mono" style={{ color: cs.onTimePct < 1 ? "var(--warn)" : undefined }}>{cs.onTime}/{cs.delivered}</td><td className="r mono">{cs.podHours}</td>
              </tr>) : null; })}</tbody>
          </table>
        </Card>
      </Grid>
      {view === "board" ? (
        <div className="om-board">
          {DAYS.map(d => {
            const items = week.filter(l => l.collect.startsWith(d));
            const tt = totals(items);
            return (
              <div key={d} className="om-board-col">
                <div className="om-board-h" style={{ flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
                  <b>{dayShort(d)}</b>
                  <span className="om-faint om-tiny">{tt.n} load{tt.n === 1 ? "" : "s"} · {num(tt.t)} t{tt.m ? " · " + num(tt.m) + " m²" : ""}</span>
                  {(tt.tbc > 0 || tt.risk > 0) && <span className="om-tiny" style={{ color: "var(--warn)" }}>{tt.risk} not ready{tt.tbc ? " · " + tt.tbc + " no driver" : ""}</span>}
                </div>
                {items.length ? items.map(card) : <div className="om-faint om-small" style={{ padding: "10px 4px" }}>No collections</div>}
              </div>
            );
          })}
        </div>
      ) : (
        <Card flush title="This week, every load" sub={week.length + " collections · click a row to open the load"}>
          <Table<Load> rowKey={l => l.id} rows={week} onRow={l => om.open({ kind: "load", id: l.id })} cols={[
            { k: "d", label: "Collect", render: l => <span className="om-mono">{dayShort(l.collect.slice(0, 10))} {timeOf(l.collect)}</span> },
            { k: "id", label: "Load", render: l => <span className="mono ink">{l.id}</span> },
            { k: "r", label: "Route", render: l => <>{l.plant} → {site(om, l)?.name}<div className="om-faint om-tiny">{site(om, l)?.town}</div></> },
            { k: "x", label: "Contents", render: l => s.lots.filter(x => l.lotIds.includes(x.id)).map(x => x.product + " " + x.units + "u").join(", ") || "·" },
            { k: "c", label: "Carrier / driver", render: l => <>{carrierShort(om, l)}<div className="om-tiny" style={{ color: /TBC/.test(l.driver) ? "var(--warn)" : "var(--faint)" }}>{/TBC/.test(l.driver) ? "Driver not booked" : l.driver.replace(" (mock)", "")}</div></> },
            { k: "w", label: "Deliver", render: l => <span className="om-mono om-small">{l.deliver.split(" ").slice(1).join(" ")}</span> },
            { k: "t", label: "Tonnes", align: "right", cls: "mono", render: l => num(l.tonnes) },
            { k: "s", label: "Readiness", render: l => { const r = readiness(om, l); return <Badge tone={r.tone}>{r.text}</Badge>; } },
          ]} />
        </Card>
      )}
    </>
  );
}

/* ── 2. Loads & deliveries ─────────────────────────────────────────────── */
function Loads({ om }: { om: Om }) {
  const s = om.s;
  const [filter, setFilter] = useUi<string>(om, "log:loadFilter", "All");
  const rows = s.loads.filter(l => filter === "All" || l.status === filter).slice().sort((a, b) => b.collect.localeCompare(a.collect));
  const [sel, setSel] = useUi<string>(om, "sel:Logistics:loads", rows[0]?.id || "");
  const l = byId(s.loads, sel) || rows[0];
  const opts: [string, string, number][] = [["All", "All", s.loads.length] as [string, string, number]].concat(STATUSES.map(st => [st, st, s.loads.filter(x => x.status === st).length] as [string, string, number]));
  return (
    <>
      <div style={{ marginBottom: 12 }}><Seg options={opts} value={filter} onChange={setFilter} /></div>
      <Grid>
        <Card span={l ? 7 : 12} flush title="Loads" sub={rows.length + " shown"}>
          <Table<Load> rowKey={x => x.id} rows={rows} selKey={l?.id} onRow={x => setSel(x.id)} cols={[
            { k: "id", label: "Load", render: x => <span className="mono ink">{x.id}</span> },
            { k: "p", label: "Project", render: x => project(om, x) },
            { k: "f", label: "From", render: x => x.plant },
            { k: "c", label: "Carrier", render: x => carrierShort(om, x) },
            { k: "col", label: "Collect", render: x => stamp(x.collect), cls: "mono" },
            { k: "s", label: "Status", render: x => <Badge>{x.status}</Badge> },
          ]} />
        </Card>
        {l && (
          <Card span={5} className="om-sticky" title={l.id} sub={project(om, l)} right={<Badge>{l.status}</Badge>}>
            <Facts items={[["From", l.plant], ["To", (site(om, l)?.name || "") + ", " + (site(om, l)?.town || "")], ["Lots", l.lotIds.length ? l.lotIds.map(id => <RefLink key={id} om={om} r={{ kind: "lot", id }} />) : "n/a"], ["Haulier", carrierShort(om, l)], ["Driver (mock)", l.driver], ["Trailer", l.trailer], ["Collection", stamp(l.collect)], ["Delivery window", l.deliver], ["Carrier claim", l.claimed ? stamp(l.claimed) : "—"], ["POD verified", l.pod.verified ? stamp(l.pod.verified) + " · " + l.pod.verifiedBy : "—"]]} />
            <div className="om-eyebrow" style={{ margin: "14px 0 8px" }}>Evidence</div>
            <Evidence l={l} />
            {l.exception && <div className="om-small" style={{ color: "var(--bad)", marginTop: 8 }}>{l.exception}</div>}
            {l.notes && <p className="om-small om-muted">{l.notes}</p>}
            <div className="om-label" style={{ margin: "14px 0 8px" }}>Journey of this load</div>
            <div className="om-track" style={{ gridTemplateColumns: "repeat(7,1fr)" }}>
              {CARRIER_STEPS.map((c, i) => { const st = l.status === "POD verified" ? 7 : l.status === "POD submitted" ? 6 : l.carrierStep; return <div key={c} className={i < st ? "done" : i === st ? "on" : ""}><i /><span>{c}</span></div>; })}
            </div>
            {s.events.filter(e => e.ref.kind === "load" && e.ref.id === l.id).slice(0, 4).map(e => <div key={e.id} className="om-small" style={{ padding: "5px 0", borderTop: "1px solid var(--border)", marginTop: 6 }}><span className="om-mono om-faint">{stamp(e.at)}</span> · {e.title} <span className="om-faint">· {e.actor}</span></div>)}
            <div className="om-eyebrow" style={{ margin: "14px 0 8px" }}>Impacted invoice</div>
            <InvoiceLine om={om} l={l} />
            <div className="om-divider" />
            <div className="om-row" style={{ flexWrap: "wrap" }}>
              <Btn sm onClick={() => om.open({ kind: "load", id: l.id })}>Open record</Btn>
              {loadAwaitingProof(l) && <Btn sm kind="primary" onClick={() => { om.setUi("sel:Logistics:pod", l.id); om.setSub("pod"); }}>Review in Exceptions & POD</Btn>}
              {l.status !== "POD verified" && <Btn sm onClick={() => { om.setUi("sel:Logistics:carrier-app", l.id); om.setSub("carrier-app"); }}>Open in carrier app</Btn>}
            </div>
          </Card>
        )}
      </Grid>
    </>
  );
}

/* ── 3. Carriers ───────────────────────────────────────────────────────── */
function Carriers({ om }: { om: Om }) {
  const s = om.s;
  const [sel, setSel] = useUi<string>(om, "sel:Logistics:carriers", s.carriers[0]?.id || "");
  const c = byId(s.carriers, sel) || s.carriers[0];
  const loads = c ? s.loads.filter(l => l.carrierId === c.id).sort((a, b) => b.collect.localeCompare(a.collect)) : [];
  const all = carrierStats(s);
  const cs = c ? carrierStats(s, c.id) : all;
  return (
    <Grid>
      <div className="om-s-12"><Banner>Illustrative transport partners. Performance below is computed from the loads in this demo: claimed arrival against the booked delivery window, and claim to accepted POD.</Banner></div>
      <div className="om-s-12 om-kpis">
        <Kpi label="Hauliers on the panel" value={s.carriers.length} sub={s.carriers.reduce((t, x) => t + x.equipment.length, 0) + " vehicle types"} />
        <Kpi label="Delivered in window" value={pct(all.onTimePct)} sub={all.onTime + " of " + all.delivered + " deliveries"} tone={all.onTimePct < 0.85 ? "warn" : "ok"} />
        <Kpi label="Avg POD turnaround" value={all.podHours + " h"} sub="claim to accepted by a person" />
        <Kpi label="Drivers not booked" value={all.tbc} sub="planned loads, driver TBC" tone={all.tbc ? "warn" : "ok"} onClick={() => om.setSub("planner")} />
        <Kpi label="Claims without proof" value={all.noProof} sub={all.exceptions + " exception open"} tone={all.noProof ? "bad" : "ok"} onClick={() => om.setSub("pod")} />
      </div>
      <Card span={7} title="Carrier scorecard" sub="Delivered in the booked window, from the loads in this demo · click a haulier">
        <div className="vz-tiles" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))" }}>
          {s.carriers.map(x => {
            const k = carrierStats(s, x.id);
            const issues = x.issues.length + k.tbc;
            return (
              <button key={x.id} className={"vz-tile" + (x.id === c?.id ? " sel" : "")} onClick={() => setSel(x.id)}>
                <div className="t"><b>{x.name.replace(" (illustrative)", "")}</b>{issues ? <Badge tone="warn" dot={false}>{issues} issue{issues > 1 ? "s" : ""}</Badge> : <Badge tone="ok" dot={false}>Clear</Badge>}</div>
                <div className="om-row" style={{ alignItems: "baseline", gap: 8 }}><span className="n" style={{ color: k.delivered && k.onTimePct < 0.85 ? "var(--warn)" : undefined }}>{k.delivered ? pct(k.onTimePct) : "·"}</span><span className="om-faint om-tiny">in window · {k.onTime}/{k.delivered}</span></div>
                <Bar value={k.onTimePct} max={1} color={k.onTimePct < 0.85 ? "var(--warn)" : "var(--ok)"} height={6} />
                <div className="f"><span>POD {k.podHours ? k.podHours + " h" : "·"}</span><span>{num(k.tonnes)} t moved</span><span>{k.open} open</span></div>
                <div className="d">{x.base} · {x.equipment.join(", ")}</div>
              </button>
            );
          })}
        </div>
      </Card>
      {c && (
        <Card span={5} className="om-sticky" title={c.name} sub={c.base + " · " + c.contact}>
          <div className="om-row" style={{ flexWrap: "wrap", gap: 6 }}>{c.equipment.map(e => <span key={e} className="om-chip">{e}</span>)}</div>
          <div className="om-kpis" style={{ marginTop: 12, gridTemplateColumns: "repeat(3,minmax(0,1fr))" }}>
            <Kpi label="In window" value={cs.delivered ? pct(cs.onTimePct) : "·"} sub={cs.onTime + " of " + cs.delivered} tone={cs.delivered && cs.onTimePct < 0.85 ? "warn" : undefined} />
            <Kpi label="POD turnaround" value={cs.podHours ? cs.podHours + " h" : "·"} />
            <Kpi label="Open loads" value={cs.open} sub={cs.tbc ? cs.tbc + " driver TBC" : "drivers booked"} tone={cs.tbc ? "warn" : undefined} />
          </div>
          <div className="om-label" style={{ margin: "14px 0 6px" }}>Issues</div>
          {c.issues.length || cs.late.length ? <>{c.issues.map(i => <div key={i} className="om-row om-small" style={{ padding: "3px 0" }}><Dot tone="warn" />{i}</div>)}{cs.late.map(l => <div key={l.id} className="om-row om-small" style={{ padding: "3px 0" }}><Dot tone="warn" />{l.id} arrived after the window{l.notes ? ": " + l.notes : ""}</div>)}</> : <div className="om-faint om-small">No issues logged.</div>}
          <div className="om-label" style={{ margin: "14px 0 6px" }}>Loads, newest first</div>
          {loads.map(l => <div key={l.id} className="om-row om-small" style={{ padding: "5px 0", borderTop: "1px solid var(--border)" }}><RefLink om={om} r={{ kind: "load", id: l.id }} /><span className="om-muted" style={{ flex: 1, minWidth: 0 }}>{site(om, l)?.name} · {dateShort(l.collect)}</span><span className="om-mono om-faint om-tiny">{num(l.tonnes)} t</span><Badge>{l.status}</Badge></div>)}
        </Card>
      )}
    </Grid>
  );
}

/* ── 4. Exceptions & POD ───────────────────────────────────────────────── */
function Pod({ om }: { om: Om }) {
  const s = om.s;
  const queue = podQueue(s);
  const claimed = s.loads.filter(l => l.status === "Arrival claimed");
  const received = s.loads.filter(l => l.status === "POD submitted" || l.status === "Exception");
  const accepted = s.loads.filter(l => l.status === "POD verified").sort((a, b) => (b.pod.verified || "").localeCompare(a.pod.verified || ""));
  const [sel, setSel] = useUi<string>(om, "sel:Logistics:pod", queue[0]?.l.id || "LOAD-4481");
  const l = byId(s.loads, sel);
  const [note, setNote] = useState("");
  const now = nowStamp(s);
  const inv = l ? byId(s.invoices, l.invoiceId) : undefined;
  const lane = (title: string, tone: "bad" | "warn" | "ok", list: Load[], hint: string) => (
    <div className={"om-lane l-" + tone}>
      <div className="om-lane-h"><Dot tone={tone} /><b>{title}</b><span className="n">{list.length}</span></div>
      <div className="om-faint om-tiny" style={{ padding: "8px 14px 0" }}>{hint}</div>
      <div className="om-list" style={{ paddingTop: 4 }}>
        {list.length ? list.map(x => {
          const i = byId(s.invoices, x.invoiceId);
          return (
            <button key={x.id} className={"om-li" + (x.id === l?.id ? " sel" : "")} onClick={() => { setSel(x.id); setNote(""); }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="om-row" style={{ gap: 8 }}><span className="om-mono om-small om-ink">{x.id}</span>{x.claimed && x.status !== "POD verified" && <span className="om-faint om-tiny">{hoursSince(x.claimed, now)}h</span>}{i && <span className="om-mono om-small" style={{ marginLeft: "auto" }}>{gbp(i.net)}</span>}</div>
                <div className="om-small om-muted" style={{ marginTop: 3 }}>{project(om, x)}</div>
                <div className="om-tiny om-faint" style={{ marginTop: 2 }}>{x.status === "POD verified" ? "Accepted " + stamp(x.pod.verified) : x.exception || (x.claimed ? "Claimed " + stamp(x.claimed) : "")}</div>
              </div>
            </button>
          );
        }) : <Empty title="Empty" />}
      </div>
    </div>
  );
  return (
    <>
      {queue[0] && (
        <Banner tone="bad"><span><b>Highest priority: {queue[0].l.id}</b>, {project(om, queue[0].l)}. {queue[0].l.status === "Arrival claimed" ? "Carrier marked delivered " + stamp(queue[0].l.claimed) + " with no photo or receiver signature" : queue[0].l.exception || "POD awaiting review"}, {queue[0].hours} hours ago.{queue[0].invoice ? " " + queue[0].invoice.id + " " + gbp(queue[0].invoice.net) + " " + queue[0].invoice.stage.toLowerCase() + "." : ""}</span></Banner>
      )}
      <div className="om-lanes" style={{ marginTop: 14 }}>
        {lane("Carrier marked delivered", "bad", claimed, "A claim only. Not proof of delivery.")}
        {lane("POD received, review pending", "warn", received, "Evidence submitted or disputed. A person must decide.")}
        {lane("POD accepted", "ok", accepted, "Verified by a person. Invoice can be released.")}
      </div>
      {l && (
        <Grid style={{ marginTop: 14 }}>
          <Card span={7} title={"Evidence review · " + l.id} sub={project(om, l) + " · " + carrierShort(om, l)} right={<><Badge>{l.status}</Badge><LineageChip l={{ source: l.pod.verified ? "Pulse" : l.pod.submitted ? "Carrier app (simulated)" : "Carrier claim", updated: l.pod.verified || l.pod.submitted || l.claimed || l.collect, state: l.pod.verified ? "Verified by " + l.pod.verifiedBy : l.claimed ? "Claim awaiting validation" : "Planned" }} /></>}>
            <Facts items={[["Carrier claim", l.claimed ? stamp(l.claimed) : "—"], ["POD submitted", l.pod.submitted ? stamp(l.pod.submitted) : "—"], ["Accepted", l.pod.verified ? stamp(l.pod.verified) + " · " + l.pod.verifiedBy : "—"], ["Delivery window", l.deliver]]} />
            <div style={{ marginTop: 12 }}><Evidence l={l} /></div>
            {l.exception && <Banner tone="warn"><span>{l.exception}</span></Banner>}
            <div className="om-faint om-tiny" style={{ marginTop: 10 }}>Timestamps and locations are demo data, not independently verified telematics.</div>
          </Card>
          <Card span={5} title="Decision" sub="Human review of delivery evidence">
            <div className="om-eyebrow" style={{ marginBottom: 8 }}>Impacted invoice</div>
            <InvoiceLine om={om} l={l} />
            <div className="om-divider" />
            {l.status === "Arrival claimed" && (
              <div className="om-col">
                <Banner tone="bad"><span><b>A claim is not proof.</b> Nothing to accept until the carrier submits a photo, receiver name and signature.</span></Banner>
                <Btn kind="primary" onClick={() => { om.do.requestPod(l.id); om.toast("POD requested from " + carrierShort(om, l) + " (simulated, no message sent)."); }}>Request missing photo and signature</Btn>
                <Btn onClick={() => { om.setUi("sel:Logistics:carrier-app", l.id); om.setSub("carrier-app"); }}>Open carrier app for this load</Btn>
                <Btn disabled title="A claim is not proof">Accept POD</Btn>
              </div>
            )}
            {(l.status === "POD submitted" || l.status === "Exception") && (
              <div className="om-col">
                <Field label={l.status === "Exception" ? "Resolution note (required)" : "Review note (optional)"}><input className="om-input" value={note} onChange={e => setNote(e.target.value)} placeholder={l.status === "Exception" ? "For example: accept 35 planks, credit 1" : "For example: photo shows all units bay A"} /></Field>
                <Btn kind="primary" disabled={l.status === "Exception" && !note.trim() || (!l.pod.photo && !l.pod.signature)} onClick={() => { om.do.reviewPod(l.id, true, note.trim()); setNote(""); om.toast(l.id + " accepted. Invoice now eligible: finance can release it."); }}>{l.status === "Exception" ? "Accept with note" : "Accept POD"}</Btn>
                <Btn kind="danger" onClick={() => { om.do.reviewPod(l.id, false, note.trim() || "Evidence insufficient"); setNote(""); om.toast(l.id + " rejected. Invoice stays held."); }}>Reject{note.trim() ? " with note" : ""}</Btn>
                <Btn onClick={() => { om.do.requestPod(l.id); om.toast("Further evidence requested (simulated)."); }}>Request more evidence</Btn>
              </div>
            )}
            {l.status === "POD verified" && (
              <div className="om-col">
                <Banner tone="ok"><span>Proof accepted {stamp(l.pod.verified)} by {l.pod.verifiedBy}.</span></Banner>
                {inv && inv.stage === "Eligible" && <><div className="om-small"><b>Invoice now eligible: finance can release it.</b></div><Btn kind="primary" onClick={() => om.go("Finance", "readiness", inv.id)}>Open {inv.id} in Finance →</Btn></>}
                {inv && inv.stage !== "Eligible" && <div className="om-small om-muted">{inv.id} is {inv.stage.toLowerCase()}. <button className="om-link" onClick={() => om.go("Finance", "readiness", inv.id)}>Open in Finance</button></div>}
              </div>
            )}
            {(l.status === "Planned" || l.status === "Loaded" || l.status === "Dispatched") && <div className="om-small om-muted">Not delivered yet. Nothing to review.</div>}
          </Card>
        </Grid>
      )}
    </>
  );
}

/* ── 5. Carrier app (phone preview) ────────────────────────────────────── */
function SignaturePad({ onDone, done }: { onDone: () => void; done: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [inked, setInked] = useState(false);
  const pos = (e: PointerEvent<HTMLCanvasElement>) => { const c = ref.current!; const r = c.getBoundingClientRect(); return [(e.clientX - r.left) * (c.width / r.width), (e.clientY - r.top) * (c.height / r.height)]; };
  const down = (e: PointerEvent<HTMLCanvasElement>) => { if (done) return; drawing.current = true; e.currentTarget.setPointerCapture(e.pointerId); const ctx = ref.current!.getContext("2d")!; const [x, y] = pos(e); ctx.beginPath(); ctx.moveTo(x, y); };
  const move = (e: PointerEvent<HTMLCanvasElement>) => { if (!drawing.current) return; const ctx = ref.current!.getContext("2d")!; ctx.strokeStyle = getComputedStyle(ref.current!).color || "#f3f3f2"; ctx.lineWidth = 2.4; ctx.lineCap = "round"; const [x, y] = pos(e); ctx.lineTo(x, y); ctx.stroke(); setInked(true); };
  const up = () => { drawing.current = false; };
  const clear = () => { const c = ref.current; if (c) c.getContext("2d")!.clearRect(0, 0, c.width, c.height); setInked(false); };
  const quick = () => { const c = ref.current; if (!c) return; const ctx = c.getContext("2d")!; ctx.strokeStyle = getComputedStyle(c).color || "#f3f3f2"; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(30, 80); ctx.bezierCurveTo(60, 20, 90, 110, 120, 60); ctx.bezierCurveTo(150, 20, 170, 100, 210, 70); ctx.stroke(); setInked(true); };
  return (
    <div>
      <canvas ref={ref} width={280} height={120} className="om-sig" style={{ color: "var(--ink)" }} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} aria-label="Signature pad" />
      <div className="om-row" style={{ marginTop: 6 }}>
        {!done && <><button className="om-link om-small" onClick={quick}>Sign for me (demo)</button><button className="om-link om-small" onClick={clear}>Clear</button></>}
        <span style={{ marginLeft: "auto" }}>{done ? <Badge tone="ok">Signature captured</Badge> : <Btn sm kind="primary" disabled={!inked} onClick={onDone}>Use signature</Btn>}</span>
      </div>
    </div>
  );
}

const PHASES: [string, number][] = [["Collect", 0], ["Travel", 2], ["Site", 3], ["Proof", 4], ["Done", 6]];
const SAFETY = ["Lifting plan and crane confirmed with site", "Exclusion zone set before unloading", "Hard hat, hi-vis and gloves on"];
function CarrierApp({ om }: { om: Om }) {
  const s = om.s;
  const active = s.loads.filter(l => l.status !== "POD verified").sort((a, b) => a.collect.localeCompare(b.collect));
  const [sel, setSel] = useUi<string>(om, "sel:Logistics:carrier-app", "LOAD-4481");
  const [screen, setScreen] = useState<"list" | "load">("load");
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [receiver, setReceiver] = useState("");
  const [exc, setExc] = useState("");
  const [showExc, setShowExc] = useState(false);
  const [info, setInfo] = useState(false);
  const l = byId(s.loads, sel);
  const d = l ? site(om, l) : undefined;
  const o = l ? byId(s.orders, l.orderId) : undefined;
  const cf = (k: string) => o?.contract.find(f => f.key === k)?.value || "";
  const lots = l ? s.lots.filter(x => l.lotIds.includes(x.id)) : [];
  const step = l ? (l.status === "POD submitted" || l.status === "POD verified" ? 6 : l.carrierStep) : 0;
  const pick = (id: string) => { setSel(id); setScreen("load"); setChecks({}); setReceiver(""); setExc(""); setShowExc(false); setInfo(false); };
  const COLLECT = ["Piece count matches delivery note (" + (l?.pieces || 0) + ")", "Straps and bearers checked", "Lot labels match " + (l?.lotIds.join(", ") || "load")];
  const safe = SAFETY.every(c => checks[c]);
  const events = l ? s.events.filter(e => e.ref.kind === "load" && e.ref.id === l.id).slice(0, 6) : [];
  const inv = l ? byId(s.invoices, l.invoiceId) : undefined;
  const today = nowStamp(s).slice(0, 10);
  const groups: [string, Load[]][] = [["Overdue proof", active.filter(x => x.collect.slice(0, 10) < today)], ["Today", active.filter(x => x.collect.startsWith(today))], ["Coming up", active.filter(x => x.collect.slice(0, 10) > today)]];
  const sim = (text: string) => om.toast(text + " (simulated in the demo)");
  const phase = PHASES.reduce((m, p, i) => (step >= p[1] ? i : m), 0);

  const phone = (
    <div className="om-phone" aria-label="Carrier app preview">
      <div className="om-phone-scr">
        <div className="om-ph-top"><span>{nowStamp(s).slice(11)}</span><span>Oranmore Carrier · demo</span></div>
        {screen === "list" || !l ? (
          <>
            <div className="om-ph-bar"><b>My loads</b><span className="om-faint om-small" style={{ marginLeft: "auto" }}>{active.length} open</span></div>
            <div className="om-ph-body">
              {groups.filter(g => g[1].length).map(([g, xs]) => (
                <div key={g} className="om-col" style={{ gap: 8 }}>
                  <div className="om-label" style={{ margin: "4px 2px 0" }}>{g}</div>
                  {xs.map(x => (
                    <button key={x.id} className="om-ph-item" onClick={() => pick(x.id)}>
                      <div className="om-ph-time"><b>{timeOf(x.collect)}</b><span>{dateShort(x.collect)}</span></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="om-small om-ink" style={{ fontWeight: 600 }}>{x.plant} → {site(om, x)?.town}</div>
                        <div className="om-tiny om-faint" style={{ marginTop: 2 }}>{x.id} · {x.pieces} pcs · {num(x.tonnes)} t</div>
                      </div>
                      <Badge>{x.status}</Badge>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="om-ph-bar"><button className="om-link" onClick={() => setScreen("list")} aria-label="Back to my loads">‹ Loads</button><b style={{ marginLeft: 6 }}>{l.id}</b><span style={{ marginLeft: "auto" }}><Badge>{l.status}</Badge></span></div>
            <div className="om-ph-body">
              <div className="om-ph-phases">{PHASES.map(([p], i) => <div key={p} className={i < phase || step >= 6 ? "done" : i === phase ? "on" : ""}><i /><span>{p}</span></div>)}</div>
              <div className="om-ph-route">
                <div><span className="om-faint om-tiny">COLLECT</span><b>{l.plant}</b><span className="om-tiny">{stamp(l.collect)}</span></div>
                <div className="arrow" aria-hidden="true">→</div>
                <div><span className="om-faint om-tiny">DELIVER</span><b>{d?.town}</b><span className="om-tiny">{l.deliver.split(" ").slice(1).join(" ")}</span></div>
              </div>
              <div className="om-row" style={{ gap: 6 }}>
                <button className="om-ph-btn ghost sm" onClick={() => sim("Directions to " + (d?.name || "site") + " opened")}>Directions</button>
                <button className="om-ph-btn ghost sm" onClick={() => sim("Calling " + l.siteContact.replace(" (demo contact)", ""))}>Call site</button>
                <button className="om-ph-btn ghost sm" onClick={() => setInfo(!info)}>{info ? "Hide" : "Site rules"}</button>
              </div>
              {info && (
                <div className="om-ph-info">
                  {cf("access") && <div><span>Access</span>{cf("access")}</div>}
                  {cf("delivery") && <div><span>Delivery</span>{cf("delivery")}</div>}
                  {cf("lifting") && <div><span>Lifting</span>{cf("lifting")}</div>}
                  <div><span>Contact</span>{l.siteContact}</div>
                </div>
              )}
              <div className="om-ph-info">{lots.map(x => <div key={x.id}><span>{x.id}</span>{x.product} · {x.units} units{x.m2 ? " · " + num(x.m2) + " m²" : ""}</div>)}{!lots.length && <div><span>Load</span>{l.pieces} pieces</div>}</div>
              <div className="om-small"><b className="om-ink">Next: {CARRIER_STEPS[Math.min(step, 6)]}</b></div>
              {step === 0 && (
                <>
                  {COLLECT.map(c => <label key={c} className="om-ph-item" style={{ cursor: "pointer" }}><input type="checkbox" checked={!!checks[c]} onChange={e => setChecks({ ...checks, [c]: e.target.checked })} /><span className="om-small">{c}</span></label>)}
                  <div className="om-label" style={{ margin: 0 }}>Loading photo before departure (simulated){checks["photo:load"] && " ✓"}</div>
                  <div className="om-photo">{["load_strapped.jpg", "load_labels.jpg", "trailer_side.jpg"].map(p => <button key={p} className={checks["photo:" + p] ? "on" : ""} onClick={() => setChecks({ ...checks, ["photo:load"]: true, ["photo:" + p]: true })}>{p.replace(".jpg", "").replace(/_/g, " ")}</button>)}</div>
                  <button className="om-ph-btn" disabled={!COLLECT.every(c => checks[c]) || !checks["photo:load"]} onClick={() => { om.do.carrierAdvance(l.id); setChecks({}); }}>{!checks["photo:load"] && COLLECT.every(c => checks[c]) ? "Add a loading photo" : "Confirm collection"}</button>
                </>
              )}
              {step === 1 && <button className="om-ph-btn" onClick={() => om.do.carrierAdvance(l.id)}>Depart for site</button>}
              {step === 2 && <><div className="om-small om-muted">En route to {d?.name}. Location sharing is not used in this demo.</div><button className="om-ph-btn" onClick={() => om.do.carrierAdvance(l.id)}>Arrived at site</button></>}
              {step >= 3 && step < 6 && l.status !== "Exception" && !safe && (
                <>
                  <div className="om-label" style={{ margin: 0 }}>Before unloading</div>
                  {SAFETY.map(c => <label key={c} className="om-ph-item" style={{ cursor: "pointer" }}><input type="checkbox" checked={!!checks[c]} onChange={e => setChecks({ ...checks, [c]: e.target.checked })} /><span className="om-small">{c}</span></label>)}
                  <div className="om-tiny om-faint">Proof capture opens once all three are ticked.</div>
                </>
              )}
              {step >= 3 && step < 6 && l.status !== "Exception" && safe && (
                <>
                  {l.claimed && <div className="om-tiny om-faint">Arrival claimed {stamp(l.claimed)}. Proof still needed.</div>}
                  <div className="om-label" style={{ margin: 0 }}>1. Unloading photo (simulated){l.pod.photo && " ✓"}</div>
                  <div className="om-photo">{EXAMPLE_PHOTOS.map(p => <button key={p} className={l.pod.photoName === p ? "on" : ""} onClick={() => om.do.carrierSetPod(l.id, { photo: true, photoName: p })}>{p.replace(".jpg", "").replace(/_/g, " ")}</button>)}</div>
                  <div className="om-label" style={{ margin: 0 }}>2. Recipient name{l.pod.receiver && " ✓"}</div>
                  <div className="om-row"><input className="om-input" value={receiver || l.pod.receiver || ""} onChange={e => setReceiver(e.target.value)} placeholder="Name of person receiving" /><Btn sm disabled={!(receiver || "").trim()} onClick={() => om.do.carrierSetPod(l.id, { receiver: receiver.trim() })}>Save</Btn></div>
                  <div className="om-label" style={{ margin: 0 }}>3. Recipient signature</div>
                  <SignaturePad key={l.id} done={l.pod.signature} onDone={() => om.do.carrierSetPod(l.id, { signature: true })} />
                  <button className="om-ph-btn" disabled={!l.pod.photo || !l.pod.receiver || !l.pod.signature} onClick={() => { om.do.carrierSubmit(l.id); om.toast(l.id + ": POD submitted, review pending. Not verified until the office accepts it."); }}>{!l.pod.photo || !l.pod.receiver || !l.pod.signature ? [!l.pod.photo && "photo", !l.pod.receiver && "name", !l.pod.signature && "signature"].filter(Boolean).join(", ") + " still needed" : "Submit delivery"}</button>
                </>
              )}
              {step < 6 && l.status !== "Exception" && (showExc ? (
                <>
                  <div className="om-row" style={{ gap: 6, flexWrap: "wrap" }}>{["Crane not on site", "Unit damaged", "Site closed", "Short on pieces"].map(q => <button key={q} className="om-chip" style={{ cursor: "pointer" }} onClick={() => setExc(q)}>{q}</button>)}</div>
                  <textarea className="om-input" rows={3} value={exc} onChange={e => setExc(e.target.value)} placeholder="What went wrong?" />
                  <div className="om-row"><button className="om-ph-btn ghost" onClick={() => setShowExc(false)}>Cancel</button><button className="om-ph-btn warn" disabled={!exc.trim()} onClick={() => { om.do.carrierException(l.id, exc.trim()); setShowExc(false); om.toast(l.id + ": exception reported to the office."); }}>Send exception</button></div>
                </>
              ) : <button className="om-ph-btn ghost" onClick={() => setShowExc(true)}>Report a problem</button>)}
              {(step >= 6 || l.status === "Exception") && (
                <div className="om-col">
                  <Badge tone={l.status === "POD verified" ? "ok" : l.status === "Exception" ? "bad" : "warn"}>{l.status === "POD submitted" ? "POD submitted, review pending" : l.status === "POD verified" ? "Accepted by office" : "Exception reported"}</Badge>
                  {l.exception && <div className="om-small" style={{ color: "var(--bad)" }}>{l.exception}</div>}
                  <div className="om-small om-muted">Timestamps and location are demo data, not verified telematics. Office review required.</div>
                  {active.find(x => x.id !== l.id && x.status === "Planned") && <button className="om-ph-btn" onClick={() => pick(active.find(x => x.id !== l.id && x.status === "Planned")!.id)}>Next job: {active.find(x => x.id !== l.id && x.status === "Planned")!.id}</button>}
                  <button className="om-ph-btn ghost" onClick={() => setScreen("list")}>Back to my loads</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="om-carrier-wrap">
      <div>{phone}</div>
      <Grid>
        <div className="om-s-12"><Banner>Carrier-facing preview. No sign-in, GPS or server: every tap updates the shared demo state, so the office view on the right moves as the driver works.</Banner></div>
        <Card span={12} title="Office view of this load" right={<select className="om-input" style={{ width: 240 }} value={sel} onChange={e => pick(e.target.value)} aria-label="Load">{active.concat(s.loads.filter(x => x.status === "POD verified")).map(x => <option key={x.id} value={x.id}>{x.id} · {x.status}</option>)}</select>}>
          {l ? (
            <>
              <div className="om-row" style={{ flexWrap: "wrap", gap: 8, marginBottom: 14 }}><b>{project(om, l)}</b><Badge>{l.status}</Badge><span className="om-faint om-small">{carrierShort(om, l)} · {l.driver.replace(" (mock)", "")}</span></div>
              <div className="om-track">
                {CARRIER_STEPS.map((c, i) => <div key={c} className={i < step ? "done" : i === step && step < 6 ? "on" : ""}><i /><span>{c}</span></div>)}
              </div>
              <div style={{ marginTop: 14 }}><Evidence l={l} /></div>
              <div className="om-kpis" style={{ marginTop: 12 }}>
                <Kpi label="Carrier claim" value={l.claimed ? stamp(l.claimed) : "·"} />
                <Kpi label="POD submitted" value={l.pod.submitted ? stamp(l.pod.submitted) : "·"} tone={l.pod.submitted ? "warn" : undefined} />
                <Kpi label="Invoice" value={inv ? gbp(inv.net) : "·"} sub={inv ? inv.stage : "no draft linked"} tone={inv?.stage === "Held" ? "bad" : undefined} />
              </div>
              <div className="om-label" style={{ margin: "16px 0 8px" }}>Office activity on this load</div>
              {events.length ? events.map(e => <div key={e.id} className="om-small" style={{ padding: "6px 0", borderTop: "1px solid var(--border)" }}><span className="om-mono om-faint">{stamp(e.at)}</span> · <b style={{ fontWeight: 600 }}>{e.title}</b> <span className="om-muted">· {e.actor}</span></div>) : <div className="om-faint om-small">No events yet. Tap through the app to see them land here.</div>}
              <div className="om-row" style={{ marginTop: 14, flexWrap: "wrap" }}>
                {loadAwaitingProof(l) && <Btn kind="primary" onClick={() => { om.setUi("sel:Logistics:pod", l.id); om.setSub("pod"); }}>Review in Exceptions & POD</Btn>}
                <Btn onClick={() => om.open({ kind: "load", id: l.id })}>Open record</Btn>
              </div>
            </>
          ) : <Empty title="Pick a load" />}
        </Card>
      </Grid>
    </div>
  );
}

const SUBS: Record<string, [string, string]> = {
  planner: ["Transport planner", "The week's collections by day, replacing the Excel planner. Every load is with an outsourced carrier."],
  loads: ["Loads & deliveries", "Every load from planned to verified, with the evidence and the invoice it unlocks."],
  carriers: ["Carriers", "Illustrative haulage partners, equipment and mock performance."],
  pod: ["Exceptions & POD", "Carrier marked delivered, POD received and POD accepted are three different things. Only a person accepts proof."],
  "carrier-app": ["Carrier app preview", "What a driver sees on site: collection check, arrival, photo, receiver and signature."],
};

export default function Logistics({ om }: { om: Om }) {
  const s = om.s;
  const [title, sub] = SUBS[om.sub] || SUBS.planner;
  const q = podQueue(s);
  return (
    <Page>
      <Head eyebrow="Logistics · outsourced haulage" title={title} sub={sub} />
      {om.sub !== "carrier-app" && (
        <div className="om-kpis" style={{ marginBottom: 14 }}>
          <Kpi label="Loads this week" value={s.loads.filter(l => DAYS.includes(l.collect.slice(0, 10))).length} sub={s.loads.filter(l => l.status === "Dispatched" || l.status === "Loaded").length + " moving now"} onClick={() => om.setSub("planner")} />
          <Kpi label="Claimed, no POD" value={s.loads.filter(l => l.status === "Arrival claimed").length} tone="bad" sub={q[0] ? q[0].l.id + " · " + q[0].hours + "h" : ""} onClick={() => om.setSub("pod")} />
          <Kpi label="POD review pending" value={s.loads.filter(l => l.status === "POD submitted" || l.status === "Exception").length} tone="warn" onClick={() => om.setSub("pod")} />
          <Kpi label="POD verified" value={s.loads.filter(l => l.status === "POD verified").length} tone="ok" onClick={() => { om.setUi("log:loadFilter", "POD verified"); om.setSub("loads"); }} />
        </div>
      )}
      {om.sub === "loads" ? <Loads om={om} /> : om.sub === "carriers" ? <Carriers om={om} /> : om.sub === "pod" ? <Pod om={om} /> : om.sub === "carrier-app" ? <CarrierApp om={om} /> : <Planner om={om} />}
    </Page>
  );
}
