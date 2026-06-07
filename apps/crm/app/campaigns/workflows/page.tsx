import { WorkflowsView } from './_components/workflows-view';
import { OrgProvider } from '@/components/org-context';
import { getOrganizationContext } from '@/app/actions/auth';

export default async function WorkflowsPage() {
  const context = (await getOrganizationContext())!;
  const { organizationId } = context;

  return (
    <OrgProvider organizationId={organizationId || 'default-org-id'}>
      <WorkflowsView organizationId={organizationId} />
    </OrgProvider>
  );
}
