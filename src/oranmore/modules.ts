/* Top-bar pages for each Oranmore module. The first entry is the default. */
export const MODULE_TABS: Record<string, [string, string][]> = {
  Dashboard: [["executive", "Executive"], ["commercial", "Commercial"], ["plant", "Plant"], ["logistics", "Fleet & Logistics"], ["finance", "Finance"]],
  Commercial: [["inquiries", "Inquiries"], ["quotations", "Quotations"], ["pipeline", "Tender Pipeline"], ["workload", "Estimator Workload"], ["accounts", "Accounts"]],
  Projects: [["overview", "Overview"], ["awards", "Awards & Orders"], ["contract", "Contract Setup"], ["rfis", "RFIs & Documents"], ["journey", "Project Journey"], ["portal", "Customer Portal"]],
  "Plants & Planning": [["capacity", "Capacity"], ["constraints", "Constraints"], ["scenarios", "Scenarios"], ["production", "Production"], ["design", "Design Handoffs"], ["quality", "Quality & Yard"], ["performance", "Plant Performance"]],
  Logistics: [["planner", "Transport Planner"], ["loads", "Loads & Deliveries"], ["carriers", "Carriers"], ["pod", "Exceptions & POD"], ["carrier-app", "Carrier App"]],
  Finance: [["overview", "Overview"], ["readiness", "Invoice Readiness"], ["sage", "Sage Reconciliation"], ["debtors", "Debtors"], ["forecast", "Forecast"]],
};
export const OM_PAGES = ["Commercial", "Projects", "Plants & Planning", "Logistics", "Finance"];
export const MODULE_HINT: Record<string, string> = {
  Dashboard: "ORANMORE · ONE PICTURE", Commercial: "COMMERCIAL · ENQUIRY TO QUOTE", Projects: "PROJECTS · AWARD TO HANDOVER",
  "Plants & Planning": "BRANDON · LOUND · ITHESIS READ-ONLY", Logistics: "OUTSOURCED HAULAGE · POD", Finance: "SAGE · ILLUSTRATIVE, NOT CONNECTED",
};
