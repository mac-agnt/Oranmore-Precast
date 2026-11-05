import type { Om } from "../ui";
import Commercial from "./Commercial";
import Projects from "./Projects";
import Plants from "./Plants";
import Logistics from "./Logistics";
import Finance from "./Finance";

export default function OmPages({ om }: { om: Om }) {
  switch (om.page) {
    case "Commercial": return <Commercial om={om} />;
    case "Projects": return <Projects om={om} />;
    case "Plants & Planning": return <Plants om={om} />;
    case "Logistics": return <Logistics om={om} />;
    case "Finance": return <Finance om={om} />;
    default: return null;
  }
}
