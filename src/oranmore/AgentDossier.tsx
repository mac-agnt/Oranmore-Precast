/* Agent profile: what it does, what it reads, what it caught, what it may not
   do on its own, and a simulated run computed from the live shared state. */
import { useState } from "react";
import type { Om } from "./ui";
import { Badge, Btn, RefLink } from "./ui";
import type { OmState, Ref } from "./types";
import { attention, enquiryRows, PRE_SUBMIT, blockingOpen, orderLabel, capacityWeek, podQueue, financeTotals, approvals, byId } from "./selectors";
import { gbp, num, pct, stamp, dateShort } from "./format";

interface Profile {
  purpose: string; sources: string[]; inputs: string[]; approvals: string[]; actor: RegExp;
  issues: (s: OmState) => { text: string; ref: Ref }[];
  run: (s: OmState) => string;
}
const P: Record<string, Profile> = {
  briefing: {
    purpose: "Reads the whole operation before 07:00 and posts the few things that need a person today. Same numbers as the dashboards.",
    sources: ["Enquiries and quotes", "Orders, RFIs, iThesis snapshots", "Loads and POD", "Invoice drafts and Sage snapshot"],
    inputs: ["Overnight events", "Due dates in the next 3 days", "Held invoices"], approvals: ["Posts only. Never changes a record."], actor: /Briefing/i,
    issues: s => attention(s).slice(0, 5).map(a => ({ text: a.title, ref: a.ref })),
    run: s => { const f = financeTotals(s); return attention(s).length + " items flagged. " + gbp(f.readyValue) + " ready for finance review, " + gbp(f.heldValue) + " held."; },
  },
  ops: {
    purpose: "Watches every handoff across the journey: quote deadlines, blocking RFIs, design approvals, QA gates, carrier claims without proof and duplicate imports.",
    sources: ["All shared records", "Activity log", "Excel import results (mock)"], inputs: ["Stalled stages", "Unverified carrier updates", "Missing approvals"],
    approvals: ["Flags only. Routes each issue to its owner."], actor: /Ops Watchdog/i,
    issues: s => attention(s).filter(a => a.tone !== "info").map(a => ({ text: a.title, ref: a.ref })),
    run: s => attention(s).filter(a => a.tone === "bad").length + " critical and " + attention(s).filter(a => a.tone === "warn").length + " warning handoffs across " + s.orders.length + " orders.",
  },
  intake: {
    purpose: "Turns enquiry emails into draft records: customer, development, scope, drawings and due date. Keeps the raw email. Flags low-confidence fields and possible duplicates.",
    sources: ["Commercial inbox (provider to confirm)", "Accounts and developments"], inputs: ["Email body", "Attachment list", "Existing developments"],
    approvals: ["A person confirms every low-confidence field before the enquiry is saved."], actor: /Intake/i,
    issues: s => enquiryRows(s).filter(r => r.competing.length).map(r => ({ text: r.e.id + " shares " + r.dev + " with another contractor", ref: { kind: "enquiry", id: r.e.id } as Ref })),
    run: s => s.enquiries.length + " enquiries on file. " + enquiryRows(s).filter(r => r.competing.length).length + " sit on a development another contractor is also tendering.",
  },
  quotes: {
    purpose: "Keeps the estimating queue honest: deadlines, review gates, bid status hygiene. Does not price structural work.",
    sources: ["Quotes and checklists", "Estimator assignments"], inputs: ["Due dates", "Checklist state", "Clarifications"],
    approvals: ["Manager review and sending are human steps.", "No AI pricing, ever."], actor: /Quotation/i,
    issues: s => enquiryRows(s).filter(r => r.overdue || r.dueSoon).map(r => ({ text: r.q.id + " " + r.dev + (r.overdue ? " overdue" : " due " + dateShort(r.e.due)), ref: { kind: "quote", id: r.q.id } as Ref })),
    run: s => { const r = enquiryRows(s).filter(x => PRE_SUBMIT.includes(x.q.status)); return r.length + " quotes in estimating, " + r.filter(x => x.dueSoon).length + " due within 3 days, " + r.filter(x => x.overdue).length + " overdue, " + r.filter(x => !x.e.estimator).length + " unassigned."; },
  },
  contract: {
    purpose: "Prefills the Contract Detail Summary from the won quote, drafts client information requests and the award letters, and tracks answers against design.",
    sources: ["Orders and quotes", "RFIs", "Document drafts"], inputs: ["Awarded quote", "Open RFIs", "Customer portal answers"],
    approvals: ["Every letter is a draft until approved.", "Contract summary needs commercial approval."], actor: /Contract & RFI/i,
    issues: s => s.rfis.filter(r => r.blocking && r.status !== "Resolved").map(r => ({ text: r.id + " blocks " + r.orderId, ref: { kind: "rfi", id: r.id } as Ref })),
    run: s => s.orders.map(o => ({ o, b: blockingOpen(s, o.id).length })).filter(x => x.b).map(x => orderLabel(s, x.o) + ": " + x.b + " blocking").join("; ") || "No blocking RFIs. Design handover can proceed.",
  },
  capacity: {
    purpose: "Compares firm and tentative hollowcore demand at Brandon and Lound and simulates the effect of wins or moves. Never writes to iThesis.",
    sources: ["Capacity commitments", "Tender pipeline", "iThesis snapshot (illustrative)"], inputs: ["Firm allocations", "Tentative demand", "Secured tenders"],
    approvals: ["Only planners commit schedules, in iThesis."], actor: /Capacity/i,
    issues: s => s.commitments.filter(c => !c.firm).slice(0, 4).map(c => ({ text: c.label + " " + num(c.m2) + " m² tentative " + dateShort(c.week), ref: c.ref })),
    run: s => { const c = capacityWeek(s), h = capacityWeek(s, undefined, { addLound: 1500 }); return "w/c 09 Nov " + num(c.firm) + " / " + num(c.cap) + " m² (" + pct(c.pct) + "). With a 1,500 m² Lound win: Lound " + num(h.plants[1].hypo) + " m², " + num(h.plants[1].over) + " m² over."; },
  },
  dispatch: {
    purpose: "Compares what carriers claim with what is proven, chases missing photos and signatures, and routes disputes to the transport planner.",
    sources: ["Loads", "Carrier app submissions (simulated)", "Transport planner (mock Excel)"], inputs: ["Carrier claims", "POD evidence", "Exceptions"],
    approvals: ["A person accepts or rejects every POD.", "A claim alone can never be accepted."], actor: /Dispatch|Fenway|Trentside|Wash Road|Pennine|Ouse/i,
    issues: s => podQueue(s).map(x => ({ text: x.l.id + " " + x.l.status + (x.hours ? " · " + x.hours + "h" : ""), ref: { kind: "load", id: x.l.id } as Ref })),
    run: s => { const q = podQueue(s); return q.length + " loads lack accepted proof: " + q.map(x => x.l.id + " (" + x.l.status.toLowerCase() + ")").join(", ") + "."; },
  },
  finance: {
    purpose: "Builds the invoice-ready queue from verified deliveries, explains every hold, and proposes simulated Sage handoffs for approval.",
    sources: ["Invoice drafts", "Loads and POD", "Sage snapshot (illustrative)"], inputs: ["POD status", "Contract references", "Holds"],
    approvals: ["Finance releases holds and approves each invoice.", "Sage export is simulated, never real."], actor: /Finance|Sage/i,
    issues: s => financeTotals(s).held.map(i => ({ text: i.id + " " + gbp(i.net) + " held: " + (i.hold || ""), ref: { kind: "invoice", id: i.id } as Ref })),
    run: s => { const f = financeTotals(s); return gbp(f.readyValue) + " ready (" + f.ready.length + "), " + gbp(f.eligibleValue) + " eligible, " + gbp(f.heldValue) + " held, " + gbp(f.handedValue) + " handed off (simulated). Net of VAT."; },
  },
};
P.o2c = { ...P.dispatch, purpose: "A group: Dispatch & POD, Finance Readiness and Ops Watchdog on the same load, so proof and billing move together.", actor: /Dispatch|Finance|Ops Watchdog/i };

