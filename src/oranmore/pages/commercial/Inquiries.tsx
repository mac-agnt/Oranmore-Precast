import type { Om, Col } from "../../ui";
import { Page, Head, Grid, Card, Table, Badge, Btn, Seg, Kpi, Facts, LineageChip, RefLink, Modal, Empty, useUi, toneOf } from "../../ui";
import type { EnquiryRow } from "../../selectors";
import { enquiryRows, PRE_SUBMIT, OPEN_QUOTE, dev, account } from "../../selectors";
import { gbp, dateShort, dateUK, num } from "../../format";
import { DueBadge, EstimatorSelect, productShort, ESTIMATORS } from "./shared";

type StatusF = "all" | "Tendering" | "Secured" | "Unknown";
type DueF = "all" | "open" | "soon" | "overdue";

export default function Inquiries({ om }: { om: Om }) {
  const s = om.s;
  const all = enquiryRows(s);
  const [sel, setSel] = useUi<string>(om, "sel:Commercial:inquiries", "INQ-26-104");
  const [fStatus, setFStatus] = useUi<StatusF>(om, "f:inq:status", "all");
  const [fDue, setFDue] = useUi<DueF>(om, "f:inq:due", "all");
  const [fEst, setFEst] = useUi<string>(om, "f:inq:est", "all");

  const rows = all.filter(r =>
    (fStatus === "all" || r.e.contractorStatus === fStatus) &&
    (fDue === "all" || (fDue === "open" && OPEN_QUOTE.includes(r.q.status)) || (fDue === "soon" && r.dueSoon) || (fDue === "overdue" && r.overdue)) &&
    (fEst === "all" || (fEst === "Unassigned" ? !r.e.estimator : r.e.estimator === fEst)));
  const cur = all.find(r => r.e.id === sel) || rows[0];

  const open = all.filter(r => OPEN_QUOTE.includes(r.q.status));
  const pre = all.filter(r => PRE_SUBMIT.includes(r.q.status));

  const cols: Col<EnquiryRow>[] = [
    { k: "id", label: "Inquiry", render: r => <span className="om-mono ink">{r.e.id}</span> },
    { k: "rec", label: "Received", render: r => <span className="om-mono">{dateShort(r.e.received)}</span> },
    { k: "cust", label: "Customer", render: r => <span className="ink">{r.account}</span> },
    { k: "dev", label: "Development", render: r => <span>{r.dev}{r.competing.length > 0 && <span title="Another contractor is tendering this building" style={{ marginLeft: 6 }}><Badge tone="warn" dot={false}>2 bids</Badge></span>}</span> },
    { k: "cs", label: "Contractor", render: r => <Badge tone={r.e.contractorStatus === "Secured" ? "ok" : r.e.contractorStatus === "Tendering" ? "info" : "draft"}>{r.e.contractorStatus}</Badge> },
    { k: "os", label: "Oranmore", render: r => <Badge>{r.q.status}</Badge> },
    { k: "prod", label: "Products", render: r => <span className="om-small">{r.e.products.map(productShort).join(" + ")}</span> },
    { k: "dr", label: "Dwgs", align: "right", render: r => <span className="om-mono">{r.e.drawings}</span> },
    { k: "est", label: "Estimator", render: r => r.e.estimator ? <span>{r.e.estimator}</span> : <Badge tone="warn" dot={false}>Unassigned</Badge> },
    { k: "due", label: "Quote due", render: r => <div className="om-col" style={{ gap: 3 }}><span className="om-mono">{dateShort(r.e.due)}</span><DueBadge r={r} /></div> },
    { k: "val", label: "Indicative", align: "right", render: r => <span className="om-mono ink">{r.q.value ? gbp(r.q.value) : "Not priced"}</span> },
    { k: "urg", label: "Urgency", render: r => <Badge tone={r.e.urgency === "Critical" ? "bad" : r.e.urgency === "High" ? "warn" : "neutral"} dot={false}>{r.e.urgency}</Badge> },
  ];

  return (
    <Page>
      <Head eyebrow="Commercial · Inquiries" title="Every enquiry, one log"
        sub="Replaces the manually updated Excel inquiry log. Contractor status (are they tendering or secured?) is kept separate from Oranmore's own quote status."
        right={<Btn kind="primary" onClick={() => om.do.intakeStart()}>Simulate incoming email</Btn>} />
      <Grid>
        <div className="om-s-12 om-kpis">
          <Kpi label="Open enquiries" value={open.length} sub={gbp(open.reduce((t, r) => t + r.q.value, 0)) + " indicative"} onClick={() => { setFDue("open"); setFStatus("all"); setFEst("all"); }} />
          <Kpi label="Due in 3 days" value={all.filter(r => r.dueSoon).length} tone="warn" sub="not yet submitted" onClick={() => { setFDue("soon"); setFStatus("all"); setFEst("all"); }} />
          <Kpi label="Overdue" value={all.filter(r => r.overdue).length} tone={all.some(r => r.overdue) ? "bad" : undefined} sub="past quote due date" onClick={() => { setFDue("overdue"); setFStatus("all"); setFEst("all"); }} />
          <Kpi label="Unassigned" value={pre.filter(r => !r.e.estimator).length} sub="need an estimator" onClick={() => { setFEst("Unassigned"); setFDue("all"); setFStatus("all"); }} />
          <Kpi label="Drawings in estimating" value={num(pre.reduce((t, r) => t + r.e.drawings, 0))} sub={pre.length + " packs before submission"} />
          <Kpi label="Contractor secured" value={open.filter(r => r.e.contractorStatus === "Secured").length + " of " + open.length} sub="open enquiries with a won main contract" onClick={() => { setFStatus("Secured"); setFDue("open"); setFEst("all"); }} />
        </div>

        <Card span={12} flush>
          <div className="om-row" style={{ padding: "12px 16px", flexWrap: "wrap", gap: 12 }}>
            <span className="om-eyebrow">Contractor</span>
            <Seg<StatusF> value={fStatus} onChange={setFStatus} options={[["all", "All", all.length], ["Tendering", "Tendering", all.filter(r => r.e.contractorStatus === "Tendering").length], ["Secured", "Secured", all.filter(r => r.e.contractorStatus === "Secured").length], ["Unknown", "Unknown", all.filter(r => r.e.contractorStatus === "Unknown").length]]} />
            <span className="om-eyebrow" style={{ marginLeft: 6 }}>Due</span>
            <Seg<DueF> value={fDue} onChange={setFDue} options={[["all", "All"], ["open", "Open"], ["soon", "≤3 days"], ["overdue", "Overdue"]]} />
            <span className="om-eyebrow" style={{ marginLeft: 6 }}>Estimator</span>
            <Seg<string> value={fEst} onChange={setFEst} options={[["all", "All"], ...ESTIMATORS.map(n => [n, n.split(" ")[0]] as [string, string]), ["Unassigned", "Unassigned"]]} />
            <span className="om-faint om-small" style={{ marginLeft: "auto" }}>{rows.length} of {all.length} shown</span>
          </div>
        </Card>

        <Card span={8} flush title="Inquiry log" sub="Source: commercial Excel (mock import) plus email intake. Click a row for detail.">
          <Table cols={cols} rows={rows} rowKey={r => r.e.id} selKey={cur?.e.id} onRow={r => setSel(r.e.id)} maxHeight={620} />
        </Card>

        <div className="om-s-4 om-col" style={{ gap: 14 }}>
          {cur ? <InquiryPanel om={om} r={cur} /> : <Card><Empty title="No inquiry selected" hint="Pick a row from the log." /></Card>}
        </div>
      </Grid>
      {s.intake && <IntakeModal om={om} onSaved={id => setSel(id)} />}
    </Page>
  );
}

