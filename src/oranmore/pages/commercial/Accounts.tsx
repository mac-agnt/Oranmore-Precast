import type { Om, Col } from "../../ui";
import { Page, Head, Grid, Card, Table, Badge, Btn, Facts, LineageChip, RefLink, Kpi, useUi, Empty } from "../../ui";
import type { Account } from "../../types";
import { enquiryRows, OPEN_QUOTE, orderBlockers, dev, blockingOpen, TODAY } from "../../selectors";
import { gbp, gbpShort, dateShort, daysBetween, pct, stamp } from "../../format";
import { sageCustomerId, PAYMENT_TERMS } from "../finance/shared";

export default function Accounts({ om }: { om: Om }) {
  const s = om.s;
  const rows = enquiryRows(s);
  const [sel, setSel] = useUi<string>(om, "sel:Commercial:accounts", "a-bam");
  const stats = (a: Account) => {
    const enq = rows.filter(r => r.e.accountId === a.id);
    const open = enq.filter(r => OPEN_QUOTE.includes(r.q.status));
    const orders = s.orders.filter(o => o.accountId === a.id);
    const inv = s.invoices.filter(i => orders.some(o => o.id === i.orderId));
    const issued = inv.filter(i => i.stage === "Issued");
    const paid = inv.filter(i => i.stage === "Paid" && i.issued && i.paid);
    const overdue = issued.filter(i => i.due && i.due < TODAY);
    const won = enq.filter(r => r.q.status === "Won").length, lost = enq.filter(r => r.q.status === "Lost").length;
    const priced = enq.filter(r => r.q.value > 0);
    return { enq, open, orders, orderValue: orders.reduce((t, o) => t + o.value, 0), openValue: open.reduce((t, r) => t + r.q.value, 0),
      blocked: orders.filter(o => orderBlockers(s, o).length > 0).length,
      inv, outstanding: issued.reduce((t, i) => t + i.net, 0), overdue, overdueValue: overdue.reduce((t, i) => t + i.net, 0),
      billed: inv.filter(i => ["Issued", "Paid", "Handoff simulated"].includes(i.stage)).reduce((t, i) => t + i.net, 0),
      held: inv.filter(i => i.stage === "Held").reduce((t, i) => t + i.net, 0),
      dtp: paid.length ? Math.round(paid.reduce((t, i) => t + daysBetween(i.issued!, i.paid!), 0) / paid.length) : null,
      won, lost, winRate: won + lost ? won / (won + lost) : null, avgQuote: priced.length ? priced.reduce((t, r) => t + r.q.value, 0) / priced.length : 0,
      last: enq.map(r => r.e.received).sort().slice(-1)[0], products: Array.from(new Set(orders.flatMap(o => o.products))) };
  };
  const list = s.accounts.map(a => ({ a, ...stats(a) })).sort((x, y) => y.orderValue + y.openValue - (x.orderValue + x.openValue));
  const cur = list.find(x => x.a.id === sel) || list[0];

  const cols: Col<typeof list[number]>[] = [
    { k: "n", label: "Account", render: x => <div><div className="ink">{x.a.name}</div><div className="om-faint om-tiny">{x.a.sector}</div></div> },
    { k: "e", label: "Open", align: "right", render: x => <span className="om-mono">{x.open.length}</span> },
    { k: "o", label: "Orders", align: "right", render: x => <span className="om-mono">{x.orders.length}</span> },
    { k: "ov", label: "Contract value", align: "right", render: x => <span className="om-mono ink">{x.orderValue ? gbpShort(x.orderValue) : "·"}</span> },
    { k: "os", label: "Owed", align: "right", render: x => x.outstanding ? <span className="om-mono" style={{ color: x.overdueValue ? "var(--warn)" : undefined }}>{gbpShort(x.outstanding)}</span> : <span className="om-faint">·</span> },
    { k: "b", label: "", render: x => x.blocked ? <Badge tone="bad" dot={false}>{x.blocked} blocked</Badge> : null },
  ];

  return (
    <Page>
      <Head eyebrow="Commercial · Accounts" title="Customers and contractors"
        sub="One record per customer. Bid history, live projects and contacts come from the same enquiries, quotes and orders used everywhere else." />
      <Grid>
        <Card span={5} flush className="om-sticky" title="Accounts" sub={s.accounts.length + " accounts · real contractor names, fictional demo projects"}>
          <Table cols={cols} rows={list} rowKey={x => x.a.id} selKey={cur?.a.id} onRow={x => setSel(x.a.id)} maxHeight={780} />
        </Card>
        <div className="om-s-7 om-col" style={{ gap: 14 }}>
          {!cur ? <Card><Empty title="No account selected" /></Card> : (
            <>
              <Card title={cur.a.name} sub={cur.a.sector + " · " + cur.a.hq} right={<LineageChip l={cur.a.lineage} />}>
                <div className="om-kpis om-kpis-4" style={{ marginBottom: 12 }}>
                  <Kpi label="Open quotes" value={cur.open.length} sub={gbp(cur.openValue)} />
                  <Kpi label="Orders" value={cur.orders.length} sub={gbp(cur.orderValue) + " net"} />
                  <Kpi label="Enquiries" value={cur.enq.length} sub={"since " + cur.a.since} />
                  <Kpi label="Blocked projects" value={cur.blocked} tone={cur.blocked ? "bad" : undefined} sub="before production or invoice" />
                  <Kpi label="Win rate" value={cur.winRate === null ? "·" : pct(cur.winRate)} sub={cur.won + " won, " + cur.lost + " lost"} />
                  <Kpi label="Avg quote" value={cur.avgQuote ? gbpShort(cur.avgQuote) : "·"} sub={cur.enq.filter(r => r.q.value > 0).length + " priced bids"} />
                  <Kpi label="Owed (Sage)" value={gbpShort(cur.outstanding)} sub={cur.overdue.length ? gbp(cur.overdueValue) + " overdue" : "nothing overdue"} tone={cur.overdueValue ? "warn" : undefined} onClick={() => { om.setUi("fin:debtBucket", cur.overdue.length ? "overdue" : "all"); om.go("Finance", "debtors"); }} />
                  <Kpi label="Pays in" value={cur.dtp === null ? "·" : cur.dtp + " days"} sub={"terms " + PAYMENT_TERMS + " days"} tone={cur.dtp !== null && cur.dtp > PAYMENT_TERMS ? "warn" : cur.dtp !== null ? "ok" : undefined} />
                </div>
                <Facts items={[["Account owner", cur.a.owner], ["Customer since", cur.a.since], ["Head office", cur.a.hq], ["Sage account (placeholder)", sageCustomerId(cur.a.name)], ["Last enquiry", cur.last ? dateShort(cur.last) : "·"], ["Products bought", cur.products.join(", ") || "None yet"], ["Billed to date", gbp(cur.billed)], ["Held on proof", cur.held ? gbp(cur.held) : "·"]]} />
                <p className="om-small om-muted" style={{ margin: "12px 0 0" }}>{cur.a.note}</p>
                <div className="om-row" style={{ marginTop: 12, gap: 6, flexWrap: "wrap" }}>
                  <Btn sm kind="primary" onClick={() => om.open({ kind: "account", id: cur.a.id })}>Open record</Btn>
                  <Btn sm onClick={() => om.go("Records")}>Open in Records</Btn>
                  <Btn sm onClick={() => { om.setUi("f:inq:status", "all"); om.setUi("f:inq:due", "all"); om.setUi("f:inq:est", "all"); om.go("Commercial", "inquiries", cur.enq[0]?.e.id); }} >Inquiries</Btn>
                </div>
              </Card>

              <Card title="Live journeys" sub="Orders for this customer and what is holding them">
                {cur.orders.length === 0 && <div className="om-faint om-small">No orders yet.</div>}
                {cur.orders.map(o => {
                  const b = orderBlockers(s, o);
                  return (
                    <div key={o.id} className="om-row" style={{ padding: "9px 0", borderTop: "1px solid var(--border)", gap: 10, flexWrap: "wrap" }}>
                      <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                        <div className="om-small om-ink">{dev(s, o.devId)?.name} <RefLink om={om} r={{ kind: "order", id: o.id }} /></div>
                        <div className="om-tiny om-muted">{gbp(o.value)} · {o.nextHandoff}</div>
                      </div>
                      {b.length ? b.map(x => <Badge key={x.key} tone="bad">{x.label}: {x.status}</Badge>) : <Badge tone="ok">On track</Badge>}
                      {blockingOpen(s, o.id).length > 0 && <Badge tone="warn" dot={false}>{blockingOpen(s, o.id).length} RFIs</Badge>}
                      <Btn sm onClick={() => om.go("Projects", "journey", o.id)}>Journey</Btn>
                    </div>
                  );
                })}
              </Card>

              <Card title="Bid history" flush>
                <div className="om-scroll">
                  <table className="om-tbl">
                    <thead><tr><th>Inquiry</th><th>Development</th><th>Received</th><th>Contractor</th><th>Outcome</th><th className="r">Value</th></tr></thead>
                    <tbody>
                      {cur.enq.map(r => (
                        <tr key={r.e.id} className="click" onClick={() => om.go("Commercial", "quotations", r.q.id)}>
                          <td><RefLink om={om} r={{ kind: "enquiry", id: r.e.id }} /></td>
                          <td className="ink">{r.dev}{r.competing.length > 0 && <span style={{ marginLeft: 6 }}><Badge tone="warn" dot={false}>competing</Badge></span>}</td>
                          <td className="mono">{dateShort(r.e.received)}</td>
                          <td><Badge tone={r.e.contractorStatus === "Secured" ? "ok" : r.e.contractorStatus === "Tendering" ? "info" : "draft"}>{r.e.contractorStatus}</Badge></td>
                          <td><Badge>{r.q.status}</Badge>{r.q.lostReason && <div className="om-tiny om-faint" style={{ marginTop: 3 }}>{r.q.lostReason}</div>}</td>
                          <td className="r mono ink">{r.q.value ? gbp(r.q.value) : "·"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {cur.enq.length === 0 && <Empty title="No enquiries yet" />}
                </div>
              </Card>

              <Card title="Invoices and payments" sub="Pulse drafts and the illustrative Sage snapshot for this customer" flush
                right={cur.inv.length ? <Btn sm onClick={() => { om.setUi("fin:debtBucket", "all"); om.go("Finance", "debtors"); }}>Open debtors</Btn> : undefined}>
                {cur.inv.length === 0 ? <Empty title="No invoices yet" /> : (
                  <div className="om-scroll">
                    <table className="om-tbl">
                      <thead><tr><th>Invoice</th><th>Description</th><th>Stage</th><th>Due / paid</th><th className="r">Net</th></tr></thead>
                      <tbody>
                        {cur.inv.slice().sort((a, b) => (b.issued || "9").localeCompare(a.issued || "9")).map(i => {
                          const over = i.stage === "Issued" && i.due ? daysBetween(i.due, TODAY) : 0;
                          return (
                            <tr key={i.id} className="click" onClick={() => om.open({ kind: "invoice", id: i.id })}>
                              <td className="mono ink">{i.id}</td>
                              <td className="om-muted">{i.description}</td>
                              <td><Badge>{i.stage}</Badge></td>
                              <td className="mono">{i.paid ? "Paid " + dateShort(i.paid) : i.due ? dateShort(i.due) + (over > 0 ? " · " + over + "d over" : "") : "·"}</td>
                              <td className="r mono ink">{gbp(i.net)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              <Card title="Recent activity" sub="Everything Pulse logged against this customer's enquiries, orders, loads and invoices" flush>
                {(() => {
                  const ids = new Set<string>([...cur.enq.map(r => r.e.id), ...cur.enq.map(r => r.q.id), ...cur.orders.map(o => o.id), ...cur.inv.map(i => i.id), ...s.loads.filter(l => cur.orders.some(o => o.id === l.orderId)).map(l => l.id)]);
                  const ev = s.events.filter(e => ids.has(e.ref.id) || (e.orderId && ids.has(e.orderId))).slice(0, 6);
                  return ev.length ? <div className="om-list">{ev.map(e => (
                    <button key={e.id} className="om-li" onClick={() => om.open(e.ref)}>
                      <div style={{ flex: 1, minWidth: 0 }}><div className="om-small om-ink" style={{ fontWeight: 600 }}>{e.title}</div><div className="om-faint om-tiny">{e.actor} · {e.note}</div></div>
                      <span className="om-mono om-faint om-tiny">{stamp(e.at)}</span>
                    </button>
                  ))}</div> : <Empty title="No activity logged yet" />;
                })()}
              </Card>

              <Card title="Contacts">
                {s.contacts.filter(c => c.accountId === cur.a.id).map(c => (
                  <div key={c.id} className="om-row" style={{ padding: "6px 0", gap: 10, flexWrap: "wrap" }}>
                    <RefLink om={om} r={{ kind: "contact", id: c.id }}>{c.name}</RefLink>
                    <span className="om-small om-muted">{c.role}</span>
                    <span className="om-mono om-tiny om-faint" style={{ marginLeft: "auto" }}>{c.email}</span>
                  </div>
                ))}
                <div className="om-faint om-tiny" style={{ marginTop: 6 }}>Contact names are fictional demo contacts with example.com addresses.</div>
              </Card>
            </>
          )}
        </div>
      </Grid>
    </Page>
  );
}
