/* Logistics: outsourced haulage, from the transport plan to verified proof of
   delivery. A carrier's "delivered" is a claim; only a person accepts proof. */
import { useRef, useState, type PointerEvent } from "react";
import "../../styles/om-ops.css";
import type { Om } from "../ui";
import { Page, Head, Grid, Card, Badge, Btn, Seg, Kpi, Bar, Table, Facts, RefLink, LineageChip, Field, Empty, useUi, Dot } from "../ui";
import type { Load, LoadStatus, Carrier } from "../types";
import { orderLabel, byId, dev, podQueue, carrierOf, loadAwaitingProof, nowStamp } from "../selectors";
import { CARRIER_STEPS } from "../actions";
import { gbp, num, dateShort, dayShort, stamp, hoursSince } from "../format";

const DAYS = ["2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13"];
const STATUSES: LoadStatus[] = ["Planned", "Loaded", "Dispatched", "Arrival claimed", "POD submitted", "POD verified", "Exception"];
const EXAMPLE_PHOTOS = ["unload_bay_a.jpg", "planks_stacked.jpg", "crane_lift.jpg", "delivery_note.jpg", "site_gate.jpg", "slab_level2.jpg"];

function Banner({ tone, children }: { tone?: "warn" | "bad" | "ok"; children: React.ReactNode }) {
  return <div className={"om-banner" + (tone ? " " + tone : "")}>{children}</div>;
}
const site = (om: Om, l: Load) => { const o = byId(om.s.orders, l.orderId); return o ? dev(om.s, o.devId) : undefined; };
const project = (om: Om, l: Load) => { const o = byId(om.s.orders, l.orderId); return o ? orderLabel(om.s, o) : l.orderId; };
const carrierShort = (om: Om, l: Load) => (carrierOf(om.s, l)?.name || "").replace(" (illustrative)", "");

function Evidence({ l }: { l: Load }) {
  return (
    <div className="om-ev">
      <div className={l.pod.photo ? "ok" : "bad"}><div className="k">Unloading photo</div><div className="v">{l.pod.photo ? l.pod.photoName || "Attached" : "Missing"}</div></div>
      <div className={l.pod.receiver ? "ok" : "bad"}><div className="k">Receiver</div><div className="v">{l.pod.receiver || "Missing"}</div></div>
      <div className={l.pod.signature ? "ok" : "bad"}><div className="k">Signature</div><div className="v">{l.pod.signature ? "Captured" : "Missing"}</div></div>
    </div>
  );
}
function InvoiceLine({ om, l }: { om: Om; l: Load }) {
  const inv = byId(om.s.invoices, l.invoiceId);
  if (!inv) return <span className="om-faint om-small">No invoice draft linked</span>;
  return <span className="om-row om-small" style={{ gap: 8, flexWrap: "wrap" }}><RefLink om={om} r={{ kind: "invoice", id: inv.id }} /><span className="om-mono">{gbp(inv.net)}</span><Badge>{inv.stage}</Badge>{inv.hold && <span className="om-faint">{inv.hold}</span>}</span>;
}

