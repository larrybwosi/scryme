"use client";

import React, { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import {
  Plus,
  GitBranch,
  Play,
  Pause,
  MoreVertical,
  Settings2,
  Trash2,
  Calendar,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { getWorkflows, updateWorkflow } from "@/app/actions/campaigns";
import { toast } from "sonner";
import Link from "next/link";
import { WorkflowForm } from "./workflow-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/ui/dialog";
import { useRouter } from "next/navigation";

interface WorkflowsViewProps {
  organizationId: string;
}

export function WorkflowsView({ organizationId }: WorkflowsViewProps) {
  const router = useRouter();
  const { mutate: globalMutate } = useSWRConfig();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [updatingWorkflowId, setUpdatingWorkflowId] = useState<string | null>(
    null,
  );

  // Use SWR for data fetching
  const {
    data: workflows = [],
    error,
    isLoading,
    mutate,
  } = useSWR(
    ["workflows", organizationId],
    () => getWorkflows(organizationId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute
    },
  );

  const toggleWorkflowStatus = async (id: string, currentStatus: boolean) => {
    try {
      setUpdatingWorkflowId(id);

      // Optimistic update
      const updatedWorkflows = workflows.map((workflow: any) =>
        workflow.id === id
          ? { ...workflow, isActive: !currentStatus }
          : workflow,
      );

      // Update UI immediately
      mutate(updatedWorkflows, false);

      // Make API call
      const result = await updateWorkflow(id, { isActive: !currentStatus });

      if (result.success) {
        toast.success(`Workflow ${!currentStatus ? "activated" : "paused"}`);
        // Revalidate to ensure data consistency
        mutate();
      } else {
        // Revert on error
        mutate();
        toast.error("Failed to update workflow status");
      }
    } catch (error) {
      // Revert on error
      mutate();
      toast.error("Failed to update workflow status");
    } finally {
      setUpdatingWorkflowId(null);
    }
  };

  const handleWorkflowCreated = (id: string) => {
    setIsDialogOpen(false);
    mutate(); // Re-fetch workflows data
    router.push(`/campaigns/workflows/${id}`);
  };

  if (error) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-red-600">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Error loading workflows
              </h3>
              <p className="text-muted-foreground">
                Failed to load automation workflows. Please try again later.
              </p>
              <Button onClick={() => mutate()} className="mt-4">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Automation Workflows
          </h1>
          <p className="text-muted-foreground">
            Build visual customer journeys and automated sequences.
          </p>
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
              onSuccess={handleWorkflowCreated}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">Loading workflows...</p>
            </div>
          </div>
        ) : workflows.length === 0 ? (
          <Card className="col-span-full py-12 flex flex-col items-center justify-center text-center">
            <GitBranch className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <CardTitle>No workflows yet</CardTitle>
            <CardDescription className="mt-2 max-w-sm">
              Start building your first automation to engage customers at the
              right time.
            </CardDescription>
            <Button variant="outline" className="mt-6">
              Get Started with a Template
            </Button>
          </Card>
        ) : (
          workflows.map((workflow: any) => (
            <Card
              key={workflow.id}
              className="overflow-hidden hover:shadow-md transition-shadow relative"
            >
              {updatingWorkflowId === workflow.id && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <GitBranch className="h-5 w-5 text-slate-600" />
                  </div>
                  <Badge variant={workflow.isActive ? "default" : "secondary"}>
                    {workflow.isActive ? "Active" : "Paused"}
                  </Badge>
                </div>
                <Link href={`/campaigns/workflows/${workflow.id}`}>
                  <CardTitle className="mt-4 hover:text-primary cursor-pointer">
                    {workflow.name}
                  </CardTitle>
                </Link>
                <CardDescription>
                  Created {new Date(workflow.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-6">
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-3.5 w-3.5" />
                    Last run:{" "}
                    {workflow.lastRunAt
                      ? new Date(workflow.lastRunAt).toLocaleDateString()
                      : "Never"}
                  </div>
                  {workflow.entryCount > 0 && (
                    <div className="flex items-center">
                      <GitBranch className="mr-1 h-3.5 w-3.5" />
                      {workflow.entryCount} entries
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center pt-4 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      toggleWorkflowStatus(workflow.id, workflow.isActive)
                    }
                    disabled={updatingWorkflowId === workflow.id}
                  >
                    {workflow.isActive ? (
                      <>
                        <Pause className="mr-2 h-3.5 w-3.5" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-3.5 w-3.5 text-green-600" />{" "}
                        Activate
                      </>
                    )}
                  </Button>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        router.push(
                          `/campaigns/workflows/${workflow.id}/settings`,
                        )
                      }
                    >
                      <Settings2 className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            /* Duplicate logic */
                          }}
                        >
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(
                              `/campaigns/workflows/${workflow.id}/logs`,
                            )
                          }
                        >
                          View Logs
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            /* Delete logic */
                          }}
                        >
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
