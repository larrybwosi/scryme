import { WorkflowEditor } from "./_components/workflow-editor";
import { getWorkflow } from "@/app/actions/workflows";

export default async function WorkflowEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workflow = await getWorkflow(id);

  return <WorkflowEditor workflow={workflow} />;
}
