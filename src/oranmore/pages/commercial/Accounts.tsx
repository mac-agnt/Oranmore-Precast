import type { Om, Col } from "../../ui";
import { Page, Head, Grid, Card, Table, Badge, Btn, Facts, LineageChip, RefLink, Kpi, useUi, Empty } from "../../ui";
import type { Account } from "../../types";
import { enquiryRows, OPEN_QUOTE, orderBlockers, dev, blockingOpen } from "../../selectors";
import { gbp, gbpShort, dateShort } from "../../format";

export default function Accounts({ om }: { om: Om }) {
  const s = om.s;
  const rows = enquiryRows(s);
  const [sel, setSel] = useUi<string>(om, "sel:Commercial:accounts", "a-bam");
  const stats = (a: Account) => {
    const enq = rows.filter(r => r.e.accountId === a.id);
    const open = enq.filter(r => OPEN_QUOTE.includes(r.q.status));
    const orders = s.orders.filter(o => o.accountId === a.id);
    return { enq, open, orders, orderValue: orders.reduce((t, o) => t + o.value, 0), openValue: open.reduce((t, r) => t + r.q.value, 0),
      blocked: orders.filter(o => orderBlockers(s, o).length > 0).length };
  };
  const list = s.accounts.map(a => ({ a, ...stats(a) })).sort((x, y) => y.orderValue + y.openValue - (x.orderValue + x.openValue));
  const cur = list.find(x => x.a.id === sel) || list[0];

  const cols: Col<typeof list[number]>[] = [
    { k: "n", label: "Account", render: x => <div><div className="ink">{x.a.name}</div><div className="om-faint om-tiny">{x.a.sector}</div></div> },
    { k: "e", label: "Open", align: "right", render: x => <span className="om-mono">{x.open.length}</span> },
    { k: "o", label: "Orders", align: "right", render: x => <span className="om-mono">{x.orders.length}</span> },
    { k: "ov", label: "Contract value", align: "right", render: x => <span className="om-mono ink">{x.orderValue ? gbpShort(x.orderValue) : "·"}</span> },
    { k: "b", label: "", render: x => x.blocked ? <Badge tone="bad" dot={false}>{x.blocked} blocked</Badge> : null },
  ];

  return (
    <Page>
      <Head eyebrow="Commercial · Accounts" title="Customers and contractors"
        sub="One record per customer. Bid history, live projects and contacts come from the same enquiries, quotes and orders used everywhere else." />
      <Grid>
        <Card span={5} flush title="Accounts" sub={s.accounts.length + " accounts · real contractor names, fictional demo projects"}>
          <Table cols={cols} rows={list} rowKey={x => x.a.id} selKey={cur?.a.id} onRow={x => setSel(x.a.id)} maxHeight={780} />
        </Card>
        <div className="om-s-7 om-col" style={{ gap: 14 }}>
          {!cur ? <Card><Empty title="No account selected" /></Card> : (
            <>
              <Card title={cur.a.name} sub={cur.a.sector + " · " + cur.a.hq} right={<LineageChip l={cur.a.lineage} />}>
                <div className="om-kpis" style={{ marginBottom: 12 }}>
                  <Kpi label="Open quotes" value={cur.open.length} sub={gbp(cur.openValue)} />
                  <Kpi label="Orders" value={cur.orders.length} sub={gbp(cur.orderValue) + " net"} />
                  <Kpi label="Enquiries" value={cur.enq.length} sub={"since " + cur.a.since} />
                  <Kpi label="Blocked projects" value={cur.blocked} tone={cur.blocked ? "bad" : undefined} sub="before production or invoice" />
                </div>
                <Facts items={[["Account owner", cur.a.owner], ["Customer since", cur.a.since], ["Head office", cur.a.hq]]} />
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
