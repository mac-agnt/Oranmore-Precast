/* Small component kit for the Oranmore modules. Theme tokens only. */
import { useState, type ReactNode, type CSSProperties } from "react";
import type { Lineage, Ref, OmState } from "./types";
import type * as A from "./actions";
import { stamp } from "./format";
import { SNAPSHOT_LABEL } from "./fixtures";

/* ── controller passed to every module page as v.om ─────────────────────── */
type Bound<F> = F extends (s: OmState, ...a: infer P) => infer R ? (...a: P) => R extends { s: OmState } ? string | undefined : void : never;
export type OmDo = { [K in keyof typeof A as (typeof A)[K] extends (s: OmState, ...a: any[]) => any ? K : never]: Bound<(typeof A)[K]> };
export interface Om {
  s: OmState;
  page: string;
  sub: string;
  setSub: (tab: string) => void;
  go: (page: string, tab?: string, sel?: string) => void;
  open: (ref: Ref) => void;
  do: OmDo;
  ui: Record<string, any>;
  setUi: (key: string, value: any) => void;
  toast: (text: string) => void;
}
/** Persisted per-page selection/filter state that survives navigation. */
export function useUi<T>(om: Om, key: string, initial: T): [T, (v: T) => void] {
  const v = om.ui[key];
  return [v === undefined ? initial : (v as T), (x: T) => om.setUi(key, x)];
}

/* ── tones ──────────────────────────────────────────────────────────────── */
export type Tone = "ok" | "warn" | "bad" | "info" | "accent" | "neutral" | "draft";
const TONES: [RegExp, Tone][] = [
  [/^(won|verified|pod verified|released|released for production|complete|paid|resolved|approved|allocated|done|healthy|handoff simulated|sent \(simulated\)|delivered|issued)$/i, "ok"],
  [/(held|overdue|blocked|exception|failed|lost|rejected|missing|critical|overload|on hold|claimed)/i, "bad"],
  [/(awaiting|pending|review|tentative|estimating|negotiation|submitted|due|waiting|eligible|high|inspection)/i, "warn"],
  [/(dispatched|loaded|casting|delivering|in progress|in design|scheduled|planned|quote submitted|ready)/i, "info"],
  [/(draft|not started|not due|not planned|not released|inquiry|unknown|concept|demo)/i, "draft"],
];
export const toneOf = (status: string): Tone => (TONES.find(([re]) => re.test(status)) || [null, "neutral"])[1] as Tone;

export function Badge({ tone, children, dot = true, title }: { tone?: Tone; children: ReactNode; dot?: boolean; title?: string }) {
  const t = tone || toneOf(String(children));
  return <span className={"om-badge t-" + t} title={title}>{dot && <i />}{children}</span>;
}

