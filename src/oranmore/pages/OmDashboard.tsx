/* Dashboard body below the KPI band. One composition per top-bar tab, all
   derived from the shared state, every element drilling into a record or module. */
import type { Om, Col } from "../ui";
import { Card, Grid, Btn, Badge, Bar, Table, RefLink, Empty, useUi, Dot, MetricGroup, drill, Kpi, type MetricDef } from "../ui";
import { ConstraintStrip } from "../Constraints";
import type { Load, LoadStatus } from "../types";
import { WEEKS, OTHER_LINES, COVERAGE } from "../fixtures";
import {
  journey, attention, capacityWeek, quoteStatusCounts, pipeline, enquiryRows, estimatorLoad, financeTotals, podQueue,
  orderLabel, account, dev, byId, carrierOf, PRE_SUBMIT, blockingOpen, nowStamp, kpis, approvals, constraints, turnaround, carrierStats,
} from "../selectors";
import { gbp, gbpShort, num, pct, dateShort, stamp, dayShort, daysBetween, hoursSince } from "../format";
import { weeklyReceipts, sageExceptions } from "./finance/shared";
import "../../styles/om-fin.css";

export default function OmDashboard({ om }: { om: Om }) {
  const t = om.sub;
  return (
    <div className="om-page om-dash-space" style={{ paddingTop: 18 }}>
      {t === "executive" && <Executive om={om} />}
      {t === "commercial" && <Commercial om={om} />}
      {t === "plant" && <Plant om={om} />}
      {t === "logistics" && <Logistics om={om} />}
      {t === "finance" && <FinanceDash om={om} />}
    </div>
  );
}

const BUCKET_KEY: Record<string, string> = { "Not yet due": "due", "1-30 days over": "30", "31-60 days over": "31", "Over 60 days": "60" };
const STATE_LABEL: Record<string, string> = { done: "Done", active: "In progress", waiting: "Waiting", blocked: "Blocked", pending: "Not started" };

