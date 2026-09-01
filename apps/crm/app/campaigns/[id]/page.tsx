import { Metadata } from "next";
import { CampaignAnalyticsView } from "./_components/analytics-view";
import { getCampaign } from "@/app/actions/campaigns";

interface CampaignPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: CampaignPageProps): Promise<Metadata> {
  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign) {
    return {
      title: "Campaign Analytics",
    };
  }

  const name = campaign.name || "Campaign";

  return {
    title: `${name} | Campaign Analytics`,
    description: `Performance metrics, reach, conversions, and interaction analytics for campaign "${name}".`,
    alternates: {
      canonical: `/campaigns/${id}`,
    },
    openGraph: {
      title: `${name} | Campaign Analytics | Scryme CRM`,
      description: `Performance metrics, reach, conversions, and interaction analytics for campaign "${name}".`,
      url: `https://crm.scryme.tech/campaigns/${id}`,
    },
  };
}

export default async function CampaignPage({ params }: CampaignPageProps) {
  const { id } = await params;
  const campaign = await getCampaign(id);

  return <CampaignAnalyticsView campaign={campaign} />;
}
