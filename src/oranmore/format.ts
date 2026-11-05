/* UK formatting: GBP, UK dates, Europe/London clock (GMT in November). */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const gbp = (n: number) => "£" + Math.round(n).toLocaleString("en-GB");
export const gbpShort = (n: number) => {
  const a = Math.abs(n);
  if (a >= 1_000_000) return "£" + (n / 1_000_000).toFixed(a >= 10_000_000 ? 1 : 2).replace(/\.?0+$/, "") + "m";
  if (a >= 1_000) return "£" + Math.round(n / 1_000).toLocaleString("en-GB") + "k";
  return "£" + Math.round(n).toLocaleString("en-GB");
};
export const num = (n: number) => Math.round(n).toLocaleString("en-GB");
export const m2 = (n: number) => num(n) + " m²";
export const pct = (n: number, dp = 0) => (n * 100).toFixed(dp).replace(/\.0$/, "") + "%";

function parts(s: string) {
  const [d, t] = s.split(" ");
  const [y, mo, da] = d.split("-").map(Number);
  return { y, mo, da, t: t || "" };
}
/** "10 Nov 2026" */
export const dateUK = (s?: string | null) => { if (!s) return "—"; const p = parts(s); return String(p.da).padStart(2, "0") + " " + MONTHS[p.mo - 1] + " " + p.y; };
/** "10 Nov" */
export const dateShort = (s?: string | null) => { if (!s) return "—"; const p = parts(s); return String(p.da).padStart(2, "0") + " " + MONTHS[p.mo - 1]; };
/** "Tue 10 Nov" */
export const dayShort = (s?: string | null) => { if (!s) return "—"; const p = parts(s); const wd = new Date(Date.UTC(p.y, p.mo - 1, p.da)).getUTCDay(); return DAYS[wd] + " " + dateShort(s); };
/** "06 Nov 2026, 16:10" when a time is present */
export const stamp = (s?: string | null) => { if (!s) return "—"; const p = parts(s); return p.t ? dateShort(s) + ", " + p.t.slice(0, 5) : dateUK(s); };
export const weekLabel = (s: string) => "w/c " + dateShort(s);

export const dayNum = (s: string) => { const p = parts(s); return Date.UTC(p.y, p.mo - 1, p.da) / 86400000; };
export const daysBetween = (a: string, b: string) => Math.round(dayNum(b) - dayNum(a));
export const addDays = (s: string, n: number) => { const d = new Date((dayNum(s) + n) * 86400000); return d.toISOString().slice(0, 10); };
export const hoursSince = (from: string, to: string) => {
  const f = parts(from), t = parts(to);
  const ms = (x: typeof f) => Date.UTC(x.y, x.mo - 1, x.da, Number((x.t || "00:00").slice(0, 2)), Number((x.t || "00:00").slice(3, 5)));
  return Math.round((ms(t) - ms(f)) / 3600000);
};
