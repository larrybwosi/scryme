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
  ArrowDown,
  ArrowUp,
  Bell,
  Box,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Code2,
  Copy,
  Database,
  FileText,
  GitBranch,
  History,
  LayoutTemplate,
  MoreHorizontal,
  Play,
  Plus,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Timer,
  Trash2,
  Webhook,
  X,
  Zap,
} from "lucide-react";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";
import { Separator } from "@repo/ui/components/ui/separator";
import { Switch } from "@repo/ui/components/ui/switch";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@repo/ui/lib/utils";

interface Workflow {
  path: string;
  name: string;
  description: string;
  isProvisioned: boolean;
  settings?: Record<string, any>;
  schema?: { properties?: Record<string, any> };
}

type StudioNodeData = { label: string; subtitle: string; kind: string; icon: string; color: string; description?: string; config?: Record<string, any> };
type StudioNode = Node<StudioNodeData>;

const fetcher = (url: string) => fetch(url).then((res) => res.json()).then((json) => json.data || []);

const palette = [
  { kind: "trigger", label: "Event trigger", subtitle: "Start a workflow", icon: "webhook", color: "cyan", description: "Listen for an event from your connected systems." },
  { kind: "action", label: "Send email", subtitle: "Communication", icon: "mail", color: "violet", description: "Send a transactional or campaign email." },
  { kind: "action", label: "HTTP request", subtitle: "Integrations", icon: "code", color: "amber", description: "Call any internal or external API." },
  { kind: "logic", label: "Branch", subtitle: "Logic", icon: "branch", color: "emerald", description: "Route execution based on conditions." },
  { kind: "delay", label: "Wait", subtitle: "Timing", icon: "timer", color: "blue", description: "Pause execution until a future time." },
  { kind: "action", label: "Update record", subtitle: "Data", icon: "database", color: "pink", description: "Create or update a record in your workspace." },
];

function Icon({ name }: { name: string }) {
  const props = { "aria-hidden": true, size: 16 } as const;
  if (name === "webhook") return <Webhook {...props} />;
  if (name === "mail") return <Bell {...props} />;
  if (name === "code") return <Code2 {...props} />;
  if (name === "branch") return <GitBranch {...props} />;
  if (name === "timer") return <Timer {...props} />;
  return <Database {...props} />;
}

function WorkflowNode({ data, selected }: NodeProps<StudioNode>) {
  return (
    <div className={cn("w-56 rounded-xl border bg-card shadow-xl transition-all", selected ? "border-primary ring-2 ring-primary/20" : "border-border")}>
      <div className={cn("flex items-center gap-3 border-b px-3 py-3", `node-accent-${data.color}`)}>
        <span className="flex size-8 items-center justify-center rounded-lg bg-background/80 text-foreground"><Icon name={data.icon} /></span>
        <div className="min-w-0"><p className="truncate text-sm font-semibold">{data.label}</p><p className="text-[11px] text-muted-foreground">{data.subtitle}</p></div>
        <MoreHorizontal className="ml-auto text-muted-foreground" size={15} />
      </div>
      <div className="px-3 py-3 text-xs leading-5 text-muted-foreground">{data.description}</div>
      <div className="flex items-center justify-between border-t px-3 py-2 text-[10px] text-muted-foreground"><span>Configured</span><span className="size-1.5 rounded-full bg-emerald-500" /></div>
    </div>
  );
}

const nodeTypes = { studio: WorkflowNode };

function initialGraph(workflow?: Workflow) {
  const saved = workflow?.settings?.studio;
  if (saved?.nodes?.length) return saved;
  const nodes: StudioNode[] = [
    { id: "trigger", type: "studio", position: { x: 80, y: 160 }, data: palette[0] },
    { id: "action", type: "studio", position: { x: 390, y: 160 }, data: palette[1] },
    { id: "branch", type: "studio", position: { x: 700, y: 160 }, data: palette[3] },
  ];
  const edges: Edge[] = [{ id: "trigger-action", source: "trigger", target: "action", animated: true }, { id: "action-branch", source: "action", target: "branch" }];
  return { nodes, edges };
}

