import type { Om } from "../../ui";
import { Page, Head, Grid, Card, Badge, Kpi, Bar } from "../../ui";
import { estimatorLoad, enquiryRows, PRE_SUBMIT, TODAY } from "../../selectors";
import { gbp, gbpShort, dateShort, dayShort, addDays, num } from "../../format";
import { DueBadge, EstimatorSelect } from "./shared";

export default function Workload({ om }: { om: Om }) {
  const lanes = estimatorLoad(om.s);
  const pre = enquiryRows(om.s).filter(r => PRE_SUBMIT.includes(r.q.status));
  const maxDrawings = Math.max(...lanes.map(l => l.drawings), 1);
  const days = Array.from({ length: 12 }, (_, i) => addDays(TODAY, i - 3));

  return (
    <Page>
      <Head eyebrow="Commercial · Estimator Workload" title="Who is estimating what, and by when"
        sub="Deadline queue for every quote not yet submitted. Large drawing packs can legitimately take around a week of estimating effort; the aim is early warning, not speed." />
      <Grid>
        <div className="om-s-12 om-kpis">
          <Kpi label="Quotes before submission" value={pre.length} sub={gbp(pre.reduce((t, r) => t + r.q.value, 0)) + " indicative"} />
          <Kpi label="Due in 3 days" value={pre.filter(r => r.dueSoon).length} tone="warn" sub="3-day warning window" />
          <Kpi label="Overdue" value={pre.filter(r => r.overdue).length} tone={pre.some(r => r.overdue) ? "bad" : undefined} sub={pre.filter(r => r.overdue).map(r => r.e.id).join(", ") || "none"} />
          <Kpi label="Drawing packages" value={num(pre.reduce((t, r) => t + r.e.drawings, 0))} sub="across live estimates" />
          <Kpi label="Unassigned" value={pre.filter(r => !r.e.estimator).length} tone={pre.some(r => !r.e.estimator) ? "warn" : undefined} sub="assign below" />
        </div>

        <Card span={12} title="Deadline strip" sub="Quote due dates around today. Red: overdue. Amber: within 3 days.">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12,minmax(70px,1fr))", gap: 6, overflowX: "auto" }}>
            {days.map(d => {
              const due = pre.filter(r => r.e.due === d);
              const isToday = d === TODAY;
              return (
                <div key={d} style={{ minHeight: 92, padding: "8px 8px", borderRadius: 12, border: isToday ? "1.5px solid var(--accent)" : "1px solid var(--border)", background: isToday ? "var(--accent-faint)" : "var(--surface-faint)" }}>
                  <div className="om-tiny" style={{ color: isToday ? "var(--accent)" : "var(--faint)", fontWeight: 600 }}>{dayShort(d)}</div>
                  <div className="om-col" style={{ gap: 4, marginTop: 6 }}>
                    {due.map(r => (
                      <button key={r.e.id} className="om-chip" onClick={() => om.go("Commercial", "quotations", r.q.id)} title={r.account + " · " + r.dev}
                        style={{ cursor: "pointer", justifyContent: "flex-start", borderColor: r.overdue ? "var(--bad)" : r.dueSoon ? "var(--warn)" : undefined, fontSize: 10.5, overflow: "hidden" }}>
                        <span className="om-mono">{r.e.id.slice(-3)}</span><span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{r.dev.split(" ")[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {lanes.map(l => (
          <Card key={l.name} span={l.name === "Unassigned" ? 12 : 4} className={l.name === "Unassigned" ? "" : "om-s-keep"}
            title={l.name} sub={l.name === "Unassigned" ? "Waiting for an estimator" : l.rows.length + " live · " + l.drawings + " drawing packs · " + gbpShort(l.value)}
            right={<>{l.overdue > 0 && <Badge tone="bad">{l.overdue} overdue</Badge>}{l.soon > 0 && <Badge tone="warn">{l.soon} due ≤3d</Badge>}</>}>
            {l.name !== "Unassigned" && (
              <div style={{ marginBottom: 10 }}>
                <div className="om-row om-tiny om-faint" style={{ justifyContent: "space-between", marginBottom: 5 }}><span>Drawing load vs busiest estimator</span><span>{l.drawings}</span></div>
                <Bar value={l.drawings} max={maxDrawings} color={l.overdue ? "var(--bad)" : l.soon ? "var(--warn)" : "var(--accent)"} />
              </div>
            )}
            <div className="om-col" style={{ gap: 0 }}>
              {l.rows.map(r => (
                <div key={r.e.id} className="om-row" style={{ padding: "9px 0", borderTop: "1px solid var(--border)", gap: 10, flexWrap: "wrap" }}>
                  <button className="om-link" style={{ flex: "1 1 160px", minWidth: 0, textAlign: "left", color: "inherit" }} onClick={() => om.go("Commercial", "quotations", r.q.id)}>
                    <div className="om-small om-ink" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.account} · {r.dev}</div>
                    <div className="om-tiny om-faint"><span className="om-mono">{r.q.id}</span> · {r.q.status} · {r.e.drawings} dwgs · due {dateShort(r.e.due)}</div>
                  </button>
                  <DueBadge r={r} />
                  {l.name === "Unassigned" && <EstimatorSelect om={om} enquiryId={r.e.id} value={null} compact />}
                </div>
              ))}
              {l.rows.length === 0 && <div className="om-faint om-small">Nothing waiting. Every live estimate has an owner.</div>}
            </div>
          </Card>
        ))}
        {!lanes.some(l => l.name === "Unassigned") && (
          <Card span={12} title="Unassigned"><div className="om-faint om-small">Every live estimate has an estimator.</div></Card>
        )}
      </Grid>
    </Page>
  );
}
