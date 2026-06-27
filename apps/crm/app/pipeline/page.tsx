import { KanbanBoardView } from "./_components/kanban-board-view";
import { OrgProvider } from "../../components/org-context";
import { getOrganizationContext } from "../actions/auth";

export default async function PipelinePage() {
  const context = (await getOrganizationContext())!;
  const { organizationId } = context;

  return (
    <OrgProvider organizationId={organizationId || "default-org-id"}>
      <KanbanBoardView />
    </OrgProvider>
  );
}
