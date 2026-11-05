import type { Om } from "../ui";
import Inquiries from "./commercial/Inquiries";
import Quotations from "./commercial/Quotations";
import Pipeline from "./commercial/Pipeline";
import Workload from "./commercial/Workload";
import Accounts from "./commercial/Accounts";

/* Commercial: enquiry to quote. Tabs come from MODULE_TABS.Commercial. */
export default function Commercial({ om }: { om: Om }) {
  switch (om.sub) {
    case "quotations": return <Quotations om={om} />;
    case "pipeline": return <Pipeline om={om} />;
    case "workload": return <Workload om={om} />;
    case "accounts": return <Accounts om={om} />;
    default: return <Inquiries om={om} />;
  }
}
