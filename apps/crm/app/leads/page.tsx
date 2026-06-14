import { LeadsView } from './_components/leads-view';
import { OrgProvider } from '../../components/org-context';
import { getOrganizationContext } from '../actions/auth';

export default async function LeadsPage() {
  const context = (await getOrganizationContext())!;
  const { organizationId } = context;

  return (
    <OrgProvider organizationId={organizationId || 'default-org-id'}>
      <LeadsView />
    </OrgProvider>
  );
}
