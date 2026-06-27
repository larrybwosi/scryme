import { CampaignAnalyticsView } from "./_components/analytics-view";
import { OrgProvider } from "@/components/org-context";
import { getOrganizationContext } from "@/app/actions/auth";
import { getCampaign } from "@/app/actions/campaigns";

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const context = (await getOrganizationContext())!;
  const { organizationId, memberId } = context;
  const { id } = await params;

  const campaign = await getCampaign(id);

  return (
    <OrgProvider organizationId={organizationId || "default-org-id"}>
      <CampaignAnalyticsView campaign={campaign} memberId={memberId!} />
    </OrgProvider>
  );
}
