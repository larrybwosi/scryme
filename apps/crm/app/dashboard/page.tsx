import { DashboardView } from "./_components/dashboard-view";
import { OrgProvider } from "../../components/org-context";
import { getOrganizationContext } from "../actions/auth";

export default async function DashboardPage() {
  const context = (await getOrganizationContext())!;
  const { organizationId } = context;

  return (
    <OrgProvider organizationId={organizationId || "default-org-id"}>
      <DashboardView />
    </OrgProvider>
  );
}
