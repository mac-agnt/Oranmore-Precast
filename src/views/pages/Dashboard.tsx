import OmDashboard from "../../oranmore/pages/OmDashboard";

type Props = { v: any };

/* The Pulse Dashboard module: KPI band above (DashboardKpiBand), Oranmore
   management views below, one per top-bar tab. */
export default function Dashboard({ v }: Props) {
  return <OmDashboard om={v.om} />;
}
