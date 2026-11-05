/* Dashboard body below the KPI band. One composition per top-bar tab, all
   derived from the shared state, every element drilling into a record or module. */
import type { Om, Col } from "../ui";
import { Card, Grid, Btn, Badge, Bar, Table, RefLink, Empty, useUi, Dot } from "../ui";
import type { Load, LoadStatus } from "../types";
import { WEEKS, OTHER_LINES } from "../fixtures";
import {
  journey, attention, capacityWeek, quoteStatusCounts, pipeline, enquiryRows, estimatorLoad, financeTotals, podQueue,
  orderLabel, account, dev, byId, carrierOf, PRE_SUBMIT, blockingOpen, nowStamp,
} from "../selectors";
import { gbp, gbpShort, num, pct, dateShort, stamp, dayShort } from "../format";
import { weeklyReceipts, sageExceptions } from "./finance/shared";
import "../../styles/om-fin.css";

export default function OmDashboard({ om }: { om: Om }) {
  const t = om.sub;
  return (
    <div className="om-page" style={{ paddingTop: 14 }}>
      {t === "executive" && <Executive om={om} />}
      {t === "commercial" && <Commercial om={om} />}
      {t === "plant" && <Plant om={om} />}
      {t === "logistics" && <Logistics om={om} />}
      {t === "finance" && <FinanceDash om={om} />}
    </div>
  );
}

const STATE_LABEL: Record<string, string> = { done: "Done", active: "In progress", waiting: "Waiting", blocked: "Blocked", pending: "Not started" };

