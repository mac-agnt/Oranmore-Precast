/* Extra Home rail widgets: the connected project strip and the AI briefing. */
import type { Om } from "./ui";
import { omStrip } from "./shellData";
import { answer } from "./chat";

const card: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--card-r,18px)", boxShadow: "var(--card-shadow)", padding: "18px 20px 12px" };
const TONE: Record<string, string> = { ok: "var(--ok)", warn: "var(--warn)", bad: "var(--bad)", neutral: "var(--faint)" };

export function JourneyStrip({ om, onRemove, edit }: { om: Om; onRemove: () => void; edit: boolean }) {
  const rows = omStrip(om.s);
  return (
    <div style={card}>
      <div className="om-row"><div style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>Connected journey</div><span className="om-faint om-tiny">enquiry → invoice</span>{edit && <button className="om-x" style={{ width: 24, height: 24 }} onClick={onRemove} aria-label="Remove widget">✕</button>}</div>
      <div style={{ marginTop: 8, position: "relative" }}>
        <span style={{ position: "absolute", left: 3, top: 14, bottom: 14, width: 1, background: "var(--border-strong)" }} />
        {rows.map(r => (
          <button key={r.label} onClick={() => om.go(r.page, r.tab)} className="om-row" style={{ width: "100%", padding: "7px 0", background: "none", border: 0, color: "inherit", font: "inherit", cursor: "pointer", textAlign: "left", position: "relative" }} title={"Open " + r.page}>
            <span style={{ width: 7, height: 7, borderRadius: 2, flex: "none", background: TONE[r.tone], boxShadow: r.tone === "bad" ? "0 0 8px var(--bad)" : "none" }} />
            <span style={{ fontSize: 12.5, flex: "0 0 92px", whiteSpace: "nowrap" }}>{r.label}</span>
            <span className="om-mono" style={{ fontSize: 12.5, fontWeight: 600, flex: "0 0 52px", textAlign: "right" }}>{r.count}</span>
            <span className="om-faint" style={{ fontSize: 11, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function BriefWidget({ om, onRemove, edit }: { om: Om; onRemove: () => void; edit: boolean }) {
  const a = answer(om.s, "morning briefing");
  return (
    <div style={card}>
      <div className="om-row"><div style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>AI briefing</div><span className="om-faint om-tiny">Briefing agent · 07:00</span>{edit && <button className="om-x" style={{ width: 24, height: 24 }} onClick={onRemove} aria-label="Remove widget">✕</button>}</div>
      <p style={{ fontSize: 12.5, lineHeight: 1.55, color: "var(--body)", margin: "10px 0 10px" }}>{a.text}</p>
      <div className="om-row" style={{ paddingBottom: 6 }}><button className="om-btn sm" onClick={() => om.go("Agents")}>Open Briefing agent</button><span className="om-faint om-tiny">Simulated · record-backed</span></div>
    </div>
  );
}
