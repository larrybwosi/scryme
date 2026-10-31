"use client";

import Link from "next/link";
import React, { useState } from "react";

interface GanttBar {
  id: string;
  title: string;
  assignee: string;
  avatar: string;
  startOffsetDays: number;
  durationDays: number;
  progress: number;
  color: string;
  dependencies?: string[];
}

const GANTT_TASKS: GanttBar[] = [
  {
    id: "SCR-104",
    title: "Interactive Analytics Dashboard & Real-time Canvas",
    assignee: "Elena Rostova",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=faces",
    startOffsetDays: 2,
    durationDays: 14,
    progress: 75,
    color: "bg-primary-container",
  },
  {
    id: "SCR-102",
    title: "WebGL 60FPS memory-mapped viewport pipeline",
    assignee: "Marcus Vance",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=faces",
    startOffsetDays: 5,
    durationDays: 10,
    progress: 40,
    color: "bg-secondary-container",
    dependencies: ["SCR-104"],
  },
  {
    id: "SCR-103",
    title: "Design tokens schema validation with Zod guards",
    assignee: "Sarah Chen",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&crop=faces",
    startOffsetDays: 1,
    durationDays: 8,
    progress: 95,
    color: "bg-emerald-600/80",
  },
  {
    id: "SCR-105",
    title: "SAML 2.0 automated metadata rotation suite",
    assignee: "Elena Rostova",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=faces",
    startOffsetDays: 12,
    durationDays: 12,
    progress: 20,
    color: "bg-amber-600/80",
    dependencies: ["SCR-103"],
  },
  {
    id: "SCR-106",
    title: "STOMP WebSocket reconnection exponential backoff",
    assignee: "Marcus Vance",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=faces",
    startOffsetDays: 16,
    durationDays: 8,
    progress: 0,
    color: "bg-surface-container-highest",
    dependencies: ["SCR-102"],
  },
];

const TOTAL_TIMELINE_DAYS = 28;