/* ── Executive ──────────────────────────────────────────────────────────── */
function Executive({ om }: { om: Om }) {
  const s = om.s;
  const quotesOut = s.quotes.filter(q => !!q.submitted || ["Quote submitted", "Negotiation", "Won", "Lost", "On hold"].includes(q.status)).length;
  const hasLoad = (oid: string, st: LoadStatus) => s.loads.some(l => l.orderId === oid && l.status === st);
  const funnel: [string, number, string, string][] = [
    ["Enquiries", s.enquiries.length, "Commercial", "inquiries"],
    ["Quotes out", quotesOut, "Commercial", "quotations"],
    ["Won orders", s.orders.length, "Projects", "awards"],
    ["Contract set up", s.orders.filter(o => o.contractApproved).length, "Projects", "contract"],
    ["Design released", s.orders.filter(o => o.design === "Released for production").length, "Plants & Planning", "design"],
    ["In production", s.orders.filter(o => o.production !== "Not released").length, "Plants & Planning", "production"],
    ["Delivering", s.orders.filter(o => o.dispatch === "Delivering" || o.dispatch === "Complete").length, "Logistics", "loads"],
    ["POD verified", s.orders.filter(o => hasLoad(o.id, "POD verified")).length, "Logistics", "pod"],
    ["Invoiced", s.orders.filter(o => s.invoices.some(i => i.orderId === o.id && ["Issued", "Paid", "Handoff simulated"].includes(i.stage))).length, "Finance", "sage"],
  ];
  const fmax = Math.max(1, ...funnel.map(f => f[1]));
  const risks = attention(s).slice(0, 6);
  const orders = s.orders.slice().sort((a, b) => b.value - a.value);
  const stageNames = journey(s, orders[0].id).map(x => x.label);
  const qc = quoteStatusCounts(s);
  const qOrder = ["Inquiry", "Estimating", "Quote submitted", "Negotiation", "Won", "Lost", "On hold"];
  const qmax = Math.max(1, ...qOrder.map(k => qc[k]?.n || 0));
  const won = qc.Won?.n || 0, lost = qc.Lost?.n || 0;
  const f = financeTotals(s);
  const lStats: LoadStatus[] = ["Planned", "Loaded", "Dispatched", "Arrival claimed", "POD submitted", "POD verified", "Exception"];
  return (
    <Grid>
      <Card span={7} title="Order flow, enquiry to invoice" sub="Count of records at or past each step · click to open the module">
        <div className="dash-funnel">
          {funnel.map(([label, n, page, tab]) => (
            <button key={label} onClick={() => om.go(page, tab)} aria-label={label + ": " + n}>
              <span className="om-small">{label}</span>
              <span style={{ display: "block" }}><span className="fb" style={{ display: "block", width: Math.max(3, (n / fmax) * 100) + "%" }} /></span>
              <span className="om-mono om-small" style={{ textAlign: "right" }}>{n}</span>
            </button>
          ))}
        </div>
      </Card>
      <Card span={5} title="Top risks" sub="Across commercial, design, transport and finance" flush>
        {risks.length === 0 ? <Empty title="No open risks" /> : <div className="om-list">
          {risks.map(r => (
            <button key={r.id} className="om-li" onClick={() => om.go(r.module, r.tab, r.ref.id)}>
              <Dot tone={r.tone === "info" ? "info" : r.tone} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="om-small om-ink" style={{ fontWeight: 600 }}>{r.title}</div>
                <div className="om-faint om-tiny">{r.why}</div>
              </div>
              <span className="om-faint om-tiny" style={{ whiteSpace: "nowrap" }}>{r.module}</span>
            </button>
          ))}
        </div>}
      </Card>
      <Card span={12} title="Operational heatmap" sub="Every awarded order across the ten handoffs · click a cell to open the record behind it"
        right={<div className="dash-legend">{["done", "active", "waiting", "blocked", "pending"].map(k => <span key={k}><i className={"hc-" + k} />{STATE_LABEL[k]}</span>)}</div>}>
        <div className="om-scroll">
          <div className="dash-heat" style={{ gridTemplateColumns: "220px repeat(" + stageNames.length + ", minmax(70px,1fr))" }}>
            <div className="hd" style={{ textAlign: "left" }}>Project</div>
            {stageNames.map(n => <div key={n} className="hd" title={n}>{n}</div>)}
            {orders.map(o => {
              const st = journey(s, o.id);
              return [
                <button key={o.id} className="rl" onClick={() => om.go("Projects", "journey", o.id)} title={orderLabel(s, o)}>
                  <b style={{ fontWeight: 600 }}>{account(s, o.accountId)?.name}</b> <span className="om-faint">{dev(s, o.devId)?.name}</span>
                </button>,
                ...st.map(x => (
                  <button key={o.id + x.key} className={"c hc-" + x.state} title={x.label + ": " + x.status + (x.blocker ? " · " + x.blocker : "")}
                    onClick={() => om.open(x.ref || { kind: "order", id: o.id })}>{x.state === "blocked" ? "Blocked" : x.state === "pending" ? "·" : x.status}</button>
                )),
              ];
            })}
          </div>
        </div>
      </Card>
      <Card span={7} title="Hollowcore demand by week" sub="Firm commitments vs tentative demand, % of each plant's illustrative capacity · tentative is never booked">
        <WeeklyDemand om={om} />
      </Card>
      <Card span={5} title="Quote to order movement" sub={"Decided quotes: " + won + " won, " + lost + " lost" + (won + lost ? " (" + pct(won / (won + lost)) + " win rate)" : "")}>
        <div className="om-col" style={{ gap: 9 }}>
          {qOrder.map(k => (
            <button key={k} className="fin-bucket" onClick={() => om.go("Commercial", k === "Won" ? "pipeline" : "quotations")}>
              <div className="om-row"><Badge>{k}</Badge><span className="om-faint om-tiny">{qc[k]?.n || 0} quotes</span><span className="om-mono om-small" style={{ marginLeft: "auto" }}>{gbpShort(qc[k]?.value || 0)}</span></div>
              <Bar value={qc[k]?.n || 0} max={qmax} color={k === "Won" ? "var(--ok)" : k === "Lost" ? "var(--bad)" : undefined} />
            </button>
          ))}
          <div className="om-faint om-tiny">Values are indicative quote values, net of VAT. Unsent estimates are not prices.</div>
        </div>
      </Card>
      <Card span={12} title="Delivery confirmation and invoice release" sub="A carrier claim is not proof · invoices move only after a person accepts the POD">
        <div className="dash-stats">
          {lStats.map(k => {
            const n = s.loads.filter(l => l.status === k).length;
            return <button key={k} className="dash-stat" onClick={() => om.go("Logistics", k === "Arrival claimed" || k === "POD submitted" || k === "Exception" ? "pod" : "loads")}>
              <span className="om-faint om-tiny">{k}</span><b style={{ color: k === "Arrival claimed" || k === "Exception" ? (n ? "var(--bad)" : undefined) : k === "POD verified" ? "var(--ok)" : undefined }}>{n}</b><span className="om-faint om-tiny">loads</span>
            </button>;
          })}
        </div>
        <div className="dash-stats" style={{ marginTop: 8 }}>
          {([["Held", f.heldValue, f.held.length, "var(--bad)"], ["Eligible", f.eligibleValue, f.eligible.length, "var(--warn)"], ["Invoice-ready", f.readyValue, f.ready.length, "var(--ok)"], ["Handoff simulated", f.handedValue, f.handed.length, undefined]] as [string, number, number, string | undefined][]).map(([k, v, n, c]) => (
            <button key={k} className="dash-stat" onClick={() => om.go("Finance", "readiness")}>
              <span className="om-faint om-tiny">{k} · {n} drafts</span><b style={{ color: c }}>{gbp(v)}</b><span className="om-faint om-tiny">net of VAT</span>
            </button>
          ))}
        </div>
      </Card>
    </Grid>
  );
}

