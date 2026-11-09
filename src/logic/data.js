/* Demo data and pure helpers for the Pulse prototype (Oranmore Precast, illustrative). */

const INK="var(--ink)", BODY="var(--body)", DIM="var(--dim)", FAINT="var(--faint)";
const LIME="var(--accent)", GREEN="var(--ok)", AMBER="var(--warn)", RED="var(--bad)", NEUTRAL="var(--neutral)";
const MONO="var(--mono)";

const ICONS = {
  navHome:"M12 3.2 3.6 9.1v10a1.5 1.5 0 0 0 1.5 1.5h13.8a1.5 1.5 0 0 0 1.5-1.5v-10L12 3.2Z M8.9 13.1h2l1-2.6 1.5 5 1.1-2.4h1.6",
  navAgents:"M12 2.4v2.3 M12 2.4a.9.9 0 1 0 0-.02 M8.2 6.5h7.6A2.2 2.2 0 0 1 18 8.7v5.1a2.2 2.2 0 0 1-2.2 2.2H8.2A2.2 2.2 0 0 1 6 13.8V8.7a2.2 2.2 0 0 1 2.2-2.2Z M9.9 10.6v1.4 M14.1 10.6v1.4 M6 10h-1.9 M18 10h1.9 M9.2 18.6h5.6 M9.2 21.2h5.6",
  navDash:"M4 5.6h7.2v5.1H4V5.6Z M13.6 5.6H20v8.6h-6.4V5.6Z M4 13.1h7.2v5.3H4v-5.3Z M13.6 16.6H20v1.8h-6.4v-1.8Z",
  navWork:"M9.4 4.4h5.2a1.4 1.4 0 0 1 1.4 1.4v1.1h2.4A1.6 1.6 0 0 1 20 8.5v9.1a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 17.6V8.5a1.6 1.6 0 0 1 1.6-1.6H8V5.8a1.4 1.4 0 0 1 1.4-1.4Z M8 6.9h8 M9.6 13.3l1.8 1.8 3.4-3.6",
  navRecords:"M12 3.6c3.9 0 7 1.1 7 2.5S15.9 8.6 12 8.6 5 7.5 5 6.1 8.1 3.6 12 3.6Z M5 6.1v5.7c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6.1 M5 11.8v5.7c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-5.7",
  navActivity:"M4.6 4.6h14.8A1.6 1.6 0 0 1 21 6.2v11.6a1.6 1.6 0 0 1-1.6 1.6H4.6A1.6 1.6 0 0 1 3 17.8V6.2a1.6 1.6 0 0 1 1.6-1.6Z M6 12.4h2.2l1.5-4.1 2.3 8 1.9-5.4 1.2 1.5H18",
  navAdmin:"M12 2.9 5 5.6v5.9c0 4 2.8 7.1 7 8.6 4.2-1.5 7-4.6 7-8.6V5.6L12 2.9Z M12 8.6a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z M8.8 16.3a3.6 3.6 0 0 1 6.4 0",
  helios:"M21 11.5a8.4 8.4 0 0 1-9 8.4 9.9 9.9 0 0 1-4-.8L3 21l1.9-4.9A8.3 8.3 0 0 1 4 11.5 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z M8 12h1.6l1.2-2.6 1.6 5 1.4-2.4H16",
  inbox:"M3 13h4l1.5 3h7l1.5-3h4 M3 13l2.4-7A2 2 0 0 1 7.3 4.6h9.4a2 2 0 0 1 1.9 1.4L21 13v4.4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V13Z",
  work:"M6 4.6h12a1.6 1.6 0 0 1 1.6 1.6v12.2A1.6 1.6 0 0 1 18 20H6a1.6 1.6 0 0 1-1.6-1.6V6.2A1.6 1.6 0 0 1 6 4.6Z M8.4 10.4l1.9 1.9 3.9-3.9 M8.4 15.6h7.2",
  approvals:"M12 3.6 19.5 6v6.1c0 4-3.1 6.9-7.5 8.3-4.4-1.4-7.5-4.3-7.5-8.3V6L12 3.6Z M9.2 12.2l2 2 3.6-3.7",
  insights:"M4.5 19.5V13 M9.7 19.5V7.5 M14.9 19.5v-8 M20 19.5V5",
  people:"M12 12.5a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z M5 20.2c.9-3.1 3.6-4.9 7-4.9s6.1 1.8 7 4.9",
  orgs:"M4.5 20V6.4A1.4 1.4 0 0 1 5.9 5h6.2a1.4 1.4 0 0 1 1.4 1.4V20 M13.5 10.5h4.6A1.4 1.4 0 0 1 19.5 12v8 M3 20h18 M7.5 8.5h2.5 M7.5 12h2.5 M7.5 15.5h2.5",
  teams:"M9 12a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 12Z M16.5 12.5a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z M2.6 19.6c.8-2.8 3.2-4.4 6.4-4.4s5.6 1.6 6.4 4.4 M17 15.4c2.2.4 3.7 1.8 4.3 4.2",
  locations:"M12 21s6.5-5.6 6.5-11a6.5 6.5 0 1 0-13 0C5.5 15.4 12 21 12 21Z M12 12.8a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z",
  visits:"M8 4v3 M16 4v3 M4.5 9.5h15 M6.4 6h11.2A1.9 1.9 0 0 1 19.5 8v10a1.9 1.9 0 0 1-1.9 1.9H6.4A1.9 1.9 0 0 1 4.5 18V8A1.9 1.9 0 0 1 6.4 6Z M9 13.5l1.6 1.6 3.4-3.4",
  autos:"M18.5 8.5A5 5 0 0 0 8.9 7.3 3.8 3.8 0 0 0 6 14.6 M8 17.5l3.2 3.2 M11.2 20.7l3.2-3.2 M11.2 20.7V9.6",
  health:"M3 12.5h3.4l2-5 3 10 2.2-5H21",
  modules:"M6.6 4.4h10.8a2.2 2.2 0 0 1 2.2 2.2v10.8a2.2 2.2 0 0 1-2.2 2.2H6.6a2.2 2.2 0 0 1-2.2-2.2V6.6a2.2 2.2 0 0 1 2.2-2.2Z M4.4 9.6h15.2 M9.6 19.6V9.6",
  agents:"M8.5 3.6h7A2.4 2.4 0 0 1 17.9 6v5.6a2.4 2.4 0 0 1-2.4 2.4h-7A2.4 2.4 0 0 1 6.1 11.6V6a2.4 2.4 0 0 1 2.4-2.4Z M9.6 8.2h.01 M14.4 8.2h.01 M12 14v2.6 M7.6 20.4h8.8 M12 16.6c-2.4 0-4.4 1.7-4.4 3.8h8.8c0-2.1-2-3.8-4.4-3.8Z",
  dash:"M4.4 4.4h6v6h-6v-6Z M13.6 4.4h6v3.6h-6V4.4Z M13.6 11.6h6v8h-6v-8Z M4.4 14h6v5.6h-6V14Z",
  files:"M5 7.2a1.8 1.8 0 0 1 1.8-1.8h3l1.8 2.2h5.6A1.8 1.8 0 0 1 19 9.4v7.4a1.8 1.8 0 0 1-1.8 1.8H6.8A1.8 1.8 0 0 1 5 16.8V7.2Z",
  pulseLine:"M2.5 12.5h3.6l2.1-6.4 3.2 12.2 2.6-8.4 1.8 2.6h5.7",
  records:"M6.4 3.6h7.4l4.2 4.2v12.6H6.4V3.6Z M13.4 3.8v4.2h4.2 M9 12.4h6 M9 16h4",
  tree:"M4.5 6h5 M4.5 12h5 M4.5 18h5 M12.5 6h7 M12.5 12h7 M12.5 18h7",
  graph:"M7 7.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z M17.6 10.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z M9.4 21.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z M8.6 6.4l7.6 2.6 M15.8 11.4l-5.6 5.2",
  bell:"M6 8.5a6 6 0 0 1 12 0c0 6.5 2.6 8.5 2.6 8.5H3.4S6 15 6 8.5Z M10.3 20.5a1.94 1.94 0 0 0 3.4 0",
  navCommercial:"M8.5 6.5V5a1.5 1.5 0 0 1 1.5-1.5h4A1.5 1.5 0 0 1 15.5 5v1.5 M4.5 6.5h15A1.5 1.5 0 0 1 21 8v10a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18V8a1.5 1.5 0 0 1 1.5-1.5Z M3 12.2h18 M10.5 12.2v2h3v-2",
  navProjects:"M6 3.5v17 M6 4.5h10.5L14 8l2.5 3.5H6 M10 20.5h10 M14.5 16.5h5.5",
  navPlants:"M3 20.5V10.5l5 3v-3l5 3v-3l5 3V4h3v16.5H3Z M6.5 17h2 M11.5 17h2 M16.5 17h2",
  navLogistics:"M2.5 6.5h11v9h-11v-9Z M13.5 9.5h4l3 3.2v2.8h-7v-6Z M6.5 16.4a1.9 1.9 0 1 1 0 3.8 1.9 1.9 0 0 1 0-3.8Z M17 16.4a1.9 1.9 0 1 1 0 3.8 1.9 1.9 0 0 1 0-3.8Z",
  navFinance:"M15.6 6.4A3.7 3.7 0 0 0 8.9 8.5v3c0 2.7-.8 5-2.6 7h11.3 M6.4 12.3h7.4"
};

/* Ontology stays first and is never removed (PulseLogic enforces this too). */
const REC_SECTIONS = [
  {id:"ontology", label:"Ontology", blurb:"How every Oranmore record connects: customer to development, enquiry, quote, order, design, lot, load, POD and invoice."},
  {id:"files", label:"Files", blurb:"Drawing packs, contract documents, delivery evidence and invoice drafts, filed against the record they belong to."},
  {id:"contacts", label:"Contacts", blurb:"Oranmore staff, customer contacts and carriers in one set of records."},
  {id:"register", label:"Register", blurb:"Every shared record, searchable and filterable by type, with its links and lineage."}
];

const CONTACTS = [
  ["Olivia Ellis","Estimator (demo)","olivia.ellis@example.test","Oranmore Precast","staff","var(--accent)","c-oe"],
  ["Hannah Cole","Senior Estimator (demo)","hannah.cole@example.test","Oranmore Precast","staff","#9fd6f0","c-hc"],
  ["Sam Patel","Estimator (demo)","sam.patel@example.test","Oranmore Precast","staff","#e6c78a","c-sp"],
  ["Megan Price","Commercial Lead (demo)","megan.price@example.test","Oranmore Precast","staff","#c8b4f0","c-mpr"],
  ["Daniel Brooks","Transport Planner (demo)","daniel.brooks@example.test","Oranmore Precast","staff","#a8e0c0","c-db"],
  ["Grace Hughes","Finance Lead (demo)","grace.hughes@example.test","Oranmore Precast","staff","#e2a08c","c-gh"],
  ["Tom Fielding","Design Coordinator (demo)","tom.fielding@example.test","Oranmore Precast","staff","#9fd6f0","c-tf"],
  ["Lucy Grant","QA Inspector, Lound (demo)","lucy.grant@example.test","Oranmore Precast","staff","#e6c78a","c-lg"],
  ["Priya Nair","Package Manager (demo contact)","p.nair@example.com","BAM Construction","customer","#9fd6f0","x-bam"],
  ["Joe Hartley","Senior Project Manager (demo contact)","j.hartley@example.com","Mace","customer","#c8b4f0","x-mace"],
  ["Anna Weiss","Design Manager (demo contact)","a.weiss@example.com","Goldbeck","customer","#a8e0c0","x-gold"],
  ["Sean Doyle","Site Manager (demo contact)","s.doyle@example.com","Kier","customer","#e6c78a","x-kier"],
  ["Ruth Ellison","Logistics Manager (demo contact)","r.ellison@example.com","Laing O'Rourke","awaiting POD","#e2a08c","x-lor"],
  ["Marcus Bell","Project Manager (demo contact)","m.bell@example.com","Morgan Sindall","customer","#9fd6f0","x-ms"],
  ["Fenway Haulage","Carrier (illustrative)","dispatch@example.com","Fenway Haulage","carrier","#f0c04b","CR-FEN"],
  ["Trentside Heavy Haul","Carrier (illustrative)","ops@example.com","Trentside Heavy Haul","carrier","#f0c04b","CR-TRH"]
];

