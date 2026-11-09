import type { Om } from "../../ui";
import { Head, Grid, Card, Table, Badge, Btn, RefLink, toneOf } from "../../ui";
import { account, dev, orderForQuote, blockingOpen, byId } from "../../selectors";
import { gbp, dateShort, dateUK } from "../../format";
import { useOrder, OrderNumbers } from "./common";

const PHASE = (design: string, prod: string, dispatch: string) =>
  dispatch === "Complete" ? "Complete" : dispatch === "Delivering" ? "Delivering" : prod !== "Not released" ? "In production" : design !== "Awaiting information" ? "Design" : "Contract setup";

export default function Awards({ om }: { om: Om }) {
  const s = om.s;
  const [sel, setSel] = useOrder(om);
  const rowsFor = (statuses: string[]) => s.quotes.filter(q => statuses.includes(q.status)).map(q => {
    const e = byId(s.enquiries, q.enquiryId)!;
    return { q, e, acc: account(s, e.accountId)?.name || "", site: dev(s, e.devId)?.name || "", order: orderForQuote(s, q.id) };
  });
  const awaiting = rowsFor(["Won"]).filter(r => !r.order);
  const submitted = rowsFor(["Quote submitted", "Negotiation"]);
  const wonWithOrder = rowsFor(["Won"]).filter(r => r.order);

  const create = (quoteId: string) => {
    const existing = orderForQuote(om.s, quoteId);
    if (existing) { om.toast(quoteId + " already has " + existing.id + ". No duplicate order created."); setSel(existing.id); om.open({ kind: "order", id: existing.id }); return; }
    const id = om.do.createOrder(quoteId);
    if (id) { setSel(id); om.toast(id + " created from " + quoteId + ". Customer, site and value inherited, nothing re-keyed."); om.setSub("contract"); }
  };
  const o = sel;
  const q = byId(s.quotes, o.quoteId);
  const delivery = (key: string) => o.contract.find(f => f.key === key)?.value || "";

  return (
    <>
      <Head title="Awards & orders" sub="An accepted quote becomes an order with the same customer, site, quote and value IDs. Values are inherited, never retyped, and a quote can only ever produce one order." />
      <Grid>
        <Card span={7} title="Awaiting an order" sub="Accepted or close to award. Creating the order carries the quote across." flush>
          <Table rows={[...awaiting, ...submitted]} rowKey={r => r.q.id} empty="Every accepted quote already has its order." cols={[
            { k: "q", label: "Quote", render: r => <RefLink om={om} r={{ kind: "quote", id: r.q.id }} /> },
            { k: "p", label: "Project", render: r => <div><div className="ink">{r.site}</div><div className="om-faint om-tiny">{r.acc} · contractor {r.e.contractorStatus.toLowerCase()}</div></div> },
            { k: "v", label: "Value", align: "right", cls: "mono", render: r => gbp(r.q.value) },
            { k: "s", label: "Status", render: r => <Badge>{r.q.status}</Badge> },
            { k: "a", label: "", align: "right", render: r => <Btn sm kind={r.q.status === "Won" ? "primary" : undefined} onClick={() => create(r.q.id)} title="Records the award and creates the order">{r.q.status === "Won" ? "Create order" : "Customer accepted: create order"}</Btn> },
          ]} />
          <div className="om-faint om-small" style={{ padding: "10px 18px 14px" }}>Only record an award once the customer has confirmed it in writing. Creating an order here does not send anything to the customer.</div>
        </Card>

        <Card span={5} title="Duplicate guard" sub="Won quotes that already have an order">
          {wonWithOrder.map(r => (
            <div key={r.q.id} className="om-row" style={{ padding: "7px 0", borderTop: "1px solid var(--border)", fontSize: 12.5 }}>
              <RefLink om={om} r={{ kind: "quote", id: r.q.id }} />
              <span className="om-faint">→</span>
              <RefLink om={om} r={{ kind: "order", id: r.order!.id }} />
              <span className="om-muted" style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.site}</span>
              <span style={{ marginLeft: "auto" }}><Btn sm kind="quiet" onClick={() => create(r.q.id)} title="Try to create a second order">Create again</Btn></span>
            </div>
          ))}
          <div className="om-faint om-tiny" style={{ marginTop: 8 }}>"Create again" demonstrates the guard: it opens the existing order instead of creating a copy.</div>
        </Card>

        <Card span={7} title="Orders" sub="Click to see what was inherited from the award" flush>
          <Table rows={s.orders} rowKey={x => x.id} selKey={o.id} onRow={x => setSel(x.id)} cols={[
            { k: "id", label: "Order", render: x => <RefLink om={om} r={{ kind: "order", id: x.id }} /> },
            { k: "p", label: "Project", render: x => <div><div className="ink">{dev(s, x.devId)?.name}</div><div className="om-faint om-tiny">{account(s, x.accountId)?.name} · from {x.quoteId}</div></div> },
            { k: "v", label: "Value", align: "right", cls: "mono", render: x => gbp(x.value) },
            { k: "ph", label: "Contract phase", render: x => <Badge tone={toneOf(PHASE(x.design, x.production, x.dispatch))}>{PHASE(x.design, x.production, x.dispatch)}</Badge> },
            { k: "pr", label: "Products", render: x => <span className="om-small om-muted">{x.products.join(", ")}</span> },
            { k: "a", label: "Awarded", render: x => <span className="om-mono om-small">{dateShort(x.awarded)}</span> },
          ]} />
        </Card>

        <Card span={5} className="om-sticky" title={o.id + " · " + (dev(s, o.devId)?.name || "")} sub={"Created from " + o.quoteId + " on " + dateUK(o.awarded)}>
          <OrderNumbers om={om} o={o} />
          <div className="om-eyebrow" style={{ margin: "14px 0 8px" }}>Inherited on award</div>
          <div className="om-kv" style={{ gridTemplateColumns: "130px 1fr" }}>
            <dt>Customer</dt><dd>{account(s, o.accountId)?.name} <span className="om-chip" style={{ height: 20 }}>from account</span></dd>
            <dt>Site</dt><dd>{dev(s, o.devId)?.name} <span className="om-chip" style={{ height: 20 }}>from {q?.enquiryId}</span></dd>
            <dt>Value (net)</dt><dd className="om-mono">{gbp(o.value)} <span className="om-chip" style={{ height: 20 }}>from {o.quoteId}{q ? " rev " + q.revision : ""}</span></dd>
            <dt>Products</dt><dd>{o.products.join(", ")} <span className="om-chip" style={{ height: 20 }}>from {o.quoteId}</span></dd>
          </div>
          <div className="om-eyebrow" style={{ margin: "16px 0 8px" }}>Delivery requirements</div>
          <div className="om-kv" style={{ gridTemplateColumns: "130px 1fr" }}>
            <dt>Programme</dt><dd>{o.programme}</dd>
            <dt>Site access</dt><dd>{delivery("access") || <span className="om-faint">Not yet captured</span>}</dd>
            <dt>Lifting</dt><dd>{delivery("lifting") || <span className="om-faint">Not yet captured</span>}</dd>
            <dt>Constraints</dt><dd>{delivery("delivery") || <span className="om-faint">Not yet captured</span>}</dd>
            <dt>Blocking RFIs</dt><dd>{blockingOpen(s, o.id).length ? <Badge tone="bad">{blockingOpen(s, o.id).length} open</Badge> : <Badge tone="ok">None</Badge>}</dd>
          </div>
          <div className="om-row" style={{ marginTop: 14, gap: 6, flexWrap: "wrap" }}>
            <Btn kind="primary" sm onClick={() => om.setSub("contract")}>Contract setup</Btn>
            <Btn sm onClick={() => om.setSub("rfis")}>RFIs & documents</Btn>
            <Btn sm kind="quiet" onClick={() => om.setSub("journey")}>Journey</Btn>
          </div>
        </Card>
      </Grid>
    </>
  );
}
