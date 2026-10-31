"use client";

import Link from "next/link";
import React, { useState } from "react";
import { INITIAL_TASKS, TaskItem } from "@/lib/mock-data";

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [scopeFilter, setScopeFilter] = useState<"all" | "active" | "backlog" | "completed">("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<TaskItem["priority"]>("Medium");
  const [newTaskProject, setNewTaskProject] = useState("Nexus 2.0 Redesign");

  const toggleSelectTask = (id: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleTaskCompletion = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextCompleted = !t.completed;
          return {
            ...t,
            completed: nextCompleted,
            status: nextCompleted ? "Done" : "In Progress",
          };
        }
        return t;
      })
    );
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: TaskItem = {
      id: `SCR-${Math.floor(100 + Math.random() * 900)}`,
      title: newTaskTitle.trim(),
      projectId: "prj-204",
      projectName: newTaskProject,
      status: "Todo",
      priority: newTaskPriority,
      assigneeName: "Elena Rostova",
      assigneeAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=faces",
      dueDate: "Nov 15",
      cycle: "Sprint 14",
      completed: false,
    };

    setTasks([newTask, ...tasks]);
    setNewTaskTitle("");
    setIsNewTaskOpen(false);
  };

  const filteredTasks = tasks.filter((task) => {
    if (scopeFilter === "active" && (task.status === "Done" || task.status === "Backlog")) return false;
    if (scopeFilter === "backlog" && task.status !== "Backlog") return false;
    if (scopeFilter === "completed" && task.status !== "Done") return false;

    if (priorityFilter !== "all" && task.priority.toLowerCase() !== priorityFilter.toLowerCase()) return false;
    if (assigneeFilter !== "all" && !task.assigneeName.toLowerCase().includes(assigneeFilter.toLowerCase())) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        task.title.toLowerCase().includes(q) ||
        task.id.toLowerCase().includes(q) ||
        task.projectName.toLowerCase().includes(q) ||
        task.assigneeName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeCount = tasks.filter((t) => t.status !== "Done" && t.status !== "Backlog").length;
  const backlogCount = tasks.filter((t) => t.status === "Backlog").length;
  const completedCount = tasks.filter((t) => t.status === "Done").length;

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="flex flex-col gap-space-lg pb-16 pt-2">
        {/* Top Action & View Toolbar */}
        <div className="flex flex-col gap-space-md">
          {/* Upper Tier: View Modes & Quick Insights */}
          <div className="flex flex-wrap items-center justify-between gap-space-md">
            {/* View Scope Tabs */}
            <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded-lg border border-outline-variant/30">
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
              <button
                type="button"
                onClick={() => setIsNewTaskOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>New Issue</span>
                <span className="font-label-kbd text-label-kbd bg-on-primary-fixed/20 text-on-primary-container/80 px-1 py-0.2 rounded ml-1">C</span>
              </button>
            </div>
          </div>

          {/* Lower Tier: Interactive Filter Pills & Global Filter Input */}
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
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-outline hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                )}
              </div>

              {/* Priority Filter */}
              <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded-lg border border-outline-variant/30 text-body-sm">
                <span className="text-outline text-[11px] px-1 font-label-badge">Priority:</span>
                {["all", "urgent", "high", "medium", "low"].map((p) => (
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
                    {p}
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
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Create New Task / Issue</h3>
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
                      value={newTaskProject}
                      onChange={(e) => setNewTaskProject(e.target.value)}
                      className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
                    >
                      <option value="Nexus 2.0 Redesign">Nexus 2.0 Redesign</option>
                      <option value="Core Engine v3">Core Engine v3</option>
                      <option value="Enterprise SSO & RBAC">Enterprise SSO & RBAC</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-body-sm font-medium text-on-surface mb-1">Priority</label>
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as TaskItem["priority"])}
                      className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
                    >
                      <option value="Urgent">Urgent</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
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
                    className="px-4 py-1.5 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm"
                  >
                    Create Issue
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Task List Table */}
        <div className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-surface-container-high/40 border-b border-outline-variant/30 flex items-center justify-between text-outline text-[11px] font-label-badge uppercase tracking-wider">
            <div className="flex items-center gap-3">
              <span className="w-4"></span>
              <span>Issue</span>
            </div>
            <div className="flex items-center gap-8">
              <span className="w-24 text-center">Status</span>
              <span className="w-20 text-center">Priority</span>
              <span className="w-28 text-center">Cycle</span>
              <span className="w-24 text-right">Assignee</span>
            </div>
          </div>

          <div className="divide-y divide-outline-variant/20">
            {filteredTasks.map((task) => {
              const isSelected = selectedTaskIds.includes(task.id);
              return (
                <div
                  key={task.id}
                  className={`flex items-center justify-between px-4 py-2.5 hover:bg-surface-container transition-colors group ${
                    task.completed ? "opacity-60 bg-surface-container-lowest/50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
                    <button
                      type="button"
                      onClick={() => toggleTaskCompletion(task.id)}
                      className={`w-4 h-4 rounded-xs border flex items-center justify-center transition-colors ${
                        task.completed
                          ? "bg-primary-container border-primary-container text-on-primary-container"
                          : "border-outline-variant group-hover:border-outline bg-surface-container"
                      }`}
                    >
                      {task.completed && (
                        <span className="material-symbols-outlined text-[13px]">check</span>
                      )}
                    </button>
                    <Link
                      href={`/tasks/${task.id}`}
                      className="font-label-code text-label-code text-outline group-hover:text-primary transition-colors shrink-0"
                    >
                      {task.id}
                    </Link>
                    <Link
                      href={`/tasks/${task.id}`}
                      className={`font-body-md text-body-md truncate group-hover:text-primary transition-colors ${
                        task.completed ? "line-through text-outline" : "text-on-surface"
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
                          task.priority === "Urgent"
                            ? "bg-red-500/20 text-red-400"
                            : task.priority === "High"
                            ? "bg-amber-500/20 text-amber-400"
                            : task.priority === "Medium"
                            ? "bg-primary-container/20 text-primary"
                            : "bg-surface-container text-outline"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                    <div className="w-28 flex justify-center text-[11px] font-label-code text-outline">
                      {task.cycle}
                    </div>
                    <div className="w-24 flex items-center justify-end gap-1.5">
                      <img
                        src={task.assigneeAvatar}
                        alt={task.assigneeName}
                        className="w-5 h-5 rounded-full object-cover ring-1 ring-outline-variant"
                        title={task.assigneeName}
                      />
                      <span className="text-[11px] text-outline truncate max-w-[70px]">
                        {task.assigneeName.split(" ")[0]}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
