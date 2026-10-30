"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTasks, useLogTimeEntry } from "@/lib/hooks/use-projects";
import {
  Folder,
  Copy,
  Bell,
  Flame,
  Clock,
  User,
  CheckCircle2,
  Send,
  Calendar,
  Tag,
  Check
} from "lucide-react";

function TaskDetailContent() {
  const searchParams = useSearchParams();
  const taskId = searchParams.get("id") || "SCR-104";

  const { data: tasks = [] } = useTasks();
  const logTimeEntry = useLogTimeEntry();

  const [copied, setCopied] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [logHours, setLogHours] = useState("");
  const [comments, setComments] = useState([
    {
      id: "1",
      author: "Arbian Musaf",
      role: "Lead Reviewer",
      time: "6h ago",
      text: "Tested the latest WebGL memory allocators. Memory retention stays under 42MB during peak stress at 25,000 points."
    },
    {
      id: "2",
      author: "Elena Rostova",
      role: "Assignee",
      time: "2h ago",
      text: "Great catch! Added a passive wheel listener with requestAnimationFrame throttling in subtask SCR-104.3."
    }
  ]);

  const task = tasks.find((t) => t.id === taskId) || {
    id: taskId,
    title: "SCR-104: Interactive Analytics Dashboard & Real-time Canvas",
    description: "Implement a 60fps rendering pipeline for the streaming metric topology canvas in @nexus/analytics-canvas. The canvas must handle up to 25,000 live data vectors concurrently with hardware-accelerated pan, zoom, and frame scrubbing.",
    status: "IN_PROGRESS",
    priority: "URGENT",
    estimatedHours: 16,
    actualHours: 14.3
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    setComments([
      ...comments,
      {
        id: Date.now().toString(),
        author: "Engineering Admin",
        role: "Operator",
        time: "Just now",
        text: commentText
      }
    ]);
    setCommentText("");
  };

  const handleLogTime = () => {
    const hours = parseFloat(logHours);
    if (isNaN(hours) || hours <= 0) return;
    logTimeEntry.mutate({ taskId, hours, notes: "Worked on WebGL streaming pipeline" });
    setLogHours("");
  };

  return (
    <div className="space-y-5">
      {/* Action Bar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2E3039]/50 pb-3 text-xs">
        <div className="flex items-center gap-2 min-w-0 text-slate-400">
          <Link href="/projects" className="hover:text-slate-200 transition-colors flex items-center gap-1">
            <Folder className="h-3.5 w-3.5 text-slate-500" />
            <span>Projects</span>
          </Link>
          <span>/</span>
          <Link href="/tasks" className="hover:text-slate-200 transition-colors">
            Nexus 2.0
          </Link>
          <span>/</span>
          <span className="font-mono text-[#5E6AD2] font-semibold">
            {task.id.startsWith("SCR-") ? task.id : `SCR-${task.id.slice(0, 3).toUpperCase()}`}
          </span>
          <span className="px-2 py-0.5 rounded bg-[#171922] border border-[#2E3039] text-slate-300 font-mono text-[10px]">
            Sprint 14
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="h-7 px-2.5 rounded bg-[#171922] hover:bg-[#1f1f23] border border-[#2E3039] text-slate-300 transition-colors flex items-center gap-1.5"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "Copied" : "Copy Link"}</span>
          </button>
          <button
            type="button"
            className="h-7 px-2.5 rounded bg-[#171922] hover:bg-[#1f1f23] border border-[#2E3039] text-slate-300 transition-colors flex items-center gap-1.5"
          >
            <Bell className="h-3.5 w-3.5 text-[#5E6AD2]" />
            <span>Subscribed</span>
          </button>
        </div>
      </div>

      {/* Main Grid Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Main Canvas (Col 8) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Issue Summary Block */}
          <div className="bg-[#12141A] border border-[#2E3039] rounded-lg p-5 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#5E6AD2]/10 text-[#5E6AD2] border border-[#5E6AD2]/20 text-[11px] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5E6AD2] animate-pulse"></span>
                <span>In Progress</span>
              </span>

              <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[11px] font-semibold flex items-center gap-1">
                <Flame className="h-3 w-3" />
                <span>Urgent</span>
              </span>

              <span className="px-2 py-0.5 rounded bg-[#171922] text-slate-400 border border-[#2E3039] text-[11px]">
                Cycle 14 (8h est)
              </span>
            </div>

            <h1 className="text-lg font-bold text-slate-100 tracking-tight leading-snug">
              {task.title}
            </h1>

            <p className="text-xs text-slate-300 leading-relaxed bg-[#171922] p-3 rounded-md border border-[#2E3039]/60">
              {task.description}
            </p>

            {/* Sparkline Architecture Visualizer */}
            <div className="bg-[#0d0e11] border border-[#2E3039]/80 rounded-md p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                <span>Live Telemetry Pipeline Buffer</span>
                <span className="text-[#5E6AD2]">60.2 FPS TARGET</span>
              </div>
              <div className="h-16 bg-[#12141A] rounded flex items-center justify-center border border-[#2E3039]/40 relative overflow-hidden">
                <svg className="w-full h-12 text-[#5E6AD2]" fill="none" viewBox="0 0 600 80" preserveAspectRatio="none">
                  <path d="M0,60 Q40,25 90,45 T180,20 T270,55 T360,15 T450,40 T540,10 T600,25 L600,80 L0,80 Z" fill="currentColor" fillOpacity="0.12" />
                  <path d="M0,60 Q40,25 90,45 T180,20 T270,55 T360,15 T450,40 T540,10 T600,25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Acceptance Criteria Checklist */}
            <div className="space-y-2 pt-2">
              <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#5E6AD2]" />
                <span>Acceptance Criteria</span>
              </h2>

              <div className="space-y-1.5 bg-[#171922] p-3 rounded-md border border-[#2E3039]/60 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input type="checkbox" defaultChecked className="rounded border-[#2E3039] bg-[#0d0e11] text-[#5E6AD2]" />
                  <span className="line-through text-slate-500">Off-screen Canvas instance pooling for WebGL context lifecycle management</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input type="checkbox" defaultChecked className="rounded border-[#2E3039] bg-[#0d0e11] text-[#5E6AD2]" />
                  <span className="line-through text-slate-500">Telemetry stream buffer with &lt; 4ms latency per 10k metrics frame</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input type="checkbox" className="rounded border-[#2E3039] bg-[#0d0e11] text-[#5E6AD2]" />
                  <span>Time-scrubbing controller with smooth timeline scrubbing and inertial drag</span>
                </label>
              </div>
            </div>
          </div>

          {/* Activity Comments & Threading */}
          <div className="bg-[#12141A] border border-[#2E3039] rounded-lg p-5 space-y-4">
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Discussion Feed ({comments.length})
            </h2>

            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="bg-[#171922] p-3 rounded-md border border-[#2E3039]/60 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200">{c.author}</span>
                      <span className="px-1.5 py-0.2 rounded bg-[#1f1f23] text-[10px] text-slate-400">{c.role}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{c.time}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{c.text}</p>
                </div>
              ))}
            </div>

            {/* Comment Composer */}
            <div className="space-y-2 pt-2 border-t border-[#2E3039]/50">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                rows={3}
                className="w-full bg-[#171922] border border-[#2E3039] rounded-md p-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#5E6AD2]"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddComment}
                  className="px-3 py-1.5 bg-[#5E6AD2] hover:bg-[#717DE3] text-white rounded-md text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <Send className="h-3 w-3" />
                  <span>Post Comment</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Inspector Sidebar (Col 4) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Metadata Properties */}
          <div className="bg-[#12141A] border border-[#2E3039] rounded-lg p-4 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-[#2E3039]/50 pb-2">
              Task Properties
            </h2>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-500" />
                  <span>Assignee</span>
                </span>
                <span className="text-slate-200 font-medium">Elena Rostova</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-slate-500" />
                  <span>Labels</span>
                </span>
                <div className="flex gap-1">
                  <span className="px-1.5 py-0.5 rounded bg-[#1f1f23] text-[#5E6AD2] font-mono text-[10px]">frontend</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#1f1f23] text-indigo-300 font-mono text-[10px]">analytics</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  <span>Due Date</span>
                </span>
                <span className="text-slate-200 font-mono">Oct 28, 2024</span>
              </div>
            </div>
          </div>

          {/* Time Logging Widget */}
          <div className="bg-[#12141A] border border-[#2E3039] rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[#5E6AD2]" />
                <span>Time Logged</span>
              </h2>
              <span className="text-xs font-mono text-indigo-300 font-semibold">{task.actualHours || 14.3}h / {task.estimatedHours || 16}h</span>
            </div>

            <div className="w-full bg-[#1f1f23] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#5E6AD2] h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, ((task.actualHours || 14.3) / (task.estimatedHours || 16)) * 100)}%` }}
              ></div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="number"
                step="0.5"
                value={logHours}
                onChange={(e) => setLogHours(e.target.value)}
                placeholder="Hours (e.g. 2.5)"
                className="w-full bg-[#171922] border border-[#2E3039] rounded-md px-2.5 py-1 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#5E6AD2]"
              />
              <button
                type="button"
                onClick={handleLogTime}
                className="px-3 py-1 bg-[#5E6AD2] hover:bg-[#717DE3] text-white rounded-md text-xs font-medium shrink-0 transition-colors"
              >
                Log
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TaskDetailPage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-400 text-xs">Loading task details...</div>}>
      <TaskDetailContent />
    </Suspense>
  );
}