/* ── 1. Transport planner ──────────────────────────────────────────────── */
function Planner({ om }: { om: Om }) {
  const s = om.s;
  const [plant, setPlant] = useUi<string>(om, "log:plant", "All");
  const [carrier, setCarrier] = useUi<string>(om, "log:carrier", "All");
  const match = (l: Load) => (plant === "All" || l.plant === plant) && (carrier === "All" || l.carrierId === carrier);
  const loads = s.loads.filter(match);
  const open = loads.filter(l => l.collect.slice(0, 10) < DAYS[0] && l.status !== "POD verified");
  const week = loads.filter(l => DAYS.includes(l.collect.slice(0, 10)));
  const card = (l: Load) => {
    const d = site(om, l);
    return (
      <button key={l.id} className={"om-lcard" + (l.status === "Arrival claimed" || l.status === "Exception" ? " alert" : "")} onClick={() => om.open({ kind: "load", id: l.id })}>
        <div className="om-row" style={{ gap: 6 }}><span className="id">{l.id}</span><span style={{ marginLeft: "auto" }}><Badge>{l.status}</Badge></span></div>
        <div className="t">{l.plant} → {d?.name}</div>
        <div className="m">{d?.town} · {l.lotIds.join(", ") || "Lot n/a"}</div>
        <div className="m">Collect {stamp(l.collect).split(", ")[1] || stamp(l.collect)} · deliver {l.deliver.split(" ").slice(1).join(" ") || l.deliver}</div>
        <div className="m">{carrierShort(om, l)} · {l.trailer}</div>
        <div className="m">{l.siteContact} · {num(l.tonnes)} t · {l.pieces} pcs</div>
      </button>
    );
  };
  return (
    <>
      <div className="om-row" style={{ flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
        <Seg options={["All", "Brandon", "Lound"]} value={plant} onChange={setPlant} />
        <select className="om-input" style={{ width: 260 }} value={carrier} onChange={e => setCarrier(e.target.value)} aria-label="Carrier">
          <option value="All">All carriers</option>
          {s.carriers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <span style={{ marginLeft: "auto" }}><LineageChip l={{ source: "Transport planner (mock)", updated: "2026-11-05 16:20", state: "Imported from transport planner (mock Excel). 1 conflict reviewed" }} /></span>
      </div>
      <Banner>Imported from transport planner (mock Excel). Oranmore outsources haulage: every load is booked with a carrier and their subcontracted hauliers. There is no company-owned fleet.</Banner>
      {open.length > 0 && (
        <Card title="Still open from last week" sub="Collected before 09 Nov, proof not yet verified" style={{ marginTop: 14 }}>
          <div className="om-board" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))" }}>{open.map(card)}</div>
        </Card>
      )}
      <div className="om-board" style={{ marginTop: 14 }}>
        {DAYS.map(d => {
          const items = week.filter(l => l.collect.startsWith(d)).sort((a, b) => a.collect.localeCompare(b.collect));
          return (
            <div key={d} className="om-board-col">
              <div className="om-board-h"><b>{dayShort(d)}</b><span className="om-faint om-small">{items.length} load{items.length === 1 ? "" : "s"} · {num(items.reduce((t, l) => t + l.tonnes, 0))} t</span></div>
              {items.length ? items.map(card) : <div className="om-faint om-small" style={{ padding: "10px 4px" }}>No collections</div>}
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ── 2. Loads & deliveries ─────────────────────────────────────────────── */
function Loads({ om }: { om: Om }) {
  const s = om.s;
  const [filter, setFilter] = useUi<string>(om, "log:loadFilter", "All");
  const rows = s.loads.filter(l => filter === "All" || l.status === filter).slice().sort((a, b) => b.collect.localeCompare(a.collect));
  const [sel, setSel] = useUi<string>(om, "sel:Logistics:loads", rows[0]?.id || "");
  const l = byId(s.loads, sel) || rows[0];
  const opts: [string, string, number][] = [["All", "All", s.loads.length] as [string, string, number]].concat(STATUSES.map(st => [st, st, s.loads.filter(x => x.status === st).length] as [string, string, number]));
  return (
    <>
      <div style={{ marginBottom: 12 }}><Seg options={opts} value={filter} onChange={setFilter} /></div>
      <Grid>
        <Card span={l ? 7 : 12} flush title="Loads" sub={rows.length + " shown"}>
          <Table<Load> rowKey={x => x.id} rows={rows} selKey={l?.id} onRow={x => setSel(x.id)} cols={[
            { k: "id", label: "Load", render: x => <span className="mono ink">{x.id}</span> },
            { k: "p", label: "Project", render: x => project(om, x) },
            { k: "f", label: "From", render: x => x.plant },
            { k: "c", label: "Carrier", render: x => carrierShort(om, x) },
            { k: "col", label: "Collect", render: x => stamp(x.collect), cls: "mono" },
            { k: "s", label: "Status", render: x => <Badge>{x.status}</Badge> },
          ]} />
        </Card>
        {l && (
          <Card span={5} title={l.id} sub={project(om, l)} right={<Badge>{l.status}</Badge>}>
            <Facts items={[["From", l.plant], ["To", (site(om, l)?.name || "") + ", " + (site(om, l)?.town || "")], ["Lots", l.lotIds.length ? l.lotIds.map(id => <RefLink key={id} om={om} r={{ kind: "lot", id }} />) : "n/a"], ["Haulier", carrierShort(om, l)], ["Driver (mock)", l.driver], ["Trailer", l.trailer], ["Collection", stamp(l.collect)], ["Delivery window", l.deliver], ["Carrier claim", l.claimed ? stamp(l.claimed) : "—"], ["POD verified", l.pod.verified ? stamp(l.pod.verified) + " · " + l.pod.verifiedBy : "—"]]} />
            <div className="om-eyebrow" style={{ margin: "14px 0 8px" }}>Evidence</div>
            <Evidence l={l} />
            {l.exception && <div className="om-small" style={{ color: "var(--bad)", marginTop: 8 }}>{l.exception}</div>}
            {l.notes && <p className="om-small om-muted">{l.notes}</p>}
            <div className="om-eyebrow" style={{ margin: "14px 0 8px" }}>Impacted invoice</div>
            <InvoiceLine om={om} l={l} />
            <div className="om-divider" />
            <div className="om-row" style={{ flexWrap: "wrap" }}>
              <Btn sm onClick={() => om.open({ kind: "load", id: l.id })}>Open record</Btn>
              {loadAwaitingProof(l) && <Btn sm kind="primary" onClick={() => { om.setUi("sel:Logistics:pod", l.id); om.setSub("pod"); }}>Review in Exceptions & POD</Btn>}
              {l.status !== "POD verified" && <Btn sm onClick={() => { om.setUi("sel:Logistics:carrier-app", l.id); om.setSub("carrier-app"); }}>Open in carrier app</Btn>}
            </div>
          </Card>
        )}
      </Grid>
    </>
  );
}

/* ── 3. Carriers ───────────────────────────────────────────────────────── */
function Carriers({ om }: { om: Om }) {
  const s = om.s;
  const [sel, setSel] = useUi<string>(om, "sel:Logistics:carriers", s.carriers[0]?.id || "");
  const c = byId(s.carriers, sel) || s.carriers[0];
  const loads = c ? s.loads.filter(l => l.carrierId === c.id) : [];
  return (
    <Grid>
      <div className="om-s-12"><Banner>Illustrative transport partners. Names, equipment and performance are demo data, not real carrier relationships.</Banner></div>
      <Card span={7} flush title="Carrier directory">
        <Table<Carrier> rowKey={x => x.id} rows={s.carriers} selKey={c?.id} onRow={x => setSel(x.id)} cols={[
          { k: "n", label: "Carrier", render: x => <span className="ink">{x.name}</span> },
          { k: "b", label: "Base", render: x => x.base },
          { k: "e", label: "Equipment", render: x => x.equipment.join(", ") },
          { k: "o", label: "On-time (mock)", render: x => <span className="om-row" style={{ gap: 8, minWidth: 110 }}><Bar value={x.onTime} max={100} color={x.onTime < 90 ? "var(--warn)" : "var(--ok)"} /><span className="om-mono">{x.onTime}%</span></span> },
          { k: "a", label: "Active", align: "right", render: x => s.loads.filter(l => l.carrierId === x.id && l.status !== "POD verified").length, cls: "mono" },
          { k: "i", label: "Issues", render: x => x.issues.length ? <Badge tone="warn">{x.issues.length}</Badge> : <span className="om-faint">None</span> },
        ]} />
      </Card>
      {c && (
        <Card span={5} title={c.name} sub={c.base + " · " + c.contact}>
          <div className="om-row" style={{ flexWrap: "wrap", gap: 6 }}>{c.equipment.map(e => <span key={e} className="om-chip">{e}</span>)}</div>
          <div className="om-eyebrow" style={{ margin: "14px 0 8px" }}>Issue history</div>
          {c.issues.length ? c.issues.map(i => <div key={i} className="om-row om-small" style={{ padding: "3px 0" }}><Dot tone="warn" />{i}</div>) : <div className="om-faint om-small">No issues logged.</div>}
          <div className="om-eyebrow" style={{ margin: "14px 0 8px" }}>Loads</div>
          {loads.map(l => <div key={l.id} className="om-row om-small" style={{ padding: "4px 0", borderTop: "1px solid var(--border)" }}><RefLink om={om} r={{ kind: "load", id: l.id }} /><span className="om-muted" style={{ flex: 1, minWidth: 0 }}>{site(om, l)?.name} · {dateShort(l.collect)}</span><Badge>{l.status}</Badge></div>)}
        </Card>
      )}
    </Grid>
  );
}

/* ── 4. Exceptions & POD ───────────────────────────────────────────────── */
function Pod({ om }: { om: Om }) {
  const s = om.s;
  const queue = podQueue(s);
  const claimed = s.loads.filter(l => l.status === "Arrival claimed");
  const received = s.loads.filter(l => l.status === "POD submitted" || l.status === "Exception");
  const accepted = s.loads.filter(l => l.status === "POD verified").sort((a, b) => (b.pod.verified || "").localeCompare(a.pod.verified || ""));
  const [sel, setSel] = useUi<string>(om, "sel:Logistics:pod", queue[0]?.l.id || "LOAD-4481");
  const l = byId(s.loads, sel);
  const [note, setNote] = useState("");
  const now = nowStamp(s);
  const inv = l ? byId(s.invoices, l.invoiceId) : undefined;
  const lane = (title: string, tone: "bad" | "warn" | "ok", list: Load[], hint: string) => (
    <div className={"om-lane l-" + tone}>
      <div className="om-lane-h"><Dot tone={tone} /><b>{title}</b><span className="n">{list.length}</span></div>
      <div className="om-faint om-tiny" style={{ padding: "8px 14px 0" }}>{hint}</div>
      <div className="om-list" style={{ paddingTop: 4 }}>
        {list.length ? list.map(x => {
          const i = byId(s.invoices, x.invoiceId);
          return (
            <button key={x.id} className={"om-li" + (x.id === l?.id ? " sel" : "")} onClick={() => { setSel(x.id); setNote(""); }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="om-row" style={{ gap: 8 }}><span className="om-mono om-small om-ink">{x.id}</span>{x.claimed && x.status !== "POD verified" && <span className="om-faint om-tiny">{hoursSince(x.claimed, now)}h</span>}{i && <span className="om-mono om-small" style={{ marginLeft: "auto" }}>{gbp(i.net)}</span>}</div>
                <div className="om-small om-muted" style={{ marginTop: 3 }}>{project(om, x)}</div>
                <div className="om-tiny om-faint" style={{ marginTop: 2 }}>{x.status === "POD verified" ? "Accepted " + stamp(x.pod.verified) : x.exception || (x.claimed ? "Claimed " + stamp(x.claimed) : "")}</div>
              </div>
            </button>
          );
        }) : <Empty title="Empty" />}
      </div>
    </div>
  );
  return (
    <>
      {queue[0] && (
        <Banner tone="bad"><span><b>Highest priority: {queue[0].l.id}</b>, {project(om, queue[0].l)}. {queue[0].l.status === "Arrival claimed" ? "Carrier marked delivered " + stamp(queue[0].l.claimed) + " with no photo or receiver signature" : queue[0].l.exception || "POD awaiting review"}, {queue[0].hours} hours ago.{queue[0].invoice ? " " + queue[0].invoice.id + " " + gbp(queue[0].invoice.net) + " " + queue[0].invoice.stage.toLowerCase() + "." : ""}</span></Banner>
      )}
      <div className="om-lanes" style={{ marginTop: 14 }}>
        {lane("Carrier marked delivered", "bad", claimed, "A claim only. Not proof of delivery.")}
        {lane("POD received, review pending", "warn", received, "Evidence submitted or disputed. A person must decide.")}
        {lane("POD accepted", "ok", accepted, "Verified by a person. Invoice can be released.")}
      </div>
      {l && (
        <Grid style={{ marginTop: 14 }}>
          <Card span={7} title={"Evidence review · " + l.id} sub={project(om, l) + " · " + carrierShort(om, l)} right={<><Badge>{l.status}</Badge><LineageChip l={{ source: l.pod.verified ? "Pulse" : l.pod.submitted ? "Carrier app (simulated)" : "Carrier claim", updated: l.pod.verified || l.pod.submitted || l.claimed || l.collect, state: l.pod.verified ? "Verified by " + l.pod.verifiedBy : l.claimed ? "Claim awaiting validation" : "Planned" }} /></>}>
            <Facts items={[["Carrier claim", l.claimed ? stamp(l.claimed) : "—"], ["POD submitted", l.pod.submitted ? stamp(l.pod.submitted) : "—"], ["Accepted", l.pod.verified ? stamp(l.pod.verified) + " · " + l.pod.verifiedBy : "—"], ["Delivery window", l.deliver]]} />
            <div style={{ marginTop: 12 }}><Evidence l={l} /></div>
            {l.exception && <Banner tone="warn"><span>{l.exception}</span></Banner>}
            <div className="om-faint om-tiny" style={{ marginTop: 10 }}>Timestamps and locations are demo data, not independently verified telematics.</div>
          </Card>
          <Card span={5} title="Decision" sub="Human review of delivery evidence">
            <div className="om-eyebrow" style={{ marginBottom: 8 }}>Impacted invoice</div>
            <InvoiceLine om={om} l={l} />
            <div className="om-divider" />
            {l.status === "Arrival claimed" && (
              <div className="om-col">
                <Banner tone="bad"><span><b>A claim is not proof.</b> Nothing to accept until the carrier submits a photo, receiver name and signature.</span></Banner>
                <Btn kind="primary" onClick={() => { om.do.requestPod(l.id); om.toast("POD requested from " + carrierShort(om, l) + " (simulated, no message sent)."); }}>Request missing photo and signature</Btn>
                <Btn onClick={() => { om.setUi("sel:Logistics:carrier-app", l.id); om.setSub("carrier-app"); }}>Open carrier app for this load</Btn>
                <Btn disabled title="A claim is not proof">Accept POD</Btn>
              </div>
            )}
            {(l.status === "POD submitted" || l.status === "Exception") && (
              <div className="om-col">
                <Field label={l.status === "Exception" ? "Resolution note (required)" : "Review note (optional)"}><input className="om-input" value={note} onChange={e => setNote(e.target.value)} placeholder={l.status === "Exception" ? "For example: accept 35 planks, credit 1" : "For example: photo shows all units bay A"} /></Field>
                <Btn kind="primary" disabled={l.status === "Exception" && !note.trim() || (!l.pod.photo && !l.pod.signature)} onClick={() => { om.do.reviewPod(l.id, true, note.trim()); setNote(""); om.toast(l.id + " accepted. Invoice now eligible: finance can release it."); }}>{l.status === "Exception" ? "Accept with note" : "Accept POD"}</Btn>
                <Btn kind="danger" onClick={() => { om.do.reviewPod(l.id, false, note.trim() || "Evidence insufficient"); setNote(""); om.toast(l.id + " rejected. Invoice stays held."); }}>Reject{note.trim() ? " with note" : ""}</Btn>
                <Btn onClick={() => { om.do.requestPod(l.id); om.toast("Further evidence requested (simulated)."); }}>Request more evidence</Btn>
              </div>
            )}
            {l.status === "POD verified" && (
              <div className="om-col">
                <Banner tone="ok"><span>Proof accepted {stamp(l.pod.verified)} by {l.pod.verifiedBy}.</span></Banner>
                {inv && inv.stage === "Eligible" && <><div className="om-small"><b>Invoice now eligible: finance can release it.</b></div><Btn kind="primary" onClick={() => om.go("Finance", "readiness", inv.id)}>Open {inv.id} in Finance →</Btn></>}
                {inv && inv.stage !== "Eligible" && <div className="om-small om-muted">{inv.id} is {inv.stage.toLowerCase()}. <button className="om-link" onClick={() => om.go("Finance", "readiness", inv.id)}>Open in Finance</button></div>}
              </div>
            )}
            {(l.status === "Planned" || l.status === "Loaded" || l.status === "Dispatched") && <div className="om-small om-muted">Not delivered yet. Nothing to review.</div>}
          </Card>
        </Grid>
      )}
    </>
  );
}

/* ── 5. Carrier app (phone preview) ────────────────────────────────────── */
function SignaturePad({ onDone, done }: { onDone: () => void; done: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [inked, setInked] = useState(false);
  const pos = (e: PointerEvent<HTMLCanvasElement>) => { const c = ref.current!; const r = c.getBoundingClientRect(); return [(e.clientX - r.left) * (c.width / r.width), (e.clientY - r.top) * (c.height / r.height)]; };
  const down = (e: PointerEvent<HTMLCanvasElement>) => { if (done) return; drawing.current = true; e.currentTarget.setPointerCapture(e.pointerId); const ctx = ref.current!.getContext("2d")!; const [x, y] = pos(e); ctx.beginPath(); ctx.moveTo(x, y); };
  const move = (e: PointerEvent<HTMLCanvasElement>) => { if (!drawing.current) return; const ctx = ref.current!.getContext("2d")!; ctx.strokeStyle = getComputedStyle(ref.current!).color || "#f3f3f2"; ctx.lineWidth = 2.4; ctx.lineCap = "round"; const [x, y] = pos(e); ctx.lineTo(x, y); ctx.stroke(); setInked(true); };
  const up = () => { drawing.current = false; };
  const clear = () => { const c = ref.current; if (c) c.getContext("2d")!.clearRect(0, 0, c.width, c.height); setInked(false); };
  const quick = () => { const c = ref.current; if (!c) return; const ctx = c.getContext("2d")!; ctx.strokeStyle = getComputedStyle(c).color || "#f3f3f2"; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(30, 80); ctx.bezierCurveTo(60, 20, 90, 110, 120, 60); ctx.bezierCurveTo(150, 20, 170, 100, 210, 70); ctx.stroke(); setInked(true); };
  return (
    <div>
      <canvas ref={ref} width={280} height={120} className="om-sig" style={{ color: "var(--ink)" }} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} aria-label="Signature pad" />
      <div className="om-row" style={{ marginTop: 6 }}>
        {!done && <><button className="om-link om-small" onClick={quick}>Sign for me (demo)</button><button className="om-link om-small" onClick={clear}>Clear</button></>}
        <span style={{ marginLeft: "auto" }}>{done ? <Badge tone="ok">Signature captured</Badge> : <Btn sm kind="primary" disabled={!inked} onClick={onDone}>Use signature</Btn>}</span>
      </div>
    </div>
  );
}

function CarrierApp({ om }: { om: Om }) {
  const s = om.s;
  const active = s.loads.filter(l => l.status !== "POD verified").sort((a, b) => a.collect.localeCompare(b.collect));
  const [sel, setSel] = useUi<string>(om, "sel:Logistics:carrier-app", "LOAD-4481");
  const [screen, setScreen] = useState<"list" | "load">("load");
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [receiver, setReceiver] = useState("");
  const [exc, setExc] = useState("");
  const [showExc, setShowExc] = useState(false);
  const l = byId(s.loads, sel);
  const d = l ? site(om, l) : undefined;
  const step = l ? (l.status === "POD submitted" || l.status === "POD verified" ? 6 : l.carrierStep) : 0;
  const pick = (id: string) => { setSel(id); setScreen("load"); setChecks({}); setReceiver(""); setExc(""); setShowExc(false); };
  const COLLECT = ["Piece count matches delivery note", "Straps and bearers checked", "Lot labels match " + (l?.lotIds.join(", ") || "load")];
  const events = l ? s.events.filter(e => e.ref.kind === "load" && e.ref.id === l.id).slice(0, 5) : [];
  const inv = l ? byId(s.invoices, l.invoiceId) : undefined;

  const phone = (
    <div className="om-phone" aria-label="Carrier app preview">
      <div className="om-phone-scr">
        <div className="om-ph-top"><span>{nowStamp(s).slice(11)}</span><span>Oranmore Carrier · demo</span></div>
        {screen === "list" || !l ? (
          <>
            <div className="om-ph-bar"><b>My loads</b><span className="om-faint om-small" style={{ marginLeft: "auto" }}>{active.length}</span></div>
            <div className="om-ph-body">
              {active.map(x => (
                <button key={x.id} className="om-ph-item" onClick={() => pick(x.id)}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="om-mono om-small om-ink">{x.id}</div>
                    <div className="om-small" style={{ marginTop: 3 }}>{x.plant} → {site(om, x)?.town}</div>
                    <div className="om-tiny om-faint" style={{ marginTop: 2 }}>{stamp(x.collect)} · {carrierShort(om, x)}</div>
                  </div>
                  <Badge>{x.status}</Badge>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="om-ph-bar"><button className="om-link" onClick={() => setScreen("list")} aria-label="Back to my loads">‹ Loads</button><b style={{ marginLeft: 6 }}>{l.id}</b><span style={{ marginLeft: "auto" }}><Badge>{l.status}</Badge></span></div>
            <div className="om-ph-body">
              <div className="om-ph-steps">{CARRIER_STEPS.map((c, i) => <span key={c} className={i <= step ? "on" : ""} title={c} />)}</div>
              <div className="om-small"><b className="om-ink">{CARRIER_STEPS[Math.min(step, 6)]}</b><div className="om-muted" style={{ marginTop: 3 }}>{l.plant} → {d?.name}, {d?.town}</div><div className="om-faint om-tiny" style={{ marginTop: 2 }}>Deliver {l.deliver} · {l.siteContact}</div></div>
              {step === 0 && (
                <>
                  {COLLECT.map(c => <label key={c} className="om-ph-item" style={{ cursor: "pointer" }}><input type="checkbox" checked={!!checks[c]} onChange={e => setChecks({ ...checks, [c]: e.target.checked })} /><span className="om-small">{c}</span></label>)}
                  <button className="om-ph-btn" disabled={!COLLECT.every(c => checks[c])} onClick={() => om.do.carrierAdvance(l.id)}>Confirm collection</button>
                </>
              )}
              {step === 1 && <button className="om-ph-btn" onClick={() => om.do.carrierAdvance(l.id)}>Depart for site</button>}
              {step === 2 && <><div className="om-small om-muted">En route. Location sharing is not used in this demo.</div><button className="om-ph-btn" onClick={() => om.do.carrierAdvance(l.id)}>Arrived at site</button></>}
              {step >= 3 && step < 6 && l.status !== "Exception" && (
                <>
                  {l.claimed && <div className="om-tiny om-faint">Arrival claimed {stamp(l.claimed)}. Proof still needed.</div>}
                  <div className="om-label" style={{ margin: 0 }}>1. Unloading photo (simulated)</div>
                  <div className="om-photo">{EXAMPLE_PHOTOS.map(p => <button key={p} className={l.pod.photoName === p ? "on" : ""} onClick={() => om.do.carrierSetPod(l.id, { photo: true, photoName: p })}>{p.replace(".jpg", "")}</button>)}</div>
                  <div className="om-label" style={{ margin: 0 }}>2. Recipient name</div>
                  <div className="om-row"><input className="om-input" value={receiver || l.pod.receiver || ""} onChange={e => setReceiver(e.target.value)} placeholder="Name of person receiving" /><Btn sm disabled={!(receiver || "").trim()} onClick={() => om.do.carrierSetPod(l.id, { receiver: receiver.trim() })}>Save</Btn></div>
                  <div className="om-label" style={{ margin: 0 }}>3. Recipient signature</div>
                  <SignaturePad key={l.id} done={l.pod.signature} onDone={() => om.do.carrierSetPod(l.id, { signature: true })} />
                  <button className="om-ph-btn" disabled={!l.pod.photo || !l.pod.receiver || !l.pod.signature} onClick={() => { om.do.carrierSubmit(l.id); om.toast(l.id + ": POD submitted, review pending. Not verified until the office accepts it."); }}>Submit delivery</button>
                </>
              )}
              {step < 6 && l.status !== "Exception" && (showExc ? (
                <>
                  <textarea className="om-input" rows={3} value={exc} onChange={e => setExc(e.target.value)} placeholder="What went wrong? For example: crane not on site, unit damaged" />
                  <div className="om-row"><button className="om-ph-btn ghost" onClick={() => setShowExc(false)}>Cancel</button><button className="om-ph-btn warn" disabled={!exc.trim()} onClick={() => { om.do.carrierException(l.id, exc.trim()); setShowExc(false); om.toast(l.id + ": exception reported to the office."); }}>Send exception</button></div>
                </>
              ) : <button className="om-ph-btn ghost" onClick={() => setShowExc(true)}>Report exception</button>)}
              {(step >= 6 || l.status === "Exception") && (
                <div className="om-col">
                  <Badge tone={l.status === "POD verified" ? "ok" : l.status === "Exception" ? "bad" : "warn"}>{l.status === "POD submitted" ? "POD submitted, review pending" : l.status === "POD verified" ? "Accepted by office" : "Exception reported"}</Badge>
                  {l.exception && <div className="om-small" style={{ color: "var(--bad)" }}>{l.exception}</div>}
                  <div className="om-small om-muted">Timestamps and location are demo data, not verified telematics. Office review required.</div>
                  <button className="om-ph-btn ghost" onClick={() => setScreen("list")}>Back to my loads</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="om-carrier-wrap">
      <div>{phone}</div>
      <Grid>
        <div className="om-s-12"><Banner>Carrier-facing preview. No sign-in, GPS or server: everything updates the shared demo state, so the office view on the right moves as the driver taps.</Banner></div>
        <Card span={12} title="Load in the app" right={<select className="om-input" style={{ width: 220 }} value={sel} onChange={e => pick(e.target.value)} aria-label="Load">{active.concat(s.loads.filter(x => x.status === "POD verified")).map(x => <option key={x.id} value={x.id}>{x.id} · {x.status}</option>)}</select>}>
          {l ? (
            <>
              <div className="om-row" style={{ flexWrap: "wrap", gap: 8, marginBottom: 12 }}><b>{project(om, l)}</b><Badge>{l.status}</Badge></div>
              <Evidence l={l} />
              <div className="om-kpis" style={{ marginTop: 12 }}>
                <Kpi label="Carrier claim" value={l.claimed ? stamp(l.claimed) : "—"} />
                <Kpi label="POD submitted" value={l.pod.submitted ? stamp(l.pod.submitted) : "—"} tone={l.pod.submitted ? "warn" : undefined} />
                <Kpi label="Invoice" value={inv ? gbp(inv.net) : "—"} sub={inv ? inv.stage : ""} tone={inv?.stage === "Held" ? "bad" : undefined} />
              </div>
              <div className="om-eyebrow" style={{ margin: "14px 0 8px" }}>Office activity on this load</div>
              {events.length ? events.map(e => <div key={e.id} className="om-small" style={{ padding: "5px 0", borderTop: "1px solid var(--border)" }}><span className="om-mono om-faint">{stamp(e.at)}</span> · <b style={{ fontWeight: 600 }}>{e.title}</b> <span className="om-muted">· {e.actor}</span></div>) : <div className="om-faint om-small">No events yet.</div>}
              <div className="om-row" style={{ marginTop: 14, flexWrap: "wrap" }}>
                {loadAwaitingProof(l) && <Btn kind="primary" onClick={() => { om.setUi("sel:Logistics:pod", l.id); om.setSub("pod"); }}>Review in Exceptions & POD</Btn>}
                <Btn onClick={() => om.open({ kind: "load", id: l.id })}>Open record</Btn>
              </div>
            </>
          ) : <Empty title="Pick a load" />}
        </Card>
      </Grid>
    </div>
  );
}

const SUBS: Record<string, [string, string]> = {
  planner: ["Transport planner", "The week's collections by day, replacing the Excel planner. Every load is with an outsourced carrier."],
  loads: ["Loads & deliveries", "Every load from planned to verified, with the evidence and the invoice it unlocks."],
  carriers: ["Carriers", "Illustrative haulage partners, equipment and mock performance."],
  pod: ["Exceptions & POD", "Carrier marked delivered, POD received and POD accepted are three different things. Only a person accepts proof."],
  "carrier-app": ["Carrier app preview", "What a driver sees on site: collection check, arrival, photo, receiver and signature."],
};

export default function Logistics({ om }: { om: Om }) {
  const s = om.s;
  const [title, sub] = SUBS[om.sub] || SUBS.planner;
  const q = podQueue(s);
  return (
    <Page>
      <Head eyebrow="Logistics · outsourced haulage" title={title} sub={sub} />
      {om.sub !== "carrier-app" && (
        <div className="om-kpis" style={{ marginBottom: 14 }}>
          <Kpi label="Loads this week" value={s.loads.filter(l => DAYS.includes(l.collect.slice(0, 10))).length} sub={s.loads.filter(l => l.status === "Dispatched" || l.status === "Loaded").length + " moving now"} onClick={() => om.setSub("planner")} />
          <Kpi label="Claimed, no POD" value={s.loads.filter(l => l.status === "Arrival claimed").length} tone="bad" sub={q[0] ? q[0].l.id + " · " + q[0].hours + "h" : ""} onClick={() => om.setSub("pod")} />
          <Kpi label="POD review pending" value={s.loads.filter(l => l.status === "POD submitted" || l.status === "Exception").length} tone="warn" onClick={() => om.setSub("pod")} />
          <Kpi label="POD verified" value={s.loads.filter(l => l.status === "POD verified").length} tone="ok" onClick={() => { om.setUi("log:loadFilter", "POD verified"); om.setSub("loads"); }} />
        </div>
      )}
      {om.sub === "loads" ? <Loads om={om} /> : om.sub === "carriers" ? <Carriers om={om} /> : om.sub === "pod" ? <Pod om={om} /> : om.sub === "carrier-app" ? <CarrierApp om={om} /> : <Planner om={om} />}
    </Page>
  );
}
