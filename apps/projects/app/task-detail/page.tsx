"use client";

import Link from "next/link";
import React, { useState } from "react";
import {
  useTask,
  useUpdateTask,
  useUpdateTaskStatus,
  useSubtasks,
  useCreateTask,
  useAddTaskComment,
  useMembers,
  useManageTaskAssignees,
} from "@/lib/hooks/use-projects";
import { Task } from "@/lib/api";

export default function TaskDetailPage({ taskId }: { taskId: string }) {
  const { data: task, isLoading } = useTask(taskId);
  const { data: subtasks = [] } = useSubtasks(taskId);
  const { data: members = [] } = useMembers();

  const updateTaskMutation = useUpdateTask(task?.projectId);
  const updateTaskStatusMutation = useUpdateTaskStatus(task?.projectId);
  const createSubtaskMutation = useCreateTask(task?.projectId);
  const addCommentMutation = useAddTaskComment(taskId);
  const manageAssigneesMutation = useManageTaskAssignees(taskId);

  const [copied, setCopied] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [commentText, setCommentText] = useState("");

  if (isLoading) {
    return (
      <div className="flex flex-col w-full p-8 text-outline text-body-sm">
        Loading task details...
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col w-full p-8 text-outline text-body-sm">
        Task not found.
      </div>
    );
  }

  const toggleSubtask = (subtask: Task) => {
    const nextStatus = subtask.status === "DONE" ? "TODO" : "DONE";
    updateTaskStatusMutation.mutate({ taskId: subtask.id, status: nextStatus });
  };

  const addSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !task.projectId) return;

    await createSubtaskMutation.mutateAsync({
      title: newSubtaskTitle.trim(),
      projectId: task.projectId,
      parentTaskId: task.id,
      status: "TODO",
    });
    setNewSubtaskTitle("");
  };

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    await addCommentMutation.mutateAsync(commentText.trim());
    setCommentText("");
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const doneCount = subtasks.filter((s) => s.status === "DONE").length;

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="flex flex-col w-full">
        {/* Top Navigation & Action Context Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 mb-2 border-b border-outline-variant/30">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-body-sm text-outline">
            <Link href={`/projects/${task.projectId}?tab=overview`} className="hover:text-on-surface">
              {task.project?.name || "Project"}
            </Link>
            <span>/</span>
            <Link href="/tasks" className="hover:text-on-surface">Issues</Link>
            <span>/</span>
            <span className="font-label-code text-on-surface font-semibold">
              {task.taskKey || task.id.slice(-6).toUpperCase()}
            </span>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm border border-outline-variant/30 transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">
                {copied ? "check" : "link"}
              </span>
              <span>{copied ? "Copied!" : "Copy Link"}</span>
            </button>
          </div>
        </div>

        {/* Main Grid: Issue Canvas (Left) + Inspector Sidebar (Right) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start mt-2">
          {/* Left Canvas: Issue Content */}
          <div className="xl:col-span-8 flex flex-col gap-6">
            <div className="p-6 rounded-lg bg-surface-container-low border border-outline-variant/30 shadow-sm flex flex-col gap-6">
              {/* Header Title */}
              <div>
                <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-semibold">
                  {task.taskKey ? `${task.taskKey}: ` : ""}{task.title}
                </h1>
                <p className="text-body-md text-on-surface-variant mt-2 leading-relaxed">
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

                <div>
                  <label className="block text-outline text-[11px] font-label-badge uppercase mb-1">Assignee</label>
                  <select
                    value={task.assignees?.[0]?.member?.id || ""}
                    onChange={(e) => {
                      const memberId = e.target.value;
                      manageAssigneesMutation.mutate(memberId ? [memberId] : []);
                    }}
                    className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                    ))}
                  </select>
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
    </div>
  );
}
