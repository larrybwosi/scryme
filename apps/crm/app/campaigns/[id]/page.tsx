import { CampaignAnalyticsView } from './_components/analytics-view';
import { OrgProvider } from '../../../../components/org-context';
import { getOrganizationContext } from '../../../actions/auth';
import { getCampaign } from '../../../actions/campaigns';

export default async function CampaignPage({ params }: { params: { id: string } }) {
  const context = (await getOrganizationContext())!;
  const { organizationId } = context;
  const { id } = await params;

  const campaign = await getCampaign(id);

  return (
    <OrgProvider organizationId={organizationId || 'default-org-id'}>
      <CampaignAnalyticsView campaign={campaign} />
    </OrgProvider>
  );
}