function WeeklyDemand({ om }: { om: Om }) {
  const s = om.s;
  const weeks = WEEKS.map(w => capacityWeek(s, w));
  const H = 150, MAXP = 1.3;
  const h = (v: number, cap: number) => Math.min(H, (v / cap / MAXP) * H);
  return (
    <>
      <div className="dash-wk" role="img" aria-label="Weekly hollowcore firm and tentative demand per plant">
        <div className="dash-cap" style={{ bottom: 20 + H / MAXP }} title="100% of plant capacity" />
        {weeks.map(w => (
          <button key={w.week} className="w" style={{ background: "none", border: 0, cursor: "pointer", color: "inherit", font: "inherit" }}
            onClick={() => om.go("Plants & Planning", "capacity")} title={"w/c " + dateShort(w.week) + ": firm " + num(w.firm) + " m², tentative " + num(w.tentative) + " m²"}>
            <div className="bars">
              {w.plants.map(p => (
                <span key={p.plant} title={p.plant + ": firm " + num(p.firm) + " m² + tentative " + num(p.tentative) + " m² of " + num(p.cap)}>
                  <i style={{ display: "block", height: h(p.firm, p.cap), background: p.plant === "Brandon" ? "var(--accent)" : "#8fa0ae" }} />
                  <i style={{ display: "block", height: h(p.tentative, p.cap), background: "repeating-linear-gradient(45deg,var(--warn-soft) 0 4px,transparent 4px 8px)", border: p.tentative ? "1px dashed var(--warn)" : "0" }} />
                </span>
              ))}
            </div>
            <span className="om-faint om-tiny">{dateShort(w.week)}</span>
          </button>
        ))}
      </div>
      <div className="dash-legend" style={{ marginTop: 10 }}>
        <span><i style={{ background: "var(--accent)" }} />Brandon firm</span><span><i style={{ background: "#8fa0ae" }} />Lound firm</span>
        <span><i style={{ border: "1px dashed var(--warn)" }} />Tentative (not booked)</span><span>Dashed line: 100% capacity</span>
      </div>
    </>
  );
}

