import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs";
import {
  getWorkflowEngineMetrics,
  getCustomerEngineMetrics,
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

export default async function SystemsPage() {
  const [workflowMetrics, customerMetrics, posSettings, posBinaries, documentSettings] =
    await Promise.all([
      getWorkflowEngineMetrics(),
      getCustomerEngineMetrics(),
      getPosReleaseSettings(),
      listPosReleaseBinaries(),
      listSystemDocumentSettings(),
    ]);
  const activeCategories = documentSettings.categories.filter((c) => c.isEnabled).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Platform Systems
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor platform system health, inspect execution metrics, and execute
          administrative controls on workflow engine, customer engine, and POS app release binaries.
        </p>
      </div>

      <Tabs defaultValue="workflows">
        <TabsList>
          <TabsTrigger value="workflows">
            Workflow Engine ({workflowMetrics.activeWorkflows} Active / {workflowMetrics.totalWorkflows})
          </TabsTrigger>
          <TabsTrigger value="customers">
            Customer Engine ({customerMetrics.totalCustomers} Profiles)
          </TabsTrigger>
          <TabsTrigger value="pos-releases">
            POS App Releases ({posBinaries.length} Stored)
          </TabsTrigger>
          <TabsTrigger value="document-templates">
            Document Templates ({activeCategories} / {documentSettings.categories.length} Active)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="mt-6">
          <WorkflowEnginePanel metrics={workflowMetrics} />
        </TabsContent>

        <TabsContent value="customers" className="mt-6">
          <CustomerEnginePanel metrics={customerMetrics} />
        </TabsContent>

        <TabsContent value="pos-releases" className="mt-6">
          <PosReleasesPanel settings={posSettings} binaries={posBinaries} />
        </TabsContent>

        <TabsContent value="document-templates" className="mt-6">
          <DocumentTemplatesPanel initialData={documentSettings} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
