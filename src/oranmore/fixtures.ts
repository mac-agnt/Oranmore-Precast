/* Illustrative demo data · snapshot Mon 09 Nov 2026, 09:00 Europe/London.
   Contractor names are real Oranmore Precast customers named publicly; every
   project, value, date and status below is fictional and illustrative. */
import type {
  Account, Contact, Development, Enquiry, Quote, Order, Rfi, Doc, DesignPackage, Commitment, Lot, Load,
  Carrier, Invoice, Task, OmEvent, OmState, ContractField, QuoteCheck, Product
} from "./types";

export const SNAPSHOT_LABEL = "Illustrative demo data · snapshot 09 Nov 2026";
export const SNAPSHOT_DAY = "2026-11-09";
export const WEEK = "2026-11-09"; // week commencing
export const WEEKS = ["2026-11-09", "2026-11-16", "2026-11-23", "2026-11-30", "2026-12-07", "2026-12-14"];

/* Illustrative plant split of the published ~10,000 m²/week combined hollowcore capability. */
export const HOLLOWCORE_CAPACITY: Record<"Brandon" | "Lound", number> = { Brandon: 6000, Lound: 4000 };
/* Other lines are tracked on their own basis, never converted into hollowcore m². */
export const OTHER_LINES: { product: Product; plant: "Brandon" | "Lound"; unit: string; capacity: number; committed: number }[] = [
  { product: "Beam & block", plant: "Brandon", unit: "m² floor / wk", capacity: 2200, committed: 1460 },
  { product: "Stairs & landings", plant: "Brandon", unit: "flights / wk", capacity: 40, committed: 31 },
  { product: "Lift shafts", plant: "Lound", unit: "units / wk", capacity: 6, committed: 4 },
  { product: "Bespoke", plant: "Brandon", unit: "units / wk", capacity: 24, committed: 19 },
  { product: "Twinwall", plant: "Lound", unit: "m² wall / wk", capacity: 900, committed: 520 },
];

const L = (source: any, updated: string, state: string, confidence?: "High" | "Medium" | "Low") => ({ source, updated, state, confidence });

/* ── people ─────────────────────────────────────────────────────────────── */
export const STAFF = {
  olivia: "Olivia Ellis", sam: "Sam Patel", hannah: "Hannah Cole", megan: "Megan Price", daniel: "Daniel Brooks",
  grace: "Grace Hughes", tom: "Tom Fielding", aaron: "Aaron Webb", lucy: "Lucy Grant", kerry: "Kerry Dunn",
};

const contacts: Contact[] = [
  // public management team (verified public roles; no contact details invented)
  { id: "c-rm", name: "Ross Melville", role: "Managing Director", accountId: null, email: "", phone: "", internal: true, team: "Leadership" },
  { id: "c-rb", name: "Richard Burke", role: "Managing Director", accountId: null, email: "", phone: "", internal: true, team: "Leadership" },
  { id: "c-ca", name: "Chris Audin", role: "Sales Manager", accountId: null, email: "", phone: "", internal: true, team: "Commercial" },
  { id: "c-mb", name: "Mark Burrage", role: "Associate Director", accountId: null, email: "", phone: "", internal: true, team: "Leadership" },
  { id: "c-df", name: "Dave Ferreday", role: "Engineering", accountId: null, email: "", phone: "", internal: true, team: "Design" },
  { id: "c-rk", name: "Ricki Mann", role: "Lound Operations Manager", accountId: null, email: "", phone: "", internal: true, team: "Plant Operations" },
  { id: "c-mp", name: "Mike Peters", role: "Brandon Wetcast Manufacturing Manager", accountId: null, email: "", phone: "", internal: true, team: "Plant Operations" },
  { id: "c-jo", name: "Jane O'Connor", role: "Project advocate (title to confirm)", accountId: null, email: "", phone: "", internal: true, team: "Leadership" },
  // fictional demo staff
  { id: "c-oe", name: STAFF.olivia, role: "Estimator (demo)", accountId: null, email: "olivia.ellis@example.test", phone: "01842 000 104", internal: true, team: "Estimating" },
  { id: "c-sp", name: STAFF.sam, role: "Estimator (demo)", accountId: null, email: "sam.patel@example.test", phone: "01842 000 115", internal: true, team: "Estimating" },
  { id: "c-hc", name: STAFF.hannah, role: "Senior Estimator (demo)", accountId: null, email: "hannah.cole@example.test", phone: "01842 000 109", internal: true, team: "Estimating" },
  { id: "c-mpr", name: STAFF.megan, role: "Commercial Lead (demo)", accountId: null, email: "megan.price@example.test", phone: "01842 000 118", internal: true, team: "Commercial" },
  { id: "c-db", name: STAFF.daniel, role: "Transport Planner (demo)", accountId: null, email: "daniel.brooks@example.test", phone: "01777 000 481", internal: true, team: "Transport" },
  { id: "c-gh", name: STAFF.grace, role: "Finance Lead (demo)", accountId: null, email: "grace.hughes@example.test", phone: "01842 000 133", internal: true, team: "Finance" },
  { id: "c-tf", name: STAFF.tom, role: "Design Coordinator (demo)", accountId: null, email: "tom.fielding@example.test", phone: "01842 000 907", internal: true, team: "Design" },
  { id: "c-aw", name: STAFF.aaron, role: "Production Planner, Brandon (demo)", accountId: null, email: "aaron.webb@example.test", phone: "01842 000 221", internal: true, team: "Plant Operations" },
  { id: "c-lg", name: STAFF.lucy, role: "QA Inspector, Lound (demo)", accountId: null, email: "lucy.grant@example.test", phone: "01777 000 330", internal: true, team: "Quality/Yard" },
  { id: "c-kd", name: STAFF.kerry, role: "Credit Controller (demo)", accountId: null, email: "kerry.dunn@example.test", phone: "01842 000 140", internal: true, team: "Finance" },
  // fictional customer contacts (example.com addresses)
  { id: "x-bam", name: "Priya Nair", role: "Package Manager (demo contact)", accountId: "a-bam", email: "p.nair@example.com", phone: "020 0000 1041" },
  { id: "x-mace", name: "Joe Hartley", role: "Senior Project Manager (demo contact)", accountId: "a-mace", email: "j.hartley@example.com", phone: "020 0000 1180" },
  { id: "x-gold", name: "Anna Weiss", role: "Design Manager (demo contact)", accountId: "a-gold", email: "a.weiss@example.com", phone: "0115 000 1210" },
  { id: "x-kier", name: "Sean Doyle", role: "Site Manager (demo contact)", accountId: "a-kier", email: "s.doyle@example.com", phone: "0116 000 1250" },
  { id: "x-lor", name: "Ruth Ellison", role: "Logistics Manager (demo contact)", accountId: "a-lor", email: "r.ellison@example.com", phone: "01323 000 130" },
  { id: "x-ms", name: "Marcus Bell", role: "Project Manager (demo contact)", accountId: "a-ms", email: "m.bell@example.com", phone: "0113 000 1330" },
  { id: "x-hp", name: "Fiona Grant", role: "Buyer", accountId: "a-hp", email: "f.grant@example.com", phone: "01223 000 097" },
  { id: "x-ng", name: "Liam Barker", role: "Commercial Manager", accountId: "a-ng", email: "l.barker@example.com", phone: "0114 000 099" },
  { id: "x-cd", name: "Ruby Ashworth", role: "Quantity Surveyor", accountId: "a-cd", email: "r.ashworth@example.com", phone: "01422 000 101" },
  { id: "x-fh", name: "Owen Tibbs", role: "Technical Director", accountId: "a-fh", email: "o.tibbs@example.com", phone: "01353 000 107" },
  { id: "x-tv", name: "Nadia Shah", role: "Project Surveyor", accountId: "a-tv", email: "n.shah@example.com", phone: "01636 000 112" },
  { id: "x-ac", name: "Ben Pryce", role: "Estimating Manager", accountId: "a-ac", email: "b.pryce@example.com", phone: "01522 000 114" },
];

const accounts: Account[] = [
  { id: "a-bam", name: "BAM Construction", hq: "Hemel Hempstead", sector: "Main contractor", owner: STAFF.megan, contactIds: ["x-bam"], since: "2019", note: "Named in the current inquiry log. Two live enquiries, one estimate due 10 Nov.", lineage: L("Commercial Excel (mock)", "2026-11-06 17:20", "Mapped from inquiry log row 412") },
  { id: "a-mace", name: "Mace", hq: "London", sector: "Main contractor", owner: STAFF.megan, contactIds: ["x-mace"], since: "2017", note: "Riverside Tower awarded. Contract setup blocked on two client RFIs.", lineage: L("Commercial Excel (mock)", "2026-11-06 15:02", "Awarded-contracts tracker") },
  { id: "a-gold", name: "Goldbeck", hq: "Coventry", sector: "Design & build", owner: STAFF.megan, contactIds: ["x-gold"], since: "2021", note: "Car park specialist. Design revision R05 awaiting their approval.", lineage: L("Commercial Excel (mock)", "2026-11-05 11:40", "Awarded-contracts tracker") },
  { id: "a-kier", name: "Kier", hq: "Salford", sector: "Main contractor", owner: STAFF.megan, contactIds: ["x-kier"], since: "2016", note: "Westbridge Hospital in production at Lound. Also tendering Wharfside Block C.", lineage: L("Commercial Excel (mock)", "2026-11-04 09:15", "Awarded-contracts tracker") },
  { id: "a-lor", name: "Laing O'Rourke", hq: "Dartford", sector: "Main contractor", owner: STAFF.megan, contactIds: ["x-lor"], since: "2018", note: "Eastbourne Clinical Wing delivering. LOAD-4481 POD outstanding.", lineage: L("Commercial Excel (mock)", "2026-11-06 16:30", "Awarded-contracts tracker") },
  { id: "a-ms", name: "Morgan Sindall", hq: "London", sector: "Main contractor", owner: STAFF.megan, contactIds: ["x-ms"], since: "2018", note: "North Leeds Leisure Centre delivering. Tendering Wharfside Block C.", lineage: L("Commercial Excel (mock)", "2026-11-06 12:05", "Awarded-contracts tracker") },
  { id: "a-hp", name: "Harlow & Pike Construction", hq: "Cambridge", sector: "Regional contractor (fictional)", owner: STAFF.megan, contactIds: ["x-hp"], since: "2022", note: "Fictional demo account. Secured main contract; quote submitted.", lineage: L("Commercial Excel (mock)", "2026-10-21 14:10", "Inquiry log") },
  { id: "a-ng", name: "Northgate Build", hq: "Sheffield", sector: "Regional contractor (fictional)", owner: STAFF.megan, contactIds: ["x-ng"], since: "2020", note: "Fictional demo account. Doncaster school extension delivering.", lineage: L("Commercial Excel (mock)", "2026-11-02 10:00", "Inquiry log") },
  { id: "a-cd", name: "Calder Developments", hq: "Halifax", sector: "Developer (fictional)", owner: STAFF.megan, contactIds: ["x-cd"], since: "2023", note: "Fictional demo account.", lineage: L("Commercial Excel (mock)", "2026-11-03 13:30", "Inquiry log") },
  { id: "a-fh", name: "Fenland Homes", hq: "Ely", sector: "Housebuilder (fictional)", owner: STAFF.megan, contactIds: ["x-fh"], since: "2024", note: "Fictional demo account. Beam & block.", lineage: L("Commercial Excel (mock)", "2026-11-05 08:45", "Inquiry log") },
  { id: "a-tv", name: "Trent Valley Contractors", hq: "Newark", sector: "Regional contractor (fictional)", owner: STAFF.megan, contactIds: ["x-tv"], since: "2021", note: "Fictional demo account. Care home on hold for client funding.", lineage: L("Commercial Excel (mock)", "2026-10-30 16:00", "Inquiry log") },
  { id: "a-ac", name: "Ashby Civil", hq: "Lincoln", sector: "Regional contractor (fictional)", owner: STAFF.megan, contactIds: ["x-ac"], since: "2022", note: "Fictional demo account.", lineage: L("Commercial Excel (mock)", "2026-10-28 12:00", "Inquiry log") },
];