const FILE_TREE = [
  {type:"folder", id:"f-com", name:"Commercial", depth:0},
  {type:"file", id:"fl-1", name:"Meridian House ITT drawing pack (14 packages).pdf", depth:1, parent:"f-com", indexed:true,
   path:"Commercial / INQ-26-104", title:"Meridian House ITT drawing pack",
   facts:[["TYPE","PDF · 14 packages"],["RECEIVED","28 Oct 2026"],["RECORD","INQ-26-104"],["OWNER","Olivia Ellis (demo)"]],
   body:["Illustrative file. ITT pack from BAM Construction for Meridian House: hollowcore floors and precast stairs.",
     "Stair core 2 landing levels differ between the GA and section drawings. A clarification is open on QUO-26-104.",
     "Pulse indexes the drawing register, not the engineering content. Pricing stays with the estimators."],
   links:[["BAM Construction","org"],["INQ-26-104","enquiry"],["QUO-26-104","quote"]]},
  {type:"file", id:"fl-2", name:"Inquiry log (mock export).xlsx", depth:1, parent:"f-com", indexed:false,
   path:"Commercial / Excel", title:"Inquiry log (mock export)",
   facts:[["TYPE","XLSX · sample schema only"],["ROWS","20 mapped"],["INDEXED","Mapped, not indexed"],["OWNER","Commercial"]],
   body:["Sample schema standing in for the commercial inquiry log. No production workbook is included in the demo.",
     "Each row maps to one enquiry and one quote. Conflicts go to review instead of overwriting."],
   links:[["Commercial","area"]]},
  {type:"folder", id:"f-prj", name:"Projects", depth:0},
  {type:"file", id:"fl-3", name:"Riverside Tower Contract Detail Summary (draft).pdf", depth:1, parent:"f-prj", indexed:true,
   path:"Projects / ORD-26-118", title:"Riverside Tower Contract Detail Summary",
   facts:[["TYPE","PDF · generated"],["ORDER","ORD-26-118"],["STATUS","Awaiting approval"],["OWNER","Megan Price (demo)"]],
   body:["Prefilled from QUO-26-088: Mace, Riverside Tower, £2,850,000. Nothing was retyped.",
     "Two blocking RFIs (RFI-1032 crane positions, RFI-1034 transfer beam bearings) must be answered before design handover."],
   links:[["Mace","org"],["ORD-26-118","order"],["RFI-1032","rfi"]]},
  {type:"file", id:"fl-4", name:"ITH-DES-0907 R05 drawings (snapshot).pdf", depth:1, parent:"f-prj", indexed:false,
   path:"Projects / ORD-26-121", title:"ITH-DES-0907 design revision R05",
   facts:[["TYPE","PDF · iThesis export (illustrative)"],["REVISION","R05"],["TARGET","12 Nov 2026"],["OWNER","Design"]],
   body:["Illustrative snapshot of the Goldbeck East Midlands MSCP package. iThesis remains the design record.",
     "Production is not released until client approval and planner release."],
   links:[["Goldbeck","org"],["ITH-DES-0907","design"]]},
  {type:"folder", id:"f-log", name:"Delivery evidence", depth:0},
  {type:"file", id:"fl-5", name:"LOAD-4484 unloading photo and signature.jpg", depth:1, parent:"f-log", indexed:true,
   path:"Logistics / LOAD-4484", title:"LOAD-4484 proof of delivery",
   facts:[["TYPE","Photo + signature (demo)"],["ACCEPTED","06 Nov 2026, 11:42"],["BY","Daniel Brooks (demo)"],["RECEIVER","M. Bell"]],
   body:["Demo evidence for North Leeds Leisure Centre. Timestamps and location are demo data, not verified telematics.",
     "Accepted by a person, which made INV-DR-4484 eligible for invoicing."],
   links:[["LOAD-4484","load"],["INV-DR-4484","invoice"]]},
  {type:"file", id:"fl-6", name:"LOAD-4481 carrier email (claim only).eml", depth:1, parent:"f-log", indexed:true,
   path:"Logistics / LOAD-4481", title:"LOAD-4481 carrier claim",
   facts:[["TYPE","Email (mock)"],["CLAIMED","06 Nov 2026, 16:10"],["EVIDENCE","None"],["OWNER","Transport"]],
   body:["'Delivered on time.' No photo, no receiver name, no signature.",
     "A claim is not proof. INV-DR-4481 (£87,000) stays held until a person accepts a POD."],
   links:[["LOAD-4481","load"],["INV-DR-4481","invoice"]]},
  {type:"folder", id:"f-fin", name:"Finance", depth:0},
  {type:"file", id:"fl-7", name:"INV-DR-4484 draft (finance review).pdf", depth:1, parent:"f-fin", indexed:true,
   path:"Finance / Drafts", title:"INV-DR-4484 invoice draft",
   facts:[["TYPE","PDF · draft"],["NET","£112,000"],["GROSS","£134,400"],["STATUS","Ready for finance review"]],
   body:["Draft for Morgan Sindall, North Leeds Leisure Centre, LOAD-4484. Sage handoff not yet submitted.",
     "Any Sage export in this demo is a simulation. Edition and API to confirm."],
   links:[["Morgan Sindall","org"],["INV-DR-4484","invoice"]]}
];

const ONTO_NODES = [
  ["Customer","entity",500,300,1,"Contractors such as BAM, Mace, Kier. One account, many developments and bids."],
  ["Contact","entity",300,190,1,"Customer contacts and Oranmore staff, scoped by role."],
  ["Development","entity",700,190,1,"The building. Several contractors can tender the same development."],
  ["Enquiry","entity",250,430,1,"An ITT from one contractor for one development. Contractor status is kept separate from Oranmore's quote status."],
  ["Order","entity",690,430,1,"A won quote becomes one order. Values inherit, never retyped."],
  ["RFI","entity",850,320,0,"Information requests. Blocking ones hold design handover."],
  ["Invoice","ledger",390,95,0,"Drafts in Pulse, ledger in Sage (illustrative, not connected)."],
  ["Design package","ledger",620,95,0,"iThesis is authoritative. Pulse shows read-only snapshots."],
  ["Load / POD","module",860,470,0,"Outsourced carriers. A claim is not proof until a person accepts it."],
  ["File","entity",140,300,0,"Drawings, contract documents and delivery evidence."],
  ["bids for","predicate",395,240,0,"Customer → Enquiry."],
  ["located at","predicate",605,240,0,"Enquiry → Development."],
  ["awarded as","predicate",360,370,0,"Quote → Order."],
  ["delivered by","predicate",600,370,0,"Load → Carrier."],
  ["attached to","predicate",140,372,0,"File → anything."]
];

const ONTO_EDGES = [
  [500,300,300,190],[500,300,700,190],[500,300,250,430],[500,300,690,430],
  [500,300,850,320],[500,300,390,95],[500,300,620,95],[500,300,140,300],
  [300,190,250,430],[700,190,860,470],[690,430,850,320],[690,430,860,470],
  [300,190,140,300],[390,95,620,95]
];

const REC_TEMPLATES = [
  ["Field sheet","Records","Labelled fields in a grid — the default for a person, organisation or location.",
   "M5 5.5h14v13H5v-13Z M5 10h14 M12 10v8.5","grid"],
  ["Contact card","Records","A portrait, key fields and every linked record in one compact panel.",
   "M12 11.5a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z M5.5 19c.8-3 3.3-4.7 6.5-4.7s5.7 1.7 6.5 4.7","card"],
  ["Directory","Records","A sortable table of many records at once, built for lists.",
   "M4.5 6.5h15 M4.5 12h15 M4.5 17.5h15 M4.5 6.5h.01 M4.5 12h.01 M4.5 17.5h.01","rows"],
  ["Timeline","Case work","Ordered events with who did what and when. Good for a case or a claim.",
   "M12 3.5v17 M12 7.5h6 M12 13h-6 M12 18h6","timeline"],
  ["Kanban board","Case work","Cards in columns by status. For anything that moves through stages.",
   "M5 5h4.5v14H5V5Z M9.75 5h4.5v9h-4.5V5Z M14.5 5H19v6h-4.5V5Z","kanban"],
  ["Checklist","Case work","Ticked steps in order, with an owner and a due date on each.",
   "M5 6.5h2l1.4 1.4L11 5.5 M5 12.5h2l1.4 1.4 2.6-2.4 M5 18.5h2l1.4 1.4 2.6-2.4 M15 6.5h4 M15 12.5h4 M15 18.5h4","checklist"],
  ["Ledger","Finance","Rows and running totals. For anything with amounts and dates.",
   "M4 6h16 M4 12h16 M4 18h16 M9 3.5v17","ledger"],
  ["Invoice","Finance","Line items, totals and a status — built to be sent, not just stored.",
   "M7 3.5h10v17H7v-17Z M9.5 8h5 M9.5 11.5h5 M9.5 15h3","invoice"],
  ["Document","Notes","Long-form text with linked records pulled out down the side.",
   "M7 3.5h7l5 5v12H7v-17Z M14 3.7v5h5 M10 13h6 M10 16.5h4","document"],
  ["Gallery","Notes","A wall of images and files with a caption on each — for a site or a job.",
   "M4.5 6h6v6h-6V6Z M13.5 6h6v6h-6V6Z M4.5 14h6v4h-6v-4Z M13.5 14h6v4h-6v-4Z","gallery"],
  ["Map & locations","Ops","A pinboard of places, with the record's fields beside each pin.",
   "M12 21s6.5-5.6 6.5-11a6.5 6.5 0 1 0-13 0C5.5 15.4 12 21 12 21Z M12 12.8a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z","map"],
  ["Schedule","Ops","A calendar of bookings against this record, with recurring rules.",
   "M8 4v3 M16 4v3 M4.5 9.5h15 M6.4 6h11.2A1.9 1.9 0 0 1 19.5 8v10a1.9 1.9 0 0 1-1.9 1.9H6.4A1.9 1.9 0 0 1 4.5 18V8A1.9 1.9 0 0 1 6.4 6Z","schedule"]
];
const REC_TEMPLATE_CATS = ["All","Records","Case work","Finance","Notes","Ops"];

/* ---- admin hub ---- */
/* ---- admin hub: 13 settings areas in five groups ---- */
const PEOPLE = [
  ["Jane O'Connor","Project advocate (title to confirm)","not held in demo","Oranmore Precast","active","Admin","now"],
  ["Megan Price","Commercial Lead (demo)","megan.price@example.test","Brandon","active","Manager","12 min ago"],
  ["Olivia Ellis","Estimator (demo)","olivia.ellis@example.test","Brandon","active","Standard","8 min ago"],
  ["Daniel Brooks","Transport Planner (demo)","daniel.brooks@example.test","Lound","active","Standard","3 min ago"],
  ["Grace Hughes","Finance Lead (demo)","grace.hughes@example.test","Brandon","active","Manager","1 h ago"],
  ["Lucy Grant","QA Inspector, Lound (demo)","lucy.grant@example.test","Lound","active","Standard","40 min ago"],
  ["Joe Hartley","Mace (demo contact)","j.hartley@example.com","Customer portal","external","External","Fri"],
  ["Fenway Haulage","Carrier app (illustrative)","dispatch@example.com","Carrier portal","external","External","06 Nov"]
];
const ROLE_LEVELS = ["Admin","Manager","Standard","External"];
const PERM_KEYS = [["view","View records"],["edit","Edit records"],["approve","Approve payments"]];
const GRANT_DEFS = [
  ["view","View records","Read anything in scope"],
  ["edit","Edit records","Create and change records"],
  ["approve","Approve decisions","Say yes to parked work"],
  ["pay","Release payments","Send money out"],
  ["export","Export data","Download and share out"],
  ["agents","Manage agents","Create and grant agents"],
  ["settings","Change settings","Modules, roles, integrations"],
  ["audit","Read the audit log","Every action, everyone"]
];
const ROLE_SCOPES = ["All records","Their location","Assigned only"];
const DEFAULT_PERMS = {Admin:{view:true,edit:true,approve:true}, Manager:{view:true,edit:true,approve:true},
  Standard:{view:true,edit:true,approve:false}, External:{view:true,edit:false,approve:false}};
