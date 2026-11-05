/* Oranmore Precast demo: canonical domain types.
   One customer, one project, one continuous journey. Every module reads these
   records; nothing keeps its own copy. */

export type Plant = "Brandon" | "Lound";
export type Product = "Hollowcore" | "Beam & block" | "Stairs & landings" | "Lift shafts" | "Bespoke" | "Twinwall";

export type ContractorStatus = "Tendering" | "Secured" | "Unknown";
export type QuoteStatus = "Inquiry" | "Estimating" | "Quote submitted" | "Negotiation" | "Won" | "Lost" | "On hold";

export type DesignStatus = "Not started" | "Awaiting information" | "In design" | "Awaiting client approval" | "Released for production";
export type CapacityStatus = "Not planned" | "Tentative" | "Allocated";
export type ProductionStatus = "Not released" | "Scheduled" | "Casting" | "Complete";
export type QualityStatus = "Not started" | "Inspection pending" | "Released" | "On hold";
export type DispatchStatus = "Not planned" | "Planned" | "Delivering" | "Complete";
export type PodStatus = "Not due" | "Awaiting POD" | "POD submitted" | "Verified" | "Exception";
export type InvoiceStage = "Not due" | "Held" | "Eligible" | "Ready for finance review" | "Review approved" | "Handoff simulated" | "Issued" | "Paid";

export type LoadStatus = "Planned" | "Loaded" | "Dispatched" | "Arrival claimed" | "POD submitted" | "POD verified" | "Exception";
export type RfiStatus = "Draft" | "Awaiting customer" | "Resolved";
export type DocStatus = "Not started" | "Draft" | "Approved" | "Sent (simulated)";
export type TaskStatus = "Not started" | "In progress" | "Review" | "Done";

export type Source =
  | "Commercial Excel (mock)" | "Email intake (simulated)" | "iThesis (illustrative)" | "Sage (illustrative)"
  | "Carrier claim" | "Carrier app (simulated)" | "Customer portal (simulated)" | "Pulse" | "Finance draft" | "Transport planner (mock)";

export interface Lineage { source: Source; updated: string; state: string; confidence?: "High" | "Medium" | "Low" }

export type EntityKind = "account" | "development" | "enquiry" | "quote" | "order" | "rfi" | "doc" | "design" | "lot" | "load" | "carrier" | "invoice" | "task" | "contact";
export interface Ref { kind: EntityKind; id: string }

export interface Account { id: string; name: string; hq: string; sector: string; owner: string; contactIds: string[]; note: string; since: string; lineage: Lineage }
export interface Contact { id: string; name: string; role: string; accountId: string | null; email: string; phone: string; internal?: boolean; team?: string }
export interface Development { id: string; name: string; town: string; county: string; sector: string; lineage: Lineage }

export interface Enquiry {
  id: string; received: string; accountId: string; devId: string; contractorStatus: ContractorStatus;
  products: Product[]; drawings: number; estimator: string | null; due: string; value: number; urgency: "Normal" | "High" | "Critical";
  quoteId: string; source: "Email" | "Portal" | "Phone" | "Tender portal"; m2?: number; plantPref?: Plant; lineage: Lineage;
}

export interface QuoteCheck { key: string; label: string; done: boolean }
export interface Quote {
  id: string; enquiryId: string; status: QuoteStatus; revision: string; value: number; probability: number;
  checklist: QuoteCheck[]; clarifications: { at: string; text: string; by: string; open: boolean }[];
  history: { at: string; text: string }[]; reviewer: string | null; approved: boolean; lostReason?: string; submitted?: string;
  exclusions: string[];
}

export interface ContractField { key: string; label: string; value: string; inherited?: string }
export interface Order {
  id: string; quoteId: string; accountId: string; devId: string; value: number; awarded: string; lead: string;
  products: Product[]; programme: string; portal: string; customerContactId: string;
  contract: ContractField[]; contractApproved: boolean;
  design: DesignStatus; capacity: CapacityStatus; production: ProductionStatus; quality: QualityStatus;
  dispatch: DispatchStatus; pod: PodStatus; invoice: InvoiceStage; clientUpdated: string; nextHandoff: string;
  lineage: Lineage;
}

export interface Rfi {
  id: string; orderId: string; question: string; blocking: boolean; owner: string; due: string; status: RfiStatus;
  raised: string; reminders: string[]; response?: string; respondedBy?: string; area: string;
}

export interface Doc { id: string; orderId: string; type: string; status: DocStatus; body: string; updated: string }

export interface DesignPackage {
  id: string; orderId: string; revision: string; status: DesignStatus; target: string; released: boolean;
  missing: string[]; coordinator: string; synced: string; revisions: { rev: string; at: string; note: string }[];
}

export interface Commitment { id: string; ref: Ref; label: string; plant: Plant; product: Product; m2: number; week: string; firm: boolean }

export interface Lot {
  id: string; orderId: string; plant: Plant; product: Product; units: number; m2: number; planned: string; actual: string | null;
  status: ProductionStatus; qa: QualityStatus; yard: string; inspector: string; note: string; synced: string;
}

export interface Pod { photo: boolean; photoName?: string; receiver?: string; signature: boolean; submitted?: string; verified?: string; verifiedBy?: string; note?: string; rejected?: string }
export interface Load {
  id: string; orderId: string; lotIds: string[]; plant: Plant; carrierId: string; driver: string; trailer: string;
  collect: string; deliver: string; siteContact: string; pieces: number; tonnes: number; status: LoadStatus;
  claimed?: string; pod: Pod; invoiceId?: string; exception?: string; notes: string; carrierStep: number;
}

export interface Carrier { id: string; name: string; base: string; equipment: string[]; onTime: number; contact: string; issues: string[] }

export interface Invoice {
  id: string; orderId: string; loadId?: string; net: number; stage: InvoiceStage; hold?: string; issued?: string; due?: string; paid?: string;
  sageRef?: string; description: string; history: { at: string; text: string }[];
}

export interface Task { id: string; title: string; owner: string; due: string; priority: "High" | "Medium" | "Low"; dept: string; status: TaskStatus; ref: Ref; auto?: string }

export type EventSource = "Staff" | "Agent" | "iThesis" | "Sage" | "Carrier" | "Customer" | "Email" | "Excel";
export interface OmEvent { id: string; at: string; source: EventSource; actor: string; title: string; note: string; ref: Ref; orderId?: string; status?: "done" | "waiting" | "failed" }

export interface IntakeField { key: string; label: string; value: string; confidence: "High" | "Medium" | "Low"; confirmed: boolean; options?: string[] }
export interface IntakeDraft { email: { from: string; subject: string; body: string; attachments: string[]; received: string }; fields: IntakeField[]; duplicateOf?: string }

export interface OmState {
  clock: number; // minutes after 09:00 on the snapshot day; advances with each simulated action
  accounts: Account[]; contacts: Contact[]; devs: Development[];
  enquiries: Enquiry[]; quotes: Quote[]; orders: Order[]; rfis: Rfi[]; docs: Doc[];
  designs: DesignPackage[]; commitments: Commitment[]; lots: Lot[]; loads: Load[]; carriers: Carrier[];
  invoices: Invoice[]; tasks: Task[]; events: OmEvent[];
  intake: IntakeDraft | null; intakeSeq: number;
  portalMessages: { orderId: string; at: string; from: string; text: string }[];
  seq: number;
}