/* ── Commercial ─────────────────────────────────────────────────────────── */
function Commercial({ om }: { om: Om }) {
  const s = om.s, p = pipeline(s);
  const rows = enquiryRows(s).filter(r => PRE_SUBMIT.includes(r.q.status));
  const buckets: [string, string, (d: number) => boolean][] = [
    ["overdue", "Overdue", d => d < 0], ["3d", "Due ≤3 days", d => d >= 0 && d <= 3], ["7d", "4 to 7 days", d => d > 3 && d <= 7],
    ["14d", "8 to 14 days", d => d > 7 && d <= 14], ["later", "15 days +", d => d > 14],
  ];
  const [bk, setBk] = useUi<string>(om, "dash:dueBucket", "3d");
  const bmax = Math.max(1, ...buckets.map(b => rows.filter(r => b[2](r.dueIn)).length));
  const sel = buckets.find(b => b[0] === bk) || buckets[1];
  const selRows = rows.filter(r => sel[2](r.dueIn)).sort((a, b) => a.dueIn - b.dueIn);
  const split: [string, { n: number; value: number }, string][] = [["Secured", p.secured, "var(--ok)"], ["Tendering", p.tendering, "var(--warn)"], ["Unknown", p.unknown, "var(--faint)"]];
  const smax = Math.max(1, ...split.map(x => x[1].value));
  const est = estimatorLoad(s);
  const emax = Math.max(1, ...est.map(e => e.drawings));
  const qc = quoteStatusCounts(s);
  const lost = s.quotes.filter(q => q.status === "Lost");
  const onHold = s.quotes.filter(q => q.status === "On hold");
  return (
    <Grid>
      <Card span={4} title="Contractor project status" sub="Open Oranmore quotes, by where the contractor stands">
        <div className="om-col" style={{ gap: 12 }}>
          {split.map(([k, v, c]) => (
            <button key={k} className="fin-bucket" onClick={() => om.go("Commercial", "pipeline")}>
              <div className="om-row"><span className="om-small om-ink">{k}</span><span className="om-faint om-tiny">{v.n} quotes</span><span className="om-mono om-small" style={{ marginLeft: "auto" }}>{gbp(v.value)}</span></div>
              <Bar value={v.value} max={smax} color={c} />
            </button>
          ))}
          <div className="om-faint om-tiny">A contractor that has secured the main contract is a different signal from Oranmore winning the precast package. Values are quote values, net of VAT.</div>
        </div>
      </Card>
      <Card span={8} title="Quotations due" sub="Quotes not yet submitted, by deadline · click a bar">
        <div className="om-vbar" role="img" aria-label="Quotes due by deadline bucket">
          {buckets.map(([k, label, fn]) => {
            const n = rows.filter(r => fn(r.dueIn)).length;
            return (
              <div key={k} onClick={() => setBk(k)} style={{ cursor: "pointer" }} title={label + ": " + n}>
                <span className="om-mono om-small">{n}</span>
                <span className="col" style={{ height: Math.max(4, (n / bmax) * 110), background: k === "overdue" ? "var(--bad)" : k === "3d" ? "var(--warn)" : "var(--accent)", opacity: bk === k ? 1 : 0.55 }} />
                <span className="lbl" style={{ color: bk === k ? "var(--ink)" : undefined }}>{label}</span>
              </div>
            );
          })}
        </div>
        <div className="om-divider" />
        {selRows.length === 0 ? <div className="om-faint om-small">No quotes in this window.</div> : selRows.map(r => (
          <div key={r.e.id} className="om-row om-small" style={{ padding: "4px 0", flexWrap: "wrap" }}>
            <RefLink om={om} r={{ kind: "quote", id: r.q.id }} /><span className="om-ink">{r.account} · {r.dev}</span>
            <span className="om-faint">{r.e.estimator || "Unassigned"}</span>
            <span style={{ marginLeft: "auto" }} className="om-row"><Badge tone={r.overdue ? "bad" : r.dueSoon ? "warn" : "neutral"}>{r.overdue ? Math.abs(r.dueIn) + "d overdue" : "Due " + dayShort(r.e.due)}</Badge><span className="om-mono">{r.q.value ? gbpShort(r.q.value) : "Not priced"}</span></span>
          </div>
        ))}
      </Card>
      <Card span={6} title="Estimator workload" sub="Open estimates per person · drawing packages carried" flush>
        <Table rowKey={e => e.name} rows={est} onRow={() => om.go("Commercial", "workload")}
          cols={[
            { k: "n", label: "Estimator", render: e => <span className="ink">{e.name}</span> },
            { k: "o", label: "Open", align: "right", cls: "mono", render: e => e.rows.length },
            { k: "d", label: "Drawings", w: 150, render: e => <div className="om-row"><div style={{ flex: 1 }}><Bar value={e.drawings} max={emax} /></div><span className="om-mono om-tiny">{e.drawings}</span></div> },
            { k: "s", label: "≤3d", align: "right", render: e => e.soon ? <span style={{ color: "var(--warn)" }} className="om-mono">{e.soon}</span> : "—" },
            { k: "x", label: "Late", align: "right", render: e => e.overdue ? <span style={{ color: "var(--bad)" }} className="om-mono">{e.overdue}</span> : "—" },
            { k: "v", label: "Value", align: "right", cls: "mono", render: e => gbpShort(e.value) },
          ] as Col<typeof est[number]>[]} />
      </Card>
      <Card span={6} title="Outcomes" sub="Won, lost and on hold, with reasons">
        <div className="dash-stats">
          {(["Won", "Lost", "On hold"] as const).map(k => <button key={k} className="dash-stat" onClick={() => om.go("Commercial", "quotations")}><span className="om-faint om-tiny">{k}</span><b style={{ color: k === "Won" ? "var(--ok)" : k === "Lost" ? "var(--bad)" : "var(--warn)" }}>{qc[k]?.n || 0}</b><span className="om-faint om-tiny">{gbpShort(qc[k]?.value || 0)}</span></button>)}
        </div>
        <div className="om-col" style={{ gap: 6, marginTop: 12 }}>
          {lost.concat(onHold).map(q => { const e = byId(s.enquiries, q.enquiryId)!; return (
            <div key={q.id} className="om-row om-small"><RefLink om={om} r={{ kind: "quote", id: q.id }} /><span className="om-ink">{account(s, e.accountId)?.name}</span><span className="om-muted" style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.lostReason || q.history.slice(-1)[0]?.text || q.status}</span></div>
          ); })}
        </div>
      </Card>
      <Card span={12} title="Weighted pipeline by building" sub={"Competing contractors on one building are mutually exclusive: only the best weighted bid counts. Raw weighted " + gbp(p.rawWeighted) + ", counted " + gbp(p.deduped) + "."}
        right={<Badge tone="warn">{gbp(p.doubleCount)} double count removed</Badge>} flush>
        <Table rowKey={g => g.devId} rows={p.devGroups.slice().sort((a, b) => b.counted - a.counted)} onRow={g => om.open({ kind: "development", id: g.devId })}
          cols={[
            { k: "d", label: "Development", render: g => <><span className="ink">{g.dev}</span>{g.exclusive && <> <Badge tone="warn" dot={false}>{g.rows.length} competing bids</Badge></>}</> },
            { k: "c", label: "Contractors", render: g => g.rows.map(r => r.account + " (" + r.e.contractorStatus + ")").join(", ") },
            { k: "q", label: "Quote value", align: "right", cls: "mono", render: g => gbp(g.groupRaw) },
            { k: "x", label: "Excluded", align: "right", cls: "mono", render: g => g.excluded ? <span style={{ color: "var(--warn)" }}>−{gbp(g.excluded)}</span> : "—" },
            { k: "w", label: "Counted (weighted)", align: "right", cls: "mono", render: g => gbp(g.counted) },
          ] as Col<typeof p.devGroups[number]>[]} />
      </Card>
    </Grid>
  );
}

