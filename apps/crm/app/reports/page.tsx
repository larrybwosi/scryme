import { Metadata } from "next";
import { ReportsView } from "./_components/reports-view";

export const metadata: Metadata = {
  title: "Analytics & Reports",
  description:
    "Analyze sales performance, review historical trends, and generate custom business intelligence reports.",
  alternates: {
    canonical: "/reports",
  },
  openGraph: {
    title: "Analytics & Reports | Scryme CRM",
    description:
      "Analyze sales performance, review historical trends, and generate custom business intelligence reports.",
    url: "https://crm.scryme.tech/reports",
  },
};

export default async function ReportsPage() {
  return <ReportsView />;
}
