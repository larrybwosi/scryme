import { Metadata } from "next";
import { WorkflowEditor } from "./_components/workflow-editor";
import { getWorkflow } from "@/app/actions/workflows";

interface WorkflowEditorPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: WorkflowEditorPageProps): Promise<Metadata> {
  const { id } = await params;
  const workflow = await getWorkflow(id);
  if (!workflow) {
    return {
      title: "Workflow Builder",
    };
  }

  const name = workflow.name || "Workflow";

  return {
    title: `${name} | Workflow Builder`,
    description: `Configure triggers, conditions, and automated actions for workflow "${name}".`,
    alternates: {
      canonical: `/campaigns/workflows/${id}`,
    },
    openGraph: {
      title: `${name} | Workflow Builder | Scryme CRM`,
      description: `Configure triggers, conditions, and automated actions for workflow "${name}".`,
      url: `https://crm.scryme.tech/campaigns/workflows/${id}`,
    },
  };
}

export default async function WorkflowEditorPage({
  params,
}: WorkflowEditorPageProps) {
  const { id } = await params;
  const workflow = await getWorkflow(id);

  return <WorkflowEditor workflow={workflow} />;
}
