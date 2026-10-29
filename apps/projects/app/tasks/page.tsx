"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Task } from "@/lib/api";
import { useTasks, useUpdateTaskStatus, useCreateTask } from "@/lib/hooks/use-projects";
import { Plus, Clock, LayoutGrid, ListFilter } from "lucide-react";

const COLUMNS: { id: Task["status"]; label: string; color: string }[] = [
  { id: "BACKLOG", label: "Backlog", color: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  { id: "TODO", label: "To Do", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  { id: "IN_PROGRESS", label: "In Progress", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  { id: "IN_REVIEW", label: "In Review", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  { id: "DONE", label: "Done", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
];

function TasksContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") || "proj-1";

  const { data: tasks = [], isLoading } = useTasks(projectId);
  const updateStatusMutation = useUpdateTaskStatus(projectId);
  const createTaskMutation = useCreateTask(projectId);

  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<Task["priority"]>("MEDIUM");
  const [newTaskStatus, setNewTaskStatus] = useState<Task["status"]>("TODO");

  const handleStatusChange = (taskId: string, status: Task["status"]) => {
    updateStatusMutation.mutate({ taskId, status });
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    createTaskMutation.mutate(
      {
        title: newTaskTitle,
        description: newTaskDescription,
        priority: newTaskPriority,
        status: newTaskStatus,
        projectId,
        estimatedHours: 8,
      },
      {
        onSuccess: () => {
          setNewTaskTitle("");
          setNewTaskDescription("");
          setIsModalOpen(false);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Task Management</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage task lifecycles, assignees, estimates, and Kanban workflow columns.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#121824] border border-[#1F293D] p-1 rounded-lg flex items-center gap-1">
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === "kanban"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Kanban
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === "list"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ListFilter className="h-3.5 w-3.5" /> List
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md shadow-indigo-600/20"
          >
            <Plus className="h-4 w-4" /> Add Task
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Loading project tasks...</div>
      ) : viewMode === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                className="bg-[#121824] border border-[#1F293D] rounded-xl p-3 flex flex-col min-h-[500px]"
              >
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1F293D]">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${col.color}`}>
                    {col.label}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">{colTasks.length}</span>
                </div>

                <div className="space-y-3 flex-1">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-[#0B0F17] border border-[#1F293D] hover:border-indigo-500/40 rounded-lg p-3.5 space-y-3 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors">
                          {task.title}
                        </h4>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {task.priority}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-[11px] text-slate-400 line-clamp-2">{task.description}</p>
                      )}

                      <div className="pt-2 border-t border-[#1F293D]/60 flex items-center justify-between text-[11px] text-slate-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{task.estimatedHours || 0}h</span>
                        </div>
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value as Task["status"])}
                          className="bg-[#121824] border border-[#1F293D] text-[10px] rounded px-1.5 py-0.5 text-slate-300 focus:outline-none focus:border-indigo-500"
                        >
                          {COLUMNS.map((c) => (
                            <option key={c.id} value={c.id}>
                              Move to {c.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#121824] border border-[#1F293D] rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0F17] border-b border-[#1F293D] text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="px-4 py-3">Task Title</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Estimate</th>
                <th className="px-4 py-3">Actual</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F293D] text-slate-300">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-[#1A2333]/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-100">{task.title}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {task.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[10px]">{task.priority}</td>
                  <td className="px-4 py-3">{task.estimatedHours || 0} hrs</td>
                  <td className="px-4 py-3">{task.actualHours || 0} hrs</td>
                  <td className="px-4 py-3 text-right">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value as Task["status"])}
                      className="bg-[#0B0F17] border border-[#1F293D] text-[10px] rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-indigo-500"
                    >
                      {COLUMNS.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121824] border border-[#1F293D] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-semibold text-slate-100">Add New Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g., Wireframe mobile schedule view"
                  className="w-full bg-[#0B0F17] border border-[#1F293D] rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="Acceptance criteria and scope..."
                  className="w-full bg-[#0B0F17] border border-[#1F293D] rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as Task["priority"])}
                    className="w-full bg-[#0B0F17] border border-[#1F293D] rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Status</label>
                  <select
                    value={newTaskStatus}
                    onChange={(e) => setNewTaskStatus(e.target.value as Task["status"])}
                    className="w-full bg-[#0B0F17] border border-[#1F293D] rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    {COLUMNS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-[#1F293D] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTaskMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded text-xs font-medium shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {createTaskMutation.isPending ? "Saving..." : "Save Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-slate-500 text-sm">Loading task workspace...</div>}>
      <TasksContent />
    </Suspense>
  );
}
