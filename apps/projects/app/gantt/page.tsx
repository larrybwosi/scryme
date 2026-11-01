"use client";

import Link from "next/link";
import React, { useState } from "react";
import { useTasks, useProjects } from "@/lib/hooks/use-projects";

const TOTAL_TIMELINE_DAYS = 28;

export default function GanttPage() {
  const { data: projects = [] } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const currentProjectId = selectedProjectId || (projects[0]?.id || "");

  const { data: tasks = [], isLoading } = useTasks(currentProjectId || undefined);
  const [zoomLevel, setZoomLevel] = useState<"days" | "weeks" | "months">("days");

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="flex flex-col w-full">
        {/* Top Metagame / Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 mb-2">
          <div className="flex items-center gap-3">
            {projects.length > 0 ? (
              <select
                value={currentProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="font-headline-sm text-headline-sm text-on-surface bg-transparent border-0 tracking-tight font-semibold focus:outline-none cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-surface-container-high text-on-surface">
                    {p.name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight">Roadmap Gantt</span>
            )}

            {/* Zoom Level Segmented Control */}
            <div className="flex items-center bg-surface-container-lowest p-0.5 rounded-lg border border-outline-variant/30 shadow-sm">
              {(["days", "weeks", "months"] as const).map((z) => (
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
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/board"
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm border border-outline-variant/30"
            >
              <span className="material-symbols-outlined text-[15px]">view_kanban</span>
              <span>Board</span>
            </Link>
          </div>
        </div>

        {isLoading && (
          <div className="w-full py-16 text-center text-outline text-body-sm">
            Loading Gantt chart...
          </div>
        )}

        {!isLoading && tasks.length === 0 && (
          <div className="p-12 rounded-lg bg-surface-container-low border border-dashed border-outline-variant/30 text-center text-outline text-body-sm">
            No issues found in this project to display on the timeline.
          </div>
        )}

        {!isLoading && tasks.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-12 rounded-lg border border-outline-variant/30 bg-surface-container-low shadow-sm overflow-hidden">
            {/* Left Table Rail */}
            <div className="xl:col-span-4 border-r border-outline-variant/30 bg-surface-container-low/60 flex flex-col">
              <div className="p-3 bg-surface-container-high/40 border-b border-outline-variant/30 font-label-badge text-outline text-[11px] uppercase tracking-wider flex items-center justify-between">
                <span>Task & Assignee</span>
                <span>Status</span>
              </div>
              <div className="divide-y divide-outline-variant/20 flex flex-col">
                {tasks.map((task) => (
                  <div key={task.id} className="p-3 h-14 flex items-center justify-between hover:bg-surface-container transition-colors">
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <div className="min-w-0">
                        <span className="font-label-code text-[11px] text-primary">
                          {task.taskKey || task.id.slice(-6)}
                        </span>
                        <div className="text-[12px] text-on-surface truncate">{task.title}</div>
                      </div>
                    </div>
                    <span className="font-label-code text-[11px] text-outline shrink-0">{task.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Gantt Timeline Canvas */}
            <div className="xl:col-span-8 flex flex-col overflow-x-auto">
              <div className="flex border-b border-outline-variant/30 bg-surface-container-high/40 font-label-code text-[10px] text-outline py-2.5 min-w-[700px]">
                {Array.from({ length: TOTAL_TIMELINE_DAYS }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 text-center border-r border-outline-variant/10 last:border-0"
                  >
                    Day {i + 1}
                  </div>
                ))}
              </div>

              <div className="flex flex-col divide-y divide-outline-variant/15 min-w-[700px] relative">
                {tasks.map((task, idx) => {
                  const startOffset = (idx * 3) % 18;
                  const duration = Math.max(4, Math.min(10, Number(task.estimatedHours) || 6));
                  const leftPct = (startOffset / TOTAL_TIMELINE_DAYS) * 100;
                  const widthPct = (duration / TOTAL_TIMELINE_DAYS) * 100;
                  const isDone = task.status === "DONE";

                  return (
                    <div key={task.id} className="h-14 flex items-center px-1 relative">
                      <div
                        className={`h-7 rounded-md ${isDone ? "bg-emerald-600/80" : "bg-primary-container"} shadow-xs relative flex items-center px-2 group cursor-pointer hover:brightness-110 transition-all`}
                        style={{
                          marginLeft: `${leftPct}%`,
                          width: `${widthPct}%`,
                        }}
                      >
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
        )}
      </div>
    </div>
  );
}
