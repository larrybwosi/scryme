import { getOrganizationContext } from '../actions/auth';
import { OrgProvider } from '../../components/org-context';
import { ActivitiesView } from './_components/activities-view';

export default async function ActivitiesPage() {
  const context = await getOrganizationContext();
  const { organizationId } = context;

  return (
    <OrgProvider organizationId={organizationId}>
      <ActivitiesView />
    </OrgProvider>
  );
}