const devs: Development[] = [
  { id: "d-meridian", name: "Meridian House", town: "Milton Keynes", county: "Buckinghamshire", sector: "Office", lineage: L("Commercial Excel (mock)", "2026-10-28 10:12", "Created from BAM enquiry email") },
  { id: "d-riverside", name: "Riverside Tower", town: "Reading", county: "Berkshire", sector: "Residential", lineage: L("Commercial Excel (mock)", "2026-09-02 09:00", "Inquiry log") },
  { id: "d-emmscp", name: "East Midlands MSCP", town: "Derby", county: "Derbyshire", sector: "Car park", lineage: L("Commercial Excel (mock)", "2026-07-14 09:00", "Inquiry log") },
  { id: "d-westbridge", name: "Westbridge Hospital", town: "Leicester", county: "Leicestershire", sector: "Healthcare", lineage: L("Commercial Excel (mock)", "2026-06-30 09:00", "Inquiry log") },
  { id: "d-eastbourne", name: "Eastbourne Clinical Wing", town: "Eastbourne", county: "East Sussex", sector: "Healthcare", lineage: L("Commercial Excel (mock)", "2026-06-02 09:00", "Inquiry log") },
  { id: "d-northleeds", name: "North Leeds Leisure Centre", town: "Leeds", county: "West Yorkshire", sector: "Leisure", lineage: L("Commercial Excel (mock)", "2026-05-19 09:00", "Inquiry log") },
  { id: "d-cambridge", name: "Cambridge Science Park Building 4", town: "Cambridge", county: "Cambridgeshire", sector: "Laboratory", lineage: L("Commercial Excel (mock)", "2026-09-29 09:00", "Inquiry log") },
  { id: "d-sheffield", name: "Sheffield Riverside Apartments", town: "Sheffield", county: "South Yorkshire", sector: "Residential", lineage: L("Commercial Excel (mock)", "2026-10-06 09:00", "Inquiry log") },
  { id: "d-halifax", name: "Halifax Retail Park Phase 2", town: "Halifax", county: "West Yorkshire", sector: "Retail", lineage: L("Commercial Excel (mock)", "2026-10-15 09:00", "Inquiry log") },
  { id: "d-peterborough", name: "Peterborough Logistics MSCP", town: "Peterborough", county: "Cambridgeshire", sector: "Car park", lineage: L("Commercial Excel (mock)", "2026-10-30 09:00", "Inquiry log") },
  { id: "d-ely", name: "Ely Riverside Phase 3", town: "Ely", county: "Cambridgeshire", sector: "Residential", lineage: L("Commercial Excel (mock)", "2026-11-02 09:00", "Inquiry log") },
  { id: "d-wharfside", name: "Wharfside Quarter Block C", town: "Nottingham", county: "Nottinghamshire", sector: "Mixed use", lineage: L("Commercial Excel (mock)", "2026-10-19 09:00", "Two contractors tendering the same building") },
  { id: "d-newark", name: "Newark Care Home", town: "Newark", county: "Nottinghamshire", sector: "Care", lineage: L("Commercial Excel (mock)", "2026-09-22 09:00", "Inquiry log") },
  { id: "d-norwich", name: "Norwich Research Hub", town: "Norwich", county: "Norfolk", sector: "Laboratory", lineage: L("Commercial Excel (mock)", "2026-08-18 09:00", "Inquiry log") },
  { id: "d-lincoln", name: "Lincoln Student Living", town: "Lincoln", county: "Lincolnshire", sector: "Student housing", lineage: L("Commercial Excel (mock)", "2026-08-25 09:00", "Inquiry log") },
  { id: "d-coventry", name: "Coventry Data Centre Annex", town: "Coventry", county: "West Midlands", sector: "Data centre", lineage: L("Commercial Excel (mock)", "2026-11-03 09:00", "Inquiry log") },
  { id: "d-grantham", name: "Grantham Leisure Village", town: "Grantham", county: "Lincolnshire", sector: "Leisure", lineage: L("Commercial Excel (mock)", "2026-11-05 09:00", "Inquiry log") },
  { id: "d-doncaster", name: "Doncaster Primary School Extension", town: "Doncaster", county: "South Yorkshire", sector: "Education", lineage: L("Commercial Excel (mock)", "2026-04-14 09:00", "Inquiry log") },
  { id: "d-wakefield", name: "Wakefield Office Refurbishment", town: "Wakefield", county: "West Yorkshire", sector: "Office", lineage: L("Commercial Excel (mock)", "2026-05-11 09:00", "Inquiry log") },
];

/* ── commercial ─────────────────────────────────────────────────────────── */
const E = (o: Omit<Enquiry, "lineage"> & { lineage?: Enquiry["lineage"] }): Enquiry =>
  ({ lineage: L("Commercial Excel (mock)", o.received + " 09:00", "Imported from inquiry log", "High"), ...o });

const enquiries: Enquiry[] = [
  E({ id: "INQ-26-104", received: "2026-10-28", accountId: "a-bam", devId: "d-meridian", contractorStatus: "Tendering", products: ["Hollowcore", "Stairs & landings"], drawings: 14, estimator: STAFF.olivia, due: "2026-11-10", value: 1240000, urgency: "Critical", quoteId: "QUO-26-104", source: "Email", m2: 6800, plantPref: "Brandon", lineage: L("Email intake (simulated)", "2026-10-28 10:12", "Confirmed by estimator", "High") }),
  E({ id: "INQ-26-061", received: "2026-06-02", accountId: "a-lor", devId: "d-eastbourne", contractorStatus: "Secured", products: ["Hollowcore", "Stairs & landings"], drawings: 22, estimator: STAFF.hannah, due: "2026-06-12", value: 960000, urgency: "Normal", quoteId: "QUO-26-061", source: "Email" }),
  E({ id: "INQ-26-066", received: "2026-05-19", accountId: "a-ms", devId: "d-northleeds", contractorStatus: "Secured", products: ["Hollowcore", "Bespoke"], drawings: 18, estimator: STAFF.sam, due: "2026-05-29", value: 1320000, urgency: "Normal", quoteId: "QUO-26-066", source: "Email" }),
  E({ id: "INQ-26-072", received: "2026-06-30", accountId: "a-kier", devId: "d-westbridge", contractorStatus: "Secured", products: ["Hollowcore"], drawings: 26, estimator: STAFF.hannah, due: "2026-07-10", value: 1480000, urgency: "Normal", quoteId: "QUO-26-072", source: "Tender portal" }),
  E({ id: "INQ-26-079", received: "2026-07-14", accountId: "a-gold", devId: "d-emmscp", contractorStatus: "Secured", products: ["Hollowcore", "Bespoke"], drawings: 31, estimator: STAFF.olivia, due: "2026-07-24", value: 1160000, urgency: "Normal", quoteId: "QUO-26-079", source: "Email" }),
  E({ id: "INQ-26-088", received: "2026-09-02", accountId: "a-mace", devId: "d-riverside", contractorStatus: "Secured", products: ["Hollowcore", "Stairs & landings", "Lift shafts"], drawings: 38, estimator: STAFF.hannah, due: "2026-09-16", value: 2850000, urgency: "High", quoteId: "QUO-26-088", source: "Email" }),
  E({ id: "INQ-26-041", received: "2026-04-14", accountId: "a-ng", devId: "d-doncaster", contractorStatus: "Secured", products: ["Hollowcore", "Beam & block"], drawings: 9, estimator: STAFF.sam, due: "2026-04-24", value: 284000, urgency: "Normal", quoteId: "QUO-26-041", source: "Phone" }),
  E({ id: "INQ-26-052", received: "2026-05-11", accountId: "a-cd", devId: "d-wakefield", contractorStatus: "Secured", products: ["Hollowcore"], drawings: 7, estimator: STAFF.sam, due: "2026-05-21", value: 176000, urgency: "Normal", quoteId: "QUO-26-052", source: "Email" }),
  // live pipeline
  E({ id: "INQ-26-097", received: "2026-09-29", accountId: "a-hp", devId: "d-cambridge", contractorStatus: "Secured", products: ["Hollowcore"], drawings: 11, estimator: STAFF.sam, due: "2026-10-21", value: 418000, urgency: "High", quoteId: "QUO-26-097", source: "Email", m2: 1500, plantPref: "Lound" }),
  E({ id: "INQ-26-099", received: "2026-10-06", accountId: "a-ng", devId: "d-sheffield", contractorStatus: "Tendering", products: ["Beam & block", "Stairs & landings"], drawings: 8, estimator: STAFF.hannah, due: "2026-10-27", value: 356000, urgency: "Normal", quoteId: "QUO-26-099", source: "Email" }),
  E({ id: "INQ-26-101", received: "2026-10-15", accountId: "a-cd", devId: "d-halifax", contractorStatus: "Unknown", products: ["Hollowcore"], drawings: 6, estimator: STAFF.sam, due: "2026-11-06", value: 212000, urgency: "Normal", quoteId: "QUO-26-101", source: "Email" }),
  E({ id: "INQ-26-106", received: "2026-10-30", accountId: "a-gold", devId: "d-peterborough", contractorStatus: "Tendering", products: ["Hollowcore", "Bespoke"], drawings: 19, estimator: STAFF.olivia, due: "2026-11-11", value: 690000, urgency: "High", quoteId: "QUO-26-106", source: "Email" }),
  E({ id: "INQ-26-107", received: "2026-11-02", accountId: "a-fh", devId: "d-ely", contractorStatus: "Secured", products: ["Beam & block"], drawings: 5, estimator: null, due: "2026-11-20", value: 148000, urgency: "Normal", quoteId: "QUO-26-107", source: "Phone" }),
  E({ id: "INQ-26-109", received: "2026-10-19", accountId: "a-kier", devId: "d-wharfside", contractorStatus: "Tendering", products: ["Hollowcore", "Stairs & landings"], drawings: 16, estimator: STAFF.hannah, due: "2026-11-02", value: 540000, urgency: "Normal", quoteId: "QUO-26-109", source: "Tender portal" }),
  E({ id: "INQ-26-111", received: "2026-10-23", accountId: "a-ms", devId: "d-wharfside", contractorStatus: "Tendering", products: ["Hollowcore", "Stairs & landings"], drawings: 16, estimator: STAFF.sam, due: "2026-11-13", value: 525000, urgency: "Normal", quoteId: "QUO-26-111", source: "Email" }),
  E({ id: "INQ-26-112", received: "2026-09-22", accountId: "a-tv", devId: "d-newark", contractorStatus: "Secured", products: ["Twinwall", "Stairs & landings"], drawings: 6, estimator: STAFF.hannah, due: "2026-10-09", value: 96000, urgency: "Normal", quoteId: "QUO-26-112", source: "Email" }),
  E({ id: "INQ-26-093", received: "2026-08-18", accountId: "a-lor", devId: "d-norwich", contractorStatus: "Tendering", products: ["Hollowcore", "Lift shafts"], drawings: 24, estimator: STAFF.olivia, due: "2026-09-04", value: 780000, urgency: "Normal", quoteId: "QUO-26-093", source: "Tender portal" }),
  E({ id: "INQ-26-095", received: "2026-08-25", accountId: "a-ac", devId: "d-lincoln", contractorStatus: "Secured", products: ["Hollowcore", "Stairs & landings"], drawings: 12, estimator: STAFF.sam, due: "2026-09-09", value: 402000, urgency: "Normal", quoteId: "QUO-26-095", source: "Email" }),
  E({ id: "INQ-26-115", received: "2026-11-03", accountId: "a-bam", devId: "d-coventry", contractorStatus: "Unknown", products: ["Hollowcore", "Lift shafts"], drawings: 21, estimator: STAFF.sam, due: "2026-11-18", value: 1050000, urgency: "High", quoteId: "QUO-26-115", source: "Email" }),
  E({ id: "INQ-26-116", received: "2026-11-05", accountId: "a-kier", devId: "d-grantham", contractorStatus: "Tendering", products: ["Hollowcore"], drawings: 9, estimator: null, due: "2026-11-24", value: 330000, urgency: "Normal", quoteId: "QUO-26-116", source: "Email" }),
];

