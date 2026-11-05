/* Finance: invoice readiness tied to verified deliveries, and an illustrative
   Sage handoff. Nothing here posts to Sage: every Sage step is simulated. */
import { useState } from "react";
import type { Om, Col } from "../ui";
import { Page, Head, Card, Grid, Btn, Badge, Kpi, Bar, Table, RefLink, Modal, Facts, Empty, useUi, Seg } from "../ui";
import type { Invoice, InvoiceStage } from "../types";
import { financeTotals, gross, VAT, pipeline, byId, TODAY, orderLabel } from "../selectors";
import { gbp, gbpShort, dateUK, dateShort, stamp, pct } from "../format";
import { invoiceContext, invoiceGates, orderBilling, weeklyReceipts, sageExceptions, sageCustomerId, duplicateCount, PAYMENT_TERMS } from "./finance/shared";
import "../../styles/om-fin.css";

const NET = "Net of VAT";

export default function Finance({ om }: { om: Om }) {
  const t = om.sub;
  return (
    <Page>
      {t === "overview" && <Overview om={om} />}
      {t === "readiness" && <Readiness om={om} />}
      {t === "sage" && <Sage om={om} />}
      {t === "debtors" && <Debtors om={om} />}
      {t === "forecast" && <Forecast om={om} />}
    </Page>
  );
}

