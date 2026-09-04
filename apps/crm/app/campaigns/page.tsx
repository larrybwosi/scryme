import { Metadata } from "next";
import { CampaignsView } from "./_components/campaigns-view";

export const metadata: Metadata = {
  title: "Marketing Campaigns",
  description:
    "Design, execute, and monitor automated multi-channel marketing campaigns and customer outreach.",
  alternates: {
    canonical: "/campaigns",
  },
  openGraph: {
    title: "Marketing Campaigns | Scryme CRM",
    description:
      "Design, execute, and monitor automated multi-channel marketing campaigns and customer outreach.",
    url: "https://crm.scryme.tech/campaigns",
  },
};

export default async function CampaignsPage() {
  return <CampaignsView />;
}
