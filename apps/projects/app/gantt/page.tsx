"use client";

import Link from "next/link";
import React, { useState, useMemo } from "react";
import { useTasks, useProjects } from "@/lib/hooks/use-projects";

export default function GanttPage() {
  const { data: projects = [] } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const currentProjectId = selectedProjectId || (projects[0]?.id || "");

  const { data: tasks = [], isLoading } = useTasks(currentProjectId || undefined);
  const [zoomLevel, setZoomLevel] = useState<"days" | "weeks" | "months">("days");

  // Determine date bounds
  const { timelineStart, totalUnits, scaleDays } = useMemo(() => {
    const now = new Date();
    let minDate = new Date(now);
    let maxDate = new Date(now);
    maxDate.setDate(maxDate.getDate() + 28);

    tasks.forEach((t) => {
      if (t.startDate) {
        const s = new Date(t.startDate);
        if (!isNaN(s.getTime()) && s < minDate) minDate = s;
      }
      if (t.dueDate) {
        const d = new Date(t.dueDate);
        if (!isNaN(d.getTime()) && d > maxDate) maxDate = d;
      }
    });

    // Normalize start to beginning of day
    const start = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
    const totalDays = Math.max(28, Math.ceil((maxDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 7);

    return {
      timelineStart: start,
      totalUnits: zoomLevel === "days" ? totalDays : zoomLevel === "weeks" ? Math.ceil(totalDays / 7) : Math.ceil(totalDays / 30),
      scaleDays: totalDays,
    };
  }, [tasks, zoomLevel]);

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="flex flex-col w-full">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 mb-2">
          <div className="flex flex-wrap items-center gap-3">
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
            <Link
              href="/tasks"
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm border border-outline-variant/30"
            >
              <span className="material-symbols-outlined text-[15px]">view_agenda</span>
              <span>Tasks</span>
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
                <span>Due Date</span>
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
                    <span className="font-label-code text-[11px] text-outline shrink-0">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "--"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Gantt Timeline Canvas */}
            <div className="xl:col-span-8 flex flex-col overflow-x-auto">
              {/* Timeline Header Track */}
              <div className="flex border-b border-outline-variant/30 bg-surface-container-high/40 font-label-code text-[10px] text-outline py-2.5 min-w-[700px]">
                {Array.from({ length: totalUnits }).map((_, i) => {
                  let label = `Day ${i + 1}`;
                  if (zoomLevel === "days") {
                    const d = new Date(timelineStart);
                    d.setDate(timelineStart.getDate() + i);
                    label = `${d.getDate()} ${d.toLocaleString("default", { month: "short" })}`;
                  } else if (zoomLevel === "weeks") {
                    label = `Wk ${i + 1}`;
                  } else {
                    label = `Mo ${i + 1}`;
                  }

                  return (
                    <div
                      key={i}
                      className="flex-1 text-center border-r border-outline-variant/10 last:border-0 truncate px-1"
                    >
                      {label}
                    </div>
                  );
                })}
              </div>

              {/* Task Timeline Bars */}
              <div className="flex flex-col divide-y divide-outline-variant/15 min-w-[700px] relative">
                {tasks.map((task, idx) => {
                  // Calculate start offset and duration in days relative to timelineStart
                  const taskStart = task.startDate ? new Date(task.startDate) : null;
                  const taskEnd = task.dueDate ? new Date(task.dueDate) : null;

                  let startDay = 0;
                  if (taskStart && !isNaN(taskStart.getTime())) {
                    startDay = Math.max(0, Math.floor((taskStart.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24)));
                  } else {
                    startDay = (idx * 2) % (scaleDays - 5);
                  }

                  let durationDays = 3;
                  if (taskEnd && !isNaN(taskEnd.getTime())) {
                    const endDay = Math.floor((taskEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
                    durationDays = Math.max(1, endDay - startDay);
                  } else {
                    durationDays = Math.max(2, Math.min(8, Number(task.estimatedHours) ? Math.ceil(Number(task.estimatedHours) / 8) : 3));
                  }

                  const leftPct = Math.min(95, (startDay / scaleDays) * 100);
                  const widthPct = Math.max(3, Math.min(100 - leftPct, (durationDays / scaleDays) * 100));
                  const isDone = task.status === "DONE";

                  return (
                    <div key={task.id} className="h-14 flex items-center px-1 relative">
                      <Link
                        href={`/tasks/${task.id}`}
                        className={`h-7 rounded-md ${
                          isDone
                            ? "bg-emerald-600/80"
                            : task.priority === "URGENT"
                            ? "bg-red-500/80"
                            : "bg-primary-container"
                        } shadow-xs relative flex items-center px-2 group cursor-pointer hover:brightness-110 transition-all`}
                        style={{
                          marginLeft: `${leftPct}%`,
                          width: `${widthPct}%`,
                        }}
                        title={`${task.title} (${task.status})`}
                      >
                        <span className="font-label-code text-[11px] text-white truncate z-10 font-medium">
                          {task.title}
                        </span>
                      </Link>
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
