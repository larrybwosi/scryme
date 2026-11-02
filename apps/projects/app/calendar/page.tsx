"use client";

import Link from "next/link";
import React, { useState, useMemo } from "react";
import { useCalendarEvents, useProjects, useUpdateTask } from "@/lib/hooks/use-projects";
import { usePermissions } from "@/lib/permissions";

interface CalendarItem {
  id: string;
  title: string;
  type: "task" | "milestone" | "sprint";
  date: Date;
  dueDateStr?: string;
  startDateStr?: string;
  status: string;
  priority?: string;
  projectId?: string;
  projectName?: string;
  projectKey?: string;
  taskKey?: string;
  assignees?: { id: string; member: { id: string; user: { name: string; email: string } } }[];
  color: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CalendarPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const { data: projects = [] } = useProjects();
  const { data: calendarData, isLoading } = useCalendarEvents(selectedProjectId || undefined);
  const { canManageTasks } = usePermissions();
  const updateTaskMutation = useUpdateTask(selectedProjectId || undefined);

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);

  const currentYear = currentDate.getFullYear();
  const currentMonthIdx = currentDate.getMonth();
  const currentMonthName = MONTH_NAMES[currentMonthIdx];

  // Derive normalized calendar items from tasks, milestones, and sprints
  const allEvents = useMemo<CalendarItem[]>(() => {
    const list: CalendarItem[] = [];

    if (!calendarData) return list;

    // Tasks with due dates
    for (const t of calendarData.tasks || []) {
      const d = t.dueDate ? new Date(t.dueDate) : t.startDate ? new Date(t.startDate) : null;
      if (d && !isNaN(d.getTime())) {
        list.push({
          id: t.id,
          title: t.title,
          type: "task",
          date: d,
          dueDateStr: t.dueDate,
          startDateStr: t.startDate,
          status: t.status,
          priority: t.priority,
          projectId: t.projectId,
          projectName: t.project?.name,
          projectKey: t.project?.key,
          taskKey: t.taskKey,
          assignees: t.assignees,
          color:
            t.status === "DONE"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              : t.priority === "URGENT"
              ? "bg-red-500/20 text-red-300 border border-red-500/30"
              : "bg-surface-container-high text-primary border border-primary/30",
        });
      }
    }

    // Milestones with due dates
    for (const m of calendarData.milestones || []) {
      if (m.dueDate) {
        const d = new Date(m.dueDate);
        if (!isNaN(d.getTime())) {
          list.push({
            id: m.id,
            title: m.title,
            type: "milestone",
            date: d,
            dueDateStr: m.dueDate,
            status: m.status,
            projectId: m.projectId,
            projectName: m.project?.name,
            projectKey: m.project?.key,
            color: "bg-secondary-container text-on-secondary-container font-semibold border border-secondary/40",
          });
        }
      }
    }

    // Sprints with start or end dates
    for (const s of calendarData.sprints || []) {
      const d = s.endDate ? new Date(s.endDate) : s.startDate ? new Date(s.startDate) : null;
      if (d && !isNaN(d.getTime())) {
        list.push({
          id: s.id,
          title: s.name,
          type: "sprint",
          date: d,
          dueDateStr: s.endDate,
          startDateStr: s.startDate,
          status: s.status,
          projectId: s.projectId,
          projectName: s.project?.name,
          projectKey: s.project?.key,
          color: "bg-primary-container text-on-primary-container font-medium border border-primary/40",
        });
      }
    }

    return list;
  }, [calendarData]);

  const filteredEvents = useMemo(() => {
    return allEvents.filter((ev) => {
      if (filterType !== "all" && ev.type !== filterType) return false;
      return true;
    });
  }, [allEvents, filterType]);

  // Calendar calculations for Month View
  const daysInMonth = new Date(currentYear, currentMonthIdx + 1, 0).getDate();
  const firstDayOfWeek = (new Date(currentYear, currentMonthIdx, 1).getDay() + 6) % 7; // Monday = 0
  const prevMonthDays = new Date(currentYear, currentMonthIdx, 0).getDate();

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(currentYear, currentMonthIdx - 1, 1));
    } else if (viewMode === "week") {
      const next = new Date(currentDate);
      next.setDate(next.getDate() - 7);
      setCurrentDate(next);
    } else {
      const next = new Date(currentDate);
      next.setDate(next.getDate() - 1);
      setCurrentDate(next);
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(currentYear, currentMonthIdx + 1, 1));
    } else if (viewMode === "week") {
      const next = new Date(currentDate);
      next.setDate(next.getDate() + 7);
      setCurrentDate(next);
    } else {
      const next = new Date(currentDate);
      next.setDate(next.getDate() + 1);
      setCurrentDate(next);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Week View Calculations
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const dayOfWeek = (curr.getDay() + 6) % 7; // Monday = 0
    const monday = new Date(curr);
    monday.setDate(curr.getDate() - dayOfWeek);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentDate]);

  const isToday = (year: number, month: number, day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );
  };

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="flex flex-col w-full">
        {/* Top Command & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 mb-2">
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-surface-container-lowest p-0.5 rounded-lg border border-outline-variant/30 shadow-sm">
              {(["month", "week", "day"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 rounded-lg text-body-sm capitalize transition-all ${
                    viewMode === mode
                      ? "bg-surface-container-high text-on-surface font-medium shadow-sm"
                      : "text-outline hover:text-on-surface"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Date Navigator */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrev}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-container-low hover:bg-surface-container text-outline hover:text-on-surface transition-colors"
                title="Previous"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-body-sm text-body-sm transition-colors"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-container-low hover:bg-surface-container text-outline hover:text-on-surface transition-colors"
                title="Next"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>

            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight pl-2">
              {currentMonthName} <span className="text-outline font-normal">{currentYear}</span>
            </h1>
          </div>

          {/* Right Controls: Project scope, Types filter, and Navigation */}
          <div className="flex flex-wrap items-center gap-2">
            {projects.length > 0 && (
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-on-surface text-body-sm focus:outline-none"
              >
                <option value="">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}

            <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded-lg border border-outline-variant/30 text-body-sm">
              <span className="text-outline text-[11px] px-1 font-label-badge">Show:</span>
              {["all", "task", "milestone", "sprint"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFilterType(type)}
                  className={`px-2 py-0.5 rounded text-[11px] font-label-code capitalize transition-colors ${
                    filterType === type
                      ? "bg-surface-container-high text-on-surface font-medium"
                      : "text-outline hover:text-on-surface"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <Link
              href="/schedule"
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm border border-outline-variant/30 transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">date_range</span>
              <span>Schedule</span>
            </Link>
          </div>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="p-4 mb-2 text-center text-outline text-body-sm bg-surface-container-lowest rounded-lg border border-outline-variant/20 animate-pulse">
            Syncing calendar events from workspace API...
          </div>
        )}

        {/* --- MONTH VIEW --- */}
        {viewMode === "month" && (
          <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low shadow-sm overflow-hidden flex flex-col">
            {/* Weekdays Header */}
            <div className="grid grid-cols-7 border-b border-outline-variant/30 bg-surface-container-high/40 text-center font-label-badge text-outline text-[11px] py-2 uppercase tracking-wider">
              {WEEKDAY_NAMES.map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            {/* Month Calendar Grid */}
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-outline-variant/20 min-h-[640px]">
              {/* Previous month trailing days */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => {
                const prevDay = prevMonthDays - firstDayOfWeek + i + 1;
                return (
                  <div key={`offset-prev-${i}`} className="p-2 bg-surface-container-lowest/40 opacity-40">
                    <span className="text-outline font-label-code text-[11px]">{prevDay}</span>
                  </div>
                );
              })}

              {/* Current month days */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const day = idx + 1;
                const todayActive = isToday(currentYear, currentMonthIdx, day);

                const dayEvents = filteredEvents.filter((e) => {
                  return (
                    e.date.getFullYear() === currentYear &&
                    e.date.getMonth() === currentMonthIdx &&
                    e.date.getDate() === day
                  );
                });

                return (
                  <div
                    key={`day-${day}`}
                    className={`p-2 transition-colors flex flex-col min-h-[110px] ${
                      todayActive ? "bg-primary-container/10 border border-primary-container/40" : "hover:bg-surface-container/60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-label-code text-[12px] ${
                          todayActive
                            ? "bg-primary-container text-on-primary-container font-bold"
                            : "text-on-surface"
                        }`}
                      >
                        {day}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[10px] font-label-code text-outline">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    {/* Day Events Pills */}
                    <div className="flex flex-col gap-1 overflow-y-auto max-h-[90px]">
                      {dayEvents.map((ev) => (
                        <button
                          key={`${ev.type}-${ev.id}`}
                          type="button"
                          onClick={() => setSelectedItem(ev)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-label-badge truncate text-left transition-all hover:scale-[1.02] cursor-pointer ${ev.color}`}
                          title={`${ev.title} (${ev.type})`}
                        >
                          <span className="font-semibold uppercase mr-1 text-[9px] opacity-75">
                            {ev.type.slice(0, 3)}:
                          </span>
                          {ev.taskKey ? `${ev.taskKey} ` : ""}
                          {ev.title}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Next month leading days to complete grid */}
              {(() => {
                const totalCells = firstDayOfWeek + daysInMonth;
                const remainder = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
                return Array.from({ length: remainder }).map((_, i) => (
                  <div key={`offset-next-${i}`} className="p-2 bg-surface-container-lowest/40 opacity-40">
                    <span className="text-outline font-label-code text-[11px]">{i + 1}</span>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* --- WEEK VIEW --- */}
        {viewMode === "week" && (
          <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low shadow-sm overflow-hidden flex flex-col">
            <div className="grid grid-cols-7 border-b border-outline-variant/30 bg-surface-container-high/40 text-center font-label-badge text-outline text-[11px] py-2 uppercase tracking-wider">
              {weekDays.map((d, i) => {
                const active = isToday(d.getFullYear(), d.getMonth(), d.getDate());
                return (
                  <div key={i} className={`flex flex-col items-center gap-0.5 ${active ? "text-primary font-bold" : ""}`}>
                    <span>{WEEKDAY_NAMES[i]}</span>
                    <span className="font-label-code text-[12px]">{d.getDate()}</span>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-outline-variant/20 min-h-[500px]">
              {weekDays.map((d, i) => {
                const active = isToday(d.getFullYear(), d.getMonth(), d.getDate());
                const dayEvents = filteredEvents.filter(
                  (e) =>
                    e.date.getFullYear() === d.getFullYear() &&
                    e.date.getMonth() === d.getMonth() &&
                    e.date.getDate() === d.getDate()
                );

                return (
                  <div
                    key={i}
                    className={`p-2 flex flex-col gap-1.5 min-h-[450px] ${
                      active ? "bg-primary-container/5" : ""
                    }`}
                  >
                    <div className="text-[11px] text-outline font-label-code border-b border-outline-variant/20 pb-1 mb-1">
                      {dayEvents.length} items
                    </div>
                    {dayEvents.map((ev) => (
                      <div
                        key={`${ev.type}-${ev.id}`}
                        onClick={() => setSelectedItem(ev)}
                        className={`p-2 rounded-lg cursor-pointer flex flex-col gap-1 shadow-xs hover:border-primary transition-all ${ev.color}`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-label-code">
                          <span className="uppercase font-bold">{ev.type}</span>
                          <span>{ev.status}</span>
                        </div>
                        <span className="font-medium text-body-sm line-clamp-2">{ev.title}</span>
                        {ev.projectName && (
                          <span className="text-[10px] text-outline truncate">{ev.projectName}</span>
                        )}
                      </div>
                    ))}
                    {dayEvents.length === 0 && (
                      <div className="text-outline text-[11px] text-center pt-8 italic">No events</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- DAY VIEW --- */}
        {viewMode === "day" && (
          <div className="p-6 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <h2 className="font-headline-sm text-headline-sm text-on-surface">
                Agenda for {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getDate()}, {currentDate.getFullYear()}
              </h2>
              <span className="font-label-code text-body-sm text-primary">
                {
                  filteredEvents.filter(
                    (e) =>
                      e.date.getFullYear() === currentDate.getFullYear() &&
                      e.date.getMonth() === currentDate.getMonth() &&
                      e.date.getDate() === currentDate.getDate()
                  ).length
                }{" "}
                Scheduled Events
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {filteredEvents
                .filter(
                  (e) =>
                    e.date.getFullYear() === currentDate.getFullYear() &&
                    e.date.getMonth() === currentDate.getMonth() &&
                    e.date.getDate() === currentDate.getDate()
                )
                .map((ev) => (
                  <div
                    key={`${ev.type}-${ev.id}`}
                    onClick={() => setSelectedItem(ev)}
                    className="p-4 rounded-lg bg-surface-container border border-outline-variant/30 hover:border-primary transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-[11px] font-label-badge uppercase ${ev.color}`}>
                        {ev.type}
                      </span>
                      <div>
                        <div className="font-headline-sm text-body-md text-on-surface font-medium">
                          {ev.taskKey ? `${ev.taskKey}: ` : ""}
                          {ev.title}
                        </div>
                        <div className="text-[11px] text-outline">
                          Project: {ev.projectName || "General"} • Status: {ev.status}
                        </div>
                      </div>
                    </div>

                    {ev.type === "task" ? (
                      <Link
                        href={`/tasks/${ev.id}`}
                        className="px-3 py-1 rounded bg-surface-container-high hover:bg-primary-container text-body-sm text-on-surface hover:text-on-primary-container transition-colors"
                      >
                        Inspect Task
                      </Link>
                    ) : (
                      <span className="text-outline font-label-code text-[11px]">View Details</span>
                    )}
                  </div>
                ))}

              {filteredEvents.filter(
                (e) =>
                  e.date.getFullYear() === currentDate.getFullYear() &&
                  e.date.getMonth() === currentDate.getMonth() &&
                  e.date.getDate() === currentDate.getDate()
              ).length === 0 && (
                <div className="p-12 text-center text-outline text-body-sm italic">
                  No deliverables, tasks, or sprints scheduled for this specific date.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selected Event Details Modal / Inspector */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-lg bg-surface-container-low border border-outline-variant/50 p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-label-badge uppercase ${selectedItem.color}`}>
                    {selectedItem.type}
                  </span>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold truncate max-w-[240px]">
                    {selectedItem.taskKey || selectedItem.title}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="w-6 h-6 rounded flex items-center justify-center text-outline hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <div className="flex flex-col gap-3 py-4 text-body-sm">
                <div>
                  <label className="text-outline text-[11px] font-label-badge block">Title</label>
                  <span className="text-on-surface font-medium">{selectedItem.title}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-outline text-[11px] font-label-badge block">Project</label>
                    <span className="text-on-surface">{selectedItem.projectName || "--"}</span>
                  </div>
                  <div>
                    <label className="text-outline text-[11px] font-label-badge block">Status</label>
                    <span className="text-on-surface font-label-code">{selectedItem.status}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-outline text-[11px] font-label-badge block">Scheduled Date</label>
                    <span className="text-on-surface font-label-code">
                      {selectedItem.date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  {selectedItem.priority && (
                    <div>
                      <label className="text-outline text-[11px] font-label-badge block">Priority</label>
                      <span className="text-on-surface font-label-code">{selectedItem.priority}</span>
                    </div>
                  )}
                </div>

                {selectedItem.assignees && selectedItem.assignees.length > 0 && (
                  <div>
                    <label className="text-outline text-[11px] font-label-badge block">Assignees</label>
                    <span className="text-on-surface">
                      {selectedItem.assignees.map((a) => a.member?.user?.name).filter(Boolean).join(", ")}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-outline-variant/30">
                {selectedItem.type === "task" ? (
                  <Link
                    href={`/tasks/${selectedItem.id}`}
                    className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary-container font-headline-sm text-body-sm hover:opacity-90 transition-opacity"
                  >
                    Open Task Inspector
                  </Link>
                ) : selectedItem.projectId ? (
                  <Link
                    href={`/projects/${selectedItem.projectId}?tab=${selectedItem.type === "sprint" ? "cycles" : "milestones"}`}
                    className="px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface font-headline-sm text-body-sm hover:bg-surface-container-highest transition-colors"
                  >
                    View in Project
                  </Link>
                ) : (
                  <div></div>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="px-3 py-1.5 rounded-lg text-outline hover:text-on-surface text-body-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