/* ── shared metric sets ─────────────────────────────────────────────────── */
const INQ_ALL = { "f:inq:status": "all", "f:inq:est": "all" };
function useMetrics(om: Om) {
  const s = om.s, k = kpis(s), f = financeTotals(s), c = capacityWeek(s), p = pipeline(s);
  const now = nowStamp(s);
  const week = s.loads.filter(l => l.collect >= "2026-11-09" && l.collect < "2026-11-16");
  const moving = s.loads.filter(l => l.status === "Dispatched" || l.status === "Loaded");
  const tbc = s.loads.filter(l => l.status === "Planned" && /TBC/.test(l.driver));
  const claimed = s.loads.filter(l => l.status === "Arrival claimed");
  const podReview = s.loads.filter(l => l.status === "POD submitted" || l.status === "Exception");
  const qa = s.lots.filter(l => l.qa === "Inspection pending" || l.qa === "On hold");
  const designs = s.designs.filter(d => !d.released);
  const overdue = f.debt.filter(d => d.daysOver > 0);
  const over60 = f.debt.filter(d => d.daysOver > 60);
  const paid = s.invoices.filter(i => i.stage === "Paid" && i.issued && i.paid);
  const dtp = paid.length ? Math.round(paid.reduce((t, i) => t + daysBetween(i.issued!, i.paid!), 0) / paid.length) : 0;
  const due30 = weeklyReceipts(s, 5).slice(0, 5).reduce((t, w) => t + w.issued + w.queued, 0);
  const won = s.quotes.filter(q => q.status === "Won").length, lost = s.quotes.filter(q => q.status === "Lost").length;
  const unassigned = enquiryRows(s).filter(r => PRE_SUBMIT.includes(r.q.status) && !r.e.estimator);
  const sum = (xs: { inv: { net: number } }[]) => xs.reduce((t, d) => t + d.inv.net, 0);
  const sumSum = (xs: Load[]) => xs.reduce((t, l) => t + l.tonnes, 0);
  const ta = turnaround(s);
  const cs = carrierStats(s);
  const tight = OTHER_LINES.slice().sort((a, b) => b.committed / b.capacity - a.committed / a.capacity)[0];
  const M = {
    openQuotes: { label: "Open quotations", value: k.openQuotes, sub: gbpShort(k.openQuoteValue) + " indicative", to: { page: "Commercial", tab: "quotations", ui: { "f:quo": "open" } } },
    due3: { label: "Quotes due ≤3 days", value: k.due3, sub: k.overdue + " already overdue", tone: k.due3 || k.overdue ? "warn" : undefined, to: { page: "Commercial", tab: "inquiries", ui: { ...INQ_ALL, "f:inq:due": "soon" } } },
    overdueQ: { label: "Quotes overdue", value: k.overdue, sub: "past the tender date", tone: k.overdue ? "bad" : "ok", to: { page: "Commercial", tab: "inquiries", ui: { ...INQ_ALL, "f:inq:due": "overdue" } } },
    unassigned: { label: "Unassigned enquiries", value: unassigned.length, sub: "no estimator yet", tone: unassigned.length ? "warn" : "ok", to: { page: "Commercial", tab: "workload" } },
    pipeline: { label: "Weighted pipeline", value: gbpShort(p.deduped), sub: "one bid per building", to: { page: "Commercial", tab: "pipeline" } },
    openValue: { label: "Open quote value", value: gbpShort(k.openQuoteValue), sub: p.open.length + " live bids", to: { page: "Commercial", tab: "quotations", ui: { "f:quo": "open" } } },
    secured: { label: "Secured contractors", value: gbpShort(p.secured.value), sub: p.secured.n + " bids where the main contract is won", tone: "ok", to: { page: "Commercial", tab: "pipeline" } },
    winRate: { label: "Win rate (decided)", value: won + lost ? pct(won / (won + lost)) : "·", sub: won + " won, " + lost + " lost", to: { page: "Commercial", tab: "quotations", ui: { "f:quo": "closed" } } },
    tat: { label: "Days, enquiry to quote", value: ta.avgDays, sub: "average over " + ta.sent + " quotes sent", to: { page: "Commercial", tab: "workload" } },
    onTimeQ: { label: "Returned by tender date", value: pct(ta.onTimePct), sub: ta.onTime + " of " + ta.sent + " on time", tone: ta.onTimePct < 0.8 ? "warn" : "ok", to: { page: "Commercial", tab: "quotations", ui: { "f:quo": "all" } } },
    stale: { label: "Bid status stale", value: ta.stale.length, sub: "no update in 14+ days", tone: ta.stale.length ? "warn" : "ok", to: { page: "Commercial", tab: "quotations", ui: { "f:quo": "open" } } },
    sentCount: { label: "Quotes sent", value: ta.sent, sub: "all time in the snapshot", to: { page: "Commercial", tab: "quotations", ui: { "f:quo": "all" } } },
    orders: { label: "Won orders", value: k.wonOrders, sub: gbpShort(k.wonValue) + " contract value", tone: "accent", to: { page: "Projects", tab: "awards" } },
    blocked: { label: "Orders blocked", value: k.blockedOrders.length, sub: "before production starts", tone: k.blockedOrders.length ? "bad" : "ok", to: { page: "Projects", tab: "overview" } },
    rfis: { label: "Blocking RFIs", value: k.rfiBlocking, sub: "waiting on customers", tone: k.rfiBlocking ? "bad" : "ok", to: { page: "Projects", tab: "rfis" } },
    designs: { label: "Designs not released", value: designs.length, sub: designs.filter(d => d.status === "Awaiting client approval").length + " awaiting client approval", tone: designs.length ? "warn" : "ok", to: { page: "Plants & Planning", tab: "design" } },
    hc: { label: "Hollowcore committed", value: pct(c.pct), sub: num(c.firm) + " of " + num(c.cap) + " m² this week", tone: c.pct > 0.95 ? "bad" : c.pct > 0.85 ? "warn" : undefined, to: { page: "Plants & Planning", tab: "capacity", ui: { "plants:capProduct": "Hollowcore" } } },
    brandon: { label: "Brandon", value: pct(c.plants[0].pct), sub: num(c.plants[0].firm) + " / " + num(c.plants[0].cap) + " m²", to: { page: "Plants & Planning", tab: "capacity", ui: { "plants:capProduct": "Hollowcore" } } },
    lound: { label: "Lound", value: pct(c.plants[1].pct, 1), sub: num(c.plants[1].firm) + " / " + num(c.plants[1].cap) + " m²", to: { page: "Plants & Planning", tab: "capacity", ui: { "plants:capProduct": "Hollowcore" } } },
    free: { label: "Free hollowcore", value: num(c.free) + " m²", sub: "after firm commitments", tone: "ok", to: { page: "Plants & Planning", tab: "capacity", ui: { "plants:capProduct": "Hollowcore" } } },
    tent: { label: "Tentative, not booked", value: num(c.tentative) + " m²", sub: "waiting on design or RFIs", to: { page: "Plants & Planning", tab: "scenarios" } },
    qa: { label: "QA awaiting sign-off", value: qa.length, sub: qa.filter(l => l.qa === "On hold").length + " on hold", tone: qa.length ? "warn" : "ok", to: { page: "Plants & Planning", tab: "quality", ui: { "sel:Plants & Planning:quality": qa[0]?.id } } },
    casting: { label: "Lots casting or scheduled", value: s.lots.filter(l => l.status === "Casting" || l.status === "Scheduled").length, sub: "iThesis snapshot", to: { page: "Plants & Planning", tab: "production" } },
    readyLots: { label: "Ready to dispatch", value: s.lots.filter(l => l.status === "Complete" && l.qa === "Released" && !/Delivered|Dispatched/.test(l.yard)).length, sub: "cast and QA released", tone: "ok", to: { page: "Plants & Planning", tab: "production" } },
    line: { label: "Tightest other line", value: pct(tight.committed / tight.capacity), sub: tight.product + " at " + tight.plant, tone: tight.committed / tight.capacity > 0.9 ? "warn" : undefined, to: { page: "Plants & Planning", tab: "capacity", ui: { "plants:capProduct": tight.product } } },
    loads: { label: "Loads this week", value: week.length, sub: num(sumSum(week)) + " t to collect", to: { page: "Logistics", tab: "planner" } },
    moving: { label: "Moving now", value: moving.length, sub: "loaded or on the road", tone: "accent", to: { page: "Logistics", tab: "loads", ui: { "log:loadFilter": "Dispatched" } } },
    tbc: { label: "Drivers not booked", value: tbc.length, sub: tbc.filter(l => hoursSince(now, l.collect) <= 72).length + " collect within 72 h", tone: tbc.length ? "warn" : "ok", to: { page: "Logistics", tab: "planner" } },
    claimed: { label: "Claimed, no POD", value: claimed.length, sub: claimed[0] ? claimed[0].id + " oldest" : "none", tone: claimed.length ? "bad" : "ok", to: { page: "Logistics", tab: "pod", ui: { "sel:Logistics:pod": claimed[0]?.id } } },
    podReview: { label: "POD review pending", value: podReview.length, sub: "evidence to check", tone: podReview.length ? "warn" : "ok", to: { page: "Logistics", tab: "pod", ui: { "sel:Logistics:pod": podReview[0]?.id } } },
    verified: { label: "POD verified", value: s.loads.filter(l => l.status === "POD verified").length, sub: "accepted by a person", tone: "ok", to: { page: "Logistics", tab: "loads", ui: { "log:loadFilter": "POD verified" } } },
    carriers: { label: "Hauliers in use", value: new Set(s.loads.filter(l => l.status !== "POD verified").map(l => l.carrierId)).size, sub: "of " + s.carriers.length + " on the panel", to: { page: "Logistics", tab: "carriers" } },
    onTime: { label: "Delivered in window", value: pct(cs.onTimePct), sub: cs.onTime + " of " + cs.delivered + " deliveries · POD in " + cs.podHours + " h avg", tone: cs.onTimePct < 0.85 ? "warn" : "ok", to: { page: "Logistics", tab: "carriers" } },
    hiab: { label: "Crane-offload loads", value: s.loads.filter(l => /HIAB/.test(l.trailer) && l.status === "Planned").length, sub: "need a HIAB vehicle", to: { page: "Logistics", tab: "planner" } },
    ready: { label: "Invoice-ready", value: gbpShort(f.readyValue), sub: f.ready.length + " drafts, POD verified", tone: "ok", to: { page: "Finance", tab: "readiness" } },
    eligible: { label: "Eligible to release", value: gbpShort(f.eligibleValue), sub: f.eligible.length + " drafts", tone: f.eligible.length ? "warn" : undefined, to: { page: "Finance", tab: "readiness" } },
    held: { label: "Held on proof", value: gbpShort(f.heldValue), sub: f.held.length + " drafts waiting on POD or a query", tone: f.held.length ? "bad" : "ok", to: { page: "Finance", tab: "readiness" } },
    sage: { label: "Open Sage invoices", value: gbpShort(f.issuedValue), sub: f.issued.length + " issued (snapshot)", to: { page: "Finance", tab: "debtors", ui: { "fin:debtBucket": "all" } } },
    overdue: { label: "Debtors overdue", value: gbpShort(sum(overdue)), sub: overdue.length + " invoices past due", tone: overdue.length ? "warn" : "ok", to: { page: "Finance", tab: "debtors", ui: { "fin:debtBucket": "overdue" } }, hint: "Old invoices" },
    over60: { label: "Over 60 days", value: gbpShort(sum(over60)), sub: over60.length + " invoice" + (over60.length === 1 ? "" : "s") + " to chase", tone: over60.length ? "bad" : "ok", to: { page: "Finance", tab: "debtors", ui: { "fin:debtBucket": "60" } }, hint: "Old invoices" },
    dtp: { label: "Avg days to pay", value: dtp + " days", sub: "on " + paid.length + " paid invoices", to: { page: "Finance", tab: "sage" } },
    unbilled: { label: "Unbilled contract", value: gbpShort(f.unbilled), sub: "awarded, not yet invoiced", to: { page: "Finance", tab: "forecast" } },
    due30: { label: "Cash due, 5 weeks", value: gbpShort(due30), sub: "issued plus queued drafts", tone: "accent", to: { page: "Finance", tab: "forecast" } },
  } satisfies Record<string, MetricDef>;
  return M as Record<keyof typeof M, MetricDef>;
}

