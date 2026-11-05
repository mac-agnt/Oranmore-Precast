/* Plants & Planning: Brandon and Lound. iThesis stays the schedule of record;
   everything here is a read-only snapshot, a human sign-off, or a local simulation. */
import { useState } from "react";
import "../../styles/om-ops.css";
import type { Om } from "../ui";
import { Page, Head, Grid, Card, Badge, Btn, Seg, Kpi, Bar, Table, Facts, RefLink, LineageChip, Modal, Field, Empty, useUi, Dot } from "../ui";
import type { Commitment, Lot, DesignPackage, Product } from "../types";
import { HOLLOWCORE_CAPACITY, OTHER_LINES, WEEKS, WEEK } from "../fixtures";
import { capacityWeek, orderLabel, byId, rfisFor, blockingOpen, TODAY, type Scenario } from "../selectors";
import { m2, num, pct, dateShort, dateUK, stamp, weekLabel, daysBetween } from "../format";

const PRODUCTS: ("Hollowcore" | Product)[] = ["Hollowcore", "Beam & block", "Stairs & landings", "Lift shafts", "Bespoke", "Twinwall"];
const loadColor = (p: number) => (p > 1 ? "var(--bad)" : p > 0.9 ? "var(--warn)" : "var(--accent)");

function Banner({ tone, children }: { tone?: "warn" | "bad" | "ok"; children: React.ReactNode }) {
  return <div className={"om-banner" + (tone ? " " + tone : "")}>{children}</div>;
}

/* Firm + hypothetical + tentative bar against capacity. */
function Stack({ cap, firm, add = 0, tent = 0 }: { cap: number; firm: number; add?: number; tent?: number }) {
  const scale = Math.max(cap, firm + add + tent) * 1.02;
  const w = (n: number) => (n / scale) * 100 + "%";
  return (
    <div className="om-stack" title={"Firm " + num(firm) + " m², hypothetical " + num(add) + " m², tentative " + num(tent) + " m², capacity " + num(cap) + " m²"}>
      <span style={{ width: w(firm), background: "var(--accent)" }} />
      {add > 0 && <span style={{ width: w(add), background: "repeating-linear-gradient(45deg,var(--warn) 0 6px,color-mix(in srgb,var(--warn) 55%,transparent) 6px 12px)" }} />}
      {tent > 0 && <span style={{ width: w(tent), background: "repeating-linear-gradient(45deg,var(--neutral) 0 5px,transparent 5px 10px)" }} />}
      <em style={{ left: (cap / scale) * 100 + "%" }} />
    </div>
  );
}