/* ── Plant ──────────────────────────────────────────────────────────────── */
function Plant({ om }: { om: Om }) {
  const s = om.s, c = capacityWeek(s);
  const weeks = WEEKS.map(w => capacityWeek(s, w));
  const pending = s.designs.filter(d => !d.released);
  const qa = s.lots.filter(l => l.qa === "Inspection pending" || l.qa === "On hold");
  const lastSync = s.designs.map(d => d.synced).concat(s.lots.map(l => l.synced)).sort().slice(-1)[0];
  const ithesis = s.events.filter(e => e.source === "iThesis").slice(0, 5);
  const bottlenecks: { id: string; tone: "bad" | "warn"; text: string; why: string; go: () => void }[] = [];
  s.orders.forEach(o => { const b = blockingOpen(s, o.id); if (b.length) bottlenecks.push({ id: "b" + o.id, tone: "bad", text: orderLabel(s, o) + ": design cannot start", why: b.length + " blocking RFIs (" + b.map(x => x.id).join(", ") + ")", go: () => om.go("Projects", "rfis", o.id) }); });
  pending.filter(d => d.status === "Awaiting client approval").forEach(d => bottlenecks.push({ id: "d" + d.id, tone: "warn", text: d.id + " " + d.revision + " awaiting client approval", why: "Production not released until sign-off, target " + dateShort(d.target), go: () => om.go("Plants & Planning", "design", d.id) }));
  qa.forEach(l => bottlenecks.push({ id: "q" + l.id, tone: l.qa === "On hold" ? "bad" : "warn", text: l.id + " QA " + l.qa.toLowerCase(), why: l.note, go: () => om.go("Plants & Planning", "quality", l.id) }));
  weeks.forEach(w => w.plants.forEach(p => { if (p.firm + p.tentative > p.cap) bottlenecks.push({ id: "c" + w.week + p.plant, tone: "warn", text: p.plant + " w/c " + dateShort(w.week) + " would exceed capacity if tentative work firms up", why: num(p.firm) + " firm + " + num(p.tentative) + " tentative of " + num(p.cap) + " m²", go: () => om.go("Plants & Planning", "scenarios") }); }));
  return (
    <Grid>
      <Card span={7} title={"Hollowcore this week · w/c " + dateShort(c.week)} sub={"Firm " + num(c.firm) + " of " + num(c.cap) + " m² (" + pct(c.pct) + "), " + num(c.free) + " m² free. Illustrative split of the published ~10,000 m²/week."}
        right={<Btn sm onClick={() => om.go("Plants & Planning", "capacity")}>Open capacity</Btn>}>
        <div className="om-col" style={{ gap: 16 }}>
          {c.plants.map(p => (
            <div key={p.plant}>
              <div className="om-row"><b style={{ fontSize: 13 }}>{p.plant}</b><span className="om-faint om-small">{num(p.firm)} / {num(p.cap)} m²</span><span className="om-mono om-small" style={{ marginLeft: "auto" }}>{pct(p.pct, 1)}</span></div>
              <div style={{ margin: "6px 0 8px" }}><Bar value={p.firm} max={p.cap} height={12} color={p.pct > 0.95 ? "var(--bad)" : undefined} /></div>
              <div className="om-row" style={{ flexWrap: "wrap", gap: 6 }}>
                {p.firmItems.map(i => <button key={i.id} className="om-chip" style={{ cursor: "pointer" }} onClick={() => om.open(i.ref)}>{i.label} <span className="om-mono om-faint">{num(i.m2)}</span></button>)}
              </div>
              {p.tentative > 0 && <div className="om-faint om-tiny" style={{ marginTop: 6 }}>Plus {num(p.tentative)} m² tentative, not counted.</div>}
            </div>
          ))}
        </div>
      </Card>
      <Card span={5} title="Six-week outlook" sub="Firm hollowcore as % of plant capacity · tentative in brackets">
        <div className="om-heat" style={{ gridTemplateColumns: "70px repeat(" + weeks.length + ",1fr)" }}>
          <div />{weeks.map(w => <div key={w.week} className="om-faint" style={{ fontSize: 10 }}>{dateShort(w.week)}</div>)}
          {(["Brandon", "Lound"] as const).map((pl, pi) => [
            <div key={pl} className="om-ink" style={{ textAlign: "left", fontWeight: 600 }}>{pl}</div>,
            ...weeks.map(w => { const p = w.plants[pi]; const v = p.pct; return (
              <div key={pl + w.week} title={num(p.firm) + " firm, " + num(p.tentative) + " tentative of " + num(p.cap) + " m²"}
                style={{ background: v > 0.95 ? "var(--bad-soft)" : v > 0.7 ? "var(--accent-soft)" : "var(--surface-faint)", color: v > 0.95 ? "var(--bad)" : "var(--ink)", border: "1px solid var(--border)" }}>
                {pct(v)}{p.tentative ? <div className="om-faint" style={{ fontSize: 9.5 }}>({pct(p.tentative / p.cap)})</div> : null}
              </div>
            ); }),
          ])}
        </div>
        <div className="om-divider" />
        <div className="om-eyebrow" style={{ marginBottom: 6 }}>Other lines, own basis (illustrative)</div>
        {OTHER_LINES.map(l => <div key={l.product} className="om-row om-tiny" style={{ padding: "3px 0" }}><span className="om-ink" style={{ width: 110 }}>{l.product}</span><span className="om-faint" style={{ width: 56 }}>{l.plant}</span><div style={{ flex: 1 }}><Bar value={l.committed} max={l.capacity} /></div><span className="om-mono" style={{ width: 120, textAlign: "right" }}>{num(l.committed)} / {num(l.capacity)} {l.unit}</span></div>)}
      </Card>
      <Card span={6} title="Bottlenecks" sub="What stops work reaching the beds or leaving the yard" flush>
        {bottlenecks.length === 0 ? <Empty title="No bottlenecks" /> : <div className="om-list">
          {bottlenecks.map(b => <button key={b.id} className="om-li" onClick={b.go}><Dot tone={b.tone} /><div style={{ minWidth: 0 }}><div className="om-small om-ink" style={{ fontWeight: 600 }}>{b.text}</div><div className="om-faint om-tiny">{b.why}</div></div></button>)}
        </div>}
      </Card>
      <Card span={6} title="Design approvals pending" sub="iThesis packages not yet released for production" flush>
        <Table rowKey={d => d.id} rows={pending} onRow={d => om.go("Plants & Planning", "design", d.id)}
          cols={[
            { k: "i", label: "Package", render: d => <span className="om-mono ink">{d.id} {d.revision}</span> },
            { k: "o", label: "Project", render: d => orderLabel(s, byId(s.orders, d.orderId)!) },
            { k: "s", label: "Status", render: d => <Badge>{d.status}</Badge> },
            { k: "t", label: "Target", render: d => dateShort(d.target) },
          ] as Col<typeof pending[number]>[]} />
      </Card>
      <Card span={6} title="iThesis snapshot" sub={"Illustrative read-only sync · last mock sync " + stamp(lastSync)} right={<Badge tone="warn">Connectivity to validate</Badge>} flush>
        <div className="om-list">
          {ithesis.map(e => <button key={e.id} className="om-li" onClick={() => om.open(e.ref)}><Badge tone="info" dot={false}>iThesis</Badge><div style={{ flex: 1, minWidth: 0 }}><div className="om-small om-ink" style={{ fontWeight: 600 }}>{e.title}</div><div className="om-faint om-tiny">{e.note}</div></div><span className="om-mono om-faint om-tiny">{stamp(e.at)}</span></button>)}
        </div>
      </Card>
      <Card span={6} title="QA, yard and readiness" sub="Production lots (iThesis snapshot) and their human QA state" flush>
        <Table rowKey={l => l.id} rows={s.lots.slice().sort((a, b) => (a.qa === "Released" ? 1 : 0) - (b.qa === "Released" ? 1 : 0))} onRow={l => om.go("Plants & Planning", "quality", l.id)} maxHeight={320}
          cols={[
            { k: "i", label: "Lot", render: l => <span className="om-mono ink">{l.id}</span> },
            { k: "p", label: "Plant", render: l => l.plant },
            { k: "s", label: "Production", render: l => <Badge>{l.status}</Badge> },
            { k: "q", label: "QA", render: l => <Badge>{l.qa}</Badge> },
            { k: "y", label: "Yard", render: l => <span className="om-muted">{l.yard}</span> },
          ] as Col<typeof s.lots[number]>[]} />
      </Card>
    </Grid>
  );
}

