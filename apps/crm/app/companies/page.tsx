import { CompaniesView } from './_components/companies-view';
import { OrgProvider } from '../../components/org-context';

export default function CompaniesPage() {
  // TODO: Get real organizationId from auth/session
  const organizationId = 'default-org-id';

  return (
    <OrgProvider organizationId={organizationId}>
      <CompaniesView />
    </OrgProvider>
  );
}