const INTEGRATIONS = [
  {name:"iThesis", blurb:"Authoritative for precast design and production planning. Proposed exchange: order reference, design package and revision, production milestones, lots, QA/yard status. Read-only snapshots in this demo.", tint:"#9d8cf5", status:"concept / demo", statusKind:"warn",
   glyph:"M4 5h16v14H4V5Z M4 9h16 M9 9v10", lastSync:"Illustrative snapshot 09 Nov 08:40", usage:"API / vendor connectivity to validate", auth:"To confirm", scopes:["Read (proposed)"]},
  {name:"Sage", blurb:"Finance ledger and invoices. Proposed exchange: customer and contract reference, approved billing event, invoice ID and status, payment and reconciliation status. Handoffs here are simulated.", tint:"#00d639", status:"concept / demo", statusKind:"warn",
   glyph:"M4 8 12 4.5 20 8 12 11.5 4 8Z M4 13 12 16.5 20 13 M4 18 12 21.5 20 18", lastSync:"Illustrative snapshot 07 Nov 06:00", usage:"Edition and API to confirm", auth:"To confirm", scopes:["Read (proposed)","Write after approval (proposed)"]},
  {name:"Excel workbooks", blurb:"Existing inquiry log, won-contract tracker, RFI/contract sheets and transport planner. Mapping preview: old row → canonical record → conflict review. Sample schema only, no production workbook.", tint:"#21a366", status:"concept / demo", statusKind:"warn",
   glyph:"M5 4h14v16H5V4Z M9 8l6 8 M15 8l-6 8", lastSync:"Mock import 05 Nov 16:20", usage:"1 conflict parked", auth:"File import", scopes:["Import"]},
  {name:"Email inboxes", blurb:"Commercial enquiry intake and award notifications. Provider and access model not confirmed; requires approval and integration discovery.", tint:"#ea4335", status:"not connected", statusKind:"off",
   glyph:"M4 7.2 12 13 20 7.2 M4 7.2v10.6h16V7.2 M4 7.2 8.5 4h7L20 7.2", lastSync:"—", usage:"Simulated intake only", auth:"To confirm", scopes:[]},
  {name:"Carrier portal", blurb:"Future external interface for outsourced hauliers: load list, POD photo, receiver and signature. Fully simulated here; no GPS or live tracking.", tint:"#f0c04b", status:"concept / demo", statusKind:"warn",
   glyph:"M2.5 6.5h11v9h-11v-9Z M13.5 9.5h4l3 3.2v2.8h-7v-6Z", lastSync:"Simulated", usage:"5 illustrative carriers", auth:"Permission-filtered", scopes:["Own loads only"]},
  {name:"Customer portal", blurb:"Future external tracker: quote, information requests, drawing approvals, milestones and released delivery evidence. Simulated role switch, not real sign-in.", tint:"var(--accent)", status:"concept / demo", statusKind:"warn",
   glyph:"M12 12.5a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z M5 20.2c.9-3.1 3.6-4.9 7-4.9s6.1 1.8 7 4.9", lastSync:"Simulated", usage:"Own projects only", auth:"Permission-filtered", scopes:["Own projects only"]}
];

/* Background catalogue. Each entry is pure CSS so a tile is the real thing at
   thumbnail size, not a picture of it. */
const BG_DEFS = [
  {id:"bloom", name:"Bloom", cat:"Signature",
   css:"background:radial-gradient(60% 48% at 50% 34%, var(--accent-faint), transparent 72%), radial-gradient(44% 38% at 16% 84%, rgba(255,255,255,.05), transparent 70%)",
   thumb:"background:radial-gradient(62% 58% at 46% 34%, var(--accent-soft), transparent 74%), radial-gradient(50% 46% at 82% 84%, rgba(255,255,255,.08), transparent 72%), var(--surface-2)"},
  {id:"mist", name:"Mist", cat:"Signature",
   css:"background:radial-gradient(52% 44% at 24% 22%, rgba(255,255,255,.07), transparent 70%), radial-gradient(56% 46% at 80% 76%, rgba(255,255,255,.05), transparent 72%)",
   thumb:"background:radial-gradient(58% 52% at 24% 22%, rgba(255,255,255,.16), transparent 72%), radial-gradient(60% 54% at 82% 78%, rgba(255,255,255,.10), transparent 74%), var(--surface-2)"},
  {id:"grid", name:"Grid", cat:"Signature",
   css:"background-image:linear-gradient(var(--border) 1px, transparent 1px),linear-gradient(90deg, var(--border) 1px, transparent 1px);background-size:56px 56px;mask-image:radial-gradient(62% 56% at 50% 46%, #000, transparent 78%);-webkit-mask-image:radial-gradient(62% 56% at 50% 46%, #000, transparent 78%)",
   thumb:"background-color:var(--surface-2);background-image:linear-gradient(var(--border-strong) 1px, transparent 1px),linear-gradient(90deg, var(--border-strong) 1px, transparent 1px);background-size:14px 14px"},
  {id:"none", name:"None", cat:"Signature", css:"", thumb:"background:var(--surface-2)"},

  {id:"aurora", name:"Aurora", cat:"Gradient",
   css:"background:radial-gradient(70% 52% at 18% 8%, var(--bloom-a), transparent 66%), radial-gradient(64% 48% at 84% 22%, var(--bloom-b), transparent 68%), radial-gradient(70% 60% at 50% 104%, var(--bloom-c), transparent 70%);filter:blur(24px)",
   thumb:"background:radial-gradient(72% 60% at 16% 6%, var(--bloom-a), transparent 68%), radial-gradient(66% 54% at 86% 24%, var(--bloom-b), transparent 70%), radial-gradient(74% 66% at 50% 108%, var(--bloom-c), transparent 72%), var(--surface-2)"},
  {id:"horizon", name:"Horizon", cat:"Gradient",
   css:"background:linear-gradient(180deg, transparent 0%, var(--accent-faint) 58%, transparent 100%), radial-gradient(90% 40% at 50% 72%, var(--accent-soft), transparent 70%)",
   thumb:"background:linear-gradient(180deg, var(--surface-2) 0%, var(--accent-faint) 58%, var(--surface-2) 100%), radial-gradient(90% 44% at 50% 74%, var(--accent-soft), transparent 70%)"},
  {id:"dusk", name:"Dusk", cat:"Gradient",
   css:"background:linear-gradient(200deg, var(--bloom-c) -10%, transparent 46%), linear-gradient(20deg, var(--bloom-b) -10%, transparent 52%);opacity:.5",
   thumb:"background:linear-gradient(200deg, var(--bloom-c) -12%, transparent 48%), linear-gradient(20deg, var(--bloom-b) -12%, transparent 54%), var(--surface-2)"},
  {id:"ember", name:"Ember", cat:"Gradient",
   css:"background:radial-gradient(60% 70% at 84% 96%, var(--bloom-a), transparent 64%), radial-gradient(50% 60% at 10% 96%, var(--bloom-c), transparent 66%)",
   thumb:"background:radial-gradient(64% 76% at 84% 100%, var(--bloom-a), transparent 66%), radial-gradient(54% 66% at 8% 100%, var(--bloom-c), transparent 68%), var(--surface-2)"},

  {id:"mesh", name:"Mesh", cat:"Abstract",
   css:"background-image:radial-gradient(var(--border-strong) 1px, transparent 1px);background-size:22px 22px;mask-image:radial-gradient(70% 62% at 50% 46%, #000, transparent 76%);-webkit-mask-image:radial-gradient(70% 62% at 50% 46%, #000, transparent 76%)",
   thumb:"background-color:var(--surface-2);background-image:radial-gradient(var(--border-strong) 1px, transparent 1px);background-size:8px 8px"},
  {id:"contour", name:"Contour", cat:"Abstract",
   css:"background:repeating-radial-gradient(circle at 30% 110%, transparent 0 22px, var(--border) 22px 23px);mask-image:radial-gradient(80% 70% at 40% 80%, #000, transparent 78%);-webkit-mask-image:radial-gradient(80% 70% at 40% 80%, #000, transparent 78%)",
   thumb:"background:repeating-radial-gradient(circle at 26% 116%, var(--surface-2) 0 9px, var(--border-strong) 9px 10px)"},
  {id:"weave", name:"Weave", cat:"Abstract",
   css:"background:repeating-linear-gradient(48deg, transparent 0 16px, var(--border) 16px 17px), repeating-linear-gradient(-48deg, transparent 0 16px, var(--border) 16px 17px);opacity:.7",
   thumb:"background-color:var(--surface-2);background-image:repeating-linear-gradient(48deg, transparent 0 7px, var(--border-strong) 7px 8px), repeating-linear-gradient(-48deg, transparent 0 7px, var(--border-strong) 7px 8px)"},
  {id:"halo", name:"Halo", cat:"Abstract",
   css:"background:repeating-radial-gradient(circle at 50% 50%, transparent 0 46px, var(--accent-line) 46px 47px);mask-image:radial-gradient(60% 60% at 50% 50%, #000, transparent 72%);-webkit-mask-image:radial-gradient(60% 60% at 50% 50%, #000, transparent 72%)",
   thumb:"background:repeating-radial-gradient(circle at 50% 50%, var(--surface-2) 0 11px, var(--accent-line) 11px 12px)"},
  {id:"drift", name:"Drift", cat:"Abstract",
   css:"background:conic-gradient(from 210deg at 32% 38%, var(--bloom-b), transparent 38%), conic-gradient(from 20deg at 76% 70%, var(--bloom-a), transparent 34%);filter:blur(30px);opacity:.6",
   thumb:"background:conic-gradient(from 210deg at 32% 38%, var(--bloom-b), transparent 38%), conic-gradient(from 20deg at 76% 70%, var(--bloom-a), transparent 34%), var(--surface-2)"},
  {id:"scan", name:"Scanlines", cat:"Abstract",
   css:"background:repeating-linear-gradient(0deg, var(--border) 0 1px, transparent 1px 7px);mask-image:linear-gradient(180deg, #000, transparent 88%);-webkit-mask-image:linear-gradient(180deg, #000, transparent 88%)",
   thumb:"background-color:var(--surface-2);background-image:repeating-linear-gradient(0deg, var(--border-strong) 0 1px, transparent 1px 5px)"}
];

const THEMES = [
  {id:"dark", label:"Dark", group:"Dark", bg:"#0b0c0b", surface:"#1a1c19", ink:"#f2f3ef", accent:"#c8f04b"},
  {id:"indigo", label:"Indigo", group:"Dark", bg:"#0a0b13", surface:"#1a1b26", ink:"#f0f1fa", accent:"#8b93ff"},
  {id:"slate", label:"Slate", group:"Dark", bg:"#100e0c", surface:"#211c17", ink:"#f4f0ea", accent:"#e8a14a"},
  {id:"plum", label:"Plum", group:"Dark", bg:"#100a10", surface:"#20151f", ink:"#f6eef4", accent:"#f077b0"},
  {id:"ember", label:"Ember", group:"Dark", bg:"#0b0b0b", surface:"#1c1714", ink:"#f7f3ef", accent:"#f4561a"},
  {id:"harbour", label:"Oranmore", group:"Dark", bg:"#0f1013", surface:"#1a1b20", ink:"#f3f3f2", accent:"#F4633A"},
  {id:"cargo", label:"Cargo", group:"Dark", bg:"#0a0a0a", surface:"#1a1c1a", ink:"#f2f5f2", accent:"#4ade80"},
  {id:"ocean", label:"Ocean", group:"Dark", bg:"#080e12", surface:"#141f25", ink:"#eaf4f8", accent:"#4fd4d0"},
  {id:"graphite", label:"Graphite", group:"Dark", bg:"#111112", surface:"#212124", ink:"#f4f4f5", accent:"#f4f4f5"},
  {id:"light", label:"Oranmore light", group:"Light", bg:"#f4f2ed", surface:"#ffffff", ink:"#16181c", accent:"#D9512A"},
  {id:"warm", label:"Warm paper", group:"Light", bg:"#faf5ec", surface:"#fffdf9", ink:"#2a2016", accent:"#c9683f"},
  {id:"mist", label:"Mist", group:"Light", bg:"#eef1f4", surface:"#ffffff", ink:"#141e20", accent:"#0e9f6e"},
  {id:"sand", label:"Sand", group:"Light", bg:"#f6f1e6", surface:"#fffdf7", ink:"#221d12", accent:"#7d5fd6"}
];