/* ── 1. Capacity ────────────────────────────────────────────────────────── */
function Capacity({ om }: { om: Om }) {
  const s = om.s;
  const [mode, setMode] = useUi<"week" | "fortnight">(om, "plants:capMode", "week");
  const [product, setProduct] = useUi<string>(om, "plants:capProduct", "Hollowcore");
  const [wk, setWk] = useUi<string>(om, "plants:capWeek", WEEK);
  const weeks = WEEKS.map(w => capacityWeek(s, w));
  const periods = mode === "week"
    ? weeks.map(w => ({ key: w.week, label: weekLabel(w.week), weeks: [w] }))
    : [0, 2, 4].map(i => ({ key: weeks[i].week, label: dateShort(weeks[i].week) + " to " + dateShort(weeks[i + 1].week) + " (2 wks)", weeks: [weeks[i], weeks[i + 1]] }));
  const sel = periods.find(p => p.key === wk) || periods[0];
  const agg = (["Brandon", "Lound"] as const).map((pl, i) => {
    const ps = sel.weeks.map(w => w.plants[i]);
    const cap = ps.reduce((t, p) => t + p.cap, 0), firm = ps.reduce((t, p) => t + p.firm, 0), tent = ps.reduce((t, p) => t + p.tentative, 0);
    return { plant: pl, cap, firm, tent, free: cap - firm, pct: firm / cap, firmItems: ps.flatMap(p => p.firmItems), tentItems: ps.flatMap(p => p.tentItems) };
  });
  const tCap = agg[0].cap + agg[1].cap, tFirm = agg[0].firm + agg[1].firm, tTent = agg[0].tent + agg[1].tent;
  const warnings = weeks.flatMap(w => w.plants.filter(p => p.firm + p.tentative > p.cap).map(p => ({ week: w.week, plant: p.plant, over: p.firm + p.tentative - p.cap, firm: p.firm, tent: p.tentative, cap: p.cap })));
  const firmOver = weeks.flatMap(w => w.plants.filter(p => p.firm > p.cap).map(p => ({ week: w.week, plant: p.plant })));

  if (product !== "Hollowcore") {
    const lines = OTHER_LINES.filter(l => l.product === product);
    return (
      <>
        <div className="om-row" style={{ flexWrap: "wrap", marginBottom: 14 }}><Seg options={PRODUCTS} value={product} onChange={setProduct} /></div>
        <Grid>
          <Card span={8} title={product + " · weekly line capacity"} sub="Illustrative. Tracked on its own unit basis." right={<LineageChip l={{ source: "iThesis (illustrative)", updated: "2026-11-09 08:40", state: "Read-only snapshot of line loading" }} />}>
            {lines.length ? lines.map(l => (
              <div key={l.plant} className="om-plant" style={{ marginBottom: 10 }}>
                <div className="om-row"><b>{l.plant}</b><Badge tone="neutral" dot={false}>{l.unit}</Badge><span style={{ marginLeft: "auto" }} className="om-mono">{num(l.committed)} / {num(l.capacity)}</span></div>
                <div style={{ marginTop: 10 }}><Bar value={l.committed} max={l.capacity} color={loadColor(l.committed / l.capacity)} /></div>
                <div className="om-small om-muted" style={{ marginTop: 8 }}>{pct(l.committed / l.capacity)} committed · {num(l.capacity - l.committed)} {l.unit.split(" / ")[0]} free this week</div>
              </div>
            )) : <Empty title={"No " + product + " line in the illustrative data"} />}
          </Card>
          <Card span={4} title="Why not m²?">
            <p className="om-small om-muted" style={{ margin: 0, lineHeight: 1.6 }}>{product} is <b className="om-ink">not converted to hollowcore m²</b>. Each line has its own capacity unit and constraint. Mixing them into one m² figure would overstate or understate free capacity, so Pulse shows them side by side and leaves conversion logic to be agreed with the plant managers.</p>
            <div className="om-divider" />
            <Btn sm onClick={() => setProduct("Hollowcore")}>Back to hollowcore</Btn>
          </Card>
        </Grid>
      </>
    );
  }

  return (
    <>
      <div className="om-row" style={{ flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
        <Seg options={PRODUCTS} value={product} onChange={setProduct} />
        <span style={{ marginLeft: "auto" }} />
        <Seg options={[["week", "Weekly"], ["fortnight", "Fortnightly"]]} value={mode} onChange={v => { setMode(v); setWk(WEEKS[0]); }} />
      </div>
      <Banner>Illustrative plant split of the published ~10,000 m²/week combined hollowcore capability. iThesis holds the real schedule. Firm commitments count; tentative demand is shown hatched and never counted.</Banner>
      <div className="om-weeks" style={{ margin: "14px 0" }}>
        {periods.map(p => {
          const pl = (["Brandon", "Lound"] as const).map((n, i) => { const cap = p.weeks.reduce((t, w) => t + w.plants[i].cap, 0); const firm = p.weeks.reduce((t, w) => t + w.plants[i].firm, 0); return { n, pct: firm / cap }; });
          return (
            <button key={p.key} className={"om-week" + (p.key === sel.key ? " on" : "")} onClick={() => setWk(p.key)}>
              <div className="wk">{p.label}</div>
              {pl.map(x => <div key={x.n} className="ln"><b>{x.n}</b><Bar value={x.pct} color={loadColor(x.pct)} /><span className="om-mono">{pct(x.pct)}</span></div>)}
            </button>
          );
        })}
      </div>
      <Grid>
        <div className="om-s-12 om-kpis">
          <Kpi label="Combined capacity" value={m2(tCap)} sub={mode === "week" ? "Brandon " + num(HOLLOWCORE_CAPACITY.Brandon) + " + Lound " + num(HOLLOWCORE_CAPACITY.Lound) : "2 weeks"} />
          <Kpi label="Firm committed" value={m2(tFirm)} sub={pct(tFirm / tCap) + " of capacity"} tone="accent" />
          <Kpi label="Free" value={m2(tCap - tFirm)} sub="after firm commitments" tone="ok" />
          <Kpi label="Tentative (not counted)" value={m2(tTent)} sub="awaiting design or RFIs" />
        </div>
        {agg.map(p => (
          <Card key={p.plant} span={6} className="om-s-keep" title={p.plant + " hollowcore"} sub={sel.label} right={<Badge tone={p.pct > 1 ? "bad" : p.pct > 0.9 ? "warn" : "ok"}>{p.pct > 1 ? "Overloaded" : p.pct > 0.9 ? "Tight" : "Within capacity"}</Badge>}>
            <div className="om-row" style={{ alignItems: "baseline", gap: 12 }}>
              <span className="big" style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-1px", fontVariantNumeric: "tabular-nums" }}>{pct(p.pct, p.plant === "Lound" ? 1 : 0)}</span>
              <span className="om-muted om-small">{num(p.firm)} of {num(p.cap)} m² firm · {num(p.free)} m² free</span>
            </div>
            <div style={{ margin: "12px 0 14px" }}><Stack cap={p.cap} firm={p.firm} tent={p.tent} /></div>
            <Table<Commitment> rowKey={c => c.id} rows={p.firmItems} onRow={c => om.open(c.ref)}
              cols={[
                { k: "w", label: "Commitment", render: c => <span className="ink">{c.label}{c.ref.id === "ORD-26-125" && c.plant === "Lound" && <span className="om-faint om-small"> · included in Lound total</span>}</span> },
                { k: "o", label: "Order", render: c => <RefLink om={om} r={c.ref} /> },
                { k: "wk", label: "Week", render: c => dateShort(c.week), cls: "mono" },
                { k: "m", label: "m²", align: "right", render: c => num(c.m2), cls: "mono ink" },
              ]} />
            {p.tentItems.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div className="om-eyebrow" style={{ marginBottom: 6 }}>Tentative, not counted</div>
                {p.tentItems.map(c => <div key={c.id} className="om-row om-small" style={{ padding: "4px 0" }}><Dot tone="neutral" /><span className="om-muted">{c.label}</span><RefLink om={om} r={c.ref} /><span className="om-mono" style={{ marginLeft: "auto" }}>{num(c.m2)} m²</span></div>)}
              </div>
            )}
            {p.plant === "Lound" && p.firmItems.some(c => c.ref.id === "ORD-26-125") && (
              <div className="om-small om-muted" style={{ marginTop: 10 }}>Kier Westbridge Hospital {num(p.firmItems.filter(c => c.ref.id === "ORD-26-125").reduce((t, c) => t + c.m2, 0))} m² is already inside Lound's {num(p.firm)} m². It is not added on top.</div>
            )}
          </Card>
        ))}
        <Card span={12} title="Overload watch" sub="Where tentative demand would break capacity if it were firmed up">
          {firmOver.length > 0 && <Banner tone="bad">Firm overload: {firmOver.map(f => f.plant + " " + weekLabel(f.week)).join(", ")}.</Banner>}
          {warnings.length ? (
            <Table rowKey={w => w.week + w.plant} rows={warnings} cols={[
              { k: "w", label: "Week", render: w => weekLabel(w.week) },
              { k: "p", label: "Plant", render: w => <span className="ink">{w.plant}</span> },
              { k: "f", label: "Firm", align: "right", render: w => m2(w.firm), cls: "mono" },
              { k: "t", label: "Tentative", align: "right", render: w => m2(w.tent), cls: "mono" },
              { k: "c", label: "Capacity", align: "right", render: w => m2(w.cap), cls: "mono" },
              { k: "o", label: "If firmed", render: w => <Badge tone="warn">{num(w.over)} m² over</Badge> },
            ]} />
          ) : <Empty title="No week would overload" hint="Even if every tentative commitment became firm." />}
        </Card>
      </Grid>
    </>
  );
}

/* ── 2. Scenarios (local only) ─────────────────────────────────────────── */
function Scenarios({ om }: { om: Om }) {
  const s = om.s;
  const enq = byId(s.enquiries, "INQ-26-097");
  const q = enq ? byId(s.quotes, enq.quoteId) : undefined;
  const tenderM2 = enq?.m2 || 0;
  const [win, setWin] = useState(false);
  const [alloc, setAlloc] = useState<"lound" | "brandon" | "split">("lound");
  const [moveId, setMoveId] = useState<string>("");
  const base = capacityWeek(s, WEEK);
  const brandonFirm = base.plants[0].firmItems;
  const splitL = Math.round(tenderM2 * 0.6 / 100) * 100;
  const sc: Scenario = {
    addLound: win ? (alloc === "lound" ? tenderM2 : alloc === "split" ? splitL : 0) : 0,
    addBrandon: win ? (alloc === "brandon" ? tenderM2 : alloc === "split" ? tenderM2 - splitL : 0) : 0,
    move: moveId ? { id: moveId, to: "Lound" } : undefined,
  };
  const after = capacityWeek(s, WEEK, sc);
  const active = win || !!moveId;
  const moved = brandonFirm.find(c => c.id === moveId);
  const consequences: { tone: "bad" | "warn" | "ok"; text: string }[] = [];
  after.plants.forEach((p, i) => {
    const b = base.plants[i];
    if (p.hypo !== b.hypo) consequences.push({ tone: p.over > 0 ? "bad" : p.pct > 0.9 ? "warn" : "ok", text: p.plant + " moves from " + num(b.hypo) + " to " + num(p.hypo) + " m² (" + pct(p.pct, 1) + ")" + (p.over > 0 ? ": " + num(p.over) + " m² overload" : ", " + num(p.free) + " m² free") });
  });
  if (win && q) consequences.push({ tone: "warn", text: "Quote " + q.id + " is " + q.status.toLowerCase() + " at " + pct(q.probability) + " likelihood. A weighted tender (" + num(tenderM2 * q.probability) + " m² equivalent) is not a plant booking." });
  if (moved) consequences.push({ tone: "warn", text: moved.label + " (" + num(moved.m2) + " m²) would need its lots re-planned at Lound and haulage re-quoted from Retford." });
  if (after.plants.some(p => p.over > 0)) consequences.push({ tone: "bad", text: "Options: split the job across both plants, move the start to " + weekLabel(WEEKS[1]) + ", or move another slot from Lound to Brandon." });
  const reset = () => { setWin(false); setAlloc("lound"); setMoveId(""); };

  return (
    <>
      <Banner tone="warn"><b>Simulation only.</b> No iThesis writeback; only human planners commit schedules. Nothing on this tab changes the shared plan.</Banner>
      <Grid style={{ marginTop: 14 }}>
        <Card span={6} title="What if we win this secured job?" sub={enq ? enq.id + " · " + (byId(s.accounts, enq.accountId)?.name) + " · " + byId(s.devs, enq.devId)?.name : ""}>
          <Facts items={[["Contractor status", enq?.contractorStatus || "—"], ["Our quote", q ? q.status : "—"], ["Hollowcore", m2(tenderM2)], ["Week", weekLabel(WEEK)]]} />
          <div className="om-row" style={{ marginTop: 14, flexWrap: "wrap" }}>
            <Btn kind={win ? undefined : "primary"} onClick={() => setWin(!win)}>{win ? "Remove this win" : "Simulate winning it"}</Btn>
            {win && <Seg options={[["lound", "All at Lound"], ["split", "Split " + num(splitL) + " / " + num(tenderM2 - splitL)], ["brandon", "All at Brandon"]]} value={alloc} onChange={setAlloc} />}
          </div>
        </Card>
        <Card span={6} title="Move a production slot Brandon → Lound" sub="Pick a firm Brandon commitment for the week of 09 Nov">
          <Field label="Commitment to move">
            <select className="om-input" value={moveId} onChange={e => setMoveId(e.target.value)}>
              <option value="">No move</option>
              {brandonFirm.map(c => <option key={c.id} value={c.id}>{c.label} · {num(c.m2)} m²</option>)}
            </select>
          </Field>
          <div className="om-row" style={{ marginTop: 14 }}><Btn onClick={reset} disabled={!active}>Reset scenario</Btn><span className="om-faint om-small">Original plan stays unchanged.</span></div>
        </Card>
        <Card span={7} title="Before and after" sub={weekLabel(WEEK) + " · hollowcore m²"}>
          {after.plants.map((p, i) => {
            const b = base.plants[i];
            return (
              <div key={p.plant} style={{ marginBottom: 16 }}>
                <div className="om-row"><b style={{ fontSize: 13 }}>{p.plant}</b><span className="om-faint om-small">capacity {num(p.cap)} m²</span>{p.over > 0 && <span style={{ marginLeft: "auto" }}><Badge tone="bad">{num(p.over)} m² overload</Badge></span>}</div>
                <div className="om-small om-muted" style={{ margin: "8px 0 4px" }}>Before · {num(b.hypo)} m² ({pct(b.pct, 1)})</div>
                <Stack cap={b.cap} firm={b.firm} />
                <div className="om-small om-muted" style={{ margin: "10px 0 4px" }}>After · {num(p.hypo)} m² ({pct(p.pct, 1)})</div>
                <Stack cap={p.cap} firm={p.firm} add={p.add} />
              </div>
            );
          })}
          <div className="om-row om-small om-faint" style={{ gap: 14, flexWrap: "wrap" }}><span className="om-row" style={{ gap: 6 }}><Dot tone="accent" />Firm</span><span className="om-row" style={{ gap: 6 }}><Dot tone="warn" />Hypothetical</span><span>Line marks capacity</span></div>
        </Card>
        <Card span={5} title="Consequences" sub={active ? "Simulated" : "Choose a scenario"}>
          {consequences.length ? consequences.map((c, i) => <div key={i} className="om-row om-small" style={{ alignItems: "flex-start", padding: "6px 0", borderTop: i ? "1px solid var(--border)" : 0 }}><Dot tone={c.tone} /><span>{c.text}</span></div>)
            : <Empty title="No scenario applied" hint="Simulate the Cambridge win or move a slot to see the effect." />}
          <div className="om-divider" />
          <Facts items={[["Combined after", m2(after.hypo) + " / " + m2(after.cap)], ["Free after", m2(after.free)]]} />
        </Card>
      </Grid>
    </>
  );
}

/* ── 3. Production (read-only iThesis snapshot) ─────────────────────────── */
function Production({ om }: { om: Om }) {
  const s = om.s;
  const [plant, setPlant] = useUi<string>(om, "plants:prodPlant", "All");
  const lots = s.lots.filter(l => plant === "All" || l.plant === plant).slice().sort((a, b) => a.planned.localeCompare(b.planned));
  const ready = (l: Lot) => {
    const load = s.loads.find(x => x.lotIds.includes(l.id));
    if (l.yard === "Delivered" || l.yard === "Dispatched") return <Badge tone="ok">{l.yard}</Badge>;
    if (l.status !== "Complete") return <Badge tone="draft">Not cast yet</Badge>;
    if (l.qa !== "Released") return <Badge tone="warn">Waiting on QA</Badge>;
    return <Badge tone="info">{load ? "Ready for " + load.id : "Ready to load"}</Badge>;
  };
  const synced = s.lots.reduce((m, l) => (l.synced > m ? l.synced : m), "");
  return (
    <Grid>
      <div className="om-s-12 om-kpis">
        <Kpi label="Lots in snapshot" value={s.lots.length} sub="both plants" />
        <Kpi label="Casting or scheduled" value={s.lots.filter(l => l.status === "Casting" || l.status === "Scheduled").length} />
        <Kpi label="Cast late" value={s.lots.filter(l => l.actual && daysBetween(l.planned, l.actual) > 0).length} sub="actual after planned" tone="warn" />
        <Kpi label="Ready to dispatch" value={s.lots.filter(l => l.status === "Complete" && l.qa === "Released" && !/Delivered|Dispatched/.test(l.yard)).length} tone="ok" />
      </div>
      <Card span={12} flush title="Production schedule" sub={"iThesis (illustrative) · read-only · last mock sync " + stamp(synced)}
        right={<><Seg options={["All", "Brandon", "Lound"]} value={plant} onChange={setPlant} /><LineageChip l={{ source: "iThesis (illustrative)", updated: synced, state: "Read-only snapshot. No writeback from Pulse" }} /></>}>
        <Table<Lot> rowKey={l => l.id} rows={lots} onRow={l => om.open({ kind: "lot", id: l.id })} cols={[
          { k: "id", label: "Lot", render: l => <span className="mono ink">{l.id}</span> },
          { k: "o", label: "Project", render: l => { const o = byId(s.orders, l.orderId); return o ? orderLabel(s, o) : l.orderId; } },
          { k: "p", label: "Plant", render: l => l.plant },
          { k: "pr", label: "Product", render: l => l.product },
          { k: "u", label: "Units / m²", align: "right", render: l => l.units + (l.m2 ? " · " + num(l.m2) + " m²" : ""), cls: "mono" },
          { k: "pl", label: "Planned cast", render: l => dateShort(l.planned), cls: "mono" },
          { k: "a", label: "Actual", render: l => l.actual ? dateShort(l.actual) : "—", cls: "mono" },
          { k: "v", label: "Variance", render: l => { if (!l.actual) return <span className="om-faint">{daysBetween(TODAY, l.planned) >= 0 ? "Upcoming" : "Open"}</span>; const d = daysBetween(l.planned, l.actual); return <span style={{ color: d > 0 ? "var(--warn)" : "var(--ok)" }} className="om-mono">{d > 0 ? "+" + d + "d" : "On plan"}</span>; } },
          { k: "s", label: "Status", render: l => <Badge>{l.status}</Badge> },
          { k: "r", label: "Dispatch readiness", render: ready },
        ]} />
      </Card>
    </Grid>
  );
}

/* ── 4. Design handoffs ─────────────────────────────────────────────────── */
function Design({ om }: { om: Om }) {
  const s = om.s;
  const order = ["Awaiting client approval", "Awaiting information", "In design", "Released for production"];
  const list = s.designs.slice().sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
  const [sel, setSel] = useUi<string>(om, "sel:Plants & Planning:design", list[0]?.id || "");
  const d = byId(s.designs, sel) || list[0];
  const [confirm, setConfirm] = useState(false);
  const o = d ? byId(s.orders, d.orderId) : undefined;
  const rf = d ? rfisFor(s, d.orderId) : [];
  const blk = d ? blockingOpen(s, d.orderId) : [];
  return (
    <Grid>
      <Card span={7} flush title="Design packages" sub="Mock iThesis references. Design and engineering stay in iThesis.">
        <Table<DesignPackage> rowKey={x => x.id} rows={list} selKey={d?.id} onRow={x => setSel(x.id)} cols={[
          { k: "id", label: "Package", render: x => <span className="mono ink">{x.id}</span> },
          { k: "r", label: "Rev", render: x => x.revision, cls: "mono" },
          { k: "o", label: "Project", render: x => { const oo = byId(s.orders, x.orderId); return oo ? orderLabel(s, oo) : ""; } },
          { k: "s", label: "Status", render: x => <Badge>{x.status}</Badge> },
          { k: "t", label: "Target", render: x => dateShort(x.target), cls: "mono" },
          { k: "g", label: "Production gate", render: x => x.released ? <Badge tone="ok">Released</Badge> : <Badge tone="bad">Not released</Badge> },
        ]} />
      </Card>
      {d && o && (
        <Card span={5} title={d.id + " " + d.revision} sub={orderLabel(s, o)} right={<LineageChip l={{ source: "iThesis (illustrative)", updated: d.synced, state: "Read-only snapshot. iThesis is authoritative" }} />}>
          <div className="om-row" style={{ flexWrap: "wrap", marginBottom: 12 }}><Badge>{d.status}</Badge>{d.released ? <Badge tone="ok">Released for production</Badge> : <Badge tone="bad">Production not released</Badge>}</div>
          <Facts items={[["Order", <RefLink om={om} r={{ kind: "order", id: o.id }} />], ["Review target", dateUK(d.target)], ["Coordinator", d.coordinator], ["Last mock sync", stamp(d.synced)]]} />
          <div className="om-eyebrow" style={{ margin: "16px 0 8px" }}>Revision history</div>
          {d.revisions.slice().reverse().map(r => <div key={r.rev + r.at} className="om-small" style={{ padding: "4px 0" }}><span className="om-mono om-ink">{r.rev}</span> <span className="om-faint">{dateShort(r.at)}</span> · {r.note}</div>)}
          {d.missing.length > 0 && (<><div className="om-eyebrow" style={{ margin: "16px 0 8px" }}>Missing details</div>{d.missing.map(m => <div key={m} className="om-row om-small" style={{ padding: "3px 0", color: "var(--bad)" }}><Dot tone="bad" />{m}</div>)}</>)}
          <div className="om-eyebrow" style={{ margin: "16px 0 8px" }}>Linked client RFIs</div>
          {rf.length ? rf.map(r => <div key={r.id} className="om-row om-small" style={{ padding: "4px 0" }}><RefLink om={om} r={{ kind: "rfi", id: r.id }} /><span className="om-muted" style={{ flex: 1, minWidth: 0 }}>{r.question}</span>{r.blocking && r.status !== "Resolved" && <Badge tone="bad">Blocking</Badge>}<Badge>{r.status}</Badge></div>) : <div className="om-faint om-small">No RFIs on this order.</div>}
          <div className="om-divider" />
          {d.status === "Awaiting client approval" && <><Btn kind="primary" onClick={() => setConfirm(true)}>Record client approval and planner release</Btn><div className="om-faint om-tiny" style={{ marginTop: 8 }}>Human sign-off only. AI never approves structural design.</div></>}
          {d.status === "Awaiting information" && <><Btn kind="primary" onClick={() => om.go("Projects", "rfis", o.id)}>Open RFIs in Projects →</Btn><div className="om-faint om-tiny" style={{ marginTop: 8 }}>{blk.length ? blk.length + " blocking RFI" + (blk.length > 1 ? "s" : "") + " must be answered before design can start." : "Information complete. Hand over from Projects."}</div></>}
          {d.released && <div className="om-small om-muted">Released. Lots are scheduled in iThesis; see the Production tab.</div>}
        </Card>
      )}
      {confirm && d && (
        <Modal title={"Record approval of " + d.id + " " + d.revision} sub={o ? orderLabel(s, o) : ""} onClose={() => setConfirm(false)}
          footer={<><Btn onClick={() => setConfirm(false)}>Cancel</Btn><Btn kind="primary" onClick={() => { om.do.recordClientApproval(d.id); setConfirm(false); om.toast(d.id + " released for production. Logged to Activity."); }}>Confirm human sign-off</Btn></>}>
          <p className="om-small" style={{ lineHeight: 1.6, margin: 0 }}>You are recording two human decisions: the client has approved revision {d.revision}, and the production planner releases it for production. Pulse logs who confirmed and when. iThesis remains the schedule of record and is not written to in this demo.</p>
        </Modal>
      )}
    </Grid>
  );
}

/* ── 5. Quality & Yard ─────────────────────────────────────────────────── */
function Quality({ om }: { om: Om }) {
  const s = om.s;
  const rank = (l: Lot) => (l.qa === "Inspection pending" ? 0 : l.qa === "On hold" ? 1 : l.qa === "Not started" ? 2 : 3);
  const lots = s.lots.slice().sort((a, b) => rank(a) - rank(b));
  const [sel, setSel] = useUi<string>(om, "sel:Plants & Planning:quality", lots[0]?.id || "");
  const l = byId(s.lots, sel) || lots[0];
  const [note, setNote] = useState("");
  const loads = l ? s.loads.filter(x => x.lotIds.includes(l.id)) : [];
  return (
    <Grid>
      <div className="om-s-12"><Banner>Human inspection sign-off required. Evidence shown is demo data.</Banner></div>
      <div className="om-s-12 om-kpis">
        <Kpi label="Awaiting inspection" value={s.lots.filter(x => x.qa === "Inspection pending").length} tone="warn" />
        <Kpi label="On hold" value={s.lots.filter(x => x.qa === "On hold").length} tone="bad" />
        <Kpi label="Released in yard" value={s.lots.filter(x => x.qa === "Released" && /Yard/.test(x.yard)).length} tone="ok" />
        <Kpi label="Delivered / dispatched" value={s.lots.filter(x => /Delivered|Dispatched/.test(x.yard)).length} />
      </div>
      <Card span={7} flush title="Lots, QA and yard">
        <Table<Lot> rowKey={x => x.id} rows={lots} selKey={l?.id} onRow={x => setSel(x.id)} cols={[
          { k: "id", label: "Lot", render: x => <span className="mono ink">{x.id}</span> },
          { k: "p", label: "Plant", render: x => x.plant },
          { k: "pr", label: "Product", render: x => x.product + " · " + x.units },
          { k: "y", label: "Yard / staging", render: x => x.yard },
          { k: "q", label: "QA", render: x => <Badge>{x.qa}</Badge> },
          { k: "l", label: "Load", render: x => { const ld = s.loads.find(y => y.lotIds.includes(x.id)); return ld ? <RefLink om={om} r={{ kind: "load", id: ld.id }} /> : <span className="om-faint">—</span>; } },
        ]} />
      </Card>
      {l && (
        <Card span={5} title={l.id} sub={(byId(s.orders, l.orderId) ? orderLabel(s, byId(s.orders, l.orderId)!) : "") + " · " + l.plant} right={<Badge>{l.qa}</Badge>}>
          <Facts items={[["Product", l.product], ["Units", l.units], ["Area", l.m2 ? m2(l.m2) : "n/a"], ["Production", l.status], ["Yard", l.yard], ["Inspector", l.inspector]]} />
          <p className="om-small om-muted" style={{ marginTop: 12 }}>{l.note}</p>
          {loads.map(ld => (
            <div key={ld.id} className={"om-banner" + (l.qa !== "Released" && ld.status === "Planned" ? " warn" : "")} style={{ marginTop: 8 }}>
              <span><RefLink om={om} r={{ kind: "load", id: ld.id }} /> collects {stamp(ld.collect)} · {ld.status}{l.qa !== "Released" && ld.status === "Planned" ? ". Needs this sign-off before collection." : ""}</span>
            </div>
          ))}
          <div className="om-divider" />
          {l.qa === "Released" ? <div className="om-small om-muted">Released. No action needed.</div> : l.status !== "Complete" ? <div className="om-small om-muted">Not cast yet. Inspection opens once iThesis reports the lot complete.</div> : (
            <div className="om-col">
              <Btn kind="primary" onClick={() => { om.do.qaRelease(l.id); om.toast(l.id + " signed off. Load can be collected."); }}>{l.qa === "On hold" ? "Release after repair" : "Sign off inspection"}</Btn>
              {l.qa !== "On hold" && (
                <>
                  <Field label="Or place on hold"><input className="om-input" value={note} onChange={e => setNote(e.target.value)} placeholder="Reason, for example cracked soffit on unit 12" /></Field>
                  <Btn kind="danger" disabled={!note.trim()} onClick={() => { om.do.qaHold(l.id, note.trim()); setNote(""); om.toast(l.id + " placed on hold."); }}>Place on hold</Btn>
                </>
              )}
            </div>
          )}
        </Card>
      )}
    </Grid>
  );
}

/* ── 6. Plant performance ──────────────────────────────────────────────── */
function Performance({ om }: { om: Om }) {
  const s = om.s;
  const weeks = WEEKS.map(w => capacityWeek(s, w));
  const plants = ["Brandon", "Lound"] as const;
  const mixColors = ["var(--accent)", "#8cbcec", "var(--warn)", "var(--ok)", "#b9a0e8", "var(--neutral)"];
  const products = Array.from(new Set(s.lots.map(l => l.product)));
  const backlog = (p: string) => s.commitments.filter(c => c.plant === p && c.firm && c.week > WEEK).reduce((t, c) => t + c.m2, 0);
  const late = (p: string) => s.lots.filter(l => l.plant === p && l.actual && daysBetween(l.planned, l.actual) > 0).length;
  const delays = [
    ...s.designs.filter(d => !d.released).map(d => ({ id: d.id, what: "Design " + d.revision + " " + d.status.toLowerCase(), since: d.revisions.slice(-1)[0]?.at || TODAY, ref: { kind: "design" as const, id: d.id } })),
    ...s.lots.filter(l => l.qa === "Inspection pending" || l.qa === "On hold").map(l => ({ id: l.id, what: "QA " + l.qa.toLowerCase() + " at " + l.plant, since: l.actual || l.planned, ref: { kind: "lot" as const, id: l.id } })),
  ].map(x => ({ ...x, days: daysBetween(x.since, TODAY) })).sort((a, b) => b.days - a.days);
  return (
    <Grid>
      {plants.map((p, i) => {
        const lots = s.lots.filter(l => l.plant === p);
        const mix = products.map(pr => ({ pr, n: lots.filter(l => l.product === pr).reduce((t, l) => t + l.units, 0) })).filter(x => x.n > 0);
        const tot = mix.reduce((t, x) => t + x.n, 0) || 1;
        return (
          <Card key={p} span={6} className="om-s-keep" title={p} sub="Product mix from the lot snapshot (units)">
            <div className="om-mix">{mix.map(x => <span key={x.pr} style={{ width: (x.n / tot) * 100 + "%", background: mixColors[products.indexOf(x.pr) % mixColors.length] }} title={x.pr + ": " + x.n} />)}</div>
            <div className="om-row om-small" style={{ flexWrap: "wrap", gap: 12, marginTop: 8 }}>{mix.map(x => <span key={x.pr} className="om-row" style={{ gap: 6 }}><span className="om-dot" style={{ marginTop: 0, background: mixColors[products.indexOf(x.pr) % mixColors.length] }} />{x.pr} {Math.round((x.n / tot) * 100)}%</span>)}</div>
            <div className="om-eyebrow" style={{ margin: "16px 0 8px" }}>Hollowcore utilisation by week (firm)</div>
            <div className="om-vbar">
              {weeks.map(w => { const pl = w.plants[i]; return (
                <div key={w.week} title={weekLabel(w.week) + ": " + num(pl.firm) + " of " + num(pl.cap) + " m²"}>
                  <span className="om-mono om-tiny om-muted">{pct(pl.pct)}</span>
                  <div className="col" style={{ height: Math.max(4, pl.pct * 100) + "%", background: loadColor(pl.pct) }} />
                  <span className="lbl">{dateShort(w.week)}</span>
                </div>); })}
            </div>
            <div className="om-kpis" style={{ marginTop: 14 }}>
              <Kpi label="Firm backlog after this week" value={m2(backlog(p))} />
              <Kpi label="Lots cast late" value={late(p)} sub="in current snapshot" tone={late(p) ? "warn" : "ok"} />
            </div>
          </Card>
        );
      })}
      <Card span={7} flush title="Handoff delays" sub="Open design and QA handoffs, oldest first">
        <Table rowKey={x => x.id} rows={delays} onRow={x => om.open(x.ref)} cols={[
          { k: "id", label: "Record", render: x => <span className="mono ink">{x.id}</span> },
          { k: "w", label: "Waiting on", render: x => x.what },
          { k: "s", label: "Since", render: x => dateShort(x.since), cls: "mono" },
          { k: "d", label: "Days", align: "right", render: x => <span style={{ color: x.days > 7 ? "var(--warn)" : undefined }}>{x.days}</span>, cls: "mono" },
        ]} />
      </Card>
      <Card span={5} title="On-plan casting" sub="Mock trend, illustrative only">
        {plants.map(p => { const vals = p === "Brandon" ? [0.86, 0.9, 0.88, 0.92, 0.89, 0.91] : [0.9, 0.87, 0.93, 0.91, 0.94, 0.92]; return (
          <div key={p} style={{ marginBottom: 12 }}>
            <div className="om-row om-small"><b>{p}</b><span className="om-faint" style={{ marginLeft: "auto" }}>last 6 weeks (mock)</span></div>
            <div className="om-vbar" style={{ height: 70, marginTop: 6 }}>{vals.map((v, k) => <div key={k}><div className="col" style={{ height: v * 100 + "%", background: k === vals.length - 1 ? "var(--accent)" : "var(--neutral)" }} /></div>)}</div>
          </div>); })}
        <div className="om-faint om-tiny">Mock trend for layout only. Real figures would come from iThesis production actuals.</div>
      </Card>
    </Grid>
  );
}

const SUBS: Record<string, [string, string]> = {
  capacity: ["Capacity", "Two-site hollowcore board for Brandon and Lound. Firm commitments only; tentative demand stays visible but uncounted."],
  scenarios: ["Scenarios", "Try a win or a slot move before anyone commits. Nothing here touches the plan."],
  production: ["Production visibility", "Read-only iThesis snapshot of planned casts, actuals and dispatch readiness."],
  design: ["Design handoffs", "iThesis design packages, revisions and the release-for-production gate, linked to client RFIs."],
  quality: ["Quality & yard", "QA status, yard location and release controls. Every release is a person's decision."],
  performance: ["Plant performance", "Brandon and Lound side by side: mix, utilisation, backlog and handoff delays."],
};

export default function Plants({ om }: { om: Om }) {
  const [title, sub] = SUBS[om.sub] || SUBS.capacity;
  return (
    <Page>
      <Head eyebrow="Plants & Planning · Brandon (Weeting, Norfolk) · Lound (Retford, Notts)" title={title} sub={sub} />
      {om.sub === "scenarios" ? <Scenarios om={om} /> : om.sub === "production" ? <Production om={om} /> : om.sub === "design" ? <Design om={om} />
        : om.sub === "quality" ? <Quality om={om} /> : om.sub === "performance" ? <Performance om={om} /> : <Capacity om={om} />}
    </Page>
  );
}
