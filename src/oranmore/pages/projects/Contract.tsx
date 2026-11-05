import type { Om } from "../../ui";
import { Head, Grid, Card, Badge, Btn, RefLink, Field, LineageChip } from "../../ui";
import { account, dev, blockingOpen, rfisFor, byId, docsFor } from "../../selectors";
import { dateUK, stamp } from "../../format";
import { useOrder, OrderSelect } from "./common";

export default function Contract({ om }: { om: Om }) {
  const s = om.s;
  const [o, setSel] = useOrder(om);
  const acc = account(s, o.accountId), d = dev(s, o.devId), q = byId(s.quotes, o.quoteId);
  const contact = s.contacts.find(c => c.id === o.customerContactId);
  const blk = blockingOpen(s, o.id);
  const rf = rfisFor(s, o.id);
  const empty = o.contract.filter(f => !f.value.trim());
  const inheritedFrom = (src?: string) => src === "Account" ? acc?.name : src === "Development" ? d?.name : src === "Quotation" ? o.quoteId + (q ? " rev " + q.revision : "") : src === "Contact" ? contact?.name : src;
  const long = (k: string) => ["stages", "products", "delivery", "lifting", "access"].includes(k);
  const approve = () => { om.do.approveContract(o.id); om.toast("Contract Detail Summary for " + o.id + " approved."); };
  const docs = docsFor(s, o.id);

  return (
    <>
      <Head title="Contract Detail Summary"
        sub="Prefilled from the award: customer, site, products and value come from the same records Commercial used, so nobody re-keys them. Edit what the customer has confirmed; the summary is approved by a person."
        right={<OrderSelect om={om} value={o.id} onChange={setSel} />} />
      <Grid>
        <Card span={8} title={(d?.name || "") + " · " + o.id} sub={acc?.name + " · awarded " + dateUK(o.awarded)} right={<><LineageChip l={o.lineage} />{o.contractApproved ? <Badge tone="ok">Approved</Badge> : <Badge tone="warn">Awaiting approval</Badge>}</>}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
            {o.contract.map(f => (
              <div key={f.key} style={long(f.key) ? { gridColumn: "1 / -1" } : undefined}>
                <Field label={<span className="om-row" style={{ gap: 6, justifyContent: "space-between" }}><span>{f.label}</span>{f.inherited ? <span className="om-chip" style={{ height: 19, fontSize: 10.5 }} title={"Inherited from " + f.inherited}>from {inheritedFrom(f.inherited)}</span> : !f.value.trim() ? <span className="om-tiny" style={{ color: "var(--warn)" }}>To capture</span> : null}</span>}>
                  {long(f.key)
                    ? <textarea className="om-input" rows={2} value={f.value} onChange={e => om.do.setContractField(o.id, f.key, e.target.value)} disabled={o.contractApproved} />
                    : <input className="om-input" value={f.value} onChange={e => om.do.setContractField(o.id, f.key, e.target.value)} disabled={o.contractApproved} />}
                </Field>
              </div>
            ))}
          </div>
          <div className="om-faint om-tiny" style={{ marginTop: 14 }}>Field set is illustrative, based on the manual workflow described in discovery. To be confirmed against Jane's current spreadsheet.</div>
        </Card>

        <div className="om-s-4 om-col" style={{ gap: 14 }}>
          <Card title="Approval" sub="Commercial lead signs off. Nothing is approved automatically.">
            <div className="om-col" style={{ gap: 8 }}>
              <div className="om-row om-small"><span className="om-muted" style={{ flex: 1 }}>Fields completed</span><b className="om-mono">{o.contract.length - empty.length}/{o.contract.length}</b></div>
              <div className="om-row om-small"><span className="om-muted" style={{ flex: 1 }}>Inherited, not re-keyed</span><b className="om-mono">{o.contract.filter(f => f.inherited).length}</b></div>
              <div className="om-row om-small"><span className="om-muted" style={{ flex: 1 }}>Blocking RFIs open</span>{blk.length ? <Badge tone="bad">{blk.length}</Badge> : <Badge tone="ok">0</Badge>}</div>
            </div>
            {blk.length > 0 && !o.contractApproved && (
              <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "var(--bad-soft)", fontSize: 12, color: "var(--body)" }}>
                <b style={{ color: "var(--bad)" }}>Approval locked.</b> The summary cannot be approved while {blk.map(b => b.id).join(" and ")} {blk.length > 1 ? "are" : "is"} unanswered: lifting and design details would be wrong.
                <div className="om-col" style={{ gap: 4, marginTop: 8 }}>{blk.map(b => <span key={b.id}><RefLink om={om} r={{ kind: "rfi", id: b.id }} /> <span className="om-muted">{b.question}</span></span>)}</div>
              </div>
            )}
            <div className="om-row" style={{ marginTop: 12, gap: 6, flexWrap: "wrap" }}>
              {o.contractApproved
                ? <Badge tone="ok">Approved summary is locked</Badge>
                : <Btn kind="primary" disabled={blk.length > 0} onClick={approve} title={blk.length ? "Answer blocking RFIs first" : "Approve the summary"}>Approve summary</Btn>}
              <Btn sm onClick={() => om.setSub("rfis")}>Go to RFIs</Btn>
            </div>
            {empty.length > 0 && !o.contractApproved && <div className="om-faint om-tiny" style={{ marginTop: 10 }}>Still to capture: {empty.map(f => f.label.toLowerCase()).join(", ")}.</div>}
          </Card>

          <Card title="Information requests" sub={rf.length + " on this order"} right={<Btn sm kind="quiet" onClick={() => om.setSub("rfis")}>Manage</Btn>}>
            {rf.length === 0 && <div className="om-faint om-small">No RFIs yet. Draft one from RFIs & Documents.</div>}
            {rf.map(r => (
              <div key={r.id} className="om-row" style={{ padding: "6px 0", borderTop: "1px solid var(--border)", fontSize: 12, alignItems: "flex-start" }}>
                <RefLink om={om} r={{ kind: "rfi", id: r.id }} />
                <span className="om-muted" style={{ flex: 1, minWidth: 0 }}>{r.question}</span>
                <Badge tone={r.status === "Resolved" ? "ok" : r.blocking ? "bad" : "warn"}>{r.status === "Resolved" ? "Resolved" : r.blocking ? "Blocking" : "Open"}</Badge>
              </div>
            ))}
          </Card>

          <Card title="Supporting documents" sub="Illustrative drafts" right={<Btn sm kind="quiet" onClick={() => om.setSub("rfis")}>Open</Btn>}>
            {docs.length === 0 ? <div className="om-faint om-small">None generated yet.</div> : docs.map(x => <div key={x.id} className="om-row om-small" style={{ padding: "5px 0" }}><span style={{ flex: 1 }}>{x.type}</span><Badge>{x.status}</Badge></div>)}
            <div className="om-faint om-tiny" style={{ marginTop: 8 }}>Client updated {stamp(o.clientUpdated)}</div>
          </Card>
        </div>
      </Grid>
    </>
  );
}