const ADMIN_ICONS = {
  people:"M12 12.5a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z M5 20.2c.9-3.1 3.6-4.9 7-4.9s6.1 1.8 7 4.9",
  teams:"M9 12a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 12Z M16.5 12.5a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z M2.6 19.6c.8-2.8 3.2-4.4 6.4-4.4s5.6 1.6 6.4 4.4 M17 15.4c2.2.4 3.7 1.8 4.3 4.2",
  structure:"M4.5 20V6.4A1.4 1.4 0 0 1 5.9 5h6.2a1.4 1.4 0 0 1 1.4 1.4V20 M13.5 10.5h4.6A1.4 1.4 0 0 1 19.5 12v8 M3 20h18 M7.5 8.5h2.5 M7.5 12h2.5",
  shield:"M12 3.6 19.5 6v6.1c0 4-3.1 6.9-7.5 8.3-4.4-1.4-7.5-4.3-7.5-8.3V6L12 3.6Z M9.2 12.2l2 2 3.6-3.7",
  agent:"M2 12h4l2.5-6 3.5 12 3-8 2 2h5",
  flow:"M18.5 8.5A5 5 0 0 0 8.9 7.3 3.8 3.8 0 0 0 6 14.6 M8 17.5l3.2 3.2 M11.2 20.7l3.2-3.2 M11.2 20.7V9.6",
  plug:"M9 3.5v5 M15 3.5v5 M6.5 8.5h11v3a5.5 5.5 0 0 1-11 0v-3Z M12 17v3.5",
  modules:"M6.6 4.4h10.8a2.2 2.2 0 0 1 2.2 2.2v10.8a2.2 2.2 0 0 1-2.2 2.2H6.6a2.2 2.2 0 0 1-2.2-2.2V6.6a2.2 2.2 0 0 1 2.2-2.2Z M4.4 9.6h15.2 M9.6 19.6V9.6",
  health:"M3 12.5h3.4l2-5 3 10 2.2-5H21",
  lock:"M6.5 10.5h11a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19v-7a1.5 1.5 0 0 1 1.5-1.5Z M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3",
  audit:"M8 3.5h8l3.5 3.5v13a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 6 3.5h2Z M9 12h6 M9 16h4",
  brand:"M12 3.5 14.6 9l6.4.6-4.8 4.2 1.4 6.2-5.6-3.3-5.6 3.3 1.4-6.2L3 9.6 9.4 9 12 3.5Z",
  bell:"M6 8.5a6 6 0 0 1 12 0c0 6.5 2.6 8.5 2.6 8.5H3.4S6 15 6 8.5Z M10.3 20.5a1.94 1.94 0 0 0 3.4 0",
  data:"M4.5 7.5c0-1.7 3.4-3 7.5-3s7.5 1.3 7.5 3-3.4 3-7.5 3-7.5-1.3-7.5-3Z M4.5 7.5v9c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-9 M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3"
};

const ADMIN_CARDS = [
  {id:"structure", group:"ORGANISATION", title:"Oranmore Precast Limited", icon:"structure", tint:"#F4633A",
   blurb:"UK company 07818950, incorporated 2011. National customer base served from two plants.",
   tags:["2 plants","GBP","Europe/London"],
   listLabel:"ORGANISATION",
   rows:[["Legal name","Oranmore Precast Limited"],["Trading as","Oranmore Precast"],["Company number","07818950"],
     ["Brandon plant","Mundford Road, Weeting, Norfolk, IP27 0PL"],["Lound plant","Chainbridge Lane, Lound, Retford, DN22 8RU"],
     ["Published capability","~10,000 m² hollowcore per week, combined"],["Products","Hollowcore, beam & block, stairs & landings, lift shafts, bespoke, Twinwall"],
     ["Currency, dates, timezone","GBP · UK dates · Europe/London"]]},
  {id:"people", group:"ORGANISATION", title:"People & access", icon:"people", tint:"#6ad0f0",
   blurb:"Public management roles plus fictional demo staff. No private contact details are held.",
   tags:["8 demo logins","2 external previews"],
   footer:"Demo roster only", action:"Review",
   listLabel:"WHAT YOU CONTROL HERE",
   rows:[["Invite or remove people",""],["Assign a team","8 teams"],["Assign a plant","Brandon · Lound"],["Suspend accounts","0 suspended"]]},
  {id:"teams", group:"TEAMS", title:"Teams", icon:"teams", tint:"#f0c04b",
   blurb:"Department leads co-design the product. Each team owns a stage of the journey.",
   tags:["8 teams"],
   listLabel:"TEAMS AND WHAT THEY OWN",
   rows:[["Commercial","Enquiries, quotes, contract setup"],["Estimating","Take-off, pricing, review gate"],["Design","iThesis packages, RFIs (technical)"],
     ["Plant Operations","Capacity, production (iThesis)"],["Quality/Yard","Inspection sign-off, stock, staging"],["Transport","Carrier bookings, POD review"],
     ["Finance","Invoice readiness, Sage, debtors"],["Leadership","Ross Melville and Richard Burke (Managing Directors), Mark Burrage (Associate Director)"]]},
  {id:"leaders", group:"TEAMS", title:"Public management roles", icon:"people", tint:"#9d8cf5",
   blurb:"Roles as published on oranmore.co.uk. No tasks, actions or emails are attributed to these people in the demo.",
   tags:["Verified public roles"],
   listLabel:"ROLES",
   rows:[["Ross Melville","Managing Director"],["Richard Burke","Managing Director"],["Chris Audin","Sales Manager"],["Mark Burrage","Associate Director"],
     ["Dave Ferreday","Engineering"],["Ricki Mann","Lound Operations Manager"],["Mike Peters","Brandon Wetcast Manufacturing Manager"],["Jane O'Connor","Project advocate (title to confirm)"]]},
  {id:"roles", group:"PERMISSIONS", title:"Roles & permissions", icon:"shield", tint:"var(--accent)",
   blurb:"Who can see margin, approve prices, release QA, accept PODs and approve invoices.",
   tags:["6 roles","3 scopes"],
   heroLabel:"THE QUESTION THIS ANSWERS", heroAction:"Preview as a customer",
   heroText:"Customers see only their own projects, requests, milestones and released delivery evidence. Margin, internal notes and competing bids are never shown.",
   listLabel:"APPROVAL RIGHTS",
   rows:[["Quote review and release","Estimating manager · Commercial lead"],["Contract summary approval","Commercial lead"],["Design release","Design + planner sign-off"],
     ["QA release","QA inspector"],["POD acceptance","Transport planner"],["Invoice approval and Sage handoff","Finance lead"],["View margin","Commercial and Leadership only", true]]},
  {id:"external", group:"PERMISSIONS", title:"External portals", icon:"lock", tint:"#8fa6ff",
   blurb:"Customer and carrier previews are permission-filtered. Simulated role switch, not real sign-in.",
   tags:["Customer","Carrier"],
   listLabel:"WHAT IS FILTERED",
   rows:[["Customer sees","Own projects, RFIs, approvals, milestones, released POD"],["Customer never sees","Margin, competitor bids, internal notes, Sage data", true],
     ["Carrier sees","Own loads, collection and delivery windows, POD steps"],["Carrier never sees","Values, invoices, other carriers", true]]},
  {id:"integrations", group:"SYSTEMS & INTEGRATIONS", title:"Systems & integrations", icon:"plug", tint:"#6ad0f0",
   blurb:"iThesis stays authoritative for design and production. Everything here is Concept / Demo, not live.",
   tags:["6 systems","0 live"], badge:"Concept / Demo", badgeKind:"warn",
   footer:"No integration has run. All activity shown is simulated.", action:"Review",
   listLabel:"CONNECTIONS",
   rows:[["iThesis","API/vendor connectivity to validate"],["Sage","Edition and API to confirm"],["Excel","Sample schema mapping"],["Email inboxes","Requires approval and integration discovery"],
     ["Carrier portal","Simulated"],["Customer portal","Simulated"]]},
  {id:"health", group:"SYSTEMS & INTEGRATIONS", title:"Data lineage & health", icon:"health", tint:"#e2705c",
   blurb:"Where each record came from, when it was last notionally updated, and what needs review.",
   tags:["4 issue types","Demo data"], badge:"1 conflict", badgeKind:"warn",
   footer:"Last mock scan 09 Nov 08:40", action:"Review",
   listLabel:"ISSUES FOUND",
   trend:[9,8,8,7,6,5,4],
   bySeverity:[["High","2",RED],["Medium","1",AMBER],["Low","1",DIM]],
   issues:[["Carrier claim without POD","1","high","LOAD-4481 claimed 06 Nov 16:10, no evidence","Review"],
     ["Duplicate import row","1","medium","Transport planner: LOAD-4483 appears twice","Review"],
     ["Competing bids on one development","2","low","Wharfside Block C: Kier and Morgan Sindall kept separate","Review"],
     ["Disputed quantity","1","high","LOAD-4482: 35 of 36 planks","Review"]],
   rows:[]},
  {id:"audit", group:"GOVERNANCE", title:"Audit & governance", icon:"audit", tint:"#9d8cf5",
   blurb:"Every approval, simulated integration event and agent action is written to one ordered log.",
   tags:["Append-only","Demo policies"],
   listLabel:"DEMO POLICIES",
   rows:[["All values are illustrative","snapshot 09 Nov 2026", true],["No outbound email","sends are simulated", true],["No integration writeback","iThesis, Sage read-only or simulated", true],
     ["Human gates","pricing, design, QA, POD, invoice", true],["Real company names","used only as named customers; projects and values are fictional", true]]},
  {id:"agents", group:"AI CONTROLS", title:"AI controls", icon:"agent", tint:"var(--accent)",
   blurb:"Agents read, draft and flag. People approve anything that changes a price, drawing, QA status, POD or invoice.",
   tags:["8 agents","All writes need a yes"],
   heroLabel:"GLOBAL CONTROL", heroAction:"Pause every agent",
   heroText:"One switch stops every agent. In this demo all agent output is simulated from the shared records.",
   listLabel:"WHAT AGENTS MAY NOT DO",
   rows:[["Price structural precast work","never", true],["Approve design or release production","never", true],["Accept a POD from a claim alone","never", true],
     ["Approve or export invoices","never", true],["Send email or portal messages","draft only", true],["Change iThesis schedules","never", true]]},
  {id:"brand", group:"EXPERIENCE", title:"Branding", icon:"brand", tint:"var(--accent)",
   blurb:"Official Oranmore Precast mark from oranmore.co.uk. Colours sampled from the public site.",
   tags:["#F4633A","#2C2D32"],
   listLabel:"BRAND",
   rows:[["Logo","oranmore.co.uk mark"],["Accent","#F4633A (sampled)"],["Charcoal","#2C2D32 (sampled)"],["Grey","#54565E (sampled)"],["Customer portal branding","on", true]]},
  {id:"appearance", group:"EXPERIENCE", title:"Appearance & themes", icon:"brand", tint:"#6ad0f0",
   blurb:"Pick a light or dark theme for how Pulse looks to you.",
   tags:["Oranmore dark","Oranmore light"],
   listLabel:"THEMES", rows:[]}
];

const ADMIN_GROUPS = [
  ["ORGANISATION", "repeat(2,1fr)"],
  ["TEAMS", "repeat(2,1fr)"],
  ["PERMISSIONS", "repeat(2,1fr)"],
  ["SYSTEMS & INTEGRATIONS", "repeat(2,1fr)"],
  ["GOVERNANCE", "repeat(1,1fr)"],
  ["AI CONTROLS", "repeat(1,1fr)"],
  ["EXPERIENCE", "repeat(2,1fr)"]
];

