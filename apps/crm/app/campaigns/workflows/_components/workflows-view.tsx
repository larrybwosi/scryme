'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  GitBranch,
  Play,
  Pause,
  MoreVertical,
  Settings2,
  Trash2,
  Calendar
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@repo/ui/components/ui/card';
import { Button } from '@repo/ui/components/ui/button';
import { Badge } from '@repo/ui/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { getWorkflows, updateWorkflow } from '@/app/actions/campaigns';
import { toast } from 'sonner';
import Link from 'next/link';
import { WorkflowForm } from './workflow-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@repo/ui/components/ui/dialog';
import { useRouter } from 'next/navigation';

interface WorkflowsViewProps {
  organizationId: string;
}

export function WorkflowsView({ organizationId }: WorkflowsViewProps) {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchWorkflows();
  }, [organizationId]);

  const fetchWorkflows = async () => {
    try {
      const data = await getWorkflows(organizationId);
      setWorkflows(data);
    } catch (error) {
      console.error('Error fetching workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkflowStatus = async (id: string, currentStatus: boolean) => {
    try {
      const result = await updateWorkflow(id, { isActive: !currentStatus });
      if (result.success) {
        toast.success(`Workflow ${!currentStatus ? 'activated' : 'paused'}`);
        fetchWorkflows();
      }
    } catch (error) {
      toast.error('Failed to update workflow status');
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automation Workflows</h1>
          <p className="text-muted-foreground">Build visual customer journeys and automated sequences.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create Workflow
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Workflow</DialogTitle>
            </DialogHeader>
            <WorkflowForm
              organizationId={organizationId}
              onSuccess={(id: string) => {
                setIsDialogOpen(false);
                router.push(`/campaigns/workflows/${id}`);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Loading workflows...
          </div>
        ) : workflows.length === 0 ? (
          <Card className="col-span-full py-12 flex flex-col items-center justify-center text-center">
            <GitBranch className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <CardTitle>No workflows yet</CardTitle>
            <CardDescription className="mt-2 max-w-sm">
              Start building your first automation to engage customers at the right time.
            </CardDescription>
            <Button variant="outline" className="mt-6">
              Get Started with a Template
            </Button>
          </Card>
        ) : (
          workflows.map((workflow) => (
            <Card key={workflow.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <GitBranch className="h-5 w-5 text-slate-600" />
                  </div>
                  <Badge variant={workflow.isActive ? "default" : "secondary"}>
                    {workflow.isActive ? 'Active' : 'Paused'}
                  </Badge>
                </div>
                <Link href={`/campaigns/workflows/${workflow.id}`}>
                  <CardTitle className="mt-4 hover:text-primary cursor-pointer">{workflow.name}</CardTitle>
                </Link>
                <CardDescription>
                  Created {new Date(workflow.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-6">
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-3.5 w-3.5" />
                    Last run: 2 days ago
                  </div>
                </div>
                <div className="flex justify-between items-center pt-4 border-t">
                  <Button variant="ghost" size="sm" onClick={() => toggleWorkflowStatus(workflow.id, workflow.isActive)}>
                    {workflow.isActive ? (
                      <><Pause className="mr-2 h-3.5 w-3.5" /> Pause</>
                    ) : (
                      <><Play className="mr-2 h-3.5 w-3.5 text-green-600" /> Activate</>
                    )}
                  </Button>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Settings2 className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Duplicate</DropdownMenuItem>
                        <DropdownMenuItem>View Logs</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