/* ── Executive ──────────────────────────────────────────────────────────── */
function Executive({ om }: { om: Om }) {
  const s = om.s, M = useMetrics(om);
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
  return (
    <>
      <MetricGroup om={om} title="Commercial" note="Click any box to open the list behind it" items={[M.openQuotes, M.due3, M.pipeline, M.orders]} />
      <MetricGroup om={om} title="Projects & plant" items={[M.blocked, M.rfis, M.hc, M.qa]} />
      <MetricGroup om={om} title="Fleet & logistics" items={[M.loads, M.moving, M.tbc, M.claimed]} />
      <MetricGroup om={om} title="Finance" items={[M.ready, M.held, M.overdue, M.over60]} />
      <Grid>
        <ConstraintStrip om={om} />
        <Card span={7} title="Top risks" sub="Across commercial, design, transport and finance · click to open" flush>
          {risks.length === 0 ? <Empty title="No open risks" /> : <div className="om-list">
            {risks.map(r => (
              <button key={r.id} className="om-li" onClick={() => drill(om, { page: r.module, tab: r.tab, ui: { ["sel:" + r.module + ":" + r.tab]: r.ref.id } })}>
                <Dot tone={r.tone === "info" ? "info" : r.tone} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="om-small om-ink" style={{ fontWeight: 600 }}>{r.title}</div>
                  <div className="om-faint om-tiny">{r.why}</div>
                </div>
                <span className="om-faint om-tiny" style={{ whiteSpace: "nowrap" }}>{r.module} →</span>
              </button>
            ))}
          </div>}
        </Card>
        <Card span={5} title="Order flow, enquiry to invoice" sub="Records at or past each step · click to open">
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
        <Coverage om={om} />
        <Departments om={om} />
        <EnteredOnce om={om} />
        <Card span={12} title="Every order, every handoff" sub="Click a project for its journey, or a cell for the record behind it"
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
      </Grid>
    </>
  );
}

