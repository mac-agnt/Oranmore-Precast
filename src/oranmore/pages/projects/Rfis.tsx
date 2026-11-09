import { useState } from "react";
import type { Om } from "../../ui";
import { Head, Grid, Card, Table, Badge, Btn, RefLink, Field, Check, Modal, Kpi } from "../../ui";
import type { Rfi } from "../../types";
import { account, dev, blockingOpen, rfisFor, docsFor, designFor } from "../../selectors";
import { DOC_TYPES } from "../../fixtures";
import { docBody, YOU } from "../../actions";
import { dateShort, stamp, gbp } from "../../format";
import { useOrder, OrderSelect } from "./common";

const AREAS = ["Design", "Logistics", "Commercial", "Finance", "Quality"];

export default function Rfis({ om }: { om: Om }) {
  const s = om.s;
  const [o, setSel] = useOrder(om);
  const acc = account(s, o.accountId), d = dev(s, o.devId);
  const rf = rfisFor(s, o.id);
  const blk = blockingOpen(s, o.id);
  const design = designFor(s, o.id);
  const [resolving, setResolving] = useState<Rfi | null>(null);
  const [answer, setAnswer] = useState("");
  const [q, setQ] = useState("");
  const [area, setArea] = useState("Design");
  const [blocking, setBlocking] = useState(false);
  const [docType, setDocType] = useState<string | null>(null);
  const doc = docType ? s.docs.find(x => x.orderId === o.id && x.type === docType) : undefined;
  const docs = docsFor(s, o.id);

  const resolve = () => {
    if (!resolving) return;
    om.do.resolveRfi(resolving.id, answer.trim() || "Answered by phone, confirmed on file", YOU);
    om.toast(resolving.id + " resolved." + (resolving.blocking ? " Blocking count updated everywhere." : ""));
    setResolving(null); setAnswer("");
  };
  const draft = () => {
    if (!q.trim()) return;
    om.do.draftRfi(o.id, q.trim(), blocking, area);
    om.toast("RFI drafted. Review it, then send.");
    setQ(""); setBlocking(false);
  };

  return (
    <>
      <Head title="RFIs & documents" sub="Information requests and contract letters for one project. Answers update the same order, so the blocker count on Home, Work, Agents, the portal and the dashboard all move together."
        right={<OrderSelect om={om} value={o.id} onChange={setSel} />} />
      <Grid>
        <div className="om-s-12 om-kpis">
          <Kpi label="RFIs on this order" value={rf.length} sub={rf.filter(r => r.status === "Resolved").length + " resolved"} />
          <Kpi label="Blocking design handover" value={blk.length} tone={blk.length ? "bad" : "ok"} sub={blk.length ? blk.map(b => b.id).join(", ") : "Nothing blocking"} />
          <Kpi label="Awaiting customer" value={rf.filter(r => r.status === "Awaiting customer").length} tone="warn" sub={blk[0] ? "Next due " + dateShort(blk[0].due) : "—"} />
          <Kpi label="Documents" value={docs.length + " / " + DOC_TYPES.length} sub={docs.filter(x => x.status === "Sent (simulated)").length + " sent (simulated)"} />
        </div>

        {blk.length === 0 && design?.status === "Awaiting information" && (
          <Card span={12}>
            <div className="om-row" style={{ gap: 12, flexWrap: "wrap", paddingTop: 14 }}>
              <Badge tone="ok">All blocking RFIs answered</Badge>
              <span className="om-small om-muted" style={{ flex: 1, minWidth: 240 }}>{d?.name} has the information design needs. Hand the contract data and RFI answers to the iThesis package {design.id}.</span>
              <Btn kind="primary" onClick={() => { om.do.handoverDesign(o.id); om.toast("Design handover simulated. iThesis package " + design.id + " now in design."); }}>Hand over to design (simulated)</Btn>
            </div>
          </Card>
        )}

        <Card span={8} title={"Requests for information · " + d?.name} sub={acc?.name + " · " + o.id} flush>
          <Table rows={rf} rowKey={r => r.id} empty="No RFIs on this order yet. Draft one on the right." cols={[
            { k: "id", label: "RFI", render: r => <RefLink om={om} r={{ kind: "rfi", id: r.id }} /> },
            { k: "q", label: "Question", render: r => <div style={{ minWidth: 220 }}><div className="ink" style={{ fontWeight: 400 }}>{r.question}</div>{r.response && <div className="om-faint om-tiny" style={{ marginTop: 3 }}>{r.respondedBy}: {r.response}</div>}</div> },
            { k: "a", label: "Area", render: r => <span className="om-small om-muted">{r.area}</span> },
            { k: "b", label: "Blocking", render: r => r.blocking ? <Badge tone={r.status === "Resolved" ? "neutral" : "bad"}>Blocking</Badge> : <span className="om-faint om-small">No</span> },
            { k: "o", label: "Owner", render: r => <span className="om-small">{r.owner}</span> },
            { k: "d", label: "Due", render: r => <span className="om-mono om-small">{dateShort(r.due)}</span> },
            { k: "s", label: "Status", render: r => <Badge>{r.status}</Badge> },
            { k: "r", label: "Reminders", align: "right", render: r => <span className="om-mono om-small" title={r.reminders.map(x => dateShort(x)).join(", ")}>{r.reminders.length}</span> },
            { k: "x", label: "", align: "right", render: r => r.status === "Resolved" ? null : (
              <div className="om-row" style={{ gap: 4, justifyContent: "flex-end" }}>
                {r.status === "Draft" && <Btn sm kind="primary" onClick={() => { om.do.sendRfi(r.id); om.toast(r.id + " sent to the customer portal (simulated)."); }}>Send</Btn>}
                {r.status === "Awaiting customer" && <Btn sm onClick={() => { om.do.remindRfi(r.id); om.toast("Reminder logged for " + r.id + " (simulated, no email)."); }}>Remind</Btn>}
                <Btn sm kind="quiet" onClick={() => { setResolving(r); setAnswer(""); }}>Resolve</Btn>
              </div>) },
          ]} />
        </Card>

        <Card span={4} className="om-sticky" title="Draft an RFI" sub="The Contract & RFI agent drafts; you send.">
          <div className="om-col">
            <Field label="Question"><textarea className="om-input" rows={3} value={q} onChange={e => setQ(e.target.value)} placeholder="e.g. Confirm lifting zone for stair core 2" /></Field>
            <Field label="Area"><select className="om-input" value={area} onChange={e => setArea(e.target.value)}>{AREAS.map(a => <option key={a}>{a}</option>)}</select></Field>
            <Check on={blocking} onToggle={() => setBlocking(!blocking)} label="Blocks design handover" />
            <Btn kind="primary" disabled={!q.trim()} onClick={draft}>Create draft</Btn>
            <div className="om-faint om-tiny">Sending puts the question in the customer portal. No email leaves the demo.</div>
          </div>
        </Card>

        <Card span={12} title="Contract documents" sub="Illustrative templates. The real document set is to be confirmed with Oranmore." flush>
          <Table rows={DOC_TYPES} rowKey={t => t} cols={[
            { k: "t", label: "Document", render: t => <span className="ink">{t}</span> },
            { k: "s", label: "Status", render: t => { const x = docs.find(dd => dd.type === t); return <Badge>{x ? x.status : "Not started"}</Badge>; } },
            { k: "u", label: "Updated", render: t => { const x = docs.find(dd => dd.type === t); return <span className="om-mono om-small om-faint">{x ? stamp(x.updated) : "—"}</span>; } },
            { k: "a", label: "", align: "right", render: t => {
              const x = docs.find(dd => dd.type === t);
              return (
                <div className="om-row" style={{ gap: 4, justifyContent: "flex-end" }}>
                  {!x && <Btn sm kind="primary" onClick={() => { om.do.generateDoc(o.id, t); setDocType(t); }}>Generate draft</Btn>}
                  {x && <Btn sm onClick={() => setDocType(t)}>{x.status === "Draft" ? "Edit & approve" : "Preview"}</Btn>}
                  {x && x.status === "Approved" && <Btn sm kind="primary" onClick={() => { om.do.sendDoc(x.id); om.toast(t + " marked sent (simulated)."); }}>Mark sent</Btn>}
                  {x && x.status === "Sent (simulated)" && <Btn sm kind="quiet" onClick={() => { om.do.generateDoc(o.id, t); setDocType(t); }}>Redraft</Btn>}
                </div>);
            } },
          ]} />
        </Card>
      </Grid>

      {resolving && (
        <Modal title={"Resolve " + resolving.id} sub={resolving.question} onClose={() => setResolving(null)}
          footer={<><Btn kind="quiet" onClick={() => setResolving(null)}>Cancel</Btn><Btn kind="primary" onClick={resolve}>Mark resolved</Btn></>}>
          <Field label="Customer's answer" hint="Recorded against the RFI and visible on the project journey.">
            <textarea className="om-input" rows={4} value={answer} onChange={e => setAnswer(e.target.value)} placeholder={resolving.area === "Design" ? "e.g. Crane TC1 at grid C4, 45 m radius" : "Answer"} />
          </Field>
          {resolving.blocking && <div className="om-small" style={{ marginTop: 10, color: "var(--warn)" }}>This RFI blocks design. Resolving it leaves {blk.filter(b => b.id !== resolving.id).length} blocking RFI(s) on {o.id}.</div>}
        </Modal>
      )}

      {docType && (
        <Modal title={docType} sub={d?.name + " · " + o.id + " · " + gbp(o.value) + " net"} onClose={() => setDocType(null)} width={760}
          footer={<>
            <span className="om-faint om-small" style={{ marginRight: "auto" }}>{doc ? doc.status + " · " + stamp(doc.updated) : "Not generated"}</span>
            <Btn kind="quiet" onClick={() => setDocType(null)}>Close</Btn>
            {doc && doc.status === "Draft" && <Btn kind="primary" onClick={() => { om.do.approveDoc(doc.id); om.toast(docType + " approved."); }}>Approve</Btn>}
            {doc && doc.status === "Approved" && <Btn kind="primary" onClick={() => { om.do.sendDoc(doc.id); om.toast(docType + " marked sent (simulated). No email sent."); setDocType(null); }}>Mark sent (simulated)</Btn>}
          </>}>
          {doc ? (
            <textarea className="om-input" rows={14} value={doc.body || docBody(doc.type, acc?.name || "", d?.name || "", o.id, gbp(o.value))} readOnly={doc.status !== "Draft"}
              onChange={e => om.do.editDoc(doc.id, e.target.value)} style={{ fontFamily: "var(--ui)", fontSize: 13 }} />
          ) : <div className="om-faint">Generating…</div>}
          <div className="om-faint om-tiny" style={{ marginTop: 8 }}>Prefilled from the order. Illustrative wording only; Oranmore's real templates replace this.</div>
        </Modal>
      )}
    </>
  );
}
