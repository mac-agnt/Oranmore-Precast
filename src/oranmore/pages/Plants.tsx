/* Plants & Planning: Brandon and Lound. iThesis stays the schedule of record;
   everything here is a read-only snapshot, a human sign-off, or a local simulation. */
import { useState } from "react";
import "../../styles/om-ops.css";
import type { Om } from "../ui";
import { Page, Head, Grid, Card, Badge, Btn, Seg, Kpi, Bar, Table, Facts, RefLink, LineageChip, Modal, Field, Empty, useUi, Dot } from "../ui";
import type { Commitment, Lot, DesignPackage, Product } from "../types";
import { HOLLOWCORE_CAPACITY, OTHER_LINES, WEEKS, WEEK } from "../fixtures";
import { capacityWeek, orderLabel, byId, rfisFor, blockingOpen, TODAY, yardStock, type Scenario } from "../selectors";
import { ConstraintBoard } from "../Constraints";
import { m2, num, pct, dateShort, dateUK, stamp, weekLabel, daysBetween, gbpShort } from "../format";

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
type Alloc = "lound" | "brandon" | "split";
const ALLOC_LABEL: Record<Alloc, string> = { lound: "All at Lound", brandon: "All at Brandon", split: "Split 60 / 40" };
function Scenarios({ om }: { om: Om }) {
  const s = om.s;
  const tenders = s.enquiries.filter(e => e.m2 && e.products.includes("Hollowcore")).map(e => ({ e, q: byId(s.quotes, e.quoteId)! })).filter(x => x.q && x.q.status !== "Won" && x.q.status !== "Lost");
  const [tenderId, setTenderId] = useState<string>(tenders.find(x => x.e.id === "INQ-26-097") ? "INQ-26-097" : tenders[0]?.e.id || "custom");
  const [custom, setCustom] = useState(2000);
  const [win, setWin] = useState(false);
  const [alloc, setAlloc] = useState<Alloc>("lound");
  const [start, setStart] = useState<string>(WEEK);
  const [spread, setSpread] = useState<"1" | "2" | "3">("1");
  const [moveId, setMoveId] = useState<string>("");
  const t = tenders.find(x => x.e.id === tenderId);
  const tenderM2 = t ? t.e.m2 || 0 : custom;
  const n = Number(spread);
  const si = WEEKS.indexOf(start);
  const runWeeks = WEEKS.slice(si, si + n);
  const perWeek = runWeeks.length ? Math.round(tenderM2 / runWeeks.length) : 0;
  const split = (a: Alloc, m: number) => (a === "lound" ? { addLound: m, addBrandon: 0 } : a === "brandon" ? { addLound: 0, addBrandon: m } : { addLound: Math.round(m * 0.6 / 10) * 10, addBrandon: m - Math.round(m * 0.6 / 10) * 10 });
  const scFor = (w: string, a: Alloc): Scenario => ({ ...(win && runWeeks.includes(w) ? split(a, perWeek) : {}), move: moveId && w === WEEK ? { id: moveId, to: "Lound" } : undefined });
  const table = (a: Alloc) => WEEKS.map(w => ({ week: w, before: capacityWeek(s, w), after: capacityWeek(s, w, scFor(w, a)) }));
  const rows = table(alloc);
  const peakOf = (rs: typeof rows) => Math.max(...rs.flatMap(r => r.after.plants.map(p => p.pct)));
  const overOf = (rs: typeof rows) => rs.reduce((tt, r) => tt + r.after.plants.reduce((x, p) => x + p.over, 0), 0);
  const options = (["lound", "split", "brandon"] as Alloc[]).map(a => { const rs = table(a); return { a, over: overOf(rs), peak: peakOf(rs) }; }).sort((x, y) => x.over - y.over || x.peak - y.peak);
  const best = options[0];
  const over = overOf(rows), peak = peakOf(rows);
  const weeksOver = rows.filter(r => r.after.plants.some(p => p.over > 0));
  const brandonFirm = capacityWeek(s, WEEK).plants[0].firmItems;
  const moved = brandonFirm.find(c => c.id === moveId);
  const loadM2 = (() => { const xs = s.loads.map(l => s.lots.filter(x => l.lotIds.includes(x.id) && x.product === "Hollowcore").reduce((tt, x) => tt + x.m2, 0)).filter(x => x > 0); return xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 600; })();
  const loadsNeeded = Math.ceil(tenderM2 / loadM2);
  const active = win || !!moveId;
  const consequences: { tone: "bad" | "warn" | "ok"; text: string }[] = [];
  if (win) {
    consequences.push({ tone: over ? "bad" : peak > 0.9 ? "warn" : "ok", text: over ? num(over) + " m² would not fit across " + weeksOver.length + " week" + (weeksOver.length === 1 ? "" : "s") + " (" + weeksOver.map(r => dateShort(r.week)).join(", ") + ")." : "Fits. Peak plant load " + pct(peak, 1) + "." });
    consequences.push({ tone: Math.ceil(loadsNeeded / n) > 4 ? "warn" : "ok", text: "About " + loadsNeeded + " loads at " + num(loadM2) + " m² each, " + Math.ceil(loadsNeeded / n) + " per week of haulage to book." });
    if (t) consequences.push({ tone: "warn", text: t.q.id + " is " + t.q.status.toLowerCase() + " at " + pct(t.q.probability) + " likelihood (" + gbpShort(t.q.value) + " indicative). A weighted tender is not a plant booking." });
    if (best.a !== alloc) consequences.push({ tone: "warn", text: ALLOC_LABEL[best.a] + " fits better: " + (best.over ? num(best.over) + " m² over" : "no overload") + ", peak " + pct(best.peak, 1) + "." });
  }
  if (moved) consequences.push({ tone: "warn", text: moved.label + " (" + num(moved.m2) + " m²) would need its lots re-planned at Lound and haulage re-quoted from Retford." });
  if (over && n < 3) consequences.push({ tone: "bad", text: "Options: spread over " + (n + 1) + " weeks, start " + weekLabel(WEEKS[Math.min(WEEKS.length - 1, si + 1)]) + ", or move another slot." });
  const reset = () => { setWin(false); setAlloc("lound"); setMoveId(""); setSpread("1"); setStart(WEEK); };
  const cell = (b: number, a: number, cap: number) => {
    const pb = b / cap, pa = a / cap;
    return <span className="om-mono" style={{ color: pa > 1 ? "var(--bad)" : pa > 0.9 ? "var(--warn)" : undefined }}>{a !== b ? <><span className="om-faint">{pct(pb)} → </span>{pct(pa)}</> : pct(pa)}</span>;
  };

  return (
    <>
      <Banner tone="warn"><b>Simulation only.</b> No iThesis writeback; only human planners commit schedules. Nothing on this tab changes the shared plan.</Banner>
      <Grid style={{ marginTop: 14 }}>
        <Card span={12} title="Scenario setup" sub="Pick a tender, when it would cast and where. Every number below recalculates.">
          <div className="om-scn">
            <Field label="Tender">
              <select className="om-input" value={tenderId} onChange={e => setTenderId(e.target.value)}>
                {tenders.map(x => <option key={x.e.id} value={x.e.id}>{x.e.id} · {byId(s.accounts, x.e.accountId)?.name} · {byId(s.devs, x.e.devId)?.name} ({num(x.e.m2 || 0)} m²)</option>)}
                <option value="custom">Custom tender…</option>
              </select>
            </Field>
            {tenderId === "custom" && <Field label="Hollowcore m²"><input className="om-input" type="number" min={100} step={100} value={custom} onChange={e => setCustom(Math.max(0, Number(e.target.value) || 0))} /></Field>}
            <Field label="Start week">
              <select className="om-input" value={start} onChange={e => setStart(e.target.value)}>{WEEKS.slice(0, 5).map(w => <option key={w} value={w}>{weekLabel(w)}</option>)}</select>
            </Field>
            <Field label="Cast over"><Seg options={[["1", "1 week"], ["2", "2 weeks"], ["3", "3 weeks"]]} value={spread} onChange={setSpread} /></Field>
            <Field label="Plant"><Seg options={(["lound", "split", "brandon"] as Alloc[]).map(a => [a, ALLOC_LABEL[a]] as [Alloc, string])} value={alloc} onChange={setAlloc} /></Field>
          </div>
          <div className="om-row" style={{ marginTop: 16, flexWrap: "wrap", gap: 10 }}>
            <Btn kind={win ? undefined : "primary"} onClick={() => setWin(!win)}>{win ? "Remove this win" : "Simulate winning it"}</Btn>
            {win && best.a !== alloc && <Btn onClick={() => setAlloc(best.a)}>Use best fit: {ALLOC_LABEL[best.a]}</Btn>}
            <Btn onClick={reset} disabled={!active}>Reset</Btn>
            {t && <span className="om-faint om-small">Contractor {t.e.contractorStatus.toLowerCase()} · quote {t.q.status.toLowerCase()} · <RefLink om={om} r={{ kind: "enquiry", id: t.e.id }} /></span>}
          </div>
        </Card>
        <div className="om-s-12 om-kpis">
          <Kpi label="Tender hollowcore" value={m2(tenderM2)} sub={win ? num(perWeek) + " m² a week for " + n + " week" + (n > 1 ? "s" : "") : "not applied"} />
          <Kpi label="Indicative value" value={t ? gbpShort(t.q.value) : "·"} sub={t ? "weighted " + gbpShort(t.q.value * t.q.probability) : "custom tender"} />
          <Kpi label="Loads to haul" value={loadsNeeded} sub={"at ~" + num(loadM2) + " m² per load"} />
          <Kpi label="Peak plant load" value={pct(peak, 1)} sub="busiest plant-week after" tone={peak > 1 ? "bad" : peak > 0.9 ? "warn" : "ok"} />
          <Kpi label="Overload" value={over ? m2(over) : "None"} sub={weeksOver.length + " week" + (weeksOver.length === 1 ? "" : "s") + " over capacity"} tone={over ? "bad" : "ok"} />
        </div>
        <Card span={7} flush title="Six weeks, before → after" sub="Hatched is the simulated win, the line is capacity · click a week to inspect it">
          <div className="vz-rows">
            {rows.map(r => {
              const over = r.after.plants.reduce((x, p) => x + p.over, 0);
              const tight = r.after.plants.some(p => p.pct > 0.9);
              return (
                <button key={r.week} className="vz-row" style={{ gridTemplateColumns: "92px minmax(0,1fr) minmax(0,1fr) 96px" }} onClick={() => WEEKS.indexOf(r.week) < 5 && setStart(r.week)}>
                  <span className="vz-name"><b>{dateShort(r.week)}</b><span>{runWeeks.includes(r.week) && win ? "casting" : num(r.after.free) + " m² free"}</span></span>
                  {r.after.plants.map((p, i) => (
                    <span key={p.plant} className="vz-meter">
                      <span className="lbl"><span>{p.plant}</span><span className="om-mono" style={{ color: p.pct > 1 ? "var(--bad)" : p.pct > 0.9 ? "var(--warn)" : "var(--ink)" }}>{p.hypo !== r.before.plants[i].hypo ? pct(r.before.plants[i].pct) + " → " : ""}{pct(p.pct)}</span></span>
                      <Stack cap={p.cap} firm={p.firm} add={p.add} />
                    </span>
                  ))}
                  <span className="vz-end">{over > 0 ? <Badge tone="bad">{num(over)} over</Badge> : tight ? <Badge tone="warn">Tight</Badge> : <Badge tone="ok">Fits</Badge>}</span>
                </button>
              );
            })}
          </div>
        </Card>
        <Card span={5} title="Consequences" sub={active ? "Simulated" : "Choose a scenario"}>
          {consequences.length ? consequences.map((c, i) => <div key={i} className="om-row om-small" style={{ alignItems: "flex-start", padding: "7px 0", borderTop: i ? "1px solid var(--border)" : 0 }}><Dot tone={c.tone} /><span>{c.text}</span></div>)
            : <Empty title="No scenario applied" hint="Simulate the win or move a slot to see the effect." />}
          <div className="om-divider" />
          <div className="om-label">Each option, same timing</div>
          {options.map(o => <button key={o.a} className="om-li" style={{ padding: "6px 0", width: "100%" }} onClick={() => setAlloc(o.a)}><span className="om-small om-ink" style={{ flex: 1, textAlign: "left" }}>{ALLOC_LABEL[o.a]}{o.a === best.a && <> <Badge tone="ok" dot={false}>Best fit</Badge></>}</span><span className="om-mono om-tiny" style={{ color: o.over ? "var(--bad)" : undefined }}>{o.over ? num(o.over) + " m² over" : "fits"} · peak {pct(o.peak)}</span></button>)}
        </Card>
        <Card span={7} title={"Start week in detail · " + weekLabel(start)} sub="Firm, plus the simulated win hatched. Line marks capacity.">
          {rows[si] && rows[si].after.plants.map((p, i) => {
            const b = rows[si].before.plants[i];
            return (
              <div key={p.plant} style={{ marginBottom: 16 }}>
                <div className="om-row"><b style={{ fontSize: 13 }}>{p.plant}</b><span className="om-faint om-small">capacity {num(p.cap)} m²</span><span className="om-mono om-small" style={{ marginLeft: "auto" }}>{num(b.hypo)} → {num(p.hypo)} m²</span>{p.over > 0 && <Badge tone="bad">{num(p.over)} over</Badge>}</div>
                <div style={{ marginTop: 8 }}><Stack cap={p.cap} firm={p.firm} add={p.add} tent={p.tentative} /></div>
              </div>
            );
          })}
          <div className="om-row om-small om-faint" style={{ gap: 14, flexWrap: "wrap" }}><span className="om-row" style={{ gap: 6 }}><Dot tone="accent" />Firm</span><span className="om-row" style={{ gap: 6 }}><Dot tone="warn" />Simulated win</span><span className="om-row" style={{ gap: 6 }}><Dot tone="neutral" />Tentative</span></div>
        </Card>
        <Card span={5} title="Move a production slot Brandon → Lound" sub={"Firm Brandon commitments, " + weekLabel(WEEK)}>
          <Field label="Commitment to move">
            <select className="om-input" value={moveId} onChange={e => setMoveId(e.target.value)}>
              <option value="">No move</option>
              {brandonFirm.map(c => <option key={c.id} value={c.id}>{c.label} · {num(c.m2)} m²</option>)}
            </select>
          </Field>
          <div className="om-faint om-small" style={{ marginTop: 10 }}>Original plan stays unchanged. Check the Constraints tab to see whether plant is the binding step before moving work.</div>
          <div style={{ marginTop: 10 }}><Btn sm onClick={() => om.setSub("constraints")}>Open constraints →</Btn></div>
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
        <Card span={5} className="om-sticky" title={d.id + " " + d.revision} sub={orderLabel(s, o)} right={<LineageChip l={{ source: "iThesis (illustrative)", updated: d.synced, state: "Read-only snapshot. iThesis is authoritative" }} />}>
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
  const y = yardStock(s);
  return (
    <Grid>
      <div className="om-s-12"><Banner>Human inspection sign-off required. Evidence shown is demo data.</Banner></div>
      <div className="om-s-12 om-kpis">
        <Kpi label="Awaiting inspection" value={s.lots.filter(x => x.qa === "Inspection pending").length} tone="warn" />
        <Kpi label="On hold" value={s.lots.filter(x => x.qa === "On hold").length} tone="bad" />
        <Kpi label="Released in yard" value={s.lots.filter(x => x.qa === "Released" && /Yard/.test(x.yard)).length} tone="ok" />
        <Kpi label="Delivered / dispatched" value={s.lots.filter(x => /Delivered|Dispatched/.test(x.yard)).length} />
        <Kpi label="Units in yard" value={y.units} sub={num(y.m2) + " m² hollowcore stock"} />
        <Kpi label="Avg days in yard" value={y.avgDays} sub={"oldest " + (y.aged[0] ? y.aged[0].days + "d, " + y.aged[0].l.id : "·")} tone={y.avgDays > 5 ? "warn" : undefined} />
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
        <div className="om-s-5 om-col om-sticky" style={{ gap: 14 }}>
        <Card title={l.id} sub={(byId(s.orders, l.orderId) ? orderLabel(s, byId(s.orders, l.orderId)!) : "") + " · " + l.plant} right={<Badge>{l.qa}</Badge>}>
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
        <Card title="Yard occupancy" sub="Units in each bay against what it holds (illustrative)">
          <div className="om-col" style={{ gap: 9 }}>
            {y.bays.map(b => (
              <button key={b.bay} className="fin-wk" onClick={() => b.lots[0] && setSel(b.lots[0].l.id)} title={b.lots.map(x => x.l.id).join(", ") || "Empty"}>
                <span className="om-ink" style={{ width: 118 }}>{b.bay.replace(" Yard", "")}</span>
                <span style={{ flex: 1 }}><Bar value={b.units} max={b.capacity} color={b.pct > 0.85 ? "var(--warn)" : undefined} height={6} /></span>
                <span className="om-mono om-tiny" style={{ width: 60, textAlign: "right" }}>{b.units}/{b.capacity}</span>
              </button>
            ))}
          </div>
        </Card>
        </div>
      )}
      <Card span={12} flush title="Stock in the yard, oldest first" sub="Cast units waiting to leave. Stock with no load booked, or not QA released, ties up bays and cash.">
        <Table rowKey={x => x.l.id} rows={y.aged} onRow={x => setSel(x.l.id)} cols={[
          { k: "id", label: "Lot", render: x => <span className="mono ink">{x.l.id}</span> },
          { k: "o", label: "Project", render: x => { const o = byId(s.orders, x.l.orderId); return o ? orderLabel(s, o) : x.l.orderId; } },
          { k: "b", label: "Bay", render: x => x.l.yard },
          { k: "p", label: "Product", render: x => x.l.product + " · " + x.l.units + " u" + (x.l.m2 ? " · " + num(x.l.m2) + " m²" : "") },
          { k: "d", label: "Days in yard", align: "right", cls: "mono", render: x => <span style={{ color: x.days > 5 ? "var(--warn)" : undefined }}>{x.days}</span> },
          { k: "q", label: "QA", render: x => <Badge>{x.l.qa}</Badge> },
          { k: "ld", label: "Leaves on", render: x => x.load ? <span className="om-row" style={{ gap: 6 }}><RefLink om={om} r={{ kind: "load", id: x.load.id }} /><span className="om-mono om-faint om-tiny">{stamp(x.load.collect)}</span></span> : <Badge tone="warn">No load booked</Badge> },
        ]} />
      </Card>
    </Grid>
  );
}

