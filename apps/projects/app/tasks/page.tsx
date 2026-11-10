"use client";

import { Input } from "@repo/ui/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select";
import Link from "next/link";
import React, { useState } from "react";
import { Plus, Search, CheckSquare, Check } from "lucide-react";
import {
  useTasks,
  useProjects,
  useUpdateTaskStatus,
} from "@/lib/hooks/use-projects";
import { usePermissions } from "@/lib/permissions";
import { Task } from "@/lib/api";
import { CreateTaskModal } from "@/components/CreateTaskModal";

export default function TasksPage() {
  const { data: tasks = [], isLoading } = useTasks();
  const { data: projects = [] } = useProjects();

  const updateTaskStatusMutation = useUpdateTaskStatus();
  const { canManageTasks } = usePermissions();

  const [scopeFilter, setScopeFilter] = useState<"all" | "active" | "backlog" | "completed">("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Create Task Modal State
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);

  const toggleTaskCompletion = (task: Task) => {
    if (!canManageTasks) return;
    const nextStatus: Task["status"] = task.status === "DONE" ? "IN_PROGRESS" : "DONE";
    updateTaskStatusMutation.mutate({ taskId: task.id, status: nextStatus });
  };

  const filteredTasks = tasks.filter((task) => {
    if (scopeFilter === "active" && (task.status === "DONE" || task.status === "BACKLOG" || task.status === "CANCELED")) return false;
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
    <div className="flex flex-col w-full min-h-screen bg-surface text-on-surface">
      <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
              Enterprise Tasks & Issues
            </h1>
            <p className="font-body-sm text-body-sm text-outline mt-1">
              Cross-system work items, workload allocation, and SLA tracking.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {canManageTasks && (
              <button
                type="button"
                onClick={() => setIsNewTaskOpen(true)}
                className="h-8 px-space-md bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>New Issue</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-surface-container-low border border-outline-variant/30">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-md bg-surface-container p-0.5 border border-outline-variant/30 text-body-sm">
              <button
                type="button"
                onClick={() => setScopeFilter("all")}
                className={`px-3 py-1 rounded-sm text-body-sm font-medium transition-colors ${
                  scopeFilter === "all" ? "bg-surface-container-high text-on-surface" : "text-outline hover:text-on-surface"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setScopeFilter("active")}
                className={`px-3 py-1 rounded-sm text-body-sm font-medium transition-colors ${
                  scopeFilter === "active" ? "bg-surface-container-high text-on-surface" : "text-outline hover:text-on-surface"
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setScopeFilter("backlog")}
                className={`px-3 py-1 rounded-sm text-body-sm font-medium transition-colors ${
                  scopeFilter === "backlog" ? "bg-surface-container-high text-on-surface" : "text-outline hover:text-on-surface"
                }`}
              >
                Backlog
              </button>
              <button
                type="button"
                onClick={() => setScopeFilter("completed")}
                className={`px-3 py-1 rounded-sm text-body-sm font-medium transition-colors ${
                  scopeFilter === "completed" ? "bg-surface-container-high text-on-surface" : "text-outline hover:text-on-surface"
                }`}
              >
                Done
              </button>
            </div>

            <Select value={selectedProjectId} onValueChange={(val) => setSelectedProjectId(val)}>
              <SelectTrigger className="h-8 bg-surface-container border-outline-variant text-on-surface text-body-sm">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent className="bg-surface-container border-outline-variant text-on-surface">
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={(val) => setPriorityFilter(val)}>
              <SelectTrigger className="h-8 bg-surface-container border-outline-variant text-on-surface text-body-sm">
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
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-outline h-4 w-4" />
            <Input
              type="text"
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 bg-surface-container border-outline-variant text-on-surface text-body-sm placeholder:text-outline focus-visible:border-primary-container"
            />
          </div>
        </div>

        {/* Modal: New Issue */}
        <CreateTaskModal
          isOpen={isNewTaskOpen}
          onClose={() => setIsNewTaskOpen(false)}
          defaultProjectId={selectedProjectId !== "all" ? selectedProjectId : undefined}
        />

        {/* Loading State */}
        {isLoading && (
          <div className="w-full p-8 flex justify-center text-outline text-body-sm">
            Loading tasks...
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredTasks.length === 0 && (
          <div className="p-12 rounded-lg bg-surface-container-low border border-dashed border-outline-variant/40 flex flex-col items-center justify-center text-center gap-3">
            <CheckSquare className="h-9 w-9 text-outline" />
            <div className="text-on-surface font-headline-sm text-body-md">No tasks found</div>
            <p className="text-outline text-body-sm max-w-sm">
              All caught up! Create a new task or adjust your filters.
            </p>
          </div>
        )}

        {/* Task List Table */}
        {!isLoading && filteredTasks.length > 0 && (
          <div className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-surface-container-high/40 border-b border-outline-variant/30 flex items-center justify-between text-outline text-[11px] font-label-badge uppercase tracking-wider">
              <div className="flex items-center gap-3">
                <span className="w-4"></span>
                <span>Issue</span>
              </div>
              <div className="flex items-center gap-8">
                <span className="w-24 text-center">Status</span>
                <span className="w-20 text-center">Priority</span>
                <span className="w-28 text-right">Assignee</span>
              </div>
            </div>

            <div className="divide-y divide-outline-variant/20">
              {filteredTasks.map((task) => {
                const isCompleted = task.status === "DONE";
                return (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between px-4 py-2.5 hover:bg-surface-container transition-colors group ${
                      isCompleted ? "opacity-60 bg-surface-container-lowest/50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
                      <button
                        type="button"
                        onClick={() => toggleTaskCompletion(task)}
                        disabled={!canManageTasks}
                        className={`w-4 h-4 rounded-xs border flex items-center justify-center transition-colors ${
                          isCompleted
                            ? "bg-primary-container border-primary-container text-on-primary-container"
                            : "border-outline-variant group-hover:border-outline bg-surface-container"
                        } ${!canManageTasks ? "cursor-default" : "cursor-pointer"}`}
                      >
                        {isCompleted && (
                          <Check className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <Link
                        href={`/tasks/${task.id}`}
                        className="font-label-code text-label-code text-outline group-hover:text-primary transition-colors shrink-0"
                      >
                        {task.taskKey || task.id.slice(-6).toUpperCase()}
                      </Link>
                      <Link
                        href={`/tasks/${task.id}`}
                        className={`font-body-md text-body-md truncate group-hover:text-primary transition-colors ${
                          isCompleted ? "line-through text-outline" : "text-on-surface"
                        }`}
                      >
                        {task.title}
                      </Link>
                      {task.bookingId && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-label-code bg-primary/10 text-primary border border-primary/20 shrink-0" title="Linked to customer service booking">
                          <span className="material-symbols-outlined text-[12px]">event_available</span>
                          Booking
                        </span>
                      )}
                      {task.batches && task.batches.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-label-code bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0" title="Linked to production batch">
                          <span className="material-symbols-outlined text-[12px]">cookie</span>
                          Batch {task.batches[0].batchNumber}
                        </span>
                      )}
                      {task.labels && task.labels.length > 0 && (
                        <div className="flex items-center gap-1 shrink-0">
                          {task.labels.slice(0, 2).map((l, idx) => (
                            <span
                              key={l.label?.id || idx}
                              className="px-1.5 py-0.2 rounded text-[9px] font-medium border"
                              style={{
                                borderColor: `${l.label?.color || "#6B7280"}40`,
                                color: l.label?.color || "#6B7280",
                                backgroundColor: `${l.label?.color || "#6B7280"}15`,
                              }}
                            >
                              {l.label?.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-8 shrink-0">
                      <div className="w-24 flex justify-center">
                        <span className="px-2 py-0.5 rounded text-[11px] font-label-code bg-surface-container-high text-on-surface-variant">
                          {task.status}
                        </span>
                      </div>
                      <div className="w-20 flex justify-center">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-label-badge uppercase ${
                            task.priority === "URGENT"
                              ? "bg-red-500/20 text-red-400"
                              : task.priority === "HIGH"
                              ? "bg-amber-500/20 text-amber-400"
                              : task.priority === "MEDIUM"
                              ? "bg-primary-container/20 text-primary"
                              : "bg-surface-container text-outline"
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>
                      <div className="w-32 flex items-center justify-end gap-1">
                        {task.assignees && task.assignees.length > 0 ? (
                          <div className="flex items-center -space-x-1.5">
                            {task.assignees.slice(0, 3).map((a, idx) => (
                              <div
                                key={a.id || idx}
                                title={`${a.member?.user?.name || "Assignee"} ${a.isPrimary ? "(Lead)" : "(Contributor)"}`}
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border border-surface ${
                                  a.isPrimary
                                    ? "bg-primary-container text-on-primary-container"
                                    : "bg-surface-container-highest text-on-surface"
                                }`}
                              >
                                {a.member?.user?.name?.charAt(0) || "U"}
                              </div>
                            ))}
                            {task.assignees.length > 3 && (
                              <div className="w-5 h-5 rounded-full bg-surface-container-high border border-surface text-[9px] font-medium text-outline flex items-center justify-center">
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
    </div>
  );
}