const checklist = (done: boolean[]): QuoteCheck[] => [
  { key: "drawings", label: "ITT drawing pack registered", done: done[0] },
  { key: "quantities", label: "Quantities taken off by category", done: done[1] },
  { key: "exclusions", label: "Exclusions and assumptions written", done: done[2] },
  { key: "design", label: "Design questions logged", done: done[3] },
  { key: "review", label: "Manager review complete", done: done[4] },
];
const Q = (id: string, enquiryId: string, status: Quote["status"], value: number, probability: number, done: boolean[], extra: Partial<Quote> = {}): Quote => ({
  id, enquiryId, status, revision: "A", value, probability, checklist: checklist(done), clarifications: [], history: [],
  reviewer: null, approved: status === "Won" || status === "Quote submitted" || status === "Negotiation",
  exclusions: ["Temporary works and propping", "Site levelling and hardstanding for crane", "Screed and finishes"], ...extra,
});

const quotes: Quote[] = [
  Q("QUO-26-104", "INQ-26-104", "Estimating", 1240000, 0.35, [true, true, true, true, false], {
    revision: "A (draft)", reviewer: STAFF.hannah,
    clarifications: [{ at: "2026-11-04 14:20", text: "Stair core 2 landing levels differ between GA and section drawings. Asked BAM to confirm.", by: STAFF.olivia, open: true }],
    history: [{ at: "2026-10-28 10:12", text: "Enquiry logged from email, 14 drawing packages" }, { at: "2026-10-29 09:00", text: "Assigned to Olivia Ellis" }, { at: "2026-11-06 16:40", text: "Take-off complete. Indicative £1,240,000 under preparation, not sent" }],
  }),
  Q("QUO-26-061", "INQ-26-061", "Won", 960000, 1, [true, true, true, true, true], { revision: "C", submitted: "2026-06-12", history: [{ at: "2026-06-26", text: "Won. Order ORD-26-130 created" }] }),
  Q("QUO-26-066", "INQ-26-066", "Won", 1320000, 1, [true, true, true, true, true], { revision: "B", submitted: "2026-05-29", history: [{ at: "2026-06-15", text: "Won. Order ORD-26-133 created" }] }),
  Q("QUO-26-072", "INQ-26-072", "Won", 1480000, 1, [true, true, true, true, true], { revision: "B", submitted: "2026-07-10", history: [{ at: "2026-07-28", text: "Won. Order ORD-26-125 created" }] }),
  Q("QUO-26-079", "INQ-26-079", "Won", 1160000, 1, [true, true, true, true, true], { revision: "B", submitted: "2026-07-24", history: [{ at: "2026-08-11", text: "Won. Order ORD-26-121 created" }] }),
  Q("QUO-26-088", "INQ-26-088", "Won", 2850000, 1, [true, true, true, true, true], { revision: "D", submitted: "2026-09-16", history: [{ at: "2026-10-26", text: "Won. Order ORD-26-118 created" }] }),
  Q("QUO-26-041", "INQ-26-041", "Won", 284000, 1, [true, true, true, true, true], { submitted: "2026-04-24" }),
  Q("QUO-26-052", "INQ-26-052", "Won", 176000, 1, [true, true, true, true, true], { submitted: "2026-05-21" }),
  Q("QUO-26-097", "INQ-26-097", "Quote submitted", 418000, 0.6, [true, true, true, true, true], { revision: "B", submitted: "2026-10-21", history: [{ at: "2026-10-21 15:30", text: "Submitted after manager review" }] }),
  Q("QUO-26-099", "INQ-26-099", "Negotiation", 356000, 0.45, [true, true, true, true, true], { revision: "C", submitted: "2026-10-27", history: [{ at: "2026-11-03 11:00", text: "Client asked for alternative stair finish price" }] }),
  Q("QUO-26-101", "INQ-26-101", "Estimating", 212000, 0.3, [true, true, false, false, false], { reviewer: STAFF.hannah }),
  Q("QUO-26-106", "INQ-26-106", "Estimating", 690000, 0.3, [true, true, true, false, false], { reviewer: STAFF.hannah, clarifications: [{ at: "2026-11-05 10:05", text: "Ramp splice detail missing from pack 7. Requested from Goldbeck.", by: STAFF.olivia, open: true }] }),
  Q("QUO-26-107", "INQ-26-107", "Inquiry", 148000, 0.5, [true, false, false, false, false]),
  Q("QUO-26-109", "INQ-26-109", "Quote submitted", 540000, 0.25, [true, true, true, true, true], { revision: "A", submitted: "2026-11-02" }),
  Q("QUO-26-111", "INQ-26-111", "Estimating", 525000, 0.25, [true, true, false, false, false], { reviewer: STAFF.hannah }),
  Q("QUO-26-112", "INQ-26-112", "On hold", 96000, 0.2, [true, true, true, true, true], { submitted: "2026-10-09", history: [{ at: "2026-10-30", text: "Client funding paused. On hold until January" }] }),
  Q("QUO-26-093", "INQ-26-093", "Lost", 780000, 0, [true, true, true, true, true], { submitted: "2026-09-04", lostReason: "Contractor did not secure the main contract" }),
  Q("QUO-26-095", "INQ-26-095", "Lost", 402000, 0, [true, true, true, true, true], { submitted: "2026-09-09", lostReason: "Lost on programme: required start before our earliest slot" }),
  Q("QUO-26-115", "INQ-26-115", "Estimating", 1050000, 0.2, [true, false, false, false, false], { reviewer: STAFF.hannah }),
  Q("QUO-26-116", "INQ-26-116", "Inquiry", 330000, 0.25, [false, false, false, false, false]),
];

/* ── contract & orders ──────────────────────────────────────────────────── */
const contract = (o: { customer: string; site: string; ref: string; products: string; value: string; programme: string; contact: string; access: string; lifting: string; delivery: string; stages: string }): ContractField[] => [
  { key: "customer", label: "Customer", value: o.customer, inherited: "Account" },
  { key: "site", label: "Project site", value: o.site, inherited: "Development" },
  { key: "ref", label: "Contractor reference", value: o.ref },
  { key: "products", label: "Agreed products", value: o.products, inherited: "Quotation" },
  { key: "value", label: "Contract value (net)", value: o.value, inherited: "Quotation" },
  { key: "stages", label: "Stages and milestones", value: o.stages },
  { key: "programme", label: "Expected programme", value: o.programme },
  { key: "contact", label: "Site contact", value: o.contact, inherited: "Contact" },
  { key: "access", label: "Site access", value: o.access },
  { key: "lifting", label: "Lifting and unloading", value: o.lifting },
  { key: "delivery", label: "Delivery constraints", value: o.delivery },
];

const orders: Order[] = [
  { id: "ORD-26-118", quoteId: "QUO-26-088", accountId: "a-mace", devId: "d-riverside", value: 2850000, awarded: "2026-10-26", lead: STAFF.megan + " · Commercial Lead (demo)",
    products: ["Hollowcore", "Stairs & landings", "Lift shafts"], programme: "Deliveries Jan to Apr 2027 (to confirm)", portal: "Contract information required", customerContactId: "x-mace",
    contract: contract({ customer: "Mace", site: "Riverside Tower, Reading", ref: "MACE-RT-PC-07", products: "Hollowcore 11,400 m², 18 stair flights, 2 lift shafts", value: "£2,850,000", programme: "Jan to Apr 2027, 4 phases (to confirm)", contact: "Joe Hartley (demo contact)", access: "Gate 2 off Kennet Side, booking 48 h ahead", lifting: "Awaiting crane positions (RFI-1032)", delivery: "No deliveries 07:30-09:00 school run", stages: "Award · Contract setup · Design · Production · Delivery in 4 phases" }),
    contractApproved: false, design: "Awaiting information", capacity: "Tentative", production: "Not released", quality: "Not started", dispatch: "Not planned", pod: "Not due", invoice: "Not due",
    clientUpdated: "2026-11-06 15:02", nextHandoff: "Design handover once RFI-1032 and RFI-1034 are answered", lineage: L("Commercial Excel (mock)", "2026-11-06 15:02", "Awarded-contracts tracker, row 118", "High") },
  { id: "ORD-26-121", quoteId: "QUO-26-079", accountId: "a-gold", devId: "d-emmscp", value: 1160000, awarded: "2026-08-11", lead: STAFF.megan + " · Commercial Lead (demo)",
    products: ["Hollowcore", "Bespoke"], programme: "Deliveries Dec 2026 to Feb 2027", portal: "Drawings awaiting your approval", customerContactId: "x-gold",
    contract: contract({ customer: "Goldbeck", site: "East Midlands MSCP, Derby", ref: "GB-EM-0451", products: "Hollowcore 7,900 m², bespoke ramp units", value: "£1,160,000", programme: "Dec 2026 to Feb 2027", contact: "Anna Weiss (demo contact)", access: "Site entrance off Wyvern Way", lifting: "Contractor crane, 60 t mobile", delivery: "Max 6 loads per day", stages: "Design · Production · Delivery in 3 decks" }),
    contractApproved: true, design: "Awaiting client approval", capacity: "Tentative", production: "Not released", quality: "Not started", dispatch: "Not planned", pod: "Not due", invoice: "Not due",
    clientUpdated: "2026-11-05 11:40", nextHandoff: "Production release after client signs off R05", lineage: L("Commercial Excel (mock)", "2026-11-05 11:40", "Awarded-contracts tracker, row 121", "High") },
  { id: "ORD-26-125", quoteId: "QUO-26-072", accountId: "a-kier", devId: "d-westbridge", value: 1480000, awarded: "2026-07-28", lead: STAFF.megan + " · Commercial Lead (demo)",
    products: ["Hollowcore"], programme: "Deliveries Nov 2026 to Jan 2027", portal: "In production", customerContactId: "x-kier",
    contract: contract({ customer: "Kier", site: "Westbridge Hospital, Leicester", ref: "KIER-WBH-2231", products: "Hollowcore 9,800 m²", value: "£1,480,000", programme: "Nov 2026 to Jan 2027", contact: "Sean Doyle (demo contact)", access: "Hospital estate, banksman required", lifting: "Tower crane TC2", delivery: "Deliveries 09:30-15:00 only", stages: "Design · Production at Lound · Delivery by level" }),
    contractApproved: true, design: "Released for production", capacity: "Allocated", production: "Casting", quality: "Inspection pending", dispatch: "Planned", pod: "Not due", invoice: "Issued",
    clientUpdated: "2026-11-06 09:30", nextHandoff: "First Lound loads 10 Nov", lineage: L("Commercial Excel (mock)", "2026-11-04 09:15", "Awarded-contracts tracker, row 125", "High") },
  { id: "ORD-26-130", quoteId: "QUO-26-061", accountId: "a-lor", devId: "d-eastbourne", value: 960000, awarded: "2026-06-26", lead: STAFF.megan + " · Commercial Lead (demo)",
    products: ["Hollowcore", "Stairs & landings"], programme: "Deliveries Oct to Dec 2026", portal: "Delivering", customerContactId: "x-lor",
    contract: contract({ customer: "Laing O'Rourke", site: "Eastbourne Clinical Wing", ref: "LOR-ECW-118", products: "Hollowcore 6,200 m², 8 stair flights", value: "£960,000", programme: "Oct to Dec 2026", contact: "Ruth Ellison (demo contact)", access: "Kings Drive entrance", lifting: "Mobile crane, contractor supplied", delivery: "Receiver signature required on every load", stages: "Production at Brandon · Delivery by block" }),
    contractApproved: true, design: "Released for production", capacity: "Allocated", production: "Casting", quality: "Released", dispatch: "Delivering", pod: "Awaiting POD", invoice: "Held",
    clientUpdated: "2026-11-06 16:30", nextHandoff: "Verified POD for LOAD-4481", lineage: L("Commercial Excel (mock)", "2026-11-06 16:30", "Awarded-contracts tracker, row 130", "High") },
  { id: "ORD-26-133", quoteId: "QUO-26-066", accountId: "a-ms", devId: "d-northleeds", value: 1320000, awarded: "2026-06-15", lead: STAFF.megan + " · Commercial Lead (demo)",
    products: ["Hollowcore", "Bespoke"], programme: "Deliveries Oct to Dec 2026", portal: "Delivering", customerContactId: "x-ms",
    contract: contract({ customer: "Morgan Sindall", site: "North Leeds Leisure Centre", ref: "MS-NLLC-77", products: "Hollowcore 8,300 m², bespoke pool-hall beams", value: "£1,320,000", programme: "Oct to Dec 2026", contact: "Marcus Bell (demo contact)", access: "Off Ring Road, one-way system", lifting: "Contractor crane", delivery: "Two loads per day maximum", stages: "Production at Brandon and Lound · Delivery by zone" }),
    contractApproved: true, design: "Released for production", capacity: "Allocated", production: "Casting", quality: "Released", dispatch: "Delivering", pod: "Verified", invoice: "Ready for finance review",
    clientUpdated: "2026-11-06 12:05", nextHandoff: "Finance review of draft for LOAD-4484", lineage: L("Commercial Excel (mock)", "2026-11-06 12:05", "Awarded-contracts tracker, row 133", "High") },
  { id: "ORD-26-112", quoteId: "QUO-26-041", accountId: "a-ng", devId: "d-doncaster", value: 284000, awarded: "2026-05-06", lead: STAFF.megan + " · Commercial Lead (demo)",
    products: ["Hollowcore", "Beam & block"], programme: "Deliveries Sep to Nov 2026", portal: "Delivering", customerContactId: "x-ng",
    contract: contract({ customer: "Northgate Build", site: "Doncaster Primary School Extension", ref: "NGB-DPS-12", products: "Hollowcore 1,900 m², beam & block 800 m²", value: "£284,000", programme: "Sep to Nov 2026", contact: "Liam Barker", access: "School holidays only for heavy loads", lifting: "HIAB on carrier", delivery: "Deliveries 09:30-14:30", stages: "Production · Delivery in 2 phases" }),
    contractApproved: true, design: "Released for production", capacity: "Allocated", production: "Complete", quality: "Released", dispatch: "Delivering", pod: "Verified", invoice: "Issued",
    clientUpdated: "2026-11-04 14:00", nextHandoff: "Final load 13 Nov", lineage: L("Commercial Excel (mock)", "2026-11-02 10:00", "Awarded-contracts tracker", "High") },
  { id: "ORD-26-127", quoteId: "QUO-26-052", accountId: "a-cd", devId: "d-wakefield", value: 176000, awarded: "2026-06-01", lead: STAFF.megan + " · Commercial Lead (demo)",
    products: ["Hollowcore"], programme: "Deliveries Nov 2026", portal: "Delivering", customerContactId: "x-cd",
    contract: contract({ customer: "Calder Developments", site: "Wakefield Office Refurbishment", ref: "CD-WOR-03", products: "Hollowcore 1,200 m²", value: "£176,000", programme: "Nov 2026", contact: "Ruby Ashworth", access: "Rear service yard", lifting: "Contractor crane", delivery: "Weekdays only", stages: "Production at Brandon · Delivery" }),
    contractApproved: true, design: "Released for production", capacity: "Allocated", production: "Casting", quality: "Released", dispatch: "Delivering", pod: "Exception", invoice: "Held",
    clientUpdated: "2026-11-05 15:20", nextHandoff: "Resolve LOAD-4482 quantity query", lineage: L("Commercial Excel (mock)", "2026-11-03 13:30", "Awarded-contracts tracker", "High") },
];

