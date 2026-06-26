import { getOrganizationContext } from '../actions/auth';
import { OrgProvider } from '../../components/org-context';
import { ReportsView } from './_components/reports-view';

export default async function ReportsPage() {
  const context = await getOrganizationContext();
  const { organizationId } = context;

  return (
    <OrgProvider organizationId={organizationId}>
      <ReportsView />
    </OrgProvider>
  );
}
