import { WorkflowEditor } from './_components/workflow-editor';
import { OrgProvider } from '../../../../components/org-context';
import { getOrganizationContext } from '../../../actions/auth';
import { getCampaign } from '../../../actions/campaigns';

export default async function WorkflowEditorPage({ params }: { params: { id: string } }) {
  const context = (await getOrganizationContext())!;
  const { organizationId } = context;
  const { id } = await params;

  return (
    <OrgProvider organizationId={organizationId || 'default-org-id'}>
      <WorkflowEditor workflowId={id} organizationId={organizationId} />
    </OrgProvider>
  );
}