const rfis: Rfi[] = [
  { id: "RFI-1031", orderId: "ORD-26-118", question: "Confirm site postcode and delivery gate for heavy loads", blocking: false, owner: STAFF.megan, due: "2026-10-30", status: "Resolved", raised: "2026-10-27", reminders: [], response: "Gate 2 off Kennet Side. Booking 48 hours ahead.", respondedBy: "Joe Hartley (Mace)", area: "Logistics" },
  { id: "RFI-1032", orderId: "ORD-26-118", question: "Confirm tower crane positions and lifting radius for core A slabs", blocking: true, owner: STAFF.megan, due: "2026-11-11", status: "Awaiting customer", raised: "2026-10-27", reminders: ["2026-11-03", "2026-11-06"], area: "Design" },
  { id: "RFI-1033", orderId: "ORD-26-118", question: "Confirm fire rating for floor zones above car park", blocking: false, owner: STAFF.tom, due: "2026-11-02", status: "Resolved", raised: "2026-10-27", reminders: [], response: "REI 90 throughout, REI 120 over car park.", respondedBy: "Joe Hartley (Mace)", area: "Design" },
  { id: "RFI-1034", orderId: "ORD-26-118", question: "Confirm steel bearing details at level 3 transfer beams", blocking: true, owner: STAFF.tom, due: "2026-11-11", status: "Awaiting customer", raised: "2026-10-28", reminders: ["2026-11-04"], area: "Design" },
  { id: "RFI-1035", orderId: "ORD-26-118", question: "Confirm permitted delivery hours during school term", blocking: false, owner: STAFF.daniel, due: "2026-11-18", status: "Awaiting customer", raised: "2026-10-28", reminders: [], area: "Logistics" },
  { id: "RFI-1036", orderId: "ORD-26-118", question: "Confirm services penetrations schedule (MEP) for levels 4 to 12", blocking: false, owner: STAFF.tom, due: "2026-11-25", status: "Awaiting customer", raised: "2026-10-29", reminders: [], area: "Design" },
  { id: "RFI-1037", orderId: "ORD-26-118", question: "Confirm invoicing contact and application-for-payment dates", blocking: false, owner: STAFF.grace, due: "2026-11-04", status: "Resolved", raised: "2026-10-27", reminders: [], response: "Monthly valuation on the 25th. Invoices to accounts payable inbox.", respondedBy: "Joe Hartley (Mace)", area: "Finance" },
  { id: "RFI-1029", orderId: "ORD-26-121", question: "Comments on ramp unit connection detail (R04)", blocking: false, owner: STAFF.tom, due: "2026-10-30", status: "Resolved", raised: "2026-10-20", reminders: [], response: "Comments returned 29 Oct. Incorporated in R05.", respondedBy: "Anna Weiss (Goldbeck)", area: "Design" },
  { id: "RFI-1040", orderId: "ORD-26-130", question: "Nominate receiver for after-hours deliveries", blocking: false, owner: STAFF.daniel, due: "2026-10-20", status: "Resolved", raised: "2026-10-14", reminders: [], response: "Site gateman signs after 16:00.", respondedBy: "Ruth Ellison (Laing O'Rourke)", area: "Logistics" },
];

export const DOC_TYPES = [
  "Award acknowledgement", "Contract information request", "Programme confirmation", "Design information request",
  "Delivery requirements", "QA and documentation handover", "Variation / change notice",
];
const docs: Doc[] = [
  { id: "DOC-118-1", orderId: "ORD-26-118", type: DOC_TYPES[0], status: "Sent (simulated)", updated: "2026-10-27 10:20", body: "" },
  { id: "DOC-118-2", orderId: "ORD-26-118", type: DOC_TYPES[1], status: "Approved", updated: "2026-10-28 09:10", body: "" },
  { id: "DOC-121-1", orderId: "ORD-26-121", type: DOC_TYPES[0], status: "Sent (simulated)", updated: "2026-08-12 09:00", body: "" },
  { id: "DOC-121-4", orderId: "ORD-26-121", type: DOC_TYPES[3], status: "Sent (simulated)", updated: "2026-10-20 11:00", body: "" },
];

/* ── iThesis (illustrative read-only snapshots) ────────────────────────── */
const designs: DesignPackage[] = [
  { id: "ITH-DES-0907", orderId: "ORD-26-121", revision: "R05", status: "Awaiting client approval", target: "2026-11-12", released: false, missing: [], coordinator: STAFF.tom, synced: "2026-11-09 08:40",
    revisions: [{ rev: "R03", at: "2026-09-22", note: "Deck 1 layout issued" }, { rev: "R04", at: "2026-10-16", note: "Ramp connection revised" }, { rev: "R05", at: "2026-11-02", note: "Client comments from RFI-1029 incorporated" }] },
  { id: "ITH-DES-0931", orderId: "ORD-26-118", revision: "R00", status: "Awaiting information", target: "2026-11-27", released: false, missing: ["Crane positions (RFI-1032)", "Transfer beam bearings (RFI-1034)"], coordinator: STAFF.tom, synced: "2026-11-09 08:40",
    revisions: [{ rev: "R00", at: "2026-10-27", note: "Package opened from award" }] },
  { id: "ITH-DES-0899", orderId: "ORD-26-125", revision: "R03", status: "Released for production", target: "2026-09-18", released: true, missing: [], coordinator: STAFF.tom, synced: "2026-11-09 08:40",
    revisions: [{ rev: "R03", at: "2026-09-16", note: "Released for production" }] },
  { id: "ITH-DES-0912", orderId: "ORD-26-130", revision: "R04", status: "Released for production", target: "2026-08-21", released: true, missing: [], coordinator: STAFF.tom, synced: "2026-11-09 08:40", revisions: [{ rev: "R04", at: "2026-08-19", note: "Released for production" }] },
  { id: "ITH-DES-0915", orderId: "ORD-26-133", revision: "R02", status: "Released for production", target: "2026-08-07", released: true, missing: [], coordinator: STAFF.tom, synced: "2026-11-09 08:40", revisions: [{ rev: "R02", at: "2026-08-05", note: "Released for production" }] },
  { id: "ITH-DES-0886", orderId: "ORD-26-112", revision: "R02", status: "Released for production", target: "2026-07-03", released: true, missing: [], coordinator: STAFF.tom, synced: "2026-11-09 08:40", revisions: [{ rev: "R02", at: "2026-07-01", note: "Released for production" }] },
  { id: "ITH-DES-0920", orderId: "ORD-26-127", revision: "R01", status: "Released for production", target: "2026-09-04", released: true, missing: [], coordinator: STAFF.tom, synced: "2026-11-09 08:40", revisions: [{ rev: "R01", at: "2026-09-02", note: "Released for production" }] },
];

/* Hollowcore commitments. Week of 09 Nov: Brandon 4,800 m², Lound 2,900 m² (Kier 2,400 m² included). */
const C = (id: string, ref: { kind: any; id: string }, label: string, plant: "Brandon" | "Lound", m2: number, week: string, firm: boolean): Commitment =>
  ({ id, ref, label, plant, product: "Hollowcore", m2, week, firm });
