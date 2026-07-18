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
  Zap,
  Users,
  ArrowRight,
  Copy,
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
} from "@repo/ui/components/ui/dialog";
import { useRouter } from "next/navigation";
import { cn } from "@repo/ui/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface WorkflowsViewProps {
  organizationId: string;
}

function WorkflowStatusDot({ isActive }: { isActive: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          isActive ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/40'
        )}
      />
      <span className={cn('text-[11.5px] font-medium', isActive ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground')}>
        {isActive ? 'Live' : 'Draft'}
      </span>
    </span>
  );
}

export function WorkflowsView({ organizationId }: WorkflowsViewProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data: workflows = [], error, isLoading, mutate } = useSWR(
    ["workflows", organizationId],
    () => getWorkflows(organizationId),
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  const toggleStatus = async (id: string, current: boolean) => {
    setUpdatingId(id);
    const updated = workflows.map((w: any) =>
      w.id === id ? { ...w, isActive: !current } : w
    );
    mutate(updated, false);
    const result = await updateWorkflow(id, { isActive: !current });
    if (result.success) {
      toast.success(`Workflow ${!current ? "activated" : "paused"}`);
      mutate();
    } else {
      mutate();
      toast.error("Failed to update workflow status");
    }
    setUpdatingId(null);
  };

  const handleCreated = (id: string) => {
    setIsDialogOpen(false);
    mutate();
    router.push(`/campaigns/workflows/${id}`);
  };

  if (error) {
    return (
      <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
        <div className="px-6 pt-6">
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 flex flex-col items-center text-center">
            <AlertCircle className="h-10 w-10 text-destructive/60 mb-4" />
            <h3 className="text-[14px] font-semibold text-foreground mb-1">Failed to load workflows</h3>
            <p className="text-[12.5px] text-muted-foreground mb-4">
              There was an error fetching your automation workflows.
            </p>
            <Button size="sm" onClick={() => mutate()} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const activeCount = workflows.filter((w: any) => w.isActive).length;

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-card/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[17px] font-bold text-foreground tracking-tight">
              Automation Workflows
            </h1>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {workflows.length} workflow{workflows.length !== 1 ? 's' : ''} &bull; {activeCount} live
            </p>
          </div>
          <Button
            size="sm"
            className="h-8 gap-1.5 text-[12.5px]"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus size={13} />
            New Workflow
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary" />
            <p className="text-[12.5px] text-muted-foreground">Loading workflows...</p>
          </div>
        ) : workflows.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
              <GitBranch size={22} className="text-muted-foreground/50" />
            </div>
            <h3 className="text-[14px] font-semibold text-foreground mb-1">No workflows yet</h3>
            <p className="text-[12.5px] text-muted-foreground max-w-sm leading-relaxed">
              Build automated customer journeys triggered by CRM events.
            </p>
            <Button
              className="mt-6 gap-1.5 h-8 text-[12.5px]"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus size={13} />
              Create First Workflow
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {workflows.map((workflow: any) => (
              <div
                key={workflow.id}
                className={cn(
                  "relative bg-card border border-border rounded-xl overflow-hidden transition-all hover:shadow-md hover:border-border/80 group",
                  updatingId === workflow.id && "opacity-60 pointer-events-none"
                )}
              >
                {/* Top colored accent */}
                <div
                  className={cn(
                    "h-[3px] w-full",
                    workflow.isActive ? "bg-green-500" : "bg-muted"
                  )}
                />

                <div className="p-4">
                  {/* Icon + status */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Zap size={16} className="text-primary" />
                    </div>
                    <WorkflowStatusDot isActive={workflow.isActive} />
                  </div>

                  {/* Name + description */}
                  <Link href={`/campaigns/workflows/${workflow.id}`} className="block group/link">
                    <h3 className="text-[13.5px] font-semibold text-foreground group-hover/link:text-primary transition-colors">
                      {workflow.name}
                    </h3>
                  </Link>
                  {workflow.description && (
                    <p className="text-[11.5px] text-muted-foreground mt-1 leading-snug line-clamp-2">
                      {workflow.description}
                    </p>
                  )}

                  {/* Stats row */}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar size={11} />
                      <span className="text-[11px]">
                        {workflow.lastRunAt
                          ? formatDistanceToNow(new Date(workflow.lastRunAt), { addSuffix: true })
                          : "Never run"}
                      </span>
                    </div>
                    {workflow.entryCount > 0 && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users size={11} />
                        <span className="text-[11px]">{workflow.entryCount} entries</span>
                      </div>
                    )}
                  </div>

                  {/* Actions row */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleStatus(workflow.id, workflow.isActive)}
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11.5px] font-medium transition-colors",
                          workflow.isActive
                            ? "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                            : "text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30"
                        )}
                      >
                        {workflow.isActive ? (
                          <><Pause size={12} /> Pause</>
                        ) : (
                          <><Play size={12} /> Activate</>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <Link
                        href={`/campaigns/workflows/${workflow.id}`}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11.5px] font-medium text-primary hover:bg-primary/8 transition-colors"
                      >
                        Edit <ArrowRight size={11} />
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded-md text-muted-foreground hover:bg-accent transition-colors">
                            <MoreVertical size={13} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-[12.5px]">
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/campaigns/workflows/${workflow.id}`)
                            }
                          >
                            <Settings2 size={13} className="mr-2" /> Settings
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy size={13} className="mr-2" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive">
                            <Trash2 size={13} className="mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Create New Workflow</DialogTitle>
          </DialogHeader>
          <WorkflowForm organizationId={organizationId} onSuccess={handleCreated} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
