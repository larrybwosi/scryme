"use client";

import Link from "next/link";
import React, { useState } from "react";
import { INITIAL_TASKS, TaskItem } from "@/lib/mock-data";

const COLUMNS: TaskItem["status"][] = ["Backlog", "Todo", "In Progress", "In Review", "Done"];

export default function BoardPage() {
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [targetColumn, setTargetColumn] = useState<TaskItem["status"]>("Todo");
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<TaskItem["priority"]>("Medium");

  const filteredTasks = tasks.filter((t) => {
    if (selectedPriority !== "all" && t.priority.toLowerCase() !== selectedPriority.toLowerCase()) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q);
    }
    return true;
  });

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: TaskItem = {
      id: `SCR-${Math.floor(100 + Math.random() * 900)}`,
      title: newTitle.trim(),
      projectId: "prj-204",
      projectName: "Nexus 2.0 Redesign",
      status: targetColumn,
      priority: newPriority,
      assigneeName: "Elena Rostova",
      assigneeAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=faces",
      dueDate: "Nov 02",
      cycle: "Sprint 14",
      completed: targetColumn === "Done",
    };

    setTasks([newTask, ...tasks]);
    setNewTitle("");
    setIsAddModalOpen(false);
  };

  const moveTaskStatus = (id: string, newStatus: TaskItem["status"]) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: newStatus, completed: newStatus === "Done" } : t
      )
    );
  };

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="flex flex-col w-full">
        {/* Board Secondary Sub-Header & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 mb-2">
          <div className="flex items-center gap-3">
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Nexus 2.0 Redesign</h1>
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            <span className="text-outline font-label-code text-label-code">Sprint 14 (4d left)</span>
            <span className="flex items-center gap-1 text-primary font-label-code text-label-code">
              <span className="material-symbols-outlined text-[13px]">data_thresholding</span>
              {tasks.length} issues • 84% velocity
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center bg-surface-container-lowest p-0.5 rounded-lg border border-outline-variant/30">
              <Link
                href="/board"
                className="px-2.5 py-1 rounded bg-surface-container-high text-on-surface font-body-sm text-body-sm flex items-center gap-1 shadow-sm"
              >
                <span className="material-symbols-outlined text-[15px]">view_kanban</span>
                <span>Board</span>
              </Link>
              <Link
                href="/tasks"
                className="px-2.5 py-1 rounded text-outline hover:text-on-surface font-body-sm text-body-sm flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[15px]">view_agenda</span>
                <span>List</span>
              </Link>
            </div>
            <button
              type="button"
              onClick={() => {
                setTargetColumn("Todo");
                setIsAddModalOpen(true);
              }}
              className="h-8 px-3 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm flex items-center gap-1 shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>New Issue</span>
            </button>
          </div>
        </div>

        {/* Filter Command Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-low border border-outline-variant/30 text-outline focus-within:text-on-surface">
              <span className="material-symbols-outlined text-[14px]">search</span>
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
              {["all", "urgent", "high", "medium", "low"].map((p) => (
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
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="text-outline text-[11px] font-label-code">
            5 Columns • Active Sprint
          </div>
        </div>

        {/* Modal: Quick Add */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-lg bg-surface-container-low border border-outline-variant/50 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Add to {targetColumn}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-6 h-6 rounded flex items-center justify-center text-outline hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
              <form onSubmit={handleAddTask} className="flex flex-col gap-4 mt-4">
                <div>
                  <label className="block text-body-sm font-medium text-on-surface mb-1">Issue Title</label>
                  <input
                    type="text"
                    required
                    placeholder="Describe issue..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full h-8 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
                  />
                </div>
                <div>
                  <label className="block text-body-sm font-medium text-on-surface mb-1">Column</label>
                  <select
                    value={targetColumn}
                    onChange={(e) => setTargetColumn(e.target.value as TaskItem["status"])}
                    className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm"
                  >
                    {COLUMNS.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-body-sm font-medium text-on-surface mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskItem["priority"])}
                    className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm"
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-body-sm text-outline hover:text-on-surface"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm"
                  >
                    Add Card
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Kanban Board Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3.5 items-start">
          {COLUMNS.map((col) => {
            const columnTasks = filteredTasks.filter((t) => t.status === col);
            return (
              <div
                key={col}
                className="flex flex-col rounded-lg bg-surface-container-low border border-outline-variant/30 p-2.5 min-h-[500px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-outline-variant/20 px-1">
                  <div className="flex items-center gap-2">
                    <span className="font-headline-sm text-body-sm text-on-surface font-semibold">{col}</span>
                    <span className="px-1.5 py-0.2 rounded bg-surface-container-highest text-outline font-label-code text-[10px]">
                      {columnTasks.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetColumn(col);
                      setIsAddModalOpen(true);
                    }}
                    className="w-5 h-5 rounded flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-[15px]">add</span>
                  </button>
                </div>

                {/* Card List */}
                <div className="flex flex-col gap-2 flex-1">
                  {columnTasks.map((task) => (
                    <div
                      key={task.id}
                      className="group p-3 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 transition-all shadow-xs flex flex-col gap-2"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <Link
                          href={`/tasks/${task.id}`}
                          className="font-label-code text-[11px] text-outline group-hover:text-primary transition-colors"
                        >
                          {task.id}
                        </Link>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-label-badge uppercase ${
                            task.priority === "Urgent"
                              ? "bg-red-500/20 text-red-400"
                              : task.priority === "High"
                              ? "bg-amber-500/20 text-amber-400"
                              : task.priority === "Medium"
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

                      <div className="flex items-center justify-between pt-1 border-t border-outline-variant/15 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <img
                            src={task.assigneeAvatar}
                            alt={task.assigneeName}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                          <span className="text-outline text-[10px]">{task.assigneeName.split(" ")[0]}</span>
                        </div>

                        {/* Move status dropdown */}
                        <select
                          value={task.status}
                          onChange={(e) => moveTaskStatus(task.id, e.target.value as TaskItem["status"])}
                          className="bg-surface-container-lowest text-outline text-[10px] rounded px-1 py-0.5 border border-outline-variant/20"
                        >
                          {COLUMNS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
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
      </div>
    </div>
  );
}
