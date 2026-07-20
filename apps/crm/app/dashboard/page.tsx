import { Metadata } from "next";
import { DashboardView } from "./_components/dashboard-view";

export const metadata: Metadata = {
  title: "Enterprise Dashboard",
  description:
    "Monitor sales performance, conversion metrics, campaign activity, and active pipelines in real-time.",
  alternates: {
    canonical: "/dashboard",
  },
};

export default async function DashboardPage() {
  return <DashboardView />;
}
