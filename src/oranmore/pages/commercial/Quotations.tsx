import { useState } from "react";
import type { Om, Col } from "../../ui";
import { Page, Head, Grid, Card, Table, Badge, Btn, Seg, Check, Facts, RefLink, LineageChip, Empty, useUi, Kpi } from "../../ui";
import type { EnquiryRow } from "../../selectors";
import { enquiryRows, OPEN_QUOTE, PRE_SUBMIT, orderForQuote } from "../../selectors";
import type { QuoteStatus } from "../../types";
import { gbp, dateShort, dateUK, stamp } from "../../format";
import { DueBadge, EstimatorSelect } from "./shared";

type F = "open" | "pre" | "won" | "closed" | "all";
const LOST_REASONS = ["Contractor did not secure the main contract", "Lost on price", "Lost on programme", "Scope changed to in-situ", "Client withdrew"];

export default function Quotations({ om }: { om: Om }) {
  const all = enquiryRows(om.s);
  const [sel, setSel] = useUi<string>(om, "sel:Commercial:quotations", "QUO-26-104");
  const [f, setF] = useUi<F>(om, "f:quo", "open");
  const rows = all.filter(r => f === "all" ? true : f === "open" ? OPEN_QUOTE.includes(r.q.status) : f === "pre" ? PRE_SUBMIT.includes(r.q.status)
    : f === "won" ? r.q.status === "Won" : r.q.status === "Lost" || r.q.status === "On hold").sort((a, b) => a.e.due.localeCompare(b.e.due));
  const cur = all.find(r => r.q.id === sel) || rows[0];
  const pre = all.filter(r => PRE_SUBMIT.includes(r.q.status));
  const awaitingReview = pre.filter(r => r.q.checklist.filter(c => c.key !== "review").every(c => c.done) && !r.q.checklist.find(c => c.key === "review")!.done);

  const cols: Col<EnquiryRow>[] = [
    { k: "id", label: "Quote", render: r => <span className="om-mono ink">{r.q.id}</span> },
    { k: "who", label: "Customer · development", render: r => <div style={{ minWidth: 0 }}><div className="ink">{r.account}</div><div className="om-faint om-small">{r.dev}</div></div> },
    { k: "st", label: "Status", render: r => <Badge>{r.q.status}</Badge> },
    { k: "rev", label: "Rev", render: r => <span className="om-mono">{r.q.revision}</span> },
    { k: "chk", label: "Checklist", render: r => <span className="om-mono">{r.q.checklist.filter(c => c.done).length}/{r.q.checklist.length}</span> },
    { k: "val", label: "Value", align: "right", render: r => <span className="om-mono ink">{r.q.value ? gbp(r.q.value) : "Not priced"}</span> },
    { k: "due", label: "Due", render: r => <div className="om-col" style={{ gap: 3 }}><span className="om-mono">{dateShort(r.e.due)}</span><DueBadge r={r} /></div> },
  ];

  return (
    <Page>
      <Head eyebrow="Commercial · Quotations" title="Quotations in progress"
        sub="Checklist, clarifications, versions and approvals for each estimate. Sending a quotation is a human decision and is simulated here." />
      <Grid>
        <div className="om-s-12" style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 16px", borderRadius: 14, border: "1px solid var(--accent-line)", background: "var(--accent-faint)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" style={{ flex: "none", marginTop: 1 }}><path d="M12 3.6 19.5 6v6.1c0 4-3.1 6.9-7.5 8.3-4.4-1.4-7.5-4.3-7.5-8.3V6L12 3.6Z M9.2 12.2l2 2 3.6-3.7" /></svg>
          <div className="om-small"><b style={{ color: "var(--ink)" }}>Pulse never prices structural work.</b> <span className="om-muted">Estimates are prepared by estimators; this view tracks the process: drawings, take-off, exclusions, design questions, manager review and the send decision.</span></div>
        </div>
        <div className="om-s-12 om-kpis">
          <Kpi label="Before submission" value={pre.length} sub="inquiry or estimating" onClick={() => setF("pre")} />
          <Kpi label="Awaiting manager review" value={awaitingReview.length} tone={awaitingReview.length ? "warn" : undefined} sub={awaitingReview.map(r => r.q.id).join(", ") || "none"} onClick={() => { setF("pre"); if (awaitingReview[0]) setSel(awaitingReview[0].q.id); }} />
          <Kpi label="Submitted or negotiating" value={all.filter(r => r.q.status === "Quote submitted" || r.q.status === "Negotiation").length} sub="waiting on the contractor" onClick={() => setF("open")} />
          <Kpi label="Open clarifications" value={all.reduce((t, r) => t + r.q.clarifications.filter(c => c.open).length, 0)} sub="questions out to customers" />
          <Kpi label="Won, order created" value={all.filter(r => r.q.status === "Won" && r.order).length + " of " + all.filter(r => r.q.status === "Won").length} sub="no re-keying on award" onClick={() => setF("won")} />
        </div>
        <Card span={5} flush title="Quotations" right={<Seg<F> value={f} onChange={setF} options={[["open", "Open"], ["pre", "Pre-submit"], ["won", "Won"], ["closed", "Lost / hold"], ["all", "All"]]} />}>
          <Table cols={cols} rows={rows} rowKey={r => r.q.id} selKey={cur?.q.id} onRow={r => setSel(r.q.id)} maxHeight={760} />
        </Card>
        <div className="om-s-7 om-col" style={{ gap: 14 }}>
          {cur ? <QuoteDetail key={cur.q.id} om={om} r={cur} /> : <Card><Empty title="No quotation selected" /></Card>}
        </div>
      </Grid>
    </Page>
  );
}

