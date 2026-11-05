/* Shared bits for the Commercial module pages. */
import type { Om } from "../../ui";
import { Badge } from "../../ui";
import type { EnquiryRow } from "../../selectors";
import { PRE_SUBMIT, fmtDue } from "../../selectors";
import { STAFF } from "../../fixtures";

export const ESTIMATORS = [STAFF.olivia, STAFF.sam, STAFF.hannah];

export function DueBadge({ r }: { r: EnquiryRow }) {
  if (!PRE_SUBMIT.includes(r.q.status)) return <Badge tone="neutral" dot={false}>{r.q.status === "Won" || r.q.status === "Lost" ? "Closed" : "Submitted"}</Badge>;
  return <Badge tone={r.overdue ? "bad" : r.dueSoon ? "warn" : "neutral"}>{fmtDue(r.e.due)}</Badge>;
}

export function EstimatorSelect({ om, enquiryId, value, compact }: { om: Om; enquiryId: string; value: string | null; compact?: boolean }) {
  return (
    <select
      className="om-input"
      style={compact ? { height: 28, fontSize: 12, width: "auto", minWidth: 130 } : undefined}
      value={value || ""}
      onClick={e => e.stopPropagation()}
      onChange={e => {
        const name = e.target.value;
        if (!name) return;
        om.do.assignEstimator(enquiryId, name);
        om.toast(enquiryId + " assigned to " + name + ". Linked task closed, visible in Work and Activity.");
      }}
      aria-label="Assign estimator"
    >
      <option value="" disabled>{value ? value : "Assign estimator…"}</option>
      {ESTIMATORS.map(n => <option key={n} value={n}>{n}</option>)}
    </select>
  );
}

export const productShort = (p: string) => p === "Stairs & landings" ? "Stairs" : p === "Beam & block" ? "B&B" : p;
