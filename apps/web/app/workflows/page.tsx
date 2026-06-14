"use client";

import React, { useState, useMemo } from "react";
import useSWR, { useSWRConfig } from "swr";
import {
  Zap,
  Play,
  Settings2,
  History,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  ExternalLink,
  Loader2,
  Plus,
  AlertCircle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@repo/ui/components/ui/sheet";
import { PageHeader } from "../../components/page-header";
import { Breadcrumbs } from "../../components/breadcrumbs";
import { toast } from "sonner";
import { Card, CardContent } from "@repo/ui/components/ui/card";

// Define proper types
interface Workflow {
  path: string;
  name: string;
  description: string;
  isProvisioned: boolean;
  schema?: {
    properties?: Record<string, any>;
  };
  createdAt?: string;
}

interface WorkflowHistory {
  id: string;
  jobId: string;
  status: string;
  createdAt: string;
  result?: any;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Fetcher function that extracts data from local API response
const workflowsFetcher = async (): Promise<Workflow[]> => {
  const res = await fetch("/api/workflows/available");
  const response = await res.json();
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.error || "Failed to fetch workflows");
};

const historyFetcher = async (path: string): Promise<WorkflowHistory[]> => {
  const res = await fetch(`/api/workflows/history?path=${encodeURIComponent(path)}`);
  const response = await res.json();
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.error || "Failed to fetch history");
};

