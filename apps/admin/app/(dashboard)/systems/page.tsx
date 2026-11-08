import {
  getWorkflowEngineMetrics,
  getCustomerEngineMetrics,
  getSystemModules,
} from "@/app/actions/systems";
import {
  getPosReleaseSettings,
  listPosReleaseBinaries,
} from "@/app/actions/pos-releases";
import { listSystemDocumentSettings } from "@/app/actions/document-templates";
import { WorkflowEnginePanel } from "@/components/systems/workflow-engine-panel";
import { CustomerEnginePanel } from "@/components/systems/customer-engine-panel";
import { PosReleasesPanel } from "@/components/systems/pos-releases-panel";
import { DocumentTemplatesPanel } from "@/components/systems/document-templates-panel";
import { SystemModulesPanel } from "@/components/systems/system-modules-panel";
import {
  SystemsCards,
  type SystemCardItem,
} from "@/components/systems/systems-cards";

export default async function SystemsPage() {
  const [
    workflowMetrics,
    customerMetrics,
    posSettings,
    posBinaries,
    documentSettings,
    systemModules,
  ] = await Promise.all([
    getWorkflowEngineMetrics(),
    getCustomerEngineMetrics(),
    getPosReleaseSettings(),
    listPosReleaseBinaries(),
    listSystemDocumentSettings(),
    getSystemModules(),
  ]);

  const items: SystemCardItem[] = [
    {
      id: "modules",
      title: "System Modules",
      description: "Enable or disable global platform modules.",
      panel: <SystemModulesPanel initialSystemModules={systemModules} />,
    },
    {
      id: "workflow",
      title: "Workflow Engine",
      description: "Inspect execution metrics and health of the workflow engine.",
      panel: <WorkflowEnginePanel metrics={workflowMetrics} />,
    },
    {
      id: "customer",
      title: "Customer Engine",
      description: "Monitor customer engine metrics and activity.",
      panel: <CustomerEnginePanel metrics={customerMetrics} />,
    },
    {
      id: "pos",
      title: "POS Releases",
      description: "Manage POS app release settings and binaries.",
      panel: <PosReleasesPanel settings={posSettings} binaries={posBinaries} />,
    },
    {
      id: "documents",
      title: "Document Templates",
      description: "Configure system document templates and settings.",
      panel: <DocumentTemplatesPanel initialData={documentSettings} />,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Platform Systems
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor platform system health, inspect execution metrics, and execute
          administrative controls on workflow engine, customer engine, POS app
          release binaries, and global module toggles.
        </p>
      </div>

      <SystemsCards items={items} />
    </div>
  );
}