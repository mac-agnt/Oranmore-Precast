/* Lightweight logic checks for the Oranmore demo: npm run check */
import { initialState } from "../src/oranmore/fixtures";
import * as A from "../src/oranmore/actions";
import { capacityWeek, pipeline, financeTotals, blockingOpen, kpis } from "../src/oranmore/selectors";

let fails = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log((ok ? "PASS " : "FAIL ") + name + (ok ? "" : "  got " + JSON.stringify(got) + " want " + JSON.stringify(want)));
};

let s = initialState();
const c = capacityWeek(s);
eq("Brandon 4,800 / 6,000", [c.plants[0].firm, c.plants[0].cap], [4800, 6000]);
eq("Lound 2,900 / 4,000 (Kier 2,400 included)", [c.plants[1].firm, c.plants[1].cap, c.plants[1].firmItems.some(i => i.ref.id === "ORD-26-125" && i.m2 === 2400)], [2900, 4000, true]);
eq("Total 7,700 / 10,000 = 77%, 2,300 free", [c.firm, c.cap, Math.round(c.pct * 100), c.free], [7700, 10000, 77, 2300]);
const sc = capacityWeek(s, undefined, { addLound: 1500 });
eq("1,500 m² Lound scenario → 4,400, 400 over", [sc.plants[1].hypo, sc.plants[1].over], [4400, 400]);
eq("Scenario leaves shared state untouched", capacityWeek(s).plants[1].firm, 2900);

const p = pipeline(s);
const wharf = p.devGroups.find(g => g.devId === "d-wharfside")!;
eq("Wharfside counted once (best bid only)", [wharf.rows.length, wharf.counted === Math.max(...wharf.rows.map(r => r.weighted))], [2, true]);
eq("Forecast < raw weighted sum by excluded bid", Math.round(p.rawWeighted - p.deduped), Math.round(wharf.excluded));

const f0 = financeTotals(s);
eq("Invoice-ready excludes held £87k", [f0.readyValue, f0.held.some(i => i.id === "INV-DR-4481")], [112000, true]);
let s2 = A.reviewPod(s, "LOAD-4481", true);
eq("Cannot accept a claim with no evidence", s2.loads.find(l => l.id === "LOAD-4481")!.status, "Arrival claimed");
s2 = A.releaseInvoice(s, "INV-DR-4481");
eq("Cannot release invoice before POD", s2.invoices.find(i => i.id === "INV-DR-4481")!.stage, "Held");
s = A.carrierSetPod(s, "LOAD-4481", { photo: true, photoName: "unload.jpg", receiver: "R. Ellison", signature: true });
s = A.carrierSubmit(s, "LOAD-4481");
eq("Carrier submit → POD submitted, still held", [s.loads.find(l => l.id === "LOAD-4481")!.status, s.invoices.find(i => i.id === "INV-DR-4481")!.stage], ["POD submitted", "Held"]);
s = A.reviewPod(s, "LOAD-4481", true);
eq("Human accept → verified, eligible", [s.loads.find(l => l.id === "LOAD-4481")!.status, s.invoices.find(i => i.id === "INV-DR-4481")!.stage], ["POD verified", "Eligible"]);
s = A.releaseInvoice(s, "INV-DR-4481");
eq("Finance release → £199,000 ready", financeTotals(s).readyValue, 199000);
s = A.simulateSage(s, "INV-DR-4481");
eq("Sage handoff blocked before review approval", s.invoices.find(i => i.id === "INV-DR-4481")!.stage, "Ready for finance review");
s = A.approveInvoice(s, "INV-DR-4481"); s = A.simulateSage(s, "INV-DR-4481");
eq("Sage handoff simulated after approval", s.invoices.find(i => i.id === "INV-DR-4481")!.stage, "Handoff simulated");

eq("Mace starts with 2 blocking RFIs", blockingOpen(s, "ORD-26-118").length, 2);
s = A.resolveRfi(s, "RFI-1032", "Crane TC1", "Joe Hartley (Mace)", true);
eq("Resolving RFI-1032 → 1 blocker everywhere", [blockingOpen(s, "ORD-26-118").length, kpis(s).rfiBlocking], [1, 1]);
const before = s.orders.length;
const r1 = A.createOrder(s, "QUO-26-088");
eq("Duplicate award prevented", [r1.existing, r1.s.orders.length], [true, before]);

console.log(fails ? "\n" + fails + " check(s) failed" : "\nAll checks passed");
process.exit(fails ? 1 : 0);
