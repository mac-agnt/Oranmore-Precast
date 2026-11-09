/* Constraint Analyst: finds the one step that limits throughput from enquiry
   to cash, explains why, and flags it to the owner. Flags only; never re-plans. */
import type { Om } from "./ui";
import { Card, Grid, Badge, Btn, RefLink, Empty, useUi, drill } from "./ui";
import type { Constraint, ConstraintArea } from "./selectors";
import { constraints, CONSTRAINT_FLOW } from "./selectors";
import { STEP_CAPACITY } from "./fixtures";
import { gbpShort, pct } from "./format";

const DEPT: Record<ConstraintArea, string> = { Commercial: "Estimating", Design: "Design", Plant: "Plant Operations", Quality: "Quality/Yard", Logistics: "Transport", Finance: "Finance" };
const meterColor = (c: Constraint) => (c.tone === "bad" ? "var(--bad)" : c.tone === "warn" ? "var(--warn)" : "var(--accent)");
const flagged = (om: Om, c: Constraint) => om.s.tasks.some(t => t.id === "TSK-K-" + c.id && t.status !== "Done");
const goTo = (om: Om, c: Constraint) => drill(om, { page: c.go[0], tab: c.go[1], ui: c.go[2] ? { ["sel:" + c.go[0] + ":" + c.go[1]]: c.go[2] } : undefined });

function flag(om: Om, c: Constraint) {
  om.do.flagConstraint(c.id, c.title, c.owner, DEPT[c.area], c.ref, c.action);
  om.toast("Flagged to " + c.owner + ". Task created and logged to Activity.");
}

function Meter({ c }: { c: Constraint }) {
  const max = Math.max(1.5, c.load * 1.05);
  return (
    <div className="om-kmeter" role="img" aria-label={"Load " + pct(c.load)}>
      <span style={{ width: Math.min(100, (c.load / max) * 100) + "%", background: meterColor(c) }} />
      <em style={{ left: (1 / max) * 100 + "%" }} title="100% of step capacity" />
    </div>
  );
}

function FlagBtn({ om, c, sm = true }: { om: Om; c: Constraint; sm?: boolean }) {
  return flagged(om, c)
    ? <Badge tone="ok" title={"Flagged to " + c.owner}>{sm ? "Flagged" : "Flagged to " + c.owner}</Badge>
    : <Btn sm={sm} kind={c.tone === "bad" ? "primary" : undefined} onClick={() => flag(om, c)}>Flag to owner</Btn>;
}