/* ---- activity feeds ---- */
const SRC_TINT = {Email:"#f07a9d", Excel:"#5fe0a8", iThesis:"#9d8cf5", Sage:"#6ad0f0", Carrier:"#f0c04b",
  Customer:"#8fa6ff", Staff:"var(--accent)", Agent:"var(--accent)", Pulse:"var(--accent)"};
const SRC_ABBR = {Email:"EM", Excel:"XL", iThesis:"IT", Sage:"SG", Carrier:"CR", Customer:"CU", Staff:"ST", Agent:"AI", Pulse:"PL"};

const DATA_EVENTS = [];

const PEOPLE_EVENTS = [];

const AI_EVENTS = [];

const STREAM_DEFS = [
  {id:"data", title:"Systems & partners", sub:"iThesis, Sage, carriers, email, Excel (illustrative)", pool:DATA_EVENTS, every:3200,
   tint:"#6ad0f0", icon:"M4.5 7.5c0-1.7 3.4-3 7.5-3s7.5 1.3 7.5 3-3.4 3-7.5 3-7.5-1.3-7.5-3Z M4.5 7.5v9c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3v-9 M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3"},
  {id:"people", title:"People & customers", sub:"Staff decisions and portal actions", pool:PEOPLE_EVENTS, every:6400,
   tint:"#f0c04b", icon:"M12 12.5a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z M5 20.2c.9-3.1 3.6-4.9 7-4.9s6.1 1.8 7 4.9"},
  {id:"ai", title:"Agents", sub:"Simulated agents at work", pool:AI_EVENTS, every:4600,
   tint:"var(--accent)", icon:"M2 12h4l2.5-6 3.5 12 3-8 2 2h5"}
];

const NAV = [
  {label:"Home", icon:"helios", page:"Home"},
  {label:"Agents", icon:"navAgents", page:"Agents"},
  {label:"Dashboard", icon:"navDash", page:"Dashboard", dot:true},
  {label:"Commercial", icon:"navCommercial", page:"Commercial"},
  {label:"Projects", icon:"navProjects", page:"Projects"},
  {label:"Plants & Planning", icon:"navPlants", page:"Plants & Planning"},
  {label:"Logistics", icon:"navLogistics", page:"Logistics"},
  {label:"Finance", icon:"navFinance", page:"Finance"},
  {label:"Records", icon:"navRecords", page:"Records"},
  {label:"Activity", icon:"pulseLine", page:"Activity", dot:true}
];

/* Inbox items follow the real InboxItem shape: what happened, why it matters, what I can do. */
/* Inbox items are now derived from the shared Oranmore state (src/oranmore/shellData.ts). */
const ITEMS = {};
const ORDER = [];

const ANSWERS = {
  fallback:{tool:"pulse_search", effect:"read", text:"Answers now come from the shared Oranmore records (src/oranmore/chat.ts).", actions:[]}
};

// Turns a plain-English filter name into a full dashboard area — the "primitive
// vibe-coding" bit: no real backend, just a seeded generator so the same phrase
// always produces the same numbers, with direction and vocabulary nudged by
// keywords in the text (expansion/growth trends up, risk/issue trends down, a
// region/cost/people/ops/customer word picks which metrics show).
function synthesizeCustomArea(name){
  const trimmed = (name || "").trim();
  if (!trimmed) return null;
  let seed = 0;
  for (let i = 0; i < trimmed.length; i++) seed = (seed * 31 + trimmed.charCodeAt(i)) >>> 0;
  const rnd = (n) => (((seed >>> (n % 24)) ^ (seed << ((n * 7) % 13))) >>> 0) % 997 / 997;
  const low = trimmed.toLowerCase();
  const has = (...words) => words.some(w => low.indexOf(w) > -1);
  const growth = has("expansion","growth","launch","scale","pilot","new site","open","opening","grow");
  const risk = has("risk","issue","delay","problem","complaint","fault","incident","churn","decline");
  const dir = risk ? -1 : (growth ? 1 : (rnd(2) > 0.45 ? 1 : -1));

  let vocab = "generic";
  if (has("scotland","ireland","wales","england","region","dublin","belfast","cork","galway","london","glasgow","edinburgh"))
    vocab = "region";
  else if (has("cost","spend","budget","saving","margin")) vocab = "cost";
  else if (has("staff","hiring","team","recruit","headcount")) vocab = "people";
  else if (has("supplier","stock","inventory","warehouse","fleet")) vocab = "ops";
  else if (has("customer","client","retention","account")) vocab = "customer";

  const V = {
    region:   {labels:["New enquiries","Orders won","Revenue","Site coverage"], unit:"EUR — 30 DAYS"},
    cost:     {labels:["Spend","Cost per job","Savings found","Budget used"], unit:"EUR — 30 DAYS"},
    people:   {labels:["Headcount","Open roles","Time to hire","Retention"], unit:"PEOPLE"},
    ops:      {labels:["Stock cover","Lead time","Stockouts","Reorders raised"], unit:"DAYS"},
    customer: {labels:["Active accounts","Repeat rate","Churn","NPS"], unit:"ACCOUNTS"},
    generic:  {labels:["Volume","Rate","Cost","Coverage"], unit:"ACTIVITY — 30 DAYS"}
  }[vocab];

  const months = ["Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug"];
  let v0 = 40 + Math.floor(rnd(1) * 220);
  const chart = months.map((m, i) => {
    v0 = Math.max(8, Math.round(v0 * (1 + dir * (0.03 + rnd(i + 3) * 0.07))));
    return [m, v0, String(v0)];
  });
  const metrics = V.labels.map((label, i) => {
    const val = 20 + Math.floor(rnd(i + 5) * 400);
    const pct = 2 + Math.round(rnd(i + 9) * 18);
    const up = dir > 0 ? rnd(i + 12) > 0.25 : rnd(i + 12) > 0.7;
    const bars = [0,1,2,3,4,5,6,7,8].map(k => 0.3 + rnd(i * 3 + k) * 0.7);
    return [label, i === 1 ? pct + "%" : String(val), (up ? "+" : "\u2212") + pct + (i === 1 ? "pt" : "%"), up ? "up" : "down", "vs last month", bars];
  });
  const capName = trimmed.replace(/\b\w/g, c => c.toUpperCase());
  const split = [
    [capName + " \u2014 direct", String(Math.round(v0 * 0.5)), "48%", 1],
    ["Existing pipeline", String(Math.round(v0 * 0.3)), "31%", 0],
    ["Everything else", String(Math.round(v0 * 0.2)), "21%", 0]
  ];
  const table = [1,2,3].map(w => [capName + " \u2014 week " + w, String(20 + Math.floor(rnd(20 + w) * 200)),
    (dir > 0 ? "+" : "\u2212") + (3 + Math.floor(rnd(23 + w) * 14)) + "%", "Auto-tagged from records mentioning \u201c" + low + "\u201d"]);
  table.push(["Everything else", String(20 + Math.floor(rnd(30) * 200)), "\u2014", "Baseline"]);
  return {
    id: trimmed, label: capName, color: "var(--accent)", owner: "CUSTOM FILTER",
    description: "Generated from \u201c" + trimmed + "\u201d \u2014 a plain-English filter, not a registered metric set. Refine it and Pulse will tighten this up.",
    kind: "columns", chartTitle: capName + " over time", chartUnit: V.unit,
    chart, splitTitle: "Where \u201c" + low + "\u201d shows up", split,
    tableCols: ["Item","Value","Change","Note"], table,
    metrics, legend: [capName, "Pipeline", "Other"]
  };
}

function pickAnswer(q){
  return ANSWERS.fallback;
}

const ORGS = [
  ["BAM Construction","Customer","£0","—","tendering"],
  ["Mace","Customer","£0","—","active"],
  ["Laing O'Rourke","Customer","£0","—","active"]
];
const TEAMS = [
  ["Commercial","demo","Commercial Lead (demo)","quotes, contracts"],
  ["Transport","demo","Transport Planner (demo)","loads, POD"],
  ["Finance","demo","Finance Lead (demo)","invoices"]
];
const LOCATIONS = [
  ["Brandon","Mundford Road, Weeting, Norfolk, IP27 0PL","plant","active"],
  ["Lound","Chainbridge Lane, Lound, Retford, DN22 8RU","plant","active"]
];

