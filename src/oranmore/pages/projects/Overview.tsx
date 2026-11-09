import type { Om } from "../../ui";
import { Head, Grid, Card, Table, Badge, Btn, Kpi, RefLink, Bar, toneOf, LineageChip } from "../../ui";
import type { Order } from "../../types";
import { blockingOpen, designFor, invoicesFor, loadsFor } from "../../selectors";
import { gbp, gbpShort, stamp, dateShort } from "../../format";
import { useOrder, custName, siteName, progressOf, SourceBadge, stageTone, stageWord, stageTarget, OrderNumbers } from "./common";

export default function Overview({ om }: { om: Om }) {
  const [sel, setSel] = useOrder(om);
  const s = om.s;
  const rows = s.orders.map(o => ({ o, p: progressOf(om, o) }));
  const totalValue = s.orders.reduce((t, o) => t + o.value, 0);
  const blocked = rows.filter(r => r.p.blocked.length);
  const blockingRfis = s.rfis.filter(r => r.blocking && r.status !== "Resolved").length;
  const awaitingClient = s.designs.filter(d => d.status === "Awaiting client approval").length;
  const proof = s.loads.filter(l => l.status === "Arrival claimed" || l.status === "POD submitted" || l.status === "Exception").length;

  const selP = progressOf(om, sel);
  const evs = s.events.filter(e => e.orderId === sel.id || (e.ref.kind === "order" && e.ref.id === sel.id)).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12);
  const d = designFor(s, sel.id);
  const held = invoicesFor(s, sel.id).filter(i => i.stage === "Held");
  const nextLoad = loadsFor(s, sel.id).filter(l => l.status === "Planned" || l.status === "Loaded").sort((a, b) => a.collect.localeCompare(b.collect))[0];

  return (
    <>
      <Head title="Active contracts" sub="Every awarded order on one line: where it is between award and invoice, what it waits on, and who moves it next. Same records as Commercial, Plants, Logistics and Finance." />
      <Grid>
        <div className="om-s-12 om-kpis">
          <Kpi label="Active orders" value={s.orders.length} sub={gbp(totalValue) + " contract value, net"} />
          <Kpi label="Blocked projects" value={blocked.length} tone={blocked.length ? "bad" : "ok"} sub={blocked.map(r => r.o.id).join(", ") || "None"} onClick={() => blocked[0] && setSel(blocked[0].o.id)} />
          <Kpi label="Blocking RFIs" value={blockingRfis} tone={blockingRfis ? "bad" : "ok"} sub="Stop design handover" onClick={() => om.setSub("rfis")} />
          <Kpi label="Drawings with client" value={awaitingClient} tone={awaitingClient ? "warn" : "ok"} sub="Production waits on sign-off" onClick={() => om.go("Plants & Planning", "design")} />
          <Kpi label="Deliveries without proof" value={proof} tone={proof ? "bad" : "ok"} sub="Claims, reviews and disputes" onClick={() => om.go("Logistics", "pod")} />
        </div>

        <Card span={8} title="Contracts" sub="Click a row to see its cross-system timeline" flush>
          <Table rows={rows} rowKey={r => r.o.id} selKey={sel.id} onRow={r => setSel(r.o.id)} cols={[
            { k: "p", label: "Project", render: r => <div style={{ minWidth: 180 }}><div className="ink">{siteName(om, r.o)}</div><div className="om-faint om-tiny"><RefLink om={om} r={{ kind: "order", id: r.o.id }} /> · awarded {dateShort(r.o.awarded)}</div></div> },
            { k: "c", label: "Customer", render: r => custName(om, r.o) },
            { k: "v", label: "Value", align: "right", cls: "mono", render: r => gbpShort(r.o.value) },
            { k: "g", label: "Progress", w: 150, render: r => <div><div className="om-row" style={{ gap: 6, justifyContent: "space-between" }}><span className="om-tiny om-muted">{r.p.current ? r.p.current.label : "Complete"}</span><span className="om-tiny om-mono om-faint">{r.p.done}/{r.p.total}</span></div><div style={{ marginTop: 5 }}><Bar value={r.p.done} max={r.p.total} color={r.p.blocked.length ? "var(--bad)" : undefined} height={6} /></div></div> },
            { k: "n", label: "Next handoff", render: r => <span className="om-small">{r.o.nextHandoff}</span> },
            { k: "b", label: "Blockers", align: "right", render: r => r.p.blocked.length ? <Badge tone="bad">{r.p.blocked.length}</Badge> : <span className="om-faint">0</span> },
            { k: "l", label: "Lead", render: r => <span className="om-small om-muted">{r.o.lead.split(" · ")[0]}</span> },
            { k: "u", label: "Client updated", render: r => <span className="om-mono om-small om-faint">{stamp(r.o.clientUpdated)}</span> },
          ]} />
        </Card>

        <Card span={4} className="om-sticky" title={siteName(om, sel)} sub={custName(om, sel) + " · " + sel.id} right={<LineageChip l={sel.lineage} />}>
          <OrderNumbers om={om} o={sel} />
          <div className="om-steps" style={{ marginBottom: 12 }}>
            {selP.st.map(x => <span key={x.key} title={x.label + ": " + x.status} style={{ flex: 1, height: 6, borderRadius: 999, background: x.state === "pending" ? "var(--track)" : `var(--${stageTone(x.state) === "accent" ? "accent" : stageTone(x.state) === "neutral" ? "track" : stageTone(x.state)})`, minWidth: 8 }} />)}
          </div>
          <div className="om-kv" style={{ gridTemplateColumns: "110px 1fr" }}>
            <dt>Stage</dt><dd>{selP.current ? <><Badge tone={stageTone(selP.current.state)}>{stageWord(selP.current.state)}</Badge> {selP.current.label}</> : "Complete"}</dd>
            <dt>Portal status</dt><dd>{sel.portal}</dd>
            <dt>Blocking RFIs</dt><dd>{blockingOpen(s, sel.id).length ? blockingOpen(s, sel.id).map(r => <span key={r.id} style={{ marginRight: 6 }}><RefLink om={om} r={{ kind: "rfi", id: r.id }} /></span>) : "None"}</dd>
            <dt>Design</dt><dd>{d ? <><RefLink om={om} r={{ kind: "design", id: d.id }}>{d.id} {d.revision}</RefLink> <Badge tone={toneOf(d.status)}>{d.status}</Badge></> : sel.design}</dd>
            <dt>Next load</dt><dd>{nextLoad ? <><RefLink om={om} r={{ kind: "load", id: nextLoad.id }} /> {stamp(nextLoad.collect)}</> : "None planned"}</dd>
            <dt>Invoice holds</dt><dd>{held.length ? held.map(h => <div key={h.id}><RefLink om={om} r={{ kind: "invoice", id: h.id }} /> {gbp(h.net)} <span className="om-faint">· {h.hold}</span></div>) : "None"}</dd>
          </div>
          <div className="om-row" style={{ marginTop: 14, flexWrap: "wrap", gap: 6 }}>
            <Btn kind="primary" sm onClick={() => om.setSub("journey")}>Project journey</Btn>
            {selP.blocked[0] && stageTarget(selP.blocked[0]) && <Btn sm onClick={() => { const t = stageTarget(selP.blocked[0])!; om.go(t[0], t[1], t[2]); }}>Fix blocker: {selP.blocked[0].label}</Btn>}
            <Btn sm kind="quiet" onClick={() => om.setSub("portal")}>Customer view</Btn>
          </div>
          <div className="om-label" style={{ margin: "16px 0 6px" }}>Deliveries</div>
          {loadsFor(s, sel.id).length ? loadsFor(s, sel.id).sort((a, b) => b.collect.localeCompare(a.collect)).slice(0, 5).map(l => <div key={l.id} className="om-row om-small" style={{ padding: "4px 0", borderTop: "1px solid var(--border)" }}><RefLink om={om} r={{ kind: "load", id: l.id }} /><span className="om-mono om-faint om-tiny">{stamp(l.collect)}</span><span style={{ marginLeft: "auto" }}><Badge>{l.status}</Badge></span></div>) : <div className="om-faint om-small">No loads yet.</div>}
        </Card>

        <Card span={12} title={"Cross-system timeline · " + siteName(om, sel)} sub="People, agents, iThesis, Sage, carriers and the customer on one ordered feed. iThesis and Sage entries are illustrative." right={<Btn sm kind="quiet" onClick={() => om.go("Activity")}>All activity</Btn>}>
          {evs.length === 0 ? <div className="om-faint om-small">No events recorded for this project yet.</div> : (
            <div style={{ position: "relative", paddingLeft: 18 }}>
              <div style={{ position: "absolute", left: 5, top: 6, bottom: 6, width: 1, background: "var(--border-strong)" }} />
              {evs.map(e => (
                <div key={e.id} style={{ position: "relative", padding: "7px 0" }}>
                  <span style={{ position: "absolute", left: -17, top: 13, width: 9, height: 9, borderRadius: "50%", background: e.status === "failed" ? "var(--bad)" : e.status === "waiting" ? "var(--warn)" : "var(--ok)", boxShadow: "0 0 0 3px var(--surface)" }} />
                  <div className="om-row" style={{ gap: 8, flexWrap: "wrap" }}>
                    <span className="om-mono om-faint om-small" style={{ width: 96 }}>{stamp(e.at)}</span>
                    <SourceBadge src={e.source} />
                    <b style={{ fontSize: 12.5, fontWeight: 600 }}>{e.title}</b>
                    <span className="om-faint om-small">{e.actor}</span>
                    <span style={{ marginLeft: "auto" }}><RefLink om={om} r={e.ref} /></span>
                  </div>
                  <div className="om-muted om-small" style={{ marginLeft: 104, marginTop: 2 }}>{e.note}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </Grid>
    </>
  );
}
export type { Order };
