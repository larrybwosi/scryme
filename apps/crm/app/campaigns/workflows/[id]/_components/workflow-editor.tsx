"use client";

import React, { useCallback, useState } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import {
  Mail,
  MessageSquare,
  Clock,
  Play,
  Save,
  ChevronLeft,
  UserPlus,
  Zap,
  MousePointer2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateWorkflow } from "@/app/actions/campaigns";
import { Input } from "@repo/ui/components/ui/input";
import { Textarea } from "@repo/ui/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";

// Custom Node Components
const TriggerNode = ({ data }: any) => (
  <Card className="min-w-[180px] border-2 border-blue-500 shadow-md">
    <div className="bg-blue-500 p-2 flex items-center gap-2 text-white rounded-t-sm">
      <Zap size={14} />
      <span className="text-xs font-bold uppercase tracking-wider">
        Trigger
      </span>
    </div>
    <CardContent className="p-3">
      <div className="text-sm font-medium">{data.label}</div>
      <div className="text-[10px] text-muted-foreground mt-1">
        {data.description}
      </div>
    </CardContent>
    <Handle
      type="source"
      position={Position.Bottom}
      className="w-3 h-3 bg-blue-500"
    />
  </Card>
);

const ActionNode = ({ data }: any) => (
  <Card className="min-w-[180px] border-2 border-slate-200 shadow-sm hover:border-slate-400 transition-colors">
    <Handle
      type="target"
      position={Position.Top}
      className="w-3 h-3 bg-slate-300"
    />
    <div className="p-2 border-b flex items-center gap-2 bg-slate-50">
      {data.type === "EMAIL" && <Mail size={14} className="text-blue-500" />}
      {data.type === "SMS" && (
        <MessageSquare size={14} className="text-green-500" />
      )}
      {data.type === "TASK" && (
        <UserPlus size={14} className="text-orange-500" />
      )}
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        Action
      </span>
    </div>
    <CardContent className="p-3">
      <div className="text-sm font-medium">{data.label}</div>
    </CardContent>
    <Handle
      type="source"
      position={Position.Bottom}
      className="w-3 h-3 bg-slate-300"
    />
  </Card>
);

const DelayNode = ({ data }: any) => (
  <Card className="min-w-[150px] border-2 border-yellow-400 bg-yellow-50/30">
    <Handle
      type="target"
      position={Position.Top}
      className="w-3 h-3 bg-yellow-400"
    />
    <div className="p-1 flex justify-center text-yellow-600">
      <Clock size={16} />
    </div>
    <CardContent className="p-2 text-center">
      <div className="text-xs font-bold text-yellow-700">
        {data.duration} Delay
      </div>
    </CardContent>
    <Handle
      type="source"
      position={Position.Bottom}
      className="w-3 h-3 bg-yellow-400"
    />
  </Card>
);

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  delay: DelayNode,
};

interface WorkflowEditorProps {
  workflow: any;
  organizationId: string;
}

