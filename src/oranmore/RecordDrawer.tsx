/* One drawer for every record kind: what it is, where it came from, and what
   it is connected to. Every reference is a link to the same shared record. */
import type { ReactNode } from "react";
import type { Om } from "./ui";
import { Badge, Btn, Facts, LineageChip, RefLink, Dot, toneOf } from "./ui";
import type { Ref, Order } from "./types";
import { byId, account, dev, journey, orderLabel, blockingOpen, rfisFor, loadsFor, invoicesFor, designFor, lotsFor, carrierOf, gross, fmtDue } from "./selectors";
import { gbp, dateUK, stamp, m2 } from "./format";

const KIND_LABEL: Record<string, string> = { account: "Customer / contractor", development: "Site development", enquiry: "Enquiry", quote: "Quotation", order: "Order", rfi: "Request for information",
  doc: "Document", design: "iThesis design package (illustrative)", lot: "Production lot (iThesis snapshot)", load: "Load", carrier: "Carrier (illustrative)", invoice: "Invoice", task: "Task", contact: "Contact" };

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <div style={{ marginTop: 18 }}><div className="om-eyebrow" style={{ marginBottom: 8 }}>{title}</div>{children}</div>;
}
function Links({ om, refs }: { om: Om; refs: (Ref & { label?: string; note?: string })[] }) {
  if (!refs.length) return <div className="om-faint om-small">None</div>;
  return <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{refs.map(r => <span key={r.kind + r.id} className="om-chip"><span className="om-faint">{KIND_LABEL[r.kind]?.split(" ")[0]}</span><RefLink om={om} r={r}>{r.label || r.id}</RefLink>{r.note && <span className="om-faint">{r.note}</span>}</span>)}</div>;
}
function MiniJourney({ om, o }: { om: Om; o: Order }) {
  const st = journey(om.s, o.id);
  return (
    <div className="om-col" style={{ gap: 6 }}>
      {st.map(x => (
        <div key={x.key} className="om-row" style={{ alignItems: "flex-start" }}>
          <Dot tone={x.state === "done" ? "ok" : x.state === "blocked" ? "bad" : x.state === "waiting" ? "warn" : x.state === "active" ? "accent" : "neutral"} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="om-row" style={{ gap: 8 }}><b style={{ fontSize: 12.5, fontWeight: 600 }}>{x.label}</b><span className="om-faint om-tiny">{x.team}</span>{x.ref && <span style={{ marginLeft: "auto" }}><RefLink om={om} r={x.ref}>{x.refLabel}</RefLink></span>}</div>
            <div className="om-muted om-small">{x.status}{x.next ? " · Next: " + x.next : ""}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RecordDrawer({ om }: { om: Om & { drawer: Ref | null; closeDrawer: () => void } }) {
  const r = om.drawer; if (!r) return null;
  const s = om.s;
  let title: ReactNode = r.id, status = "", facts: [ReactNode, ReactNode][] = [], lineage, links: any[] = [], body: ReactNode = null;
  let goto: [string, string, string, string?] | null = null; // label, page, tab, sel

  if (r.kind === "account") {
    const a = account(s, r.id)!; title = a.name; status = "Active account";
    const enqs = s.enquiries.filter(e => e.accountId === a.id), ords = s.orders.filter(o => o.accountId === a.id);
    facts = [["Head office", a.hq], ["Sector", a.sector], ["Account owner", a.owner], ["Customer since", a.since], ["Enquiries", enqs.length], ["Orders", ords.length + " · " + gbp(ords.reduce((t, o) => t + o.value, 0))]];
    lineage = a.lineage; links = ([] as any[]).concat(enqs.map(e => ({ kind: "enquiry" as const, id: e.id, note: dev(s, e.devId)?.name })), ords.map(o => ({ kind: "order" as const, id: o.id, note: dev(s, o.devId)?.name })));
    body = <><p className="om-muted om-small">{a.note}</p><Section title="Contacts">{s.contacts.filter(c => c.accountId === a.id).map(c => <div key={c.id} className="om-small">{c.name} · <span className="om-muted">{c.role}</span> · <span className="om-mono om-faint">{c.email}</span></div>)}</Section></>;
    goto = ["Open in Commercial · Accounts", "Commercial", "accounts", a.id];
  } else if (r.kind === "development") {
    const d = dev(s, r.id)!; title = d.name; status = d.sector;
    const enqs = s.enquiries.filter(e => e.devId === d.id);
    const bidders = Array.from(new Set(enqs.map(e => e.accountId)));
    facts = [["Location", d.town + (d.county ? ", " + d.county : "")], ["Sector", d.sector], ["Contractors bidding", bidders.length], ["Orders", s.orders.filter(o => o.devId === d.id).length]];
    lineage = d.lineage; links = ([] as any[]).concat(enqs.map(e => ({ kind: "enquiry" as const, id: e.id, note: account(s, e.accountId)?.name + " · " + e.contractorStatus })), bidders.map(b => ({ kind: "account" as const, id: b, label: account(s, b)?.name })));
    if (bidders.length > 1) body = <div className="om-card" style={{ padding: 12, marginTop: 4 }}><Badge tone="warn">Competing bids</Badge><div className="om-small om-muted" style={{ marginTop: 8 }}>{bidders.length} contractors are tendering this same building. Their enquiries stay separate, and the forecast counts only one of them.</div></div>;
  } else if (r.kind === "enquiry") {
    const e = byId(s.enquiries, r.id)!; const q = byId(s.quotes, e.quoteId)!; title = account(s, e.accountId)?.name + " · " + dev(s, e.devId)?.name; status = q.status;
    facts = [["Received", dateUK(e.received)], ["Quote due", dateUK(e.due) + " · " + fmtDue(e.due)], ["Contractor status", e.contractorStatus], ["Oranmore status", q.status], ["Products", e.products.join(", ")], ["Drawings", e.drawings + " packages"], ["Estimator", e.estimator || "Unassigned"], ["Indicative value", q.value ? gbp(q.value) + " (not sent)" : "Not priced"]];
    lineage = e.lineage; links = [{ kind: "account", id: e.accountId, label: account(s, e.accountId)?.name }, { kind: "development", id: e.devId, label: dev(s, e.devId)?.name }, { kind: "quote", id: q.id }];
    const o = s.orders.find(x => x.quoteId === q.id); if (o) links.push({ kind: "order", id: o.id });
    goto = ["Open in Commercial · Inquiries", "Commercial", "inquiries", e.id];
  } else if (r.kind === "quote") {
    const q = byId(s.quotes, r.id)!; const e = byId(s.enquiries, q.enquiryId)!; title = q.id + " · " + dev(s, e.devId)?.name; status = q.status;
    facts = [["Customer", account(s, e.accountId)?.name], ["Revision", q.revision], ["Value", gbp(q.value) + (q.status === "Estimating" ? " indicative" : "")], ["Due", dateUK(e.due)], ["Reviewer", q.reviewer || "—"], ["Checklist", q.checklist.filter(c => c.done).length + " of " + q.checklist.length]];
    lineage = e.lineage; links = [{ kind: "enquiry", id: e.id }, { kind: "account", id: e.accountId, label: account(s, e.accountId)?.name }];
    const o = s.orders.find(x => x.quoteId === q.id); if (o) links.push({ kind: "order", id: o.id });
    body = <Section title="History">{q.history.slice().reverse().map((h, i) => <div key={i} className="om-small" style={{ padding: "4px 0" }}><span className="om-mono om-faint">{stamp(h.at)}</span> · {h.text}</div>)}{q.lostReason && <div className="om-small" style={{ color: "var(--bad)" }}>Lost: {q.lostReason}</div>}</Section>;
    goto = ["Open in Commercial · Quotations", "Commercial", "quotations", q.id];
  } else if (r.kind === "order") {
    const o = byId(s.orders, r.id)!; title = orderLabel(s, o); status = blockingOpen(s, o.id).length ? blockingOpen(s, o.id).length + " blocking RFIs" : o.portal;
    facts = [["Order", o.id], ["Contract value", gbp(o.value)], ["Awarded", dateUK(o.awarded)], ["Commercial lead", o.lead], ["Programme", o.programme], ["Customer portal", o.portal]];
    lineage = o.lineage;
    links = ([{ kind: "quote", id: o.quoteId }, { kind: "account", id: o.accountId, label: account(s, o.accountId)?.name }, { kind: "development", id: o.devId, label: dev(s, o.devId)?.name }] as any[])
      .concat(designFor(s, o.id) ? [{ kind: "design", id: designFor(s, o.id)!.id }] as any : [])
      .concat(rfisFor(s, o.id).map(x => ({ kind: "rfi" as const, id: x.id, note: x.status }))).concat(loadsFor(s, o.id).map(l => ({ kind: "load" as const, id: l.id, note: l.status }))).concat(invoicesFor(s, o.id).map(i => ({ kind: "invoice" as const, id: i.id, note: i.stage })));
    body = <Section title="Project journey"><MiniJourney om={om} o={o} /></Section>;
    goto = ["Open Project Journey", "Projects", "journey", o.id];
  } else if (r.kind === "rfi") {
    const x = byId(s.rfis, r.id)!; const o = byId(s.orders, x.orderId)!; title = x.id + " · " + x.question; status = x.status;
    facts = [["Order", orderLabel(s, o)], ["Blocking", x.blocking ? "Yes, blocks design handover" : "No"], ["Area", x.area], ["Owner", x.owner], ["Raised", dateUK(x.raised)], ["Due", dateUK(x.due)], ["Reminders", x.reminders.length ? x.reminders.map(d => dateUK(d)).join(", ") : "None"], ["Response", x.response ? x.response + " (" + x.respondedBy + ")" : "Awaiting"]];
    links = [{ kind: "order", id: o.id }];
    goto = ["Open in RFIs & Documents", "Projects", "rfis", o.id];
  } else if (r.kind === "design") {
    const d = byId(s.designs, r.id)!; const o = byId(s.orders, d.orderId)!; title = d.id + " " + d.revision; status = d.status;
    facts = [["Order", orderLabel(s, o)], ["Revision", d.revision], ["Review target", dateUK(d.target)], ["Released for production", d.released ? "Yes" : "No"], ["Coordinator", d.coordinator], ["Last mock sync", stamp(d.synced)]];
    lineage = { source: "iThesis (illustrative)", updated: d.synced, state: "Read-only snapshot. iThesis stays authoritative" };
    links = [{ kind: "order", id: o.id }].concat(rfisFor(s, o.id).filter(x => x.area === "Design").map(x => ({ kind: "rfi" as const, id: x.id, note: x.status }))) as any;
    body = <><Section title="Revisions">{d.revisions.slice().reverse().map(v => <div key={v.rev + v.at} className="om-small" style={{ padding: "3px 0" }}><span className="om-mono">{v.rev}</span> <span className="om-faint">{dateUK(v.at)}</span> · {v.note}</div>)}</Section>{d.missing.length > 0 && <Section title="Missing information">{d.missing.map(m => <div key={m} className="om-small" style={{ color: "var(--bad)" }}>{m}</div>)}</Section>}</>;
    goto = ["Open in Design Handoffs", "Plants & Planning", "design", d.id];
  } else if (r.kind === "lot") {
    const l = byId(s.lots, r.id)!; const o = byId(s.orders, l.orderId)!; title = l.id + " · " + l.product; status = l.qa;
    facts = [["Order", orderLabel(s, o)], ["Plant", l.plant], ["Units", l.units], ["Area", l.m2 ? m2(l.m2) : "n/a"], ["Planned cast", dateUK(l.planned)], ["Actual", l.actual ? dateUK(l.actual) : "—"], ["Production", l.status], ["Yard location", l.yard]];
    lineage = { source: "iThesis (illustrative)", updated: l.synced, state: "Read-only production snapshot. QA sign-off is a human step in Pulse" };
    links = [{ kind: "order", id: o.id }].concat(s.loads.filter(x => x.lotIds.includes(l.id)).map(x => ({ kind: "load" as const, id: x.id, note: x.status }))) as any;
    body = <p className="om-muted om-small">{l.note}</p>;
    goto = ["Open in Quality & Yard", "Plants & Planning", "quality", l.id];
  } else if (r.kind === "load") {
    const l = byId(s.loads, r.id)!; const o = byId(s.orders, l.orderId)!; const c = carrierOf(s, l); const inv = byId(s.invoices, l.invoiceId); title = l.id + " · " + dev(s, o.devId)?.name; status = l.status;
    facts = [["Order", orderLabel(s, o)], ["From", l.plant], ["Carrier", c?.name], ["Trailer", l.trailer], ["Collection", stamp(l.collect)], ["Delivery window", l.deliver], ["Carrier claim", l.claimed ? stamp(l.claimed) : "—"], ["POD", l.pod.verified ? "Accepted " + stamp(l.pod.verified) + " by " + l.pod.verifiedBy : l.pod.submitted ? "Submitted " + stamp(l.pod.submitted) + ", review pending" : "Not received"]];
    lineage = { source: l.pod.verified ? "Pulse" : l.claimed ? "Carrier claim" : "Transport planner (mock)", updated: l.pod.verified || l.pod.submitted || l.claimed || l.collect, state: l.pod.verified ? "Verified by a person" : l.claimed ? "Claim awaiting validation" : "Planned" };
    links = ([{ kind: "order", id: o.id }, { kind: "carrier", id: l.carrierId, label: c?.name }] as any[]).concat(l.lotIds.map(x => ({ kind: "lot" as const, id: x }))).concat(inv ? [{ kind: "invoice" as const, id: inv.id, note: inv.stage + " · " + gbp(inv.net) }] : []) as any;
    body = <><Section title="Delivery evidence"><div className="om-row" style={{ flexWrap: "wrap", gap: 6 }}><Badge tone={l.pod.photo ? "ok" : "bad"}>{l.pod.photo ? "Photo " + (l.pod.photoName || "") : "No photo"}</Badge><Badge tone={l.pod.receiver ? "ok" : "bad"}>{l.pod.receiver ? "Receiver " + l.pod.receiver : "No receiver"}</Badge><Badge tone={l.pod.signature ? "ok" : "bad"}>{l.pod.signature ? "Signed" : "No signature"}</Badge></div>{l.exception && <div className="om-small" style={{ color: "var(--bad)", marginTop: 8 }}>{l.exception}</div>}<div className="om-faint om-tiny" style={{ marginTop: 8 }}>Timestamps and locations are demo data, not independently verified telematics.</div></Section>{l.notes && <p className="om-muted om-small">{l.notes}</p>}</>;
    goto = ["Open in Exceptions & POD", "Logistics", "pod", l.id];
  } else if (r.kind === "carrier") {
    const c = byId(s.carriers, r.id)!; title = c.name; status = "Illustrative partner";
    facts = [["Base", c.base], ["Equipment", c.equipment.join(", ")], ["On-time (mock)", c.onTime + "%"], ["Contact", c.contact], ["Active loads", s.loads.filter(l => l.carrierId === c.id && l.status !== "POD verified").length]];
    links = s.loads.filter(l => l.carrierId === c.id).map(l => ({ kind: "load" as const, id: l.id, note: l.status }));
    goto = ["Open in Carriers", "Logistics", "carriers", c.id];
  } else if (r.kind === "invoice") {
    const i = byId(s.invoices, r.id)!; const o = byId(s.orders, i.orderId)!; title = i.id + " · " + i.description; status = i.stage;
    facts = [["Order", orderLabel(s, o)], ["Net", gbp(i.net)], ["VAT 20%", gbp(i.net * 0.2)], ["Gross", gbp(gross(i.net))], ["Hold", i.hold || "None"], ["Issued", i.issued ? dateUK(i.issued) : "—"], ["Due", i.due ? dateUK(i.due) : "—"], ["Sage ref", i.sageRef || "—"]];
    lineage = { source: i.sageRef?.startsWith("SAGE") ? "Sage (illustrative)" : "Finance draft", updated: i.history.slice(-1)[0]?.at || i.issued || "2026-11-07 06:00", state: i.sageRef?.startsWith("SAGE") ? "Illustrative Sage snapshot, not connected" : i.stage };
    links = [{ kind: "order", id: o.id }].concat(i.loadId ? [{ kind: "load" as const, id: i.loadId }] : []) as any;
    body = i.history.length ? <Section title="History">{i.history.slice().reverse().map((h, k) => <div key={k} className="om-small" style={{ padding: "3px 0" }}><span className="om-mono om-faint">{stamp(h.at)}</span> · {h.text}</div>)}</Section> : null;
    goto = ["Open in Invoice Readiness", "Finance", i.loadId ? "readiness" : "sage", i.id];
  } else if (r.kind === "task") {
    const t = byId(s.tasks, r.id)!; title = t.title; status = t.status;
    facts = [["Owner", t.owner], ["Due", dateUK(t.due)], ["Priority", t.priority], ["Department", t.dept]]; links = [t.ref];
  } else if (r.kind === "contact") {
    const c = byId(s.contacts, r.id)!; title = c.name; status = c.internal ? "Oranmore" : "External";
    facts = [["Role", c.role], ["Organisation", c.accountId ? account(s, c.accountId)?.name : "Oranmore Precast"], ["Email", c.email || "Not held in demo"], ["Phone", c.phone || "—"]];
  }

  const related = s.events.filter(e => (e.ref.kind === r.kind && e.ref.id === r.id) || (r.kind === "order" && e.orderId === r.id)).slice(0, 6);
  return (
    <div className="om-scrim" onClick={om.closeDrawer}>
      <aside className="om-drawer" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={KIND_LABEL[r.kind]}>
        <div className="om-drawer-h">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="om-row" style={{ gap: 8, flexWrap: "wrap" }}><span className="om-eyebrow">{KIND_LABEL[r.kind]}</span>{status && <Badge tone={toneOf(status)}>{status}</Badge>}{lineage && <span style={{ marginLeft: "auto" }}><LineageChip l={lineage} /></span>}</div>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-.4px", marginTop: 8, lineHeight: 1.25 }}>{title}</div>
            <div className="om-mono om-faint om-small" style={{ marginTop: 4 }}>{r.id}</div>
          </div>
          <button className="om-x" onClick={om.closeDrawer} aria-label="Close">✕</button>
        </div>
        <div className="om-drawer-b">
          {facts.length > 0 && <Facts items={facts} />}
          {body}
          <Section title="Connected records"><Links om={om} refs={links} /></Section>
          <Section title="Activity on this record">
            {related.length ? related.map(e => <div key={e.id} className="om-small" style={{ padding: "5px 0", borderTop: "1px solid var(--border)" }}><span className="om-mono om-faint">{stamp(e.at)}</span> · <b style={{ fontWeight: 600 }}>{e.title}</b> <span className="om-muted">· {e.source} · {e.actor}</span><div className="om-muted">{e.note}</div></div>) : <div className="om-faint om-small">No events yet.</div>}
          </Section>
          {goto && <div style={{ marginTop: 20 }}><Btn kind="primary" onClick={() => om.go(goto![1], goto![2], goto![3])}>{goto[0]} →</Btn></div>}
        </div>
      </aside>
    </div>
  );
}
