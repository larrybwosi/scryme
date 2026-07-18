import { CustomersView } from './_components/customers-view';
import { OrgProvider } from '../../components/org-context';
import { getOrganizationContext } from '../actions/auth';
import { redirect } from 'next/navigation';

export default async function CustomersPage() {
  const context = (await getOrganizationContext())!;

  const { organizationId } = context;

  return (
    <OrgProvider organizationId={organizationId}>
      <CustomersView />
    </OrgProvider>
  );
}
