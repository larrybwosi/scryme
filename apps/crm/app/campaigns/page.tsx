import { CampaignsView } from './_components/campaigns-view';
import { OrgProvider } from '@/components/org-context';
import { getOrganizationContext } from '@/app/actions/auth';

export default async function CampaignsPage() {
  const context = (await getOrganizationContext())!;
  const { organizationId, memberId } = context;

  return (
    <OrgProvider organizationId={organizationId}>
      <CampaignsView organizationId={organizationId} memberId={memberId!} />
    </OrgProvider>
  );
}
