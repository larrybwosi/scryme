import { WorkflowEditor } from './_components/workflow-editor';
import { OrgProvider } from '@/components/org-context';
import { getOrganizationContext } from '@/app/actions/auth';
import { getWorkflow } from '@/app/actions/workflows';

export default async function WorkflowEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const context = (await getOrganizationContext())!;
  const { organizationId } = context;
  const { id } = await params;
  const workflow = await getWorkflow(id);

  return (
    <OrgProvider organizationId={organizationId}>
      <WorkflowEditor workflow={workflow} organizationId={organizationId} />
    </OrgProvider>
  );
}
