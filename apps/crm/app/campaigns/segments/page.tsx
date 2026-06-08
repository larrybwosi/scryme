import { SegmentsView } from './_components/segments-view';
import { OrgProvider } from '@/components/org-context';
import { getOrganizationContext } from '@/app/actions/auth';

export default async function SegmentsPage() {
  const context = (await getOrganizationContext())!;
  const { organizationId } = context;

  return (
    <OrgProvider organizationId={organizationId || 'default-org-id'}>
      <SegmentsView organizationId={organizationId} />
    </OrgProvider>
  );
}