/* Where Pulse wraps iThesis: the process map from the discovery call. */
function Coverage({ om }: { om: Om }) {
  return (
    <Card span={7} title="Where Pulse wraps around iThesis" sub="Grey is what iThesis covers today, colour is the gap Pulse fills · click a step to open it">
      <div className="vz-tiles" style={{ gridTemplateColumns: "repeat(3,minmax(0,1fr))" }}>
        {COVERAGE.map(c => (
          <button key={c.step} className="vz-tile" onClick={() => om.go(c.page, c.tab)} title={c.pulse}>
            <div className="t"><b>{c.step}</b></div>
            <div className="vz-split"><i style={{ width: c.ithesis + "%", background: "var(--neutral)" }} /><i style={{ width: 100 - c.ithesis + "%", background: c.ithesis >= 75 ? "color-mix(in srgb,var(--accent) 35%,transparent)" : "var(--accent)" }} /></div>
            <div className="f"><span>iThesis {c.ithesis}%</span><span style={{ color: c.ithesis < 50 ? "var(--accent)" : undefined }}>Pulse {100 - c.ithesis}%</span></div>
            <div className="d">{c.pulse}</div>
          </button>
        ))}
      </div>
      <div className="vz-legend" style={{ marginTop: 12 }}><span><i style={{ background: "var(--neutral)" }} />iThesis today</span><span><i style={{ background: "var(--accent)" }} />Pulse fills</span><span>From the 04 Nov process map, to qualify with the head of commercial</span></div>
    </Card>
  );
}