/* ── Logistics ──────────────────────────────────────────────────────────── */
function Logistics({ om }: { om: Om }) {
  const s = om.s, now = nowStamp(s);
  const statuses: LoadStatus[] = ["Planned", "Loaded", "Dispatched", "Arrival claimed", "POD submitted", "POD verified", "Exception"];
  const upcoming = s.loads.filter(l => ["Planned", "Loaded", "Dispatched"].includes(l.status)).sort((a, b) => a.collect.localeCompare(b.collect));
  const risk = (l: Load) => {
    const r: string[] = [];
    const lots = s.lots.filter(x => l.lotIds.includes(x.id));
    if (lots.some(x => x.qa !== "Released")) r.push("QA not released");
    if (lots.some(x => x.status !== "Complete")) r.push("Lot not cast");
    if (/TBC/.test(l.driver)) r.push("Driver TBC");
    if (l.status === "Dispatched" && l.deliver.split(" ")[0] <= now.slice(0, 10)) r.push("Due today");
    return r;
  };
  const q = podQueue(s);
  return (
    <Grid>
      <Card span={12} title="Load status" sub="Outsourced haulage · claims, proofs and verified deliveries are counted separately">
        <div className="dash-stats">
          {statuses.map(k => { const n = s.loads.filter(l => l.status === k).length; return (
            <button key={k} className="dash-stat" onClick={() => om.go("Logistics", ["Arrival claimed", "POD submitted", "Exception"].includes(k) ? "pod" : "loads")}>
              <span className="om-faint om-tiny">{k}</span><b style={{ color: (k === "Arrival claimed" || k === "Exception") && n ? "var(--bad)" : k === "POD submitted" && n ? "var(--warn)" : k === "POD verified" ? "var(--ok)" : undefined }}>{n}</b>
            </button>
          ); })}
        </div>
      </Card>
      <Card span={8} title="Upcoming and moving loads" sub="Collection order · at-risk flags derived from QA, casting and driver booking" flush>
        <Table rowKey={l => l.id} rows={upcoming} onRow={l => om.go("Logistics", "loads", l.id)}
          cols={[
            { k: "i", label: "Load", render: l => <span className="om-mono ink">{l.id}</span> },
            { k: "p", label: "Project", render: l => { const o = byId(s.orders, l.orderId)!; return <><div className="ink">{account(s, o.accountId)?.name}</div><div className="om-faint om-tiny">{l.plant} → {dev(s, o.devId)?.name}</div></>; } },
            { k: "c", label: "Carrier", render: l => <span className="om-muted">{carrierOf(s, l)?.name}</span> },
            { k: "t", label: "Collect", render: l => stamp(l.collect) },
            { k: "s", label: "Status", render: l => <Badge>{l.status}</Badge> },
            { k: "r", label: "Risk", render: l => { const r = risk(l); return r.length ? <Badge tone="warn">{r.join(" · ")}</Badge> : <span className="om-faint">Ready</span>; } },
          ] as Col<Load>[]} />
      </Card>
      <Card span={4} title="Carrier assignments" sub="Illustrative partners · on-time figures are mock" flush>
        <div className="om-list">
          {s.carriers.map(c => { const act = s.loads.filter(l => l.carrierId === c.id && l.status !== "POD verified"); return (
            <button key={c.id} className="om-li" onClick={() => om.go("Logistics", "carriers", c.id)}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="om-row"><span className="om-small om-ink" style={{ fontWeight: 600 }}>{c.name.replace(" (illustrative)", "")}</span><span className="om-mono om-tiny" style={{ marginLeft: "auto" }}>{act.length} active</span></div>
                <div className="om-faint om-tiny">{c.base} · on-time {c.onTime}% (mock){c.issues.length ? " · " + c.issues.length + " open issue" : ""}</div>
              </div>
            </button>
          ); })}
        </div>
      </Card>
      <Card span={12} title="Evidence queue" sub="Loads a person still has to check before anything is invoiced" flush>
        <Table rowKey={x => x.l.id} rows={q} onRow={x => om.go("Logistics", "pod", x.l.id)}
          cols={[
            { k: "i", label: "Load", render: x => <span className="om-mono ink">{x.l.id}</span> },
            { k: "p", label: "Project", render: x => orderLabel(s, byId(s.orders, x.l.orderId)!) },
            { k: "s", label: "State", render: x => <Badge>{x.l.status === "Arrival claimed" ? "Claimed, no POD" : x.l.status}</Badge> },
            { k: "e", label: "Evidence", render: x => <span className="om-muted om-small">{x.l.pod.photo ? "Photo" : "No photo"} · {x.l.pod.receiver ? "receiver " + x.l.pod.receiver : "no receiver"} · {x.l.pod.signature ? "signed" : "unsigned"}</span> },
            { k: "h", label: "Since claim", align: "right", cls: "mono", render: x => x.hours + "h" },
            { k: "v", label: "Invoice held", align: "right", cls: "mono", render: x => x.invoice ? gbp(x.invoice.net) : "—" },
          ] as Col<typeof q[number]>[]} />
      </Card>
    </Grid>
  );
}

