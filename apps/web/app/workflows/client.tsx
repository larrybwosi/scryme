"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import {
  addEdge,
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  Box,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Clock3,
  Code2,
  Copy,
  Database,
  FileText,
  Filter,
  GitBranch,
  Globe,
  History,
  Info,
  Layers,
  LayoutTemplate,
  Mail,
  MessageSquare,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings2,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Timer,
  Trash2,
  Webhook,
  X,
  Zap,
} from "lucide-react";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@repo/ui/components/ui/dialog";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select";
import { Separator } from "@repo/ui/components/ui/separator";
import { Switch } from "@repo/ui/components/ui/switch";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@repo/ui/lib/utils";

export interface ConditionRule {
  id: string;
  field: string;
  operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "is_empty" | "is_not_empty";
  value: string;
}

export type StudioNodeData = {
  label: string;
  subtitle: string;
  kind: "trigger" | "action" | "logic" | "delay" | "webhook" | "data";
  icon: string;
  color: string;
  description?: string;
  config?: Record<string, any>;
  conditions?: {
    matchMode: "ALL" | "ANY";
    rules: ConditionRule[];
  };
  executionOptions?: {
    retryCount?: number;
    backoffStrategy?: "linear" | "exponential";
    timeoutSeconds?: number;
  };
};

export type StudioNode = Node<StudioNodeData>;

interface WorkflowTemplateSchemaProperty {
  type: string;
  title?: string;
  description?: string;
  default?: any;
  enum?: string[];
  enumNames?: string[];
  group?: string;
  format?: string;
}

interface Workflow {
  path: string;
  key?: string;
  name: string;
  description: string;
  isProvisioned: boolean;
  settings?: Record<string, any>;
  schema?: { properties?: Record<string, WorkflowTemplateSchemaProperty> };
}

interface ExecutionHistoryItem {
  id: string;
  jobId?: string;
  status: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  result?: any;
  payload?: any;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json()).then((json) => json.data || []);

export const palette = [
  {
    kind: "trigger" as const,
    label: "Event Trigger",
    subtitle: "System Event",
    icon: "webhook",
    color: "cyan",
    description: "Listen for system events, customer registration, or order updates.",
    config: { eventType: "customer.created", source: "system" },
  },
  {
    kind: "trigger" as const,
    label: "Schedule Cron",
    subtitle: "Time-based",
    icon: "clock",
    color: "cyan",
    description: "Execute periodically based on a cron schedule or time interval.",
    config: { cron: "0 9 * * 1", timezone: "UTC" },
  },
  {
    kind: "action" as const,
    label: "Send Email",
    subtitle: "Communication",
    icon: "mail",
    color: "violet",
    description: "Dispatch transactional or notification emails.",
    config: { recipient: "{{customer.email}}", subject: "Welcome to Scryme", template: "welcome_v1" },
  },
  {
    kind: "action" as const,
    label: "Scryme Chat Msg",
    subtitle: "Notification",
    icon: "message",
    color: "violet",
    description: "Post automated summary or alert directly to Scryme Chat.",
    config: { channel: "general", message: "New automated alert: {{event.id}}" },
  },
  {
    kind: "action" as const,
    label: "HTTP Request",
    subtitle: "Integration",
    icon: "code",
    color: "amber",
    description: "Perform GET/POST request to external API or webhook endpoint.",
    config: { method: "POST", url: "https://api.example.com/v1/webhook", headers: "Content-Type: application/json" },
  },
  {
    kind: "logic" as const,
    label: "Branch Condition",
    subtitle: "Logic & Routing",
    icon: "branch",
    color: "emerald",
    description: "Evaluate expression and branch execution flow conditionally.",
    conditions: {
      matchMode: "ALL" as const,
      rules: [
        { id: "r1", field: "payload.amount", operator: "greater_than" as const, value: "100" },
      ],
    },
  },
  {
    kind: "logic" as const,
    label: "Filter Guard",
    subtitle: "Logic",
    icon: "filter",
    color: "emerald",
    description: "Stop execution unless custom matching conditions pass.",
    conditions: {
      matchMode: "ALL" as const,
      rules: [
        { id: "r2", field: "payload.status", operator: "equals" as const, value: "active" },
      ],
    },
  },
  {
    kind: "delay" as const,
    label: "Wait / Delay",
    subtitle: "Timing Control",
    icon: "timer",
    color: "blue",
    description: "Pause execution for a designated duration or until a specified timestamp.",
    config: { duration: "15m", pauseType: "duration" },
  },
  {
    kind: "data" as const,
    label: "Update Record",
    subtitle: "Workspace Data",
    icon: "database",
    color: "pink",
    description: "Create or update CRM customer, inventory batch, or sales transaction record.",
    config: { entity: "Customer", action: "update", targetId: "{{payload.customerId}}" },
  },
  {
    kind: "webhook" as const,
    label: "Outgoing Webhook",
    subtitle: "Webhook Dispatch",
    icon: "globe",
    color: "orange",
    description: "Trigger registered outgoing webhook subscriptions.",
    config: { eventName: "workflow.completed", retryOnFailure: true },
  },
];

