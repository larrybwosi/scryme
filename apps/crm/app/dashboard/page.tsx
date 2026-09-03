import { Metadata } from "next";
import { DashboardView } from "./_components/dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Monitor sales performance, conversion metrics, campaign activity, and active pipelines in real-time.",
  alternates: {
    canonical: "/dashboard",
  },
  openGraph: {
    title: "Dashboard | Scryme CRM",
    description:
      "Monitor sales performance, conversion metrics, campaign activity, and active pipelines in real-time.",
    url: "https://crm.scryme.tech/dashboard",
  },
};

export default async function DashboardPage() {
  return <DashboardView />;
}
