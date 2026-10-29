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

      <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <SystemModulesPanel initialSystemModules={systemModules} />
        </section>

        <section className="flex flex-col gap-3">
          <WorkflowEnginePanel metrics={workflowMetrics} />
        </section>

        <section className="flex flex-col gap-3">
          <CustomerEnginePanel metrics={customerMetrics} />
        </section>

        <section className="flex flex-col gap-3">
          <PosReleasesPanel settings={posSettings} binaries={posBinaries} />
        </section>

        <section className="flex flex-col gap-3">
          <DocumentTemplatesPanel initialData={documentSettings} />
        </section>
      </div>
    </div>
  );
}
