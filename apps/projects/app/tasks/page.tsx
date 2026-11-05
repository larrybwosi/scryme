"use client";

import Link from "next/link";
import React, { useState } from "react";
import { Plus, Search, X, CheckSquare, Check } from "lucide-react";
import {
  useTasks,
  useProjects,
  useMembers,
  useStaffShifts,
  useCreateTask,
  useUpdateTaskStatus,
} from "@/lib/hooks/use-projects";
import { usePermissions } from "@/lib/permissions";
import { Task } from "@/lib/api";
import { CapacityWarningModal } from "@/components/CapacityWarningModal";
import { toast } from "sonner";

export default function TasksPage() {
  const { data: tasks = [], isLoading } = useTasks();
  const { data: projects = [] } = useProjects();
  const { data: members = [] } = useMembers();
  const { data: staffShifts = [] } = useStaffShifts();

  const createTaskMutation = useCreateTask();
  const updateTaskStatusMutation = useUpdateTaskStatus();
  const { canManageTasks } = usePermissions();

  const [scopeFilter, setScopeFilter] = useState<"all" | "active" | "backlog" | "completed">("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Create Task Modal State
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<Task["priority"]>("MEDIUM");
  const [newTaskProjectId, setNewTaskProjectId] = useState("");
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskEstHours, setNewTaskEstHours] = useState("");

  // Capacity Warning Modal State
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [pendingTaskData, setPendingTaskData] = useState<any>(null);
  const [warningMemberName, setWarningMemberName] = useState("");
  const [warningAssignedHours, setWarningAssignedHours] = useState(0);
  const [warningAdditionalHours, setWarningAdditionalHours] = useState(0);
  const [warningCapacityHours, setWarningCapacityHours] = useState(40);

  const toggleTaskCompletion = (task: Task) => {
    if (!canManageTasks) return;
    const nextStatus: Task["status"] = task.status === "DONE" ? "IN_PROGRESS" : "DONE";
    updateTaskStatusMutation.mutate({ taskId: task.id, status: nextStatus });
  };

  const checkMemberCapacity = (memberId: string, hoursToAdd: number) => {
    const memberTasks = tasks.filter(
      (t) =>
        (t.status === "TODO" || t.status === "IN_PROGRESS" || t.status === "IN_REVIEW") &&
        t.assignees?.some((a) => a.member?.id === memberId)
    );
    const currentHours = memberTasks.reduce((acc, curr) => acc + (Number(curr.estimatedHours) || 2), 0);

    const memberShifts = staffShifts.filter((s) => s.memberId === memberId && s.isActive);
    let shiftHours = 0;
    for (const s of memberShifts) {
      const [h1, m1] = s.startTime.split(":").map(Number);
      const [h2, m2] = s.endTime.split(":").map(Number);
      const diffM = h2 * 60 + m2 - (h1 * 60 + m1);
      if (diffM > 0) shiftHours += diffM / 60;
    }
    const totalCapacity = shiftHours > 0 ? shiftHours : 40;

    return {
      currentHours,
      totalCapacity,
      isOverloaded: currentHours + hoursToAdd > totalCapacity,
    };
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !canManageTasks) return;

    const projectId = newTaskProjectId || (projects.length > 0 ? projects[0].id : "");
    if (!projectId) return;

    const estHours = newTaskEstHours ? parseFloat(newTaskEstHours) : 2;

    const payload = {
      title: newTaskTitle.trim(),
      priority: newTaskPriority,
      projectId,
      dueDate: newTaskDueDate || undefined,
      estimatedHours: estHours,
      status: "TODO" as const,
      assigneeIds: newTaskAssigneeId ? [newTaskAssigneeId] : undefined,
    };

    if (newTaskAssigneeId) {
      const targetMember = members.find((m) => m.id === newTaskAssigneeId);
      const { currentHours, totalCapacity, isOverloaded } = checkMemberCapacity(newTaskAssigneeId, estHours);

      if (isOverloaded) {
        setPendingTaskData(payload);
        setWarningMemberName(targetMember?.name || "Teammate");
        setWarningAssignedHours(currentHours);
        setWarningAdditionalHours(estHours);
        setWarningCapacityHours(totalCapacity);
        setWarningModalOpen(true);
        return;
      }
    }

    await executeCreateTask(payload);
  };

  const executeCreateTask = async (payload: any) => {
    try {
      await createTaskMutation.mutateAsync(payload);
      toast.success("Task created successfully");
      setNewTaskTitle("");
      setNewTaskDueDate("");
      setNewTaskEstHours("");
      setNewTaskAssigneeId("");
      setIsNewTaskOpen(false);
      setWarningModalOpen(false);
      setPendingTaskData(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create task");
    }
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

            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm"
            >
              <option value="all">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="relative w-full sm:w-64">
<Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-outline h-4 w-4" />
            <input
              type="text"
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm placeholder:text-outline focus:outline-none focus:border-primary-container"
            />
          </div>
        </div>

        {/* Modal: New Issue */}
        {isNewTaskOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg rounded-lg bg-surface-container-low border border-outline-variant/50 p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Create New Issue</h3>
                <button
                  type="button"
                  onClick={() => setIsNewTaskOpen(false)}
                  className="w-6 h-6 rounded flex items-center justify-center text-outline hover:text-on-surface"
                >
                  <X className="h-4 w-4" />
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
                    <label className="block text-body-sm font-medium text-on-surface mb-1">Assignee</label>
                    <select
                      value={newTaskAssigneeId}
                      onChange={(e) => setNewTaskAssigneeId(e.target.value)}
                      className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
                    >
                      <option value="">Unassigned</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                      ))}
                    </select>
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

                <div>
                  <label className="block text-body-sm font-medium text-on-surface mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
                  />
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

        {/* Capacity Warning Soft Modal */}
        <CapacityWarningModal
          isOpen={warningModalOpen}
          memberName={warningMemberName}
          currentAssignedHours={warningAssignedHours}
          additionalHours={warningAdditionalHours}
          totalCapacityHours={warningCapacityHours}
          onConfirm={() => {
            if (pendingTaskData) executeCreateTask(pendingTaskData);
          }}
          onCancel={() => {
            setWarningModalOpen(false);
            setPendingTaskData(null);
          }}
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
