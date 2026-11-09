import type { Om } from "../../ui";
import { Page, Head, Grid, Card, Badge, Kpi, Bar, RefLink, Btn } from "../../ui";
import { pipeline, quoteStatusCounts, enquiryRows } from "../../selectors";
import type { QuoteStatus, ContractorStatus } from "../../types";
import { gbp, gbpShort, pct } from "../../format";

const FUNNEL: QuoteStatus[] = ["Inquiry", "Estimating", "Quote submitted", "Negotiation", "Won", "Lost", "On hold"];
const CS: ContractorStatus[] = ["Secured", "Tendering", "Unknown"];

export default function Pipeline({ om }: { om: Om }) {
  const s = om.s;
  const p = pipeline(s);
  const counts = quoteStatusCounts(s);
  const rows = enquiryRows(s);
  const maxFunnel = Math.max(...FUNNEL.map(st => counts[st]?.value || 0), 1);
  const maxCs = Math.max(p.secured.value, p.tendering.value, p.unknown.value, 1);
  const decided = rows.filter(r => r.q.status === "Won" || r.q.status === "Lost");
  const exclusive = p.devGroups.filter(g => g.exclusive);

  return (
    <Page>
      <Head eyebrow="Commercial · Tender Pipeline" title="Contractor status is not Oranmore's chance of winning"
        sub="A contractor may still be tendering the main contract, or may have secured it. Oranmore's own outcome is tracked separately, and competing bids for one building are counted once." />
      <Grid>
        <div className="om-s-12 om-kpis">
          <Kpi label="Open quote value" value={gbpShort(p.raw)} sub={p.open.length + " open quotes, unweighted"} />
          <Kpi label="Weighted, summed" value={gbpShort(p.rawWeighted)} sub="what a spreadsheet total would show" />
          <Kpi label="Weighted, de-duplicated" value={gbpShort(p.deduped)} tone="accent" sub="best bid per building only" />
          <Kpi label="Double count removed" value={gbpShort(p.doubleCount)} tone={p.doubleCount ? "warn" : undefined} sub={exclusive.length + " building" + (exclusive.length === 1 ? "" : "s") + " with competing bids"} />
          <Kpi label="Decided quotes won" value={decided.length ? pct(decided.filter(r => r.q.status === "Won").length / decided.length) : "n/a"} sub={decided.filter(r => r.q.status === "Won").length + " won · " + decided.filter(r => r.q.status === "Lost").length + " lost"} />
        </div>

        <Card span={5} title="Contractor project status" sub="Open quotes by whether the contractor has the main contract">
          {CS.map(c => {
            const v = c === "Secured" ? p.secured : c === "Tendering" ? p.tendering : p.unknown;
            return (
              <div key={c} style={{ padding: "10px 0", borderTop: c !== "Secured" ? "1px solid var(--border)" : 0 }}>
                <div className="om-row" style={{ justifyContent: "space-between" }}>
                  <span className="om-row" style={{ gap: 8 }}><Badge tone={c === "Secured" ? "ok" : c === "Tendering" ? "info" : "draft"}>{c}</Badge><span className="om-small om-muted">{v.n} quotes</span></span>
                  <span className="om-mono om-ink">{gbp(v.value)}</span>
                </div>
                <div style={{ marginTop: 8 }}><Bar value={v.value} max={maxCs} color={c === "Secured" ? "var(--ok)" : c === "Tendering" ? "#8cbcec" : "var(--neutral)"} /></div>
              </div>
            );
          })}
          <div className="om-faint om-tiny" style={{ marginTop: 8 }}>Secured means the contractor has won its building contract. It does not mean Oranmore has won the precast package.</div>
        </Card>

        <Card span={7} title="Oranmore outcome funnel" sub="All quotes this year by Oranmore's own status">
          {FUNNEL.map(st => {
            const c = counts[st] || { n: 0, value: 0 };
            return (
              <div key={st} className="om-row" style={{ padding: "7px 0", gap: 12 }}>
                <span style={{ width: 120, flex: "none" }}><Badge>{st}</Badge></span>
                <div style={{ flex: 1 }}><Bar value={c.value} max={maxFunnel} color={st === "Won" ? "var(--ok)" : st === "Lost" ? "var(--bad)" : st === "On hold" ? "var(--neutral)" : "var(--accent)"} /></div>
                <span className="om-mono om-small" style={{ width: 28, textAlign: "right" }}>{c.n}</span>
                <span className="om-mono om-small om-ink" style={{ width: 90, textAlign: "right" }}>{gbpShort(c.value)}</span>
              </div>
            );
          })}
        </Card>

        <Card span={12} title="Contractor status × Oranmore status" sub="Counts of quotes. Read across: where each contractor situation ends up for Oranmore.">
          <div className="om-scroll">
            <table className="om-tbl">
              <thead><tr><th>Contractor</th>{FUNNEL.map(st => <th key={st} className="r">{st}</th>)}<th className="r">Total</th></tr></thead>
              <tbody>
                {CS.map(c => {
                  const mine = rows.filter(r => r.e.contractorStatus === c);
                  return (
                    <tr key={c}>
                      <td><Badge tone={c === "Secured" ? "ok" : c === "Tendering" ? "info" : "draft"}>{c}</Badge></td>
                      {FUNNEL.map(st => {
                        const n = mine.filter(r => r.q.status === st).length;
                        return <td key={st} className="r mono" style={{ background: n ? "color-mix(in srgb, var(--accent) " + Math.min(40, n * 12) + "%, transparent)" : undefined, color: n ? "var(--ink)" : "var(--faint)" }}>{n || "·"}</td>;
                      })}
                      <td className="r mono ink">{mine.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card span={8} flush className="om-sticky" title="De-duplicated forecast by building" sub="Weighted value = quote value × probability. Competing bids on one building are mutually exclusive.">
          <div className="om-scroll">
            <table className="om-tbl">
              <thead><tr><th>Development</th><th>Bids</th><th className="r">Raw value</th><th className="r">Counted</th><th className="r">Excluded</th></tr></thead>
              <tbody>
                {p.devGroups.slice().sort((a, b) => Number(b.exclusive) - Number(a.exclusive) || b.counted - a.counted).map(g => (
                  <tr key={g.devId} style={g.exclusive ? { background: "var(--warn-soft)" } : undefined}>
                    <td><RefLink om={om} r={{ kind: "development", id: g.devId }}>{g.dev}</RefLink>{g.exclusive && <span style={{ marginLeft: 8 }}><Badge tone="warn" dot={false}>Competing</Badge></span>}</td>
                    <td>
                      <div className="om-col" style={{ gap: 3 }}>
                        {g.rows.map(r => (
                          <span key={r.e.id} className="om-small">
                            <RefLink om={om} r={{ kind: "quote", id: r.q.id }} /> {r.account} · {pct(r.q.probability)}
                            {g.exclusive && r.e.id === g.best.e.id && <span style={{ marginLeft: 6, color: "var(--ok)" }}>counted</span>}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="r mono">{gbp(g.groupRaw)}</td>
                    <td className="r mono ink">{gbp(g.counted)}</td>
                    <td className="r mono" style={{ color: g.excluded ? "var(--warn)" : "var(--faint)" }}>{g.excluded ? gbp(g.excluded) : "·"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr><td className="ink" style={{ padding: "10px 12px" }}>Total</td><td /><td className="r mono" style={{ padding: "10px 12px" }}>{gbp(p.raw)}</td><td className="r mono ink" style={{ padding: "10px 12px" }}>{gbp(p.deduped)}</td><td className="r mono" style={{ padding: "10px 12px", color: "var(--warn)" }}>{gbp(p.doubleCount)}</td></tr></tfoot>
            </table>
          </div>
        </Card>

        <div className="om-s-4 om-col" style={{ gap: 14 }}>
          {exclusive.map(g => (
            <Card key={g.devId} title={g.dev} sub="Why this building is counted once">
              <div className="om-small om-muted">
                {g.rows.map(r => r.account).join(" and ")} are both tendering the main contract. Oranmore has a separate enquiry and quote with each, and keeps both live. Only one contractor can win, so the forecast counts the higher weighted bid ({g.best.account}, {gbp(g.counted)}) and leaves out {gbp(g.excluded)}.
              </div>
              <div style={{ marginTop: 10 }}><Btn sm onClick={() => om.open({ kind: "development", id: g.devId })}>Open development</Btn></div>
            </Card>
          ))}
          <Card title="Won and lost reasons">
            {rows.filter(r => r.q.status === "Won" || r.q.status === "Lost").map(r => (
              <div key={r.q.id} className="om-row" style={{ padding: "6px 0", borderTop: "1px solid var(--border)", alignItems: "flex-start", gap: 8 }}>
                <Badge>{r.q.status}</Badge>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="om-small om-ink">{r.account} · {r.dev}</div>
                  <div className="om-tiny om-muted">{r.q.status === "Lost" ? r.q.lostReason || "No reason recorded" : r.order ? "Order " + r.order.id : "Awaiting order"}</div>
                </div>
                <span className="om-mono om-small">{gbpShort(r.q.value)}</span>
              </div>
            ))}
          </Card>
        </div>
      </Grid>
    </Page>
  );
}
