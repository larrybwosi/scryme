import { ContactsView } from './_components/contacts-view';
import { OrgProvider } from '../../components/org-context';
import { getOrganizationContext } from '../actions/auth';

export default async function ContactsPage() {
  const context = (await getOrganizationContext())!;

  const { organizationId } = context;

  return (
    <OrgProvider organizationId={organizationId}>
      <ContactsView />
    </OrgProvider>
  );
}
