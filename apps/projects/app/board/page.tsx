"use client";

import Link from "next/link";
import React, { useState } from "react";
import { Kanban, Rows, Plus, Search } from "lucide-react";
import { useTasks, useProjects, useUpdateTaskStatus } from "@/lib/hooks/use-projects";
import { usePermissions } from "@/lib/permissions";
import { Task } from "@/lib/api";
import { CreateTaskModal } from "@/components/CreateTaskModal";

const COLUMNS: { id: Task["status"]; label: string }[] = [
  { id: "BACKLOG", label: "Backlog" },
  { id: "TODO", label: "Todo" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "IN_REVIEW", label: "In Review" },
  { id: "DONE", label: "Done" },
];

export default function BoardPage() {
  const { data: projects = [] } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  const currentProjectId = selectedProjectId || (projects.length > 0 ? projects[0].id : "");
  const { data: tasks = [], isLoading } = useTasks(currentProjectId || undefined);
  const updateTaskStatusMutation = useUpdateTaskStatus(currentProjectId);
  const { canManageTasks } = usePermissions();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [targetColumn, setTargetColumn] = useState<Task["status"]>("TODO");

  // Drag and drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<Task["status"] | null>(null);

  const filteredTasks = tasks.filter((t) => {
    if (selectedPriority !== "all" && t.priority !== selectedPriority) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        (t.taskKey && t.taskKey.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const moveTaskStatus = (id: string, newStatus: Task["status"]) => {
    if (!canManageTasks) return;
    updateTaskStatusMutation.mutate({ taskId: id, status: newStatus });
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    if (!canManageTasks) return;
    setDraggedTaskId(taskId);
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, colId: Task["status"]) => {
    if (!canManageTasks) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverCol !== colId) {
      setDragOverCol(colId);
    }
  };

  const handleDragLeave = (_e: React.DragEvent, colId: Task["status"]) => {
    if (dragOverCol === colId) {
      setDragOverCol(null);
    }
  };

  const handleDrop = (e: React.DragEvent, colId: Task["status"]) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    if (taskId && canManageTasks) {
      const task = tasks.find((t) => t.id === taskId);
      if (task && task.status !== colId) {
        moveTaskStatus(taskId, colId);
      }
    }
    setDraggedTaskId(null);
  };

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="flex flex-col w-full">
        {/* Board Secondary Sub-Header & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 mb-2">
          <div className="flex items-center gap-3">
            {projects.length > 0 ? (
              <select
                value={currentProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="font-headline-lg text-headline-lg text-on-surface bg-transparent border-0 tracking-tight font-semibold focus:outline-none cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-surface-container-high text-on-surface">
                    {p.name}
                  </option>
                ))}
              </select>
            ) : (
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                Workspace Board
              </h1>
            )}
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            <span className="text-outline font-label-code text-label-code">
              {tasks.length} issues
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center bg-surface-container-lowest p-0.5 rounded-lg border border-outline-variant/30">
              <Link
                href="/board"
                className="px-2.5 py-1 rounded bg-surface-container-high text-on-surface font-body-sm text-body-sm flex items-center gap-1 shadow-sm"
              >
                <Kanban className="h-4 w-4" />
                <span>Board</span>
              </Link>
              <Link
                href="/tasks"
                className="px-2.5 py-1 rounded text-outline hover:text-on-surface font-body-sm text-body-sm flex items-center gap-1 transition-colors"
              >
                <Rows className="h-4 w-4" />
                <span>List</span>
              </Link>
            </div>
            {canManageTasks && (
              <button
                type="button"
                onClick={() => {
                  setTargetColumn("TODO");
                  setIsAddModalOpen(true);
                }}
                className="h-8 px-3 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm flex items-center gap-1 shadow-sm transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>New Issue</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Command Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-low border border-outline-variant/30 text-outline focus-within:text-on-surface">
              <Search className="h-3.5 w-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search board issues..."
                className="bg-transparent font-body-sm text-body-sm text-on-surface focus:outline-none placeholder:text-outline w-44 md:w-56"
              />
            </div>
            <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded-lg border border-outline-variant/30 text-body-sm">
              <span className="text-outline text-[11px] px-1 font-label-badge">Priority:</span>
              {(["all", "URGENT", "HIGH", "MEDIUM", "LOW"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedPriority(p)}
                  className={`px-2 py-0.5 rounded text-[11px] font-label-code capitalize transition-colors ${
                    selectedPriority === p
                      ? "bg-surface-container-high text-on-surface font-medium"
                      : "text-outline hover:text-on-surface"
                  }`}
                >
                  {p.toLowerCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="text-outline text-[11px] font-label-code">
            {canManageTasks ? "Drag & Drop Enabled • Live Sync" : "Read-only View"}
          </div>
        </div>

        {/* Modal: New Issue */}
        <CreateTaskModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          defaultProjectId={currentProjectId}
          defaultStatus={targetColumn}
        />

        {/* Loading */}
        {isLoading && (
          <div className="w-full py-16 flex justify-center text-outline text-body-sm">
            Loading Kanban board...
          </div>
        )}

        {/* Kanban Board Columns */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3.5 items-start">
            {COLUMNS.map((col) => {
              const columnTasks = filteredTasks.filter((t) => t.status === col.id);
              const isOver = dragOverCol === col.id;

              return (
                <div
                  key={col.id}
                  onDragOver={(e) => handleDragOver(e, col.id)}
                  onDragLeave={(e) => handleDragLeave(e, col.id)}
                  onDrop={(e) => handleDrop(e, col.id)}
                  className={`flex flex-col rounded-lg bg-surface-container-low border transition-all p-2.5 min-h-[500px] ${
                    isOver ? "border-primary bg-primary/5 shadow-md" : "border-outline-variant/30"
                  }`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-outline-variant/20 px-1">
                    <div className="flex items-center gap-2">
                      <span className="font-headline-sm text-body-sm text-on-surface font-semibold">{col.label}</span>
                      <span className="px-1.5 py-0.2 rounded bg-surface-container-highest text-outline font-label-code text-[10px]">
                        {columnTasks.length}
                      </span>
                    </div>
                    {canManageTasks && (
                      <button
                        type="button"
                        onClick={() => {
                          setTargetColumn(col.id);
                          setIsAddModalOpen(true);
                        }}
                        className="w-5 h-5 rounded flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Card List */}
                  <div className="flex flex-col gap-2 flex-1">
                    {columnTasks.map((task) => (
                      <div
                        key={task.id}
                        draggable={canManageTasks}
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        className={`group p-3 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 transition-all shadow-xs flex flex-col gap-2 ${
                          canManageTasks ? "cursor-grab active:cursor-grabbing" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <Link
                            href={`/tasks/${task.id}`}
                            className="font-label-code text-[11px] text-outline group-hover:text-primary transition-colors"
                          >
                            {task.taskKey || task.id.slice(-6).toUpperCase()}
                          </Link>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-label-badge uppercase ${
                              task.priority === "URGENT"
                                ? "bg-red-500/20 text-red-400"
                                : task.priority === "HIGH"
                                ? "bg-amber-500/20 text-amber-400"
                                : task.priority === "MEDIUM"
                                ? "bg-primary-container/20 text-primary"
                                : "bg-surface-container-highest text-outline"
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>

                        <Link
                          href={`/tasks/${task.id}`}
                          className="font-body-sm text-body-sm text-on-surface font-medium hover:text-primary transition-colors line-clamp-2"
                        >
                          {task.title}
                        </Link>

                        {/* Integration Badges */}
                        <div className="flex flex-wrap items-center gap-1">
                          {task.bookingId && (
                            <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-label-code bg-primary/10 text-primary border border-primary/20">
                              <span className="material-symbols-outlined text-[10px]">event_available</span>
                              Booking
                            </span>
                          )}
                          {task.batches && task.batches.length > 0 && (
                            <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-label-code bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <span className="material-symbols-outlined text-[10px]">cookie</span>
                              Batch
                            </span>
                          )}
                          {task.labels && task.labels.length > 0 && (
                            <div className="flex items-center gap-1">
                              {task.labels.slice(0, 1).map((l, idx) => (
                                <span
                                  key={l.label?.id || idx}
                                  className="px-1 py-0.2 rounded text-[9px] font-medium"
                                  style={{
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

                        <div className="flex items-center justify-between pt-1 border-t border-outline-variant/15 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <span className="text-outline text-[10px]">
                              {task.assignees?.[0]?.member?.user?.name?.split(" ")[0] || "Unassigned"}
                            </span>
                          </div>

                          {/* Move status dropdown */}
                          {canManageTasks ? (
                            <select
                              value={task.status}
                              onChange={(e) => moveTaskStatus(task.id, e.target.value as Task["status"])}
                              className="bg-surface-container-lowest text-outline text-[10px] rounded px-1 py-0.5 border border-outline-variant/20 focus:outline-none"
                            >
                              {COLUMNS.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-[10px] text-outline font-label-code">{task.status}</span>
                          )}
                        </div>
                      </div>
                    ))}

                    {columnTasks.length === 0 && (
                      <div className="flex items-center justify-center h-24 border border-dashed border-outline-variant/30 rounded-lg text-outline text-[11px]">
                        No issues
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