const commitments: Commitment[] = [
  C("CAP-01", { kind: "order", id: "ORD-26-133" }, "Morgan Sindall · North Leeds", "Brandon", 1600, WEEKS[0], true),
  C("CAP-02", { kind: "order", id: "ORD-26-130" }, "Laing O'Rourke · Eastbourne", "Brandon", 1100, WEEKS[0], true),
  C("CAP-03", { kind: "order", id: "ORD-26-112" }, "Northgate Build · Doncaster", "Brandon", 900, WEEKS[0], true),
  C("CAP-04", { kind: "order", id: "ORD-26-127" }, "Calder Developments · Wakefield", "Brandon", 1200, WEEKS[0], true),
  C("CAP-05", { kind: "order", id: "ORD-26-125" }, "Kier · Westbridge Hospital", "Lound", 2400, WEEKS[0], true),
  C("CAP-06", { kind: "order", id: "ORD-26-130" }, "Laing O'Rourke · Eastbourne", "Lound", 500, WEEKS[0], true),
  // following weeks
  C("CAP-11", { kind: "order", id: "ORD-26-133" }, "Morgan Sindall · North Leeds", "Brandon", 1800, WEEKS[1], true),
  C("CAP-12", { kind: "order", id: "ORD-26-130" }, "Laing O'Rourke · Eastbourne", "Brandon", 1300, WEEKS[1], true),
  C("CAP-13", { kind: "order", id: "ORD-26-125" }, "Kier · Westbridge Hospital", "Lound", 2600, WEEKS[1], true),
  C("CAP-14", { kind: "order", id: "ORD-26-112" }, "Northgate Build · Doncaster", "Lound", 400, WEEKS[1], true),
  C("CAP-21", { kind: "order", id: "ORD-26-125" }, "Kier · Westbridge Hospital", "Lound", 2500, WEEKS[2], true),
  C("CAP-22", { kind: "order", id: "ORD-26-133" }, "Morgan Sindall · North Leeds", "Brandon", 1500, WEEKS[2], true),
  C("CAP-23", { kind: "order", id: "ORD-26-121" }, "Goldbeck · East Midlands MSCP (pending R05)", "Brandon", 2000, WEEKS[2], false),
  C("CAP-24", { kind: "order", id: "ORD-26-118" }, "Mace · Riverside Tower (pending RFIs)", "Brandon", 1800, WEEKS[3], false),
  C("CAP-31", { kind: "order", id: "ORD-26-125" }, "Kier · Westbridge Hospital", "Lound", 2300, WEEKS[3], true),
  C("CAP-32", { kind: "order", id: "ORD-26-121" }, "Goldbeck · East Midlands MSCP (pending R05)", "Brandon", 2600, WEEKS[3], false),
  C("CAP-41", { kind: "order", id: "ORD-26-125" }, "Kier · Westbridge Hospital", "Lound", 1800, WEEKS[4], true),
  C("CAP-42", { kind: "order", id: "ORD-26-121" }, "Goldbeck · East Midlands MSCP (pending R05)", "Brandon", 2600, WEEKS[4], false),
  C("CAP-43", { kind: "order", id: "ORD-26-118" }, "Mace · Riverside Tower (pending RFIs)", "Lound", 1500, WEEKS[5], false),
];

const lots: Lot[] = [
  { id: "LOT-B-2291", orderId: "ORD-26-130", plant: "Brandon", product: "Hollowcore", units: 46, m2: 520, planned: "2026-11-03", actual: "2026-11-04", status: "Complete", qa: "Released", yard: "Brandon Yard B4", inspector: "Brandon QA (demo)", note: "Loaded onto LOAD-4481", synced: "2026-11-09 08:40" },
  { id: "LOT-B-2296", orderId: "ORD-26-130", plant: "Brandon", product: "Hollowcore", units: 44, m2: 500, planned: "2026-11-06", actual: "2026-11-06", status: "Complete", qa: "Released", yard: "Brandon Yard B2", inspector: "Brandon QA (demo)", note: "Staged for LOAD-4485", synced: "2026-11-09 08:40" },
  { id: "LOT-L-1184", orderId: "ORD-26-133", plant: "Lound", product: "Hollowcore", units: 52, m2: 610, planned: "2026-11-02", actual: "2026-11-03", status: "Complete", qa: "Released", yard: "Delivered", inspector: STAFF.lucy, note: "Delivered on LOAD-4484", synced: "2026-11-09 08:40" },
  { id: "LOT-L-1190", orderId: "ORD-26-125", plant: "Lound", product: "Hollowcore", units: 58, m2: 690, planned: "2026-11-06", actual: "2026-11-07", status: "Complete", qa: "Inspection pending", yard: "Lound Yard L1", inspector: STAFF.lucy, note: "First Westbridge load, needs sign-off before 10 Nov collection", synced: "2026-11-09 08:40" },
  { id: "LOT-L-1191", orderId: "ORD-26-125", plant: "Lound", product: "Hollowcore", units: 60, m2: 700, planned: "2026-11-09", actual: null, status: "Casting", qa: "Not started", yard: "Bed 3", inspector: STAFF.lucy, note: "Casting today", synced: "2026-11-09 08:40" },
  { id: "LOT-B-2299", orderId: "ORD-26-133", plant: "Brandon", product: "Bespoke", units: 6, m2: 0, planned: "2026-11-05", actual: "2026-11-06", status: "Complete", qa: "On hold", yard: "Brandon Yard B6", inspector: "Brandon QA (demo)", note: "Chipped arris on beam 4. Repair assessment needed", synced: "2026-11-09 08:40" },
  { id: "LOT-B-2301", orderId: "ORD-26-127", plant: "Brandon", product: "Hollowcore", units: 38, m2: 430, planned: "2026-11-04", actual: "2026-11-04", status: "Complete", qa: "Released", yard: "Dispatched", inspector: "Brandon QA (demo)", note: "On LOAD-4483", synced: "2026-11-09 08:40" },
  { id: "LOT-L-1176", orderId: "ORD-26-112", plant: "Lound", product: "Hollowcore", units: 30, m2: 360, planned: "2026-11-05", actual: "2026-11-05", status: "Complete", qa: "Released", yard: "Lound Yard L3", inspector: STAFF.lucy, note: "Staged for LOAD-4489", synced: "2026-11-09 08:40" },
  { id: "LOT-B-2305", orderId: "ORD-26-133", plant: "Brandon", product: "Hollowcore", units: 50, m2: 580, planned: "2026-11-10", actual: null, status: "Scheduled", qa: "Not started", yard: "Bed 7", inspector: "Brandon QA (demo)", note: "For LOAD-4488", synced: "2026-11-09 08:40" },
  { id: "LOT-B-2306", orderId: "ORD-26-130", plant: "Brandon", product: "Stairs & landings", units: 8, m2: 0, planned: "2026-11-05", actual: "2026-11-05", status: "Complete", qa: "Released", yard: "Brandon Yard B5", inspector: "Brandon QA (demo)", note: "Block B stair flights, staged for LOAD-4490", synced: "2026-11-09 08:40" },
  { id: "LOT-B-2307", orderId: "ORD-26-130", plant: "Brandon", product: "Hollowcore", units: 42, m2: 480, planned: "2026-11-09", actual: null, status: "Casting", qa: "Not started", yard: "Bed 2", inspector: "Brandon QA (demo)", note: "Casting today for LOAD-4491", synced: "2026-11-09 08:40" },
  { id: "LOT-B-2308", orderId: "ORD-26-133", plant: "Brandon", product: "Hollowcore", units: 48, m2: 560, planned: "2026-11-10", actual: null, status: "Scheduled", qa: "Not started", yard: "Bed 5", inspector: "Brandon QA (demo)", note: "For LOAD-4494", synced: "2026-11-09 08:40" },
  { id: "LOT-B-2309", orderId: "ORD-26-127", plant: "Brandon", product: "Hollowcore", units: 34, m2: 390, planned: "2026-11-06", actual: "2026-11-06", status: "Complete", qa: "Released", yard: "Brandon Yard B1", inspector: "Brandon QA (demo)", note: "Final Wakefield lot, staged for LOAD-4492", synced: "2026-11-09 08:40" },
  { id: "LOT-B-2310", orderId: "ORD-26-133", plant: "Brandon", product: "Bespoke", units: 4, m2: 0, planned: "2026-11-06", actual: "2026-11-07", status: "Complete", qa: "Released", yard: "Brandon Yard B6", inspector: "Brandon QA (demo)", note: "Bespoke beams 5 to 8, staged for LOAD-4497", synced: "2026-11-09 08:40" },
  { id: "LOT-L-1192", orderId: "ORD-26-125", plant: "Lound", product: "Hollowcore", units: 56, m2: 660, planned: "2026-11-10", actual: null, status: "Scheduled", qa: "Not started", yard: "Bed 1", inspector: STAFF.lucy, note: "For LOAD-4493", synced: "2026-11-09 08:40" },
  { id: "LOT-L-1193", orderId: "ORD-26-125", plant: "Lound", product: "Hollowcore", units: 54, m2: 640, planned: "2026-11-11", actual: null, status: "Scheduled", qa: "Not started", yard: "Bed 3", inspector: STAFF.lucy, note: "For LOAD-4495", synced: "2026-11-09 08:40" },
  { id: "LOT-B-2288", orderId: "ORD-26-127", plant: "Brandon", product: "Hollowcore", units: 36, m2: 410, planned: "2026-10-30", actual: "2026-10-31", status: "Complete", qa: "Released", yard: "Delivered", inspector: "Brandon QA (demo)", note: "On LOAD-4482 (quantity query)", synced: "2026-11-09 08:40" },
];

const carriers: Carrier[] = [
  { id: "CR-FEN", name: "Fenway Haulage (illustrative)", base: "Thetford", equipment: ["13.6 m flatbed", "Extendable trailer"], onTime: 91, contact: "dispatch@example.com", issues: ["LOAD-4481 delivery claimed without POD"] },
  { id: "CR-TRH", name: "Trentside Heavy Haul (illustrative)", base: "Worksop", equipment: ["Extendable trailer", "Low-loader"], onTime: 95, contact: "ops@example.com", issues: [] },
  { id: "CR-WRL", name: "Wash Road Logistics (illustrative)", base: "King's Lynn", equipment: ["13.6 m flatbed", "Crane-mounted (HIAB)"], onTime: 88, contact: "bookings@example.com", issues: ["LOAD-4482 quantity query"] },
  { id: "CR-PFS", name: "Pennine Flatbed Services (illustrative)", base: "Wakefield", equipment: ["13.6 m flatbed"], onTime: 93, contact: "planning@example.com", issues: [] },
  { id: "CR-OVT", name: "Ouse Valley Transport (illustrative)", base: "Ely", equipment: ["Crane-mounted (HIAB)", "13.6 m flatbed"], onTime: 90, contact: "traffic@example.com", issues: [] },
];