/* ── Finance ────────────────────────────────────────────────────────────── */
function FinanceDash({ om }: { om: Om }) {
  const s = om.s, f = financeTotals(s);
  const parts: [string, number, string][] = [["Invoice-ready", f.readyValue, "var(--ok)"], ["Eligible", f.eligibleValue, "var(--warn)"], ["Held", f.heldValue, "var(--bad)"], ["Handoff simulated", f.handedValue, "#8fa0ae"]];
  const total = Math.max(1, parts.reduce((t, p) => t + p[1], 0));
  const bmax = Math.max(1, ...f.buckets.map(b => b.value));
  const notReady = s.loads.filter(l => ["Arrival claimed", "POD submitted", "Exception", "POD verified"].includes(l.status))
    .map(l => ({ l, inv: byId(s.invoices, l.invoiceId) })).filter(x => x.inv && (x.inv.stage === "Held" || x.inv.stage === "Eligible"));
  const ex = sageExceptions(s);
  const weeks = weeklyReceipts(s, 8);
  const wmax = Math.max(1, ...weeks.map(w => w.issued + w.queued));
  return (
    <Grid>
      <Card span={5} title="Eligible vs blocked" sub="Delivery-linked drafts, net of VAT">
        <div style={{ display: "flex", height: 16, borderRadius: 999, overflow: "hidden", background: "var(--track)" }} role="img" aria-label="Share of draft value by stage">
          {parts.map(p => <span key={p[0]} title={p[0] + ": " + gbp(p[1])} style={{ width: (p[1] / total) * 100 + "%", background: p[2] }} />)}
        </div>
        <div className="om-col" style={{ gap: 6, marginTop: 12 }}>
          {parts.map(p => <button key={p[0]} className="fin-bucket" onClick={() => om.go("Finance", "readiness")}><div className="om-row om-small"><i className="fin-sw" style={{ background: p[2] }} />{p[0]}<span className="om-mono" style={{ marginLeft: "auto" }}>{gbp(p[1])}</span></div></button>)}
        </div>
      </Card>
      <Card span={7} title="Debtor aging (demo)" sub="Issued invoices in the illustrative Sage snapshot · sample records, not real debts">
        <div className="om-col" style={{ gap: 10 }}>
          {f.buckets.map(b => (
            <button key={b.label} className="fin-bucket" onClick={() => om.go("Finance", "debtors")}>
              <div className="om-row"><span className="om-small">{b.label}</span><span className="om-faint om-tiny">{b.items.length} inv</span><span className="om-mono om-small" style={{ marginLeft: "auto" }}>{gbp(b.value)}</span></div>
              <Bar value={b.value} max={bmax} color={/60/.test(b.label) ? "var(--bad)" : /31/.test(b.label) ? "var(--warn)" : undefined} />
            </button>
          ))}
        </div>
      </Card>
      <Card span={6} title="Delivered, not yet invoice-ready" sub="Loads past the gate or awaiting proof, with the draft they hold" flush>
        {notReady.length === 0 ? <Empty title="Nothing waiting" /> : <div className="om-list">
          {notReady.map(x => (
            <div key={x.l.id} className="om-li">
              <Dot tone={x.inv!.stage === "Held" ? "bad" : "warn"} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="om-row" style={{ gap: 8 }}><RefLink om={om} r={{ kind: "load", id: x.l.id }} /><span className="om-small om-ink">{orderLabel(s, byId(s.orders, x.l.orderId)!)}</span></div>
                <div className="om-faint om-tiny">{x.l.status} · {x.inv!.id} {x.inv!.stage}{x.inv!.hold ? ": " + x.inv!.hold : ""}</div>
              </div>
              <span className="om-mono om-small">{gbp(x.inv!.net)}</span>
              <Btn sm onClick={() => x.inv!.stage === "Eligible" ? om.go("Finance", "readiness", x.inv!.id) : om.go("Logistics", "pod", x.l.id)}>{x.inv!.stage === "Eligible" ? "Release" : "Review POD"}</Btn>
            </div>
          ))}
        </div>}
      </Card>
      <Card span={6} title="Sage reconciliation exceptions" sub="Illustrative integration · not connected" flush right={<Btn sm onClick={() => om.go("Finance", "sage")}>Open</Btn>}>
        {ex.length === 0 ? <Empty title="Everything reconciles" /> : <div className="om-list">
          {ex.map(x => <button key={x.id} className="om-li" onClick={() => om.open({ kind: "invoice", id: x.invId })}><Dot tone={x.tone === "info" ? "info" : x.tone} /><div style={{ minWidth: 0 }}><div className="om-small om-ink" style={{ fontWeight: 600 }}>{x.title}</div><div className="om-faint om-tiny">{x.note}</div></div></button>)}
        </div>}
      </Card>
      <Card span={12} title="Expected receipts" sub="Issued invoices by due date plus queued drafts on 30-day terms · held drafts excluded · net of VAT"
        right={<Btn sm onClick={() => om.go("Finance", "forecast")}>Open forecast</Btn>}>
        <div className="om-vbar" role="img" aria-label="Expected receipts by week">
          {weeks.map(w => { const v = w.issued + w.queued; return (
            <div key={w.week} title={"w/c " + dateShort(w.week) + ": " + gbp(v)} style={{ cursor: "pointer" }} onClick={() => { om.setUi("sel:Finance:forecast", w.week); om.go("Finance", "forecast"); }}>
              <span className="om-mono om-tiny">{v ? gbpShort(v) : "—"}</span>
              <span className="col" style={{ height: Math.max(3, (v / wmax) * 110) }}>
                <i style={{ display: "block", height: v ? (w.issued / v) * 100 + "%" : 0, background: "var(--ok)" }} />
                <i style={{ display: "block", height: v ? (w.queued / v) * 100 + "%" : 0, background: "var(--accent)" }} />
              </span>
              <span className="lbl">{dateShort(w.week)}</span>
            </div>
          ); })}
        </div>
        <div className="dash-legend" style={{ marginTop: 8 }}><span><i style={{ background: "var(--ok)" }} />Issued, due</span><span><i style={{ background: "var(--accent)" }} />Queued drafts</span></div>
      </Card>
    </Grid>
  );
}