function QuoteDetail({ om, r }: { om: Om; r: EnquiryRow }) {
  const q = r.q;
  const [clar, setClar] = useState("");
  const [reason, setReason] = useState(LOST_REASONS[0]);
  const reviewDone = q.checklist.find(c => c.key === "review")!.done;
  const othersDone = q.checklist.filter(c => c.key !== "review").every(c => c.done);
  const allDone = q.checklist.every(c => c.done);
  const pre = PRE_SUBMIT.includes(q.status);
  const order = orderForQuote(om.s, q.id);
  const closed = q.status === "Won" || q.status === "Lost";
  const setStatus = (st: QuoteStatus, why?: string) => { om.do.setQuoteStatus(q.id, st, why); om.toast(q.id + " set to " + st + ". Pipeline, dashboard and Activity updated."); };

  return (
    <>
      <Card title={<span><span className="om-mono">{q.id}</span> · rev {q.revision}</span>} sub={r.account + " · " + r.dev} right={<><Badge>{q.status}</Badge><LineageChip l={r.e.lineage} /></>}>
        <Facts items={[
          [q.status === "Estimating" || q.status === "Inquiry" ? "Indicative value" : "Quoted value", q.value ? gbp(q.value) + (pre ? " (not sent)" : "") : "Not priced"],
          ["Quote due", dateUK(r.e.due)],
          ["Contractor status", r.e.contractorStatus],
          ["Products", r.e.products.join(", ")],
          ["Drawings", r.e.drawings + " packages"],
          ["Estimator", r.e.estimator || "Unassigned"],
          ["Reviewer", q.reviewer || "Not set"],
          ["Submitted", q.submitted ? dateUK(q.submitted) : "Not yet"],
        ]} />
        <div className="om-row" style={{ marginTop: 14, gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ minWidth: 200 }}><span className="om-label">Estimator</span><EstimatorSelect om={om} enquiryId={r.e.id} value={r.e.estimator} /></div>
          <div className="om-row" style={{ gap: 6, flexWrap: "wrap", marginLeft: "auto" }}>
            <Btn sm kind="quiet" onClick={() => om.open({ kind: "quote", id: q.id })}>Record</Btn>
            <Btn sm onClick={() => om.go("Commercial", "inquiries", r.e.id)}>Inquiry</Btn>
          </div>
        </div>
      </Card>

      <Grid>
        <Card span={6} title="Estimate checklist" sub={q.checklist.filter(c => c.done).length + " of " + q.checklist.length + " complete · ticked by people"}>
          {q.checklist.map(c => (
            <Check key={c.key} on={c.done} label={c.label} disabled={closed || (c.key === "review" && !othersDone && !c.done)}
              onToggle={() => c.key === "review" && !c.done ? om.do.reviewComplete(q.id) : om.do.toggleCheck(q.id, c.key)} />
          ))}
          <div className="om-divider" />
          <div className="om-col" style={{ gap: 8 }}>
            {pre && (
              <>
                <Btn disabled={reviewDone || !othersDone} onClick={() => { om.do.reviewComplete(q.id); om.toast("Manager review recorded on " + q.id + ". Linked Work task closed."); }}
                  title={!othersDone ? "Finish the other checklist items first" : undefined}>{reviewDone ? "Review complete" : "Mark review complete"}</Btn>
                <Btn kind="primary" disabled={!allDone} onClick={() => { om.do.sendQuote(q.id); om.toast(q.id + " approved and marked sent (simulated). No email left the demo."); }}
                  title={!allDone ? "Every checklist item must be complete" : undefined}>Approve and send (simulated)</Btn>
                {!allDone && <span className="om-faint om-tiny">Sending unlocks when every checklist item is complete, including manager review.</span>}
              </>
            )}
            {q.status === "Won" && (order
              ? <Btn kind="primary" onClick={() => om.go("Projects", "awards", order.id)}>Open order {order.id}</Btn>
              : <Btn kind="primary" onClick={() => { const id = om.do.createOrder(q.id); if (id) { om.toast(id + " created from " + q.id + ". Customer, site and value inherited."); om.go("Projects", "awards", id); } }}>Create order</Btn>)}
            {q.status === "Won" && order && <span className="om-faint om-tiny">Order already exists, so a second award cannot be created.</span>}
          </div>
        </Card>

        <Card span={6} title="Outcome" sub="Oranmore's result, separate from the contractor's status">
          <div className="om-col" style={{ gap: 8 }}>
            <div className="om-row" style={{ gap: 6, flexWrap: "wrap" }}>
              {(["Negotiation", "On hold", "Won"] as QuoteStatus[]).map(st => (
                <Btn key={st} sm disabled={closed || q.status === st || (pre && st !== "On hold")} onClick={() => setStatus(st)}
                  title={pre && st !== "On hold" ? "Submit the quotation first" : undefined}>{st === "Won" ? "Mark won" : st}</Btn>
              ))}
            </div>
            <span className="om-label" style={{ marginTop: 6 }}>Lost reason</span>
            <select className="om-input" value={reason} onChange={e => setReason(e.target.value)} disabled={q.status === "Lost"}>
              {LOST_REASONS.map(x => <option key={x}>{x}</option>)}
            </select>
            <Btn sm kind="danger" disabled={q.status === "Lost" || q.status === "Won"} onClick={() => setStatus("Lost", reason)}>Mark lost</Btn>
            {q.lostReason && <div className="om-small" style={{ color: "var(--bad)" }}>Lost: {q.lostReason}</div>}
            <div className="om-divider" />
            <div className="om-eyebrow">Approvals</div>
            <div className="om-row om-small" style={{ justifyContent: "space-between" }}><span className="om-muted">Manager review</span><Badge tone={reviewDone ? "ok" : "warn"}>{reviewDone ? "Complete" : "Pending"}</Badge></div>
            <div className="om-row om-small" style={{ justifyContent: "space-between" }}><span className="om-muted">Commercial sign-off to send</span><Badge tone={q.approved ? "ok" : "draft"}>{q.approved ? "Approved" : "Not yet"}</Badge></div>
            {order && <div className="om-row om-small" style={{ justifyContent: "space-between" }}><span className="om-muted">Order</span><RefLink om={om} r={{ kind: "order", id: order.id }} /></div>}
          </div>
        </Card>

        <Card span={7} title="Clarifications" sub={q.clarifications.filter(c => c.open).length + " open"}>
          {q.clarifications.length === 0 && <div className="om-faint om-small" style={{ paddingBottom: 8 }}>No clarifications raised.</div>}
          {q.clarifications.map((c, i) => (
            <div key={i} className="om-row" style={{ alignItems: "flex-start", padding: "8px 0", borderTop: i ? "1px solid var(--border)" : 0, gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="om-small om-ink">{c.text}</div>
                <div className="om-faint om-tiny" style={{ marginTop: 3 }}>{stamp(c.at)} · {c.by}</div>
              </div>
              {c.open ? <Btn sm onClick={() => om.do.closeClarification(q.id, i)}>Mark answered</Btn> : <Badge tone="ok">Answered</Badge>}
            </div>
          ))}
          <div className="om-row" style={{ marginTop: 10, gap: 8 }}>
            <input className="om-input" placeholder="Question for the customer, e.g. confirm landing levels" value={clar} onChange={e => setClar(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && clar.trim()) { om.do.addClarification(q.id, clar.trim()); setClar(""); } }} />
            <Btn disabled={!clar.trim() || closed} onClick={() => { om.do.addClarification(q.id, clar.trim()); setClar(""); om.toast("Clarification logged on " + q.id + " (no email sent)."); }}>Add</Btn>
          </div>
        </Card>

        <Card span={5} title="Exclusions and assumptions">
          {q.exclusions.length ? q.exclusions.map(x => <div key={x} className="om-small om-muted" style={{ padding: "4px 0" }}>· {x}</div>) : <div className="om-faint om-small">Not written yet.</div>}
        </Card>

        <Card span={12} title="Version history">
          {q.history.length === 0 && <div className="om-faint om-small">No history yet.</div>}
          {q.history.slice().reverse().map((h, i) => (
            <div key={i} className="om-row om-small" style={{ padding: "6px 0", borderTop: i ? "1px solid var(--border)" : 0, gap: 12 }}>
              <span className="om-mono om-faint" style={{ width: 110, flex: "none" }}>{stamp(h.at)}</span><span className="om-muted">{h.text}</span>
            </div>
          ))}
        </Card>
      </Grid>
    </>
  );
}