const pod0 = { photo: false, signature: false };
const loads: Load[] = [
  { id: "LOAD-4481", orderId: "ORD-26-130", lotIds: ["LOT-B-2291"], plant: "Brandon", carrierId: "CR-FEN", driver: "Driver D. Kemp (mock)", trailer: "Extendable trailer", collect: "2026-11-06 06:30", deliver: "2026-11-06 13:00-16:00", siteContact: "Ruth Ellison (demo contact)", pieces: 46, tonnes: 24.8, status: "Arrival claimed", claimed: "2026-11-06 16:10", pod: { ...pod0 }, invoiceId: "INV-DR-4481", notes: "Haulier emailed 'delivered on time'. No photo, no receiver signature.", carrierStep: 3 },
  { id: "LOAD-4484", orderId: "ORD-26-133", lotIds: ["LOT-L-1184"], plant: "Lound", carrierId: "CR-TRH", driver: "Driver P. Ahmed (mock)", trailer: "Extendable trailer", collect: "2026-11-06 05:45", deliver: "2026-11-06 10:00-12:00", siteContact: "Marcus Bell (demo contact)", pieces: 52, tonnes: 27.1, status: "POD verified", claimed: "2026-11-06 11:20", pod: { photo: true, photoName: "unload_4484.jpg", receiver: "M. Bell", signature: true, submitted: "2026-11-06 11:24", verified: "2026-11-06 11:42", verifiedBy: STAFF.daniel }, invoiceId: "INV-DR-4484", notes: "Clean delivery. Photo and signature on file.", carrierStep: 6 },
  { id: "LOAD-4482", orderId: "ORD-26-127", lotIds: ["LOT-B-2288"], plant: "Brandon", carrierId: "CR-WRL", driver: "Driver S. Rowe (mock)", trailer: "13.6 m flatbed", collect: "2026-11-05 06:00", deliver: "2026-11-05 10:00-13:00", siteContact: "Ruby Ashworth", pieces: 36, tonnes: 19.4, status: "Exception", claimed: "2026-11-05 12:40", pod: { photo: true, photoName: "unload_4482.jpg", receiver: "R. Ashworth", signature: true, submitted: "2026-11-05 12:52", note: "Receiver counted 35 of 36 planks" }, invoiceId: "INV-DR-4482", exception: "Quantity query: receiver counted 35 of 36 planks", notes: "Plank count disputed on unloading.", carrierStep: 6 },
  { id: "LOAD-4483", orderId: "ORD-26-127", lotIds: ["LOT-B-2301"], plant: "Brandon", carrierId: "CR-PFS", driver: "Driver K. Lowe (mock)", trailer: "13.6 m flatbed", collect: "2026-11-09 06:15", deliver: "2026-11-09 11:00-13:00", siteContact: "Ruby Ashworth", pieces: 38, tonnes: 20.2, status: "Dispatched", pod: { ...pod0 }, notes: "Left Brandon 07:40.", carrierStep: 2 },
  { id: "LOAD-4485", orderId: "ORD-26-130", lotIds: ["LOT-B-2296"], plant: "Brandon", carrierId: "CR-FEN", driver: "Driver D. Kemp (mock)", trailer: "Extendable trailer", collect: "2026-11-09 13:00", deliver: "2026-11-10 08:00-11:00", siteContact: "Ruth Ellison (demo contact)", pieces: 44, tonnes: 23.9, status: "Loaded", pod: { ...pod0 }, notes: "Overnight to Eastbourne.", carrierStep: 1 },
  { id: "LOAD-4486", orderId: "ORD-26-125", lotIds: ["LOT-L-1190"], plant: "Lound", carrierId: "CR-TRH", driver: "Driver P. Ahmed (mock)", trailer: "Extendable trailer", collect: "2026-11-10 06:00", deliver: "2026-11-10 09:30-12:00", siteContact: "Sean Doyle (demo contact)", pieces: 58, tonnes: 30.6, status: "Planned", pod: { ...pod0 }, notes: "Needs QA release of LOT-L-1190 before collection.", carrierStep: 0 },
  { id: "LOAD-4487", orderId: "ORD-26-125", lotIds: ["LOT-L-1191"], plant: "Lound", carrierId: "CR-TRH", driver: "TBC", trailer: "Extendable trailer", collect: "2026-11-11 06:00", deliver: "2026-11-11 09:30-12:00", siteContact: "Sean Doyle (demo contact)", pieces: 60, tonnes: 31.4, status: "Planned", pod: { ...pod0 }, notes: "Lot casting today.", carrierStep: 0 },
  { id: "LOAD-4488", orderId: "ORD-26-133", lotIds: ["LOT-B-2305"], plant: "Brandon", carrierId: "CR-PFS", driver: "TBC", trailer: "13.6 m flatbed", collect: "2026-11-12 05:30", deliver: "2026-11-12 10:00-12:00", siteContact: "Marcus Bell (demo contact)", pieces: 50, tonnes: 26.3, status: "Planned", pod: { ...pod0 }, notes: "", carrierStep: 0 },
  { id: "LOAD-4489", orderId: "ORD-26-112", lotIds: ["LOT-L-1176"], plant: "Lound", carrierId: "CR-OVT", driver: "TBC", trailer: "Crane-mounted (HIAB)", collect: "2026-11-13 07:00", deliver: "2026-11-13 09:30-12:00", siteContact: "Liam Barker", pieces: 30, tonnes: 16.2, status: "Planned", pod: { ...pod0 }, notes: "Final load for the project.", carrierStep: 0 },
  { id: "LOAD-4490", orderId: "ORD-26-130", lotIds: ["LOT-B-2306"], plant: "Brandon", carrierId: "CR-OVT", driver: "Driver A. Clarke (mock)", trailer: "Crane-mounted (HIAB)", collect: "2026-11-09 10:30", deliver: "2026-11-10 07:30-09:00", siteContact: "Ruth Ellison (demo contact)", pieces: 8, tonnes: 14.6, status: "Planned", pod: { ...pod0 }, notes: "Stair flights. Self-offload by HIAB.", carrierStep: 0 },
  { id: "LOAD-4492", orderId: "ORD-26-127", lotIds: ["LOT-B-2309"], plant: "Brandon", carrierId: "CR-WRL", driver: "Driver S. Rowe (mock)", trailer: "13.6 m flatbed", collect: "2026-11-10 06:30", deliver: "2026-11-10 10:30-13:00", siteContact: "Ruby Ashworth", pieces: 34, tonnes: 18.3, status: "Planned", pod: { ...pod0 }, notes: "Final Wakefield load. Count planks with the receiver after the LOAD-4482 query.", carrierStep: 0 },
  { id: "LOAD-4491", orderId: "ORD-26-130", lotIds: ["LOT-B-2307"], plant: "Brandon", carrierId: "CR-FEN", driver: "TBC", trailer: "Extendable trailer", collect: "2026-11-10 14:00", deliver: "2026-11-11 08:00-11:00", siteContact: "Ruth Ellison (demo contact)", pieces: 42, tonnes: 22.7, status: "Planned", pod: { ...pod0 }, notes: "Lot casting today. Overnight to Eastbourne.", carrierStep: 0 },
  { id: "LOAD-4497", orderId: "ORD-26-133", lotIds: ["LOT-B-2310"], plant: "Brandon", carrierId: "CR-OVT", driver: "Driver A. Clarke (mock)", trailer: "Crane-mounted (HIAB)", collect: "2026-11-11 07:00", deliver: "2026-11-11 13:00-15:00", siteContact: "Marcus Bell (demo contact)", pieces: 4, tonnes: 11.8, status: "Planned", pod: { ...pod0 }, notes: "Bespoke beams. Site crane booked 13:00.", carrierStep: 0 },
  { id: "LOAD-4493", orderId: "ORD-26-125", lotIds: ["LOT-L-1192"], plant: "Lound", carrierId: "CR-TRH", driver: "TBC", trailer: "Extendable trailer", collect: "2026-11-11 13:00", deliver: "2026-11-12 07:30-10:00", siteContact: "Sean Doyle (demo contact)", pieces: 56, tonnes: 29.5, status: "Planned", pod: { ...pod0 }, notes: "Second Westbridge load of the week.", carrierStep: 0 },
  { id: "LOAD-4494", orderId: "ORD-26-133", lotIds: ["LOT-B-2308"], plant: "Brandon", carrierId: "CR-PFS", driver: "TBC", trailer: "13.6 m flatbed", collect: "2026-11-12 11:00", deliver: "2026-11-13 08:00-10:00", siteContact: "Marcus Bell (demo contact)", pieces: 48, tonnes: 25.4, status: "Planned", pod: { ...pod0 }, notes: "Overnight park-up at Wakefield.", carrierStep: 0 },
  { id: "LOAD-4495", orderId: "ORD-26-125", lotIds: ["LOT-L-1193"], plant: "Lound", carrierId: "CR-TRH", driver: "TBC", trailer: "Extendable trailer", collect: "2026-11-13 06:00", deliver: "2026-11-13 09:30-12:00", siteContact: "Sean Doyle (demo contact)", pieces: 54, tonnes: 28.6, status: "Planned", pod: { ...pod0 }, notes: "", carrierStep: 0 },
  { id: "LOAD-4470", orderId: "ORD-26-133", lotIds: [], plant: "Brandon", carrierId: "CR-PFS", driver: "Driver K. Lowe (mock)", trailer: "13.6 m flatbed", collect: "2026-10-29 06:00", deliver: "2026-10-29 11:00-13:00", siteContact: "Marcus Bell (demo contact)", pieces: 48, tonnes: 25.1, status: "POD verified", claimed: "2026-10-29 11:40", pod: { photo: true, photoName: "unload_4470.jpg", receiver: "M. Bell", signature: true, submitted: "2026-10-29 11:46", verified: "2026-10-29 13:10", verifiedBy: STAFF.daniel }, notes: "", carrierStep: 6 },
  { id: "LOAD-4472", orderId: "ORD-26-130", lotIds: [], plant: "Brandon", carrierId: "CR-FEN", driver: "Driver D. Kemp (mock)", trailer: "Extendable trailer", collect: "2026-10-30 06:30", deliver: "2026-10-30 13:00-16:00", siteContact: "Ruth Ellison (demo contact)", pieces: 44, tonnes: 23.6, status: "POD verified", claimed: "2026-10-30 15:20", pod: { photo: true, photoName: "unload_4472.jpg", receiver: "R. Ellison", signature: true, submitted: "2026-10-30 15:31", verified: "2026-10-31 09:05", verifiedBy: STAFF.daniel }, notes: "", carrierStep: 6 },
  { id: "LOAD-4473", orderId: "ORD-26-112", lotIds: [], plant: "Lound", carrierId: "CR-OVT", driver: "Driver J. Moss (mock)", trailer: "Crane-mounted (HIAB)", collect: "2026-10-30 07:00", deliver: "2026-10-30 09:30-12:00", siteContact: "Liam Barker", pieces: 26, tonnes: 14.2, status: "POD verified", claimed: "2026-10-30 11:10", pod: { photo: true, photoName: "unload_4473.jpg", receiver: "L. Barker", signature: true, submitted: "2026-10-30 11:14", verified: "2026-10-30 12:02", verifiedBy: STAFF.daniel }, notes: "", carrierStep: 6 },
  { id: "LOAD-4475", orderId: "ORD-26-133", lotIds: [], plant: "Brandon", carrierId: "CR-WRL", driver: "Driver S. Rowe (mock)", trailer: "13.6 m flatbed", collect: "2026-11-02 05:30", deliver: "2026-11-02 10:00-12:00", siteContact: "Marcus Bell (demo contact)", pieces: 50, tonnes: 26.0, status: "POD verified", claimed: "2026-11-02 12:50", pod: { photo: true, photoName: "unload_4475.jpg", receiver: "M. Bell", signature: true, submitted: "2026-11-02 13:02", verified: "2026-11-03 08:40", verifiedBy: STAFF.daniel }, notes: "Arrived 50 minutes after the window. Crane waited.", carrierStep: 6 },
  { id: "LOAD-4476", orderId: "ORD-26-127", lotIds: [], plant: "Brandon", carrierId: "CR-PFS", driver: "Driver K. Lowe (mock)", trailer: "13.6 m flatbed", collect: "2026-11-03 06:00", deliver: "2026-11-03 10:00-12:00", siteContact: "Ruby Ashworth", pieces: 36, tonnes: 19.0, status: "POD verified", claimed: "2026-11-03 11:30", pod: { photo: true, photoName: "unload_4476.jpg", receiver: "R. Ashworth", signature: true, submitted: "2026-11-03 11:36", verified: "2026-11-03 14:00", verifiedBy: STAFF.daniel }, notes: "", carrierStep: 6 },
  { id: "LOAD-4477", orderId: "ORD-26-130", lotIds: [], plant: "Brandon", carrierId: "CR-FEN", driver: "Driver D. Kemp (mock)", trailer: "Extendable trailer", collect: "2026-11-03 06:30", deliver: "2026-11-03 13:00-16:00", siteContact: "Ruth Ellison (demo contact)", pieces: 42, tonnes: 22.5, status: "POD verified", claimed: "2026-11-03 16:45", pod: { photo: true, photoName: "unload_4477.jpg", receiver: "R. Ellison", signature: true, submitted: "2026-11-03 17:02", verified: "2026-11-04 10:10", verifiedBy: STAFF.daniel }, notes: "Arrived 45 minutes late, A14 closure.", carrierStep: 6 },
  { id: "LOAD-4478", orderId: "ORD-26-133", lotIds: [], plant: "Lound", carrierId: "CR-TRH", driver: "Driver P. Ahmed (mock)", trailer: "Extendable trailer", collect: "2026-11-04 05:45", deliver: "2026-11-04 10:00-12:00", siteContact: "Marcus Bell (demo contact)", pieces: 54, tonnes: 28.4, status: "POD verified", claimed: "2026-11-04 11:10", pod: { photo: true, photoName: "unload_4478.jpg", receiver: "M. Bell", signature: true, submitted: "2026-11-04 11:15", verified: "2026-11-04 12:00", verifiedBy: STAFF.daniel }, notes: "", carrierStep: 6 },
  { id: "LOAD-4479", orderId: "ORD-26-112", lotIds: [], plant: "Lound", carrierId: "CR-OVT", driver: "Driver J. Moss (mock)", trailer: "Crane-mounted (HIAB)", collect: "2026-11-04 07:00", deliver: "2026-11-04 09:30-12:00", siteContact: "Liam Barker", pieces: 28, tonnes: 15.1, status: "POD verified", claimed: "2026-11-04 11:05", pod: { photo: true, photoName: "unload_4479.jpg", receiver: "L. Barker", signature: true, submitted: "2026-11-04 11:08", verified: "2026-11-04 11:30", verifiedBy: STAFF.daniel }, notes: "", carrierStep: 6 },
];