export default function WorkflowsPage() {
  const { mutate: globalMutate } = useSWRConfig();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(
    null,
  );
  const [isProvisionSheetOpen, setIsProvisionSheetOpen] = useState(false);
  const [isHistorySheetOpen, setIsHistorySheetOpen] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [configValues, setConfigValues] = useState<Record<string, any>>({});

  // SWR for workflows
  const {
    data: workflows = [],
    error: workflowsError,
    isLoading: workflowsLoading,
    mutate: mutateWorkflows,
  } = useSWR<Workflow[]>("available-workflows", workflowsFetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000,
  });

  // SWR for workflow history (only when a workflow is selected)
  const {
    data: history = [],
    error: historyError,
    isLoading: historyLoading,
    mutate: mutateHistory,
  } = useSWR<WorkflowHistory[]>(
    selectedWorkflow ? ["workflow-history", selectedWorkflow.path] : null,
    () =>
      selectedWorkflow
        ? historyFetcher(selectedWorkflow.path)
        : Promise.resolve([]),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000,
    },
  );

  const filteredWorkflows = useMemo(() => {
    if (!workflows || !Array.isArray(workflows)) return [];
    return workflows.filter(
      (workflow: Workflow) =>
        workflow.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workflow.description?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [workflows, searchTerm]);

  const handleProvision = async () => {
    if (!selectedWorkflow) return;

    setIsProvisioning(true);
    try {
      const res = await fetch("/api/workflows/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: selectedWorkflow.path,
          settings: configValues,
        }),
      });
      const response = await res.json();

      if (response.success) {
        toast.success("Workflow provisioned successfully");
        setIsProvisionSheetOpen(false);
        mutateWorkflows(); // Refresh workflows list
      } else {
        toast.error(response.error || "Failed to provision workflow");
      }
    } catch (error) {
      toast.error("An error occurred while provisioning");
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleTrigger = async (workflow: Workflow) => {
    setIsTriggering(true);
    try {
      const res = await fetch("/api/workflows/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: workflow.path,
          inputs: {},
        }),
      });
      const response = await res.json();

      if (response.success) {
        toast.success("Workflow execution started");
        setSelectedWorkflow(workflow);
        mutateHistory(); // Refresh history
        setIsHistorySheetOpen(true);
      } else {
        toast.error(response.error || "Failed to trigger workflow");
      }
    } catch (error) {
      toast.error("An error occurred while triggering");
    } finally {
      setIsTriggering(false);
    }
  };

  const handleOpenHistory = async (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setIsHistorySheetOpen(true);
    await mutateHistory(); // Refresh history when opening
  };

  const handleOpenProvision = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    const savedValues: Record<string, any> = {};

    const properties = workflow.schema?.properties;
    if (properties) {
      Object.keys(properties).forEach((key) => {
        savedValues[key] = properties[key]?.default ?? "";
      });
    }

    setConfigValues(savedValues);
    setIsProvisionSheetOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
          </Badge>
        );
      case "FAILED":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none">
            <XCircle className="w-3 h-3 mr-1" /> Failed
          </Badge>
        );
      case "RUNNING":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Running
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-none">
            <Clock className="w-3 h-3 mr-1" /> {status}
          </Badge>
        );
    }
  };

  if (workflowsError) {
    return (
      <div className="p-8 max-w-[1400px] mx-auto">
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-red-600">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Error loading workflows
              </h3>
              <p className="text-muted-foreground">
                {workflowsError.message ||
                  "Failed to load workflows. Please try again later."}
              </p>
              <Button onClick={() => mutateWorkflows()} className="mt-4">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8">
      <Breadcrumbs
        items={[
          { label: "Automations", href: "/workflows" },
          { label: "Workflows" },
        ]}
      />

      <div className="flex justify-between items-end">
        <PageHeader
          title="Workflows"
          subtitle="Manage and provision automated workflows for your organization."
          icon={<Zap className="w-7 h-7 text-yellow-500" />}
        />
        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search workflows..."
              className="pl-9 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => mutateWorkflows()}
            disabled={workflowsLoading}
          >
            <History className="w-4 h-4 mr-2" />
            {workflowsLoading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[300px]">Workflow</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[150px]">Status</TableHead>
              <TableHead className="text-right w-[200px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workflowsLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-[#34A853]" />
                    <p className="text-sm text-gray-500">
                      Loading workflows...
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredWorkflows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-48 text-center text-gray-500"
                >
                  {searchTerm
                    ? "No workflows found matching your search."
                    : "No workflows available. Check back later."}
                </TableCell>
              </TableRow>
            ) : (
              filteredWorkflows.map((workflow: Workflow) => (
                <TableRow
                  key={workflow.path}
                  className="group hover:bg-gray-50/50 transition-colors"
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-gray-900">{workflow.name}</div>
                        <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                          {workflow.path}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm max-w-[400px]">
                    {workflow.description}
                  </TableCell>
                  <TableCell>
                    {workflow.isProvisioned ? (
                      <Badge
                        variant="outline"
                        className="text-green-600 border-green-200 bg-green-50"
                      >
                        Provisioned
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-gray-400 border-gray-200"
                      >
                        Not Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {workflow.isProvisioned ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenHistory(workflow)}
                          >
                            <History className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenProvision(workflow)}
                          >
                            <Settings2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            className="bg-[#34A853] hover:bg-[#2d9248]"
                            onClick={() => handleTrigger(workflow)}
                            disabled={isTriggering}
                          >
                            {isTriggering ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Play className="w-4 h-4 mr-2" />
                            )}
                            Run
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenProvision(workflow)}
                        >
                          <Plus className="w-4 h-4 mr-2" /> Provision
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Provisioning Sheet */}
      <Sheet open={isProvisionSheetOpen} onOpenChange={setIsProvisionSheetOpen}>
        <SheetContent className="sm:max-w-[500px]">
          <SheetHeader>
            <SheetTitle>Provision Workflow</SheetTitle>
            <SheetDescription>
              Configure and activate the {selectedWorkflow?.name} automation for
              your organization.
            </SheetDescription>
          </SheetHeader>

          <div className="py-8 space-y-6">
            {selectedWorkflow?.schema?.properties &&
              Object.entries(selectedWorkflow.schema.properties).map(
                ([key, prop]: [string, any]) => (
                  <div key={key} className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {prop.title || key}
                    </label>
                    {prop.type === "boolean" ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-[#34A853] focus:ring-[#34A853]"
                          checked={configValues[key] ?? prop.default}
                          onChange={(e) =>
                            setConfigValues({
                              ...configValues,
                              [key]: e.target.checked,
                            })
                          }
                        />
                        <span className="text-sm text-gray-500">Enabled</span>
                      </div>
                    ) : (
                      <Input
                        type={prop.type === "number" ? "number" : "text"}
                        placeholder={prop.default?.toString()}
                        value={configValues[key] ?? ""}
                        onChange={(e) =>
                          setConfigValues({
                            ...configValues,
                            [key]: e.target.value,
                          })
                        }
                      />
                    )}
                    {prop.description && (
                      <p className="text-[11px] text-gray-400">
                        {prop.description}
                      </p>
                    )}
                  </div>
                ),
              )}
          </div>

          <SheetFooter>
            <Button
              variant="outline"
              onClick={() => setIsProvisionSheetOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#34A853] hover:bg-[#2d9248]"
              onClick={handleProvision}
              disabled={isProvisioning}
            >
              {isProvisioning && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {selectedWorkflow?.isProvisioned
                ? "Save Settings"
                : "Activate Workflow"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* History Sheet */}
      <Sheet open={isHistorySheetOpen} onOpenChange={setIsHistorySheetOpen}>
        <SheetContent className="sm:max-w-[600px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-gray-400" />
              Execution History
            </SheetTitle>
            <SheetDescription>
              Recent runs for {selectedWorkflow?.name}.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-8 space-y-4">
            {historyLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[#34A853]" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12 text-gray-500 border-2 border-dashed rounded-xl">
                No history found for this workflow.
              </div>
            ) : (
              history.map((run: WorkflowHistory) => (
                <div
                  key={run.id}
                  className="p-4 rounded-lg border border-gray-100 bg-gray-50/50 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="text-sm font-medium flex items-center gap-2">
                        Job:{" "}
                        <span className="font-mono text-xs text-gray-500">
                          {run.jobId}
                        </span>
                        <ExternalLink className="w-3 h-3 text-gray-400 cursor-pointer hover:text-blue-500" />
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {new Date(run.createdAt).toLocaleString()}
                      </div>
                    </div>
                    {getStatusBadge(run.status)}
                  </div>
                  {run.result && (
                    <div className="p-3 bg-white rounded border border-gray-100 text-[11px] font-mono overflow-auto max-h-32">
                      <pre>{JSON.stringify(run.result, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
