"use client";

import { Input } from "@repo/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useState } from "react";
import {
  CalendarCheck,
  Check,
  CheckSquare,
  CookingPot,
  Plus,
  Search,
} from "lucide-react";
import {
  useTasks,
  useProjects,
  useUpdateTaskStatus,
} from "@/lib/hooks/use-projects";
import { usePermissions } from "@/lib/permissions";
import { Task } from "@/lib/api";
import { CreateTaskModal } from "@/components/CreateTaskModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PageEmpty, PageError, PageLoading } from "@/components/PageState";
import { getErrorMessage, notifyError, notifySuccess, notifyWarning } from "@/lib/feedback";
import { FOCUS_RING } from "@/lib/navigation";

function TasksPageContent() {
  const searchParams = useSearchParams();
  const notice = searchParams.get("notice");

  const { data: tasks = [], isLoading, isError, error, refetch } = useTasks();
  const { data: projects = [] } = useProjects();

  const updateTaskStatusMutation = useUpdateTaskStatus();
  const { canManageTasks } = usePermissions();

  const [scopeFilter, setScopeFilter] = useState<
    "all" | "active" | "backlog" | "completed"
  >("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [confirmingTask, setConfirmingTask] = useState<Task | null>(null);

  useEffect(() => {
    if (notice === "missing-task") {
      notifyWarning("No task was selected. Choose a task from the list.");
    }
  }, [notice]);

  const applyStatus = async (task: Task, status: Task["status"]) => {
    try {
      await updateTaskStatusMutation.mutateAsync({ taskId: task.id, status });
      notifySuccess("Status updated");
    } catch (err) {
      notifyError(err, "Could not change status");
    } finally {
      setConfirmingTask(null);
    }
  };

  const toggleTaskCompletion = (task: Task) => {
    if (!canManageTasks) return;
    const nextStatus: Task["status"] = task.status === "DONE" ? "IN_PROGRESS" : "DONE";
    if (nextStatus === "DONE") {
      setConfirmingTask(task);
      return;
    }
    void applyStatus(task, nextStatus);
  };

  const filteredTasks = tasks.filter((task) => {
    if (
      scopeFilter === "active" &&
      (task.status === "DONE" || task.status === "BACKLOG" || task.status === "CANCELED")
    )
      return false;
    if (scopeFilter === "backlog" && task.status !== "BACKLOG") return false;
    if (scopeFilter === "completed" && task.status !== "DONE") return false;
    if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
    if (selectedProjectId !== "all" && task.projectId !== selectedProjectId) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchKey = task.taskKey?.toLowerCase().includes(q) || false;
      return matchTitle || matchKey;
    }

    return true;
  });

  return (
    <div className="flex w-full flex-col text-on-surface">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex flex-col justify-between gap-4 border-b border-outline-variant/60 pb-4 sm:flex-row sm:items-center">
          <div>
            <h1
              data-route-heading
              tabIndex={-1}
              className="font-headline-lg text-headline-lg font-semibold tracking-tight text-on-surface outline-none"
            >
              Enterprise Tasks & Issues
            </h1>
            <p className="mt-1 font-body-sm text-body-sm text-outline">
              Cross system work items, workload allocation, and SLA tracking.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {canManageTasks ? (
              <button
                type="button"
                onClick={() => setIsNewTaskOpen(true)}
                className={`flex h-8 items-center gap-1.5 rounded-sm bg-primary-container px-space-md font-headline-sm text-body-sm text-on-primary-container shadow-sm transition-colors hover:bg-primary-container/90 ${FOCUS_RING}`}
              >
                <Plus className="h-4 w-4" aria-hidden />
                <span>New Issue</span>
              </button>
            ) : (
              <span className="px-2 font-body-sm text-[11px] text-outline">
                Read only access
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-outline-variant/60 bg-surface-container-low p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-sm border border-outline-variant/60 bg-surface-container p-0.5 font-body-sm">
              {[
                { key: "all", label: "All" },
                { key: "active", label: "Active" },
                { key: "backlog", label: "Backlog" },
                { key: "completed", label: "Done" },
              ].map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() =>
                    setScopeFilter(option.key as typeof scopeFilter)
                  }
                  aria-pressed={scopeFilter === option.key}
                  className={`rounded-sm px-3 py-1 font-body-sm font-medium transition-colors ${FOCUS_RING} ${
                    scopeFilter === option.key
                      ? "bg-surface-container-high text-on-surface"
                      : "text-outline hover:text-on-surface"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger aria-label="Project filter" className="h-8 bg-surface-container border-outline-variant text-on-surface text-body-sm">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent className="bg-surface-container border-outline-variant text-on-surface">
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger aria-label="Priority filter" className="h-8 bg-surface-container border-outline-variant text-on-surface text-body-sm">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent className="bg-surface-container border-outline-variant text-on-surface">
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="relative w-full sm:w-64">
            <Search
              className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
              aria-hidden
            />
            <Input
              type="text"
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-8 w-full bg-surface-container pl-8 pr-3 text-body-sm text-on-surface border-outline-variant placeholder:text-outline focus-visible:border-primary"
            />
          </div>
        </div>

        <CreateTaskModal
          isOpen={isNewTaskOpen}
          onClose={() => setIsNewTaskOpen(false)}
          defaultProjectId={
            selectedProjectId !== "all" ? selectedProjectId : undefined
          }
        />

        {isLoading && <PageLoading label="Loading tasks" />}

        {!isLoading && isError && (
          <PageError
            message={getErrorMessage(error, "Could not load tasks")}
            onRetry={() => refetch()}
            backHref="/projects"
            backLabel="Back to projects"
          />
        )}

        {!isLoading && !isError && filteredTasks.length === 0 && (
          <PageEmpty
            icon={CheckSquare}
            title={tasks.length === 0 ? "No tasks yet" : "No tasks match these filters"}
            description={
              tasks.length === 0
                ? "Create the first task to start tracking work in this workspace."
                : "Adjust the scope, project, priority, or search filters to find work."
            }
            action={
              canManageTasks ? (
                <button
                  type="button"
                  onClick={() => setIsNewTaskOpen(true)}
                  className={`inline-flex h-8 items-center gap-1.5 rounded-sm bg-primary-container px-3 font-headline-sm text-body-sm text-on-primary-container transition-colors hover:bg-primary-container/90 ${FOCUS_RING}`}
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  Create task
                </button>
              ) : undefined
            }
          />
        )}

        {!isLoading && !isError && filteredTasks.length > 0 && (
          <div className="w-full overflow-hidden rounded-md border border-outline-variant/60 bg-surface-container-low shadow-sm">
            <div className="flex items-center justify-between border-b border-outline-variant/60 bg-surface-container-high/40 px-4 py-3 font-label-badge text-[11px] uppercase tracking-wider text-outline">
              <div className="flex items-center gap-3">
                <span className="w-4" />
                <span>Issue</span>
              </div>
              <div className="flex items-center gap-8">
                <span className="w-24 text-center">Status</span>
                <span className="w-20 text-center">Priority</span>
                <span className="w-28 text-right">Assignee</span>
              </div>
            </div>

            <div className="divide-y divide-outline-variant/40">
              {filteredTasks.map((task) => {
                const isCompleted = task.status === "DONE";
                return (
                  <div
                    key={task.id}
                    className={`group flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-surface-container ${
                      isCompleted ? "bg-surface-container-lowest/50 opacity-60" : ""
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3 pr-4">
                      <button
                        type="button"
                        onClick={() => toggleTaskCompletion(task)}
                        disabled={!canManageTasks}
                        aria-label={
                          isCompleted
                            ? `Reopen ${task.title}`
                            : `Mark ${task.title} done`
                        }
                        className={`flex h-4 w-4 items-center justify-center rounded-sm border transition-colors ${FOCUS_RING} ${
                          isCompleted
                            ? "border-primary-container bg-primary-container text-on-primary-container"
                            : "border-outline-variant bg-surface-container group-hover:border-outline"
                        } ${!canManageTasks ? "cursor-default opacity-50" : "cursor-pointer"}`}
                      >
                        {isCompleted && <Check className="h-3.5 w-3.5" aria-hidden />}
                      </button>
                      <Link
                        href={`/tasks/${task.id}`}
                        className={`shrink-0 font-label-code text-label-code text-outline transition-colors group-hover:text-primary ${FOCUS_RING}`}
                      >
                        {task.taskKey || task.id.slice(-6).toUpperCase()}
                      </Link>
                      <Link
                        href={`/tasks/${task.id}`}
                        className={`truncate font-body-md text-body-md transition-colors group-hover:text-primary ${FOCUS_RING} ${
                          isCompleted ? "text-outline line-through" : "text-on-surface"
                        }`}
                      >
                        {task.title}
                      </Link>
                      {task.bookingId && (
                        <span
                          className="inline-flex shrink-0 items-center gap-1 rounded-sm border border-primary/20 bg-primary/10 px-1.5 py-0.5 font-label-code text-[10px] text-primary"
                          title="Linked to customer service booking"
                        >
                          <CalendarCheck className="h-3 w-3" aria-hidden />
                          Booking
                        </span>
                      )}
                      {task.batches && task.batches.length > 0 && (
                        <span
                          className="inline-flex shrink-0 items-center gap-1 rounded-sm border border-status-warning/20 bg-status-warning/10 px-1.5 py-0.5 font-label-code text-[10px] text-status-warning"
                          title="Linked to production batch"
                        >
                          <CookingPot className="h-3 w-3" aria-hidden />
                          Batch {task.batches[0].batchNumber}
                        </span>
                      )}
                      {task.labels && task.labels.length > 0 && (
                        <div className="flex shrink-0 items-center gap-1">
                          {task.labels.slice(0, 2).map((label, index) => {
                            const color = label.label?.color || "var(--color-outline)";
                            return (
                              <span
                                key={label.label?.id || index}
                                className="rounded-sm border px-1.5 py-0.5 text-[9px] font-medium"
                                style={{
                                  borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
                                  color,
                                  backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
                                }}
                              >
                                {label.label?.name}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-8">
                      <div className="flex w-24 justify-center">
                        <span className="rounded-sm bg-surface-container-high px-2 py-0.5 font-label-code text-[11px] text-on-surface-variant">
                          {task.status}
                        </span>
                      </div>
                      <div className="flex w-20 justify-center">
                        <span
                          className={`rounded-sm px-1.5 py-0.5 font-label-badge text-[10px] uppercase ${
                            task.priority === "URGENT"
                              ? "bg-status-critical/15 text-status-critical"
                              : task.priority === "HIGH"
                                ? "bg-status-warning/15 text-status-warning"
                                : task.priority === "MEDIUM"
                                  ? "bg-primary-container/20 text-primary"
                                  : "bg-surface-container text-outline"
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>
                      <div className="flex w-32 items-center justify-end gap-1">
                        {task.assignees && task.assignees.length > 0 ? (
                          <div className="flex -space-x-1.5 items-center">
                            {task.assignees.slice(0, 3).map((assignee, index) => (
                              <div
                                key={assignee.id || index}
                                title={`${assignee.member?.user?.name || "Assignee"} ${assignee.isPrimary ? "(Lead)" : "(Contributor)"}`}
                                className={`flex h-5 w-5 items-center justify-center rounded-full border border-surface text-[10px] font-bold ${
                                  assignee.isPrimary
                                    ? "bg-primary-container text-on-primary-container"
                                    : "bg-surface-container-highest text-on-surface"
                                }`}
                              >
                                {assignee.member?.user?.name?.charAt(0) || "U"}
                              </div>
                            ))}
                            {task.assignees.length > 3 && (
                              <div className="flex h-5 w-5 items-center justify-center rounded-full border border-surface bg-surface-container-high text-[9px] font-medium text-outline">
                                +{task.assignees.length - 3}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-outline">Unassigned</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(confirmingTask)}
        title="Mark task done?"
        description={
          confirmingTask
            ? `"${confirmingTask.title}" will move to Done. You can reopen it later if needed.`
            : ""
        }
        confirmLabel="Mark done"
        pending={updateTaskStatusMutation.isPending}
        onCancel={() => setConfirmingTask(null)}
        onConfirm={() => {
          if (confirmingTask) void applyStatus(confirmingTask, "DONE");
        }}
      />
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<PageLoading label="Loading tasks" />}>
      <TasksPageContent />
    </Suspense>
  );
}
