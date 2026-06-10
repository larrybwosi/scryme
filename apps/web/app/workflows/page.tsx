'use client';

import React, { useState, useEffect } from 'react';
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
  Plus
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@repo/ui/components/ui/table';
import { Badge } from '@repo/ui/components/ui/badge';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter
} from '@repo/ui/components/ui/sheet';
import { PageHeader } from '../../components/page-header';
import { Breadcrumbs } from '../../components/breadcrumbs';
import {
  getAvailableWorkflowsAction as getAvailableWorkflows,
  provisionWorkflowAction as provisionWorkflow,
  triggerWorkflowAction as triggerWorkflow,
  getWorkflowHistoryAction as getWorkflowHistory
} from '../actions/workflows';
import { toast } from 'sonner';

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
  const [isProvisionSheetOpen, setIsProvisionSheetOpen] = useState(false);
  const [isHistorySheetOpen, setIsHistorySheetOpen] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [configValues, setConfigValues] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    setLoading(true);
    const response = await getAvailableWorkflows();
    if (response.success) {
      setWorkflows(response.data || []);
    } else {
      toast.error(response.error || 'Failed to load workflows');
    }
    setLoading(false);
  };

  const fetchHistory = async (path: string) => {
    const response = await getWorkflowHistory(path);
    if (response.success) {
      setHistory(response.data || []);
    } else {
      toast.error(response.error || 'Failed to load execution history');
    }
  };

  const handleProvision = async () => {
    if (!selectedWorkflow) return;
    setLoading(true);
    const response = await provisionWorkflow(selectedWorkflow.path, configValues);
    if (response.success) {
      toast.success('Workflow provisioned successfully');
      setIsProvisionSheetOpen(false);
      fetchWorkflows();
    } else {
      toast.error(response.error || 'Failed to provision workflow');
    }
    setLoading(false);
  };

  const handleTrigger = async (workflow: any) => {
    setIsTriggering(true);
    const response = await triggerWorkflow(workflow.path, {});
    if (response.success) {
      toast.success('Workflow execution started');
      // Briefly show history after triggering
      setSelectedWorkflow(workflow);
      fetchHistory(workflow.path);
      setIsHistorySheetOpen(true);
    } else {
      toast.error(response.error || 'Failed to trigger workflow');
    }
    setIsTriggering(false);
  };

  const filteredWorkflows = workflows.filter(w =>
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</Badge>;
      case 'FAILED':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      case 'RUNNING':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Running</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-none"><Clock className="w-3 h-3 mr-1" /> {status}</Badge>;
    }
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Automations', href: '/workflows' },
          { label: 'Workflows' },
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
          <Button variant="outline" onClick={fetchWorkflows}>
            <History className="w-4 h-4 mr-2" /> Refresh
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-[#34A853]" />
                    <p className="text-sm text-gray-500">Loading workflows...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredWorkflows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-48 text-center text-gray-500">
                  No workflows found matching your search.
                </TableCell>
              </TableRow>
            ) : (
              filteredWorkflows.map((workflow) => (
                <TableRow key={workflow.path} className="group hover:bg-gray-50/50 transition-colors">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-gray-900">{workflow.name}</div>
                        <div className="text-[11px] text-gray-400 font-mono mt-0.5">{workflow.path}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm max-w-[400px]">
                    {workflow.description}
                  </TableCell>
                  <TableCell>
                    {workflow.isProvisioned ? (
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Provisioned</Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-400 border-gray-200">Not Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {workflow.isProvisioned ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedWorkflow(workflow);
                              fetchHistory(workflow.path);
                              setIsHistorySheetOpen(true);
                            }}
                          >
                            <History className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedWorkflow(workflow);
                              // Simulate loading saved config values
                              const savedValues: Record<string, any> = {};
                              if (workflow.schema?.properties) {
                                Object.keys(workflow.schema.properties).forEach(key => {
                                  savedValues[key] = workflow.schema.properties[key].default;
                                });
                              }
                              setConfigValues(savedValues);
                              setIsProvisionSheetOpen(true);
                            }}
                          >
                            <Settings2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            className="bg-[#34A853] hover:bg-[#2d9248]"
                            onClick={() => {
                              // Use currently provisioned/default values as inputs for trigger
                              const triggerInputs: Record<string, any> = {};
                              if (workflow.schema?.properties) {
                                Object.keys(workflow.schema.properties).forEach(key => {
                                  triggerInputs[key] = workflow.schema.properties[key].default;
                                });
                              }
                              handleTrigger(workflow);
                            }}
                            disabled={isTriggering}
                          >
                            {isTriggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                            Run
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedWorkflow(workflow);
                            setConfigValues({});
                            setIsProvisionSheetOpen(true);
                          }}
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
              Configure and activate the {selectedWorkflow?.name} automation for your organization.
            </SheetDescription>
          </SheetHeader>

          <div className="py-8 space-y-6">
            {selectedWorkflow?.schema?.properties && Object.entries(selectedWorkflow.schema.properties).map(([key, prop]: [string, any]) => (
              <div key={key} className="space-y-2">
                <label className="text-sm font-medium text-gray-700">{prop.title || key}</label>
                {prop.type === 'boolean' ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-[#34A853] focus:ring-[#34A853]"
                      checked={configValues[key] ?? prop.default}
                      onChange={(e) => setConfigValues({...configValues, [key]: e.target.checked})}
                    />
                    <span className="text-sm text-gray-500">Enabled</span>
                  </div>
                ) : (
                  <Input
                    type={prop.type === 'number' ? 'number' : 'text'}
                    placeholder={prop.default?.toString()}
                    value={configValues[key] ?? ''}
                    onChange={(e) => setConfigValues({...configValues, [key]: e.target.value})}
                  />
                )}
                {prop.description && <p className="text-[11px] text-gray-400">{prop.description}</p>}
              </div>
            ))}
          </div>

          <SheetFooter>
            <Button variant="outline" onClick={() => setIsProvisionSheetOpen(false)}>Cancel</Button>
            <Button className="bg-[#34A853] hover:bg-[#2d9248]" onClick={handleProvision} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {selectedWorkflow?.isProvisioned ? 'Save Settings' : 'Activate Workflow'}
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
            {history.length === 0 ? (
              <div className="text-center py-12 text-gray-500 border-2 border-dashed rounded-xl">
                No history found for this workflow.
              </div>
            ) : (
              history.map((run) => (
                <div key={run.id} className="p-4 rounded-lg border border-gray-100 bg-gray-50/50 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="text-sm font-medium flex items-center gap-2">
                        Job: <span className="font-mono text-xs text-gray-500">{run.jobId}</span>
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
