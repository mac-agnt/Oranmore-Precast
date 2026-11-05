import type { Om } from "../ui";
import { Page } from "../ui";
import Overview from "./projects/Overview";
import Awards from "./projects/Awards";
import Contract from "./projects/Contract";
import Rfis from "./projects/Rfis";
import Journey from "./projects/Journey";
import Portal from "./projects/Portal";

/* Projects: award to handover. One selected order follows you across tabs. */
export default function Projects({ om }: { om: Om }) {
  const body = om.sub === "awards" ? <Awards om={om} />
    : om.sub === "contract" ? <Contract om={om} />
    : om.sub === "rfis" ? <Rfis om={om} />
    : om.sub === "journey" ? <Journey om={om} />
    : om.sub === "portal" ? <Portal om={om} />
    : <Overview om={om} />;
  return <Page>{body}</Page>;
}
