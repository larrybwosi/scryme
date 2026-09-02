import { Metadata } from "next";
import { LeadsView } from "./_components/leads-view";

export const metadata: Metadata = {
  title: "Leads Management",
  description:
    "Track incoming prospects, manage statuses, qualify opportunities, and monitor pipeline health.",
  alternates: {
    canonical: "/leads",
  },
  openGraph: {
    title: "Leads Management | Scryme CRM",
    description:
      "Track incoming prospects, manage statuses, qualify opportunities, and monitor pipeline health.",
    url: "https://crm.scryme.tech/leads",
  },
};

export default async function LeadsPage() {
  return <LeadsView />;
}