export default function AgentDossier({ om, id }: { om: Om; id: string }) {
  const p = P[id] || P.briefing;
  const [run, setRun] = useState<{ id: string; at: string; text: string } | null>(null);
  const s = om.s;
  const issues = p.issues(s);
  const hist = s.events.filter(e => p.actor.test(e.actor)).slice(0, 5);
  const appr = id === "finance" || id === "o2c" ? approvals(s).filter(a => a.kind === "Invoice" || a.kind === "POD") : id === "contract" ? approvals(s).filter(a => a.kind === "Contract" || a.kind === "Document") : id === "quotes" ? approvals(s).filter(a => a.kind === "Pricing") : [];
  const H = ({ t }: { t: string }) => <div className="om-eyebrow" style={{ margin: "18px 0 8px" }}>{t}</div>;
  return (
    <aside className="om-dossier" aria-label="Agent profile">
      <div className="om-row"><b style={{ fontSize: 14 }}>Agent profile</b><span style={{ marginLeft: "auto" }}><Badge tone="draft" dot={false}>Simulation</Badge></span></div>
      <p className="om-muted om-small" style={{ lineHeight: 1.55, margin: "10px 0 0" }}>{p.purpose}</p>
      <H t="Reads" /><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{p.sources.map(x => <span key={x} className="om-chip">{x}</span>)}</div>
      <H t="Sample inputs" /><div className="om-small om-muted">{p.inputs.join(" · ")}</div>
      <H t={"Issues caught now (" + issues.length + ")"} />
      {issues.length ? issues.slice(0, 6).map((x, i) => <div key={i} className="om-row om-small" style={{ padding: "5px 0", borderTop: i ? "1px solid var(--border)" : 0 }}><span style={{ flex: 1, minWidth: 0 }}>{x.text}</span><RefLink om={om} r={x.ref} /></div>) : <div className="om-faint om-small">Nothing open.</div>}
      <H t="Human approvals" />
      {p.approvals.map(x => <div key={x} className="om-small" style={{ padding: "3px 0" }}>· {x}</div>)}
      {appr.length > 0 && <div style={{ marginTop: 8 }}>{appr.slice(0, 4).map(a => <div key={a.id} className="om-row om-small" style={{ padding: "4px 0" }}><Badge tone="warn">{a.kind}</Badge><span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</span><RefLink om={om} r={a.ref} /></div>)}<Btn sm onClick={() => om.go("Work")}>Open approvals in Work</Btn></div>}
      <H t="Recent actions" />
      {hist.length ? hist.map(e => <div key={e.id} className="om-small" style={{ padding: "4px 0" }}><span className="om-faint om-mono">{stamp(e.at)}</span> {e.title} · <RefLink om={om} r={e.ref} /></div>) : <div className="om-faint om-small">No actions logged yet.</div>}
      <H t="Simulation run" />
      <Btn kind="primary" sm onClick={() => setRun({ id, at: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" }), text: p.run(s) })}>Run now (simulated)</Btn>
      {run && run.id === id && <div className="om-card" style={{ padding: 12, marginTop: 10 }}><div className="om-faint om-tiny">Result · {run.at} · read-only, no records changed</div><div className="om-small" style={{ marginTop: 6, lineHeight: 1.5 }}>{run.text}</div></div>}
      {byId(s.orders, "ORD-26-130") && <div className="om-faint om-tiny" style={{ marginTop: 16 }}>Agents propose. People approve. Nothing here is connected to live systems.</div>}
    </aside>
  );
}