export default function WorkflowsPage() {
  const { data: workflows = [], mutate, isLoading } = useSWR<Workflow[]>("/api/workflows/available", fetcher, { revalidateOnFocus: false });
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const selectedWorkflow = workflows.find((item) => item.path === selectedPath) || workflows[0];
  const graph = useMemo(() => initialGraph(selectedWorkflow), [selectedWorkflow]);
  const [nodes, setNodes, onNodesChange] = useNodesState<StudioNode>(graph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges);
  const [activeTab, setActiveTab] = useState("canvas");
  const [inspectorTab, setInspectorTab] = useState("settings");
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>("action");
  const [testMode, setTestMode] = useState(false);

  const filtered = workflows.filter((item) => `${item.name} ${item.description}`.toLowerCase().includes(search.toLowerCase()));
  const activeNode = nodes.find((node) => node.id === selectedNode);

  useEffect(() => {
    if (!selectedPath && workflows[0]) setSelectedPath(workflows[0].path);
  }, [selectedPath, workflows]);

  useEffect(() => {
    if (graph.nodes.length && nodes.length === 0) {
      setNodes(graph.nodes);
      setEdges(graph.edges);
    }
  }, [graph, nodes.length, setEdges, setNodes]);

  const selectWorkflow = (path: string) => {
    setSelectedPath(path);
    const next = initialGraph(workflows.find((item) => item.path === path));
    setNodes(next.nodes);
    setEdges(next.edges);
  };

  const onConnect = (connection: Connection) => setEdges((items) => addEdge({ ...connection, animated: true }, items));
  const addNode = (item: (typeof palette)[number]) => {
    const id = `${item.kind}-${Date.now()}`;
    const node: StudioNode = { id, type: "studio", position: { x: 280 + nodes.length * 24, y: 320 + (nodes.length % 2) * 80 }, data: item };
    setNodes((items) => [...items, node]);
    setSelectedNode(id);
    toast.success(`${item.label} added to workflow`);
  };

  const saveWorkflow = async (activate = false) => {
    if (!selectedWorkflow) return;
    setIsSaving(true);
    try {
      const response = await fetch("/api/workflows/provision", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: selectedWorkflow.path, settings: { ...(selectedWorkflow.settings || {}), enabled: activate || selectedWorkflow.settings?.enabled !== false, studio: { nodes, edges } } }) });
      if (!response.ok) throw new Error("Unable to save workflow");
      await mutate();
      toast.success(activate ? "Workflow activated" : "Workflow saved");
    } catch { toast.error("Could not save workflow"); } finally { setIsSaving(false); }
  };

  const runWorkflow = async () => {
    if (!selectedWorkflow) return;
    const response = await fetch("/api/workflows/trigger", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: selectedWorkflow.path, inputs: { source: "studio" } }) });
    if (response.ok) toast.success("Test run started"); else toast.error("Test run failed");
  };

  return (
    <ReactFlowProvider>
      <main className="workflow-studio flex h-[calc(100vh-4rem)] min-h-[680px] flex-col overflow-hidden bg-background text-foreground">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/80 px-5 backdrop-blur">
          <div className="flex min-w-0 items-center gap-4"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Zap className="text-primary" size={18} /><span>Automations</span><ChevronRight size={14} /></div><div className="min-w-0"><h1 className="truncate text-sm font-semibold">{selectedWorkflow?.name || "Workflow studio"}</h1><p className="text-[11px] text-muted-foreground">{selectedWorkflow?.isProvisioned ? "Published workflow" : "Draft workflow"} <span className="mx-1">·</span> Last edited just now</p></div><Badge variant="outline" className="hidden gap-1 border-emerald-500/30 text-emerald-500 md:flex"><span className="size-1.5 rounded-full bg-emerald-500" /> Production</Badge></div>
          <div className="flex items-center gap-2"><Button variant="ghost" size="sm" onClick={() => setActiveTab("history")}><History data-icon="inline-start" /> Runs</Button><Button variant="outline" size="sm" onClick={() => saveWorkflow()} disabled={isSaving}><Save data-icon="inline-start" /> {isSaving ? "Saving" : "Save"}</Button><Button size="sm" onClick={() => saveWorkflow(true)}><Play data-icon="inline-start" /> Publish</Button><Button variant="ghost" size="icon"><MoreHorizontal /></Button></div>
        </header>

        <div className="flex min-h-0 flex-1">
          <aside className="flex w-72 shrink-0 flex-col border-r border-border bg-card/50">
            <div className="border-b p-4"><div className="mb-3 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Workflow library</p><p className="mt-1 text-xs text-muted-foreground">{workflows.length} workflows</p></div><Button variant="outline" size="icon" className="size-8"><Plus /></Button></div><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search workflows" className="h-9 pl-9" /></div></div>
            <div className="flex-1 overflow-y-auto p-2">{isLoading ? <div className="p-4 text-xs text-muted-foreground">Loading workflows...</div> : filtered.map((workflow) => <button key={workflow.path} onClick={() => selectWorkflow(workflow.path)} className={cn("mb-1 flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-accent", workflow.path === selectedWorkflow?.path && "bg-accent ring-1 ring-primary/20")}><span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Zap size={15} /></span><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="truncate text-sm font-medium">{workflow.name}</span>{workflow.isProvisioned && <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />}</span><span className="mt-1 block truncate text-[11px] text-muted-foreground">{workflow.description}</span></span></button>)}</div>
            <div className="border-t p-3"><Button variant="outline" className="w-full justify-start gap-2 text-xs"><LayoutTemplate /> Start from template <ChevronDown className="ml-auto" /></Button></div>
          </aside>

          <section className="flex min-w-0 flex-1 flex-col bg-muted/20">
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card/50 px-4"><div className="flex items-center gap-1 rounded-lg bg-muted p-1"><button onClick={() => setActiveTab("canvas")} className={cn("rounded-md px-3 py-1.5 text-xs font-medium", activeTab === "canvas" && "bg-background shadow-sm")}>Canvas</button><button onClick={() => setActiveTab("history")} className={cn("rounded-md px-3 py-1.5 text-xs font-medium", activeTab === "history" && "bg-background shadow-sm")}>Run history</button><button onClick={() => setActiveTab("logs")} className={cn("rounded-md px-3 py-1.5 text-xs font-medium", activeTab === "logs" && "bg-background shadow-sm")}>Logs</button></div><div className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck size={14} className="text-emerald-500" /> All changes are versioned <Separator orientation="vertical" className="h-4" /><Button variant="ghost" size="sm" onClick={() => setTestMode(!testMode)}><Play data-icon="inline-start" /> {testMode ? "Exit test mode" : "Test workflow"}</Button></div></div>
              {activeTab === "canvas" ? <div className="relative min-h-0 flex-1"><ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} nodeTypes={nodeTypes} onNodeClick={(_, node) => setSelectedNode(node.id)} fitView proOptions={{ hideAttribution: true }}><Background gap={24} size={1} /><Controls /><MiniMap pannable zoomable className="!bg-card" /></ReactFlow>{testMode && <div className="absolute left-1/2 top-4 flex -translate-x-1/2 items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs text-primary shadow-lg"><Activity size={14} /> Test mode enabled <Button size="sm" className="ml-2 h-6" onClick={runWorkflow}>Run now</Button></div>}</div> : <div className="flex-1 overflow-y-auto p-8"><Card className="mx-auto max-w-3xl"><CardHeader><CardTitle className="flex items-center gap-2">{activeTab === "history" ? <History /> : <FileText />} {activeTab === "history" ? "Execution history" : "Workflow logs"}</CardTitle></CardHeader><CardContent><div className="flex items-center gap-3 border-b py-4"><span className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500"><Check /></span><div className="flex-1"><p className="text-sm font-medium">Workflow ready</p><p className="text-xs text-muted-foreground">No recent failures. Your workflow is operating normally.</p></div><Badge variant="secondary">Just now</Badge></div><div className="flex items-center gap-3 py-4"><span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary"><Play /></span><div className="flex-1"><p className="text-sm font-medium">Manual test run</p><p className="text-xs text-muted-foreground">Triggered from Workflow Studio</p></div><Badge variant="outline">Completed</Badge></div></CardContent></Card></div>}
          </section>

          <aside className="flex w-80 shrink-0 flex-col border-l border-border bg-card/70"><div className="flex h-12 items-center justify-between border-b px-4"><div className="flex items-center gap-2 text-sm font-semibold"><Settings2 size={16} /> Inspector</div><Button variant="ghost" size="icon" className="size-7"><X /></Button></div><div className="flex border-b px-2"><button onClick={() => setInspectorTab("settings")} className={cn("border-b-2 px-3 py-3 text-xs font-medium", inspectorTab === "settings" ? "border-primary text-foreground" : "border-transparent text-muted-foreground")}>Settings</button><button onClick={() => setInspectorTab("governance")} className={cn("border-b-2 px-3 py-3 text-xs font-medium", inspectorTab === "governance" ? "border-primary text-foreground" : "border-transparent text-muted-foreground")}>Governance</button></div><div className="flex-1 overflow-y-auto p-4">{inspectorTab === "governance" ? <div className="flex flex-col gap-5"><div><p className="text-sm font-semibold">Enterprise controls</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Keep your automation compliant and production-safe.</p></div>{[{ label: "Require approval to publish", value: true }, { label: "Audit every execution", value: true }, { label: "Allow manual runs", value: true }, { label: "PII redaction", value: false }].map((item) => <div key={item.label} className="flex items-center justify-between gap-3"><span className="text-xs">{item.label}</span><Switch defaultChecked={item.value} /></div>)}<Separator /><div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3"><div className="flex gap-2"><AlertTriangle className="shrink-0 text-amber-500" size={15} /><p className="text-xs leading-5 text-muted-foreground">Changes are captured in the audit log and are visible to workspace administrators.</p></div></div></div> : activeNode ? <div className="flex flex-col gap-5"><div><div className="mb-3 flex items-center gap-3"><span className={cn("flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary")}><Icon name={activeNode.data.icon} /></span><div><p className="text-sm font-semibold">{activeNode.data.label}</p><p className="text-xs text-muted-foreground">{activeNode.data.subtitle}</p></div></div><Textarea defaultValue={activeNode.data.description} className="min-h-20 text-xs" /></div><Separator /><div><p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Configuration</p><div className="flex flex-col gap-3"><label className="text-xs text-muted-foreground">Step name<Input defaultValue={activeNode.data.label} className="mt-1 h-9 text-xs" /></label><label className="text-xs text-muted-foreground">Execution mode<div className="mt-1 flex items-center justify-between rounded-md border px-3 py-2 text-xs"><span>Run once</span><ChevronDown size={14} /></div></label><label className="text-xs text-muted-foreground">On failure<div className="mt-1 flex items-center justify-between rounded-md border px-3 py-2 text-xs"><span>Retry with backoff</span><ChevronDown size={14} /></div></label></div></div><Separator /><div><p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Advanced</p><div className="flex flex-col gap-3"><Button variant="outline" size="sm" className="justify-start gap-2"><Code2 /> View JSON config</Button><Button variant="outline" size="sm" className="justify-start gap-2"><Copy /> Duplicate step</Button><Button variant="ghost" size="sm" className="justify-start gap-2 text-destructive hover:text-destructive" onClick={() => { setNodes((items) => items.filter((node) => node.id !== activeNode.id)); setSelectedNode(null); }}><Trash2 /> Delete step</Button></div></div></div> : <div className="flex flex-col items-center gap-3 py-16 text-center"><Sparkles className="text-primary" /><p className="text-sm font-medium">Select a step</p><p className="text-xs leading-5 text-muted-foreground">Click any node on the canvas to configure it.</p></div>}</div><div className="border-t p-3"><Button className="w-full" onClick={() => saveWorkflow()} disabled={isSaving}><Save data-icon="inline-start" /> Save changes</Button></div></aside>
        </div>
      </main>
    </ReactFlowProvider>
  );
}

// Keep the studio canvas intentionally compact and high contrast in dark mode.
// The accent classes map node categories to semantic, low-noise visual cues.
