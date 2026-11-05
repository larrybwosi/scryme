"use client";

import Link from "next/link";
import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  useTasks,
  useTask,
  useMembers,
  useStaffShifts,
  useSubtasks,
  useUpdateTaskStatus,
  useUpdateTask,
  useManageTaskAssignees,
  useAddTaskComment,
} from "@/lib/hooks/use-projects";
import { usePermissions } from "@/lib/permissions";
import { Task } from "@/lib/api";
import { CapacityWarningModal } from "@/components/CapacityWarningModal";
import { toast } from "sonner";

interface TaskDetailPageProps {
  taskId?: string;
}

function TaskDetailContent({ taskId: propTaskId }: TaskDetailPageProps) {
  const searchParams = useSearchParams();
  const rawId = propTaskId || searchParams.get("id");

  const { data: allTasks = [] } = useTasks();
  const activeId = rawId || (allTasks.length > 0 ? allTasks[0].id : "");

  const { data: task, isLoading } = useTask(activeId);
  const { data: subtasks = [] } = useSubtasks(activeId);
  const { data: members = [] } = useMembers();
  const { data: staffShifts = [] } = useStaffShifts();

  const updateTaskStatusMutation = useUpdateTaskStatus();
  const updateTaskMutation = useUpdateTask();
  const manageAssigneesMutation = useManageTaskAssignees(activeId);
  const addCommentMutation = useAddTaskComment(activeId);

  const { canManageTasks } = usePermissions();

  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [commentText, setCommentText] = useState("");

  // Capacity Warning Modal State
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [pendingAssigneeId, setPendingAssigneeId] = useState<string | null>(null);
  const [warningMemberName, setWarningMemberName] = useState("");
  const [warningAssignedHours, setWarningAssignedHours] = useState(0);
  const [warningAdditionalHours, setWarningAdditionalHours] = useState(0);
  const [warningCapacityHours, setWarningCapacityHours] = useState(40);

  const checkMemberCapacity = (memberId: string, hoursToAdd: number) => {
    const memberTasks = allTasks.filter(
      (t) =>
        t.id !== activeId &&
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

  const handleAssigneeChange = async (
    assignees: { memberId: string; isPrimary?: boolean; allocatedHours?: number }[]
  ) => {
    if (assignees.length === 0) {
      manageAssigneesMutation.mutate([]);
      return;
    }

    const primary = assignees.find((a) => a.isPrimary) || assignees[0];
    const targetMember = members.find((m) => m.id === primary.memberId);
    const estHours = Number(task?.estimatedHours) || 2;
    const shareHours = primary.allocatedHours || estHours / assignees.length;
    const { currentHours, totalCapacity, isOverloaded } = checkMemberCapacity(primary.memberId, shareHours);

    if (isOverloaded) {
      setPendingAssigneeId(primary.memberId);
      setWarningMemberName(targetMember?.name || "Lead Assignee");
      setWarningAssignedHours(currentHours);
      setWarningAdditionalHours(shareHours);
      setWarningCapacityHours(totalCapacity);
      setWarningModalOpen(true);
      return;
    }

    manageAssigneesMutation.mutate(assignees);
    toast.success("Assignees updated");
  };

  const confirmOverloadedAssignee = () => {
    if (pendingAssigneeId) {
      manageAssigneesMutation.mutate([pendingAssigneeId]);
      toast.success("Assignee updated (capacity overridden)");
      setWarningModalOpen(false);
      setPendingAssigneeId(null);
    }
  };

  const addSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !task) return;
    toast.info("Subtask added");
    setNewSubtaskTitle("");
  };

  const toggleSubtask = (st: Task) => {
    const nextStatus = st.status === "DONE" ? "TODO" : "DONE";
    updateTaskStatusMutation.mutate({ taskId: st.id, status: nextStatus });
  };

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    await addCommentMutation.mutateAsync(commentText.trim());
    toast.success("Comment posted");
    setCommentText("");
  };

  if (isLoading || !task) {
    return (
      <div className="w-full min-h-screen bg-surface flex items-center justify-center p-8 text-outline text-body-sm">
        Loading task detail...
      </div>
    );
  }

  const doneCount = subtasks.filter((st) => st.status === "DONE").length;

  return (
    <div className="flex flex-col w-full min-h-screen bg-surface text-on-surface">
      <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto w-full">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-body-sm text-outline border-b border-outline-variant/30 pb-3">
          <Link href="/tasks" className="hover:text-on-surface transition-colors">
            Tasks
          </Link>
          <span>/</span>
          <span className="font-label-code text-on-surface font-medium">
            {task.taskKey || task.id.slice(-6).toUpperCase()}
          </span>
        </div>

        {/* Grid layout: Task Details & Inspector Sidebar */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Main Content Area */}
          <div className="xl:col-span-8 flex flex-col gap-6">
            <div className="p-6 rounded-lg bg-surface-container-low border border-outline-variant/30 shadow-sm flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-label-code text-label-code text-outline uppercase font-semibold">
                      {task.project?.name || "Project"}
                    </span>
                    <span className="text-outline">•</span>
                    <span className="font-label-code text-label-code text-primary font-semibold">
                      {task.taskKey}
                    </span>
                  </div>
                  <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
                    {task.title}
                  </h1>
                </div>
              </div>

              <div>
                <h4 className="text-outline text-[11px] font-label-badge uppercase tracking-wider mb-1">
                  Description
                </h4>
                <p className="text-body-sm text-on-surface-variant mt-2 leading-relaxed">
                  {task.description || "No detailed description provided."}
                </p>
              </div>

              {/* Subtasks Component */}
              <div className="flex flex-col gap-3 pt-4 border-t border-outline-variant/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-primary">checklist</span>
                    <span className="font-headline-sm text-body-md text-on-surface font-semibold">Subtasks</span>
                    <span className="text-[11px] font-label-code text-outline">
                      ({doneCount}/{subtasks.length} done)
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-outline-variant/20 rounded-lg bg-surface-container-lowest border border-outline-variant/20 overflow-hidden">
                  {subtasks.map((st) => {
                    const isDone = st.status === "DONE";
                    return (
                      <div
                        key={st.id}
                        onClick={() => toggleSubtask(st)}
                        className="p-3 flex items-center gap-3 hover:bg-surface-container/50 transition-colors cursor-pointer"
                      >
                        <button
                          type="button"
                          className={`w-4 h-4 rounded-xs border flex items-center justify-center transition-colors ${
                            isDone
                              ? "bg-primary-container border-primary-container text-on-primary-container"
                              : "border-outline-variant bg-surface-container"
                          }`}
                        >
                          {isDone && <span className="material-symbols-outlined text-[12px]">check</span>}
                        </button>
                        <span
                          className={`text-body-sm ${
                            isDone ? "line-through text-outline" : "text-on-surface"
                          }`}
                        >
                          {st.title}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Add Subtask Input */}
                <form onSubmit={addSubtask} className="flex gap-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Add new subtask item..."
                    className="flex-1 h-8 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
                  />
                  <button
                    type="submit"
                    className="px-3 h-8 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-body-sm"
                  >
                    Add
                  </button>
                </form>
              </div>

              {/* Activity & Comment Thread */}
              <div className="flex flex-col gap-3 pt-4 border-t border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-primary">history</span>
                  <span className="font-headline-sm text-body-md text-on-surface font-semibold">Activity & Comments</span>
                </div>

                <div className="flex flex-col gap-2">
                  {task.comments?.map((comment: any) => (
                    <div key={comment.id} className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/20 flex flex-col gap-1 text-body-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-on-surface">{comment.author?.user?.name || "Member"}</span>
                        <span className="text-[10px] font-label-code text-outline">
                          {new Date(comment.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-on-surface-variant text-body-sm">{comment.content}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={addComment} className="flex flex-col gap-2 pt-2">
                  <textarea
                    rows={2}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add comment or technical update..."
                    className="w-full p-2.5 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={addCommentMutation.isPending}
                      className="px-4 py-1.5 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm disabled:opacity-50"
                    >
                      {addCommentMutation.isPending ? "Posting..." : "Post Update"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Right Inspector Sidebar: Properties */}
          <div className="xl:col-span-4 flex flex-col gap-4">
            <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 shadow-sm flex flex-col gap-4">
              <h3 className="font-headline-sm text-body-md text-on-surface font-semibold pb-2 border-b border-outline-variant/20">
                Properties & Metadata
              </h3>

              <div className="flex flex-col gap-3 text-body-sm">
                <div>
                  <label className="block text-outline text-[11px] font-label-badge uppercase mb-1">Status</label>
                  <select
                    value={task.status}
                    onChange={(e) => updateTaskStatusMutation.mutate({ taskId: task.id, status: e.target.value as Task["status"] })}
                    className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm"
                  >
                    <option value="BACKLOG">Backlog</option>
                    <option value="TODO">Todo</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="DONE">Done</option>
                    <option value="CANCELED">Canceled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-outline text-[11px] font-label-badge uppercase mb-1">Priority</label>
                  <select
                    value={task.priority}
                    onChange={(e) => updateTaskMutation.mutate({ taskId: task.id, data: { priority: e.target.value as Task["priority"] } })}
                    className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm"
                  >
                    <option value="URGENT">Urgent</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-outline text-[11px] font-label-badge uppercase">Assignees & Squad</label>
                    <span className="text-[10px] text-primary font-label-code">
                      {task.assignees?.length || 0} Assigned
                    </span>
                  </div>

                  {/* Primary Owner Dropdown */}
                  <div>
                    <label className="block text-outline text-[10px] mb-1">Primary Owner (Lead)</label>
                    <select
                      value={task.assignees?.find((a) => a.isPrimary)?.member?.id || task.assignees?.[0]?.member?.id || ""}
                      onChange={(e) => {
                        const newPrimaryId = e.target.value;
                        if (!newPrimaryId) {
                          handleAssigneeChange([]);
                          return;
                        }
                        const existingContributors = (task.assignees || [])
                          .filter((a) => a.member?.id !== newPrimaryId)
                          .map((a) => ({ memberId: a.member.id, isPrimary: false, allocatedHours: a.allocatedHours }));
                        handleAssigneeChange([
                          { memberId: newPrimaryId, isPrimary: true },
                          ...existingContributors,
                        ]);
                      }}
                      className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm"
                    >
                      <option value="">Unassigned</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                      ))}
                    </select>
                  </div>

                  {/* Contributors Multi-Pill Selector */}
                  <div className="pt-1">
                    <label className="block text-outline text-[10px] mb-1">Contributors</label>
                    <div className="flex flex-wrap gap-1 p-1.5 rounded-lg bg-surface-container border border-outline-variant/30">
                      {members.map((m) => {
                        const isPrimary = task.assignees?.some((a) => a.member?.id === m.id && a.isPrimary);
                        const isContributor = task.assignees?.some((a) => a.member?.id === m.id && !a.isPrimary);
                        if (isPrimary) return null;

                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              const currentPrimary = task.assignees?.find((a) => a.isPrimary);
                              let newAssignees: { memberId: string; isPrimary?: boolean; allocatedHours?: number }[] = [];
                              if (currentPrimary) {
                                newAssignees.push({ memberId: currentPrimary.member.id, isPrimary: true });
                              }
                              const otherContribs = (task.assignees || [])
                                .filter((a) => !a.isPrimary && a.member.id !== m.id)
                                .map((a) => ({ memberId: a.member.id, isPrimary: false }));

                              if (isContributor) {
                                newAssignees = [...newAssignees, ...otherContribs];
                              } else {
                                newAssignees = [...newAssignees, ...otherContribs, { memberId: m.id, isPrimary: false }];
                              }
                              handleAssigneeChange(newAssignees);
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors border ${
                              isContributor
                                ? "bg-primary-container/30 border-primary text-primary"
                                : "bg-surface-container-high border-outline-variant/30 text-outline hover:text-on-surface"
                            }`}
                          >
                            {m.name.split(" ")[0]} {isContributor ? "✓" : "+"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-outline-variant/20 flex flex-col gap-2">
                  <div className="flex justify-between text-[11px] text-outline font-label-code">
                    <span>Logged Hours</span>
                    <span className="text-on-surface font-medium">{task.actualHours || 0}h</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-outline font-label-code">
                    <span>Estimated</span>
                    <span className="text-on-surface font-medium">{task.estimatedHours || 0}h</span>
                  </div>
                  <Link
                    href={`/time-tracking?taskId=${task.id}`}
                    className="w-full text-center py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary text-body-sm font-medium border border-outline-variant/30 mt-2 transition-colors"
                  >
                    Track Time on {task.taskKey || "Task"}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Capacity Warning Soft Modal */}
      <CapacityWarningModal
        isOpen={warningModalOpen}
        memberName={warningMemberName}
        currentAssignedHours={warningAssignedHours}
        additionalHours={warningAdditionalHours}
        totalCapacityHours={warningCapacityHours}
        onConfirm={confirmOverloadedAssignee}
        onCancel={() => {
          setWarningModalOpen(false);
          setPendingAssigneeId(null);
        }}
      />
    </div>
  );
}


export default function TaskDetailPage({ taskId }: TaskDetailPageProps = {}) {
  return (
    <React.Suspense fallback={<div className="p-8 text-outline text-body-sm">Loading task details...</div>}>
      <TaskDetailContent taskId={taskId} />
    </React.Suspense>
  );
}
