/* Finance: invoice readiness tied to verified deliveries, and an illustrative
   Sage handoff. Nothing here posts to Sage: every Sage step is simulated. */
import { useState } from "react";
import type { Om, Col } from "../ui";
import { Page, Head, Card, Grid, Btn, Badge, Kpi, Bar, Table, RefLink, Modal, Facts, Empty, useUi, Seg } from "../ui";
import type { Invoice, InvoiceStage } from "../types";
import { financeTotals, gross, VAT, pipeline, byId, TODAY, orderLabel, account, blockingOpen } from "../selectors";
import { gbp, gbpShort, dateUK, dateShort, stamp, pct, daysBetween } from "../format";
import { invoiceContext, invoiceGates, orderBilling, weeklyReceipts, sageExceptions, sageCustomerId, duplicateCount, PAYMENT_TERMS, sageMatch, customerBalances, monthlyBilling, FORECAST_MONTHS } from "./finance/shared";
import { SAGE_UNALLOCATED } from "../fixtures";
import "../../styles/om-fin.css";

const NET = "Net of VAT";
const FC_COL = ["var(--accent)", "#8cbcec", "var(--ok)", "#b9a0e8", "var(--warn)", "#e89aa0", "var(--neutral)"];
const STAGE_RANK = ["Held", "Eligible", "Ready for finance review", "Review approved", "Handoff simulated"];

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
  const receipts = weeklyReceipts(s, 8);
  const rmax = Math.max(1, ...receipts.map(w => w.issued + w.queued));
  const maxB = Math.max(1, ...f.buckets.map(b => b.value));
  const paidInv = s.invoices.filter(i => i.stage === "Paid" && i.issued && i.paid);
  const paid60 = paidInv.filter(i => daysBetween(i.paid!, TODAY) <= 60).reduce((t, i) => t + gross(i.net), 0);
  const dtp = paidInv.length ? Math.round(paidInv.reduce((t, i) => t + daysBetween(i.issued!, i.paid!), 0) / paidInv.length) : 0;
  const overdueV = f.debt.filter(d => d.daysOver > 0).reduce((t, d) => t + d.inv.net, 0);
  const billedAll = bill.reduce((t, r) => t + r.billed, 0);
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
        <Card span={7} title="Invoice queue and holds" sub="Every delivery-linked draft by stage · held drafts cannot move until a person clears the gate"
          right={<Badge tone={f.held.length ? "bad" : "ok"}>{f.held.length ? gbp(f.heldValue) + " held" : "No holds"}</Badge>} flush>
          <div className="om-list">
            {s.invoices.filter(i => i.loadId || i.stage === "Handoff simulated").sort((x, y) => STAGE_RANK.indexOf(x.stage) - STAGE_RANK.indexOf(y.stage)).map(i => {
              const c = invoiceContext(s, i);
              const tone = i.stage === "Held" ? "var(--bad)" : i.stage === "Eligible" ? "var(--warn)" : "var(--ok)";
              return (
                <div key={i.id} className="om-li">
                  <span className="om-dot" style={{ background: tone }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="om-row" style={{ gap: 8, flexWrap: "wrap" }}><RefLink om={om} r={{ kind: "invoice", id: i.id }} /><b style={{ fontWeight: 600, fontSize: 13 }}>{c.acc.name} · {c.d.name}</b><span className="om-mono" style={{ marginLeft: "auto" }}>{gbp(i.net)}</span></div>
                    <div className="om-muted om-small" style={{ marginTop: 3 }}><Badge dot={false}>{i.stage}</Badge> {i.hold || (c.load ? c.load.id + " " + c.load.status.toLowerCase() : i.description)}</div>
                  </div>
                  {i.stage === "Held" && c.load && <Btn sm onClick={() => om.go("Logistics", "pod", c.load!.id)}>Review POD</Btn>}
                  {i.stage !== "Held" && i.stage !== "Handoff simulated" && <Btn sm kind="primary" onClick={() => { om.setUi("sel:Finance:readiness", i.id); om.setSub("readiness"); }}>{i.stage === "Eligible" ? "Release" : "Review"}</Btn>}
                  {i.stage === "Handoff simulated" && <Badge tone="ok">Sent (mock)</Badge>}
                </div>
              );
            })}
          </div>
          <div className="om-kpis" style={{ padding: "12px 18px 16px", gridTemplateColumns: "repeat(4,minmax(0,1fr))" }}>
            {([["Held", f.heldValue, "bad"], ["Eligible", f.eligibleValue, "warn"], ["Ready", f.readyValue, "ok"], ["Handed off", f.handedValue, undefined]] as [string, number, "bad" | "warn" | "ok" | undefined][]).map(([k, v, tn]) => <Kpi key={k} label={k} value={gbpShort(v)} tone={v ? tn : undefined} onClick={() => om.setSub("readiness")} />)}
          </div>
        </Card>
        <Card span={5} title="Payment aging" sub="Issued invoices, illustrative Sage snapshot">
          <div className="om-col" style={{ gap: 12 }}>
            {f.buckets.map(b => (
              <button key={b.label} className="fin-bucket" onClick={() => om.setSub("debtors")}>
                <div className="om-row"><span className="om-small">{b.label}</span><span className="om-faint om-tiny">{b.items.length} inv</span><span className="om-mono om-small" style={{ marginLeft: "auto" }}>{gbp(b.value)}</span></div>
                <Bar value={b.value} max={maxB} color={/60/.test(b.label) ? "var(--bad)" : /31/.test(b.label) ? "var(--warn)" : undefined} />
              </button>
            ))}
            <div className="om-label" style={{ margin: "6px 0 0" }}>Largest balances</div>
            {customerBalances(s).filter(x => x.pulse).sort((a, b) => b.pulse - a.pulse).slice(0, 4).map(x => (
              <button key={x.a.id} className="fin-wk" onClick={() => { om.setUi("sel:Commercial:accounts", x.a.id); om.go("Commercial", "accounts"); }}>
                <span className="om-ink" style={{ flex: 1 }}>{x.a.name}</span>
                {x.overdueValue > 0 && <Badge tone={x.oldest > 60 ? "bad" : "warn"} dot={false}>{gbpShort(x.overdueValue)} overdue</Badge>}
                <span className="om-mono" style={{ width: 80, textAlign: "right" }}>{gbpShort(x.pulse)}</span>
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
          <div className="om-kpis" style={{ padding: "14px 18px 16px", gridTemplateColumns: "repeat(4,minmax(0,1fr))" }}>
            <Kpi label="Total contract" value={gbpShort(f.contract)} sub={s.orders.length + " orders"} />
            <Kpi label="Billed" value={gbpShort(billedAll)} sub={pct(billedAll / Math.max(1, f.contract)) + " of contract"} tone="ok" />
            <Kpi label="In the queue" value={gbpShort(f.readyValue + f.eligibleValue + f.heldValue)} sub={gbpShort(f.heldValue) + " of it held"} tone={f.heldValue ? "warn" : undefined} onClick={() => om.setSub("readiness")} />
            <Kpi label="Still to bill" value={gbpShort(f.unbilled)} sub="phased by programme" onClick={() => om.setSub("forecast")} />
          </div>
        </Card>
        <div className="om-s-4 om-col" style={{ gap: 14 }}>
          <Card title="Expected receipts" sub="Next eight weeks · issued and queued, net · demo timing" right={<Btn sm onClick={() => om.setSub("forecast")}>Forecast</Btn>}>
            <div className="om-col" style={{ gap: 7 }}>
              {receipts.map(w => { const v = w.issued + w.queued; return (
                <button key={w.week} className="fin-wk" onClick={() => { om.setUi("sel:Finance:forecast", w.week); om.setSub("forecast"); }}>
                  <span className="om-faint" style={{ width: 62 }}>{dateShort(w.week)}</span>
                  <span style={{ flex: 1 }}><Bar value={v} max={rmax} color={w.issued >= w.queued ? "var(--ok)" : "var(--accent)"} height={6} /></span>
                  <span className="om-mono" style={{ width: 78, textAlign: "right" }}>{v ? gbpShort(v) : "·"}</span>
                  {w.atRisk > 0 && <Badge tone="bad" dot={false}>+{gbpShort(w.atRisk)} at risk</Badge>}
                </button>
              ); })}
              <div className="om-row om-small" style={{ borderTop: "1px solid var(--border)", paddingTop: 8 }}><span className="om-muted">Eight-week total</span><span className="om-mono om-ink" style={{ marginLeft: "auto" }}>{gbp(receipts.reduce((t, w) => t + w.issued + w.queued, 0))}</span></div>
            </div>
          </Card>
          <Card title="Cash position" sub="Illustrative Sage snapshot">
            <div className="om-kv" style={{ gridTemplateColumns: "1fr auto" }}>
              <dt>Paid, last 60 days</dt><dd className="om-mono">{gbp(paid60)}</dd>
              <dt>Average days to pay</dt><dd className="om-mono">{dtp} days</dd>
              <dt>Overdue now</dt><dd className="om-mono" style={{ color: overdueV ? "var(--warn)" : undefined }}>{gbp(overdueV)}</dd>
              <dt>Unallocated receipts</dt><dd className="om-mono" style={{ color: "var(--warn)" }}>{gbp(SAGE_UNALLOCATED.reduce((t, r) => t + r.amount, 0))}</dd>
              <dt>Billed to date</dt><dd className="om-mono">{gbp(billedAll)}</dd>
              <dt>Contract still to bill</dt><dd className="om-mono">{gbp(f.unbilled)}</dd>
            </div>
            <div className="om-row" style={{ marginTop: 12, gap: 6, flexWrap: "wrap" }}><Btn sm onClick={() => om.setSub("sage")}>Reconcile</Btn><Btn sm onClick={() => { om.setUi("fin:debtBucket", "overdue"); om.setSub("debtors"); }}>Chase overdue</Btn></div>
          </Card>
        </div>
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
const MONTH = (m: string) => new Date(m + "-01T00:00:00Z").toLocaleDateString("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" });
function Sage({ om }: { om: Om }) {
  const s = om.s;
  const [filter, setFilter] = useUi<"all" | "drafts" | "issued" | "diff">(om, "fin:sageFilter", "all");
  const rows = s.invoices.filter(i => filter === "all" ? true : filter === "drafts" ? !!i.loadId : filter === "diff" ? sageMatch(i).tone === "warn" : !i.loadId);
  const ex = sageExceptions(s);
  const feed = s.events.filter(e => e.source === "Sage" || e.ref.kind === "invoice" || e.ref.kind === "load").slice(0, 8);
  const inSage = s.invoices.filter(i => i.sageRef && (i.stage === "Issued" || i.stage === "Paid"));
  const diffs = s.invoices.filter(i => sageMatch(i).tone === "warn");
  const diffValue = diffs.reduce((t, i) => t + (i.net - (i.sageNet ?? i.net)), 0);
  const unalloc = SAGE_UNALLOCATED.reduce((t, r) => t + r.amount, 0);
  const notIn = s.invoices.filter(i => i.loadId && !i.sageRef);
  const bal = customerBalances(s);
  const paid = s.invoices.filter(i => i.stage === "Paid" && i.issued && i.paid).sort((a, b) => b.paid!.localeCompare(a.paid!));
  return (
    <>
      <Head eyebrow="Sage reconciliation" title="Pulse to Sage mapping"
        sub="How approved billing events map to Sage, what the Sage snapshot holds, and what does not reconcile. Integration design shown with illustrative data."
        right={<><Badge tone="warn">Edition and API to confirm</Badge><Badge tone="draft">Illustrative integration · not connected</Badge></>} />
      <div className="om-kpis" style={{ marginBottom: 14 }}>
        <Kpi label="In Sage snapshot" value={inSage.length} sub={gbpShort(inSage.reduce((t, i) => t + i.net, 0)) + " issued and paid"} onClick={() => setFilter("issued")} />
        <Kpi label="Matched to Pulse" value={inSage.length - diffs.length} sub={pct((inSage.length - diffs.length) / Math.max(1, inSage.length)) + " of Sage invoices"} tone="ok" onClick={() => setFilter("issued")} />
        <Kpi label="Amounts differ" value={diffs.length} sub={gbp(diffValue) + " gap, Pulse above Sage"} tone={diffs.length ? "warn" : "ok"} onClick={() => setFilter("diff")} />
        <Kpi label="Unallocated receipts" value={gbpShort(unalloc)} sub={SAGE_UNALLOCATED.length + " payments with no invoice"} tone={unalloc ? "warn" : "ok"} />
        <Kpi label="Pulse drafts not in Sage" value={notIn.length} sub={gbpShort(notIn.reduce((t, i) => t + i.net, 0)) + " waiting on gates"} onClick={() => setFilter("drafts")} />
      </div>
      <Grid>
        <Card span={12} title="Mapping preview" sub="Customer and order references, net, VAT 20%, gross and the Sage-side amount" right={<Seg value={filter} onChange={setFilter} options={[["all", "All", s.invoices.length], ["issued", "Sage snapshot", s.invoices.filter(i => !i.loadId).length], ["drafts", "Pulse drafts", s.invoices.filter(i => i.loadId).length], ["diff", "Differences", diffs.length]]} />} flush>
          <Table rowKey={i => i.id} rows={rows} onRow={i => om.open({ kind: "invoice", id: i.id })} maxHeight={520}
            cols={[
              { k: "id", label: "Invoice", render: i => <><span className="om-mono ink" style={{ whiteSpace: "nowrap" }}>{i.id}</span><div className="om-faint om-tiny om-mono">{i.sageRef || "Not sent"}</div></> },
              { k: "c", label: "Pulse customer → Sage ID", render: i => { const c = invoiceContext(s, i); return <><div className="ink">{c.acc.name}</div><div className="om-faint om-tiny om-mono">{sageCustomerId(c.acc.name)} placeholder</div></>; } },
              { k: "o", label: "Order", render: i => <RefLink om={om} r={{ kind: "order", id: i.orderId }} /> },
              { k: "n", label: "Net", align: "right", cls: "mono", render: i => gbp(i.net) },
              { k: "g", label: "Gross", align: "right", cls: "mono", render: i => gbp(gross(i.net)) },
              { k: "sg", label: "Sage net", align: "right", cls: "mono", render: i => { const m = sageMatch(i); return m.sage === null ? "·" : <span style={{ color: m.tone === "warn" ? "var(--warn)" : undefined }}>{gbp(i.sageNet ?? i.net)}</span>; } },
              { k: "s", label: "Status", render: i => <Badge>{i.stage}</Badge> },
              { k: "m", label: "Match", render: i => { const m = sageMatch(i); return <Badge tone={m.tone} title={i.sageNote}>{m.label}</Badge>; } },
            ] as Col<Invoice>[]} />
        </Card>
        <Card span={12} title="Customer balances, Pulse against Sage" sub="One card per customer. Amber means the two systems disagree or cash is unallocated · click to open the account">
          <div className="vz-tiles" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))" }}>
            {bal.map(x => {
              const issue = x.diff !== 0 || x.unalloc > 0;
              return (
                <button key={x.a.id} className="vz-tile" style={issue ? { borderColor: "color-mix(in srgb,var(--warn) 40%,var(--border))" } : undefined} onClick={() => { om.setUi("sel:Commercial:accounts", x.a.id); om.go("Commercial", "accounts"); }}>
                  <div className="t"><b>{x.a.name}</b><Badge tone={issue ? "warn" : "ok"} dot={false}>{issue ? "To reconcile" : "Reconciled"}</Badge></div>
                  <div className="n">{gbpShort(x.pulse)}</div>
                  <div className="vz-split" title="Overdue share of the open balance"><i style={{ width: (x.pulse ? (x.overdueValue / x.pulse) * 100 : 0) + "%", background: x.oldest > 60 ? "var(--bad)" : "var(--warn)" }} /><i style={{ width: (x.pulse ? ((x.pulse - x.overdueValue) / x.pulse) * 100 : 0) + "%", background: "var(--ok)" }} /></div>
                  <div className="f">
                    <span>{x.open.length} open</span>
                    {x.overdueValue > 0 && <span style={{ color: x.oldest > 60 ? "var(--bad)" : "var(--warn)" }}>{gbpShort(x.overdueValue)} overdue</span>}
                    {x.dtp !== null && <span>pays in {x.dtp}d</span>}
                  </div>
                  {(x.diff !== 0 || x.unalloc > 0) && <div className="d" style={{ color: "var(--warn)" }}>{x.diff ? "Sage shows " + gbpShort(x.sage) + " (" + gbpShort(x.diff) + " less)" : ""}{x.diff && x.unalloc ? " · " : ""}{x.unalloc ? gbpShort(x.unalloc) + " unallocated cash" : ""}</div>}
                </button>
              );
            })}
          </div>
          <div className="vz-legend" style={{ marginTop: 12 }}><span><i style={{ background: "var(--ok)" }} />Not yet due</span><span><i style={{ background: "var(--warn)" }} />Overdue</span><span><i style={{ background: "var(--bad)" }} />Over 60 days</span></div>
        </Card>
        <Card span={5} title="Exceptions" sub={ex.length + " items need a person"} flush>
          {ex.length === 0 ? <Empty title="Everything reconciles" /> : <div className="om-list" style={{ maxHeight: 420, overflow: "auto" }}>
            {ex.map(x => (
              <button key={x.id} className="om-li" onClick={() => om.open({ kind: "invoice", id: x.invId })}>
                <span className="om-dot" style={{ background: x.tone === "bad" ? "var(--bad)" : x.tone === "warn" ? "var(--warn)" : "#8cbcec" }} />
                <div style={{ minWidth: 0 }}><div className="om-small om-ink" style={{ fontWeight: 600 }}>{x.title}</div><div className="om-faint om-tiny">{x.note}</div></div>
              </button>
            ))}
          </div>}
        </Card>
        <Card span={7} title="Receipts in the snapshot" sub="Payments Sage has recorded, newest first, plus cash it could not match" flush>
          <div className="om-scroll">
            <table className="om-tbl">
              <thead><tr><th>Reference</th><th>Customer</th><th>Received</th><th className="r">Amount</th><th className="r">Days to pay</th><th>Allocation</th></tr></thead>
              <tbody>
                {SAGE_UNALLOCATED.map(r => <tr key={r.ref}><td className="mono ink">{r.ref}</td><td>{account(s, r.accountId)?.name}</td><td className="mono">{dateShort(r.received)}</td><td className="r mono">{gbp(r.amount)}</td><td className="r">·</td><td><Badge tone="warn" title={r.note}>Unallocated</Badge></td></tr>)}
                {paid.map(i => { const c = invoiceContext(s, i); const d = daysBetween(i.issued!, i.paid!); return <tr key={i.id} className="click" onClick={() => om.open({ kind: "invoice", id: i.id })}><td className="mono ink">{i.sageRef}</td><td>{c.acc.name}</td><td className="mono">{dateShort(i.paid)}</td><td className="r mono">{gbp(gross(i.net))}</td><td className="r mono" style={{ color: d > PAYMENT_TERMS ? "var(--warn)" : undefined }}>{d}d</td><td><Badge tone="ok">{i.id}</Badge></td></tr>; })}
              </tbody>
            </table>
          </div>
        </Card>
        <Card span={5} title="Controls in the design">
          <dl className="om-kv">
            <dt>Duplicate guard</dt><dd>One handoff per load reference. A repeat is refused before it reaches Sage. {duplicateCount(s)} duplicates today.</dd>
            <dt>Who can hand off</dt><dd>Finance review approval only. No agent can post an invoice.</dd>
            <dt>Direction</dt><dd>Pulse proposes approved billing events. Sage returns invoice ID, status, credits and payments.</dd>
            <dt>Reconciliation</dt><dd>Nightly snapshot matched on customer, order reference and amount (illustrative).</dd>
            <dt>Still to confirm</dt><dd>Sage product edition, API or file import route, nominal codes, VAT treatment for each contract.</dd>
          </dl>
          <div className="om-label" style={{ margin: "16px 0 8px" }}>Sync health (mock)</div>
          <div className="om-kpis" style={{ gridTemplateColumns: "repeat(3,minmax(0,1fr))" }}>
            <Kpi label="Last snapshot" value="02:00" sub="09 Nov, nightly" />
            <Kpi label="Match rate" value={pct((inSage.length - diffs.length) / Math.max(1, inSage.length))} sub={inSage.length + " Sage invoices"} tone="ok" />
            <Kpi label="Open exceptions" value={ex.length} sub="need a person" tone={ex.length ? "warn" : "ok"} />
          </div>
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
      </Grid>
    </>
  );
}

/* ── Debtors ────────────────────────────────────────────────────────────── */
type DebtF = "all" | "due" | "overdue" | "30" | "31" | "60";
const DEBT_F: [DebtF, string, (d: number) => boolean][] = [
  ["all", "All open", () => true], ["due", "Not yet due", d => d < 0], ["overdue", "All overdue", d => d > 0],
  ["30", "1-30 days", d => d >= 0 && d <= 30], ["31", "31-60 days", d => d > 30 && d <= 60], ["60", "Over 60 days", d => d > 60],
];
function Debtors({ om }: { om: Om }) {
  const s = om.s, f = financeTotals(s);
  const [bk, setBk] = useUi<DebtF>(om, "fin:debtBucket", "all");
  const cur = DEBT_F.find(x => x[0] === bk) || DEBT_F[0];
  const rows = f.debt.filter(d => cur[2](d.daysOver)).sort((a, b) => b.daysOver - a.daysOver);
  const bucketOf = (d: number) => d > 60 ? "Over 60 days" : d > 30 ? "31-60 days over" : d > 0 ? "1-30 days over" : "Not yet due";
  const reminders = (i: Invoice) => i.history.filter(h => /Reminder/.test(h.text)).length;
  const bal = customerBalances(s).filter(x => x.open.length).sort((a, b) => b.overdueValue - a.overdueValue || b.pulse - a.pulse);
  const KEY: Record<string, DebtF> = { "Not yet due": "due", "1-30 days over": "30", "31-60 days over": "31", "Over 60 days": "60" };
  return (
    <>
      <Head eyebrow="Debtors" title="Aging queue" sub="Issued invoices from the illustrative Sage snapshot. Click a bucket or customer to narrow the list. Chasing drafts a reminder only; nothing is sent from the demo."
        right={<Badge tone={f.buckets[3].items.length ? "bad" : "ok"}>{f.buckets[3].items.length} over 60 days</Badge>} />
      <div className="om-kpis" style={{ marginBottom: 14 }}>
        {f.buckets.map(b => <Kpi key={b.label} label={b.label + (KEY[b.label] === bk ? " · shown" : "")} value={gbp(b.value)} sub={b.items.length + " invoices · " + NET} tone={/60/.test(b.label) && b.value ? "bad" : /31/.test(b.label) && b.value ? "warn" : undefined} onClick={() => setBk(KEY[b.label] === bk ? "all" : KEY[b.label])} />)}
      </div>
      <div className="om-row" style={{ marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
        <Seg value={bk} onChange={setBk} options={DEBT_F.map(([k, label, fn]) => [k, label, f.debt.filter(d => fn(d.daysOver)).length] as [DebtF, string, number])} />
        <span className="om-faint om-small" style={{ marginLeft: "auto" }}>{rows.length} invoices · {gbp(rows.reduce((t, d) => t + d.inv.net, 0))} net</span>
      </div>
      <Grid>
        <Card span={8} title={cur[1] === "All open" ? "Open invoices" : cur[1]} sub={"Snapshot " + dateUK(TODAY) + ". Sample records, not real customer debts."} flush>
          <Table rowKey={d => d.inv.id} rows={rows} onRow={d => om.open({ kind: "invoice", id: d.inv.id })} empty="No invoices in this bucket."
            cols={[
              { k: "i", label: "Invoice", render: d => <span className="om-mono ink" style={{ whiteSpace: "nowrap" }}>{d.inv.id}</span> },
              { k: "c", label: "Customer", render: d => { const c = invoiceContext(s, d.inv); return <><div className="ink" style={{ whiteSpace: "nowrap" }}>{c.acc.name}</div><div className="om-faint om-tiny">{d.inv.description}</div></>; } },
              { k: "du", label: "Due", render: d => <span style={{ whiteSpace: "nowrap" }}>{dateShort(d.inv.due)}</span> },
              { k: "o", label: "Days over", align: "right", render: d => <span className="om-mono" style={{ color: d.daysOver > 60 ? "var(--bad)" : d.daysOver > 0 ? "var(--warn)" : "var(--dim)" }}>{d.daysOver > 0 ? d.daysOver : "·"}</span> },
              { k: "b", label: "Bucket", render: d => <Badge tone={d.daysOver > 60 ? "bad" : d.daysOver > 0 ? "warn" : "ok"}>{bucketOf(d.daysOver)}</Badge> },
              { k: "n", label: "Net", align: "right", cls: "mono", render: d => <span title={"Gross " + gbp(gross(d.inv.net))}>{gbp(d.inv.net)}</span> },
              { k: "a", label: "", align: "right", render: d => <span onClick={e => e.stopPropagation()} className="om-row" style={{ justifyContent: "flex-end", gap: 6 }}>
                {reminders(d.inv) > 0 && <span className="om-faint om-tiny" style={{ whiteSpace: "nowrap" }}>{reminders(d.inv)} drafted</span>}
                <Btn sm disabled={d.daysOver <= 0} title={d.daysOver <= 0 ? "Not yet due" : "Draft a reminder (simulated)"} onClick={() => { om.do.chaseDebt(d.inv.id); om.toast("Reminder drafted for " + d.inv.id + ". Not sent."); }}>Draft reminder</Btn>
              </span> },
            ] as Col<typeof rows[number]>[]} />
        </Card>
        <Card span={4} className="om-sticky" title="By customer" sub="Open balance, overdue and oldest · click to open the account" flush>
          <div className="om-list">
            {bal.map(x => (
              <button key={x.a.id} className="om-li" onClick={() => { om.setUi("sel:Commercial:accounts", x.a.id); om.go("Commercial", "accounts"); }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="om-row"><span className="om-small om-ink" style={{ fontWeight: 600 }}>{x.a.name}</span><span className="om-mono om-small" style={{ marginLeft: "auto" }}>{gbp(x.pulse)}</span></div>
                  <div className="om-faint om-tiny">{x.open.length} open{x.overdueValue ? " · " + gbp(x.overdueValue) + " overdue · oldest " + x.oldest + "d" : " · nothing overdue"}{x.dtp !== null ? " · pays in " + x.dtp + "d" : ""}</div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </Grid>
    </>
  );
}

/* ── Forecast ───────────────────────────────────────────────────────────── */
function Forecast({ om }: { om: Om }) {
  const s = om.s, f = financeTotals(s), p = pipeline(s);
  const [delay, setDelay] = useUi<"0" | "14" | "30">(om, "fin:delay", "0");
  const dl = Number(delay);
  const weeks = weeklyReceipts(s, 8, dl);
  const w13 = weeklyReceipts(s, 13, dl);
  const sumW = (a: number, b: number) => w13.slice(a, b).reduce((t, w) => t + w.issued + w.queued, 0);
  const max = Math.max(1, ...weeks.map(w => w.issued + w.queued + w.atRisk));
  const confirmed = weeks.reduce((t, w) => t + w.issued, 0), queued = weeks.reduce((t, w) => t + w.queued, 0), atRisk = weeks.reduce((t, w) => t + w.atRisk, 0);
  const [sel, setSel] = useUi<string>(om, "sel:Finance:forecast", weeks[0].week);
  const wk = weeks.find(w => w.week === sel) || weeks[0];
  const mb = monthlyBilling(s);
  const [mi, setMi] = useState(0);
  const mmax = Math.max(1, ...mb.totals);
  const paid = s.invoices.filter(i => i.stage === "Paid" && i.issued && i.paid);
  const dtp = paid.length ? Math.round(paid.reduce((t, i) => t + daysBetween(i.issued!, i.paid!), 0) / paid.length) : 0;
  const over60 = f.debt.filter(d => d.daysOver > 60);
  const blocked = s.orders.filter(o => blockingOpen(s, o.id).length > 0);
  const risks: { tone: "bad" | "warn"; text: string; go: () => void }[] = [
    ...f.held.map(i => ({ tone: "bad" as const, text: i.id + " " + gbp(i.net) + " held: " + (i.hold || "gate not met") + ". Lands 30+ days after proof.", go: () => om.setSub("readiness") })),
    ...over60.map(d => ({ tone: "bad" as const, text: d.inv.id + " " + gbp(d.inv.net) + " is " + d.daysOver + " days over. Assumed paid in week 1, may not be.", go: () => { om.setUi("fin:debtBucket", "60"); om.setSub("debtors"); } })),
    ...blocked.map(o => ({ tone: "warn" as const, text: orderLabel(s, o) + ": " + blockingOpen(s, o.id).length + " blocking RFIs could push " + gbpShort(o.value) + " of billing right.", go: () => om.go("Projects", "rfis", o.id) })),
  ];
  return (
    <>
      <Head eyebrow="Forecast · demo timing" title="Expected receipts and billing"
        sub={"Contracted work and invoice readiness only. Issued invoices land on their due date, new drafts on " + PAYMENT_TERMS + "-day terms. Net of VAT."}
        right={<Seg value={delay} onChange={setDelay} options={[["0", "Paid on terms"], ["14", "14 days late"], ["30", "30 days late"]]} />} />
      <div className="om-kpis" style={{ marginBottom: 14 }}>
        <Kpi label="Cash in, next 4 weeks" value={gbpShort(sumW(0, 4))} sub={dl ? "if customers pay " + dl + " days late" : "on agreed terms"} tone="accent" />
        <Kpi label="Weeks 5 to 8" value={gbpShort(sumW(4, 8))} sub="issued plus queued drafts" />
        <Kpi label="Weeks 9 to 13" value={gbpShort(sumW(8, 13))} sub="queued drafts only so far" />
        <Kpi label="At risk (held)" value={gbpShort(atRisk)} sub="needs proof before invoicing" tone={atRisk ? "bad" : "ok"} onClick={() => om.setSub("readiness")} />
        <Kpi label="Avg days to pay" value={dtp + " days"} sub={"terms are " + PAYMENT_TERMS + " days"} tone={dtp > PAYMENT_TERMS ? "warn" : "ok"} onClick={() => om.setSub("sage")} />
      </div>
      <Grid>
        <Card span={8} title="Receipts by week" sub="Click a week to see what makes it up"
          right={<div className="om-row om-tiny" style={{ gap: 12 }}><span><i className="fin-sw" style={{ background: "var(--ok)" }} />Issued {gbpShort(confirmed)}</span><span><i className="fin-sw" style={{ background: "var(--accent)" }} />Queued {gbpShort(queued)}</span><span><i className="fin-sw" style={{ background: "var(--bad)" }} />At risk {gbpShort(atRisk)}</span></div>}>
          <div className="fin-chart" role="img" aria-label="Expected receipts by week, stacked by issued, queued and at risk">
            {weeks.map(w => {
              const tot = w.issued + w.queued + w.atRisk;
              return (
                <button key={w.week} className={"fin-colbar" + (w.week === wk.week ? " on" : "")} onClick={() => setSel(w.week)} title={"w/c " + dateShort(w.week) + ": " + gbp(tot)}>
                  <span className="om-mono om-tiny">{tot ? gbpShort(tot) : "·"}</span>
                  <span className="stack" style={{ height: Math.max(2, (tot / max) * 140) }}>
                    <i style={{ flex: w.atRisk, background: "var(--bad)" }} /><i style={{ flex: w.queued, background: "var(--accent)" }} /><i style={{ flex: w.issued, background: "var(--ok)" }} />
                  </span>
                  <span className="om-faint om-tiny">{dateShort(w.week)}</span>
                </button>
              );
            })}
          </div>
          <div className="om-divider" />
          <div className="om-label" style={{ marginBottom: 6 }}>w/c {dateShort(wk.week)} · {gbp(wk.issued + wk.queued + wk.atRisk)}</div>
          {wk.items.length === 0 ? <div className="om-faint om-small">No receipts expected this week.</div> : wk.items.map(it => {
            const c = invoiceContext(s, it.inv);
            return <div key={it.inv.id} className="om-row om-small" style={{ padding: "4px 0" }}><RefLink om={om} r={{ kind: "invoice", id: it.inv.id }} /><span className="om-muted">{c.acc.name}</span><Badge tone={it.kind === "issued" ? "ok" : it.kind === "queued" ? "accent" : "bad"} dot={false}>{it.kind === "issued" ? "Issued, due " + dateShort(it.inv.due) : it.kind === "queued" ? it.inv.stage : "Held / eligible"}</Badge><span className="om-mono" style={{ marginLeft: "auto" }}>{gbp(it.inv.net)}</span></div>;
          })}
        </Card>
        <Card span={4} title="Contracted vs speculative" sub="Never added together">
          <div className="om-col" style={{ gap: 14 }}>
            <div><div className="om-label">Contracted, unbilled</div><div className="fin-big">{gbp(f.unbilled)}</div><div className="om-faint om-tiny">{s.orders.length} awarded orders, after billed, ready and held drafts</div></div>
            <div><div className="om-label">In invoice queue</div><div className="fin-big">{gbp(f.readyValue + f.eligibleValue)}</div><div className="om-faint om-tiny">{gbp(f.heldValue)} more held on delivery evidence</div></div>
            <div className="om-divider" style={{ margin: 0 }} />
            <div><div className="om-label">Tender pipeline (speculative)</div><div className="fin-big" style={{ color: "var(--dim)" }}>{gbp(p.deduped)}</div>
              <div className="om-faint om-tiny">Weighted, one bid per building. {gbp(p.doubleCount)} of competing bids removed. Not a receipt forecast.</div></div>
            <Btn sm onClick={() => om.go("Commercial", "pipeline")}>Open tender pipeline</Btn>
            <div className="om-divider" style={{ margin: 0 }} />
            <div className="om-kv" style={{ gridTemplateColumns: "1fr auto" }}>
              <dt>Billing due this month</dt><dd className="om-mono">{gbpShort(mb.totals[0])}</dd>
              <dt>Peak billing month</dt><dd className="om-mono">{(() => { const i = mb.totals.indexOf(Math.max(...mb.totals)); return MONTH(FORECAST_MONTHS[i]) + " · " + gbpShort(mb.totals[i]); })()}</dd>
              <dt>Over 60 days, assumed in</dt><dd className="om-mono" style={{ color: over60.length ? "var(--bad)" : undefined }}>{gbpShort(over60.reduce((t, d) => t + d.inv.net, 0))}</dd>
            </div>
          </div>
        </Card>
        <Card span={12} title="Billing forecast by month" sub="Unbilled contract value spread across each order's delivery programme (illustrative phasing). Click a month to see what makes it up. Net of VAT.">
          <div className="fc-wrap">
            <div className="fc-chart" role="img" aria-label="Billing by month, stacked by order">
              {FORECAST_MONTHS.map((m, i) => {
                const tot = mb.totals[i];
                return (
                  <button key={m} className={"fc-col" + (i === mi ? " on" : "")} onClick={() => setMi(i)} title={MONTH(m) + ": " + gbp(tot)}>
                    <span className="om-mono om-tiny">{gbpShort(tot)}</span>
                    <span className="fc-stack" style={{ height: Math.max(4, (tot / mmax) * 170) }}>
                      {mb.rows.map((r, ri) => r.cells[i] ? <i key={r.o.id} style={{ flex: r.cells[i], background: FC_COL[ri % FC_COL.length] }} /> : null)}
                    </span>
                    <span className="om-small" style={{ color: i === mi ? "var(--ink)" : "var(--faint)" }}>{MONTH(m)}</span>
                  </button>
                );
              })}
            </div>
            <div className="fc-side">
              <div className="om-label" style={{ marginBottom: 2 }}>{MONTH(FORECAST_MONTHS[mi])}</div>
              <div className="fin-big" style={{ marginBottom: 10 }}>{gbp(mb.totals[mi])}</div>
              {mb.rows.map((r, ri) => ({ r, ri, v: r.cells[mi] })).filter(x => x.v).sort((a, b) => b.v - a.v).map(({ r, ri, v }) => (
                <button key={r.o.id} className="fin-wk" onClick={() => om.open({ kind: "order", id: r.o.id })}>
                  <i style={{ width: 10, height: 10, borderRadius: 3, background: FC_COL[ri % FC_COL.length], flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><span className="om-ink">{r.acc.name}</span> <span className="om-faint">{r.d.name}</span></span>
                  {blockingOpen(s, r.o.id).length > 0 && <Badge tone="warn" dot={false}>RFIs</Badge>}
                  <span className="om-mono">{gbpShort(v)}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="vz-legend" style={{ marginTop: 14 }}>{mb.rows.map((r, ri) => <span key={r.o.id}><i style={{ background: FC_COL[ri % FC_COL.length] }} />{r.acc.name} · {gbpShort(r.cells.reduce((a, c) => a + c, 0))}</span>)}<span style={{ marginLeft: "auto" }}>Six-month total <b className="om-ink om-mono" style={{ marginLeft: 6 }}>{gbp(mb.totals.reduce((a, c) => a + c, 0))}</b></span></div>
        </Card>
        <Card span={12} title="What could move this forecast" sub="Derived from held drafts, old debts and blocked orders · click to act" flush>
          {risks.length === 0 ? <Empty title="No known risks" /> : <div className="om-list">
            {risks.map((r, i) => <button key={i} className="om-li" onClick={r.go}><span className="om-dot" style={{ background: r.tone === "bad" ? "var(--bad)" : "var(--warn)" }} /><span className="om-small om-ink" style={{ flex: 1, textAlign: "left" }}>{r.text}</span><span className="om-faint om-tiny">Open →</span></button>)}
          </div>}
        </Card>
      </Grid>
    </>
  );
}