function InquiryPanel({ om, r }: { om: Om; r: EnquiryRow }) {
  const s = om.s;
  const reviewOpen = r.q.checklist.find(c => c.key === "review" && !c.done);
  return (
    <>
      <Card title={<span className="om-mono">{r.e.id}</span>} sub={r.account + " · " + r.dev} right={<LineageChip l={r.e.lineage} />}>
        <div className="om-row" style={{ gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          <Badge tone={r.e.contractorStatus === "Secured" ? "ok" : r.e.contractorStatus === "Tendering" ? "info" : "draft"}>Contractor {r.e.contractorStatus.toLowerCase()}</Badge>
          <Badge>{r.q.status}</Badge>
          <DueBadge r={r} />
        </div>
        <Facts items={[
          ["Received", dateUK(r.e.received)],
          ["Quote due", dateUK(r.e.due)],
          ["Products", r.e.products.join(", ")],
          ["Drawings", r.e.drawings + " packages"],
          ["Indicative", r.q.value ? gbp(r.q.value) : "Not priced"],
          ["Source", r.e.source],
          ...(r.e.m2 ? [["Hollowcore", num(r.e.m2) + " m²"] as [string, string]] : []),
          ...(r.e.plantPref ? [["Plant preference", r.e.plantPref] as [string, string]] : []),
        ]} />
        {r.q.status === "Estimating" && r.q.value > 0 && <div className="om-small om-muted" style={{ marginTop: 10 }}>{gbp(r.q.value)} is an estimate under preparation, not a sent price{reviewOpen ? ". Manager review needed." : "."}</div>}
        <div style={{ marginTop: 14 }}>
          <span className="om-label">Estimator</span>
          <EstimatorSelect om={om} enquiryId={r.e.id} value={r.e.estimator} />
        </div>
        <div className="om-row" style={{ marginTop: 14, flexWrap: "wrap", gap: 6 }}>
          <Btn kind="primary" sm onClick={() => om.go("Commercial", "quotations", r.q.id)}>Open quotation</Btn>
          {r.order && <Btn sm onClick={() => om.go("Projects", "journey", r.order!.id)}>Project journey</Btn>}
          <Btn sm kind="quiet" onClick={() => om.open({ kind: "enquiry", id: r.e.id })}>Record</Btn>
        </div>
      </Card>

      {r.competing.length > 0 && (
        <Card title="Competing bids on this building" sub="Same development, different contractors">
          <div className="om-small om-muted" style={{ marginBottom: 10 }}>
            {r.competing.length + 1} contractors are tendering {r.dev}. Each enquiry and quote is kept separately; nothing is merged. Only one contractor can win the main contract, so the forecast counts one bid, not both.
          </div>
          <div className="om-col" style={{ gap: 6 }}>
            {[r.e, ...r.competing].map(e => {
              const q = s.quotes.find(x => x.id === e.quoteId)!;
              return (
                <div key={e.id} className="om-row" style={{ justifyContent: "space-between", padding: "7px 10px", border: "1px solid var(--border)", borderRadius: 10, background: e.id === r.e.id ? "var(--accent-faint)" : undefined }}>
                  <span><RefLink om={om} r={{ kind: "enquiry", id: e.id }} /> <span className="om-small">{account(s, e.accountId)?.name}</span></span>
                  <span className="om-row" style={{ gap: 6 }}><Badge tone={toneOf(q.status)}>{q.status}</Badge><span className="om-mono om-small">{gbp(q.value)}</span></span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 10 }}><Btn sm onClick={() => om.go("Commercial", "pipeline")}>See de-duplicated forecast</Btn></div>
        </Card>
      )}

      <Card title="Connected records">
        <div className="om-col" style={{ gap: 7 }}>
          <div className="om-row om-small" style={{ justifyContent: "space-between" }}><span className="om-faint">Customer</span><RefLink om={om} r={{ kind: "account", id: r.e.accountId }}>{r.account}</RefLink></div>
          <div className="om-row om-small" style={{ justifyContent: "space-between" }}><span className="om-faint">Development</span><RefLink om={om} r={{ kind: "development", id: r.e.devId }}>{dev(s, r.e.devId)?.name}</RefLink></div>
          <div className="om-row om-small" style={{ justifyContent: "space-between" }}><span className="om-faint">Quotation</span><RefLink om={om} r={{ kind: "quote", id: r.q.id }}>{r.q.id + " rev " + r.q.revision}</RefLink></div>
          {r.order && <div className="om-row om-small" style={{ justifyContent: "space-between" }}><span className="om-faint">Order</span><RefLink om={om} r={{ kind: "order", id: r.order.id }} /></div>}
          {s.tasks.filter(t => t.ref.id === r.e.id || t.ref.id === r.q.id).map(t => (
            <div key={t.id} className="om-row om-small" style={{ justifyContent: "space-between", gap: 8 }}><span className="om-faint" style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Task · {t.title}</span><Badge>{t.status}</Badge></div>
          ))}
        </div>
      </Card>
    </>
  );
}

function IntakeModal({ om, onSaved }: { om: Om; onSaved: (id: string) => void }) {
  const it = om.s.intake!;
  const pending = it.fields.filter(f => !f.confirmed);
  const accName = it.fields.find(f => f.key === "account")?.value;
  const matched = om.s.accounts.find(a => a.name === accName);
  const dup = it.duplicateOf ? dev(om.s, it.duplicateOf) : undefined;
  const save = () => {
    const id = om.do.intakeSave();
    if (id) { onSaved(id); om.toast(id + " created from email. Raw email kept; now in Work, Records and Activity."); }
  };
  return (
    <Modal width={1040} onClose={() => om.do.intakeCancel()}
      title="New inquiry from email"
      sub="Simulation: parsed locally, no mailbox connected. Nothing is created until you confirm every low-confidence field."
      footer={<>
        <span className="om-small om-muted" style={{ marginRight: "auto" }}>{pending.length ? pending.length + " field" + (pending.length > 1 ? "s" : "") + " need confirmation" : "All fields confirmed"}</span>
        <Btn kind="quiet" onClick={() => om.do.intakeCancel()}>Discard</Btn>
        <Btn kind="primary" disabled={pending.length > 0 || !matched} onClick={save} title={pending.length ? "Confirm every field first" : undefined}>Create inquiry</Btn>
      </>}>
      <div className="om-grid om-g-12">
        <div className="om-s-5 om-col">
          <div className="om-eyebrow">Raw email (kept as received)</div>
          <div className="om-card" style={{ padding: 14 }}>
            <div className="om-small"><span className="om-faint">From</span> {it.email.from}</div>
            <div className="om-small" style={{ marginTop: 4 }}><span className="om-faint">Received</span> {it.email.received.replace(" ", ", ")}</div>
            <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 10 }}>{it.email.subject}</div>
            <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 12.5, lineHeight: 1.6, color: "var(--body)", margin: "10px 0 0" }}>{it.email.body}</pre>
          </div>
          <div className="om-eyebrow">Attachments ({it.email.attachments.length}, mock)</div>
          <div className="om-row" style={{ flexWrap: "wrap", gap: 6 }}>
            {it.email.attachments.map(a => <span key={a} className="om-chip om-mono">{a}</span>)}
          </div>
        </div>
        <div className="om-s-7 om-col">
          <div className="om-eyebrow">Extracted fields</div>
          {matched && <div className="om-small" style={{ padding: "8px 12px", borderRadius: 10, background: "var(--ok-soft)", color: "var(--ok)" }}>Customer matched to existing account: {matched.name}. No duplicate account created.</div>}
          {dup && <div className="om-small" style={{ padding: "8px 12px", borderRadius: 10, background: "var(--warn-soft)", color: "var(--warn)" }}>Possible match: {dup.name} already exists. This will be kept as a separate development, not merged. Check before saving.</div>}
          <div className="om-card" style={{ padding: "4px 14px" }}>
            {it.fields.map(f => (
              <div key={f.key} className="om-row" style={{ padding: "9px 0", borderTop: "1px solid var(--border)", gap: 10, flexWrap: "wrap" }}>
                <span className="om-small om-faint" style={{ width: 150, flex: "none" }}>{f.label}</span>
                <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                  {f.options ? (
                    <select className="om-input" style={{ height: 30 }} value={f.value} onChange={e => om.do.intakeSet(f.key, e.target.value)}>
                      {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input className="om-input" style={{ height: 30 }} value={f.value} onChange={e => om.do.intakeSet(f.key, e.target.value)} />
                  )}
                </div>
                <Badge tone={f.confidence === "High" ? "ok" : f.confidence === "Medium" ? "warn" : "bad"} dot={false}>{f.confidence}</Badge>
                {f.confirmed ? <Badge tone="ok">Confirmed</Badge> : <Btn sm onClick={() => om.do.intakeConfirm(f.key)}>Confirm</Btn>}
              </div>
            ))}
          </div>
          <div className="om-faint om-tiny">Editing a field confirms it. Estimator assignment and pricing stay with the estimating team after the inquiry is created.</div>
        </div>
      </div>
    </Modal>
  );
}