/* One line per department head: what is open, waiting on them, late, and how loaded the step is. */
const DEPTS: { dept: string; head: string; tasks: string[]; ap: string[]; area: string; page: string; tab: string }[] = [
  { dept: "Commercial", head: "Head of commercial", tasks: ["Commercial", "Estimating"], ap: ["Commercial", "Estimating"], area: "Commercial", page: "Commercial", tab: "quotations" },
  { dept: "Design", head: "Head of design", tasks: ["Design"], ap: ["Design"], area: "Design", page: "Plants & Planning", tab: "design" },
  { dept: "Plant", head: "Plant managers", tasks: ["Plant Operations"], ap: ["Plant Operations"], area: "Plant", page: "Plants & Planning", tab: "capacity" },
  { dept: "Quality & yard", head: "QA lead", tasks: ["Quality/Yard"], ap: ["Quality/Yard"], area: "Quality", page: "Plants & Planning", tab: "quality" },
  { dept: "Transport", head: "Head of transport", tasks: ["Transport"], ap: ["Transport"], area: "Logistics", page: "Logistics", tab: "planner" },
  { dept: "Finance", head: "Head of finance", tasks: ["Finance"], ap: ["Finance"], area: "Finance", page: "Finance", tab: "readiness" },
];
function Departments({ om }: { om: Om }) {
  const s = om.s, ap = approvals(s), k = constraints(s);
  const rows = DEPTS.map(d => {
    const tasks = s.tasks.filter(x => d.tasks.includes(x.dept) && x.status !== "Done");
    const late = tasks.filter(x => x.due < "2026-11-09");
    const waiting = ap.filter(a => d.ap.includes(a.dept));
    const c = k.filter(x => x.area === d.area).sort((a, b) => b.load - a.load)[0];
    return { ...d, tasks, late, waiting, c };
  });
  const tone = (c?: typeof k[number]) => (c?.tone === "bad" ? "var(--bad)" : c?.tone === "warn" ? "var(--warn)" : "var(--accent)");
  return (
    <Card span={5} title="By department" sub="How loaded each team's step is, and what is waiting on them" flush>
      <div className="vz-rows">
        {rows.map(r => (
          <button key={r.dept} className="vz-row" style={{ gridTemplateColumns: "minmax(100px,1fr) minmax(90px,1.1fr) 150px" }} onClick={() => om.go(r.page, r.tab)}>
            <span className="vz-name"><b>{r.dept}</b><span>{r.head}</span></span>
            <span className="vz-meter"><span className="lbl"><span>Load</span><span className="om-mono" style={{ color: r.c && r.c.tone !== "ok" ? tone(r.c) : undefined }}>{r.c ? pct(r.c.load) : "·"}</span></span><Bar value={Math.min(r.c?.load || 0, 1.5)} max={1.5} marker={1} color={tone(r.c)} height={6} /></span>
            <span className="vz-pills">
              <span className="vz-pill"><b>{r.tasks.length}</b>open</span>
              {r.late.length > 0 && <span className="vz-pill bad"><b>{r.late.length}</b>late</span>}
              {r.waiting.length > 0 && <span className="vz-pill warn"><b>{r.waiting.length}</b>to sign</span>}
            </span>
          </button>
        ))}
      </div>
      <div className="om-kpis" style={{ padding: "14px 18px 16px", gridTemplateColumns: "repeat(3,minmax(0,1fr))" }}>
        <Kpi label="Open tasks" value={rows.reduce((t, r) => t + r.tasks.length, 0)} sub={rows.reduce((t, r) => t + r.late.length, 0) + " past due"} onClick={() => om.go("Records")} />
        <Kpi label="Sign-offs waiting" value={ap.length} sub="human gates only" tone={ap.length ? "warn" : "ok"} />
        <Kpi label="Binding step" value={pct(k[0].load)} sub={k[0].area + " · " + k[0].step.toLowerCase()} tone={k[0].tone} onClick={() => om.go("Plants & Planning", "constraints")} />
      </div>
    </Card>
  );
}

