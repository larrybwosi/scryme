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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@repo/ui/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
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
  const [isProvisionDialogOpen, setIsProvisionDialogOpen] = useState(false);
  const [isHistorySheetOpen, setIsHistorySheetOpen] = useState(false);
  const [isTestRunDialogOpen, setIsTestRunDialogOpen] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [isCancelling, setIsCancelling] = useState<string | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, any>>({});
  const [testInputs, setTestInputs] = useState<Record<string, any>>({});
  const [testRunResult, setTestRunResult] = useState<any | null>(null);
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
      dedupingInterval: 5000,
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
        setIsProvisionDialogOpen(false);
        mutateWorkflows();
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
        mutateHistory();
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
        initialValues[key] =
          workflow.settings?.[key] ??
          prop.default ??
          (prop.type === "boolean" ? false : "");
      });
    }

    setConfigValues(initialValues);
    setIsProvisionDialogOpen(true);
  };

  const handleOpenTestRun = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    const initialInputs: Record<string, any> = {};

    const properties = workflow.schema?.properties;
    if (properties) {
      Object.entries(properties).forEach(([key, prop]: [string, any]) => {
        initialInputs[key] =
          workflow.settings?.[key] ??
          prop.default ??
          (prop.type === "boolean" ? false : "");
      });
    }

    setTestInputs(initialInputs);
    setTestRunResult(null);
    setIsTestRunDialogOpen(true);
  };

  const handleExecuteTestRun = async () => {
    if (!selectedWorkflow) return;
    setIsTestRunning(true);
    setTestRunResult(null);

    try {
      const res = await fetch("/api/workflows/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: selectedWorkflow.path,
          inputs: testInputs,
        }),
      });
      const response = await res.json();

      if (response.success && response.data) {
        setTestRunResult({
          status: response.data.status || "COMPLETED",
          executionId: response.data.id,
          correlationId: response.data.correlationId,
          timestamp: new Date().toISOString(),
          payloadSent: testInputs,
          message: "Workflow test execution initiated successfully.",
        });
        toast.success("Test run executed successfully");
        mutateHistory();
      } else {
        toast.error(response.error || "Failed to execute test run");
      }
    } catch (error) {
      toast.error("An error occurred during test run execution");
    } finally {
      setIsTestRunning(false);
    }
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
          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 border-none">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
          </Badge>
        );
      case "FAILED":
        return (
          <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/10 border-none">
            <XCircle className="w-3 h-3 mr-1" /> Failed
          </Badge>
        );
      case "RUNNING":
        return (
          <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Running
          </Badge>
        );
      default:
        return (
          <Badge className="bg-muted text-muted-foreground hover:bg-muted border-none">
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
            <div className="text-center text-destructive">
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
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 bg-background">
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search workflows..."
              className="pl-9 bg-background border-border"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => mutateWorkflows()}
            disabled={workflowsLoading}
            className="border-border">
            <History className="w-4 h-4 mr-2" />
            {workflowsLoading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
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
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Loading workflows...
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredWorkflows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-48 text-center text-muted-foreground">
                  {searchTerm
                    ? "No workflows found matching your search."
                    : "No workflows available. Check back later."}
                </TableCell>
              </TableRow>
            ) : (
              filteredWorkflows.map((workflow: Workflow) => (
                <TableRow
                  key={workflow.path}
                  className="group hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 text-primary rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-foreground">{workflow.name}</div>
                        <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                          {workflow.path}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[400px]">
                    {workflow.description}
                  </TableCell>
                  <TableCell>
                    {workflow.isProvisioned ? (
                      <Badge
                        variant="outline"
                        className="text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/10">
                        Provisioned
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-muted-foreground border-border">
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
                            className="text-muted-foreground hover:text-foreground hover:bg-accent">
                            <History className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenProvision(workflow)}
                            className="text-muted-foreground hover:text-foreground hover:bg-accent">
                            <Settings2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-primary/30 text-primary hover:bg-primary/10"
                            onClick={() => handleOpenTestRun(workflow)}>
                            <Play className="w-4 h-4 mr-1 text-primary" /> Test Run
                          </Button>
                          <Button
                            size="sm"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground"
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
                          onClick={() => handleOpenProvision(workflow)}
                          className="border-border">
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

      {/* Provisioning Dialog */}
      <Dialog
        open={isProvisionDialogOpen}
        onOpenChange={setIsProvisionDialogOpen}>
        <DialogContent className="sm:max-w-[550px] overflow-y-auto bg-card border-border">
          <DialogHeader className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Settings className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Workflow Configuration
              </span>
            </div>
            <DialogTitle className="text-2xl font-bold text-foreground">
              {selectedWorkflow?.isProvisioned
                ? "Edit Settings"
                : "Provision Workflow"}
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              Configure <strong className="text-foreground">{selectedWorkflow?.name}</strong> to match your
              organization&apos;s needs.
            </DialogDescription>
          </DialogHeader>

          <div className="py-8 space-y-10">
            {Object.entries(groupedFields).map(([groupName, fields]) => (
              <div key={groupName} className="space-y-6">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-semibold text-foreground whitespace-nowrap">
                    {groupName}
                  </h3>
                  <Separator className="flex-1" />
                </div>

                <div className="space-y-5">
                  {fields.map(([key, prop]: [string, any]) => (
                    <div key={key} className="space-y-2.5">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                          {prop.title || key}
                          {prop.description && (
                            <div className="group relative">
                              <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-popover text-popover-foreground text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-border">
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
                              ? "bg-primary/10 border-primary/30"
                              : "bg-muted/30 border-border",
                          )}
                          onClick={() =>
                            setConfigValues({
                              ...configValues,
                              [key]: !configValues[key],
                            })
                          }>
                          <span className="text-sm font-medium text-foreground">
                            {configValues[key] ? "Enabled" : "Disabled"}
                          </span>
                          <div
                            className={cn(
                              "w-10 h-5 rounded-full relative transition-colors p-1",
                              configValues[key]
                                ? "bg-primary"
                                : "bg-muted-foreground/30",
                            )}>
                            <div
                              className={cn(
                                "w-3 h-3 bg-background rounded-full transition-transform",
                                configValues[key]
                                  ? "translate-x-5"
                                  : "translate-x-0",
                              )}
                            />
                          </div>
                        </div>
                      ) : prop.format === "select" || prop.enum ? (
                        <Select
                          value={configValues[key]?.toString() ?? prop.default?.toString() ?? ""}
                          onValueChange={val =>
                            setConfigValues({ ...configValues, [key]: val })
                          }>
                          <SelectTrigger className="h-11 bg-background border-border">
                            <SelectValue placeholder={`Select ${prop.title || key}...`} />
                          </SelectTrigger>
                          <SelectContent>
                            {prop.enum?.map((opt: string, idx: number) => (
                              <SelectItem key={opt} value={opt}>
                                {prop.enumNames?.[idx] || opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : prop.format === "date" ? (
                        <Input
                          type="date"
                          value={configValues[key] ?? prop.default ?? ""}
                          onChange={e =>
                            setConfigValues({
                              ...configValues,
                              [key]: e.target.value,
                            })
                          }
                          className="h-11 bg-background border-border"
                        />
                      ) : prop.format === "time" ? (
                        <Input
                          type="time"
                          value={configValues[key] ?? prop.default ?? ""}
                          onChange={e =>
                            setConfigValues({
                              ...configValues,
                              [key]: e.target.value,
                            })
                          }
                          className="h-11 bg-background border-border"
                        />
                      ) : prop.format === "duration" ? (
                        <div className="flex gap-2 items-center">
                          <Input
                            type="text"
                            placeholder="e.g. 15m, 1h, 2d"
                            value={configValues[key] ?? prop.default ?? ""}
                            onChange={e =>
                              setConfigValues({
                                ...configValues,
                                [key]: e.target.value,
                              })
                            }
                            className="h-11 bg-background border-border flex-1"
                          />
                          <Select
                            value={
                              configValues[key]?.endsWith("m")
                                ? "minutes"
                                : configValues[key]?.endsWith("h")
                                ? "hours"
                                : configValues[key]?.endsWith("d")
                                ? "days"
                                : "minutes"
                            }
                            onValueChange={unit => {
                              const numVal = parseInt(configValues[key]) || 15;
                              const unitSuffix =
                                unit === "hours" ? "h" : unit === "days" ? "d" : "m";
                              setConfigValues({
                                ...configValues,
                                [key]: `${numVal}${unitSuffix}`,
                              });
                            }}>
                            <SelectTrigger className="h-11 w-32 bg-background border-border">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="minutes">Minutes</SelectItem>
                              <SelectItem value="hours">Hours</SelectItem>
                              <SelectItem value="days">Days</SelectItem>
                            </SelectContent>
                          </Select>
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
                          className="h-11 bg-background border-border focus-visible:ring-ring focus-visible:border-ring"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="pt-6 border-t border-border mt-auto">
            <Button
              variant="ghost"
              onClick={() => setIsProvisionDialogOpen(false)}
              className="px-6 text-muted-foreground hover:text-foreground hover:bg-accent">
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 h-11"
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Run Dialog */}
      <Dialog open={isTestRunDialogOpen} onOpenChange={setIsTestRunDialogOpen}>
        <DialogContent className="sm:max-w-[650px] overflow-y-auto bg-card border-border">
          <DialogHeader className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Play className="w-5 h-5 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Workflow Test Sandbox
              </span>
            </div>
            <DialogTitle className="text-2xl font-bold text-foreground">
              Test Run: {selectedWorkflow?.name}
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              Simulate and execute an isolated test run with custom parameter inputs.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-6">
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Test Parameters & Payload
              </h4>
              <div className="grid grid-cols-1 gap-4">
                {selectedWorkflow?.schema?.properties &&
                  Object.entries(selectedWorkflow.schema.properties).map(
                    ([key, prop]: [string, any]) => (
                      <div key={key} className="space-y-2">
                        <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                          <span>{prop.title || key}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {prop.type || "string"}
                          </span>
                        </label>

                        {prop.format === "members" ? (
                          <MultiMemberSelector
                            value={testInputs[key]}
                            onValueChange={val =>
                              setTestInputs({ ...testInputs, [key]: val })
                            }
                            placeholder={`Select test members for ${prop.title || key}...`}
                          />
                        ) : prop.format === "member" ? (
                          <MemberSelector
                            value={testInputs[key]}
                            onValueChange={val =>
                              setTestInputs({ ...testInputs, [key]: val })
                            }
                            placeholder={`Select test member for ${prop.title || key}...`}
                          />
                        ) : prop.type === "boolean" ? (
                          <div
                            className={cn(
                              "flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer text-xs",
                              testInputs[key]
                                ? "bg-primary/10 border-primary/30"
                                : "bg-muted/30 border-border",
                            )}
                            onClick={() =>
                              setTestInputs({
                                ...testInputs,
                                [key]: !testInputs[key],
                              })
                            }>
                            <span className="font-medium text-foreground">
                              {testInputs[key] ? "True / Enabled" : "False / Disabled"}
                            </span>
                            <div
                              className={cn(
                                "w-8 h-4 rounded-full relative transition-colors p-0.5",
                                testInputs[key]
                                  ? "bg-primary"
                                  : "bg-muted-foreground/30",
                              )}>
                              <div
                                className={cn(
                                  "w-3 h-3 bg-background rounded-full transition-transform",
                                  testInputs[key]
                                    ? "translate-x-4"
                                    : "translate-x-0",
                                )}
                              />
                            </div>
                          </div>
                        ) : prop.format === "select" || prop.enum ? (
                          <Select
                            value={testInputs[key]?.toString() ?? prop.default?.toString() ?? ""}
                            onValueChange={val =>
                              setTestInputs({ ...testInputs, [key]: val })
                            }>
                            <SelectTrigger className="h-10 bg-background border-border text-xs">
                              <SelectValue placeholder={`Select ${prop.title || key}...`} />
                            </SelectTrigger>
                            <SelectContent>
                              {prop.enum?.map((opt: string, idx: number) => (
                                <SelectItem key={opt} value={opt}>
                                  {prop.enumNames?.[idx] || opt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : prop.format === "date" ? (
                          <Input
                            type="date"
                            value={testInputs[key] ?? prop.default ?? ""}
                            onChange={e =>
                              setTestInputs({
                                ...testInputs,
                                [key]: e.target.value,
                              })
                            }
                            className="h-10 bg-background border-border text-xs"
                          />
                        ) : prop.format === "time" ? (
                          <Input
                            type="time"
                            value={testInputs[key] ?? prop.default ?? ""}
                            onChange={e =>
                              setTestInputs({
                                ...testInputs,
                                [key]: e.target.value,
                              })
                            }
                            className="h-10 bg-background border-border text-xs"
                          />
                        ) : (
                          <Input
                            type={prop.type === "number" ? "number" : "text"}
                            placeholder={
                              prop.default?.toString() || `Test value for ${key}...`
                            }
                            value={testInputs[key] ?? ""}
                            onChange={e =>
                              setTestInputs({
                                ...testInputs,
                                [key]:
                                  prop.type === "number"
                                    ? Number(e.target.value)
                                    : e.target.value,
                              })
                            }
                            className="h-10 bg-background border-border text-xs"
                          />
                        )}
                      </div>
                    ),
                  )}
              </div>
            </div>

            {testRunResult && (
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Test Execution Result
                  </span>
                  {getStatusBadge(testRunResult.status)}
                </div>
                <p className="text-xs text-muted-foreground">{testRunResult.message}</p>
                <div className="rounded-lg bg-card p-3 border border-border text-[11px] font-mono space-y-1">
                  <div><span className="text-muted-foreground">Execution ID:</span> {testRunResult.executionId}</div>
                  <div><span className="text-muted-foreground">Correlation ID:</span> {testRunResult.correlationId}</div>
                  <div><span className="text-muted-foreground">Timestamp:</span> {testRunResult.timestamp}</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-muted-foreground mb-1">
                    Input Payload Delivered
                  </div>
                  <pre className="text-[11px] font-mono bg-card p-3 rounded-lg border border-border overflow-x-auto text-foreground/90">
                    {JSON.stringify(testRunResult.payloadSent, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-border">
            <Button
              variant="ghost"
              onClick={() => setIsTestRunDialogOpen(false)}
              className="px-6 text-muted-foreground hover:text-foreground">
              Close
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 h-10"
              onClick={handleExecuteTestRun}
              disabled={isTestRunning}>
              {isTestRunning ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Execute Test Run
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Sheet open={isHistorySheetOpen} onOpenChange={setIsHistorySheetOpen}>
        <SheetContent className="sm:max-w-175 overflow-y-auto bg-card border-border">
          <SheetHeader className="pb-6 border-b border-border">
            <SheetTitle className="flex items-center gap-2 text-xl text-foreground">
              <div className="p-2 bg-muted rounded-lg">
                <History className="w-5 h-5 text-muted-foreground" />
              </div>
              Execution History
            </SheetTitle>
            <SheetDescription className="text-muted-foreground">
              Recent automated runs for{" "}
              <strong className="text-foreground">{selectedWorkflow?.name}</strong>.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6">
            <Tabs
              value={statusFilter}
              onValueChange={setStatusFilter}
              className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-6 bg-muted">
                <TabsTrigger value="ALL">All</TabsTrigger>
                <TabsTrigger value="RUNNING">Running</TabsTrigger>
                <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
                <TabsTrigger value="FAILED">Failed</TabsTrigger>
                <TabsTrigger value="CANCELLED">Cancelled</TabsTrigger>
              </TabsList>

              <div className="space-y-6">
                {historyLoading ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground animate-pulse">
                      Fetching latest runs...
                    </p>
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-20 px-6 border-2 border-dashed rounded-2xl bg-muted/30">
                    <div className="mx-auto w-12 h-12 bg-card rounded-full flex items-center justify-center shadow-sm mb-4">
                      <Clock className="w-6 h-6 text-muted-foreground/30" />
                    </div>
                    <h4 className="text-sm font-semibold text-foreground mb-1">
                      No history yet
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Runs will appear here once the workflow is triggered
                      manually or by system events.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((run: WorkflowHistory) => (
                      <div
                        key={run.id}
                        className="p-5 rounded-xl border border-border bg-card hover:border-muted-foreground/30 transition-all shadow-sm space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1.5">
                            <div className="text-sm font-bold flex items-center gap-2 text-foreground">
                              Job Instance
                              <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                {run.jobId}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
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
                                className="h-7 text-destructive border-destructive/20 hover:bg-destructive/10"
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
                          <div className="rounded-lg bg-muted p-4 relative group">
                            <div className="absolute right-3 top-3 text-[10px] text-muted-foreground font-mono uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                              JSON Result
                            </div>
                            <pre className="text-[11px] font-mono text-foreground/80 overflow-x-auto max-h-40 custom-scrollbar">
                              {JSON.stringify(run.result, null, 2)}
                            </pre>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs text-primary font-semibold gap-1"
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
                              className="text-[10px] h-6 text-muted-foreground hover:text-foreground hover:bg-accent"
                              onClick={() => setSelectedJobLogs(null)}>
                              Hide Logs
                            </Button>
                          )}
                        </div>

                        {selectedJobLogs?.jobId === run.jobId && (
                          <div className="rounded-lg bg-muted/30 border border-border p-4 mt-2">
                            <div className="text-[10px] text-muted-foreground font-mono uppercase mb-2">
                              Stdout / Stderr
                            </div>
                            <pre className="text-[11px] font-mono text-foreground whitespace-pre-wrap max-h-60 overflow-y-auto custom-scrollbar">
                              {selectedJobLogs?.logs ||
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
