import { CompaniesView } from './_components/companies-view';
import { OrgProvider } from '../../components/org-context';
import { getOrganizationContext } from '../actions/auth';
import { redirect } from 'next/navigation';

export default async function CompaniesPage() {
  const context = (await getOrganizationContext())!;

  const { organizationId } = context;

  return (
    <OrgProvider organizationId={organizationId || 'default-org-id'}>
      <CompaniesView />
    </OrgProvider>
  );
}