/* What no longer gets re-keyed: every record carried forward instead of typed again. */
function EnteredOnce({ om }: { om: Om }) {
  const s = om.s;
  const inherited = s.orders.reduce((t, o) => t + o.contract.filter(f => f.inherited).length, 0);
  const items: [string, number, number, string, string, string][] = [
    ["Enquiries logged from email", s.enquiries.filter(e => e.source === "Email" || e.source === "Tender portal").length, 12, "fields read, not typed", "Commercial", "inquiries"],
    ["Contract fields carried from the quote", inherited, 3, "per field, into the Contract Detail Summary", "Projects", "contract"],
    ["Letters and RFIs prefilled", s.docs.length + s.rfis.length, 8, "per document", "Projects", "rfis"],
    ["Loads synced from the planner", s.loads.length, 4, "no second spreadsheet", "Logistics", "loads"],
    ["Proof captured by the carrier", s.loads.filter(l => l.pod.submitted).length, 10, "no chasing calls", "Logistics", "pod"],
    ["Invoice drafts from verified POD", s.invoices.filter(i => i.loadId).length, 15, "per draft, matched to the load", "Finance", "readiness"],
  ];
  const mins = items.reduce((t, x) => t + x[1] * x[2], 0);
  return (
    <Card span={12} title="Entered once, used everywhere" sub={"Records Pulse carried forward instead of someone re-keying them · about " + Math.round(mins / 60) + " hours of manual entry so far this snapshot (illustrative minutes per item)"}>
      <div className="om-once">
        {items.map(([label, n, m, note, page, tab]) => (
          <button key={label} onClick={() => om.go(page, tab)}>
            <b>{n}</b>
            <span className="om-small om-ink">{label}</span>
            <span className="om-faint om-tiny">{note} · ~{m} min each</span>
          </button>
        ))}
      </div>
    </Card>
  );
}