/* ── layout ─────────────────────────────────────────────────────────────── */
export const Page = ({ children }: { children: ReactNode }) => <div className="om-page">{children}</div>;
export function Head({ title, sub, right, eyebrow }: { title: ReactNode; sub?: ReactNode; right?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="om-head">
      <div style={{ minWidth: 0, flex: "1 1 420px" }}>
        {eyebrow && <div className="om-eyebrow" style={{ marginBottom: 6 }}>{eyebrow}</div>}
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      <div className="om-head-r">{right}<DemoTag /></div>
    </div>
  );
}
export const DemoTag = ({ text }: { text?: string }) => <span className="om-demo" title="All values are fictional and illustrative">{text || SNAPSHOT_LABEL}</span>;
export function Grid({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return <div className={"om-grid om-g-12 " + className} style={style}>{children}</div>;
}
export function Card({ title, sub, right, children, span = 12, flush, className = "", style }: { title?: ReactNode; sub?: ReactNode; right?: ReactNode; children?: ReactNode; span?: number; flush?: boolean; className?: string; style?: CSSProperties }) {
  return (
    <section className={"om-card om-s-" + span + " " + className} style={style}>
      {(title || right) && (
        <div className="om-card-h">
          <div style={{ minWidth: 0 }}>{title && <h3>{title}</h3>}{sub && <div className="om-sub">{sub}</div>}</div>
          {right && <div className="om-r">{right}</div>}
        </div>
      )}
      <div className={"om-card-b" + (flush ? " flush" : "")}>{children}</div>
    </section>
  );
}

/* ── controls ───────────────────────────────────────────────────────────── */
export function Btn({ children, onClick, kind, sm, disabled, title, type }: { children: ReactNode; onClick?: () => void; kind?: "primary" | "quiet" | "danger"; sm?: boolean; disabled?: boolean; title?: string; type?: "button" | "submit" }) {
  return <button type={type || "button"} className={"om-btn" + (kind ? " " + kind : "") + (sm ? " sm" : "")} onClick={disabled ? undefined : onClick} disabled={disabled} title={title}>{children}</button>;
}
export function Seg<T extends string>({ options, value, onChange }: { options: (T | [T, string, number?])[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="om-seg" role="tablist">
      {options.map(o => {
        const [k, label, n] = Array.isArray(o) ? o : [o, o, undefined];
        return <button key={k} role="tab" aria-selected={k === value} className={k === value ? "on" : ""} onClick={() => onChange(k)}>{label}{n !== undefined && <span className="n">{n}</span>}</button>;
      })}
    </div>
  );
}
export function Kpi({ label, value, sub, onClick, tone }: { label: ReactNode; value: ReactNode; sub?: ReactNode; onClick?: () => void; tone?: Tone }) {
  const color = tone === "bad" ? "var(--bad)" : tone === "warn" ? "var(--warn)" : tone === "ok" ? "var(--ok)" : tone === "accent" ? "var(--accent)" : undefined;
  const inner = <><div className="k">{label}</div><div className="v" style={{ color }}>{value}</div>{sub && <div className="s">{sub}</div>}</>;
  return onClick ? <button className="om-kpi" onClick={onClick}>{inner}</button> : <div className="om-kpi">{inner}</div>;
}
export function Bar({ value, max = 1, color, marker, height }: { value: number; max?: number; color?: string; marker?: number; height?: number }) {
  const w = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="om-bar" style={height ? { height } : undefined}>
      <span style={{ width: w + "%", background: color }} />
      {marker !== undefined && <em style={{ left: Math.min(100, (marker / max) * 100) + "%" }} />}
    </div>
  );
}
export function Field({ label, children, hint }: { label: ReactNode; children: ReactNode; hint?: ReactNode }) {
  return <label style={{ display: "block", minWidth: 0 }}><span className="om-label">{label}</span>{children}{hint && <span className="om-faint om-tiny" style={{ display: "block", marginTop: 5 }}>{hint}</span>}</label>;
}
export function Check({ on, label, onToggle, disabled }: { on: boolean; label: ReactNode; onToggle: () => void; disabled?: boolean }) {
  return (
    <button className={"om-check" + (on ? " on" : "")} onClick={disabled ? undefined : onToggle} aria-pressed={on} style={disabled ? { opacity: 0.5, cursor: "not-allowed" } : undefined}>
      <span className="box">{on && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}</span>
      <span className="t">{label}</span>
    </button>
  );
}

/* ── data display ──────────────────────────────────────────────────────── */
export interface Col<R> { k: string; label: ReactNode; render: (r: R) => ReactNode; align?: "right"; w?: string | number; cls?: string }
export function Table<R>({ cols, rows, onRow, selKey, rowKey, empty, maxHeight }: { cols: Col<R>[]; rows: R[]; onRow?: (r: R) => void; selKey?: string | null; rowKey: (r: R) => string; empty?: ReactNode; maxHeight?: number }) {
  return (
    <div className="om-scroll" style={maxHeight ? { maxHeight } : undefined}>
      <table className="om-tbl">
        <thead><tr>{cols.map(c => <th key={c.k} className={c.align === "right" ? "r" : ""} style={c.w ? { width: c.w } : undefined}>{c.label}</th>)}</tr></thead>
        <tbody>
          {rows.map(r => {
            const k = rowKey(r);
            return (
              <tr key={k} className={(onRow ? "click " : "") + (selKey === k ? "sel" : "")} onClick={onRow ? () => onRow(r) : undefined}>
                {cols.map(c => <td key={c.k} className={(c.align === "right" ? "r " : "") + (c.cls || "")}>{c.render(r)}</td>)}
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 && <Empty title="Nothing matches this filter" hint={empty || "Clear the filter to see every record."} />}
    </div>
  );
}
export const Empty = ({ title, hint }: { title: ReactNode; hint?: ReactNode }) => <div className="om-empty"><b>{title}</b>{hint}</div>;
export function Facts({ items }: { items: [ReactNode, ReactNode][] }) {
  return <div className="om-facts">{items.map(([k, v], i) => <div key={i}><div className="k">{k}</div><div className="v">{v}</div></div>)}</div>;
}
export function RefLink({ om, r, children }: { om: Om; r: Ref; children?: ReactNode }) {
  return <button className="om-ref" onClick={e => { e.stopPropagation(); om.open(r); }} title="Open record">{children || r.id}</button>;
}
export function LineageChip({ l }: { l: Lineage }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="om-lin" onMouseLeave={() => setOpen(false)}>
      <button onClick={e => { e.stopPropagation(); setOpen(!open); }} aria-expanded={open} title="Where this record came from">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 3v12 M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M18 9a9 9 0 0 1-9 9" /></svg>
        {l.source}
      </button>
      {open && (
        <div className="om-pop" onClick={e => e.stopPropagation()}>
          <div className="om-eyebrow">Data lineage</div>
          <dl><dt>Source</dt><dd>{l.source}</dd><dt>Updated</dt><dd>{stamp(l.updated)}</dd><dt>State</dt><dd>{l.state}</dd>{l.confidence && <><dt>Confidence</dt><dd>{l.confidence}</dd></>}</dl>
          <div className="om-faint om-tiny" style={{ marginTop: 10 }}>Illustrative integration. No live connection to this source in the demo.</div>
        </div>
      )}
    </span>
  );
}
export function Modal({ title, sub, onClose, children, footer, width }: { title: ReactNode; sub?: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode; width?: number }) {
  return (
    <div className="om-modal-wrap" onClick={onClose}>
      <div className="om-modal" style={width ? { width: "min(" + width + "px,100%)" } : undefined} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="om-drawer-h"><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-.3px" }}>{title}</div>{sub && <div className="om-muted om-small" style={{ marginTop: 4 }}>{sub}</div>}</div><button className="om-x" onClick={onClose} aria-label="Close">✕</button></div>
        <div style={{ padding: "16px 22px" }}>{children}</div>
        {footer && <div className="om-row" style={{ justifyContent: "flex-end", padding: "12px 22px 18px", borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>{footer}</div>}
      </div>
    </div>
  );
}
/** Small coloured dot for timeline/state markers. */
export const Dot = ({ tone }: { tone: Tone }) => <span className="om-dot" style={{ background: tone === "ok" ? "var(--ok)" : tone === "bad" ? "var(--bad)" : tone === "warn" ? "var(--warn)" : tone === "accent" ? "var(--accent)" : tone === "info" ? "#8cbcec" : "var(--faint)" }} />;