const invoices: Invoice[] = [
  { id: "INV-DR-4481", orderId: "ORD-26-130", loadId: "LOAD-4481", net: 87000, stage: "Held", hold: "Missing verified POD", description: "Hollowcore delivery, Block B level 2 (LOAD-4481)", history: [{ at: "2026-11-06 16:30", text: "Draft created from carrier claim. Held: no verified POD" }] },
  { id: "INV-DR-4484", orderId: "ORD-26-133", loadId: "LOAD-4484", net: 112000, stage: "Ready for finance review", description: "Hollowcore delivery, Zone 2 (LOAD-4484)", history: [{ at: "2026-11-06 11:42", text: "POD accepted by Daniel Brooks" }, { at: "2026-11-06 11:45", text: "Draft ready for finance review" }] },
  { id: "INV-DR-4482", orderId: "ORD-26-127", loadId: "LOAD-4482", net: 34500, stage: "Held", hold: "Disputed quantity (35 of 36 planks)", description: "Hollowcore delivery (LOAD-4482)", history: [{ at: "2026-11-05 13:10", text: "Held: receiver disputed quantity" }] },
  // Sage snapshot (illustrative): issued and paid
  { id: "SI-20395", orderId: "ORD-26-112", net: 72000, stage: "Issued", issued: "2026-09-02", due: "2026-10-02", sageRef: "SAGE-DEMO-20395", description: "Stage 1 deliveries", history: [] },
  { id: "SI-20418", orderId: "ORD-26-112", net: 64200, stage: "Issued", issued: "2026-10-05", due: "2026-11-04", sageRef: "SAGE-DEMO-20418", description: "Stage 2 deliveries", history: [] },
  { id: "SI-20442", orderId: "ORD-26-127", net: 41000, stage: "Issued", issued: "2026-10-30", due: "2026-11-29", sageRef: "SAGE-DEMO-20442", description: "October deliveries", history: [] },
  { id: "SI-20431", orderId: "ORD-26-125", net: 148000, stage: "Issued", issued: "2026-10-16", due: "2026-11-15", sageRef: "SAGE-DEMO-20431", description: "Design and mobilisation stage", history: [] },
  { id: "SI-20311", orderId: "ORD-26-112", net: 38400, stage: "Issued", issued: "2026-07-21", due: "2026-08-20", sageRef: "SAGE-DEMO-20311", description: "Beam & block, phase 1", history: [{ at: "2026-09-22 10:00", text: "Reminder 1 sent from Sage (illustrative)" }] },
  { id: "SI-20388", orderId: "ORD-26-133", net: 22600, stage: "Issued", issued: "2026-08-26", due: "2026-09-25", sageRef: "SAGE-DEMO-20388", description: "Bespoke beams, phase 1", history: [], sageNet: 21800, sageNote: "Credit note CN-0412 (£800, chipped beam) posted in Sage, not in Pulse" },
  { id: "SI-20415", orderId: "ORD-26-121", net: 61500, stage: "Issued", issued: "2026-10-02", due: "2026-11-01", sageRef: "SAGE-DEMO-20415", description: "Design stage 2", history: [] },
  { id: "SI-20427", orderId: "ORD-26-130", net: 102000, stage: "Issued", issued: "2026-10-12", due: "2026-11-11", sageRef: "SAGE-DEMO-20427", description: "Stage 2 deliveries", history: [] },
  { id: "SI-20433", orderId: "ORD-26-133", net: 134000, stage: "Issued", issued: "2026-10-19", due: "2026-11-18", sageRef: "SAGE-DEMO-20433", description: "Stage 2 deliveries", history: [], sageNet: 104000, sageNote: "Part payment £30,000 received 05 Nov, allocated in Sage only" },
  { id: "SI-20450", orderId: "ORD-26-118", net: 142500, stage: "Issued", issued: "2026-11-02", due: "2026-12-02", sageRef: "SAGE-DEMO-20450", description: "Order mobilisation (5%)", history: [] },
  { id: "SI-20357", orderId: "ORD-26-125", net: 74000, stage: "Paid", issued: "2026-08-20", due: "2026-09-19", paid: "2026-09-24", sageRef: "SAGE-DEMO-20357", description: "Mobilisation", history: [] },
  { id: "SI-20374", orderId: "ORD-26-130", net: 48000, stage: "Paid", issued: "2026-08-29", due: "2026-09-28", paid: "2026-09-30", sageRef: "SAGE-DEMO-20374", description: "Design and mobilisation", history: [] },
  { id: "SI-20380", orderId: "ORD-26-127", net: 28400, stage: "Paid", issued: "2026-09-10", due: "2026-10-10", paid: "2026-10-14", sageRef: "SAGE-DEMO-20380", description: "Design and mobilisation", history: [] },
  { id: "SI-20402", orderId: "ORD-26-121", net: 58000, stage: "Paid", issued: "2026-09-18", due: "2026-10-18", paid: "2026-10-16", sageRef: "SAGE-DEMO-20402", description: "Design stage", history: [] },
  { id: "SI-20366", orderId: "ORD-26-133", net: 118500, stage: "Paid", issued: "2026-08-28", due: "2026-09-27", paid: "2026-09-25", sageRef: "SAGE-DEMO-20366", description: "Stage 1 deliveries", history: [] },
  { id: "SI-20409", orderId: "ORD-26-130", net: 96000, stage: "Paid", issued: "2026-09-25", due: "2026-10-25", paid: "2026-10-24", sageRef: "SAGE-DEMO-20409", description: "Stage 1 deliveries", history: [] },
];

/* Process map shared on the 04 Nov discovery call: how much of each step iThesis covers
   today, and what Pulse adds around it. Percentages to qualify with the head of commercial. */
export const COVERAGE: { step: string; owner: string; ithesis: number; pulse: string; page: string; tab: string }[] = [
  { step: "Enquiries & quotations", owner: "Head of commercial", ithesis: 20, pulse: "Email intake, one customer profile, estimator queue, bid status", page: "Commercial", tab: "inquiries" },
  { step: "Project & order", owner: "Head of commercial", ithesis: 75, pulse: "Award to order, contract summary, RFIs and letters prefilled", page: "Projects", tab: "awards" },
  { step: "Design", owner: "Head of design", ithesis: 100, pulse: "Read-only view, release gate linked to RFIs", page: "Plants & Planning", tab: "design" },
  { step: "Capacity planning", owner: "Plant managers", ithesis: 0, pulse: "Firm vs tentative board, scenarios, constraint analysis", page: "Plants & Planning", tab: "capacity" },
  { step: "Production planning", owner: "Plant managers", ithesis: 95, pulse: "Read-only snapshot, cast late and dispatch readiness", page: "Plants & Planning", tab: "production" },
  { step: "Quality", owner: "QA lead", ithesis: 30, pulse: "Human sign-off gate before any load leaves", page: "Plants & Planning", tab: "quality" },
  { step: "Yard & stock", owner: "Yard manager", ithesis: 15, pulse: "Bay occupancy, days in yard, stock waiting on loads", page: "Plants & Planning", tab: "quality" },
  { step: "Delivery", owner: "Head of transport", ithesis: 10, pulse: "Transport planner, carrier app, photo and signature proof", page: "Logistics", tab: "planner" },
  { step: "Invoicing", owner: "Head of finance", ithesis: 10, pulse: "Invoice only after verified POD, Sage handoff and reconciliation", page: "Finance", tab: "readiness" },
];

/* Illustrative yard bays per plant (units they can hold). */
export const YARD_BAYS: { bay: string; plant: "Brandon" | "Lound"; capacity: number }[] = [
  { bay: "Brandon Yard B1", plant: "Brandon", capacity: 60 }, { bay: "Brandon Yard B2", plant: "Brandon", capacity: 60 }, { bay: "Brandon Yard B4", plant: "Brandon", capacity: 60 },
  { bay: "Brandon Yard B5", plant: "Brandon", capacity: 30 }, { bay: "Brandon Yard B6", plant: "Brandon", capacity: 20 },
  { bay: "Lound Yard L1", plant: "Lound", capacity: 70 }, { bay: "Lound Yard L2", plant: "Lound", capacity: 70 }, { bay: "Lound Yard L3", plant: "Lound", capacity: 50 },
];

/* Illustrative Sage receipts that could not be matched to an invoice automatically. */
export const SAGE_UNALLOCATED: { ref: string; accountId: string; amount: number; received: string; note: string }[] = [
  { ref: "RCPT-7781", accountId: "a-kier", amount: 74000, received: "2026-11-06", note: "Remittance names the PO, not an invoice. Likely SI-20431 part payment." },
  { ref: "RCPT-7790", accountId: "a-cd", amount: 12650, received: "2026-11-04", note: "No remittance. Amount does not match any open invoice." },
];

/* Constraint analysis: illustrative capacity of each step, to set with each team. */
export const STEP_CAPACITY = {
  estimatorDrawings: 30, // drawing packages one estimator can carry at once
  designPackages: 3, // packages the design coordinator can run in parallel
  qaInspections48h: 3, // inspections the QA team can complete in 48 hours
  haulageSlotsPerDay: 4, // outsourced collections that can be booked per day without premium rates
};

const T = (id: string, title: string, owner: string, due: string, priority: Task["priority"], dept: string, status: Task["status"], ref: Task["ref"], auto?: string): Task =>
  ({ id, title, owner, due, priority, dept, status, ref, auto });
const tasks: Task[] = [
  T("TSK-301", "Manager review of Meridian House estimate (£1.24m indicative)", STAFF.hannah, "2026-11-09", "High", "Estimating", "In progress", { kind: "quote", id: "QUO-26-104" }, "review"),
  T("TSK-302", "Submit Meridian House quotation to BAM after approval", STAFF.olivia, "2026-11-10", "High", "Commercial", "Not started", { kind: "quote", id: "QUO-26-104" }, "send"),
  T("TSK-303", "Chase Mace on crane positions (RFI-1032)", STAFF.megan, "2026-11-11", "High", "Commercial", "In progress", { kind: "rfi", id: "RFI-1032" }, "rfi"),
  T("TSK-304", "Chase Mace on transfer beam bearings (RFI-1034)", STAFF.tom, "2026-11-11", "High", "Design", "In progress", { kind: "rfi", id: "RFI-1034" }, "rfi"),
  T("TSK-305", "Follow up Goldbeck approval of design R05", STAFF.tom, "2026-11-12", "Medium", "Design", "Not started", { kind: "design", id: "ITH-DES-0907" }, "design"),
  T("TSK-306", "Obtain POD for LOAD-4481 from Fenway Haulage", STAFF.daniel, "2026-11-09", "High", "Transport", "In progress", { kind: "load", id: "LOAD-4481" }, "pod"),
  T("TSK-307", "Finance review of INV-DR-4484 (£112,000)", STAFF.grace, "2026-11-10", "High", "Finance", "Not started", { kind: "invoice", id: "INV-DR-4484" }, "invoice"),
  T("TSK-308", "QA sign-off LOT-L-1190 before Westbridge collection", STAFF.lucy, "2026-11-09", "High", "Quality/Yard", "Not started", { kind: "lot", id: "LOT-L-1190" }, "qa"),
  T("TSK-309", "Assess chipped arris on bespoke beam 4 (LOT-B-2299)", "Brandon QA (demo)", "2026-11-10", "Medium", "Quality/Yard", "Not started", { kind: "lot", id: "LOT-B-2299" }, "qa"),
  T("TSK-310", "Resolve LOAD-4482 plank count with Calder", STAFF.daniel, "2026-11-10", "Medium", "Transport", "Not started", { kind: "load", id: "LOAD-4482" }, "pod"),
  T("TSK-311", "Assign estimator to Ely Riverside Phase 3", STAFF.hannah, "2026-11-09", "Medium", "Estimating", "Not started", { kind: "enquiry", id: "INQ-26-107" }, "assign"),
  T("TSK-312", "Confirm Peterborough ramp splice detail with Goldbeck", STAFF.olivia, "2026-11-10", "Medium", "Estimating", "In progress", { kind: "quote", id: "QUO-26-106" }),
  T("TSK-313", "Chase Northgate on SI-20395 (68 days)", STAFF.kerry, "2026-11-09", "Medium", "Finance", "In progress", { kind: "invoice", id: "SI-20395" }),
  T("TSK-314", "Book Trentside for LOAD-4487 driver", STAFF.daniel, "2026-11-10", "Low", "Transport", "Not started", { kind: "load", id: "LOAD-4487" }),
  T("TSK-315", "Decide Wharfside Block C bid strategy (two contractors)", STAFF.megan, "2026-11-12", "Medium", "Commercial", "Not started", { kind: "development", id: "d-wharfside" }),
  T("TSK-316", "Prepare Contract Detail Summary for Riverside Tower", STAFF.megan, "2026-11-06", "High", "Commercial", "Review", { kind: "order", id: "ORD-26-118" }, "contract"),
  T("TSK-317", "Weekly capacity review Brandon / Lound", STAFF.aaron, "2026-11-09", "Medium", "Plant Operations", "Not started", { kind: "order", id: "ORD-26-125" }),
  T("TSK-298", "Issue award acknowledgement to Mace", STAFF.megan, "2026-10-27", "Medium", "Commercial", "Done", { kind: "order", id: "ORD-26-118" }),
];