function Icon({ name }: { name: string }) {
  const props = { "aria-hidden": true, size: 16 } as const;
  if (name === "webhook") return <Webhook {...props} />;
  if (name === "clock") return <Clock {...props} />;
  if (name === "mail") return <Mail {...props} />;
  if (name === "message") return <MessageSquare {...props} />;
  if (name === "code") return <Code2 {...props} />;
  if (name === "branch") return <GitBranch {...props} />;
  if (name === "filter") return <Filter {...props} />;
  if (name === "timer") return <Timer {...props} />;
  if (name === "globe") return <Globe {...props} />;
  return <Database {...props} />;
}

function WorkflowNode({ data, selected }: NodeProps<StudioNode>) {
  const conditionCount = data.conditions?.rules?.length || 0;
  const hasConfig = data.config && Object.keys(data.config).length > 0;

  return (
    <div
      className={cn(
        "w-64 rounded-xl border bg-card/95 shadow-xl transition-all backdrop-blur",
        selected ? "border-primary ring-2 ring-primary/30" : "border-border/80 hover:border-border"
      )}
    >
      <div className={cn("flex items-center gap-3 border-b px-3.5 py-3 rounded-t-xl", `node-accent-${data.color}`)}>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background/90 text-foreground shadow-sm">
          <Icon name={data.icon} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold tracking-tight text-foreground">{data.label}</p>
          <p className="text-[10px] text-muted-foreground">{data.subtitle}</p>
        </div>
        <Badge variant="outline" className="text-[9px] uppercase tracking-wider px-1.5 py-0.5">
          {data.kind}
        </Badge>
      </div>

      <div className="px-3.5 py-2.5 text-xs leading-relaxed text-muted-foreground">
        {data.description || "Step configured in studio."}
      </div>

      {data.kind === "logic" && conditionCount > 0 && (
        <div className="mx-3 mb-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
          <div className="flex items-center gap-1.5 font-medium">
            <GitBranch size={12} />
            <span>{conditionCount} rule{conditionCount > 1 ? "s" : ""} ({data.conditions?.matchMode || "ALL"})</span>
          </div>
          {data.conditions?.rules?.[0] && (
            <p className="mt-0.5 truncate text-[10px] opacity-80">
              If {data.conditions.rules[0].field || "field"} {data.conditions.rules[0].operator} &quot;{data.conditions.rules[0].value}&quot;
            </p>
          )}
        </div>
      )}

      {data.config && Object.keys(data.config).length > 0 && data.kind !== "logic" && (
        <div className="mx-3 mb-2 space-y-1 rounded-md border border-muted bg-muted/30 px-2.5 py-1.5 text-[10px]">
          {Object.entries(data.config).slice(0, 2).map(([key, val]) => (
            <div key={key} className="flex justify-between gap-2 truncate">
              <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[9px]">{key}:</span>
              <span className="truncate text-foreground font-mono">{String(val)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between border-t px-3.5 py-2 text-[10px] text-muted-foreground rounded-b-xl bg-muted/10">
        <span className="flex items-center gap-1 font-medium">
          <CheckCircle2 size={11} className="text-emerald-500" />
          {hasConfig || conditionCount > 0 ? "Configured" : "Default"}
        </span>
        {data.executionOptions?.retryCount ? (
          <span className="text-muted-foreground">Retry x{data.executionOptions.retryCount}</span>
        ) : (
          <span className="size-1.5 rounded-full bg-emerald-500" />
        )}
      </div>
    </div>
  );
}

const nodeTypes = { studio: WorkflowNode };

function initialGraph(workflow?: Workflow) {
  const saved = workflow?.settings?.studio;
  if (saved?.nodes?.length) return saved;

  const nodes: StudioNode[] = [
    {
      id: "trigger",
      type: "studio",
      position: { x: 80, y: 160 },
      data: palette[0],
    },
    {
      id: "action",
      type: "studio",
      position: { x: 390, y: 160 },
      data: palette[2],
    },
    {
      id: "branch",
      type: "studio",
      position: { x: 700, y: 160 },
      data: palette[5],
    },
  ];
  const edges: Edge[] = [
    { id: "trigger-action", source: "trigger", target: "action", animated: true },
    { id: "action-branch", source: "action", target: "branch" },
  ];
  return { nodes, edges };
}

export default function WorkflowsPage() {
  const { data: workflows = [], mutate, isLoading } = useSWR<Workflow[]>("/api/workflows/available", fetcher, { revalidateOnFocus: false });
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const selectedWorkflow = workflows.find((item) => item.path === selectedPath || item.key === selectedPath) || workflows[0];
  const graph = useMemo(() => initialGraph(selectedWorkflow), [selectedWorkflow]);

  const [nodes, setNodes, onNodesChange] = useNodesState<StudioNode>(graph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges);

  const [activeTab, setActiveTab] = useState<"canvas" | "history" | "logs">("canvas");
  const [inspectorTab, setInspectorTab] = useState<"node" | "provisioning" | "governance">("node");
  const [search, setSearch] = useState("");
  const [paletteSearch, setPaletteSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("action");
  const [testMode, setTestMode] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // New Enterprise Workflow Dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreatingWorkflow, setIsCreatingWorkflow] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState("");
  const [newWorkflowDescription, setNewWorkflowDescription] = useState("");
  const [newWorkflowTriggerType, setNewWorkflowTriggerType] = useState("EVENT");
  const [newWorkflowKey, setNewWorkflowKey] = useState("");

  // Customization state for Workflow Schema Provisioning
  const [workflowSettings, setWorkflowSettings] = useState<Record<string, any>>({});

  // Fetch execution history & logs for active workflow
  const { data: historyData = [], mutate: mutateHistory } = useSWR<ExecutionHistoryItem[]>(
    selectedWorkflow ? `/api/workflows/history?path=${encodeURIComponent(selectedWorkflow.path)}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: logsText = "", isLoading: isLogsLoading } = useSWR<string>(
    selectedJobId ? `/api/workflows/logs?jobId=${encodeURIComponent(selectedJobId)}` : null,
    (url: string) => fetch(url).then((res) => res.json()).then((json) => json.data || "No logs captured.")
  );

  const filteredWorkflows = workflows.filter((item) => `${item.name} ${item.description}`.toLowerCase().includes(search.toLowerCase()));
  const filteredPalette = palette.filter((item) => `${item.label} ${item.subtitle} ${item.description}`.toLowerCase().includes(paletteSearch.toLowerCase()));

  const activeNode = nodes.find((node) => node.id === selectedNodeId);

  useEffect(() => {
    if (!selectedPath && workflows[0]) {
      setSelectedPath(workflows[0].path);
    }
  }, [selectedPath, workflows]);

  useEffect(() => {
    if (selectedWorkflow) {
      setWorkflowSettings(selectedWorkflow.settings || {});
      const next = initialGraph(selectedWorkflow);
      setNodes(next.nodes);
      setEdges(next.edges);
      if (next.nodes.length > 0) {
        setSelectedNodeId(next.nodes[0].id);
      }
    }
  }, [selectedWorkflow?.path]);

  const selectWorkflow = (path: string) => {
    setSelectedPath(path);
  };

  const onConnect = (connection: Connection) => setEdges((items) => addEdge({ ...connection, animated: true }, items));

  const addNode = (item: (typeof palette)[number]) => {
    const id = `${item.kind}-${Date.now()}`;
    const newNode: StudioNode = {
      id,
      type: "studio",
      position: { x: 260 + (nodes.length % 4) * 40, y: 180 + Math.floor(nodes.length / 4) * 80 },
      data: JSON.parse(JSON.stringify(item)),
    };
    setNodes((items) => [...items, newNode]);
    setSelectedNodeId(id);
    setInspectorTab("node");
    toast.success(`${item.label} step added to canvas`);
  };

  const updateActiveNode = (updater: (prevData: StudioNodeData) => StudioNodeData) => {
    if (!selectedNodeId) return;
    setNodes((items) =>
      items.map((node) => {
        if (node.id === selectedNodeId) {
          return {
            ...node,
            data: updater(node.data),
          };
        }
        return node;
      })
    );
  };

  const saveWorkflow = async (activate = false) => {
    if (!selectedWorkflow) return;
    setIsSaving(true);
    try {
      const payload = {
        path: selectedWorkflow.path,
        settings: {
          ...workflowSettings,
          enabled: activate ? true : workflowSettings?.enabled !== false,
          studio: { nodes, edges },
        },
      };
      const response = await fetch("/api/workflows/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Unable to save workflow");
      await mutate();
      toast.success(activate ? "Workflow published and activated!" : "Workflow saved successfully");
    } catch {
      toast.error("Failed to save workflow");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateWorkflow = async () => {
    if (!newWorkflowName.trim()) {
      toast.error("Please provide a workflow name");
      return;
    }
    const resolvedKey = (newWorkflowKey.trim() || newWorkflowName.toLowerCase().replace(/[^a-z0-9_]/g, "_")).replace(/^f\/dealio\//, "");

    setIsCreatingWorkflow(true);
    try {
      const response = await fetch("/api/workflows/definitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: resolvedKey,
          name: newWorkflowName.trim(),
          description: newWorkflowDescription.trim(),
          triggerType: newWorkflowTriggerType,
          config: { studio: { nodes: [], edges: [] } },
        }),
      });

      if (!response.ok) throw new Error("Failed to create workflow");

      toast.success(`Workflow '${newWorkflowName}' created successfully!`);
      setIsCreateDialogOpen(false);
      setNewWorkflowName("");
      setNewWorkflowDescription("");
      setNewWorkflowKey("");
      setNewWorkflowTriggerType("EVENT");

      await mutate();
      setSelectedPath(resolvedKey);
    } catch {
      toast.error("Unable to create new workflow definition");
    } finally {
      setIsCreatingWorkflow(false);
    }
  };

  const runWorkflow = async () => {
    if (!selectedWorkflow) return;
    try {
      const response = await fetch("/api/workflows/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: selectedWorkflow.path, inputs: { source: "studio_manual_test", timestamp: new Date().toISOString() } }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Workflow execution test started!");
        mutateHistory();
        if (data?.data?.id) {
          setSelectedJobId(data.data.id);
        }
      } else {
        toast.error("Failed to trigger execution");
      }
    } catch {
      toast.error("Error executing workflow");
    }
  };

  // Conditions Editor Handlers
  const addConditionRule = () => {
    updateActiveNode((data) => {
      const currentRules = data.conditions?.rules || [];
      const newRule: ConditionRule = {
        id: `rule-${Date.now()}`,
        field: "payload.status",
        operator: "equals",
        value: "",
      };
      return {
        ...data,
        conditions: {
          matchMode: data.conditions?.matchMode || "ALL",
          rules: [...currentRules, newRule],
        },
      };
    });
  };

  const updateConditionRule = (ruleId: string, field: keyof ConditionRule, value: string) => {
    updateActiveNode((data) => {
      const currentRules = data.conditions?.rules || [];
      const updatedRules = currentRules.map((rule) => (rule.id === ruleId ? { ...rule, [field]: value } : rule));
      return {
        ...data,
        conditions: {
          matchMode: data.conditions?.matchMode || "ALL",
          rules: updatedRules,
        },
      };
    });
  };

  const removeConditionRule = (ruleId: string) => {
    updateActiveNode((data) => {
      const currentRules = data.conditions?.rules || [];
      return {
        ...data,
        conditions: {
          matchMode: data.conditions?.matchMode || "ALL",
          rules: currentRules.filter((r) => r.id !== ruleId),
        },
      };
    });
  };

  const updateConfigValue = (key: string, val: any) => {
    updateActiveNode((data) => ({
      ...data,
      config: {
        ...(data.config || {}),
        [key]: val,
      },
    }));
  };

  // Summary Metrics
  const workflowStats = useMemo(() => {
    const totalSteps = nodes.length;
    const triggers = nodes.filter((n) => n.data.kind === "trigger").length;
    const actions = nodes.filter((n) => n.data.kind === "action" || n.data.kind === "data" || n.data.kind === "webhook").length;
    const logicBranches = nodes.filter((n) => n.data.kind === "logic").length;
    return { totalSteps, triggers, actions, logicBranches };
  }, [nodes]);

  return (
    <ReactFlowProvider>
      <main className="workflow-studio flex h-[calc(100vh-4rem)] min-h-[680px] flex-col overflow-hidden bg-background text-foreground">
        {/* Top Navigation Bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/80 px-5 backdrop-blur z-10">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </Button>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="text-primary fill-primary/20" size={18} />
              <span className="font-semibold text-foreground">Automations</span>
              <ChevronRight size={14} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold text-foreground">
                {selectedWorkflow?.name || "Workflow Studio"}
              </h1>
              <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                <span>{selectedWorkflow?.isProvisioned ? "Published & Provisioned" : "Draft Definition"}</span>
                <span>·</span>
                <span className="font-mono text-[10px]">{selectedWorkflow?.path}</span>
              </p>
            </div>
            <Badge variant="outline" className="hidden gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 lg:flex text-xs">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" /> Production Ready
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-3 border-r pr-3 text-xs text-muted-foreground md:flex">
              <div className="flex items-center gap-1.5">
                <Layers size={14} className="text-primary" />
                <span>{workflowStats.totalSteps} steps</span>
              </div>
              <div className="flex items-center gap-1.5">
                <GitBranch size={14} className="text-emerald-500" />
                <span>{workflowStats.logicBranches} logic branches</span>
              </div>
            </div>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs font-medium">
                  <Plus size={14} /> New Workflow
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="text-primary" size={18} /> Create Enterprise Workflow
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Design custom event-driven or scheduled automations for your workspace.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Workflow Name</Label>
                    <Input
                      value={newWorkflowName}
                      onChange={(e) => setNewWorkflowName(e.target.value)}
                      placeholder="e.g. High Value Order Approval"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Description</Label>
                    <Textarea
                      value={newWorkflowDescription}
                      onChange={(e) => setNewWorkflowDescription(e.target.value)}
                      placeholder="Describe the trigger and actions of this automation..."
                      className="min-h-16 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Trigger Mode</Label>
                      <Select value={newWorkflowTriggerType} onValueChange={setNewWorkflowTriggerType}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EVENT" className="text-xs">System Event</SelectItem>
                          <SelectItem value="SCHEDULED" className="text-xs">Scheduled Cron</SelectItem>
                          <SelectItem value="WEBHOOK" className="text-xs">Incoming Webhook</SelectItem>
                          <SelectItem value="MANUAL" className="text-xs">Manual Execution</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Workflow Identifier Key</Label>
                      <Input
                        value={newWorkflowKey}
                        onChange={(e) => setNewWorkflowKey(e.target.value)}
                        placeholder="e.g. order_approval"
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" size="sm" onClick={() => setIsCreateDialogOpen(false)} className="text-xs">
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleCreateWorkflow} disabled={isCreatingWorkflow} className="text-xs font-semibold">
                    {isCreatingWorkflow ? "Creating..." : "Create Workflow"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button variant="ghost" size="sm" onClick={() => setActiveTab("history")} className="gap-1.5 text-xs">
              <History size={14} /> Execution History
            </Button>
            <Button variant="outline" size="sm" onClick={() => saveWorkflow(false)} disabled={isSaving} className="gap-1.5 text-xs">
              <Save size={14} /> {isSaving ? "Saving..." : "Save Draft"}
            </Button>
            <Button size="sm" onClick={() => saveWorkflow(true)} disabled={isSaving} className="gap-1.5 text-xs font-semibold shadow-sm">
              <Play size={14} /> Publish Workflow
            </Button>
          </div>
        </header>

        {/* Studio Body */}
        <div className="flex min-h-0 flex-1">
          {/* Left Sidebar: Workflow Selector & Palette */}
          <aside
            className={cn(
              "flex shrink-0 flex-col border-r border-border bg-card/60 backdrop-blur-sm transition-all duration-300",
              isSidebarCollapsed ? "w-16" : "w-80"
            )}
          >
            {isSidebarCollapsed ? (
              /* Collapsed Compact View */
              <div className="flex h-full flex-col items-center py-3 gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 rounded-lg hover:bg-accent"
                  onClick={() => setIsSidebarCollapsed(false)}
                  title="Expand Sidebar"
                >
                  <PanelLeftOpen size={18} />
                </Button>
                <Separator className="w-8" />
                <div className="flex flex-col items-center gap-2 overflow-y-auto w-full px-2">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground rotate-90 my-2">Workflows</p>
                  {workflows.slice(0, 5).map((w) => (
                    <button
                      key={w.path}
                      onClick={() => selectWorkflow(w.path)}
                      title={w.name}
                      className={cn(
                        "flex size-9 items-center justify-center rounded-lg transition-all",
                        w.path === selectedWorkflow?.path
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <Zap size={16} />
                    </button>
                  ))}
                </div>
                <Separator className="w-8 mt-auto" />
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground rotate-90 my-2">Palette</p>
                <div className="flex flex-col items-center gap-2 pb-3">
                  {palette.slice(0, 6).map((item) => (
                    <button
                      key={item.label}
                      onClick={() => addNode(item)}
                      title={`Add ${item.label}`}
                      className="flex size-9 items-center justify-center rounded-lg border border-border/60 bg-card text-foreground hover:border-primary hover:bg-accent shadow-xs"
                    >
                      <Icon name={item.icon} />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Expanded Full Sidebar */
              <>
                <div className="border-b p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Workflows</p>
                      <p className="text-xs text-muted-foreground">{workflows.length} available automations</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => {
                        setInspectorTab("provisioning");
                        toast.info("Select a workflow or customize provisioning options in the inspector");
                      }}
                    >
                      <SlidersHorizontal size={12} /> Provision
                    </Button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search workflows..."
                      className="h-8 pl-8 text-xs"
                    />
                  </div>
                </div>

                {/* Workflow List */}
                <div className="max-h-48 overflow-y-auto border-b p-2">
                  {isLoading ? (
                    <div className="p-4 text-center text-xs text-muted-foreground">Loading workflows...</div>
                  ) : (
                    filteredWorkflows.map((workflow) => {
                      const isSelected = workflow.path === selectedWorkflow?.path;
                      return (
                        <button
                          key={workflow.path}
                          onClick={() => selectWorkflow(workflow.path)}
                          className={cn(
                            "mb-1 flex w-full items-start gap-2.5 rounded-lg p-2.5 text-left transition-all",
                            isSelected ? "bg-primary/10 text-primary font-medium ring-1 ring-primary/30" : "hover:bg-accent text-foreground"
                          )}
                        >
                          <span className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md", isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                            <Zap size={14} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5">
                              <span className="truncate text-xs font-semibold">{workflow.name}</span>
                              {workflow.isProvisioned && <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />}
                            </span>
                            <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{workflow.description}</span>
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Component Palette Header */}
                <div className="border-b px-3.5 py-2.5 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Add Steps & Palette</p>
                    <Badge variant="secondary" className="text-[10px]">{palette.length} elements</Badge>
                  </div>
                  <div className="relative mt-2">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={13} />
                    <Input
                      value={paletteSearch}
                      onChange={(e) => setPaletteSearch(e.target.value)}
                      placeholder="Filter palette..."
                      className="h-7 pl-8 text-xs bg-background"
                    />
                  </div>
                </div>

                {/* Palette Grid */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                  {filteredPalette.map((item) => (
                    <div
                      key={item.label}
                      onClick={() => addNode(item)}
                      className="group flex cursor-pointer items-center gap-3 rounded-lg border border-border/60 bg-card p-2.5 text-left transition-all hover:border-primary/50 hover:bg-accent/80 hover:shadow-sm"
                    >
                      <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg text-foreground border border-border/40 shadow-xs", `node-accent-${item.color}`)}>
                        <Icon name={item.icon} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="truncate text-xs font-semibold text-foreground group-hover:text-primary">{item.label}</p>
                          <Plus size={12} className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                        <p className="truncate text-[10px] text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </aside>

          {/* Main Canvas / Visualizer Panel */}
          <section className="flex min-w-0 flex-1 flex-col bg-muted/15 relative">
            {/* View Tab Bar */}
            <div className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-card/60 px-4">
              <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                <button
                  onClick={() => setActiveTab("canvas")}
                  className={cn("rounded-md px-3 py-1 text-xs font-medium transition-all", activeTab === "canvas" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  Canvas Visualizer
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={cn("rounded-md px-3 py-1 text-xs font-medium transition-all", activeTab === "history" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  Run History
                </button>
                <button
                  onClick={() => setActiveTab("logs")}
                  className={cn("rounded-md px-3 py-1 text-xs font-medium transition-all", activeTab === "logs" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  Live Logs
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <ShieldCheck size={14} /> Versioned Engine
                </span>
                <Separator orientation="vertical" className="h-4" />
                <Button
                  variant={testMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTestMode(!testMode)}
                  className="h-7 text-xs gap-1.5"
                >
                  <Activity size={13} />
                  {testMode ? "Exit Test Mode" : "Test Mode"}
                </Button>
              </div>
            </div>

            {/* Visual Canvas Area */}
            {activeTab === "canvas" ? (
              <div className="relative min-h-0 flex-1">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  nodeTypes={nodeTypes}
                  onNodeClick={(_, node) => {
                    setSelectedNodeId(node.id);
                    setInspectorTab("node");
                  }}
                  fitView
                  proOptions={{ hideAttribution: true }}
                >
                  <Background gap={24} size={1} />
                  <Controls className="!border-border !bg-card !shadow-md" />
                  <MiniMap pannable zoomable className="!bg-card !border-border" />
                </ReactFlow>

                {/* Test Mode Overlay banner */}
                {testMode && (
                  <div className="absolute left-1/2 top-4 flex -translate-x-1/2 items-center gap-3 rounded-full border border-primary/40 bg-primary/10 px-5 py-2 text-xs font-medium text-primary shadow-xl backdrop-blur">
                    <Activity size={15} className="animate-spin" />
                    <span>Interactive Test Runner Active</span>
                    <Button size="sm" className="h-6 px-3 text-[11px] font-semibold" onClick={runWorkflow}>
                      Execute Run
                    </Button>
                  </div>
                )}
              </div>
            ) : activeTab === "history" ? (
              /* Execution History View */
              <div className="flex-1 overflow-y-auto p-6">
                <Card className="mx-auto max-w-4xl shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <History className="text-primary" size={18} /> Execution History & Triggers
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Recent job executions for {selectedWorkflow?.name}
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => mutateHistory()} className="gap-1 text-xs">
                      <RefreshCw size={12} /> Refresh
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    {historyData.length === 0 ? (
                      <div className="p-12 text-center text-xs text-muted-foreground">
                        <Clock size={24} className="mx-auto mb-2 opacity-50" />
                        No execution records found for this workflow. Trigger a test run to inspect logs.
                      </div>
                    ) : (
                      <div className="divide-y">
                        {historyData.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-3">
                              <span
                                className={cn(
                                  "flex size-8 items-center justify-center rounded-full text-xs font-bold",
                                  item.status === "COMPLETED" || item.status === "SUCCESS"
                                    ? "bg-emerald-500/10 text-emerald-500"
                                    : item.status === "RUNNING"
                                    ? "bg-blue-500/10 text-blue-500"
                                    : "bg-amber-500/10 text-amber-500"
                                )}
                              >
                                {item.status === "COMPLETED" || item.status === "SUCCESS" ? <Check size={14} /> : <Play size={12} />}
                              </span>
                              <div>
                                <p className="text-xs font-semibold text-foreground font-mono">{item.id}</p>
                                <p className="text-[11px] text-muted-foreground">
                                  Started: {new Date(item.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <Badge
                                variant={
                                  item.status === "COMPLETED" || item.status === "SUCCESS"
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-[10px]"
                              >
                                {item.status}
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[11px]"
                                onClick={() => {
                                  setSelectedJobId(item.id);
                                  setActiveTab("logs");
                                }}
                              >
                                View Logs
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* Live Logs View */
              <div className="flex-1 overflow-y-auto p-6">
                <Card className="mx-auto max-w-4xl shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="text-primary" size={18} /> Workflow Execution Logs
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {selectedJobId ? `Job Instance: ${selectedJobId}` : "Select a job run from history or execute test mode"}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    {isLogsLoading ? (
                      <p className="text-xs text-muted-foreground">Fetching workflow execution audit logs...</p>
                    ) : (
                      <pre className="rounded-lg bg-black/90 p-4 font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                        {logsText || "No logs available for selected execution."}
                      </pre>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </section>

          {/* Right Inspector & Customization Panel */}
          <aside className="flex w-88 shrink-0 flex-col border-l border-border bg-card/70 backdrop-blur-sm">
            {/* Inspector Navigation Header */}
            <div className="flex h-12 items-center justify-between border-b px-4">
              <div className="flex items-center gap-2 text-xs font-bold tracking-tight uppercase text-foreground">
                <Settings2 size={15} className="text-primary" /> Configuration Inspector
              </div>
            </div>

            {/* Inspector Tabs */}
            <div className="flex border-b px-2 bg-muted/20">
              <button
                onClick={() => setInspectorTab("node")}
                className={cn(
                  "border-b-2 px-3 py-2.5 text-xs font-semibold transition-all",
                  inspectorTab === "node" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                Step Config
              </button>
              <button
                onClick={() => setInspectorTab("provisioning")}
                className={cn(
                  "border-b-2 px-3 py-2.5 text-xs font-semibold transition-all",
                  inspectorTab === "provisioning" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                Workflow Settings
              </button>
              <button
                onClick={() => setInspectorTab("governance")}
                className={cn(
                  "border-b-2 px-3 py-2.5 text-xs font-semibold transition-all",
                  inspectorTab === "governance" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                Governance
              </button>
            </div>

            {/* Inspector Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {inspectorTab === "node" ? (
                activeNode ? (
                  <div className="space-y-5">
                    {/* Step Title Header */}
                    <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/20">
                      <span className={cn("flex size-9 items-center justify-center rounded-lg text-foreground border shadow-xs", `node-accent-${activeNode.data.color}`)}>
                        <Icon name={activeNode.data.icon} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground">{activeNode.data.label}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{activeNode.data.subtitle}</p>
                      </div>
                    </div>

                    {/* Step Basic Inputs */}
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs font-medium">Step Label</Label>
                        <Input
                          value={activeNode.data.label}
                          onChange={(e) => updateActiveNode((d) => ({ ...d, label: e.target.value }))}
                          className="mt-1 h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Description</Label>
                        <Textarea
                          value={activeNode.data.description || ""}
                          onChange={(e) => updateActiveNode((d) => ({ ...d, description: e.target.value }))}
                          className="mt-1 min-h-16 text-xs"
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Logic / Branch Conditions Editor */}
                    {activeNode.data.kind === "logic" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <GitBranch size={13} className="text-emerald-500" /> Condition Rules
                          </Label>
                          <Select
                            value={activeNode.data.conditions?.matchMode || "ALL"}
                            onValueChange={(val: "ALL" | "ANY") =>
                              updateActiveNode((d) => ({
                                ...d,
                                conditions: {
                                  matchMode: val,
                                  rules: d.conditions?.rules || [],
                                },
                              }))
                            }
                          >
                            <SelectTrigger className="h-7 w-20 text-[10px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ALL" className="text-xs">Match ALL</SelectItem>
                              <SelectItem value="ANY" className="text-xs">Match ANY</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Condition Rules List */}
                        <div className="space-y-2.5">
                          {(activeNode.data.conditions?.rules || []).map((rule, idx) => (
                            <div key={rule.id} className="rounded-lg border bg-muted/30 p-2.5 space-y-2 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-muted-foreground">Rule #{idx + 1}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-5 text-muted-foreground hover:text-destructive"
                                  onClick={() => removeConditionRule(rule.id)}
                                >
                                  <X size={12} />
                                </Button>
                              </div>

                              <div>
                                <Label className="text-[10px] text-muted-foreground">Target Field / Variable</Label>
                                <Input
                                  value={rule.field}
                                  onChange={(e) => updateConditionRule(rule.id, "field", e.target.value)}
                                  placeholder="e.g. payload.amount"
                                  className="mt-0.5 h-7 text-xs font-mono"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-[10px] text-muted-foreground">Operator</Label>
                                  <Select
                                    value={rule.operator}
                                    onValueChange={(val: any) => updateConditionRule(rule.id, "operator", val)}
                                  >
                                    <SelectTrigger className="mt-0.5 h-7 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="equals" className="text-xs">Equals (==)</SelectItem>
                                      <SelectItem value="not_equals" className="text-xs">Not Equals (!=)</SelectItem>
                                      <SelectItem value="contains" className="text-xs">Contains</SelectItem>
                                      <SelectItem value="greater_than" className="text-xs">Greater Than (&gt;)</SelectItem>
                                      <SelectItem value="less_than" className="text-xs">Less Than (&lt;)</SelectItem>
                                      <SelectItem value="is_empty" className="text-xs">Is Empty</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-[10px] text-muted-foreground">Comparison Value</Label>
                                  <Input
                                    value={rule.value}
                                    onChange={(e) => updateConditionRule(rule.id, "value", e.target.value)}
                                    placeholder="Value..."
                                    className="mt-0.5 h-7 text-xs font-mono"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={addConditionRule}
                            className="w-full h-8 border-dashed text-xs gap-1.5"
                          >
                            <Plus size={13} /> Add Condition Rule
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Step Config Parameters */}
                    {activeNode.data.config && Object.keys(activeNode.data.config).length > 0 && (
                      <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Step Parameters</Label>
                        <div className="space-y-2">
                          {Object.entries(activeNode.data.config).map(([key, val]) => (
                            <div key={key}>
                              <Label className="text-[11px] text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1")}</Label>
                              <Input
                                value={String(val)}
                                onChange={(e) => updateConfigValue(key, e.target.value)}
                                className="mt-0.5 h-8 text-xs font-mono"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Step Execution & Retry Policies */}
                    <div className="space-y-3">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Execution & Retries</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-[10px] text-muted-foreground">Max Retries</Label>
                          <Select
                            value={String(activeNode.data.executionOptions?.retryCount ?? 3)}
                            onValueChange={(val) =>
                              updateActiveNode((d) => ({
                                ...d,
                                executionOptions: { ...(d.executionOptions || {}), retryCount: parseInt(val, 10) },
                              }))
                            }
                          >
                            <SelectTrigger className="mt-0.5 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0" className="text-xs">No Retry</SelectItem>
                              <SelectItem value="1" className="text-xs">1 Retry</SelectItem>
                              <SelectItem value="3" className="text-xs">3 Retries</SelectItem>
                              <SelectItem value="5" className="text-xs">5 Retries</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-[10px] text-muted-foreground">Backoff Strategy</Label>
                          <Select
                            value={activeNode.data.executionOptions?.backoffStrategy || "exponential"}
                            onValueChange={(val: any) =>
                              updateActiveNode((d) => ({
                                ...d,
                                executionOptions: { ...(d.executionOptions || {}), backoffStrategy: val },
                              }))
                            }
                          >
                            <SelectTrigger className="mt-0.5 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="linear" className="text-xs">Linear</SelectItem>
                              <SelectItem value="exponential" className="text-xs">Exponential</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Delete Action */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-center gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => {
                        setNodes((items) => items.filter((n) => n.id !== activeNode.id));
                        setSelectedNodeId(null);
                        toast.info("Step removed from canvas");
                      }}
                    >
                      <Trash2 size={14} /> Remove Step from Workflow
                    </Button>
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                    <Sparkles className="mx-auto text-primary" size={24} />
                    <p className="font-semibold text-foreground">No Step Selected</p>
                    <p className="max-w-[200px] mx-auto text-[11px]">Click on any canvas step or add an element from the palette on the left.</p>
                  </div>
                )
              ) : inspectorTab === "provisioning" ? (
                /* Workflow Provisioning & Schema Settings */
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Workflow Customization</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Configure template parameters &amp; workspace defaults for {selectedWorkflow?.name}.
                    </p>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/20">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-semibold">Workflow Status</Label>
                      <p className="text-[10px] text-muted-foreground">Enable or pause execution triggers</p>
                    </div>
                    <Switch
                      checked={workflowSettings.enabled !== false}
                      onCheckedChange={(checked) => setWorkflowSettings((prev) => ({ ...prev, enabled: checked }))}
                    />
                  </div>

                  {/* Dynamic Schema Form Controls */}
                  {selectedWorkflow?.schema?.properties ? (
                    <div className="space-y-4">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Template Parameters
                      </Label>
                      {Object.entries(selectedWorkflow.schema.properties).map(([propKey, propDef]) => {
                        const val = workflowSettings[propKey] ?? propDef.default ?? "";
                        return (
                          <div key={propKey} className="space-y-1">
                            <Label className="text-xs font-medium text-foreground">
                              {propDef.title || propKey}
                            </Label>
                            {propDef.description && (
                              <p className="text-[10px] text-muted-foreground">{propDef.description}</p>
                            )}

                            {propDef.type === "boolean" ? (
                              <div className="flex items-center justify-between pt-1">
                                <span className="text-xs text-muted-foreground font-mono">{propKey}</span>
                                <Switch
                                  checked={Boolean(val)}
                                  onCheckedChange={(checked) =>
                                    setWorkflowSettings((prev) => ({ ...prev, [propKey]: checked }))
                                  }
                                />
                              </div>
                            ) : propDef.enum ? (
                              <Select
                                value={String(val)}
                                onValueChange={(selectedVal) =>
                                  setWorkflowSettings((prev) => ({ ...prev, [propKey]: selectedVal }))
                                }
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {propDef.enum.map((opt, i) => (
                                    <SelectItem key={opt} value={opt} className="text-xs">
                                      {propDef.enumNames?.[i] || opt}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                value={String(val)}
                                onChange={(e) =>
                                  setWorkflowSettings((prev) => ({ ...prev, [propKey]: e.target.value }))
                                }
                                className="h-8 text-xs font-mono"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                      No JSON schema settings declared for this workflow. Custom settings will be stored in workflow configuration.
                    </div>
                  )}

                  <Button
                    className="w-full gap-1.5 text-xs font-semibold shadow-xs"
                    onClick={() => saveWorkflow(false)}
                    disabled={isSaving}
                  >
                    <Save size={14} /> Save Provisioning Settings
                  </Button>
                </div>
              ) : (
                /* Governance Tab */
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Enterprise Governance</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Ensure compliance and safety policies across automated executions.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {[
                      { title: "Require Peer Review to Publish", desc: "Require workspace admin approval for canvas edits", value: true },
                      { title: "Detailed Audit Logging", desc: "Log full execution payloads and step context", value: true },
                      { title: "Manual Trigger Restrictions", desc: "Restrict manual runs to workspace leads", value: false },
                      { title: "Automatic PII Redaction", desc: "Redact email addresses and sensitive customer fields in logs", value: true },
                    ].map((gov) => (
                      <div key={gov.title} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-foreground">{gov.title}</p>
                          <p className="text-[10px] text-muted-foreground">{gov.desc}</p>
                        </div>
                        <Switch defaultChecked={gov.value} />
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <AlertTriangle size={14} /> Compliance Policy
                    </div>
                    <p className="text-[11px] leading-relaxed opacity-90">
                      All published automation changes are cryptographically timestamped and assigned to your workspace identity.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Save Action */}
            <div className="border-t p-3 bg-muted/10">
              <Button
                className="w-full text-xs font-semibold gap-1.5 shadow-sm"
                onClick={() => saveWorkflow(false)}
                disabled={isSaving}
              >
                <Save size={14} /> {isSaving ? "Saving..." : "Save Canvas & Settings"}
              </Button>
            </div>
          </aside>
        </div>
      </main>
    </ReactFlowProvider>
  );
}