/* ── Overview ───────────────────────────────────────────────────────────── */
function Overview({ om }: { om: Om }) {
  const s = om.s, f = financeTotals(s);
  const bill = orderBilling(s);
  const receipts = weeklyReceipts(s, 6);
  const maxB = Math.max(1, ...f.buckets.map(b => b.value));
  return (
    <>
      <Head eyebrow="Finance · Sage stays the ledger" title="Billing position"
        sub="Contract values, what can be invoiced now, and what is held until a delivery is proven. All figures net of VAT unless marked gross."
        right={<Btn kind="primary" onClick={() => om.setSub("readiness")}>Open invoice queue</Btn>} />
      <div className="om-kpis" style={{ marginBottom: 14 }}>
        <Kpi label="Contract value" value={gbpShort(f.contract)} sub={s.orders.length + " awarded orders · " + NET} />
        <Kpi label="Invoice-ready" value={gbpShort(f.readyValue)} sub={f.ready.length + " drafts · POD verified"} tone="ok" onClick={() => om.setSub("readiness")} />
        <Kpi label="Eligible to release" value={gbpShort(f.eligibleValue)} sub={f.eligible.length + " drafts awaiting finance"} tone={f.eligible.length ? "warn" : undefined} onClick={() => om.setSub("readiness")} />
        <Kpi label="Held" value={gbpShort(f.heldValue)} sub={f.held.length + " drafts · delivery evidence or query"} tone={f.held.length ? "bad" : undefined} onClick={() => om.setSub("readiness")} />
        <Kpi label="Open Sage invoices" value={gbpShort(f.issuedValue)} sub={f.issued.length + " issued (illustrative snapshot)"} onClick={() => om.setSub("debtors")} />
        <Kpi label="Unbilled contract" value={gbpShort(f.unbilled)} sub="Awarded, not yet invoiced" onClick={() => om.setSub("forecast")} />
      </div>
      <Grid>
        <Card span={7} title="Holds and why" sub="Drafts that cannot move until a person clears the gate"
          right={<Badge tone={f.held.length ? "bad" : "ok"}>{f.held.length ? gbp(f.heldValue) + " held" : "No holds"}</Badge>} flush>
          {f.held.length === 0 ? <Empty title="Nothing held" hint="Every delivered load has verified proof." /> :
            <div className="om-list">
              {f.held.map(i => {
                const c = invoiceContext(s, i);
                return (
                  <div key={i.id} className="om-li">
                    <span className="om-dot" style={{ background: "var(--bad)" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="om-row" style={{ gap: 8, flexWrap: "wrap" }}><RefLink om={om} r={{ kind: "invoice", id: i.id }} /><b style={{ fontWeight: 600, fontSize: 13 }}>{c.acc.name} · {c.d.name}</b><span className="om-mono" style={{ marginLeft: "auto" }}>{gbp(i.net)}</span></div>
                      <div className="om-muted om-small" style={{ marginTop: 3 }}>{i.hold}{c.load ? " · " + c.load.id + " " + c.load.status : ""}</div>
                    </div>
                    {c.load && <Btn sm onClick={() => om.go("Logistics", "pod", c.load!.id)}>Review POD</Btn>}
                  </div>
                );
              })}
            </div>}
        </Card>
        <Card span={5} title="Payment aging" sub="Issued invoices, illustrative Sage snapshot">
          <div className="om-col" style={{ gap: 12 }}>
            {f.buckets.map(b => (
              <button key={b.label} className="fin-bucket" onClick={() => om.setSub("debtors")}>
                <div className="om-row"><span className="om-small">{b.label}</span><span className="om-faint om-tiny">{b.items.length} inv</span><span className="om-mono om-small" style={{ marginLeft: "auto" }}>{gbp(b.value)}</span></div>
                <Bar value={b.value} max={maxB} color={/60/.test(b.label) ? "var(--bad)" : /31/.test(b.label) ? "var(--warn)" : undefined} />
              </button>
            ))}
            <div className="om-faint om-tiny">Sample records only. They are not real customer debts.</div>
          </div>
        </Card>
        <Card span={8} title="Billing by order" sub={NET} flush>
          <Table rowKey={r => r.o.id} onRow={r => om.open({ kind: "order", id: r.o.id })} rows={bill}
            cols={[
              { k: "o", label: "Order", render: r => <><div className="ink">{r.acc.name}</div><div className="om-faint om-tiny">{r.o.id} · {r.d.name}</div></> },
              { k: "v", label: "Contract", align: "right", cls: "mono", render: r => gbp(r.o.value) },
              { k: "b", label: "Billed", align: "right", cls: "mono", render: r => gbp(r.billed) },
              { k: "r", label: "Ready", align: "right", cls: "mono", render: r => r.ready ? gbp(r.ready) : "—" },
              { k: "h", label: "Held", align: "right", cls: "mono", render: r => r.held ? <span style={{ color: "var(--bad)" }}>{gbp(r.held)}</span> : r.eligible ? <span style={{ color: "var(--warn)" }}>{gbp(r.eligible)} elig.</span> : "—" },
              { k: "u", label: "Unbilled", align: "right", cls: "mono", render: r => gbp(r.unbilled) },
              { k: "p", label: "Progress", w: 120, render: r => <Bar value={r.billed + r.ready} max={r.o.value} /> },
            ] as Col<typeof bill[number]>[]} />
        </Card>
        <Card span={4} title="Expected receipts" sub="Next six weeks · demo timing">
          <div className="om-col" style={{ gap: 8 }}>
            {receipts.map(w => (
              <div key={w.week} className="om-row om-small">
                <span className="om-faint" style={{ width: 70 }}>w/c {dateShort(w.week)}</span>
                <span className="om-mono" style={{ marginLeft: "auto" }}>{gbp(w.issued + w.queued)}</span>
                {w.atRisk > 0 && <Badge tone="bad" dot={false}>{gbpShort(w.atRisk)} at risk</Badge>}
              </div>
            ))}
            <Btn sm onClick={() => om.setSub("forecast")}>Open forecast</Btn>
          </div>
        </Card>
      </Grid>
    </>
  );
}

/* ── Invoice readiness ──────────────────────────────────────────────────── */
const STAGES: { stage: InvoiceStage; label: string; hint: string }[] = [
  { stage: "Held", label: "Held", hint: "A gate is not met" },
  { stage: "Eligible", label: "Eligible", hint: "POD verified, release pending" },
  { stage: "Ready for finance review", label: "Ready for review", hint: "Counted as invoice-ready" },
  { stage: "Review approved", label: "Review approved", hint: "Awaiting simulated handoff" },
  { stage: "Handoff simulated", label: "Handoff simulated", hint: "Mock audit entry only" },
];

function Readiness({ om }: { om: Om }) {
  const s = om.s, f = financeTotals(s);
  const [sel, setSel] = useUi<string>(om, "sel:Finance:readiness", "INV-DR-4484");
  const [preview, setPreview] = useState<string | null>(null);
  const drafts = s.invoices.filter(i => i.loadId || i.stage === "Handoff simulated");
  return (
    <>
      <Head eyebrow="Invoice readiness" title="From proven delivery to Sage"
        sub="A draft only becomes invoice-ready after a person accepts the delivery proof and finance releases it. Totals below are net of VAT."
        right={<><Badge tone="ok">{gbp(f.readyValue)} ready</Badge><Badge tone="bad">{gbp(f.heldValue)} held</Badge></>} />
      <div className="fin-board">
        {STAGES.map(col => {
          const items = drafts.filter(i => i.stage === col.stage);
          const sum = items.reduce((t, i) => t + i.net, 0);
          return (
            <section key={col.stage} className="fin-col" aria-label={col.label}>
              <div className="fin-col-h">
                <div className="om-row"><Badge>{col.label}</Badge><span className="om-faint om-tiny" style={{ marginLeft: "auto" }}>{items.length}</span></div>
                <div className="om-mono om-small" style={{ marginTop: 8 }}>{gbp(sum)}</div>
                <div className="om-faint om-tiny">{col.hint}</div>
              </div>
              {items.length === 0 && <div className="om-faint om-tiny" style={{ padding: "10px 4px" }}>Nothing at this stage.</div>}
              {items.map(i => <InvoiceCard key={i.id} om={om} i={i} sel={sel === i.id} onSel={() => setSel(i.id)} onPreview={() => setPreview(i.id)} />)}
            </section>
          );
        })}
      </div>
      <Card title="Why totals exclude held drafts" style={{ marginTop: 14 }}>
        <div className="om-small om-muted" style={{ lineHeight: 1.6 }}>
          A haulier saying a load was delivered is not proof. {f.heldPod.map(i => i.id).join(", ") || "No draft"} {f.heldPod.length === 1 ? "is" : "are"} held for missing or unreviewed POD and {f.heldPod.length === 1 ? "is" : "are"} not counted in the {gbp(f.readyValue)} invoice-ready total.
          When the Transport team accepts the evidence, the draft moves to Eligible. Finance then releases it, reviews it, and only then can a simulated Sage handoff run.
        </div>
      </Card>
      {preview && <SagePreview om={om} id={preview} onClose={() => setPreview(null)} />}
    </>
  );
}

function InvoiceCard({ om, i, sel, onSel, onPreview }: { om: Om; i: Invoice; sel: boolean; onSel: () => void; onPreview: () => void }) {
  const s = om.s, c = invoiceContext(s, i), gates = invoiceGates(s, i);
  const podGate = gates[0];
  return (
    <article className={"fin-card" + (sel ? " sel" : "")} onClick={onSel}>
      <div className="om-row" style={{ gap: 6 }}><RefLink om={om} r={{ kind: "invoice", id: i.id }} /><span className="om-mono om-small" style={{ marginLeft: "auto", color: "var(--ink)" }}>{gbp(i.net)}</span></div>
      <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 6 }}>{c.acc.name}</div>
      <div className="om-faint om-tiny">{c.d.name}{c.load ? " · " : ""}{c.load && <RefLink om={om} r={{ kind: "load", id: c.load.id }} />}</div>
      <div className="om-faint om-tiny" style={{ marginTop: 2 }}>Gross {gbp(gross(i.net))} incl. VAT {pct(VAT)}</div>
      {i.hold && <div className="fin-hold">{i.hold}</div>}
      <div className="fin-gates">
        {gates.map(g => <div key={g.label} className="om-row om-tiny" title={g.note}><span style={{ color: g.ok ? "var(--ok)" : "var(--bad)", width: 12 }}>{g.ok ? "✓" : "•"}</span><span className={g.ok ? "om-muted" : "om-ink"}>{g.label}</span><span className="om-faint" style={{ marginLeft: "auto", textAlign: "right", maxWidth: "55%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.note}</span></div>)}
      </div>
      <div className="om-row" style={{ gap: 6, flexWrap: "wrap", marginTop: 10 }} onClick={e => e.stopPropagation()}>
        {i.stage === "Held" && (c.load && c.load.status !== "POD verified"
          ? <><Btn sm disabled title="Waits for verified POD">Release to queue</Btn><Btn sm onClick={() => om.go("Logistics", "pod", c.load!.id)}>Go to POD</Btn></>
          : <Btn sm disabled title="Gate not met">Release to queue</Btn>)}
        {i.stage === "Eligible" && <Btn sm kind="primary" onClick={() => { om.do.releaseInvoice(i.id); om.toast(i.id + " released to the invoice queue"); }}>Release to queue</Btn>}
        {i.stage === "Ready for finance review" && <Btn sm kind="primary" onClick={() => { om.do.approveInvoice(i.id); om.toast(i.id + " approved for Sage handoff (simulated)"); }}>Approve for Sage handoff</Btn>}
        {i.stage === "Review approved" && <Btn sm kind="primary" onClick={onPreview}>Simulate Sage handoff</Btn>}
        {i.stage === "Handoff simulated" && <><Badge tone="ok">Mock ref {i.sageRef}</Badge><Btn sm onClick={onPreview}>View mapping</Btn></>}
      </div>
      {i.stage === "Held" && podGate && !podGate.ok && <div className="om-faint om-tiny" style={{ marginTop: 6 }}>Waits for verified POD</div>}
    </article>
  );
}

function SagePreview({ om, id, onClose }: { om: Om; id: string; onClose: () => void }) {
  const s = om.s, i = byId(s.invoices, id); if (!i) return null;
  const c = invoiceContext(s, i);
  const done = i.stage === "Handoff simulated";
  const ref = c.o.contract.find(f => f.key === "ref")?.value || "—";
  return (
    <Modal title={(done ? "Simulated Sage handoff · " : "Preview Sage handoff · ") + i.id} sub="Field mapping from Pulse to an illustrative Sage invoice. Nothing is created in Sage." onClose={onClose} width={760}
      footer={<><Btn onClick={onClose}>{done ? "Close" : "Cancel"}</Btn>{!done && <Btn kind="primary" onClick={() => { om.do.simulateSage(i.id); om.toast(i.id + ": handoff simulated. Mock audit entry written, not a real export"); onClose(); }}>Simulate Sage handoff</Btn>}</>}>
      <div className="fin-banner">Illustrative integration · not connected<span>Sage edition and API access are still to confirm with the head of finance.</span></div>
      <table className="om-tbl" style={{ marginTop: 14 }}>
        <thead><tr><th>Sage field (illustrative)</th><th>Pulse source</th><th className="r">Value</th></tr></thead>
        <tbody>
          {([
            ["Customer account", "Account · " + c.acc.name, sageCustomerId(c.acc.name) + " (placeholder)"],
            ["Customer order ref", "Contract Detail Summary", ref],
            ["Our reference", "Order", c.o.id],
            ["Delivery reference", "Load (POD verified)", c.load ? c.load.id + (c.load.pod.verified ? " · " + stamp(c.load.pod.verified) : "") : "—"],
            ["Description", "Invoice draft", i.description],
            ["Nominal / account code", "To map with finance", "4000-PRECAST (placeholder)"],
            ["Net", "Invoice draft", gbp(i.net)],
            ["VAT 20%", "Standard rate (to confirm)", gbp(i.net * VAT)],
            ["Gross", "Calculated", gbp(gross(i.net))],
            ["Terms", "Account default (demo)", PAYMENT_TERMS + " days"],
          ] as [string, string, string][]).map(r => <tr key={r[0]}><td className="ink">{r[0]}</td><td className="om-muted">{r[1]}</td><td className="r mono">{r[2]}</td></tr>)}
        </tbody>
      </table>
      <div className="om-faint om-tiny" style={{ marginTop: 10 }}>Duplicate guard: a second handoff for {c.load?.id || "the same reference"} is refused. {duplicateCount(s)} duplicates detected across all drafts.</div>
    </Modal>
  );
}

/* ── Sage reconciliation ────────────────────────────────────────────────── */
function Sage({ om }: { om: Om }) {
  const s = om.s;
  const [filter, setFilter] = useUi<"all" | "drafts" | "issued">(om, "fin:sageFilter", "all");
  const rows = s.invoices.filter(i => filter === "all" ? true : filter === "drafts" ? !!i.loadId : !i.loadId);
  const ex = sageExceptions(s);
  const feed = s.events.filter(e => e.source === "Sage" || e.ref.kind === "invoice").slice(0, 10);
  return (
    <>
      <Head eyebrow="Sage reconciliation" title="Pulse to Sage mapping"
        sub="How approved billing events would map to Sage, and what does not reconcile. This is an integration design, shown with illustrative data."
        right={<><Badge tone="warn">Edition and API to confirm</Badge><Badge tone="draft">Illustrative integration · not connected</Badge></>} />
      <Grid>
        <Card span={8} title="Mapping preview" sub="Customer and order references, net, VAT 20% and gross" right={<Seg value={filter} onChange={setFilter} options={[["all", "All", s.invoices.length], ["drafts", "Pulse drafts", s.invoices.filter(i => i.loadId).length], ["issued", "Sage snapshot", s.invoices.filter(i => !i.loadId).length]]} />} flush>
          <Table rowKey={i => i.id} rows={rows} onRow={i => om.open({ kind: "invoice", id: i.id })}
            cols={[
              { k: "id", label: "Invoice", render: i => <span className="om-mono ink">{i.id}</span> },
              { k: "c", label: "Pulse customer → Sage ID", render: i => { const c = invoiceContext(s, i); return <><div className="ink">{c.acc.name}</div><div className="om-faint om-tiny om-mono">{sageCustomerId(c.acc.name)} placeholder</div></>; } },
              { k: "o", label: "Order", render: i => <RefLink om={om} r={{ kind: "order", id: i.orderId }} /> },
              { k: "n", label: "Net", align: "right", cls: "mono", render: i => gbp(i.net) },
              { k: "v", label: "VAT", align: "right", cls: "mono", render: i => gbp(i.net * VAT) },
              { k: "g", label: "Gross", align: "right", cls: "mono", render: i => gbp(gross(i.net)) },
              { k: "s", label: "Status", render: i => <Badge>{i.stage}</Badge> },
              { k: "r", label: "Sage ref", render: i => <span className="om-mono om-faint">{i.sageRef || "Not sent"}</span> },
            ] as Col<Invoice>[]} />
        </Card>
        <Card span={4} title="Exceptions" sub={ex.length + " items need a person"} flush>
          {ex.length === 0 ? <Empty title="Everything reconciles" /> : <div className="om-list">
            {ex.map(x => (
              <button key={x.id} className="om-li" onClick={() => om.open({ kind: "invoice", id: x.invId })}>
                <span className="om-dot" style={{ background: x.tone === "bad" ? "var(--bad)" : x.tone === "warn" ? "var(--warn)" : "#8cbcec" }} />
                <div style={{ minWidth: 0 }}><div className="om-small om-ink" style={{ fontWeight: 600 }}>{x.title}</div><div className="om-faint om-tiny">{x.note}</div></div>
              </button>
            ))}
          </div>}
        </Card>
        <Card span={7} title="Sync feed" sub="Mock Sage events and Pulse billing events" flush>
          <div className="om-list">
            {feed.map(e => (
              <button key={e.id} className="om-li" onClick={() => om.open(e.ref)}>
                <Badge tone={e.source === "Sage" ? "info" : "neutral"} dot={false}>{e.source}</Badge>
                <div style={{ minWidth: 0, flex: 1 }}><div className="om-small om-ink" style={{ fontWeight: 600 }}>{e.title}</div><div className="om-faint om-tiny">{e.note}</div></div>
                <span className="om-mono om-faint om-tiny">{stamp(e.at)}</span>
              </button>
            ))}
          </div>
        </Card>
        <Card span={5} title="Controls in the design">
          <dl className="om-kv">
            <dt>Duplicate guard</dt><dd>One handoff per load reference. A repeat is refused before it reaches Sage. {duplicateCount(s)} duplicates today.</dd>
            <dt>Who can hand off</dt><dd>Finance review approval only. No agent can post an invoice.</dd>
            <dt>Direction</dt><dd>Pulse proposes approved billing events. Sage returns invoice ID, status and payment.</dd>
            <dt>Reconciliation</dt><dd>Nightly snapshot matched on customer and order reference (illustrative).</dd>
            <dt>Still to confirm</dt><dd>Sage product edition, API or file import route, nominal codes, VAT treatment for each contract.</dd>
          </dl>
        </Card>
      </Grid>
    </>
  );
}

/* ── Debtors ────────────────────────────────────────────────────────────── */
function Debtors({ om }: { om: Om }) {
  const s = om.s, f = financeTotals(s);
  const rows = f.debt.slice().sort((a, b) => b.daysOver - a.daysOver);
  const bucketOf = (d: number) => d > 60 ? "Over 60 days" : d > 30 ? "31-60 days over" : d > 0 ? "1-30 days over" : "Not yet due";
  const reminders = (i: Invoice) => i.history.filter(h => /Reminder/.test(h.text)).length;
  return (
    <>
      <Head eyebrow="Debtors" title="Aging queue" sub="Issued invoices from the illustrative Sage snapshot. Chasing drafts a reminder only; nothing is sent from the demo."
        right={<Badge tone={f.buckets[3].items.length ? "bad" : "ok"}>{f.buckets[3].items.length} over 60 days</Badge>} />
      <div className="om-kpis" style={{ marginBottom: 14 }}>
        {f.buckets.map(b => <Kpi key={b.label} label={b.label} value={gbp(b.value)} sub={b.items.length + " invoices · " + NET} tone={/60/.test(b.label) && b.value ? "bad" : /31/.test(b.label) && b.value ? "warn" : undefined} />)}
      </div>
      <Card title="Open invoices" sub={"Snapshot " + dateUK(TODAY) + ". Sample records, not real customer debts."} flush>
        <Table rowKey={d => d.inv.id} rows={rows} onRow={d => om.open({ kind: "invoice", id: d.inv.id })}
          cols={[
            { k: "i", label: "Invoice", render: d => <span className="om-mono ink">{d.inv.id}</span> },
            { k: "c", label: "Customer", render: d => { const c = invoiceContext(s, d.inv); return <><div className="ink">{c.acc.name}</div><div className="om-faint om-tiny">{orderLabel(s, c.o).split(" · ")[1]} · {d.inv.description}</div></>; } },
            { k: "is", label: "Issued", render: d => dateShort(d.inv.issued) },
            { k: "du", label: "Due", render: d => dateShort(d.inv.due) },
            { k: "o", label: "Days over", align: "right", render: d => <span className="om-mono" style={{ color: d.daysOver > 60 ? "var(--bad)" : d.daysOver > 0 ? "var(--warn)" : "var(--dim)" }}>{d.daysOver > 0 ? d.daysOver : "—"}</span> },
            { k: "b", label: "Bucket", render: d => <Badge tone={d.daysOver > 60 ? "bad" : d.daysOver > 30 ? "warn" : d.daysOver > 0 ? "warn" : "ok"}>{bucketOf(d.daysOver)}</Badge> },
            { k: "n", label: "Net", align: "right", cls: "mono", render: d => gbp(d.inv.net) },
            { k: "g", label: "Gross", align: "right", cls: "mono", render: d => gbp(gross(d.inv.net)) },
            { k: "a", label: "", align: "right", render: d => <span onClick={e => e.stopPropagation()} className="om-row" style={{ justifyContent: "flex-end", gap: 6 }}>
              {reminders(d.inv) > 0 && <span className="om-faint om-tiny">{reminders(d.inv)} drafted</span>}
              <Btn sm disabled={d.daysOver <= 0} title={d.daysOver <= 0 ? "Not yet due" : "Draft a reminder (simulated)"} onClick={() => { om.do.chaseDebt(d.inv.id); om.toast("Reminder drafted for " + d.inv.id + ". Not sent."); }}>Draft reminder</Btn>
            </span> },
          ] as Col<typeof rows[number]>[]} />
      </Card>
    </>
  );
}

/* ── Forecast ───────────────────────────────────────────────────────────── */
function Forecast({ om }: { om: Om }) {
  const s = om.s, f = financeTotals(s), p = pipeline(s);
  const weeks = weeklyReceipts(s, 8);
  const max = Math.max(1, ...weeks.map(w => w.issued + w.queued + w.atRisk));
  const bill = orderBilling(s).filter(r => r.unbilled > 0).sort((a, b) => b.unbilled - a.unbilled);
  const confirmed = weeks.reduce((t, w) => t + w.issued, 0), queued = weeks.reduce((t, w) => t + w.queued, 0), atRisk = weeks.reduce((t, w) => t + w.atRisk, 0);
  const [sel, setSel] = useUi<string>(om, "sel:Finance:forecast", weeks[0].week);
  const wk = weeks.find(w => w.week === sel) || weeks[0];
  return (
    <>
      <Head eyebrow="Forecast · demo timing" title="Expected receipts"
        sub={"Contracted work and invoice readiness only. Payment timing assumes due dates for issued invoices and " + PAYMENT_TERMS + "-day terms for new drafts. Net of VAT."} />
      <Grid>
        <Card span={8} title="Receipts by week" sub="Click a week to see what makes it up"
          right={<div className="om-row om-tiny" style={{ gap: 12 }}><span><i className="fin-sw" style={{ background: "var(--ok)" }} />Issued {gbpShort(confirmed)}</span><span><i className="fin-sw" style={{ background: "var(--accent)" }} />Queued {gbpShort(queued)}</span><span><i className="fin-sw" style={{ background: "var(--bad)" }} />At risk {gbpShort(atRisk)}</span></div>}>
          <div className="fin-chart" role="img" aria-label="Expected receipts by week, stacked by issued, queued and at risk">
            {weeks.map(w => {
              const tot = w.issued + w.queued + w.atRisk;
              return (
                <button key={w.week} className={"fin-colbar" + (w.week === wk.week ? " on" : "")} onClick={() => setSel(w.week)} title={"w/c " + dateShort(w.week) + ": " + gbp(tot)}>
                  <span className="om-mono om-tiny">{tot ? gbpShort(tot) : "—"}</span>
                  <span className="stack" style={{ height: Math.max(2, (tot / max) * 140) }}>
                    <i style={{ flex: w.atRisk, background: "var(--bad)" }} /><i style={{ flex: w.queued, background: "var(--accent)" }} /><i style={{ flex: w.issued, background: "var(--ok)" }} />
                  </span>
                  <span className="om-faint om-tiny">{dateShort(w.week)}</span>
                </button>
              );
            })}
          </div>
          <div className="om-divider" />
          <div className="om-eyebrow" style={{ marginBottom: 6 }}>w/c {dateShort(wk.week)}</div>
          {wk.items.length === 0 ? <div className="om-faint om-small">No receipts expected this week.</div> : wk.items.map(it => {
            const c = invoiceContext(s, it.inv);
            return <div key={it.inv.id} className="om-row om-small" style={{ padding: "4px 0" }}><RefLink om={om} r={{ kind: "invoice", id: it.inv.id }} /><span className="om-muted">{c.acc.name}</span><Badge tone={it.kind === "issued" ? "ok" : it.kind === "queued" ? "accent" : "bad"} dot={false}>{it.kind === "issued" ? "Issued, due " + dateShort(it.inv.due) : it.kind === "queued" ? it.inv.stage : "Held / eligible"}</Badge><span className="om-mono" style={{ marginLeft: "auto" }}>{gbp(it.inv.net)}</span></div>;
          })}
        </Card>
        <Card span={4} title="Contracted vs speculative" sub="Never added together">
          <div className="om-col" style={{ gap: 14 }}>
            <div><div className="om-eyebrow">Contracted, unbilled</div><div className="fin-big">{gbp(f.unbilled)}</div><div className="om-faint om-tiny">{s.orders.length} awarded orders, after billed, ready and held drafts</div></div>
            <div><div className="om-eyebrow">In invoice queue</div><div className="fin-big">{gbp(f.readyValue + f.eligibleValue)}</div><div className="om-faint om-tiny">{gbp(f.heldValue)} more held on delivery evidence</div></div>
            <div className="om-divider" style={{ margin: 0 }} />
            <div><div className="om-eyebrow">Tender pipeline (speculative)</div><div className="fin-big" style={{ color: "var(--dim)" }}>{gbp(p.deduped)}</div>
              <div className="om-faint om-tiny">Weighted, one bid per building. {gbp(p.doubleCount)} of competing bids removed. Not a receipt forecast.</div></div>
            <Btn sm onClick={() => om.go("Commercial", "pipeline")}>Open tender pipeline</Btn>
          </div>
        </Card>
        <Card span={12} title="Awarded orders still to bill" sub={NET} flush>
          <Table rowKey={r => r.o.id} rows={bill} onRow={r => om.open({ kind: "order", id: r.o.id })}
            cols={[
              { k: "o", label: "Order", render: r => <><div className="ink">{r.acc.name} · {r.d.name}</div><div className="om-faint om-tiny">{r.o.id}</div></> },
              { k: "p", label: "Programme", render: r => <span className="om-muted">{r.o.programme}</span> },
              { k: "v", label: "Contract", align: "right", cls: "mono", render: r => gbp(r.o.value) },
              { k: "b", label: "Billed", align: "right", cls: "mono", render: r => gbp(r.billed) },
              { k: "u", label: "Unbilled", align: "right", cls: "mono", render: r => gbp(r.unbilled) },
              { k: "s", label: "Stage", render: r => <Badge>{r.o.invoice}</Badge> },
            ] as Col<typeof bill[number]>[]} />
        </Card>
      </Grid>
    </>
  );
}