/** Full analysis: flow across the journey, the binding constraint, and every step ranked. */
export function ConstraintBoard({ om }: { om: Om }) {
  const list = constraints(om.s);
  const bind = list[0];
  const [area, setArea] = useUi<string>(om, "k:area", "All");
  const [sel, setSel] = useUi<string>(om, "k:sel", bind?.id || "");
  const cur = list.find(c => c.id === sel) || bind;
  const worst = (a: ConstraintArea) => list.filter(c => c.area === a).sort((x, y) => y.score - x.score)[0];
  const rows = list.filter(c => area === "All" || c.area === area);
  if (!bind) return <Empty title="No constraints computed" />;
  return (
    <Grid>
      <Card span={12} title="Where work queues, enquiry to cash" sub="Load = demand against each step's capacity. Click a step to inspect it. The red step is the binding constraint: fixing anything else will not raise throughput."
        right={<Btn sm onClick={() => { om.do.runConstraintAnalysis(list.filter(c => c.tone !== "ok").length + " constrained steps. Binding: " + bind.title + ".", bind.ref); om.toast("Analysis re-run on the live state. Logged to Activity."); }}>Re-run analysis</Btn>}>
        <div className="om-kflow">
          {CONSTRAINT_FLOW.map(a => {
            const c = worst(a);
            if (!c) return <div key={a} className="om-kstep" style={{ cursor: "default" }}><span className="a">{a}</span><span className="p">·</span></div>;
            return (
              <button key={a} className={"om-kstep" + (c.id === bind.id ? " bind" : "") + (c.id === cur?.id ? " on" : "")} onClick={() => { setSel(c.id); setArea("All"); }}>
                <span className="a">{a}</span>
                <span className="p" style={{ color: c.tone === "ok" ? undefined : meterColor(c) }}>{pct(c.load)}</span>
                <span className="n">{c.step}</span>
                {c.id === bind.id && <span className="tag"><Badge tone="bad" dot={false}>Binding</Badge></span>}
              </button>
            );
          })}
        </div>
      </Card>

      {cur && (
        <Card span={12} className="om-kcur">
          <div className="om-kbind">
            <div style={{ minWidth: 0 }}>
              <div className="om-row" style={{ gap: 8, flexWrap: "wrap" }}>
                {cur.id === bind.id ? <Badge tone="bad">Binding constraint</Badge> : <Badge tone={cur.tone}>{cur.tone === "ok" ? "Has headroom" : cur.tone === "warn" ? "Tight" : "Over capacity"}</Badge>}
                <span className="om-faint om-small">{cur.area} · {cur.step}</span>
              </div>
              <h2>{cur.title}</h2>
              <div className="om-row om-small" style={{ gap: 10 }}><span className="om-mono om-ink">{pct(cur.load)} load</span><span className="om-faint">{cur.metric}</span></div>
              <Meter c={cur} />
              <div className="om-faint om-tiny">{cur.basis}. Line marks 100%.</div>
            </div>
            <div className="om-col" style={{ gap: 12, minWidth: 0 }}>
              <div><div className="om-label">Impact</div><div className="om-small om-ink">{cur.impact}</div></div>
              <div><div className="om-label">Knock-on</div><div className="om-small om-muted">{cur.downstream}</div></div>
              <div><div className="om-label">Suggested action · {cur.owner}</div><div className="om-small om-ink">{cur.action}</div></div>
              <div className="om-row" style={{ gap: 8, flexWrap: "wrap" }}>
                <FlagBtn om={om} c={cur} sm={false} />
                <Btn onClick={() => goTo(om, cur)}>Open {cur.go[0]} →</Btn>
                <RefLink om={om} r={cur.ref} />
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card span={8} flush title="Every step, ranked" sub="Ranked by load, weighted by the value at stake"
        right={<select className="om-input" style={{ width: 170 }} value={area} onChange={e => setArea(e.target.value)} aria-label="Area"><option value="All">All areas</option>{CONSTRAINT_FLOW.map(a => <option key={a} value={a}>{a}</option>)}</select>}>
        <div className="vz-rows">
          {rows.map(c => (
            <div key={c.id} role="button" tabIndex={0} className={"vz-row" + (c.id === cur?.id ? " sel" : "")} style={{ gridTemplateColumns: "minmax(200px,1.4fr) minmax(140px,1fr) 118px" }} onClick={() => setSel(c.id)} onKeyDown={e => { if (e.key === "Enter") setSel(c.id); }}>
              <span className="vz-name"><b>{c.title}</b><span>{c.area} · {c.owner}</span></span>
              <span className="vz-meter"><span className="lbl"><span>{c.impactValue ? gbpShort(c.impactValue) + " at stake" : c.metric}</span><span className="om-mono" style={{ color: c.tone === "ok" ? undefined : meterColor(c) }}>{pct(c.load)}</span></span><Meter c={c} /></span>
              <span className="vz-end" onClick={e => e.stopPropagation()}>{c.tone === "ok" ? <span className="om-faint om-tiny">Headroom</span> : <FlagBtn om={om} c={c} />}</span>
            </div>
          ))}
        </div>
      </Card>
      <div className="om-s-4 om-col" style={{ gap: 14 }}>
      <Card title="Flagged to owners" sub="Tasks the Constraint Analyst has raised, open first">
        {(() => { const ts = om.s.tasks.filter(t => t.auto === "constraint"); return ts.length ? ts.map(t => <div key={t.id} className="om-row om-small" style={{ padding: "5px 0", borderTop: "1px solid var(--border)", gap: 8 }}><Badge tone={t.status === "Done" ? "ok" : "warn"} dot={false}>{t.status}</Badge><span className="om-ink" style={{ flex: 1, minWidth: 0 }}>{t.title.replace("Constraint: ", "")}</span><span className="om-faint om-tiny">{t.owner}</span></div>) : <div className="om-faint om-small">Nothing flagged yet. Use "Flag to owner" on any step that is tight or over.</div>; })()}
      </Card>
      <Card title="Capacity assumptions" sub="Illustrative. Set each with the team that owns the step.">
        <dl className="om-kv">
          <dt>Estimating</dt><dd>{STEP_CAPACITY.estimatorDrawings} drawing packages per estimator</dd>
          <dt>Design</dt><dd>{STEP_CAPACITY.designPackages} packages in parallel</dd>
          <dt>Hollowcore</dt><dd>Brandon 6,000 m², Lound 4,000 m² per week</dd>
          <dt>Other lines</dt><dd>Own unit basis, never converted to m²</dd>
          <dt>QA</dt><dd>{STEP_CAPACITY.qaInspections48h} inspections per 48 hours</dd>
          <dt>Haulage</dt><dd>{STEP_CAPACITY.haulageSlotsPerDay} outsourced collections per day</dd>
          <dt>Cash</dt><dd>Held value against value ready to invoice</dd>
        </dl>
        <div className="om-faint om-tiny" style={{ marginTop: 10 }}>The Constraint Analyst agent re-reads the shared state on every change. It flags and explains; people re-plan.</div>
      </Card>
      </div>
    </Grid>
  );
}

/** Compact strip for the Dashboard: the worst constraints in the given areas, binding one marked. */
export function ConstraintStrip({ om, areas, limit = 3 }: { om: Om; areas?: ConstraintArea[]; limit?: number }) {
  const all = constraints(om.s);
  const bind = all[0];
  const list = all.filter(c => !areas || areas.includes(c.area)).slice(0, limit);
  return (
    <Card span={12} title="Constraint Analyst" sub={"Binding constraint right now: " + bind.area.toLowerCase() + ", " + bind.title.charAt(0).toLowerCase() + bind.title.slice(1)}
      right={<Btn sm onClick={() => drill(om, { page: "Plants & Planning", tab: "constraints", ui: { "k:sel": list[0]?.id || bind.id } })}>Open constraint analysis →</Btn>}>
      <div className="om-kstrip">
        {list.map(c => (
          <button key={c.id} className={"om-kcard" + (c.id === bind.id ? " bind" : "")} onClick={() => drill(om, { page: "Plants & Planning", tab: "constraints", ui: { "k:sel": c.id } })}>
            <div className="om-row" style={{ gap: 8 }}>
              <span className="om-faint om-tiny" style={{ textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600 }}>{c.area}</span>
              <span style={{ marginLeft: "auto" }}>{c.id === bind.id ? <Badge tone="bad" dot={false}>Binding</Badge> : <Badge tone={c.tone} dot={false}>{c.tone === "ok" ? "Headroom" : c.tone === "warn" ? "Tight" : "Over"}</Badge>}</span>
            </div>
            <div className="om-small om-ink" style={{ fontWeight: 600, lineHeight: 1.35 }}>{c.title}</div>
            <div className="om-row om-tiny" style={{ gap: 8 }}><span className="om-mono" style={{ color: meterColor(c) }}>{pct(c.load)} load</span><span className="om-faint">{c.metric}</span></div>
            <Meter c={c} />
            <div className="om-faint om-tiny" style={{ lineHeight: 1.4 }}>{c.action}</div>
          </button>
        ))}
      </div>
    </Card>
  );
}