/* ── 6. Plant performance ──────────────────────────────────────────────── */
const ON_PLAN_MOCK: Record<string, number[]> = { Brandon: [0.86, 0.9, 0.88, 0.92, 0.89, 0.91], Lound: [0.9, 0.87, 0.93, 0.91, 0.94, 0.92] };
const PLACE: Record<string, string> = { Brandon: "Weeting, Norfolk", Lound: "Retford, Notts" };
type Better = "high" | "low" | null;
interface Duel { label: string; hint: string; b: number; l: number; fmt: (n: number) => string; better: Better; go: () => void }

/* One mirrored row: Brandon grows left, Lound grows right, the better side lights up. */
function DuelRow({ d }: { d: Duel }) {
  const max = Math.max(d.b, d.l, 0.0001);
  const win = d.better === null || d.b === d.l ? -1 : (d.better === "high") === (d.b > d.l) ? 0 : 1;
  return (
    <button className="pf-duel" onClick={d.go} title={d.hint}>
      <span className={"v" + (win === 0 ? " win" : "")}>{d.fmt(d.b)}</span>
      <span className="bar l"><i style={{ width: (d.b / max) * 100 + "%" }} className={win === 0 ? "win" : ""} /></span>
      <span className="lab"><b>{d.label}</b><em>{d.hint}</em></span>
      <span className="bar r"><i style={{ width: (d.l / max) * 100 + "%" }} className={win === 1 ? "win" : ""} /></span>
      <span className={"v r" + (win === 1 ? " win" : "")}>{d.fmt(d.l)}</span>
    </button>
  );
}