const AGENT_DEFS = [
  {id:"o2c", name:"Order-to-cash desk", shape:"rim-capsule", tint:"#1b2430", state:"working", group:true,
   members:["dispatch","finance","ops"], role:"Dispatch & POD, Finance Readiness and Ops Watchdog working the same Eastbourne load",
   when:"08:20", preview:"dispatch: LOAD-4481 still has no proof.",
   thread:[
     {kind:"stamp", text:"Today 08:15"},
     {kind:"routine", text:"Ran routine", routine:"Unverified delivery check"},
     {kind:"agent", from:"ops", text:"LOAD-4481 was marked delivered on 06 Nov at 16:10. No photo, no receiver signature, 64 hours later."},
     {kind:"agent", from:"dispatch", text:"i've drafted a request to Fenway Haulage for the unloading photo and the receiver's name. nothing sends until you say so."},
     {kind:"agent", from:"finance", text:"INV-DR-4481, \u00a387,000, stays held. it is not in the invoice-ready total and won't be until a person accepts the POD."},
     {kind:"user", text:"send the request and let me know when it lands"},
     {kind:"agent", from:"dispatch", text:"request marked sent (simulated). when the carrier submits evidence it goes to Daniel's review queue, not straight to verified."}
   ]},
  {id:"briefing", name:"Briefing", shape:"crown-pebble", tint:"#191c1f", state:"complete", role:"Reads enquiries, orders, plant, loads and Sage drafts every morning and tells you what matters",
   when:"07:00", preview:"BAM estimate due tomorrow. \u00a387k held on LOAD-4481.",
   thread:[
     {kind:"stamp", text:"Today 07:00"},
     {kind:"routine", text:"Ran routine", routine:"Morning briefing"},
     {kind:"agent", text:"morning briefing, Mon 09 Nov:", lines:[
       {k:"Commercial", v:"BAM Meridian House \u00b7 \u00a31,240,000 indicative estimate due 10 Nov \u00b7 manager review still needed"},
       {k:"Delivery", v:"LOAD-4481 Eastbourne \u00b7 claimed delivered, no verified POD \u00b7 \u00a387,000 held"},
       {k:"Projects", v:"Mace Riverside Tower \u00b7 2 blocking RFIs before design handover, due 11 Nov"},
       {k:"Plant", v:"w/c 09 Nov hollowcore 77% committed \u00b7 2,300 m\u00b2 free"}]},
     {kind:"agent", text:"two things need a person today: Hannah's review of the Meridian House estimate, and proof of delivery for LOAD-4481. finance can review \u00a3112,000 for North Leeds whenever Grace is ready."},
     {kind:"user", text:"remind me about the BAM review at 2"},
     {kind:"agent", text:"done. reminder set for 14:00 against QUO-26-104. i won't touch the price: that stays with the estimators."}
   ]},
  {id:"ops", name:"Ops Watchdog", shape:"shield", tint:"#2b1b1e", state:"attention", role:"Watches every handoff for blockers, stalled steps, missing approvals and unverified carrier updates",
   when:"08:15", preview:"LOAD-4481 claimed 64h ago, still no proof.",
   thread:[
     {kind:"stamp", text:"Today 08:15"},
     {kind:"agent", text:"four handoffs are stuck: LOAD-4481 (claim with no proof), RFI-1032 and RFI-1034 (Mace, blocking design), ITH-DES-0907 R05 (Goldbeck approval due 12 Nov) and LOT-L-1190 (QA sign-off before tomorrow's collection)."},
     {kind:"agent", text:"one data issue: the transport planner import had a duplicate LOAD-4483 row. i parked it for review rather than merging it."}
   ]},
  {id:"intake", name:"Inquiry Intake", shape:"glass-visor", tint:"#16241f", state:"working", role:"Reads incoming enquiry emails, drafts the record and flags what a person must confirm",
   when:"08:52", preview:"new ITT from Morgan Sindall waiting for you.",
   thread:[
     {kind:"stamp", text:"Today 08:52"},
     {kind:"agent", text:"a new ITT arrived: Holbeck Yard Car Park, Leeds. i've drafted the enquiry with 6 attachments kept. two fields are low confidence: contractor status and preferred plant. it won't be saved until you confirm them in Commercial."},
     {kind:"agent", text:"for reference: Wharfside Quarter Block C already has two contractors tendering. i kept their enquiries separate."}
   ]},
  {id:"quotes", name:"Quotation Coordinator", shape:"executive-capsule", tint:"#2a2118", state:"waiting", role:"Tracks estimator deadlines, review gates and bid-status hygiene. Never prices work",
   when:"08:30", preview:"3 quotes due in 3 days, 1 overdue.",
   thread:[
     {kind:"stamp", text:"Today 08:30"},
     {kind:"agent", text:"three quotes are due within three days: Meridian House (10 Nov), Peterborough MSCP (11 Nov) and one more. Halifax Retail Park went past its 06 Nov date: worth asking Calder for an extension."},
     {kind:"user", text:"can you price meridian house?"},
     {kind:"agent", text:"no. structural precast pricing stays with Olivia and Hannah. i can chase the review, tidy the checklist and remind BAM about the stair core query."}
   ]},
  {id:"contract", name:"Contract & RFI", shape:"precision-brow", tint:"#1b2430", state:"waiting", role:"Prefills the Contract Detail Summary, drafts client information requests and tracks answers",
   when:"Fri", preview:"RFI-1032 and RFI-1034 still with Mace.",
   thread:[
     {kind:"stamp", text:"Friday 15:02"},
     {kind:"agent", text:"Riverside Tower contract summary is prefilled from QUO-26-088: customer, site, products and \u00a32,850,000 carried over. 7 RFIs raised, 3 answered, 2 of the 4 open ones block design."},
     {kind:"agent", text:"second reminder on RFI-1032 marked sent (simulated). the seven letters are drafts until someone approves them."}
   ]},
  {id:"capacity", name:"Capacity Sentinel", shape:"control-cube", tint:"#16241f", state:"thinking", role:"Compares firm and tentative demand at Brandon and Lound. Simulates, never books",
   when:"Sun", preview:"Lound 72.5%. a 1,500 m\u00b2 win would overload it.",
   thread:[
     {kind:"stamp", text:"Sunday 18:00"},
     {kind:"agent", text:"w/c 09 Nov: Brandon 4,800 of 6,000 m\u00b2 (80%), Lound 2,900 of 4,000 m\u00b2 (72.5%). Kier Westbridge's 2,400 m\u00b2 is already inside Lound's figure."},
     {kind:"agent", text:"if Harlow & Pike award Cambridge (1,500 m\u00b2) and it lands at Lound that week, Lound goes 400 m\u00b2 over. that's a scenario, not a booking: iThesis and the planners decide."}
   ]},
  {id:"constraints", name:"Constraint Analyst", shape:"tall-unit", tint:"#2a1f16", state:"attention", role:"Finds the one step that limits throughput from enquiry to cash, explains it and flags it to the owner",
   when:"08:30", preview:"estimating is the binding constraint this week.",
   thread:[
     {kind:"stamp", text:"Today 08:30"},
     {kind:"routine", text:"Ran routine", routine:"Constraint analysis"},
     {kind:"agent", text:"binding constraint this week: estimating. Sam Patel is carrying 43 drawing packages against a working limit of 30, with quotes due inside seven days."},
     {kind:"agent", text:"next tightest: design release (Mace RFI-1032 and RFI-1034 hold \u00a32.85m of awarded work) and QA sign-off before Tuesday and Wednesday collections. plant is not the constraint: Brandon peaks at 80%, Lound at 75%."},
     {kind:"user", text:"so adding plant capacity wouldn't help?"},
     {kind:"agent", text:"not this month. more beds would sit idle behind design and estimating. i've flagged the estimating load to the estimating lead. i don't move work between people: that's their call."}
   ]},
  {id:"dispatch", name:"Dispatch & POD", shape:"low-dome", tint:"#241b2e", state:"working", role:"Chases carriers for proof, compares claimed and verified deliveries, routes disputes to people",
   when:"08:20", preview:"requested POD for LOAD-4481.",
   thread:[
     {kind:"stamp", text:"Today 08:20"},
     {kind:"agent", text:"carrier says delivered is not delivered. LOAD-4481 has a claim only. LOAD-4482 has evidence but the receiver counted 35 of 36 planks, so it is in Daniel's dispute queue."}
   ]},
  {id:"finance", name:"Finance Readiness", shape:"offset-pebble", tint:"#191c1f", state:"waiting", role:"Builds the invoice-ready queue from verified PODs and proposes Sage handoffs for approval",
   when:"Fri", preview:"\u00a3112k ready for review. \u00a3121.5k held.",
   thread:[
     {kind:"stamp", text:"Friday 16:30"},
     {kind:"agent", text:"INV-DR-4484 (North Leeds, \u00a3112,000 net) is ready for finance review: POD accepted 06 Nov at 11:42. Sage handoff not submitted."},
     {kind:"agent", text:"held: INV-DR-4481 \u00a387,000 (no verified POD) and INV-DR-4482 \u00a334,500 (quantity query). the Sage connection is illustrative, so any export here is a simulation."}
   ]}
];

const KPI_DEFS = {};

/* Dashboard tabs. Numbers come from src/oranmore/kpiBand.ts and the Oranmore pages. */
const ASPECT_DEFS = [["executive","Executive"],["commercial","Commercial"],["plant","Plant"],["logistics","Fleet & Logistics"],["finance","Finance"]].map(a => ({
  id:a[0], label:a[1], color:"var(--accent)", owner:"ORANMORE", description:"", kind:"columns",
  chartTitle:"", chartUnit:"", chart:[["Oct",1,""],["Nov",1,""]], splitTitle:"", split:[], tableCols:["","","",""], table:[], metrics:[]
}));

const FILTER_GROUPS = [
  {title:"AREA", items:["Executive","Commercial","Plant","Logistics","Finance"]}
];

const OPS_DEFS = [
  {id:"o1", name:"Morning briefing", kind:"routine", owner:"Briefing agent", ownerKind:"agent", initials:"BR",
   trigger:"Weekdays, 07:00", triggerKind:"schedule", next:"Tomorrow", last:"Delivered 07:00", status:"healthy", rate:100, on:true,
   what:"Reads enquiries, orders, iThesis snapshots, loads and invoice drafts and posts the few things that need a person today.",
   why:"Department leads were opening five spreadsheets and two inboxes to build the same picture.",
   saved:"8 hours a month",
   steps:[["Trigger","Every weekday at 07:00"],["Find","Due quotes, blocking RFIs, unverified loads, held invoices"],["Check","Drop anything already handled"],["Draft","Write the briefing"],["Send","Post to Home"]],
   runs:[["Today 07:00","21s","ok","1 briefing","£0.02"],["Fri 07:00","19s","ok","1 briefing","£0.02"],["Thu 07:00","23s","ok","1 briefing","£0.02"]]},
  {id:"o2", name:"Unverified delivery check", kind:"automation", owner:"Dispatch & POD agent", ownerKind:"agent", initials:"DP",
   trigger:"Hourly", triggerKind:"schedule", next:"10:00", last:"LOAD-4481 POD request drafted", status:"approval", rate:97, on:true,
   what:"Finds loads a carrier has marked delivered without photo, receiver or signature, drafts a request to the haulier and holds the invoice.",
   why:"A haulier saying 'delivered on time' was the only record, and invoices waited on phone calls.",
   saved:"10 hours a month",
   steps:[["Trigger","Every hour"],["Find","Loads with a claim and no accepted POD"],["Check","Invoice for the load is held"],["Draft","Request to the carrier"],["Approval","Transport planner reviews","gate"],["Send","Request to carrier (simulated)"],["Update","Log against the load"]],
   runs:[["Today 09:00","4s","partial","1 request drafted","£0.01","LOAD-4481: no evidence 64 hours after claim"],["Today 08:00","4s","ok","0 new","£0.00"],["Fri 17:00","5s","partial","1 drafted","£0.01"]]},
  {id:"o3", name:"Enquiry email intake", kind:"automation", owner:"Inquiry Intake agent", ownerKind:"agent", initials:"II",
   trigger:"Email to the commercial inbox", triggerKind:"event", next:"Event-based", last:"Holbeck Yard draft waiting", status:"approval", rate:99, on:true,
   what:"Reads a new ITT email, drafts the enquiry with drawings kept, flags low-confidence fields and possible duplicate developments.",
   why:"Every enquiry was typed into the inquiry log by hand, often days later.",
   saved:"12 hours a month",
   steps:[["Trigger","An email lands in the commercial inbox"],["Find","Match customer and development"],["Draft","Create the draft enquiry"],["Approval","A person confirms low-confidence fields","gate"],["Update","Save the enquiry and assign an estimator task"]],
   runs:[["Today 08:52","6s","partial","1 draft","£0.01","2 fields need confirmation"],["Fri 14:10","7s","ok","1 enquiry","£0.01"],["Thu 11:02","6s","ok","1 enquiry","£0.01"]]},
  {id:"o11", name:"Constraint analysis", kind:"routine", owner:"Constraint Analyst", ownerKind:"agent", initials:"CA",
   trigger:"Weekdays, 08:30 and on every plan change", triggerKind:"schedule", next:"Tomorrow", last:"Estimating flagged as binding", status:"healthy", rate:100, on:true,
   what:"Measures the load on every step from estimating to cash, names the binding constraint and flags it to the owner with a suggested action.",
   why:"Each team optimised its own step, so effort went into steps that were not holding the business back.",
   saved:"6 hours a month",
   steps:[["Trigger","Weekdays at 08:30, and whenever the plan changes"],["Find","Load on estimating, design, plant, QA, haulage and cash"],["Check","Rank by load, then by value at stake"],["Draft","Explain the binding constraint and the knock-on"],["Approval","Owner decides what to change","gate"],["Update","Task to the owner, entry in Activity"]],
   runs:[["Today 08:30","3s","ok","1 binding, 2 tight","\u00a30.01"],["Fri 08:30","3s","ok","1 binding, 3 tight","\u00a30.01"],["Thu 08:30","3s","ok","1 binding, 2 tight","\u00a30.01"]]},
  {id:"o4", name:"Transport planner import", kind:"automation", owner:"Ops Watchdog", ownerKind:"agent", initials:"OW",
   trigger:"Daily, 06:00", triggerKind:"schedule", next:"Tomorrow", last:"1 conflict parked", status:"failed", rate:88, on:true,
   what:"Maps the Excel transport planner rows onto loads, carriers and lots, and parks conflicts for review instead of merging them.",
   why:"The planner spreadsheet and the delivery record disagreed weekly.",
   saved:"5 hours a month",
   steps:[["Trigger","Every day at 06:00"],["Find","New and changed planner rows"],["Check","Duplicates and missing lots"],["Update","Upsert loads"],["Send","Alert on conflicts"]],
   runs:[["Today 06:00","9s","failed","13 of 14 rows","£0.00","Duplicate LOAD-4483 row parked for review"],["Fri 06:00","8s","ok","12 rows","£0.00"],["Thu 06:00","8s","ok","11 rows","£0.00"]]},
  {id:"o5", name:"RFI reminder chase", kind:"routine", owner:"Contract & RFI agent", ownerKind:"agent", initials:"CR",
   trigger:"Weekdays, 09:00", triggerKind:"schedule", next:"Tomorrow", last:"RFI-1032 reminder", status:"healthy", rate:98, on:true,
   what:"Reminds customers about open information requests, blocking ones first, and updates the portal.",
   why:"Blocking questions sat in individual inboxes while design waited.",
   saved:"6 hours a month",
   steps:[["Trigger","Every weekday at 09:00"],["Find","Open RFIs past half their due window"],["Draft","Reminder in the portal"],["Send","Mark reminder sent (simulated)"],["Update","Log against the RFI"]],
   runs:[["Fri 09:00","5s","ok","2 reminders","£0.01"],["Thu 09:00","4s","ok","1 reminder","£0.01"]]},
  {id:"o6", name:"Weekly capacity check", kind:"report", owner:"Capacity Sentinel", ownerKind:"agent", initials:"CS",
   trigger:"Sundays, 18:00", triggerKind:"schedule", next:"Sun 18:00", last:"Brandon 80% · Lound 72.5%", status:"healthy", rate:100, on:true,
   what:"Compares firm and tentative hollowcore demand by plant and week, and flags tentative work that would overload a plant if won.",
   why:"Capacity questions were answered from memory in the Monday meeting.",
   saved:"4 hours a month",
   steps:[["Trigger","Every Sunday at 18:00"],["Find","Firm and tentative commitments"],["Check","Against the illustrative plant split"],["Draft","Write the capacity note"],["Send","Post to Plants & Planning"]],
   runs:[["Sun 18:00","11s","ok","6 weeks","£0.01"],["Sun 01 Nov 18:00","10s","ok","6 weeks","£0.01"]]},
  {id:"o7", name:"Sage reconciliation snapshot", kind:"automation", owner:"Finance Readiness agent", ownerKind:"agent", initials:"FR",
   trigger:"Nightly, 06:00", triggerKind:"schedule", next:"Tomorrow", last:"6 matched · 0 duplicates", status:"healthy", rate:96, on:true,
   what:"Illustrative: matches invoice records against a Sage snapshot by order reference and flags duplicates. Not connected to Sage.",
   why:"Finance could not see which deliveries were billable without asking transport.",
   saved:"7 hours a month",
   steps:[["Trigger","Every night at 06:00"],["Find","Invoices in the Sage snapshot"],["Check","Order reference and duplicate guard"],["Update","Mark reconciled"]],
   runs:[["Sat 06:00","14s","ok","6 matched","£0.01"],["Fri 06:00","13s","ok","6 matched","£0.01"]]},
  {id:"o8", name:"Quote deadline watch", kind:"routine", owner:"Quotation Coordinator", ownerKind:"agent", initials:"QC",
   trigger:"Daily, 08:30", triggerKind:"schedule", next:"Tomorrow", last:"3 due, 1 overdue", status:"healthy", rate:100, on:true,
   what:"Warns estimators three days before a quote is due and flags overdue ones. Never prices work.",
   why:"Deadlines lived in the inquiry log and were missed when the log was not updated.",
   saved:"5 hours a month",
   steps:[["Trigger","Every day at 08:30"],["Find","Quotes due within three days"],["Check","Review gate status"],["Send","Remind the estimator"]],
   runs:[["Today 08:30","3s","ok","3 reminders","£0.00"],["Fri 08:30","3s","ok","2 reminders","£0.00"]]},
  {id:"o9", name:"QA release before collection", kind:"task", owner:"Quality / Yard", ownerKind:"person", initials:"LG",
   trigger:"Day before collection, 15:00", triggerKind:"schedule", next:"Today 15:00", last:"LOT-L-1190 pending", status:"approval", rate:94, on:true,
   what:"Lists lots due for collection tomorrow that have not passed inspection, so an inspector signs off before the haulier arrives.",
   why:"Loads were turned away at the gate for missing QA release.",
   saved:"3 hours a month",
   steps:[["Trigger","Day before collection at 15:00"],["Find","Lots on tomorrow's loads"],["Approval","Inspector signs off","gate"],["Update","Release the lot"]],
   runs:[["Fri 15:00","2s","ok","3 lots","£0.00"],["Thu 15:00","2s","partial","1 of 2","£0.00","LOT-B-2299 on hold"]]},
  {id:"o10", name:"iThesis snapshot refresh", kind:"automation", owner:"Ops Watchdog", ownerKind:"agent", initials:"OW",
   trigger:"Every 30 minutes", triggerKind:"schedule", next:"09:10", last:"10 lots · read-only", status:"healthy", rate:100, on:true,
   what:"Illustrative: refreshes a read-only view of design packages and production lots. Connectivity to iThesis is still to be validated. No writeback.",
   why:"Teams outside design and production had no view of iThesis status.",
   saved:"6 hours a month",
   steps:[["Trigger","Every 30 minutes"],["Find","Changed packages and lots"],["Update","Refresh the read-only snapshot"]],
   runs:[["Today 08:40","6s","ok","10 lots","£0.00"],["Today 08:10","6s","ok","10 lots","£0.00"]]},
  {id:"o11", name:"Weekly management pack", kind:"report", owner:"Briefing agent", ownerKind:"agent", initials:"BR",
   trigger:"Mon, 08:00", triggerKind:"schedule", next:"Mon 16 Nov", last:"Sent to leadership", status:"healthy", rate:97, on:true,
   what:"One page for directors: funnel, plant load, delivery proof and invoice release, from the same records as the dashboards.",
   why:"Directors asked staff to update cells before every meeting.",
   saved:"6 hours a month",
   steps:[["Trigger","Every Monday at 08:00"],["Find","Last week's movement across the journey"],["Draft","Write the commentary"],["Send","Post to leadership"]],
   runs:[["Today 08:00","58s","ok","1 pack","£0.03"],["Mon 02 Nov 08:00","61s","ok","1 pack","£0.03"]]}
];

