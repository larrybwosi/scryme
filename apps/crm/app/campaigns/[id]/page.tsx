import { CampaignAnalyticsView } from "./_components/analytics-view";
import { getCampaign } from "@/app/actions/campaigns";

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const campaign = await getCampaign(id);

  return <CampaignAnalyticsView campaign={campaign} />;
}
