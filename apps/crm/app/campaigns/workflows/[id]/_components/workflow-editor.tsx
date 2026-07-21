"use client";

import React, { useCallback, useState, useRef } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Handle,
  Position,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  Mail,
  MessageSquare,
  Clock,
  Play,
  Save,
  ChevronLeft,
  UserPlus,
  Zap,
  GitBranch,
  MousePointer2,
  Tag,
  Webhook,
  Filter,
  CheckSquare,
  Users,
  AlertCircle,
  X,
  Check,
  Pencil,
  PanelRight,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateWorkflow } from "@/app/actions/campaigns";
import { simulateWorkflow } from "@/app/actions/workflows";
import { getCustomers } from "@/app/actions/customers";
import { cn } from "@repo/ui/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog";

// ──────────────────────────────────────────────────────────────
//  Node type definitions
// ──────────────────────────────────────────────────────────────

const NODE_PALETTE = [
  {
    group: "Triggers",
    items: [
      {
        type: "trigger",
        subType: "NEW_LEAD",
        label: "New Lead",
        icon: UserPlus,
        description: "Fires when a new lead is created",
        color: "#6366f1",
        bg: "bg-indigo-50 dark:bg-indigo-950/30",
        border: "border-indigo-300 dark:border-indigo-700",
        text: "text-indigo-700 dark:text-indigo-300",
      },
      {
        type: "trigger",
        subType: "DEAL_STAGE_CHANGE",
        label: "Deal Stage Change",
        icon: GitBranch,
        description: "Fires when a deal moves to a new stage",
        color: "#8b5cf6",
        bg: "bg-violet-50 dark:bg-violet-950/30",
        border: "border-violet-300 dark:border-violet-700",
        text: "text-violet-700 dark:text-violet-300",
      },
      {
        type: "trigger",
        subType: "FORM_SUBMIT",
        label: "Form Submission",
        icon: CheckSquare,
        description: "Fires when a form is submitted",
        color: "#3b82f6",
        bg: "bg-blue-50 dark:bg-blue-950/30",
        border: "border-blue-300 dark:border-blue-700",
        text: "text-blue-700 dark:text-blue-300",
      },
      {
        type: "trigger",
        subType: "WEBHOOK",
        label: "Webhook",
        icon: Webhook,
        description: "Fires on inbound webhook",
        color: "#0ea5e9",
        bg: "bg-sky-50 dark:bg-sky-950/30",
        border: "border-sky-300 dark:border-sky-700",
        text: "text-sky-700 dark:text-sky-300",
      },
    ],
  },
  {
    group: "Actions",
    items: [
      {
        type: "action",
        subType: "SCRYMECHAT",
        label: "ScrymeChat Message",
        icon: MessageSquare,
        description: "Send a native ScrymeChat message",
        color: "#06b6d4",
        bg: "bg-cyan-50 dark:bg-cyan-950/30",
        border: "border-cyan-300 dark:border-cyan-700",
        text: "text-cyan-700 dark:text-cyan-300",
      },
      {
        type: "action",
        subType: "EMAIL",
        label: "Send Email",
        icon: Mail,
        description: "Send an email to the contact",
        color: "#3b82f6",
        bg: "bg-blue-50 dark:bg-blue-950/30",
        border: "border-blue-300 dark:border-blue-700",
        text: "text-blue-700 dark:text-blue-300",
      },
      {
        type: "action",
        subType: "SMS",
        label: "Send SMS",
        icon: MessageSquare,
        description: "Send an SMS to the contact",
        color: "#22c55e",
        bg: "bg-green-50 dark:bg-green-950/30",
        border: "border-green-300 dark:border-green-700",
        text: "text-green-700 dark:text-green-300",
      },
      {
        type: "action",
        subType: "TASK",
        label: "Create Task",
        icon: CheckSquare,
        description: "Create a follow-up task",
        color: "#f59e0b",
        bg: "bg-amber-50 dark:bg-amber-950/30",
        border: "border-amber-300 dark:border-amber-700",
        text: "text-amber-700 dark:text-amber-300",
      },
      {
        type: "action",
        subType: "TAG",
        label: "Add Tag",
        icon: Tag,
        description: "Tag the contact or deal",
        color: "#ec4899",
        bg: "bg-pink-50 dark:bg-pink-950/30",
        border: "border-pink-300 dark:border-pink-700",
        text: "text-pink-700 dark:text-pink-300",
      },
      {
        type: "action",
        subType: "ASSIGN",
        label: "Assign Owner",
        icon: Users,
        description: "Assign a record to a team member",
        color: "#8b5cf6",
        bg: "bg-violet-50 dark:bg-violet-950/30",
        border: "border-violet-300 dark:border-violet-700",
        text: "text-violet-700 dark:text-violet-300",
      },
    ],
  },
  {
    group: "Logic",
    items: [
      {
        type: "delay",
        subType: "DELAY",
        label: "Wait / Delay",
        icon: Clock,
        description: "Pause the flow for a duration",
        color: "#f59e0b",
        bg: "bg-amber-50 dark:bg-amber-950/30",
        border: "border-amber-300 dark:border-amber-700",
        text: "text-amber-700 dark:text-amber-300",
      },
      {
        type: "condition",
        subType: "CONDITION",
        label: "Condition / Branch",
        icon: Filter,
        description: "Branch based on a condition",
        color: "#ef4444",
        bg: "bg-red-50 dark:bg-red-950/30",
        border: "border-red-300 dark:border-red-700",
        text: "text-red-700 dark:text-red-300",
      },
    ],
  },
];

