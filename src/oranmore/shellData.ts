/* Adapters that feed the existing Pulse shell (Home rail, inbox, notifications,
   command palette) from the shared Oranmore state. */
import type { OmState, Ref } from "./types";
import { attention, approvals, byId, orderLabel, enquiryRows, OPEN_QUOTE, account, dev, nowStamp } from "./selectors";
import { gbp, dateShort, stamp, daysBetween } from "./format";
import { TODAY } from "./selectors";
import { ICONS } from "../logic/data";

type Go = (page: string, tab?: string, sel?: string) => void;
const initials = (n: string) => n.replace(/\(.*?\)/g, "").split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();

export function omItems(s: OmState, go: Go) {
  const out: Record<string, any> = {};
  const MOD_ICON: Record<string, string> = { Commercial: ICONS.navCommercial, Projects: ICONS.navProjects, "Plants & Planning": ICONS.navPlants, Logistics: ICONS.navLogistics, Finance: ICONS.navFinance };
  attention(s).forEach(a => {
    out[a.id] = {
      kind: a.module, importance: a.tone === "bad" ? "critical" : a.tone === "warn" ? "high" : "normal", icon: MOD_ICON[a.module] || ICONS.inbox, age: a.age,
      title: a.title, why: a.why, detail: "Opens " + a.module + " with the record selected. Nothing changes until a person acts.",
      actionLabel: "Open in " + a.module, secondaryLabel: "Ask Pulse", group: a.tone === "bad" ? "Alerts" : a.module === "Finance" ? "Approvals" : "Work",
      fields: [{ k: "Record", v: a.ref.id }, { k: "Module", v: a.module }, { k: "Source", v: "Shared Oranmore record" }],
      history: [], go: () => go(a.module, a.tab, a.ref.id), ref: a.ref,
    };
  });
  return out;
}

export function omTasks(s: OmState) {
  return s.tasks.map(t => {
    const d = daysBetween(TODAY, t.due);
    const q: string[] = [];
    if (t.status !== "Done") {
      if (t.priority === "High" || d <= 0) q.push("mine");
      q.push("team");
      if (d < 0) q.push("overdue");
      if (d >= 0 && d <= 7) q.push("upcoming");
      if (!t.owner || /lead$/i.test(t.owner)) q.push("unassigned");
    }
    return { id: t.id, title: t.title, due: d === 0 ? "Today" : d === 1 ? "Tomorrow" : d < 0 ? dateShort(t.due) : dateShort(t.due), who: initials(t.owner), queue: q.length ? q : ["done"],
      subject: t.ref.id, priority: t.priority === "High" ? "high" : t.priority === "Low" ? "low" : "normal", late: d < 0 && t.status !== "Done", om: true, done: t.status === "Done", ref: t.ref };
  });
}

export function omNotifications(s: OmState) {
  const tone: Record<string, string> = { done: "var(--accent)", waiting: "var(--warn)", failed: "var(--bad)" };
  const now = nowStamp(s);
  return s.events.slice().sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8).map(e => ({
    dot: tone[e.status || "done"], text: e.title + ": " + e.note, event: e.source + " · " + e.ref.id, channel: e.source,
    meta: e.at.slice(0, 10) === now.slice(0, 10) ? e.at.slice(11, 16) : dateShort(e.at), ref: e.ref,
  }));
}

export function omRailActivity(s: OmState) {
  const tone: Record<string, string> = { done: "var(--accent)", waiting: "var(--warn)", failed: "var(--bad)" };
  return s.events.slice().sort((a, b) => b.at.localeCompare(a.at)).slice(0, 5).map(e => ({ who: e.actor, what: e.title.toLowerCase() + " · " + e.ref.id, event: e.source, when: stamp(e.at).replace(/^\d\d \w\w\w, /, ""), dot: tone[e.status || "done"] }));
}

