import type { Om } from "../../ui";
import { Head, Grid, Card, Badge, Btn, RefLink } from "../../ui";
import { account, dev } from "../../selectors";
import { gbp, stamp, dateUK } from "../../format";
import { useOrder, progressOf, stageTone, stageWord, stageTarget } from "./common";

const COLOR: Record<string, string> = { done: "var(--ok)", blocked: "var(--bad)", waiting: "var(--warn)", active: "var(--accent)", pending: "var(--track)" };

export default function Journey({ om }: { om: Om }) {
  const s = om.s;
  const [o, setSel] = useOrder(om);
  const p = progressOf(om, o);
  const acc = account(s, o.accountId), d = dev(s, o.devId);
  const waiting = p.st.filter(x => x.state === "waiting");

  return (
    <>
      <Head eyebrow="One customer · one project · one journey" title={d?.name + " · " + acc?.name}
        sub={"From enquiry to Sage invoice on one line. Each stage is owned by a team and points to the record that proves it. " + o.id + " · " + gbp(o.value) + " net · awarded " + dateUK(o.awarded) + "."} />
      <Grid>
        <div className="om-s-3 om-col om-sticky" style={{ gap: 8 }}>
          <div className="om-eyebrow" style={{ padding: "0 2px" }}>Projects</div>
          {s.orders.map(x => {
            const px = progressOf(om, x);
            const on = x.id === o.id;
            return (
              <button key={x.id} onClick={() => setSel(x.id)} className="om-card" style={{ textAlign: "left", padding: "11px 13px", cursor: "pointer", font: "inherit", color: "inherit", borderColor: on ? "var(--accent-line)" : undefined, background: on ? "var(--accent-faint)" : undefined }}>
                <div className="om-row" style={{ gap: 6 }}>
                  <b style={{ fontSize: 12.5, fontWeight: 600, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{dev(s, x.devId)?.name}</b>
                  {px.blocked.length > 0 && <Badge tone="bad">{px.blocked.length}</Badge>}
                </div>
                <div className="om-faint om-tiny" style={{ marginTop: 3 }}>{account(s, x.accountId)?.name} · {x.id}</div>
                <div style={{ display: "flex", gap: 2, marginTop: 8 }}>{px.st.map(st => <span key={st.key} title={st.label} style={{ flex: 1, height: 4, borderRadius: 2, background: COLOR[st.state] }} />)}</div>
              </button>
            );
          })}
        </div>

        <div className="om-s-9 om-col" style={{ gap: 14 }}>
          <div className="om-card" style={{ padding: "14px 18px" }}>
            <div className="om-row" style={{ gap: 14, flexWrap: "wrap" }}>
              <div><div className="om-eyebrow">Progress</div><div style={{ fontSize: 22, fontWeight: 600, marginTop: 4 }} className="om-mono">{p.done}<span className="om-faint" style={{ fontSize: 14 }}> / {p.total} stages</span></div></div>
              <div style={{ width: 1, alignSelf: "stretch", background: "var(--border)" }} />
              <div style={{ flex: 1, minWidth: 260 }}>
                <div className="om-eyebrow">{p.blocked.length ? "Blocked" : waiting.length ? "Waiting on others" : "Clear"}</div>
                {p.blocked.length === 0 && waiting.length === 0 && <div className="om-small om-muted" style={{ marginTop: 6 }}>Nothing is holding this project up.</div>}
                {p.blocked.map(b => <div key={b.key} className="om-small" style={{ marginTop: 6 }}><Badge tone="bad">{b.label}</Badge> <span className="om-muted">{b.blocker || b.status}</span></div>)}
                {p.blocked.length === 0 && waiting.map(b => <div key={b.key} className="om-small" style={{ marginTop: 6 }}><Badge tone="warn">{b.label}</Badge> <span className="om-muted">{b.next || b.status}</span></div>)}
              </div>
              <div className="om-row" style={{ gap: 6 }}>
                <Btn sm onClick={() => om.setSub("portal")}>What the customer sees</Btn>
                <Btn sm kind="quiet" onClick={() => om.open({ kind: "order", id: o.id })}>Order record</Btn>
              </div>
            </div>
            <div className="om-steps" style={{ marginTop: 14 }}>
              {p.st.map(x => (
                <button key={x.key} className={"om-step " + x.state} onClick={() => document.getElementById("jr-" + x.key)?.scrollIntoView({ behavior: "smooth", block: "center" })}>
                  <div className="k"><span style={{ width: 7, height: 7, borderRadius: "50%", background: COLOR[x.state], flex: "none" }} />{x.label}</div>
                  <div className="s">{x.status}</div>
                </button>
              ))}
            </div>
          </div>

          <Card title="Journey" sub="Statuses stay separate per stage: design, capacity, production, quality, dispatch, proof and invoice each keep their own state." flush>
            <div style={{ position: "relative", padding: "6px 18px 18px 18px" }}>
              {p.st.map((x, i) => {
                const t = stageTarget(x);
                const last = i === p.st.length - 1;
                return (
                  <div id={"jr-" + x.key} key={x.key} style={{ position: "relative", display: "grid", gridTemplateColumns: "34px minmax(0,1fr)", gap: 12, paddingBottom: last ? 0 : 6 }}>
                    <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
                      {!last && <span style={{ position: "absolute", top: 26, bottom: -6, width: 2, background: x.state === "done" ? "color-mix(in srgb,var(--ok) 45%,transparent)" : "var(--border-strong)" }} />}
                      <span style={{ marginTop: 12, width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 700, background: x.state === "pending" ? "var(--surface-2)" : COLOR[x.state], color: x.state === "pending" ? "var(--faint)" : "var(--on-accent)", border: x.state === "pending" ? "1px solid var(--border-strong)" : "0", boxShadow: x.state === "blocked" ? "0 0 0 4px var(--bad-soft)" : "none" }}>{x.state === "done" ? "✓" : i + 1}</span>
                    </div>
                    <div style={{ padding: "10px 14px", margin: "4px 0", borderRadius: 14, border: "1px solid " + (x.state === "blocked" ? "color-mix(in srgb,var(--bad) 45%,transparent)" : "var(--border)"), background: x.state === "blocked" ? "var(--bad-soft)" : x.state === "active" ? "var(--accent-faint)" : "var(--surface-faint)" }}>
                      <div className="om-row" style={{ gap: 8, flexWrap: "wrap" }}>
                        <b style={{ fontSize: 14, fontWeight: 600 }}>{x.label}</b>
                        <span className="om-faint om-small">{x.team}</span>
                        <Badge tone={stageTone(x.state)}>{stageWord(x.state)}</Badge>
                        <span style={{ marginLeft: "auto" }} className="om-row">{x.ref ? <RefLink om={om} r={x.ref}>{x.refLabel}</RefLink> : <span className="om-mono om-faint om-small">{x.refLabel}</span>}</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: "6px 16px", marginTop: 8, fontSize: 12 }}>
                        <div><span className="om-faint">Status </span><span className="om-ink">{x.status}</span></div>
                        {x.evidence && <div><span className="om-faint">Evidence </span><span className="om-muted">{x.evidence}</span></div>}
                        {x.at && <div><span className="om-faint">Latest </span><span className="om-mono om-muted">{stamp(x.at)}</span></div>}
                      </div>
                      {x.blocker && <div className="om-small" style={{ marginTop: 8, color: "var(--bad)", fontWeight: 500 }}>Blocker: {x.blocker}</div>}
                      {(x.next || t) && (
                        <div className="om-row" style={{ marginTop: 8, gap: 8, flexWrap: "wrap" }}>
                          {x.next && <span className="om-small"><span className="om-faint">Next: </span>{x.next}</span>}
                          {t && <span style={{ marginLeft: "auto" }}><Btn sm kind={x.state === "blocked" ? "primary" : "quiet"} onClick={() => om.go(t[0], t[1], t[2])}>{t[3]} →</Btn></span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </Grid>
    </>
  );
}
