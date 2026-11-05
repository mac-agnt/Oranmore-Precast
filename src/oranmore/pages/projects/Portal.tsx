import { useRef, useState } from "react";
import type { Om } from "../../ui";
import { Head, Grid, Card, Badge, Btn, RefLink, Seg, Field } from "../../ui";
import { account, dev, byId, journey, rfisFor, designFor, loadsFor, blockingOpen } from "../../selectors";

import { gbp, dateShort, stamp, dayShort } from "../../format";
import { useOrder, OrderSelect, progressOf } from "./common";
import "../../../styles/om-projects.css";

type Role = "internal" | "customer";

export default function Portal({ om }: { om: Om }) {
  const s = om.s;
  const [o, setSel] = useOrder(om);
  const [role, setRoleRaw] = useState<Role>((om.ui["Projects:portalRole"] as Role) || "customer");
  const setRole = (r: Role) => { setRoleRaw(r); om.setUi("Projects:portalRole", r); };
  const acc = account(s, o.accountId)!, d = dev(s, o.devId)!;
  const contact = s.contacts.find(c => c.id === o.customerContactId);
  const who = (contact?.name || "Customer") + " (" + acc.name + ")";
  const custOrders = s.orders.filter(x => x.accountId === o.accountId);
  const otherCustomers = s.orders.filter(x => x.accountId !== o.accountId).length;
  const competitors = s.enquiries.filter(e => e.devId === o.devId && e.accountId !== o.accountId).length;
  const q = byId(s.quotes, o.quoteId);
  const stages = journey(s, o.id).filter(x => x.customer);
  const rf = rfisFor(s, o.id).filter(r => r.status !== "Draft");
  const openRf = rf.filter(r => r.status === "Awaiting customer");
  const design = designFor(s, o.id);
  const loads = loadsFor(s, o.id);
  const planned = loads.filter(l => ["Planned", "Loaded", "Dispatched"].includes(l.status)).sort((a, b) => a.collect.localeCompare(b.collect));
  const evidence = loads.filter(l => l.status === "POD verified");
  const msgs = s.portalMessages.filter(m => m.orderId === o.id);
  const p = progressOf(om, o);

  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [ask, setAsk] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const respond = (rfiId: string) => {
    if (!reply.trim()) return;
    om.do.resolveRfi(rfiId, reply.trim(), who, true);
    om.toast(rfiId + " answered in the portal. Internal RFI log, journey and activity updated.");
    setReplyFor(null); setReply("");
  };
  const upload = (name: string) => {
    om.do.portalMessage(o.id, "Uploaded " + name + " for the open information requests (simulated, file not stored).", who);
    om.toast(name + " received (simulated). Logged on the project and in Activity.");
  };
  const sendAsk = () => { if (!ask.trim()) return; om.do.portalMessage(o.id, ask.trim(), role === "customer" ? who : "Oranmore Precast"); setAsk(""); om.toast(role === "customer" ? "Question sent to Oranmore (simulated)." : "Reply posted to the portal (simulated)."); };
  const approveDrawings = () => {
    if (!design) return;
    om.do.recordClientApproval(design.id);
    om.toast(role === "customer" ? "Drawings " + design.revision + " approved (simulated). Oranmore's planner still schedules production." : "Client approval recorded for " + design.id + ".");
  };

  const pick = <OrderSelect om={om} value={o.id} onChange={setSel} orders={role === "customer" ? custOrders : undefined} />;

  return (
    <>
      <Head title="Customer portal preview"
        sub="A role switch, not a real sign-in. The customer sees their own projects, open requests and confirmed deliveries, fed by the same records the team works on. Internal fields are filtered out."
        right={<><Seg<Role> options={[["internal", "Internal view"], ["customer", "Customer: " + acc.name + " (preview)"]]} value={role} onChange={setRole} />{pick}</>} />

      <Grid>
        {role === "customer" ? (
          <div className="om-s-9 omp-portal">
            <div className="omp-bar">
              <img src="/brand/oranmore-mark.png" alt="" width={26} height={26} />
              <div style={{ flex: 1, minWidth: 0 }}><div className="omp-brand">Oranmore Precast · Project portal</div><div className="omp-sub">Signed in as {contact?.name || "customer"}, {acc.name} (simulated)</div></div>
              <span className="omp-pill">Preview</span>
            </div>
            <div className="omp-body">
              <div className="omp-proj">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="omp-eyebrow">Your project</div>
                  <div className="omp-h">{d.name}</div>
                  <div className="omp-sub">{d.town} · our ref {o.id} · your ref {o.contract.find(f => f.key === "ref")?.value || "to confirm"}</div>
                </div>
                <div className="omp-status"><div className="omp-eyebrow">Status</div><b>{o.portal}</b></div>
              </div>

              <div className="omp-miles">
                {stages.map(x => (
                  <div key={x.key} className={"omp-mile " + x.state}>
                    <span className="omp-dot">{x.state === "done" ? "✓" : ""}</span>
                    <div className="omp-ml">{x.label === "iThesis design" ? "Design" : x.label === "Contract & RFIs" ? "Contract" : x.label === "Delivery proof" ? "Deliveries" : x.label}</div>
                    <div className="omp-ms">{x.customerText}</div>
                  </div>
                ))}
              </div>

              <div className="omp-grid">
                <section className="omp-card" style={{ gridColumn: "1 / -1" }}>
                  <div className="omp-ct">Information we need from you <span className="omp-count">{openRf.length}</span></div>
                  {openRf.length === 0 && <div className="omp-empty">Nothing outstanding. Thank you.</div>}
                  {openRf.map(r => (
                    <div key={r.id} className="omp-req">
                      <div className="om-row" style={{ gap: 8, alignItems: "flex-start" }}>
                        <span className="omp-id">{r.id}</span>
                        <div style={{ flex: 1, minWidth: 0 }}><div className="omp-q">{r.question}</div><div className="omp-sub">Requested {dateShort(r.raised)} · please reply by {dateShort(r.due)}{r.blocking ? " · design cannot start without this" : ""}</div></div>
                        {replyFor !== r.id && <Btn sm kind="primary" onClick={() => { setReplyFor(r.id); setReply(""); }}>Respond</Btn>}
                      </div>
                      {replyFor === r.id && (
                        <div style={{ marginTop: 10 }}>
                          <textarea className="om-input" rows={3} value={reply} onChange={e => setReply(e.target.value)} placeholder="Your answer" autoFocus />
                          <div className="om-row" style={{ gap: 6, marginTop: 8, justifyContent: "flex-end" }}><Btn sm kind="quiet" onClick={() => setReplyFor(null)}>Cancel</Btn><Btn sm kind="primary" disabled={!reply.trim()} onClick={() => respond(r.id)}>Send answer</Btn></div>
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="om-row" style={{ gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                    <input ref={fileRef} type="file" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) upload(f.name); e.target.value = ""; }} />
                    <Btn sm onClick={() => fileRef.current?.click()}>Upload requested information</Btn>
                    <Btn sm kind="quiet" onClick={() => upload("crane-positions-" + d.name.split(" ")[0].toLowerCase() + ".pdf")}>Attach sample file</Btn>
                  </div>
                </section>

                {design && design.status === "Awaiting client approval" && (
                  <section className="omp-card" style={{ gridColumn: "1 / -1" }}>
                    <div className="omp-ct">Drawings awaiting your approval</div>
                    <div className="om-row" style={{ gap: 10, flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 220 }}><div className="omp-q">Design revision {design.revision}</div><div className="omp-sub">Issued {dateShort(design.revisions.slice(-1)[0]?.at)} · please review by {dateShort(design.target)}</div></div>
                      <Btn kind="primary" onClick={approveDrawings}>Approve drawings (simulated)</Btn>
                    </div>
                    <div className="omp-sub" style={{ marginTop: 8 }}>Your approval is recorded. Oranmore's production planner then schedules casting; approval does not start production on its own.</div>
                  </section>
                )}

                <section className="omp-card">
                  <div className="omp-ct">Quotation</div>
                  <div className="omp-kv"><span>Reference</span><b>{q?.id} rev {q?.revision}</b><span>Status</span><b>{q?.status === "Won" ? "Accepted" : q?.status}</b><span>Contract value</span><b>{gbp(o.value)} + VAT</b><span>Programme</span><b>{o.programme}</b></div>
                </section>

                <section className="omp-card">
                  <div className="omp-ct">Planned deliveries</div>
                  {planned.length === 0 && <div className="omp-empty">Deliveries will appear once production is scheduled.</div>}
                  {planned.map(l => <div key={l.id} className="omp-line"><b>{dayShort(l.deliver.split(" ")[0])}</b><span>{l.deliver.split(" ")[1]}</span><span>{l.pieces} units</span><span className="omp-tag">{l.status === "Dispatched" ? "On the way" : "Booked"}</span></div>)}
                </section>

                <section className="omp-card">
                  <div className="omp-ct">Delivery confirmations</div>
                  {evidence.length === 0 && <div className="omp-empty">No confirmed deliveries yet.</div>}
                  {evidence.map(l => <div key={l.id} className="omp-line"><b>{dateShort(l.pod.verified?.split(" ")[0])}</b><span>Signed by {l.pod.receiver}</span><span>Photo on file</span><span className="omp-tag ok">Confirmed</span></div>)}
                  {loads.some(l => l.status === "Arrival claimed" || l.status === "POD submitted") && <div className="omp-sub" style={{ marginTop: 6 }}>Some deliveries are being confirmed and will appear here once checked.</div>}
                </section>

                <section className="omp-card">
                  <div className="omp-ct">Messages</div>
                  <div style={{ maxHeight: 170, overflowY: "auto" }}>
                    {msgs.map((m, i) => <div key={i} className="omp-msg"><span>{m.from} · {stamp(m.at)}</span>{m.text}</div>)}
                    {msgs.length === 0 && <div className="omp-empty">No messages yet.</div>}
                  </div>
                  <div className="om-row" style={{ gap: 6, marginTop: 8 }}>
                    <input className="om-input" value={ask} onChange={e => setAsk(e.target.value)} onKeyDown={e => { if (e.key === "Enter") sendAsk(); }} placeholder="Ask a question" />
                    <Btn sm kind="primary" disabled={!ask.trim()} onClick={sendAsk}>Send</Btn>
                  </div>
                </section>
              </div>
            </div>
          </div>
        ) : (
          <div className="om-s-9 om-col" style={{ gap: 14 }}>
            <Card title={"Internal view · " + d.name} sub={acc.name + " · " + o.id + " · full record, nothing filtered"} right={<Btn sm onClick={() => setRole("customer")}>Preview as customer</Btn>}>
              <div className="om-steps">
                {p.st.map(x => <button key={x.key} className={"om-step " + x.state} onClick={() => om.setSub("journey")}><div className="k">{x.label}{!x.customer && <span className="om-faint om-tiny" title="Not shown to the customer">· internal</span>}</div><div className="s">{x.status}</div></button>)}
              </div>
            </Card>
            <Grid>
              <Card span={6} title="Open with the customer" sub={openRf.length + " requests · " + blockingOpen(s, o.id).length + " blocking"}>
                {openRf.length === 0 && <div className="om-faint om-small">Nothing waiting on the customer.</div>}
                {openRf.map(r => <div key={r.id} className="om-row om-small" style={{ padding: "6px 0", borderTop: "1px solid var(--border)", alignItems: "flex-start" }}><RefLink om={om} r={{ kind: "rfi", id: r.id }} /><span style={{ flex: 1 }}>{r.question}</span>{r.blocking && <Badge tone="bad">Blocking</Badge>}<Btn sm kind="quiet" onClick={() => { om.do.remindRfi(r.id); om.toast("Reminder logged (simulated)."); }}>Remind</Btn></div>)}
                {design && design.status === "Awaiting client approval" && (
                  <div style={{ marginTop: 12, padding: 12, borderRadius: 12, border: "1px solid var(--border)" }}>
                    <div className="om-row" style={{ gap: 8, flexWrap: "wrap" }}><RefLink om={om} r={{ kind: "design", id: design.id }}>{design.id} {design.revision}</RefLink><Badge>{design.status}</Badge><span style={{ marginLeft: "auto" }}><Btn sm kind="primary" onClick={approveDrawings}>Record client approval</Btn></span></div>
                    <div className="om-faint om-tiny" style={{ marginTop: 6 }}>Use when the client has approved by email. A person records it; iThesis stays the schedule of record.</div>
                  </div>
                )}
              </Card>
              <Card span={6} title="Portal messages" sub={msgs.length + " on this project"}>
                <div style={{ maxHeight: 200, overflowY: "auto" }}>
                  {msgs.map((m, i) => <div key={i} className="om-small" style={{ padding: "6px 0", borderTop: i ? "1px solid var(--border)" : 0 }}><span className="om-faint om-mono">{stamp(m.at)}</span> · <b style={{ fontWeight: 600 }}>{m.from}</b><div className="om-muted">{m.text}</div></div>)}
                  {msgs.length === 0 && <div className="om-faint om-small">No messages yet.</div>}
                </div>
                <Field label="Reply as Oranmore">
                  <div className="om-row" style={{ gap: 6 }}><input className="om-input" value={ask} onChange={e => setAsk(e.target.value)} onKeyDown={e => { if (e.key === "Enter") sendAsk(); }} placeholder="Posts to the customer's portal (simulated)" /><Btn sm kind="primary" disabled={!ask.trim()} onClick={sendAsk}>Post</Btn></div>
                </Field>
              </Card>
            </Grid>
          </div>
        )}

        <div className="om-s-3 om-col" style={{ gap: 14 }}>
          <Card title="Privacy filter" sub={role === "customer" ? "Applied to this preview" : "What the customer will not see"}>
            {[
              ["Margin and cost build-up", "Internal pricing only"],
              ["Internal notes and staff tasks", s.tasks.filter(t => t.ref.id === o.id).length + " tasks on this order"],
              ["Competitor bids on this building", competitors ? competitors + " other contractor enquiries" : "None on this site"],
              ["Other customers' projects", otherCustomers + " projects hidden"],
              ["Sage ledger and other debtors", "Finance only"],
              ["Capacity, QA and yard detail", "Plant teams only"],
              ["Carrier claims before review", "Only verified deliveries shown"],
            ].map(([k, v]) => (
              <div key={k} className="om-row" style={{ padding: "6px 0", borderTop: "1px solid var(--border)", alignItems: "flex-start", gap: 8 }}>
                <span style={{ color: role === "customer" ? "var(--ok)" : "var(--faint)", fontSize: 12, width: 14 }}>{role === "customer" ? "✓" : "•"}</span>
                <div style={{ minWidth: 0 }}><div className="om-small om-ink">{k}</div><div className="om-faint om-tiny">{v}</div></div>
              </div>
            ))}
          </Card>
          <Card title="Customer's projects" sub={acc.name + " sees " + custOrders.length + " of " + s.orders.length}>
            {custOrders.map(x => <button key={x.id} className="om-li" style={{ padding: "8px 0" }} onClick={() => setSel(x.id)}><div style={{ minWidth: 0, flex: 1 }}><div className="om-small om-ink">{dev(s, x.devId)?.name}</div><div className="om-faint om-tiny">{x.id} · {x.portal}</div></div>{x.id === o.id && <Badge tone="accent">Open</Badge>}</button>)}
            <div className="om-faint om-tiny" style={{ marginTop: 8 }}>Switch customer by picking another project in Internal view.</div>
          </Card>
        </div>
      </Grid>
    </>
  );
}