export function WorkflowEditor({
  workflow,
  organizationId,
}: WorkflowEditorProps) {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState(workflow?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(workflow?.edges || []);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const result = await updateWorkflow(workflow.id, {
        nodes: nodes as any,
        edges: edges as any,
      });
      if (result.success) {
        toast.success("Workflow saved successfully");
      } else {
        toast.error("Failed to save workflow");
      }
    } catch (error) {
      toast.error("Error saving workflow");
    } finally {
      setIsSaving(false);
    }
  }, [workflow.id, nodes, edges]);

  const addAction = (type: string, label: string) => {
    const newNode: Node = {
      id: `${nodes.length + 1}`,
      type: "action",
      data: { type, label },
      position: {
        x: 250,
        y: nodes.length > 0 ? nodes[nodes.length - 1].position.y + 150 : 150,
      },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const addDelay = () => {
    const newNode: Node = {
      id: `${nodes.length + 1}`,
      type: "delay",
      data: { duration: "2 Days" },
      position: {
        x: 250,
        y: nodes.length > 0 ? nodes[nodes.length - 1].position.y + 150 : 150,
      },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="h-16 border-b flex items-center justify-between px-6 bg-white shrink-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft size={20} />
          </Button>
          <div>
            <h1 className="font-bold text-lg">{workflow.name}</h1>
            <p className="text-xs text-muted-foreground italic">
              Draft • Last saved moments ago
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />{" "}
            {isSaving ? "Saving..." : "Save Draft"}
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={async () => {
              await onSave();
              await updateWorkflow(workflow.id, { isActive: true });
              toast.success("Workflow published!");
            }}
          >
            <Play className="mr-2 h-4 w-4" /> Publish Workflow
          </Button>
        </div>
      </header>

      <div className="flex-1 relative bg-slate-50">
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
        >
          <Background />
          <Controls />
          <MiniMap />

          <Panel
            position="top-right"
            className="bg-white p-4 rounded-xl border shadow-xl w-64 flex flex-col gap-4"
          >
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
                <MousePointer2 size={14} className="text-blue-500" />
                Workflow Palette
              </h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start text-xs h-10 border-slate-200"
                  onClick={() => addAction("EMAIL", "Send Welcome Email")}
                >
                  <Mail size={14} className="mr-2 text-blue-500" />
                  Send Email
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-xs h-10 border-slate-200"
                  onClick={() => addAction("SMS", "Send SMS Alert")}
                >
                  <MessageSquare size={14} className="mr-2 text-green-500" />
                  Send SMS
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-xs h-10 border-slate-200"
                  onClick={() => addAction("TASK", "Create Follow-up Task")}
                >
                  <UserPlus size={14} className="mr-2 text-orange-500" />
                  Create Task
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-xs h-10 border-slate-200"
                  onClick={addDelay}
                >
                  <Clock size={14} className="mr-2 text-yellow-500" />
                  Wait / Delay
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Editor Info
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Drag and drop nodes to organize the journey. Connect ports to
                define the sequence.
              </p>
            </div>
          </Panel>

          {selectedNode && (
            <Panel
              position="bottom-right"
              className="bg-white p-4 rounded-xl border shadow-2xl w-80 mb-4 mr-4"
            >
              <h3 className="text-sm font-bold border-b pb-2 mb-3">
                Node Properties
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">
                    Label
                  </label>
                  <Input
                    value={selectedNode.data.label as string}
                    onChange={(e: any) => {
                      const newLabel = e.target.value;
                      setNodes((nds) =>
                        nds.map((n) =>
                          n.id === selectedNode.id
                            ? { ...n, data: { ...n.data, label: newLabel } }
                            : n,
                        ),
                      );
                      setSelectedNode((prev) =>
                        prev
                          ? { ...prev, data: { ...prev.data, label: newLabel } }
                          : null,
                      );
                    }}
                    className="mt-1 h-8 text-xs"
                  />
                </div>

                {selectedNode.type === "action" && (
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">
                      Message Content
                    </label>
                    <Textarea
                      placeholder="Enter email/sms content..."
                      className="mt-1 text-xs"
                      rows={5}
                      value={(selectedNode.data.content as string) || ""}
                      onChange={(e: any) => {
                        const newContent = e.target.value;
                        setNodes((nds) =>
                          nds.map((n) =>
                            n.id === selectedNode.id
                              ? {
                                  ...n,
                                  data: { ...n.data, content: newContent },
                                }
                              : n,
                          ),
                        );
                        setSelectedNode((prev) =>
                          prev
                            ? {
                                ...prev,
                                data: { ...prev.data, content: newContent },
                              }
                            : null,
                        );
                      }}
                    />
                  </div>
                )}

                {selectedNode.type === "delay" && (
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">
                      Duration
                    </label>
                    <Select
                      value={selectedNode.data.duration as string}
                      onValueChange={(val: string) => {
                        setNodes((nds) =>
                          nds.map((n) =>
                            n.id === selectedNode.id
                              ? { ...n, data: { ...n.data, duration: val } }
                              : n,
                          ),
                        );
                        setSelectedNode((prev) =>
                          prev
                            ? { ...prev, data: { ...prev.data, duration: val } }
                            : null,
                        );
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs mt-1">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1 Hour">1 Hour</SelectItem>
                        <SelectItem value="1 Day">1 Day</SelectItem>
                        <SelectItem value="2 Days">2 Days</SelectItem>
                        <SelectItem value="1 Week">1 Week</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>
    </div>
  );
}
