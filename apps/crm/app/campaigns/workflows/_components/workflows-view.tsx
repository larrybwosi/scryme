"use client";

import React, { useMemo, useState } from "react";
import useSWR from "swr";
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
  Search,
  Activity,
  PauseCircle,
} from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/ui/alert-dialog";
import {
  getWorkflows,
  updateWorkflow,
  deleteWorkflow,
  duplicateWorkflow,
} from "@/app/actions/campaigns";
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

type StatusFilter = "all" | "live" | "draft";

function WorkflowStatusDot({ isActive }: { isActive: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          isActive ? "bg-green-500 animate-pulse" : "bg-muted-foreground/40",
        )}
      />
      <span
        className={cn(
          "text-[11.5px] font-medium",
          isActive
            ? "text-green-600 dark:text-green-400"
            : "text-muted-foreground",
        )}
      >
        {isActive ? "Live" : "Draft"}
      </span>
    </span>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  iconColor,
  iconBg,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
          iconBg,
        )}
      >
        <Icon size={15} className={iconColor} />
      </div>
      <div className="min-w-0">
        <p className="text-[16px] font-bold text-foreground leading-tight">
          {value}
        </p>
        <p className="text-[11px] text-muted-foreground truncate">{label}</p>
      </div>
    </div>
  );
}

export function WorkflowsView({ organizationId }: WorkflowsViewProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const {
    data: workflows = [],
    error,
    isLoading,
    mutate,
  } = useSWR(
    ["workflows", organizationId],
    () => getWorkflows(),
    { revalidateOnFocus: false, dedupingInterval: 30000 },
  );

  const toggleStatus = async (id: string, current: boolean) => {
    setUpdatingId(id);
    const updated = workflows.map((w: any) =>
      w.id === id ? { ...w, isActive: !current } : w,
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

  const handleDuplicate = async (id: string) => {
    const result = await duplicateWorkflow(id);
    if (result?.success) {
      toast.success("Workflow duplicated");
      mutate();
    } else {
      toast.error("Failed to duplicate workflow");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setDeletingId(id);
    const remaining = workflows.filter((w: any) => w.id !== id);
    mutate(remaining, false);
    const result = await deleteWorkflow(id);
    if (result?.success) {
      toast.success("Workflow deleted");
      mutate();
    } else {
      mutate();
      toast.error("Failed to delete workflow");
    }
    setDeletingId(null);
    setPendingDeleteId(null);
  };

  const handleCreated = (id: string) => {
    setIsDialogOpen(false);
    mutate();
    router.push(`/campaigns/workflows/${id}`);
  };

  const activeCount = workflows.filter((w: any) => w.isActive).length;
  const draftCount = workflows.length - activeCount;
  const totalEntries = workflows.reduce(
    (sum: number, w: any) => sum + (w.entryCount || 0),
    0,
  );

  const filteredWorkflows = useMemo(() => {
    return workflows.filter((w: any) => {
      const matchesQuery =
        !query ||
        w.name?.toLowerCase().includes(query.toLowerCase()) ||
        w.description?.toLowerCase().includes(query.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "live" && w.isActive) ||
        (statusFilter === "draft" && !w.isActive);
      return matchesQuery && matchesStatus;
    });
  }, [workflows, query, statusFilter]);

  if (error) {
    return (
      <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
        <div className="px-6 pt-6">
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 flex flex-col items-center text-center">
            <AlertCircle className="h-10 w-10 text-destructive/60 mb-4" />
            <h3 className="text-[14px] font-semibold text-foreground mb-1">
              Failed to load workflows
            </h3>
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

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar bg-muted/20">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-card/70 backdrop-blur-sm px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[17px] font-bold text-foreground tracking-tight">
              Automation Workflows
            </h1>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {workflows.length} workflow{workflows.length !== 1 ? "s" : ""}{" "}
              &bull; {activeCount} live
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
      <div className="flex-1 px-6 py-6 space-y-4">
        {/* Stat strip */}
        {workflows.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MiniStat
              icon={GitBranch}
              label="Total workflows"
              value={workflows.length}
              iconColor="text-violet-600"
              iconBg="bg-violet-50 dark:bg-violet-950/30"
            />
            <MiniStat
              icon={Activity}
              label="Live"
              value={activeCount}
              iconColor="text-green-600"
              iconBg="bg-green-50 dark:bg-green-950/30"
            />
            <MiniStat
              icon={PauseCircle}
              label="Draft"
              value={draftCount}
              iconColor="text-muted-foreground"
              iconBg="bg-muted"
            />
            <MiniStat
              icon={Users}
              label="Total entries"
              value={totalEntries.toLocaleString()}
              iconColor="text-blue-600"
              iconBg="bg-blue-50 dark:bg-blue-950/30"
            />
          </div>
        )}

        {/* Search + filter */}
        {workflows.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search workflows..."
                className="h-8 pl-8 text-[12.5px]"
              />
            </div>
            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
              {(["all", "live", "draft"] as StatusFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[11.5px] font-medium capitalize transition-colors",
                    statusFilter === f
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary" />
            <p className="text-[12.5px] text-muted-foreground">
              Loading workflows...
            </p>
          </div>
        ) : workflows.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
              <GitBranch size={22} className="text-muted-foreground/50" />
            </div>
            <h3 className="text-[14px] font-semibold text-foreground mb-1">
              No workflows yet
            </h3>
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
        ) : filteredWorkflows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border flex flex-col items-center justify-center py-16 text-center">
            <Search size={22} className="text-muted-foreground/50 mb-3" />
            <h3 className="text-[14px] font-semibold text-foreground mb-1">
              No matching workflows
            </h3>
            <p className="text-[12.5px] text-muted-foreground max-w-sm leading-relaxed">
              Try a different search term or filter.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredWorkflows.map((workflow: any) => (
              <div
                key={workflow.id}
                className={cn(
                  "relative bg-card border border-border rounded-xl overflow-hidden transition-all hover:shadow-md hover:border-border/80 group",
                  (updatingId === workflow.id || deletingId === workflow.id) &&
                    "opacity-60 pointer-events-none",
                )}
              >
                {/* Top colored accent */}
                <div
                  className={cn(
                    "h-[3px] w-full",
                    workflow.isActive ? "bg-green-500" : "bg-muted",
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
                  <Link
                    href={`/campaigns/workflows/${workflow.id}`}
                    className="block group/link"
                  >
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
                          ? formatDistanceToNow(new Date(workflow.lastRunAt), {
                              addSuffix: true,
                            })
                          : "Never run"}
                      </span>
                    </div>
                    {workflow.entryCount > 0 && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users size={11} />
                        <span className="text-[11px]">
                          {workflow.entryCount} entries
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions row */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          toggleStatus(workflow.id, workflow.isActive)
                        }
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11.5px] font-medium transition-colors",
                          workflow.isActive
                            ? "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                            : "text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30",
                        )}
                      >
                        {workflow.isActive ? (
                          <>
                            <Pause size={12} /> Pause
                          </>
                        ) : (
                          <>
                            <Play size={12} /> Activate
                          </>
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
                        <DropdownMenuContent
                          align="end"
                          className="text-[12.5px]"
                        >
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/campaigns/workflows/${workflow.id}`)
                            }
                          >
                            <Settings2 size={13} className="mr-2" /> Settings
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDuplicate(workflow.id)}
                          >
                            <Copy size={13} className="mr-2" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setPendingDeleteId(workflow.id)}
                          >
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
          <WorkflowForm
            onSuccess={handleCreated}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!pendingDeleteId}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this workflow?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the workflow and stop any active
              automations tied to it. This action can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
