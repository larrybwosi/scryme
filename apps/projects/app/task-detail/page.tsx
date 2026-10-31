"use client";

import Link from "next/link";
import React, { useState } from "react";

interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

interface ActivityItem {
  id: string;
  author: string;
  avatar: string;
  action: string;
  time: string;
}

export default function TaskDetailPage() {
  const [taskStatus, setTaskStatus] = useState("In Progress");
  const [taskPriority, setTaskPriority] = useState("Urgent");
  const [taskAssignee, setTaskAssignee] = useState("Elena Rostova");
  const [taskCycle, setTaskCycle] = useState("Sprint 14");
  const [copied, setCopied] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(true);
  const [subtasks, setSubtasks] = useState<Subtask[]>([
    { id: "sub-1", title: "Render WebGL frame-rate canvas telemetry", done: true },
    { id: "sub-2", title: "Bind memory-mapped buffer pooling hook", done: true },
    { id: "sub-3", title: "Validate WebSocket heartbeat disconnect reconnection", done: false },
    { id: "sub-4", title: "Profile garbage collector overhead on 10,000 nodes", done: false },
  ]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [activities, setActivities] = useState<ActivityItem[]>([
    {
      id: "act-1",
      author: "Elena Rostova",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=faces",
      action: "pushed commit 8a4f91b · memory pool reuse",
      time: "45 mins ago",
    },
    {
      id: "act-2",
      author: "Marcus Vance",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=faces",
      action: "changed status from Todo to In Progress",
      time: "3 hours ago",
    },
  ]);
  const [commentText, setCommentText] = useState("");

  const toggleSubtask = (id: string) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s))
    );
  };

  const addSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    setSubtasks([
      ...subtasks,
      { id: `sub-${Date.now()}`, title: newSubtaskTitle.trim(), done: false },
    ]);
    setNewSubtaskTitle("");
  };

  const addComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setActivities([
      {
        id: `act-${Date.now()}`,
        author: "Current Engineer",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=faces",
        action: `commented: "${commentText.trim()}"`,
        time: "Just now",
      },
      ...activities,
    ]);
    setCommentText("");
  };

  const handleCopyLink = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const doneCount = subtasks.filter((s) => s.done).length;

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="flex flex-col w-full">
        {/* Top Navigation & Action Context Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 mb-2 border-b border-outline-variant/30">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-body-sm text-outline">
            <Link href="/projects" className="hover:text-on-surface">Nexus 2.0 Redesign</Link>
            <span>/</span>
            <Link href="/tasks" className="hover:text-on-surface">Issues</Link>
            <span>/</span>
            <span className="font-label-code text-on-surface font-semibold">SCR-104</span>
            <span className="px-1.5 py-0.2 rounded bg-surface-container text-[11px] font-label-code text-primary">
              Sprint 14
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
              <kbd className="font-label-kbd text-[10px] text-outline ml-1">⌘L</kbd>
            </button>

            <button
              type="button"
              onClick={() => setIsSubscribed(!isSubscribed)}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg font-body-sm text-body-sm border border-outline-variant/30 transition-colors ${
                isSubscribed
                  ? "bg-primary-container text-on-primary-container"
                  : "bg-surface-container text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">
                {isSubscribed ? "notifications_active" : "notifications"}
              </span>
              <span>{isSubscribed ? "Subscribed" : "Subscribe"}</span>
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
                  SCR-104: Interactive Analytics Dashboard & Real-time Canvas
                </h1>
                <p className="text-body-md text-on-surface-variant mt-2 leading-relaxed">
                  Design and execute the primary engineering telemetry workspace view. Render real-time WebGL buffer frames, connect to the Socket.IO cluster, and track cycle velocities with sub-16ms interactive response rates.
                </p>
              </div>

              {/* Subtasks / Checklist Component */}
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
                  {subtasks.map((st) => (
                    <div
                      key={st.id}
                      onClick={() => toggleSubtask(st.id)}
                      className="p-3 flex items-center gap-3 hover:bg-surface-container/50 transition-colors cursor-pointer"
                    >
                      <button
                        type="button"
                        className={`w-4 h-4 rounded-xs border flex items-center justify-center transition-colors ${
                          st.done
                            ? "bg-primary-container border-primary-container text-on-primary-container"
                            : "border-outline-variant bg-surface-container"
                        }`}
                      >
                        {st.done && <span className="material-symbols-outlined text-[12px]">check</span>}
                      </button>
                      <span
                        className={`text-body-sm ${
                          st.done ? "line-through text-outline" : "text-on-surface"
                        }`}
                      >
                        {st.title}
                      </span>
                    </div>
                  ))}
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
                  <span className="font-headline-sm text-body-md text-on-surface font-semibold">Activity & History</span>
                </div>

                <div className="flex flex-col gap-2">
                  {activities.map((act) => (
                    <div key={act.id} className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-between text-body-sm">
                      <div className="flex items-center gap-2">
                        <img src={act.avatar} alt={act.author} className="w-5 h-5 rounded-full object-cover" />
                        <span className="font-medium text-on-surface">{act.author}</span>
                        <span className="text-outline">{act.action}</span>
                      </div>
                      <span className="text-[10px] font-label-code text-outline">{act.time}</span>
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
                      className="px-4 py-1.5 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm"
                    >
                      Post Update
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
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm"
                  >
                    <option value="Backlog">Backlog</option>
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="In Review">In Review</option>
                    <option value="Done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block text-outline text-[11px] font-label-badge uppercase mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm"
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-outline text-[11px] font-label-badge uppercase mb-1">Assignee</label>
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm"
                  >
                    <option value="Elena Rostova">Elena Rostova</option>
                    <option value="Marcus Vance">Marcus Vance</option>
                    <option value="Sarah Chen">Sarah Chen</option>
                    <option value="David Kim">David Kim</option>
                  </select>
                </div>

                <div>
                  <label className="block text-outline text-[11px] font-label-badge uppercase mb-1">Cycle / Sprint</label>
                  <select
                    value={taskCycle}
                    onChange={(e) => setTaskCycle(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm"
                  >
                    <option value="Sprint 14">Sprint 14 (Active)</option>
                    <option value="Sprint 15">Sprint 15</option>
                    <option value="Sprint 16">Sprint 16</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-outline-variant/20 flex flex-col gap-2">
                  <div className="flex justify-between text-[11px] text-outline font-label-code">
                    <span>Logged Hours</span>
                    <span className="text-on-surface font-medium">14h 20m</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-outline font-label-code">
                    <span>Estimated</span>
                    <span className="text-on-surface font-medium">20h 00m</span>
                  </div>
                  <Link
                    href="/time-tracking"
                    className="w-full text-center py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary text-body-sm font-medium border border-outline-variant/30 mt-2 transition-colors"
                  >
                    Track Time on SCR-104
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