const OPS_FILTERS = [
  ["all","All"], ["routine","Agent routines"], ["automation","Automations"],
  ["report","Scheduled reports"], ["task","Recurring tasks"], ["approval","Needs approval"], ["failed","Failed"]
];

const WORK_SECTIONS = [
  {id:"tasks", label:"Tasks", blurb:"Everything assigned to you or your team, in one permission-filtered list.",
   views:["All tasks","Due tasks","Review","Done"], filters:["Due date","Any status","Anyone","Any due date"]},
  {id:"approvals", label:"Approvals", blurb:"Requests and their steps. Every decision is written as the person who made it.",
   views:["Awaiting you","Awaiting others","Decided"], filters:["Raised date","Any value","Anyone"]},
  {id:"workflows", label:"Workflows", blurb:"Automations and agent routines — what runs on its own, and who owns it.",
   views:[], filters:[]},
  {id:"schedules", label:"Schedules", blurb:"The team calendar: when recurring work fires and what it costs the week.",
   views:[], filters:[]}
];

/* Work tasks are derived from the shared Oranmore state. */
const WORK_TASKS = [];

const WORKFLOWS = [];

const SCHEDULES = [
  {id:"s1", name:"Morning briefing", cadence:"Every weekday · 07:00", next:"Tomorrow 07:00", owner:"Briefing agent", on:true, day:1},
  {id:"s2", name:"Unverified delivery check", cadence:"Hourly", next:"10:00", owner:"Dispatch & POD", on:true, day:1},
  {id:"s3", name:"Sage reconciliation snapshot", cadence:"Nightly · 06:00", next:"Tomorrow 06:00", owner:"Finance Readiness", on:true, day:0},
  {id:"s4", name:"Weekly capacity check", cadence:"Sundays · 18:00", next:"Sun 18:00", owner:"Capacity Sentinel", on:true, day:6},
  {id:"s5", name:"Weekly management pack", cadence:"Mondays · 08:00", next:"Mon 08:00", owner:"Briefing agent", on:true, day:0}
];

const WIDGET_DEFS = [["journey","Connected journey"],["inbox","Today's attention"],["brief","AI briefing"],["kpi","Today's numbers"],["work","My work"],["activity","Activity"],["visits","Loads moving"]];
const WORK_WIDGETS = [
  {id:"queue", label:"My queue", value:"—", hint:"assigned to you", icon:"work", queue:"mine"},
  {id:"late", label:"Running late", value:"—", hint:"past their due date", icon:"health", queue:"overdue"},
  {id:"unassigned", label:"Unassigned", value:"—", hint:"nobody owns it yet", icon:"teams", queue:"unassigned"},
  {id:"week", label:"Next 7 days", value:"—", hint:"due this week", icon:"visits", queue:"upcoming"}
];
const PERSONALITIES = ["Straight-talking","Warm","Formal","Dry"];
const ANSWER_STYLES = ["Short answers","Show the working","Ask before acting"];
/* Every context source and every registered tool the agent could be granted —
   the builder shows the whole catalogue, grouped, rather than a sample. */
const CONTEXT_DEFS = [
  ["Customers","records","Contractors, contacts, bid history"],
  ["Developments","records","Buildings, competing bids"],
  ["Files","records","Drawing packs, contract documents, POD evidence"],
  ["Enquiries & quotes","work","Due dates, checklists, review gates"],
  ["Orders & RFIs","work","Contract setup, blocking questions"],
  ["Approvals","work","What is waiting on a person"],
  ["iThesis snapshots","plant","Design packages and lots (read-only, illustrative)"],
  ["Capacity","plant","Brandon and Lound commitments"],
  ["Loads & POD","logistics","Carriers, claims, verified proof"],
  ["Invoice drafts","money","Ready, held, handed off"],
  ["Sage snapshot","money","Illustrative, not connected"],
  ["Activity log","system","Every event, agent and human"]
];
const CONTEXT_SOURCES = CONTEXT_DEFS.map(c => c[0]);
const SKILL_DEFS = [
  ["Search records","read"],["Summarise activity","read"],["Read invoices","read"],
  ["Read site visits","read"],["Check permissions","read"],
  ["Draft email","write"],["Create task","write"],["Update record","write"],
  ["Schedule visit","write"],["Raise approval","write"],
  ["Draft customer RFI","external"],["Request carrier POD","external"],["Propose Sage handoff (simulated)","external"],["Post to customer portal","external"]
];
/* The two questions the agent asks back once it knows the job. */
const TRAIN_PHASES = [
  ["Reading the whole ontology", "4,820 records"],
  ["Learning how this business words things", "organisation → customer"],
  ["Researching the precast domain", "12 sources"],
  ["Writing its own system prompt", "1,240 tokens"]
];
const BRIEF_QUESTIONS = [
  {title:"What should it cover?", sub:"Pick as many as you like — we can refine later.",
   options:[["Calendar","Meetings and what is coming up"],["Email","Unread and actionable inbox items"],
            ["Records","Accounts that moved since yesterday"],["Money","Cash, overdue and anything at risk"],
            ["Something else","Tell me in the next message"]]},
  {title:"When should it land?", sub:"One is enough to start.",
   options:[["Every morning 07:00","Before the plants start"],["Weekdays 08:00","Monday to Friday only"],
            ["Only when something changes","Event-driven, no noise"],["On demand","When you ask for it"]]}
];
/* The words under a name, keyed to the same state the face lights with. */
const STATE_LABELS = {working:"working", thinking:"thinking", waiting:"waiting on you",
  complete:"up to date", attention:"needs you", idle:"idle"};

const FACE_SHAPES = [
  ["crown-pebble","Pebble"],["executive-capsule","Executive"],["shield","Shield"],
  ["glass-visor","Visor"],["control-cube","Control cube"],["low-dome","Low dome"],
  ["offset-pebble","Offset pebble"],["rim-capsule","Capsule"],["wide-eyed","Wide-eyed"],
  ["precision-brow","Precision brow"],["tall-unit","Tall unit"],["soft-asymmetric","Soft asymmetric"]
];
/* Shell colours only, deliberately desaturated so none of them reads as a
   state. Each is a pair: the deep shell for light themes and its pale partner
   for dark ones (the eyes take the other). The status light carries the state. */
const FACE_TINTS = [
  ["#191c1f","Graphite","#e3e6e8"],["#1b2430","Slate","#d3dde9"],["#241b2e","Aubergine","#ddd4ea"],
  ["#2a2118","Bronze","#eadccb"],["#16241f","Pine","#d1e4da"],["#2b1b1e","Oxblood","#eed5d7"]
];

/* ---- ontology graph: generation, Dijkstra traversal, canvas render ---- */
const CLUSTERS = [
  ["Customers",          "#F4633A", 0.00, 0.62, 46],
  ["Developments & bids", "#6ad0f0", 0.90, 0.70, 52],
  ["Enquiries & quotes", "#b06cf0", 1.75, 0.66, 58],
  ["Orders & RFIs",      "#f0c04b", 2.55, 0.72, 44],
  ["iThesis design",     "#f0567f", 3.35, 0.60, 38],
  ["Production lots",    "#5fe0a8", 4.15, 0.70, 40],
  ["Loads & POD",        "#81909D", 4.95, 0.64, 30],
  ["Invoices & Sage",    "#5f7cf0", 5.65, 0.72, 34]
];