export default function GanttPage() {
  const [zoomLevel, setZoomLevel] = useState<"days" | "weeks" | "months" | "quarters">("days");
  const [showDependencies, setShowDependencies] = useState(true);
  const [showMilestonesOnly, setShowMilestonesOnly] = useState(false);
  const [scrollToday, setScrollToday] = useState(false);

  const handleJumpToday = () => {
    setScrollToday(true);
    setTimeout(() => setScrollToday(false), 1500);
  };

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="flex flex-col w-full">
        {/* Top Metagame / Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 mb-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-[2px] bg-primary-container"></span>
              <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight">Roadmap Gantt</span>
              <span className="font-label-code text-label-code text-outline px-1.5 py-0.5 rounded bg-surface-container-high">v2.4</span>
            </div>

            {/* Zoom Level Segmented Control */}
            <div className="flex items-center bg-surface-container-lowest p-0.5 rounded-lg border border-outline-variant/30 shadow-sm">
              {(["days", "weeks", "months", "quarters"] as const).map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => setZoomLevel(z)}
                  className={`px-2.5 py-1 text-label-badge font-label-badge rounded-md capitalize transition-all ${
                    zoomLevel === z
                      ? "bg-primary-container text-on-primary-container font-medium shadow-sm"
                      : "text-outline hover:text-on-surface"
                  }`}
                >
                  {z}
                </button>
              ))}
            </div>

            {/* Quick Today Jump */}
            <button
              type="button"
              onClick={handleJumpToday}
              className={`flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high font-body-sm text-body-sm border border-outline-variant/30 transition-all ${
                scrollToday ? "ring-2 ring-primary" : ""
              }`}
            >
              <span className="material-symbols-outlined text-[15px] text-primary">my_location</span>
              <span>Today</span>
              <span className="font-label-kbd text-label-kbd text-outline ml-1">T</span>
            </button>
          </div>

          {/* Right Action Cluster: Dependency Line Toggle & Milestones */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDependencies(!showDependencies)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high font-body-sm text-body-sm border border-outline-variant/30 transition-colors ${
                showDependencies ? "text-on-surface" : "text-outline"
              }`}
            >
              <span className={`material-symbols-outlined text-[15px] ${showDependencies ? "text-primary" : "text-outline"}`}>
                account_tree
              </span>
              <span>Dependencies</span>
              <span className={`w-1.5 h-1.5 rounded-full ${showDependencies ? "bg-primary" : "bg-outline"}`}></span>
            </button>

            <button
              type="button"
              onClick={() => setShowMilestonesOnly(!showMilestonesOnly)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high font-body-sm text-body-sm border border-outline-variant/30 transition-colors ${
                showMilestonesOnly ? "text-secondary font-medium" : "text-outline"
              }`}
            >
              <span className="material-symbols-outlined text-[15px] text-secondary">diamond</span>
              <span>Milestones Only</span>
            </button>

            <Link
              href="/board"
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm border border-outline-variant/30"
            >
              <span className="material-symbols-outlined text-[15px]">view_kanban</span>
              <span>Board</span>
            </Link>
          </div>
        </div>

        {/* Main Dual Pane Gantt Canvas */}
        <div className="grid grid-cols-1 xl:grid-cols-12 rounded-lg border border-outline-variant/30 bg-surface-container-low shadow-sm overflow-hidden">
          {/* Left Table Rail: Issues and Owners */}
          <div className="xl:col-span-4 border-r border-outline-variant/30 bg-surface-container-low/60 flex flex-col">
            <div className="p-3 bg-surface-container-high/40 border-b border-outline-variant/30 font-label-badge text-outline text-[11px] uppercase tracking-wider flex items-center justify-between">
              <span>Task & Assignee</span>
              <span>Progress</span>
            </div>
            <div className="divide-y divide-outline-variant/20 flex flex-col">
              {GANTT_TASKS.map((task) => (
                <div key={task.id} className="p-3 h-14 flex items-center justify-between hover:bg-surface-container transition-colors">
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <img src={task.avatar} alt={task.assignee} className="w-5 h-5 rounded-full object-cover shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-label-code text-[11px] text-primary">{task.id}</span>
                        {task.dependencies && showDependencies && (
                          <span className="text-[9px] px-1 rounded bg-surface-container-high text-outline">
                            🔗 {task.dependencies.join(", ")}
                          </span>
                        )}
                      </div>
                      <div className="text-[12px] text-on-surface truncate">{task.title}</div>
                    </div>
                  </div>
                  <span className="font-label-code text-[11px] text-outline shrink-0">{task.progress}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Gantt Timeline Canvas */}
          <div className="xl:col-span-8 flex flex-col overflow-x-auto">
            {/* Timeline Header (Days 1 to 28) */}
            <div className="flex border-b border-outline-variant/30 bg-surface-container-high/40 font-label-code text-[10px] text-outline py-2.5 min-w-[700px]">
              {Array.from({ length: TOTAL_TIMELINE_DAYS }).map((_, i) => {
                const dayNum = i + 1;
                const isCurrent = dayNum === 14;
                return (
                  <div
                    key={i}
                    className={`flex-1 text-center border-r border-outline-variant/10 last:border-0 ${
                      isCurrent ? "text-primary font-bold bg-primary/10" : ""
                    }`}
                  >
                    Oct {dayNum}
                  </div>
                );
              })}
            </div>

            {/* Timeline Task Bars */}
            <div className="flex flex-col divide-y divide-outline-variant/15 min-w-[700px] relative">
              {/* Today Vertical Guideline */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-primary/60 pointer-events-none z-10"
                style={{ left: `${(13.5 / TOTAL_TIMELINE_DAYS) * 100}%` }}
              >
                <div className="bg-primary text-[9px] text-white px-1 py-0.2 rounded font-label-code absolute -top-1 -translate-x-1/2">
                  Today
                </div>
              </div>

              {GANTT_TASKS.map((task) => {
                const leftPct = (task.startOffsetDays / TOTAL_TIMELINE_DAYS) * 100;
                const widthPct = (task.durationDays / TOTAL_TIMELINE_DAYS) * 100;

                return (
                  <div key={task.id} className="h-14 flex items-center px-1 relative">
                    <div
                      className={`h-7 rounded-md ${task.color} shadow-xs relative flex items-center px-2 group cursor-pointer hover:brightness-110 transition-all`}
                      style={{
                        marginLeft: `${leftPct}%`,
                        width: `${widthPct}%`,
                      }}
                    >
                      {/* Internal Progress Bar */}
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-white/20 rounded-l-md pointer-events-none"
                        style={{ width: `${task.progress}%` }}
                      ></div>
                      <span className="font-label-code text-[11px] text-white truncate z-10 font-medium">
                        {task.title}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
