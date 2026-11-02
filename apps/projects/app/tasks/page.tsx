"use client";

import Link from "next/link";
import React, { useState } from "react";
import { useTasks, useProjects, useCreateTask, useUpdateTaskStatus } from "@/lib/hooks/use-projects";
import { usePermissions } from "@/lib/permissions";
import { Task } from "@/lib/api";

export default function TasksPage() {
  const { data: tasks = [], isLoading } = useTasks();
  const { data: projects = [] } = useProjects();
  const createTaskMutation = useCreateTask();
  const updateTaskStatusMutation = useUpdateTaskStatus();
  const { canManageTasks } = usePermissions();

  const [scopeFilter, setScopeFilter] = useState<"all" | "active" | "backlog" | "completed">("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<Task["priority"]>("MEDIUM");
  const [newTaskProjectId, setNewTaskProjectId] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskEstHours, setNewTaskEstHours] = useState("");

  const toggleTaskCompletion = (task: Task) => {
    if (!canManageTasks) return;
    const nextStatus: Task["status"] = task.status === "DONE" ? "IN_PROGRESS" : "DONE";
    updateTaskStatusMutation.mutate({ taskId: task.id, status: nextStatus });
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !canManageTasks) return;

    const projectId = newTaskProjectId || (projects.length > 0 ? projects[0].id : "");
    if (!projectId) return;

    await createTaskMutation.mutateAsync({
      title: newTaskTitle.trim(),
      priority: newTaskPriority,
      projectId,
      dueDate: newTaskDueDate || undefined,
      estimatedHours: newTaskEstHours ? parseFloat(newTaskEstHours) : undefined,
      status: "TODO",
    });

    setNewTaskTitle("");
    setNewTaskDueDate("");
    setNewTaskEstHours("");
    setIsNewTaskOpen(false);
  };

  const filteredTasks = tasks.filter((task) => {
    if (scopeFilter === "active" && (task.status === "DONE" || task.status === "BACKLOG" || task.status === "CANCELED")) return false;
    if (scopeFilter === "backlog" && task.status !== "BACKLOG") return false;
    if (scopeFilter === "completed" && task.status !== "DONE") return false;

    if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
    if (selectedProjectId !== "all" && task.projectId !== selectedProjectId) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        task.title.toLowerCase().includes(q) ||
        (task.taskKey && task.taskKey.toLowerCase().includes(q)) ||
        (task.description && task.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const activeCount = tasks.filter((t) => t.status !== "DONE" && t.status !== "BACKLOG" && t.status !== "CANCELED").length;
  const backlogCount = tasks.filter((t) => t.status === "BACKLOG").length;
  const completedCount = tasks.filter((t) => t.status === "DONE").length;

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="flex flex-col gap-space-lg pb-16 pt-2">
        {/* Top Action & View Toolbar */}
        <div className="flex flex-col gap-space-md">
          <div className="flex flex-wrap items-center justify-between gap-space-md">
            {/* View Scope Tabs */}
            <div className="flex flex-wrap items-center gap-1 bg-surface-container-lowest p-1 rounded-lg border border-outline-variant/30">
              <button
                type="button"
                onClick={() => setScopeFilter("all")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-body-sm text-body-sm transition-all ${
                  scopeFilter === "all"
                    ? "bg-surface-container-high text-on-surface font-headline-sm shadow-sm"
                    : "text-outline hover:text-on-surface hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined text-[15px] text-primary">layers</span>
                <span>All Tasks</span>
                <span className="font-label-code text-label-code text-outline ml-1">{tasks.length}</span>
              </button>
              <button
                type="button"
                onClick={() => setScopeFilter("active")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-body-sm text-body-sm transition-all ${
                  scopeFilter === "active"
                    ? "bg-surface-container-high text-on-surface font-headline-sm shadow-sm"
                    : "text-outline hover:text-on-surface hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined text-[15px] text-secondary">radio_button_checked</span>
                <span>Active</span>
                <span className="font-label-code text-label-code text-outline-variant ml-1">{activeCount}</span>
              </button>
              <button
                type="button"
                onClick={() => setScopeFilter("backlog")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-body-sm text-body-sm transition-all ${
                  scopeFilter === "backlog"
                    ? "bg-surface-container-high text-on-surface font-headline-sm shadow-sm"
                    : "text-outline hover:text-on-surface hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">inventory_2</span>
                <span>Backlog</span>
                <span className="font-label-code text-label-code text-outline-variant ml-1">{backlogCount}</span>
              </button>
              <button
                type="button"
                onClick={() => setScopeFilter("completed")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-body-sm text-body-sm transition-all ${
                  scopeFilter === "completed"
                    ? "bg-surface-container-high text-on-surface font-headline-sm shadow-sm"
                    : "text-outline hover:text-on-surface hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined text-[15px] text-primary">check_circle</span>
                <span>Completed</span>
                <span className="font-label-code text-label-code text-outline-variant ml-1">{completedCount}</span>
              </button>
            </div>

            {/* Right Side: View Links & Actions */}
            <div className="flex items-center gap-space-sm">
              <div className="flex items-center bg-surface-container-lowest p-0.5 rounded-lg border border-outline-variant/30">
                <Link
                  href="/tasks"
                  className="p-1 rounded bg-surface-container-high text-on-surface hover:text-primary transition-colors"
                  title="List View"
                >
                  <span className="material-symbols-outlined text-[16px]">view_agenda</span>
                </Link>
                <Link
                  href="/board"
                  className="p-1 rounded text-outline hover:text-on-surface transition-colors"
                  title="Board View"
                >
                  <span className="material-symbols-outlined text-[16px]">view_kanban</span>
                </Link>
                <Link
                  href="/gantt"
                  className="p-1 rounded text-outline hover:text-on-surface transition-colors"
                  title="Gantt Timeline"
                >
                  <span className="material-symbols-outlined text-[16px]">waterfall_chart</span>
                </Link>
              </div>
              <div className="h-4 w-px bg-surface-variant"></div>
              {canManageTasks && (
                <button
                  type="button"
                  onClick={() => setIsNewTaskOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm shadow-sm transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>New Issue</span>
                  <span className="font-label-kbd text-label-kbd bg-on-primary-fixed/20 text-on-primary-container/80 px-1 py-0.2 rounded ml-1">C</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-low border border-outline-variant/30">
                <span className="material-symbols-outlined text-[14px] text-outline">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter issues..."
                  className="bg-transparent font-body-sm text-body-sm text-on-surface focus:outline-none placeholder:text-outline w-40 md:w-56"
                />
              </div>

              {/* Project filter */}
              {projects.length > 0 && (
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-body-sm focus:outline-none"
                >
                  <option value="all">All Projects</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}

              {/* Priority Filter */}
              <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded-lg border border-outline-variant/30 text-body-sm">
                <span className="text-outline text-[11px] px-1 font-label-badge">Priority:</span>
                {(["all", "URGENT", "HIGH", "MEDIUM", "LOW"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriorityFilter(p)}
                    className={`px-2 py-0.5 rounded text-[11px] font-label-code capitalize transition-colors ${
                      priorityFilter === p
                        ? "bg-surface-container-high text-on-surface font-medium"
                        : "text-outline hover:text-on-surface"
                    }`}
                  >
                    {p.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-outline font-label-code text-[11px]">
              Showing {filteredTasks.length} of {tasks.length} tasks
            </div>
          </div>
        </div>

        {/* Modal: New Issue */}
        {isNewTaskOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-lg bg-surface-container-low border border-outline-variant/50 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Create New Task</h3>
                <button
                  type="button"
                  onClick={() => setIsNewTaskOpen(false)}
                  className="w-6 h-6 rounded flex items-center justify-center text-outline hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
              <form onSubmit={handleCreateTask} className="flex flex-col gap-4 mt-4">
                <div>
                  <label className="block text-body-sm font-medium text-on-surface mb-1">Issue Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Optimize STOMP message parsing pipeline"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="w-full h-8 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-body-sm font-medium text-on-surface mb-1">Project</label>
                    <select
                      value={newTaskProjectId || (projects[0]?.id || "")}
                      onChange={(e) => setNewTaskProjectId(e.target.value)}
                      className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-body-sm font-medium text-on-surface mb-1">Priority</label>
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as Task["priority"])}
                      className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
                    >
                      <option value="URGENT">Urgent</option>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-body-sm font-medium text-on-surface mb-1">Due Date</label>
                    <input
                      type="date"
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                      className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
                    />
                  </div>
                  <div>
                    <label className="block text-body-sm font-medium text-on-surface mb-1">Estimated Hours</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={newTaskEstHours}
                      onChange={(e) => setNewTaskEstHours(e.target.value)}
                      placeholder="e.g. 4"
                      className="w-full h-8 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsNewTaskOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-body-sm text-outline hover:text-on-surface"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createTaskMutation.isPending}
                    className="px-4 py-1.5 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm disabled:opacity-50"
                  >
                    {createTaskMutation.isPending ? "Creating..." : "Create Issue"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="w-full p-8 flex justify-center text-outline text-body-sm">
            Loading tasks...
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredTasks.length === 0 && (
          <div className="p-12 rounded-lg bg-surface-container-low border border-dashed border-outline-variant/40 flex flex-col items-center justify-center text-center gap-3">
            <span className="material-symbols-outlined text-[36px] text-outline">check_box</span>
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
                <span className="w-24 text-right">Assignee</span>
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
                          <span className="material-symbols-outlined text-[13px]">check</span>
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
                      <div className="w-24 flex items-center justify-end gap-1.5">
                        <span className="text-[11px] text-outline truncate max-w-[70px]">
                          {task.assignees?.[0]?.member?.user?.name?.split(" ")[0] || "Unassigned"}
                        </span>
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
