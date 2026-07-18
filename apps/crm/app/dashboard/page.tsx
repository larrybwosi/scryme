import { Metadata } from 'next';
import { DashboardView } from './_components/dashboard-view';
import { OrgProvider } from '../../components/org-context';
import { getOrganizationContext } from '../actions/auth';

export const metadata: Metadata = {
  title: "Enterprise Dashboard",
  description: "Monitor sales performance, conversion metrics, campaign activity, and active pipelines in real-time.",
  alternates: {
    canonical: "/dashboard",
  },
};

export default async function DashboardPage() {
  const context = (await getOrganizationContext())!;
  const { organizationId } = context;

  return (
    <OrgProvider organizationId={organizationId}>
      <DashboardView />
    </OrgProvider>
  );
}