/* ── Commercial ─────────────────────────────────────────────────────────── */
function StaleBids({ om }: { om: Om }) {
  const st = turnaround(om.s).stale;
  return (
    <Card span={12} title="Bid status not updated" sub="Quotes out with the contractor and no status change in 14+ days. Won, lost and on-hold should never wait in a salesperson's inbox." flush
      right={<Badge tone={st.length ? "warn" : "ok"}>{st.length} to chase</Badge>}>
      {st.length === 0 ? <Empty title="Every live bid has a recent status" /> : (
        <Table rowKey={x => x.r.q.id} rows={st} onRow={x => om.open({ kind: "quote", id: x.r.q.id })} cols={[
          { k: "q", label: "Quote", render: x => <RefLink om={om} r={{ kind: "quote", id: x.r.q.id }} /> },
          { k: "p", label: "Project", render: x => <><div className="ink">{x.r.dev}</div><div className="om-faint om-tiny">{x.r.account} · contractor {x.r.e.contractorStatus.toLowerCase()}</div></> },
          { k: "e", label: "Owner", render: x => <span className="om-muted">{x.r.e.estimator || "Unassigned"}</span> },
          { k: "s", label: "Status", render: x => <Badge>{x.r.q.status}</Badge> },
          { k: "d", label: "Days silent", align: "right", cls: "mono", render: x => <span style={{ color: x.days > 30 ? "var(--bad)" : "var(--warn)" }}>{x.days}</span> },
          { k: "v", label: "Value", align: "right", cls: "mono", render: x => gbpShort(x.r.q.value) },
          { k: "a", label: "", align: "right", render: x => { const done = om.s.tasks.some(tk => tk.title === "Update bid status: " + x.r.q.id && tk.status !== "Done"); return <span onClick={e => e.stopPropagation()}>{done ? <Badge tone="ok">Reminder set</Badge> : <Btn sm onClick={() => { om.do.addTask("Update bid status: " + x.r.q.id, x.r.e.estimator || "Commercial lead", { kind: "quote", id: x.r.q.id }); om.toast("Reminder set for " + (x.r.e.estimator || "the commercial lead") + ". Logged to Activity."); }}>Remind owner</Btn>}</span>; } },
        ]} />
      )}
    </Card>
  );
}

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
  const M = useMetrics(om);
  const est = estimatorLoad(s);
  const emax = Math.max(1, ...est.map(e => e.drawings));
  const qc = quoteStatusCounts(s);
  const lost = s.quotes.filter(q => q.status === "Lost");
  const onHold = s.quotes.filter(q => q.status === "On hold");
  return (
    <>
    <MetricGroup om={om} title="Quotes and pipeline" note="Click any box to open the filtered list" items={[M.openQuotes, M.openValue, M.due3, M.overdueQ]} />
    <MetricGroup om={om} title="Wins and workload" items={[M.pipeline, M.secured, M.winRate, M.unassigned]} />
    <MetricGroup om={om} title="Speed and status hygiene" items={[M.tat, M.onTimeQ, M.stale, M.sentCount]} />
    <Grid>
      <ConstraintStrip om={om} areas={["Commercial", "Design"]} limit={2} />
      <Card span={12} title="Quotations due" sub="Quotes not yet submitted, by deadline · click a bar">
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
      <StaleBids om={om} />
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
    </>
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
  const M = useMetrics(om);
  return (
    <>
    <MetricGroup om={om} title="Capacity" note="Click any box to open the plan behind it" items={[M.brandon, M.lound, M.free, M.tent, M.line]} />
    <MetricGroup om={om} title="Flow through the plant" items={[M.designs, M.casting, M.qa, M.readyLots]} />
    <Grid>
      <ConstraintStrip om={om} areas={["Plant", "Design", "Quality"]} />
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
    </>
  );
}

/* ── Logistics ──────────────────────────────────────────────────────────── */
function Logistics({ om }: { om: Om }) {
  const s = om.s, now = nowStamp(s);
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
  const M = useMetrics(om);
  return (
    <>
    <MetricGroup om={om} title="Fleet this week" note="Outsourced hauliers · click any box to open the loads" items={[M.loads, M.moving, M.tbc, M.hiab, M.carriers]} />
    <MetricGroup om={om} title="Proof of delivery" items={[M.claimed, M.podReview, M.verified, M.onTime]} />
    <Grid>
      <ConstraintStrip om={om} areas={["Logistics", "Quality"]} limit={2} />
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
    </>
  );
}

/* ── Finance ────────────────────────────────────────────────────────────── */
function FinanceDash({ om }: { om: Om }) {
  const s = om.s, f = financeTotals(s), M = useMetrics(om);
  const bmax = Math.max(1, ...f.buckets.map(b => b.value));
  const notReady = s.loads.filter(l => ["Arrival claimed", "POD submitted", "Exception", "POD verified"].includes(l.status))
    .map(l => ({ l, inv: byId(s.invoices, l.invoiceId) })).filter(x => x.inv && (x.inv.stage === "Held" || x.inv.stage === "Eligible"));
  const ex = sageExceptions(s);
  const weeks = weeklyReceipts(s, 8);
  const wmax = Math.max(1, ...weeks.map(w => w.issued + w.queued));
  return (
    <>
    <MetricGroup om={om} title="Invoicing" note="Click any box to open the invoices behind it" items={[M.ready, M.eligible, M.held, M.unbilled]} />
    <MetricGroup om={om} title="Debtors and cash" items={[M.sage, M.overdue, M.over60, M.dtp, M.due30]} />
    <Grid>
      <ConstraintStrip om={om} areas={["Finance", "Logistics"]} limit={2} />
      <Card span={12} title="Debtor aging (demo)" sub="Issued invoices in the illustrative Sage snapshot · click a bucket for the invoices in it">
        <div className="om-col" style={{ gap: 10 }}>
          {f.buckets.map(b => (
            <button key={b.label} className="fin-bucket" onClick={() => drill(om, { page: "Finance", tab: "debtors", ui: { "fin:debtBucket": BUCKET_KEY[b.label] || "all" } })}>
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
    </>
  );
}