function Performance({ om }: { om: Om }) {
  const s = om.s;
  const weeks = WEEKS.map(w => capacityWeek(s, w));
  const plants = ["Brandon", "Lound"] as const;
  const mixColors = ["var(--accent)", "#8cbcec", "var(--warn)", "var(--ok)", "#b9a0e8", "var(--neutral)"];
  const products = Array.from(new Set(s.lots.map(l => l.product)));
  const st = (p: "Brandon" | "Lound", i: number) => {
    const lots = s.lots.filter(l => l.plant === p);
    const cast = lots.filter(l => l.actual);
    const late = cast.filter(l => daysBetween(l.planned, l.actual!) > 0);
    const ws = weeks.map(w => w.plants[i]);
    const loads = s.loads.filter(l => l.plant === p && l.collect >= WEEK && l.collect < "2026-11-16");
    const mix = products.map(pr => ({ pr, n: lots.filter(l => l.product === pr).reduce((t, l) => t + l.units, 0) })).filter(x => x.n > 0);
    return {
      p, cap: HOLLOWCORE_CAPACITY[p], ws, now: ws[0], avg: ws.reduce((t, w) => t + w.pct, 0) / ws.length, peak: Math.max(...ws.map(w => w.pct)),
      backlog: s.commitments.filter(c => c.plant === p && c.firm && c.week > WEEK).reduce((t, c) => t + c.m2, 0),
      onPlan: cast.length ? (cast.length - late.length) / cast.length : 1, late: late.length,
      mock: ON_PLAN_MOCK[p].reduce((a, b) => a + b, 0) / 6,
      qa: lots.filter(l => l.qa === "Inspection pending" || l.qa === "On hold").length,
      ready: lots.filter(l => l.status === "Complete" && l.qa === "Released" && !/Delivered|Dispatched/.test(l.yard)).length,
      loads: loads.length, tonnes: loads.reduce((t, l) => t + l.tonnes, 0), mix, mixTot: mix.reduce((t, x) => t + x.n, 0) || 1,
    };
  };
  const [B, L] = plants.map((p, i) => st(p, i));
  const P = (n: number) => pct(n);
  const N = (n: number) => num(n);
  const groups: [string, Duel[]][] = [
    ["Load", [
      { label: "Average load", hint: "Next six weeks, lower leaves more room", b: B.avg, l: L.avg, fmt: P, better: "low", go: () => om.setSub("capacity") },
      { label: "Busiest week", hint: "Where a new job would hurt first", b: B.peak, l: L.peak, fmt: P, better: "low", go: () => om.setSub("scenarios") },
      { label: "Backlog", hint: "Firm m² booked after this week", b: B.backlog, l: L.backlog, fmt: n => N(n) + " m²", better: null, go: () => om.setSub("capacity") },
    ]],
    ["Casting", [
      { label: "Cast on plan", hint: "Cast on or before the planned date", b: B.onPlan, l: L.onPlan, fmt: P, better: "high", go: () => om.setSub("production") },
      { label: "Lots cast late", hint: "In the current iThesis snapshot", b: B.late, l: L.late, fmt: N, better: "low", go: () => om.setSub("production") },
      { label: "On plan, 6 weeks", hint: "Mock until iThesis actuals connect", b: B.mock, l: L.mock, fmt: P, better: "high", go: () => om.setSub("production") },
    ]],
    ["Yard & dispatch", [
      { label: "Waiting on QA", hint: "Lots that cannot leave the yard yet", b: B.qa, l: L.qa, fmt: N, better: "low", go: () => om.setSub("quality") },
      { label: "Ready to dispatch", hint: "Cast and released, still in the yard", b: B.ready, l: L.ready, fmt: N, better: null, go: () => om.setSub("quality") },
      { label: "Tonnes leaving", hint: "Collections booked this week", b: B.tonnes, l: L.tonnes, fmt: n => N(n) + " t", better: null, go: () => om.go("Logistics", "planner") },
    ]],
  ];
  const delays = [
    ...s.designs.filter(d => !d.released).map(d => ({ id: d.id, what: "Design " + d.revision + " " + d.status.toLowerCase(), since: d.revisions.slice(-1)[0]?.at || TODAY, ref: { kind: "design" as const, id: d.id } })),
    ...s.lots.filter(l => l.qa === "Inspection pending" || l.qa === "On hold").map(l => ({ id: l.id, what: "QA " + l.qa.toLowerCase() + " at " + l.plant, since: l.actual || l.planned, ref: { kind: "lot" as const, id: l.id } })),
  ].map(x => ({ ...x, days: daysBetween(x.since, TODAY) })).sort((a, b) => b.days - a.days);

  return (
    <Grid>
      {[B, L].map(x => (
        <Card key={x.p} span={6} className="om-s-keep pf-hero">
          <div className="pf-top">
            <div>
              <div className="pf-name">{x.p}</div>
              <div className="om-faint om-small">{PLACE[x.p]} · {num(x.cap)} m² a week</div>
            </div>
            <Badge tone={x.now.pct > 1 ? "bad" : x.now.pct > 0.9 ? "warn" : "ok"}>{x.now.pct > 1 ? "Over capacity" : x.now.pct > 0.9 ? "Tight" : "Room to take work"}</Badge>
          </div>
          <div className="pf-big">
            <span className="n">{pct(x.now.pct, x.p === "Lound" ? 1 : 0)}</span>
            <span className="om-muted om-small">committed this week<br />{num(x.now.firm)} of {num(x.cap)} m² · {num(x.cap - x.now.firm)} m² free</span>
          </div>
          <div className="pf-weeks" role="img" aria-label={x.p + " load by week"}>
            {x.ws.map((w, k) => (
              <button key={k} onClick={() => om.setSub("capacity")} title={weekLabel(weeks[k].week) + ": " + num(w.firm) + " of " + num(w.cap) + " m²"}>
                <span className="track"><i style={{ height: Math.max(3, Math.min(100, w.pct * 100)) + "%", background: loadColor(w.pct) }} /></span>
                <span className="om-mono om-tiny">{pct(w.pct)}</span>
                <span className="om-faint" style={{ fontSize: 10 }}>{dateShort(weeks[k].week)}</span>
              </button>
            ))}
          </div>
          <div className="pf-stats">
            <button onClick={() => om.setSub("quality")}><b>{x.ready}</b><span>ready to go</span></button>
            <button onClick={() => om.setSub("quality")}><b style={{ color: x.qa ? "var(--warn)" : undefined }}>{x.qa}</b><span>waiting on QA</span></button>
            <button onClick={() => om.go("Logistics", "planner")}><b>{x.loads}</b><span>loads this week</span></button>
            <button onClick={() => om.setSub("production")}><b style={{ color: x.late ? "var(--warn)" : undefined }}>{x.late}</b><span>cast late</span></button>
          </div>
          <div className="om-mix" style={{ height: 8, marginTop: 16 }}>{x.mix.map(m => <span key={m.pr} style={{ width: (m.n / x.mixTot) * 100 + "%", background: mixColors[products.indexOf(m.pr) % mixColors.length] }} title={m.pr + ": " + m.n + " units"} />)}</div>
          <div className="om-row om-tiny om-faint" style={{ flexWrap: "wrap", gap: 12, marginTop: 8 }}>{x.mix.map(m => <span key={m.pr} className="om-row" style={{ gap: 5 }}><span className="om-dot" style={{ marginTop: 0, background: mixColors[products.indexOf(m.pr) % mixColors.length] }} />{m.pr} {Math.round((m.n / x.mixTot) * 100)}%</span>)}</div>
        </Card>
      ))}

      <Card span={12} title="Head to head" sub="Same measure, both plants. The brighter bar is the better result · click a row to open the detail">
        <div className="pf-heads"><span>Brandon</span><span /><span>Lound</span></div>
        {groups.map(([g, rows]) => (
          <div key={g} className="pf-group">
            <div className="pf-gname">{g}</div>
            {rows.map(d => <DuelRow key={d.label} d={d} />)}
          </div>
        ))}
      </Card>

      <Card span={12} flush title="Handoffs waiting" sub="Open design and QA handoffs, oldest first · click to open the record">
        <Table rowKey={x => x.id} rows={delays} onRow={x => om.open(x.ref)} cols={[
          { k: "id", label: "Record", render: x => <span className="mono ink">{x.id}</span> },
          { k: "w", label: "Waiting on", render: x => x.what },
          { k: "s", label: "Since", render: x => dateShort(x.since), cls: "mono" },
          { k: "d", label: "Days waiting", align: "right", render: x => <span style={{ color: x.days > 7 ? "var(--warn)" : undefined }}>{x.days}</span>, cls: "mono" },
        ]} />
      </Card>
    </Grid>
  );
}

