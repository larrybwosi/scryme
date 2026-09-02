import { Metadata } from "next";
import { WorkflowsView } from "./_components/workflows-view";

export const metadata: Metadata = {
  title: "Campaign Workflows",
  description:
    "Automate marketing rules, customer lifecycle sequences, email triggers, and behavioral workflow actions.",
  alternates: {
    canonical: "/campaigns/workflows",
  },
  openGraph: {
    title: "Campaign Workflows | Scryme CRM",
    description:
      "Automate marketing rules, customer lifecycle sequences, email triggers, and behavioral workflow actions.",
    url: "https://crm.scryme.tech/campaigns/workflows",
  },
};

export default async function WorkflowsPage() {
  return <WorkflowsView />;
}