function mulberry(seed){
  return function(){
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* Hub-and-spoke clusters around a dense phyllotaxis core, in unit space
   (-1..1 on both axes) so the layout is resolution independent. */
const _hexCache = {};
function hexRGB(hex){
  if (_hexCache[hex]) return _hexCache[hex];
  const h = hex.replace("#", "");
  const v = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  _hexCache[hex] = v;
  return v;
}


function buildGraph(){
  const rnd = mulberry(20260902);
  const nodes = [], edges = [], adj = [];
  const add = (x, y, z, r, cluster, kind) => {
    nodes.push({x, y, z, r, cluster, kind}); adj.push([]); return nodes.length - 1;
  };
  const link = (a, b) => {
    const dx = nodes[a].x - nodes[b].x, dy = nodes[a].y - nodes[b].y, dz = nodes[a].z - nodes[b].z;
    const w = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.004;
    const id = edges.length;
    edges.push({a, b, w});
    adj[a].push([b, w, id]); adj[b].push([a, w, id]);
  };

  // the core is a filled sphere on a Fibonacci lattice, not a disc
  const CORE = 880, coreIds = [];
  for (let i = 0; i < CORE; i++){
    const t = (i + 0.5) / CORE;
    const phi = Math.acos(1 - 2 * t);
    const theta = i * 2.39996;
    const shell = 0.16 + 0.28 * Math.pow(rnd(), 0.5);
    const grade = rnd();
    coreIds.push(add(
      Math.sin(phi) * Math.cos(theta) * shell * 1.04,
      Math.cos(phi) * shell * 0.96,
      Math.sin(phi) * Math.sin(theta) * shell,
      grade < 0.06 ? 3.4 + rnd() * 1.4 : grade < 0.3 ? 2.1 + rnd() * 0.7 : 1.0 + rnd() * 0.8, 0, "core"));
  }
  // lattice neighbours plus a mesh of chords, so the sphere reads as a volume
  for (let i = 1; i < coreIds.length; i++){
    link(coreIds[i], coreIds[i - 1]);
    if (i >= 13) link(coreIds[i], coreIds[i - 13]);
    if (i >= 21 && i % 2 === 0) link(coreIds[i], coreIds[i - 21]);
    if (i >= 34 && i % 3 === 0) link(coreIds[i], coreIds[i - 34]);
    if (i >= 55 && i % 4 === 0) link(coreIds[i], coreIds[i - 55]);
    if (i >= 89 && i % 5 === 0) link(coreIds[i], coreIds[i - 89]);
    if (i % 6 === 0) link(coreIds[i], coreIds[Math.floor(rnd() * coreIds.length)]);
  }

  // a mid shell between the nucleus and the lobes: the layer that makes it
  // read as a network rather than a ball with satellites
  const MID = 560, midIds = [];
  for (let i = 0; i < MID; i++){
    const t = (i + 0.5) / MID;
    const phi = Math.acos(1 - 2 * t), theta = i * 2.39996 + 0.7;
    const d = 0.52 + 0.16 * Math.pow(rnd(), 0.6);
    const g2 = rnd();
    midIds.push(add(
      Math.sin(phi) * Math.cos(theta) * d * 1.02,
      Math.cos(phi) * d * 0.96,
      Math.sin(phi) * Math.sin(theta) * d,
      g2 < 0.05 ? 2.6 + rnd() * 1.0 : g2 < 0.3 ? 1.6 + rnd() * 0.6 : 0.8 + rnd() * 0.7, 0, "core"));
  }
  for (let i = 0; i < midIds.length; i++){
    if (i >= 1) link(midIds[i], midIds[i - 1]);
    if (i >= 17) link(midIds[i], midIds[i - 17]);
    if (i >= 29 && i % 2 === 0) link(midIds[i], midIds[i - 29]);
    // radial spokes tying the shell to the nucleus
    if (i % 2 === 0) link(midIds[i], coreIds[Math.floor(rnd() * coreIds.length)]);
    if (i % 9 === 0) link(midIds[i], coreIds[Math.floor(rnd() * coreIds.length)]);
  }

  // clusters ride a sphere: each hub gets its own latitude as well as longitude
  const hubs = [], clusterLeaves = [];
  const onSphere = (lon, lat, d0) => { const d = d0 * 1.22;
    return [Math.cos(lat) * Math.cos(lon) * d * 1.02, Math.sin(lat) * d * 0.96, Math.cos(lat) * Math.sin(lon) * d]; };
  CLUSTERS.forEach((c, ci) => {
    const [, , ang, dist, leaves] = c;
    const lat = (ci % 2 ? 1 : -1) * (0.26 + rnd() * 0.5);
    const wob = 1.06 + rnd() * 0.16;
    const hp = onSphere(ang, lat, dist * wob);
    const hub = add(hp[0], hp[1], hp[2], 5.4, ci, "hub");
    hubs.push(hub);
    const mine = [];
    clusterLeaves.push(mine);
    for (let k = 0; k < 3; k++) link(hub, coreIds[Math.floor(rnd() * coreIds.length)]);
    for (let k = 0; k < 5; k++) link(hub, midIds[Math.floor(rnd() * midIds.length)]);

    const subs = 5 + Math.floor(rnd() * 4);
    const subIds = [];
    for (let s = 0; s < subs; s++){
      const sa = ang + (rnd() - 0.5) * 0.52, sl = lat + (rnd() - 0.5) * 0.3;
      const sd = dist + 0.08 + rnd() * 0.18;
      const sp = onSphere(sa, sl, sd);
      const sub = add(sp[0], sp[1], sp[2], 3.2, ci, "sub");
      subIds.push(sub);
      link(sub, hub);
      if (s > 0 && rnd() < 0.7) link(sub, subIds[s - 1]);
      const fan = Math.floor((leaves * 7.4) / subs);
      const spread = 0.17 + rnd() * 0.2;
      let prev = -1;
      for (let l = 0; l < fan; l++){
        const la = sa + (rnd() - 0.5) * spread * 2 + (rnd() - 0.5) * 0.06;
        const ll = sl + (rnd() - 0.5) * spread * 1.1;
        const ld = sd + 0.03 + Math.pow(rnd(), 0.8) * 0.17;
        const lp = onSphere(la, ll, ld);
        const lg = rnd();
        const leaf = add(lp[0], lp[1], lp[2],
          lg < 0.08 ? 2.8 + rnd() * 1.2 : lg < 0.34 ? 1.8 + rnd() * 0.6 : 1.0 + rnd() * 0.7, ci, "leaf");
        link(leaf, sub);
        mine.push(leaf);
        if (rnd() < 0.14) link(leaf, hub);
        if (prev >= 0 && rnd() < 0.34) link(leaf, prev);
        if (rnd() < 0.16) link(leaf, midIds[Math.floor(rnd() * midIds.length)]);
        prev = leaf;
      }
    }
  });
  // far satellites hanging off the outer leaves
  CLUSTERS.forEach((c, ci) => {
    const [, , ang, dist] = c;
    for (let s = 0; s < 7; s++){
      const sa = ang + (rnd() - 0.5) * 1.5, sl = (rnd() - 0.5) * 1.3;
      const sd = dist + 0.42 + rnd() * 0.22;
      const ap = onSphere(sa, sl, sd);
      const anchor = add(ap[0], ap[1], ap[2], 2.4, ci, "sub");
      link(anchor, hubs[ci]);
      const n = 14 + Math.floor(rnd() * 18);
      for (let l = 0; l < n; l++){
        const la = sa + (rnd() - 0.5) * 0.9, ll = sl + (rnd() - 0.5) * 0.7;
        const ld = sd + 0.02 + Math.pow(rnd(), 0.8) * 0.18;
        const p = onSphere(la, ll, ld);
        const leaf = add(p[0], p[1], p[2], 0.8 + rnd() * 0.9, ci, "leaf");
        link(leaf, anchor);
        clusterLeaves[ci].push(leaf);
      }
    }
  });

  // two hub rings and long chords across the sphere
  hubs.forEach((h, i) => {
    link(h, hubs[(i + 1) % hubs.length]);
    link(h, hubs[(i + 2) % hubs.length]);
    if (i % 3 === 0) link(h, hubs[(i + 4) % hubs.length]);
  });
  // neighbouring clusters share records, so their leaves cross-link
  for (let ci = 0; ci < clusterLeaves.length; ci++){
    const a = clusterLeaves[ci], b = clusterLeaves[(ci + 1) % clusterLeaves.length];
    const n = 26 + Math.floor(rnd() * 16);
    for (let k = 0; k < n; k++){
      link(a[Math.floor(rnd() * a.length)], b[Math.floor(rnd() * b.length)]);
    }
    // and a good number reach right across to the far side
    for (let k = 0; k < 12; k++){
      const far = clusterLeaves[(ci + 3) % clusterLeaves.length];
      link(a[Math.floor(rnd() * a.length)], far[Math.floor(rnd() * far.length)]);
    }
    for (let k = 0; k < 8; k++){
      const far = clusterLeaves[(ci + 4) % clusterLeaves.length];
      link(a[Math.floor(rnd() * a.length)], far[Math.floor(rnd() * far.length)]);
    }
  }

  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9, minZ = 1e9, maxZ = -1e9;
  for (const n of nodes){
    if (n.x < minX) minX = n.x; if (n.x > maxX) maxX = n.x;
    if (n.y < minY) minY = n.y; if (n.y > maxY) maxY = n.y;
    if (n.z < minZ) minZ = n.z; if (n.z > maxZ) maxZ = n.z;
  }
  const bounds = {minX, maxX, minY, maxY, cx:(minX + maxX) / 2, cy:(minY + maxY) / 2,
    cz:(minZ + maxZ) / 2, w:maxX - minX, h:maxY - minY, d:maxZ - minZ,
    radius: Math.max(maxX - minX, maxY - minY, maxZ - minZ) / 2,
    reach: nodes.reduce((m, n) => Math.max(m, Math.sqrt(n.x * n.x + n.y * n.y + n.z * n.z)), 0)};
  return {nodes, edges, adj, hubs, coreIds, bounds};
}

export {
  INK,
  BODY,
  DIM,
  FAINT,
  LIME,
  GREEN,
  AMBER,
  RED,
  NEUTRAL,
  MONO,
  ICONS,
  REC_SECTIONS,
  CONTACTS,
  FILE_TREE,
  ONTO_NODES,
  ONTO_EDGES,
  REC_TEMPLATES,
  REC_TEMPLATE_CATS,
  PEOPLE,
  ROLE_LEVELS,
  PERM_KEYS,
  GRANT_DEFS,
  ROLE_SCOPES,
  DEFAULT_PERMS,
  INTEGRATIONS,
  BG_DEFS,
  THEMES,
  ADMIN_ICONS,
  ADMIN_CARDS,
  ADMIN_GROUPS,
  SRC_TINT,
  SRC_ABBR,
  DATA_EVENTS,
  PEOPLE_EVENTS,
  AI_EVENTS,
  STREAM_DEFS,
  NAV,
  ITEMS,
  ORDER,
  ANSWERS,
  synthesizeCustomArea,
  pickAnswer,
  ORGS,
  TEAMS,
  LOCATIONS,
  AGENT_DEFS,
  KPI_DEFS,
  ASPECT_DEFS,
  FILTER_GROUPS,
  OPS_DEFS,
  OPS_FILTERS,
  WORK_SECTIONS,
  WORK_TASKS,
  WORKFLOWS,
  SCHEDULES,
  WIDGET_DEFS,
  WORK_WIDGETS,
  PERSONALITIES,
  ANSWER_STYLES,
  CONTEXT_DEFS,
  CONTEXT_SOURCES,
  SKILL_DEFS,
  TRAIN_PHASES,
  BRIEF_QUESTIONS,
  STATE_LABELS,
  FACE_SHAPES,
  FACE_TINTS,
  CLUSTERS,
  mulberry,
  _hexCache,
  hexRGB,
  buildGraph
};