const SUBS: Record<string, [string, string]> = {
  constraints: ["Constraints", "The one step that limits how much work flows from enquiry to cash, found by the Constraint Analyst agent and flagged to its owner."],
  capacity: ["Capacity", "Two-site hollowcore board for Brandon and Lound. Firm commitments only; tentative demand stays visible but uncounted."],
  scenarios: ["Scenarios", "Try a win or a slot move before anyone commits. Nothing here touches the plan."],
  production: ["Production visibility", "Read-only iThesis snapshot of planned casts, actuals and dispatch readiness."],
  design: ["Design handoffs", "iThesis design packages, revisions and the release-for-production gate, linked to client RFIs."],
  quality: ["Quality, yard & stock", "QA status, bay occupancy and stock waiting to leave. Every release is a person's decision."],
  performance: ["Plant performance", "Brandon and Lound measured the same way: load, casting on plan, QA and what leaves the yard."],
};

export default function Plants({ om }: { om: Om }) {
  const [title, sub] = SUBS[om.sub] || SUBS.capacity;
  return (
    <Page>
      <Head eyebrow="Plants & Planning · Brandon (Weeting, Norfolk) · Lound (Retford, Notts)" title={title} sub={sub} />
      {om.sub === "constraints" ? <ConstraintBoard om={om} /> : om.sub === "scenarios" ? <Scenarios om={om} /> : om.sub === "production" ? <Production om={om} /> : om.sub === "design" ? <Design om={om} />
        : om.sub === "quality" ? <Quality om={om} /> : om.sub === "performance" ? <Performance om={om} /> : <Capacity om={om} />}
    </Page>
  );
}