const ev = (id: string, at: string, source: OmEvent["source"], actor: string, title: string, note: string, ref: OmEvent["ref"], orderId?: string, status: OmEvent["status"] = "done"): OmEvent =>
  ({ id, at, source, actor, title, note, ref, orderId, status });
const events: OmEvent[] = [
  ev("EV-001", "2026-10-28 10:12", "Email", "Inquiry Intake agent", "Enquiry captured from email", "BAM Construction, Meridian House. 14 drawing packages attached. Fields confirmed by estimator.", { kind: "enquiry", id: "INQ-26-104" }),
  ev("EV-002", "2026-10-26 14:30", "Staff", STAFF.megan, "Order awarded", "Mace Riverside Tower, £2,850,000. ORD-26-118 created from QUO-26-088 without re-keying.", { kind: "order", id: "ORD-26-118" }, "ORD-26-118"),
  ev("EV-003", "2026-11-02 16:05", "iThesis", "iThesis sync (illustrative)", "Design revision R05 issued", "ITH-DES-0907 East Midlands MSCP. Awaiting Goldbeck approval by 12 Nov.", { kind: "design", id: "ITH-DES-0907" }, "ORD-26-121"),
  ev("EV-004", "2026-11-04 11:30", "Carrier", "Ouse Valley Transport (illustrative)", "POD accepted", "LOAD-4479 Doncaster. Photo and receiver signature reviewed by Daniel Brooks.", { kind: "load", id: "LOAD-4479" }, "ORD-26-112"),
  ev("EV-005", "2026-11-05 12:52", "Carrier", "Wash Road Logistics (illustrative)", "POD submitted with quantity query", "LOAD-4482. Receiver counted 35 of 36 planks. INV-DR-4482 held.", { kind: "load", id: "LOAD-4482" }, "ORD-26-127", "waiting"),
  ev("EV-006", "2026-11-06 11:42", "Staff", STAFF.daniel, "POD accepted", "LOAD-4484 North Leeds. INV-DR-4484 £112,000 now ready for finance review.", { kind: "load", id: "LOAD-4484" }, "ORD-26-133"),
  ev("EV-007", "2026-11-06 16:10", "Carrier", "Fenway Haulage (illustrative)", "Carrier marked delivered", "LOAD-4481 Eastbourne. Claim only: no photo, no receiver signature.", { kind: "load", id: "LOAD-4481" }, "ORD-26-130", "waiting"),
  ev("EV-008", "2026-11-06 16:30", "Agent", "Finance Readiness agent", "Invoice held", "INV-DR-4481 £87,000 held pending verified POD for LOAD-4481.", { kind: "invoice", id: "INV-DR-4481" }, "ORD-26-130", "waiting"),
  ev("EV-009", "2026-11-06 15:02", "Agent", "Contract & RFI agent", "Reminder sent (simulated)", "RFI-1032 crane positions. Second reminder to Mace. Due 11 Nov.", { kind: "rfi", id: "RFI-1032" }, "ORD-26-118", "waiting"),
  ev("EV-010", "2026-11-06 16:40", "Staff", STAFF.olivia, "Estimate take-off complete", "QUO-26-104 Meridian House. Indicative £1,240,000 under preparation, manager review needed.", { kind: "quote", id: "QUO-26-104" }),
  ev("EV-011", "2026-11-07 06:00", "Sage", "Sage (illustrative)", "Nightly reconciliation snapshot", "6 issued invoices matched to orders. 0 duplicates. 1 overdue over 60 days.", { kind: "invoice", id: "SI-20395" }),
  ev("EV-012", "2026-11-07 07:10", "iThesis", "iThesis sync (illustrative)", "Lot completed", "LOT-L-1190 Westbridge, 58 units. QA inspection pending at Lound.", { kind: "lot", id: "LOT-L-1190" }, "ORD-26-125", "waiting"),
  ev("EV-013", "2026-11-08 18:00", "Agent", "Capacity Sentinel", "Capacity check", "Week of 09 Nov: Brandon 80%, Lound 72.5%. No firm overload. Tentative Goldbeck and Mace demand not counted.", { kind: "order", id: "ORD-26-125" }),
  ev("EV-014", "2026-11-09 07:00", "Agent", "Briefing agent", "Morning briefing posted", "Meridian House estimate due 10 Nov; LOAD-4481 £87k held without verified POD; Mace has 2 blocking RFIs.", { kind: "quote", id: "QUO-26-104" }),
  ev("EV-015", "2026-11-09 07:40", "Carrier", "Pennine Flatbed Services (illustrative)", "Load dispatched", "LOAD-4483 left Brandon for Wakefield.", { kind: "load", id: "LOAD-4483" }, "ORD-26-127"),
  ev("EV-016", "2026-11-09 08:15", "Agent", "Ops Watchdog", "Unverified delivery flagged", "LOAD-4481 claimed delivered 06 Nov 16:10, still no POD after 64 hours.", { kind: "load", id: "LOAD-4481" }, "ORD-26-130", "waiting"),
  ev("EV-017", "2026-11-09 08:40", "iThesis", "iThesis sync (illustrative)", "Production snapshot refreshed", "10 lots, 2 plants. Read-only. No writeback.", { kind: "lot", id: "LOT-L-1191" }),
  ev("EV-018", "2026-11-05 10:05", "Staff", STAFF.olivia, "Clarification requested", "QUO-26-106 Peterborough. Ramp splice detail missing from pack 7.", { kind: "quote", id: "QUO-26-106" }),
  ev("EV-019", "2026-11-05 16:20", "Excel", "Excel import (mock)", "Transport planner imported", "14 rows mapped to 10 loads. 1 conflict (duplicate LOAD-4483 row) sent for review.", { kind: "load", id: "LOAD-4483" }),
  ev("EV-020", "2026-11-03 11:00", "Customer", "Northgate Build", "Customer asked for alternative price", "QUO-26-099 Sheffield. Alternative stair finish requested.", { kind: "quote", id: "QUO-26-099" }),
  ev("EV-021", "2026-11-02 09:30", "Staff", STAFF.hannah, "Quote submitted", "QUO-26-109 Wharfside Block C for Kier, £540,000. Morgan Sindall also tendering the same building.", { kind: "quote", id: "QUO-26-109" }),
  ev("EV-022", "2026-11-04 14:20", "Staff", STAFF.olivia, "Clarification requested", "QUO-26-104. Stair core 2 landing levels differ between GA and section drawings.", { kind: "quote", id: "QUO-26-104" }),
];

export function initialState(): OmState {
  const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
  return {
    clock: 0, seq: 100,
    accounts: clone(accounts), contacts: clone(contacts), devs: clone(devs), enquiries: clone(enquiries), quotes: clone(quotes),
    orders: clone(orders), rfis: clone(rfis), docs: clone(docs), designs: clone(designs), commitments: clone(commitments),
    lots: clone(lots), loads: clone(loads), carriers: clone(carriers), invoices: clone(invoices), tasks: clone(tasks), events: clone(events),
    intake: null, intakeSeq: 0,
    portalMessages: [{ orderId: "ORD-26-118", at: "2026-11-06 15:05", from: "Oranmore Precast", text: "Two items are needed before design can start: crane positions (RFI-1032) and transfer beam bearings (RFI-1034)." }],
  };
}

/* The simulated inbound email for the intake demo. Parsing is local and deterministic. */
export const SAMPLE_EMAILS = [
  {
    from: "estimating@example.com (Morgan Sindall, demo)", subject: "ITT: Holbeck Yard Car Park, precast hollowcore and stairs",
    received: "2026-11-09 08:52",
    body: "Hi team,\n\nPlease find attached the ITT drawing pack for Holbeck Yard Car Park, Leeds. We are tendering the main contract (award expected January). Scope is hollowcore floors to 4 decks, approx 5,200 m2, plus 6 stair flights. Tender return is Friday 27 November.\n\nCould you confirm whether you can supply from Lound given the programme?\n\nThanks,\nMarcus Bell",
    attachments: ["HYC-ITT-GA-01.pdf", "HYC-ITT-GA-02.pdf", "HYC-SECTIONS.pdf", "HYC-STAIRS.pdf", "HYC-SPEC.pdf", "HYC-PROGRAMME.xlsx"],
    fields: [
      { key: "account", label: "Customer", value: "Morgan Sindall", confidence: "High" as const, options: ["Morgan Sindall"] },
      { key: "dev", label: "Development", value: "Holbeck Yard Car Park", confidence: "High" as const },
      { key: "town", label: "Location", value: "Leeds", confidence: "High" as const },
      { key: "contractorStatus", label: "Contractor project status", value: "Tendering", confidence: "Medium" as const, options: ["Tendering", "Secured", "Unknown"] },
      { key: "products", label: "Products", value: "Hollowcore, Stairs & landings", confidence: "High" as const },
      { key: "m2", label: "Hollowcore area", value: "5,200 m²", confidence: "Medium" as const },
      { key: "due", label: "Quote due", value: "2026-11-27", confidence: "High" as const },
      { key: "plant", label: "Preferred plant", value: "Lound", confidence: "Low" as const, options: ["Lound", "Brandon", "Not specified"] },
      { key: "contact", label: "Contact", value: "Marcus Bell", confidence: "High" as const },
    ],
  },
  {
    from: "procurement@example.com (Kier, demo)", subject: "Enquiry: Westbridge Hospital Phase 2 stairs and landings",
    received: "2026-11-09 08:58",
    body: "Morning,\n\nFollowing the Phase 1 work, we would like a price for Phase 2 of Westbridge Hospital, Leicester: 12 precast stair flights and landings. Contract is secured. Could we have numbers by 20 November?\n\nRegards,\nSean Doyle",
    attachments: ["WBH-P2-STAIRS-GA.pdf", "WBH-P2-SCHEDULE.pdf"],
    fields: [
      { key: "account", label: "Customer", value: "Kier", confidence: "High" as const, options: ["Kier"] },
      { key: "dev", label: "Development", value: "Westbridge Hospital Phase 2", confidence: "Medium" as const },
      { key: "town", label: "Location", value: "Leicester", confidence: "High" as const },
      { key: "contractorStatus", label: "Contractor project status", value: "Secured", confidence: "High" as const, options: ["Tendering", "Secured", "Unknown"] },
      { key: "products", label: "Products", value: "Stairs & landings", confidence: "High" as const },
      { key: "m2", label: "Hollowcore area", value: "n/a", confidence: "High" as const },
      { key: "due", label: "Quote due", value: "2026-11-20", confidence: "High" as const },
      { key: "plant", label: "Preferred plant", value: "Not specified", confidence: "Low" as const, options: ["Lound", "Brandon", "Not specified"] },
      { key: "contact", label: "Contact", value: "Sean Doyle", confidence: "High" as const },
    ],
  },
];
