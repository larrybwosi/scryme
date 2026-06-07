import { CampaignsView } from './_components/campaigns-view';
import { OrgProvider } from '../../components/org-context';
import { getOrganizationContext } from '../actions/auth';

export default async function CampaignsPage() {
  const context = (await getOrganizationContext())!;
  const { organizationId, memberId } = context;

  return (
    <OrgProvider organizationId={organizationId || 'default-org-id'}>
      <CampaignsView organizationId={organizationId} memberId={memberId} />
    </OrgProvider>
  );
}
