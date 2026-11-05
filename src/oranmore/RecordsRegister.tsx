/* Records › Register: every shared record in one searchable list. */
import { useState } from "react";
import type { Om } from "./ui";
import { Page, Head, Card, Seg, Table, Badge, LineageChip, RefLink } from "./ui";
import type { Ref, Lineage } from "./types";
import { account, dev, orderLabel, byId } from "./selectors";
import { gbp, stamp } from "./format";

interface Row { ref: Ref; kind: string; title: string; status: string; links: Ref[]; lineage?: Lineage; value?: number }

function rows(om: Om): Row[] {
  const s = om.s; const out: Row[] = [];
  s.accounts.forEach(a => out.push({ ref: { kind: "account", id: a.id }, kind: "Customer", title: a.name, status: a.sector, links: s.enquiries.filter(e => e.accountId === a.id).map(e => ({ kind: "enquiry", id: e.id })), lineage: a.lineage }));
  s.devs.forEach(d => out.push({ ref: { kind: "development", id: d.id }, kind: "Development", title: d.name + ", " + d.town, status: s.enquiries.filter(e => e.devId === d.id).length + " bids", links: s.enquiries.filter(e => e.devId === d.id).map(e => ({ kind: "enquiry", id: e.id })), lineage: d.lineage }));
  s.enquiries.forEach(e => { const q = byId(s.quotes, e.quoteId)!; out.push({ ref: { kind: "enquiry", id: e.id }, kind: "Enquiry", title: account(s, e.accountId)?.name + " · " + dev(s, e.devId)?.name, status: e.contractorStatus + " · " + q.status, links: [{ kind: "quote", id: q.id }, { kind: "development", id: e.devId }], lineage: e.lineage, value: q.value }); });
  s.quotes.forEach(q => out.push({ ref: { kind: "quote", id: q.id }, kind: "Quote", title: q.id + " rev " + q.revision, status: q.status, links: [{ kind: "enquiry", id: q.enquiryId }].concat(s.orders.filter(o => o.quoteId === q.id).map(o => ({ kind: "order" as const, id: o.id }))) as Ref[], value: q.value }));
  s.orders.forEach(o => out.push({ ref: { kind: "order", id: o.id }, kind: "Order", title: orderLabel(s, o), status: o.portal, links: [{ kind: "quote", id: o.quoteId }].concat(s.loads.filter(l => l.orderId === o.id).map(l => ({ kind: "load" as const, id: l.id }))) as Ref[], lineage: o.lineage, value: o.value }));
  s.rfis.forEach(r => out.push({ ref: { kind: "rfi", id: r.id }, kind: "RFI", title: r.question, status: r.status + (r.blocking ? " · blocking" : ""), links: [{ kind: "order", id: r.orderId }] }));
  s.designs.forEach(d => out.push({ ref: { kind: "design", id: d.id }, kind: "Design", title: d.id + " " + d.revision, status: d.status, links: [{ kind: "order", id: d.orderId }], lineage: { source: "iThesis (illustrative)", updated: d.synced, state: "Read-only snapshot" } }));
  s.lots.forEach(l => out.push({ ref: { kind: "lot", id: l.id }, kind: "Lot", title: l.id + " · " + l.plant + " " + l.product, status: l.status + " · QA " + l.qa, links: [{ kind: "order", id: l.orderId }], lineage: { source: "iThesis (illustrative)", updated: l.synced, state: "Read-only snapshot" } }));
  s.loads.forEach(l => out.push({ ref: { kind: "load", id: l.id }, kind: "Load", title: l.id + " · " + l.plant + " → " + dev(s, byId(s.orders, l.orderId)?.devId)?.name, status: l.status, links: ([{ kind: "order", id: l.orderId }, { kind: "carrier", id: l.carrierId }] as Ref[]).concat(l.invoiceId ? [{ kind: "invoice", id: l.invoiceId }] : []), lineage: { source: l.pod.verified ? "Pulse" : l.claimed ? "Carrier claim" : "Transport planner (mock)", updated: l.pod.verified || l.claimed || l.collect, state: l.pod.verified ? "Verified by a person" : l.claimed ? "Claim awaiting validation" : "Planned" } }));
  s.invoices.forEach(i => out.push({ ref: { kind: "invoice", id: i.id }, kind: "Invoice", title: i.id + " · " + i.description, status: i.stage, links: ([{ kind: "order", id: i.orderId }] as Ref[]).concat(i.loadId ? [{ kind: "load", id: i.loadId }] : []), value: i.net, lineage: { source: i.sageRef?.startsWith("SAGE") ? "Sage (illustrative)" : "Finance draft", updated: i.history.slice(-1)[0]?.at || i.issued || "", state: i.stage } }));
  return out;
}

const KINDS = ["All", "Customer", "Development", "Enquiry", "Quote", "Order", "RFI", "Design", "Lot", "Load", "Invoice"];

export default function RecordsRegister({ om }: { om: Om }) {
  const [kind, setKind] = useState("All");
  const [q, setQ] = useState("");
  const all = rows(om);
  const shown = all.filter(r => (kind === "All" || r.kind === kind) && (!q || (r.ref.id + " " + r.title + " " + r.status).toLowerCase().includes(q.toLowerCase())));
  return (
    <Page>
      <Head title="Register" sub="One list of every shared record. Customer → Development → Enquiry → Quote → Order → Design → Lot → Load → POD → Invoice. Click any row for its links and lineage." />
      <Card flush title={shown.length + " of " + all.length + " records"} right={<input className="om-input" style={{ width: 240 }} placeholder="Search ID, name or status" value={q} onChange={e => setQ(e.target.value)} aria-label="Search records" />}>
        <div style={{ padding: "0 18px 12px" }}><Seg options={KINDS.map(k => [k, k, k === "All" ? all.length : all.filter(r => r.kind === k).length] as [string, string, number])} value={kind} onChange={setKind} /></div>
        <Table rowKey={r => r.ref.kind + r.ref.id} rows={shown} onRow={r => om.open(r.ref)} maxHeight={640} cols={[
          { k: "id", label: "ID", render: r => <span className="om-mono ink">{r.ref.id}</span> },
          { k: "kind", label: "Type", render: r => r.kind },
          { k: "title", label: "Record", render: r => <span className="ink">{r.title}</span> },
          { k: "status", label: "Status", render: r => <Badge>{r.status}</Badge> },
          { k: "value", label: "Value (net)", align: "right", render: r => r.value ? <span className="om-mono">{gbp(r.value)}</span> : "—" },
          { k: "links", label: "Linked to", render: r => <span style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{r.links.slice(0, 3).map(l => <RefLink key={l.kind + l.id} om={om} r={l} />)}{r.links.length > 3 && <span className="om-faint">+{r.links.length - 3}</span>}</span> },
          { k: "lin", label: "Source", render: r => r.lineage ? <span title={stamp(r.lineage.updated)}><LineageChip l={r.lineage} /></span> : <span className="om-faint">Pulse</span> },
        ]} />
      </Card>
    </Page>
  );
}
