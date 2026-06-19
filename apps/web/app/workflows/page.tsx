"use client";

import React, { useState, useMemo, useEffect } from "react";
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
  Settings,
  ChevronRight,
  Info,
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";
import { PageHeader } from "../../components/page-header";
import { Breadcrumbs } from "../../components/breadcrumbs";
import { toast } from "sonner";
import { Card, CardContent } from "@repo/ui/components/ui/card";
import { MemberSelector } from "../../components/member-selector";
import { MultiMemberSelector } from "../../components/multi-member-selector";
import { cn } from "@repo/ui/lib/utils";
import { Separator } from "@repo/ui/components/ui/separator";

// Define proper types
interface Workflow {
  path: string;
  name: string;
  description: string;
  isProvisioned: boolean;
  settings?: Record<string, any>;
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
  const res = await fetch(
    `/api/workflows/history?path=${encodeURIComponent(path)}`,
  );
  const response = await res.json();
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.error || "Failed to fetch history");
};

export default function WorkflowsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(
    null,
  );
  const [isProvisionSheetOpen, setIsProvisionSheetOpen] = useState(false);
  const [isHistorySheetOpen, setIsHistorySheetOpen] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [isCancelling, setIsCancelling] = useState<string | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, any>>({});
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedJobLogs, setSelectedJobLogs] = useState<{
    jobId: string;
    logs: string;
  } | null>(null);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

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
    isLoading: historyLoading,
    mutate: mutateHistory,
  } = useSWR<WorkflowHistory[]>(
    selectedWorkflow
      ? ["workflow-history", selectedWorkflow.path, statusFilter]
      : null,
    () => {
      if (!selectedWorkflow) return Promise.resolve([]);
      const url = new URL(`/api/workflows/history`, window.location.origin);
      url.searchParams.set("path", selectedWorkflow.path);
      if (statusFilter !== "ALL") {
        url.searchParams.set("status", statusFilter);
      }
      return fetch(url.toString())
        .then(res => res.json())
        .then(res => res.data || []);
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // Frequent refresh for history
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
    setStatusFilter("ALL");
    setIsHistorySheetOpen(true);
  };

  const handleCancelJob = async (jobId: string) => {
    setIsCancelling(jobId);
    try {
      const res = await fetch("/api/workflows/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const response = await res.json();
      if (response.success) {
        toast.success("Job cancelled successfully");
        mutateHistory();
      } else {
        toast.error(response.error || "Failed to cancel job");
      }
    } catch (error) {
      toast.error("An error occurred while cancelling");
    } finally {
      setIsCancelling(null);
    }
  };

  const handleViewLogs = async (jobId: string) => {
    setIsLoadingLogs(true);
    setSelectedJobLogs(null);
    try {
      const res = await fetch(`/api/workflows/logs?jobId=${jobId}`);
      const response = await res.json();
      if (response.success) {
        setSelectedJobLogs({ jobId, logs: response.data });
      } else {
        toast.error(response.error || "Failed to fetch logs");
      }
    } catch (error) {
      toast.error("An error occurred while fetching logs");
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleOpenProvision = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    const initialValues: Record<string, any> = {};

    const properties = workflow.schema?.properties;
    if (properties) {
      Object.entries(properties).forEach(([key, prop]: [string, any]) => {
        // Priority: Current provisioned setting > Schema default > empty string
        initialValues[key] =
          workflow.settings?.[key] ??
          prop.default ??
          (prop.type === "boolean" ? false : "");
      });
    }

    setConfigValues(initialValues);
    setIsProvisionSheetOpen(true);
  };

  // Group fields by their "group" property
  const groupedFields = useMemo(() => {
    if (!selectedWorkflow?.schema?.properties) return {};

    const groups: Record<string, [string, any][]> = {};
    Object.entries(selectedWorkflow.schema.properties).forEach(
      ([key, prop]: [string, any]) => {
        const groupName = prop.group || "General Configuration";
        if (!groups[groupName]) groups[groupName] = [];
        groups[groupName].push([key, prop]);
      },
    );
    return groups;
  }, [selectedWorkflow]);

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
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => mutateWorkflows()}
            disabled={workflowsLoading}>
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
                  className="h-48 text-center text-gray-500">
                  {searchTerm
                    ? "No workflows found matching your search."
                    : "No workflows available. Check back later."}
                </TableCell>
              </TableRow>
            ) : (
              filteredWorkflows.map((workflow: Workflow) => (
                <TableRow
                  key={workflow.path}
                  className="group hover:bg-gray-50/50 transition-colors">
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
                        className="text-green-600 border-green-200 bg-green-50">
                        Provisioned
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-gray-400 border-gray-200">
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
                            onClick={() => handleOpenHistory(workflow)}>
                            <History className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenProvision(workflow)}>
                            <Settings2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            className="bg-[#34A853] hover:bg-[#2d9248]"
                            onClick={() => handleTrigger(workflow)}
                            disabled={isTriggering}>
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
                          onClick={() => handleOpenProvision(workflow)}>
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
        <SheetContent className="sm:max-w-[550px] overflow-y-auto">
          <SheetHeader className="space-y-4">
            <div className="flex items-center gap-2 text-[#34A853]">
              <Settings className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Workflow Configuration
              </span>
            </div>
            <SheetTitle className="text-2xl font-bold">
              {selectedWorkflow?.isProvisioned
                ? "Edit Settings"
                : "Provision Workflow"}
            </SheetTitle>
            <SheetDescription className="text-base">
              Configure <strong>{selectedWorkflow?.name}</strong> to match your
              organization&apos;s needs.
            </SheetDescription>
          </SheetHeader>

          <div className="py-8 space-y-10">
            {Object.entries(groupedFields).map(([groupName, fields]) => (
              <div key={groupName} className="space-y-6">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                    {groupName}
                  </h3>
                  <Separator className="flex-1" />
                </div>

                <div className="space-y-5">
                  {fields.map(([key, prop]: [string, any]) => (
                    <div key={key} className="space-y-2.5">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          {prop.title || key}
                          {prop.description && (
                            <div className="group relative">
                              <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                                {prop.description}
                              </div>
                            </div>
                          )}
                        </label>
                      </div>

                      {prop.format === "members" ? (
                        <MultiMemberSelector
                          value={configValues[key]}
                          onValueChange={val =>
                            setConfigValues({ ...configValues, [key]: val })
                          }
                          placeholder={`Select members for ${prop.title || key}...`}
                        />
                      ) : prop.format === "member" ? (
                        <MemberSelector
                          value={configValues[key]}
                          onValueChange={val =>
                            setConfigValues({ ...configValues, [key]: val })
                          }
                          placeholder={`Select member for ${prop.title || key}...`}
                        />
                      ) : prop.type === "boolean" ? (
                        <div
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer",
                            configValues[key]
                              ? "bg-green-50 border-green-200"
                              : "bg-gray-50 border-gray-200",
                          )}
                          onClick={() =>
                            setConfigValues({
                              ...configValues,
                              [key]: !configValues[key],
                            })
                          }>
                          <span className="text-sm font-medium text-gray-600">
                            {configValues[key] ? "Enabled" : "Disabled"}
                          </span>
                          <div
                            className={cn(
                              "w-10 h-5 rounded-full relative transition-colors p-1",
                              configValues[key]
                                ? "bg-[#34A853]"
                                : "bg-gray-300",
                            )}>
                            <div
                              className={cn(
                                "w-3 h-3 bg-white rounded-full transition-transform",
                                configValues[key]
                                  ? "translate-x-5"
                                  : "translate-x-0",
                              )}
                            />
                          </div>
                        </div>
                      ) : (
                        <Input
                          type={prop.type === "number" ? "number" : "text"}
                          placeholder={
                            prop.default?.toString() || `Enter ${key}...`
                          }
                          value={configValues[key] ?? ""}
                          onChange={e =>
                            setConfigValues({
                              ...configValues,
                              [key]:
                                prop.type === "number"
                                  ? Number(e.target.value)
                                  : e.target.value,
                            })
                          }
                          className="h-11 bg-white focus:ring-[#34A853] focus:border-[#34A853]"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <SheetFooter className="pt-6 border-t mt-auto">
            <Button
              variant="ghost"
              onClick={() => setIsProvisionSheetOpen(false)}
              className="px-6">
              Cancel
            </Button>
            <Button
              className="bg-[#34A853] hover:bg-[#2d9248] px-8 h-11"
              onClick={handleProvision}
              disabled={isProvisioning}>
              {isProvisioning ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {selectedWorkflow?.isProvisioned
                ? "Update Configuration"
                : "Activate Workflow"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* History Sheet */}
      <Sheet open={isHistorySheetOpen} onOpenChange={setIsHistorySheetOpen}>
        <SheetContent className="sm:max-w-[700px] overflow-y-auto">
          <SheetHeader className="pb-6 border-b">
            <SheetTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 bg-gray-100 rounded-lg">
                <History className="w-5 h-5 text-gray-600" />
              </div>
              Execution History
            </SheetTitle>
            <SheetDescription>
              Recent automated runs for{" "}
              <strong>{selectedWorkflow?.name}</strong>.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6">
            <Tabs
              value={statusFilter}
              onValueChange={setStatusFilter}
              className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-6">
                <TabsTrigger value="ALL">All</TabsTrigger>
                <TabsTrigger value="RUNNING">Running</TabsTrigger>
                <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
                <TabsTrigger value="FAILED">Failed</TabsTrigger>
                <TabsTrigger value="CANCELLED">Cancelled</TabsTrigger>
              </TabsList>

              <div className="space-y-6">
                {historyLoading ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-[#34A853]" />
                    <p className="text-sm text-gray-500 animate-pulse">
                      Fetching latest runs...
                    </p>
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-20 px-6 border-2 border-dashed rounded-2xl bg-gray-50/50">
                    <div className="mx-auto w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                      <Clock className="w-6 h-6 text-gray-300" />
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      No history yet
                    </h4>
                    <p className="text-xs text-gray-500">
                      Runs will appear here once the workflow is triggered
                      manually or by system events.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((run: WorkflowHistory) => (
                      <div
                        key={run.id}
                        className="p-5 rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition-all shadow-sm space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1.5">
                            <div className="text-sm font-bold flex items-center gap-2 text-gray-900">
                              Job Instance
                              <span className="font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">
                                {run.jobId}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1.5">
                              <Clock className="w-3 h-3" />
                              {new Date(run.createdAt).toLocaleString(
                                undefined,
                                {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                },
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(run.status)}
                            {(run.status === "RUNNING" ||
                              run.status === "PENDING") && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-red-600 border-red-100 hover:bg-red-50"
                                onClick={() => handleCancelJob(run.jobId)}
                                disabled={isCancelling === run.jobId}>
                                {isCancelling === run.jobId ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <XCircle className="w-3 h-3" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>

                        {run.result && (
                          <div className="rounded-lg bg-gray-900 p-4 relative group">
                            <div className="absolute right-3 top-3 text-[10px] text-gray-500 font-mono uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                              JSON Result
                            </div>
                            <pre className="text-[11px] font-mono text-blue-300 overflow-x-auto max-h-40 custom-scrollbar">
                              {JSON.stringify(run.result, null, 2)}
                            </pre>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs text-blue-600 font-semibold gap-1"
                            onClick={() => handleViewLogs(run.jobId)}
                            disabled={isLoadingLogs}>
                            {isLoadingLogs ? (
                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            ) : null}
                            View Detailed Logs{" "}
                            <ChevronRight className="w-3 h-3" />
                          </Button>

                          {selectedJobLogs?.jobId === run.jobId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[10px] h-6"
                              onClick={() => setSelectedJobLogs(null)}>
                              Hide Logs
                            </Button>
                          )}
                        </div>

                        {selectedJobLogs?.jobId === run.jobId && (
                          <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 mt-2">
                            <div className="text-[10px] text-gray-400 font-mono uppercase mb-2">
                              Stdout / Stderr
                            </div>
                            <pre className="text-[11px] font-mono text-gray-700 whitespace-pre-wrap max-h-60 overflow-y-auto custom-scrollbar">
                              {selectedJobLogs.logs ||
                                "No logs available for this run."}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