// Helper to get palette item config by subType
function getPaletteItem(subType: string) {
  for (const group of NODE_PALETTE) {
    const item = group.items.find((i) => i.subType === subType);
    if (item) return item;
  }
  return null;
}

// ──────────────────────────────────────────────────────────────
//  Custom React Flow node components
// ──────────────────────────────────────────────────────────────

function TriggerNode({ data, selected }: any) {
  const config = getPaletteItem(data.subType || "NEW_LEAD");
  const Icon = config?.icon || Zap;
  return (
    <div
      className={cn(
        "min-w-[200px] rounded-xl border-2 shadow-sm transition-all",
        selected
          ? "border-primary shadow-md shadow-primary/20"
          : `${config?.border || "border-indigo-300"}`,
        config?.bg || "bg-indigo-50",
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-current/10">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center"
          style={{ backgroundColor: config?.color + "25" }}
        >
          <Icon size={13} style={{ color: config?.color }} />
        </div>
        <span
          className={cn(
            "text-[9px] font-bold uppercase tracking-widest",
            config?.text || "text-indigo-700",
          )}
        >
          Trigger
        </span>
      </div>
      <div className="px-3 py-2.5">
        <div className="text-[12.5px] font-semibold text-foreground">
          {data.label}
        </div>
        {data.description && (
          <div className="text-[10.5px] text-muted-foreground mt-0.5 leading-snug">
            {data.description}
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3! h-3! rounded-full! border-2! border-white!"
        style={{ backgroundColor: config?.color }}
      />
    </div>
  );
}

function ActionNode({ data, selected }: any) {
  const config = getPaletteItem(data.subType || "EMAIL");
  const Icon = config?.icon || Mail;
  return (
    <div
      className={cn(
        "min-w-[200px] rounded-xl border shadow-sm transition-all",
        selected
          ? "border-primary shadow-md shadow-primary/20"
          : "border-border hover:border-border/80",
        "bg-card",
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3! h-3! rounded-full! border-2! border-white!"
        style={{ backgroundColor: config?.color || "#3b82f6" }}
      />
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center"
          style={{ backgroundColor: (config?.color || "#3b82f6") + "20" }}
        >
          <Icon size={13} style={{ color: config?.color || "#3b82f6" }} />
        </div>
        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
          Action
        </span>
        {data.subType && (
          <span
            className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: (config?.color || "#3b82f6") + "15",
              color: config?.color || "#3b82f6",
            }}
          >
            {data.subType}
          </span>
        )}
      </div>
      <div className="px-3 py-2.5">
        <div className="text-[12.5px] font-semibold text-foreground">
          {data.label}
        </div>
        {data.content && (
          <div className="text-[10.5px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">
            {data.content}
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3! h-3! rounded-full! border-2! border-white!"
        style={{ backgroundColor: config?.color || "#3b82f6" }}
      />
    </div>
  );
}

function DelayNode({ data, selected }: any) {
  return (
    <div
      className={cn(
        "min-w-[160px] rounded-xl border shadow-sm transition-all",
        selected
          ? "border-primary shadow-md shadow-primary/20"
          : "border-amber-300 dark:border-amber-700",
        "bg-amber-50 dark:bg-amber-950/30",
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3! h-3! rounded-full! border-2! border-white! bg-amber-500!"
      />
      <div className="flex items-center gap-2 px-3 py-2 border-b border-amber-200 dark:border-amber-800/50">
        <div className="w-6 h-6 rounded-md bg-amber-200/50 dark:bg-amber-800/30 flex items-center justify-center">
          <Clock size={13} className="text-amber-600 dark:text-amber-400" />
        </div>
        <span className="text-[9px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
          Wait
        </span>
      </div>
      <div className="px-3 py-2.5 text-center">
        <div className="text-[14px] font-bold text-amber-700 dark:text-amber-300">
          {data.duration || "1 Day"}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3! h-3! rounded-full! border-2! border-white! bg-amber-500!"
      />
    </div>
  );
}

function ConditionNode({ data, selected }: any) {
  return (
    <div
      className={cn(
        "min-w-[180px] rounded-xl border shadow-sm transition-all",
        selected
          ? "border-primary shadow-md shadow-primary/20"
          : "border-red-200 dark:border-red-700",
        "bg-card",
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3! h-3! rounded-full! border-2! border-white! bg-red-500!"
      />
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <div className="w-6 h-6 rounded-md bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
          <Filter size={13} className="text-red-500" />
        </div>
        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
          Condition
        </span>
      </div>
      <div className="px-3 py-2.5">
        <div className="text-[12.5px] font-semibold text-foreground">
          {data.label || "If / Else"}
        </div>
      </div>
      <div className="flex border-t border-border">
        <div className="flex-1 text-center py-1 text-[9px] font-bold text-green-600 border-r border-border">
          YES
        </div>
        <div className="flex-1 text-center py-1 text-[9px] font-bold text-red-500">
          NO
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="yes"
        style={{ left: "30%", backgroundColor: "#22c55e" }}
        className="w-3! h-3! rounded-full! border-2! border-white!"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="no"
        style={{ left: "70%", backgroundColor: "#ef4444" }}
        className="w-3! h-3! rounded-full! border-2! border-white!"
      />
    </div>
  );
}

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  delay: DelayNode,
  condition: ConditionNode,
};

// ──────────────────────────────────────────────────────────────
//  Palette sidebar panel
// ──────────────────────────────────────────────────────────────

function PalettePanel({
  onAdd,
}: {
  onAdd: (
    type: string,
    subType: string,
    label: string,
    description: string,
  ) => void;
}) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Triggers: true,
    Actions: true,
    Logic: true,
  });

  const toggleGroup = (group: string) =>
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-[12px] font-bold text-foreground">Node Palette</h3>
        <p className="text-[10.5px] text-muted-foreground mt-0.5">
          Click to add nodes to the canvas
        </p>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
        {NODE_PALETTE.map(({ group, items }) => (
          <div key={group}>
            <button
              className="flex items-center justify-between w-full mb-1.5 group"
              onClick={() => toggleGroup(group)}
            >
              <span className="text-[9.5px] font-bold uppercase tracking-widest text-muted-foreground/70 group-hover:text-muted-foreground transition-colors">
                {group}
              </span>
              <ChevronDown
                size={11}
                className={cn(
                  "text-muted-foreground/50 transition-transform duration-150",
                  !openGroups[group] && "-rotate-90",
                )}
              />
            </button>
            {openGroups[group] && (
              <div className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.subType}
                      onClick={() =>
                        onAdd(
                          item.type,
                          item.subType,
                          item.label,
                          item.description,
                        )
                      }
                      className={cn(
                        "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg border text-left transition-all hover:shadow-sm active:scale-[0.99]",
                        item.bg,
                        item.border,
                      )}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: item.color + "20" }}
                      >
                        <Icon size={14} style={{ color: item.color }} />
                      </div>
                      <div className="min-w-0">
                        <div
                          className={cn(
                            "text-[11.5px] font-semibold truncate",
                            item.text,
                          )}
                        >
                          {item.label}
                        </div>
                        <div className="text-[9.5px] text-muted-foreground/80 truncate leading-snug mt-0.5">
                          {item.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
//  Node Inspector panel
// ──────────────────────────────────────────────────────────────

function NodeInspector({
  node,
  onUpdate,
  onClose,
}: {
  node: Node;
  onUpdate: (id: string, data: any) => void;
  onClose: () => void;
}) {
  const config = getPaletteItem((node.data as any).subType);
  const Icon = config?.icon || MousePointer2;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ backgroundColor: (config?.color || "#6366f1") + "20" }}
          >
            <Icon size={13} style={{ color: config?.color || "#6366f1" }} />
          </div>
          <h3 className="text-[12px] font-bold text-foreground capitalize">
            {node.type as string} Properties
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
        >
          <X size={13} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {/* Label */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Label
          </label>
          <Input
            value={((node.data as any).label as string) || ""}
            onChange={(e) =>
              onUpdate(node.id, { ...node.data, label: e.target.value })
            }
            className="h-8 text-[12.5px]"
          />
        </div>

        {/* Description (triggers) */}
        {node.type === "trigger" && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Description
            </label>
            <Input
              value={((node.data as any).description as string) || ""}
              onChange={(e) =>
                onUpdate(node.id, { ...node.data, description: e.target.value })
              }
              className="h-8 text-[12.5px]"
              placeholder="Trigger description..."
            />
          </div>
        )}

        {/* Message content (email / sms / scrymechat actions) */}
        {node.type === "action" &&
          ["EMAIL", "SMS", "SCRYMECHAT"].includes(
            (node.data as any).subType as string,
          ) && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {(node.data as any).subType === "EMAIL"
                  ? "Email Body"
                  : (node.data as any).subType === "SMS"
                    ? "SMS Message"
                    : "ScrymeChat Message"}
              </label>
              <Textarea
                placeholder={`Enter ${(node.data as any).subType === "EMAIL" ? "email" : (node.data as any).subType === "SMS" ? "SMS" : "ScrymeChat"} content...`}
                rows={5}
                className="text-[12.5px] resize-none"
                value={((node.data as any).content as string) || ""}
                onChange={(e) =>
                  onUpdate(node.id, { ...node.data, content: e.target.value })
                }
              />
            </div>
          )}

        {/* ScrymeChat specific fields */}
        {node.type === "action" &&
          (node.data as any).subType === "SCRYMECHAT" && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Chat Target / Channel ID
              </label>
              <Input
                value={((node.data as any).channelId as string) || ""}
                onChange={(e) =>
                  onUpdate(node.id, { ...node.data, channelId: e.target.value })
                }
                className="h-8 text-[12.5px]"
                placeholder="e.g. general, support, customer"
              />
            </div>
          )}

        {/* Tag name */}
        {node.type === "action" && (node.data as any).subType === "TAG" && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Tag Name
            </label>
            <Input
              value={((node.data as any).tagName as string) || ""}
              onChange={(e) =>
                onUpdate(node.id, { ...node.data, tagName: e.target.value })
              }
              className="h-8 text-[12.5px]"
              placeholder="e.g. hot-lead"
            />
          </div>
        )}

        {/* Delay duration */}
        {node.type === "delay" && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Duration
            </label>
            <Select
              value={((node.data as any).duration as string) || "1 Day"}
              onValueChange={(val) =>
                onUpdate(node.id, { ...node.data, duration: val })
              }
            >
              <SelectTrigger className="h-8 text-[12.5px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  "30 Minutes",
                  "1 Hour",
                  "4 Hours",
                  "1 Day",
                  "2 Days",
                  "3 Days",
                  "1 Week",
                  "2 Weeks",
                ].map((v) => (
                  <SelectItem key={v} value={v} className="text-[12.5px]">
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Condition */}
        {node.type === "condition" && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Condition Logic
            </label>
            <Input
              value={((node.data as any).condition as string) || ""}
              onChange={(e) =>
                onUpdate(node.id, { ...node.data, condition: e.target.value })
              }
              className="h-8 text-[12.5px]"
              placeholder="e.g. lead.score > 50"
            />
          </div>
        )}

        {/* Node ID (readonly) */}
        <div className="space-y-1.5 pt-2 border-t border-border">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Node ID
          </label>
          <p className="text-[11px] text-muted-foreground font-mono bg-muted px-2.5 py-1.5 rounded-md">
            {node.id}
          </p>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
//  Main Workflow Editor
// ──────────────────────────────────────────────────────────────

interface WorkflowEditorProps {
  workflow: any;
}

export function WorkflowEditor({ workflow }: WorkflowEditorProps) {
  const router = useRouter();
  const nodeIdRef = useRef(
    Math.max(
      0,
      ...(workflow?.nodes || []).map((n: any) => parseInt(n.id) || 0),
    ) + 1,
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(workflow?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(workflow?.edges || []);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [workflowName, setWorkflowName] = useState(
    workflow?.name || "Untitled Workflow",
  );
  const [showInspector, setShowInspector] = useState(false);
  const isActive = workflow?.isActive;

  const [isSimOpen, setIsSimOpen] = useState(false);
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationLogs, setSimulationLogs] = useState<any[]>([]);

  const handleOpenSimulation = async () => {
    setIsSimOpen(true);
    setSimulationLogs([]);
    try {
      const list = await getCustomers();
      setCustomersList(list);
      if (list.length > 0) {
        setSelectedCustomerId(list[0].id);
      }
    } catch {
      toast.error("Failed to load customers for testing");
    }
  };

  const handleRunSimulation = async () => {
    if (!selectedCustomerId) {
      toast.error("Please select a customer first");
      return;
    }
    setIsSimulating(true);
    try {
      const res = await simulateWorkflow(workflow.id, selectedCustomerId);
      if (res.success) {
        setSimulationLogs(res.logs || []);
        toast.success("Simulation executed successfully");
      } else {
        toast.error(res.error || "Simulation failed");
      }
    } catch {
      toast.error("An error occurred during simulation");
    } finally {
      setIsSimulating(false);
    }
  };

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setShowInspector(true);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setShowInspector(false);
  }, []);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge({ ...params, animated: true, style: { strokeWidth: 2 } }, eds),
      ),
    [setEdges],
  );

  const handleNodeUpdate = useCallback(
    (id: string, newData: any) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === id ? { ...n, data: newData } : n)),
      );
      setSelectedNode((prev) =>
        prev?.id === id ? { ...prev, data: newData } : prev,
      );
    },
    [setNodes],
  );

  const addNode = (
    type: string,
    subType: string,
    label: string,
    description: string,
  ) => {
    const id = String(nodeIdRef.current++);
    const lastNode = nodes[nodes.length - 1];
    const position = lastNode
      ? { x: lastNode.position.x, y: lastNode.position.y + 160 }
      : { x: 250, y: 100 };

    const newNode: Node = {
      id,
      type,
      data: { subType, label, description },
      position,
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const onSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const result = await updateWorkflow(workflow.id, {
        name: workflowName,
        nodes: nodes as any,
        edges: edges as any,
      });
      if (result.success) {
        toast.success("Workflow saved");
      } else {
        toast.error("Failed to save workflow");
      }
    } catch {
      toast.error("Error saving workflow");
    } finally {
      setIsSaving(false);
    }
  }, [workflow.id, nodes, edges, workflowName]);

  const onPublish = useCallback(async () => {
    setIsPublishing(true);
    try {
      await onSave();
      const result = await updateWorkflow(workflow.id, { isActive: true });
      if (result.success) {
        toast.success("Workflow is now live");
      } else {
        toast.error("Failed to publish workflow");
      }
    } catch {
      toast.error("Error publishing workflow");
    } finally {
      setIsPublishing(false);
    }
  }, [workflow.id, onSave]);

  const onPause = useCallback(async () => {
    const result = await updateWorkflow(workflow.id, { isActive: false });
    if (result.success) {
      toast.success("Workflow paused");
    }
  }, [workflow.id]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Toolbar */}
      <header className="flex items-center justify-between h-12 px-4 border-b border-border bg-card shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Editable workflow name */}
          {isEditingName ? (
            <div className="flex items-center gap-1.5">
              <input
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="text-[13px] font-semibold bg-background border border-primary rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground min-w-[200px]"
                onKeyDown={(e) => e.key === "Enter" && setIsEditingName(false)}
                autoFocus
              />
              <button
                onClick={() => setIsEditingName(false)}
                className="p-1 rounded text-green-600 hover:bg-green-50 transition-colors"
              >
                <Check size={13} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <h1 className="text-[13px] font-semibold text-foreground">
                {workflowName}
              </h1>
              <button
                onClick={() => setIsEditingName(true)}
                className="p-1 rounded text-muted-foreground/50 hover:text-muted-foreground hover:bg-accent transition-colors"
              >
                <Pencil size={11} />
              </button>
            </div>
          )}

          <div className="flex items-center gap-1.5 border-l border-border pl-3">
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                isActive ? "bg-green-500 animate-pulse" : "bg-muted-foreground",
              )}
            />
            <span className="text-[11px] text-muted-foreground">
              {isActive ? "Live" : "Draft"}
            </span>
            <span className="text-[10px] text-muted-foreground/50">
              &bull; {nodes.length} node{nodes.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-[12px] border-primary text-primary hover:bg-primary/5"
            onClick={handleOpenSimulation}
          >
            <Play size={13} />
            Run Test
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-[12px]"
            onClick={onSave}
            disabled={isSaving}
          >
            <Save size={13} />
            {isSaving ? "Saving..." : "Save"}
          </Button>
          {isActive ? (
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-[12px] text-amber-600 border-amber-300 hover:bg-amber-50"
              onClick={onPause}
            >
              <AlertCircle size={13} />
              Pause
            </Button>
          ) : (
            <Button
              size="sm"
              className="h-7 gap-1.5 text-[12px] bg-green-600 hover:bg-green-700 text-white"
              onClick={onPublish}
              disabled={isPublishing || nodes.length === 0}
            >
              <Play size={13} />
              {isPublishing ? "Publishing..." : "Publish"}
            </Button>
          )}
          <button
            onClick={() => setShowInspector((v) => !v)}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              showInspector
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
            aria-label="Toggle inspector"
          >
            <PanelRight size={15} />
          </button>
        </div>
      </header>

      {/* Main Canvas Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Palette */}
        <aside className="w-[220px] shrink-0 border-r border-border bg-card overflow-hidden flex flex-col">
          <PalettePanel onAdd={addNode} />
        </aside>

        {/* Flow Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            defaultEdgeOptions={{ animated: true, style: { strokeWidth: 2 } }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="var(--border)"
            />
            <Controls className="bottom-4! left-4!" showInteractive={false} />
            <MiniMap
              className="bottom-4! right-4!"
              nodeStrokeWidth={2}
              zoomable
              pannable
            />

            {nodes.length === 0 && (
              <Panel
                position="top-center"
                className="pointer-events-none mt-20"
              >
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                    <GitBranch size={22} className="text-muted-foreground/60" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-muted-foreground">
                      Empty canvas
                    </p>
                    <p className="text-[11.5px] text-muted-foreground/60 mt-0.5">
                      Add nodes from the left palette to start building your
                      workflow
                    </p>
                  </div>
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>

        {/* Right Inspector */}
        {showInspector && (
          <aside className="w-[260px] shrink-0 border-l border-border bg-card overflow-hidden flex flex-col">
            {selectedNode ? (
              <NodeInspector
                node={selectedNode}
                onUpdate={handleNodeUpdate}
                onClose={() => {
                  setSelectedNode(null);
                  setShowInspector(false);
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-3">
                  <MousePointer2
                    size={18}
                    className="text-muted-foreground/60"
                  />
                </div>
                <p className="text-[12px] font-semibold text-muted-foreground">
                  No node selected
                </p>
                <p className="text-[11px] text-muted-foreground/60 mt-1 leading-snug">
                  Click any node on the canvas to edit its properties
                </p>
              </div>
            )}
          </aside>
        )}
      </div>

      <Dialog open={isSimOpen} onOpenChange={setIsSimOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Simulate/Test Workflow</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-[12px] text-muted-foreground">
              Select a customer to run through this workflow sequentially.
              Placeholders like{" "}
              <code className="font-mono bg-muted p-0.5 rounded text-[11px]">{`{customer.name}`}</code>{" "}
              will be dynamically resolved.
            </p>
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Select Test Customer
              </label>
              <Select
                value={selectedCustomerId}
                onValueChange={(val) => setSelectedCustomerId(val)}
              >
                <SelectTrigger className="w-full h-9 bg-background">
                  <SelectValue placeholder="Select a customer..." />
                </SelectTrigger>
                <SelectContent>
                  {customersList.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.email || "No email"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end pt-2">
              <Button
                onClick={handleRunSimulation}
                disabled={isSimulating || customersList.length === 0}
              >
                {isSimulating ? "Simulating..." : "Run Simulation"}
              </Button>
            </div>

            {simulationLogs.length > 0 && (
              <div className="border border-border rounded-xl overflow-hidden mt-4">
                <div className="bg-muted px-4 py-2 border-b border-border">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Execution Logs
                  </span>
                </div>
                <div className="p-4 space-y-3.5 max-h-[250px] overflow-y-auto custom-scrollbar">
                  {simulationLogs.map((log, idx) => (
                    <div key={idx} className="flex gap-3 text-left items-start">
                      <div className="w-5 h-5 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center shrink-0 text-xs mt-0.5">
                        ✓
                      </div>
                      <div className="flex-1">
                        <div className="text-[12.5px] font-semibold text-foreground flex items-center gap-1.5 flex-wrap">
                          {log.label || "Step"}
                          <span className="text-[9.5px] uppercase tracking-wider px-1.5 py-0.5 bg-accent text-accent-foreground rounded font-bold">
                            {log.type}
                          </span>
                        </div>
                        <p className="text-[11.5px] text-muted-foreground mt-1 whitespace-pre-wrap leading-relaxed">
                          {log.details}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
