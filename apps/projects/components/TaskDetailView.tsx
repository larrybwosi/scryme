"use client";

import { Input } from "@repo/ui/components/ui/input";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select";
import Link from "next/link";
import React, { useState } from "react";
import { ListTodo, Check, History as HistoryIcon, CalendarCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import {
  useTasks,
  useTask,
  useMembers,
  useStaffShifts,
  useSubtasks,
  useCreateTask,
  useUpdateTaskStatus,
  useUpdateTask,
  useManageTaskAssignees,
  useAddTaskComment,
} from "@/lib/hooks/use-projects";
import { usePermissions } from "@/lib/permissions";
import { Task } from "@/lib/api";
import { effectiveWeeklyCapacity, estimateVariance, subtaskProgress } from "@/lib/metrics";
import { CapacityWarningModal } from "@/components/CapacityWarningModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PageError, PageLoading, SavingBadge } from "@/components/PageState";
import { getErrorMessage, notifyError, notifySuccess } from "@/lib/feedback";
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  canTransitionTaskStatus,
  statusChangeNeedsConfirmation,
} from "@/lib/task-status";

interface TaskDetailPageProps {
  taskId?: string;
}

function TaskDetailContent({ taskId: propTaskId }: TaskDetailPageProps) {
  const searchParams = useSearchParams();
  const rawId = propTaskId || searchParams.get("id") || "";

  const { data: allTasks = [] } = useTasks();
  const activeId = rawId;

  const {
    data: task,
    isLoading,
    isError,
    error,
    refetch,
  } = useTask(activeId);

  const { data: subtasks = [] } = useSubtasks(activeId);
  const { data: members = [] } = useMembers();
  const { data: staffShifts = [] } = useStaffShifts();

  const createSubtaskMutation = useCreateTask(task?.projectId);
  const updateTaskStatusMutation = useUpdateTaskStatus();
  const updateTaskMutation = useUpdateTask();
  const manageAssigneesMutation = useManageTaskAssignees(activeId);
  const addCommentMutation = useAddTaskComment(activeId);

  const { canManageTasks } = usePermissions();

  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [commentText, setCommentText] = useState("");
  const [pendingStatus, setPendingStatus] = useState<Task["status"] | null>(null);

  // Capacity Warning Modal State
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [pendingAssignees, setPendingAssignees] = useState<
    { memberId: string; isPrimary?: boolean; allocatedHours?: number }[] | null
  >(null);
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
    const totalCapacity = effectiveWeeklyCapacity(memberShifts);

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
      try {
        await manageAssigneesMutation.mutateAsync([]);
        notifySuccess("Assignees updated");
      } catch (err) {
        notifyError(err, "Could not update assignees");
      }
      return;
    }

    const primary = assignees.find((a) => a.isPrimary) || assignees[0];
    const targetMember = members.find((m) => m.id === primary.memberId);
    const estHours = Number(task?.estimatedHours) || 2;
    const shareHours = primary.allocatedHours || estHours / assignees.length;
    const { currentHours, totalCapacity, isOverloaded } = checkMemberCapacity(primary.memberId, shareHours);

    if (isOverloaded) {
      setPendingAssignees(assignees);
      setWarningMemberName(targetMember?.name || "Lead Assignee");
      setWarningAssignedHours(currentHours);
      setWarningAdditionalHours(shareHours);
      setWarningCapacityHours(totalCapacity);
      setWarningModalOpen(true);
      return;
    }

    try {
      await manageAssigneesMutation.mutateAsync(assignees);
      notifySuccess("Assignees updated");
    } catch (err) {
      notifyError(err, "Could not update assignees");
    }
  };

  const confirmOverloadedAssignee = async () => {
    if (!pendingAssignees) return;
    try {
      await manageAssigneesMutation.mutateAsync(pendingAssignees);
      notifySuccess("Assignees updated");
      setWarningModalOpen(false);
      setPendingAssignees(null);
    } catch (err) {
      notifyError(err, "Could not update assignees");
    }
  };

  const addSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newSubtaskTitle.trim();
    if (!title || !task) return;

    try {
      await createSubtaskMutation.mutateAsync({
        title,
        projectId: task.projectId,
        parentTaskId: task.id,
        status: "TODO",
      });
      notifySuccess("Task created");
      setNewSubtaskTitle("");
    } catch (err) {
      notifyError(err, "Could not create task");
    }
  };

  const changeStatus = async (status: Task["status"]) => {
    if (!task) return;
    try {
      await updateTaskStatusMutation.mutateAsync({ taskId: task.id, status });
      notifySuccess("Status updated");
    } catch (err) {
      notifyError(err, "Could not change status");
    } finally {
      setPendingStatus(null);
    }
  };

  const requestStatusChange = (status: Task["status"]) => {
    if (!task || status === task.status) return;
    if (!canTransitionTaskStatus(task.status, status)) return;
    if (statusChangeNeedsConfirmation(status)) {
      setPendingStatus(status);
      return;
    }
    void changeStatus(status);
  };

  const changePriority = async (priority: Task["priority"]) => {
    if (!task) return;
    try {
      await updateTaskMutation.mutateAsync({ taskId: task.id, data: { priority } });
      notifySuccess("Task updated");
    } catch (err) {
      notifyError(err, "Could not update task");
    }
  };

  const toggleSubtask = async (st: Task) => {
    const nextStatus: Task["status"] = st.status === "DONE" ? "TODO" : "DONE";
    try {
      await updateTaskStatusMutation.mutateAsync({ taskId: st.id, status: nextStatus });
      notifySuccess("Status updated");
    } catch (err) {
      notifyError(err, "Could not change status");
    }
  };

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await addCommentMutation.mutateAsync(commentText.trim());
      notifySuccess("Comment posted");
      setCommentText("");
    } catch (err) {
      notifyError(err, "Could not post comment");
    }
  };

  if (!activeId) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        <PageError
          title="Task not found"
          message="This item was not found. Choose a task from the list to continue."
          backHref="/tasks"
          backLabel="Back to tasks"
        />
      </div>
    );
  }

  if (isLoading) {
    return <PageLoading variant="detail" label="Loading task detail" />;
  }

  if (isError) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 404) {
      return (
        <div className="mx-auto w-full max-w-3xl px-4 py-8">
          <PageError
            title="Task not found"
            message={getErrorMessage(error, "This item was not found")}
            onRetry={() => refetch()}
            backHref="/tasks"
            backLabel="Back to tasks"
          />
        </div>
      );
    }

    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        <PageError
          message={getErrorMessage(error, "Could not load task")}
          onRetry={() => refetch()}
          backHref="/tasks"
          backLabel="Back to tasks"
        />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        <PageError
          title="Task not found"
          message="This item was not found. Choose a task from the list to continue."
          backHref="/tasks"
          backLabel="Back to tasks"
        />
      </div>
    );
  }

  const doneCount = subtasks.filter((st) => st.status === "DONE").length;
  const progressPercent = subtaskProgress(subtasks);
  const estimateDelta = estimateVariance(task.estimatedHours || 0, task.actualHours || 0);

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
                  <h1
                    data-route-heading
                    tabIndex={-1}
                    className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight outline-none"
                  >
                    {task.title}
                  </h1>
                </div>
              </div>

              {/* Customer Booking Integration Banner */}
              {task.bookingId && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarCheck className="h-4 w-4 text-primary" aria-hidden />
                      <span className="text-body-sm font-semibold text-on-surface">
                        Linked Customer Booking
                      </span>
                      <span className="text-[10px] font-label-code px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        #{task.bookingId.slice(-6).toUpperCase()}
                      </span>
                    </div>
                    {task.booking?.status && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-surface-container-highest text-on-surface">
                        {task.booking.status}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-body-sm text-muted-foreground pt-1">
                    <div>
                      <span className="text-outline text-[10px] uppercase block">Service:</span>
                      <span className="text-on-surface font-medium">{task.booking?.serviceName || "Service Delivery"}</span>
                    </div>
                    {task.booking?.customer && (
                      <div>
                        <span className="text-outline text-[10px] uppercase block">Customer:</span>
                        <span className="text-on-surface font-medium">{task.booking.customer.name}</span>
                      </div>
                    )}
                    {task.booking?.scheduledStartTime && (
                      <div className="col-span-full">
                        <span className="text-outline text-[10px] uppercase block">Scheduled Slot:</span>
                        <span className="text-on-surface font-label-code text-[12px]">
                          {new Date(task.booking.scheduledStartTime).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
                    <ListTodo className="h-4 w-4 text-primary" />
                    <span className="font-headline-sm text-body-md text-on-surface font-semibold">Subtasks</span>
                    <span className="text-[11px] font-label-code text-outline">
                      ({doneCount}/{subtasks.length} done)
                    </span>
                  </div>
                  <span className="font-label-code text-[11px] text-primary font-semibold">
                    {progressPercent}% complete
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary-container transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
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
                          {isDone && <Check className="h-3 w-3" />}
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
                  <Input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Add new subtask item..."
                    className="flex-1 h-8 bg-surface-container border-outline-variant text-on-surface text-body-sm focus-visible:border-primary-container"
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
                  <HistoryIcon className="h-4 w-4 text-primary" />
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
                  <Textarea
                    rows={2}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add comment or technical update..."
                    className="w-full p-2.5 bg-surface-container border-outline-variant text-on-surface text-body-sm focus-visible:border-primary-container"
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
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <label className="block text-outline text-[11px] font-label-badge uppercase">
                      Status
                    </label>
                    <SavingBadge saving={updateTaskStatusMutation.isPending} />
                  </div>
                  <Select
                    value={task.status}
                    disabled={!canManageTasks}
                    onValueChange={(val) => requestStatusChange(val as Task["status"])}
                  >
                    <SelectTrigger
                      aria-label="Status"
                      className="w-full h-8 bg-surface-container border-outline-variant text-on-surface text-body-sm disabled:opacity-50"
                    >
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-container border-outline-variant text-on-surface">
                      {TASK_STATUSES.map((status) => (
                        <SelectItem
                          key={status}
                          value={status}
                          disabled={
                            status !== task.status &&
                            !canTransitionTaskStatus(task.status, status)
                          }
                        >
                          {TASK_STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-outline text-[11px] font-label-badge uppercase mb-1">Priority</label>
                  <Select
                    value={task.priority}
                    disabled={!canManageTasks}
                    onValueChange={(val) => changePriority(val as Task["priority"])}
                  >
                    <SelectTrigger
                      aria-label="Priority"
                      className="w-full h-8 bg-surface-container border-outline-variant text-on-surface text-body-sm disabled:opacity-50"
                    >
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent className="bg-surface-container border-outline-variant text-on-surface">
                      <SelectItem value="URGENT">Urgent</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                    </SelectContent>
                  </Select>
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
                    <Select
                      value={task.assignees?.find((a) => a.isPrimary)?.member?.id || task.assignees?.[0]?.member?.id || "UNASSIGNED"}
                      onValueChange={(val) => {
                        const newPrimaryId = val === "UNASSIGNED" ? "" : val;
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
                    >
                      <SelectTrigger className="w-full h-8 bg-surface-container border-outline-variant text-on-surface text-body-sm">
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent className="bg-surface-container border-outline-variant text-on-surface">
                        <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                        {members.map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.name} ({m.role})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  <div className="flex justify-between text-[11px] text-outline font-label-code">
                    <span>Variance</span>
                    <span className={`font-medium ${estimateDelta > 0 ? "text-status-critical" : "text-status-success"}`}>
                      {estimateDelta > 0 ? "+" : ""}{estimateDelta}h
                    </span>
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

      <ConfirmDialog
        open={Boolean(pendingStatus)}
        title={`Move task to ${pendingStatus ? TASK_STATUS_LABELS[pendingStatus] : "new status"}?`}
        description="This status is final for the current stage. You can move the task again later if needed."
        confirmLabel="Change status"
        pending={updateTaskStatusMutation.isPending}
        onCancel={() => setPendingStatus(null)}
        onConfirm={() => {
          if (pendingStatus) void changeStatus(pendingStatus);
        }}
      />

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
          setPendingAssignees(null);
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
