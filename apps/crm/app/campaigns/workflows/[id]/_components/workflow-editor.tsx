'use client';

import React, { useCallback, useState } from 'react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@repo/ui/components/ui/card';
import { Button } from '@repo/ui/components/ui/button';
import {
  Mail,
  MessageSquare,
  Clock,
  Play,
  Save,
  ChevronLeft,
  UserPlus,
  Zap,
  MousePointer2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Custom Node Components
const TriggerNode = ({ data }: any) => (
  <Card className="min-w-[180px] border-2 border-blue-500 shadow-md">
    <div className="bg-blue-500 p-2 flex items-center gap-2 text-white rounded-t-sm">
      <Zap size={14} />
      <span className="text-xs font-bold uppercase tracking-wider">Trigger</span>
    </div>
    <CardContent className="p-3">
      <div className="text-sm font-medium">{data.label}</div>
      <div className="text-[10px] text-muted-foreground mt-1">{data.description}</div>
    </CardContent>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500" />
  </Card>
);

const ActionNode = ({ data }: any) => (
  <Card className="min-w-[180px] border-2 border-slate-200 shadow-sm hover:border-slate-400 transition-colors">
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-300" />
    <div className="p-2 border-b flex items-center gap-2 bg-slate-50">
      {data.type === 'EMAIL' && <Mail size={14} className="text-blue-500" />}
      {data.type === 'SMS' && <MessageSquare size={14} className="text-green-500" />}
      {data.type === 'TASK' && <UserPlus size={14} className="text-orange-500" />}
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Action</span>
    </div>
    <CardContent className="p-3">
      <div className="text-sm font-medium">{data.label}</div>
    </CardContent>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-slate-300" />
  </Card>
);

const DelayNode = ({ data }: any) => (
  <Card className="min-w-[150px] border-2 border-yellow-400 bg-yellow-50/30">
    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-yellow-400" />
    <div className="p-1 flex justify-center text-yellow-600">
      <Clock size={16} />
    </div>
    <CardContent className="p-2 text-center">
      <div className="text-xs font-bold text-yellow-700">{data.duration} Delay</div>
    </CardContent>
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-yellow-400" />
  </Card>
);

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  delay: DelayNode,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'trigger',
    data: { label: 'New Customer Created', description: 'Triggers when a new customer is added to CRM' },
    position: { x: 250, y: 50 },
  },
];

const initialEdges: Edge[] = [];

interface WorkflowEditorProps {
  workflowId: string;
  organizationId: string;
}

export function WorkflowEditor({ workflowId, organizationId }: WorkflowEditorProps) {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onSave = useCallback(() => {
    toast.success('Workflow saved successfully');
  }, [nodes, edges]);

  const addAction = (type: string, label: string) => {
    const newNode: Node = {
      id: `${nodes.length + 1}`,
      type: 'action',
      data: { type, label },
      position: { x: 250, y: nodes[nodes.length - 1].position.y + 150 },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const addDelay = () => {
    const newNode: Node = {
      id: `${nodes.length + 1}`,
      type: 'delay',
      data: { duration: '2 Days' },
      position: { x: 250, y: nodes[nodes.length - 1].position.y + 150 },
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
            <h1 className="font-bold text-lg">Welcome Sequence Workflow</h1>
            <p className="text-xs text-muted-foreground italic">Draft • Last saved 2 minutes ago</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onSave}>
            <Save className="mr-2 h-4 w-4" /> Save Draft
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
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
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />

          <Panel position="top-right" className="bg-white p-4 rounded-xl border shadow-xl w-64 flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
                <MousePointer2 size={14} className="text-blue-500" />
                Workflow Palette
              </h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start text-xs h-10 border-slate-200"
                  onClick={() => addAction('EMAIL', 'Send Welcome Email')}
                >
                  <Mail size={14} className="mr-2 text-blue-500" />
                  Send Email
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-xs h-10 border-slate-200"
                  onClick={() => addAction('SMS', 'Send SMS Alert')}
                >
                  <MessageSquare size={14} className="mr-2 text-green-500" />
                  Send SMS
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-xs h-10 border-slate-200"
                  onClick={() => addAction('TASK', 'Create Follow-up Task')}
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
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Editor Info</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Drag and drop nodes to organize the journey. Connect ports to define the sequence.
              </p>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}