/* Command palette records: the same IDs every module uses. */
export function omSearch(s: OmState, go: Go, open: (r: Ref) => void) {
  const recs: any[] = [];
  enquiryRows(s).forEach(r => recs.push({ title: r.e.id + " · " + r.account + " · " + r.dev, meta: r.q.status + (OPEN_QUOTE.includes(r.q.status) ? " · due " + dateShort(r.e.due) : "") + (r.q.value ? " · " + gbp(r.q.value) : ""), hint: "ENQUIRY", glyph: "page", go: () => open({ kind: "enquiry", id: r.e.id }) }));
  s.orders.forEach(o => recs.push({ title: o.id + " · " + orderLabel(s, o), meta: gbp(o.value) + " · " + o.portal, hint: "ORDER", glyph: "page", go: () => go("Projects", "journey", o.id) }));
  s.loads.forEach(l => recs.push({ title: l.id + " · " + dev(s, byId(s.orders, l.orderId)?.devId)?.name, meta: l.status + " · " + l.plant, hint: "LOAD", glyph: "task", go: () => open({ kind: "load", id: l.id }) }));
  s.invoices.forEach(i => recs.push({ title: i.id + " · " + i.description, meta: i.stage + " · " + gbp(i.net) + " net", hint: "INVOICE", glyph: "task", go: () => open({ kind: "invoice", id: i.id }) }));
  s.rfis.forEach(x => recs.push({ title: x.id + " · " + x.question, meta: x.status + (x.blocking ? " · blocking" : ""), hint: "RFI", glyph: "task", go: () => open({ kind: "rfi", id: x.id }) }));
  s.designs.forEach(d => recs.push({ title: d.id + " " + d.revision, meta: d.status + " · iThesis (illustrative)", hint: "DESIGN", glyph: "page", go: () => open({ kind: "design", id: d.id }) }));
  s.accounts.forEach(a => recs.push({ title: a.name, meta: a.sector + " · " + a.hq, hint: "ACCOUNT", glyph: "org", go: () => open({ kind: "account", id: a.id }) }));
  s.contacts.forEach(c => recs.push({ title: c.name, meta: c.role + (c.accountId ? " · " + account(s, c.accountId)?.name : " · Oranmore"), hint: "PERSON", glyph: "person", go: () => open({ kind: "contact", id: c.id }) }));
  const pages = [
    ["Commercial · Inquiries", "Commercial", "inquiries"], ["Commercial · Quotations", "Commercial", "quotations"], ["Tender pipeline", "Commercial", "pipeline"],
    ["Projects · Project Journey", "Projects", "journey"], ["Customer portal preview", "Projects", "portal"], ["Contract setup", "Projects", "contract"],
    ["Plant capacity · Brandon & Lound", "Plants & Planning", "capacity"], ["Capacity scenarios", "Plants & Planning", "scenarios"], ["Quality & yard", "Plants & Planning", "quality"],
    ["Transport planner", "Logistics", "planner"], ["Exceptions & POD", "Logistics", "pod"], ["Carrier app preview", "Logistics", "carrier-app"],
    ["Invoice readiness", "Finance", "readiness"], ["Sage reconciliation (illustrative)", "Finance", "sage"], ["Executive dashboard", "Dashboard", "executive"],
  ].map(p => ({ title: p[0], meta: p[1], hint: "PAGE", glyph: "page", go: () => go(p[1], p[2]) }));
  return { recs, pages };
}

export const approvalCount = (s: OmState) => approvals(s).length;

/* Connected project strip for the Home rail: one row per stage, live counts. */
import { kpis, financeTotals, capacityWeek, loadAwaitingProof, PRE_SUBMIT } from "./selectors";
import { gbpShort, pct } from "./format";
export function omStrip(s: OmState) {
  const k = kpis(s), f = financeTotals(s), c = capacityWeek(s);
  const rows = enquiryRows(s);
  const inq = rows.filter(r => r.q.status === "Inquiry").length;
  const est = rows.filter(r => PRE_SUBMIT.includes(r.q.status)).length;
  const contract = s.orders.filter(o => !o.contractApproved).length;
  const design = s.designs.filter(d => !d.released);
  const lots = s.lots.filter(l => l.status === "Casting" || l.status === "Scheduled").length;
  const moving = s.loads.filter(l => ["Planned", "Loaded", "Dispatched"].includes(l.status)).length;
  const proof = s.loads.filter(loadAwaitingProof).length;
  type T = "ok" | "warn" | "bad" | "neutral";
  const row = (label: string, count: string, sub: string, tone: T, page: string, tab: string) => ({ label, count, sub, tone, page, tab });
  return [
    row("Enquiry", String(inq), "new, not yet estimating", inq ? "warn" : "ok", "Commercial", "inquiries"),
    row("Quote", String(est), k.due3 + " due ≤3 days" + (k.overdue ? " · " + k.overdue + " late" : ""), k.overdue ? "bad" : k.due3 ? "warn" : "ok", "Commercial", "quotations"),
    row("Contract", String(contract), k.rfiBlocking + " blocking RFI" + (k.rfiBlocking === 1 ? "" : "s"), k.rfiBlocking ? "bad" : contract ? "warn" : "ok", "Projects", "rfis"),
    row("iThesis design", String(design.length), design.filter(d => d.status === "Awaiting client approval").length + " awaiting client", design.some(d => d.status === "Awaiting client approval") ? "warn" : "ok", "Plants & Planning", "design"),
    row("Capacity", pct(c.pct), "hollowcore w/c 09 Nov", c.pct > 1 ? "bad" : c.pct > 0.9 ? "warn" : "ok", "Plants & Planning", "capacity"),
    row("Production", String(lots), "lots casting or scheduled", "neutral", "Plants & Planning", "production"),
    row("Dispatch", String(moving), "loads planned or moving", "neutral", "Logistics", "planner"),
    row("Delivery", String(proof), "awaiting accepted POD", proof ? "bad" : "ok", "Logistics", "pod"),
    row("Invoice", gbpShort(f.readyValue), gbpShort(f.heldValue) + " held", f.held.length ? "warn" : "ok", "Finance", "readiness"),
  ];
}
