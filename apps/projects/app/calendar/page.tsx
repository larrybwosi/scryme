"use client";

import Link from "next/link";
import React, { useState, useMemo } from "react";
import {
  useTasks,
  useProjects,
  useCreateTask,
  useCreateMilestone,
} from "@/lib/hooks/use-projects";
import {
  normalizeCalendarEvents,
  CalendarUnifiedEvent,
} from "@/lib/calendar-utils";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
} from "date-fns";

export default function CalendarPage() {
  const { data: tasks = [], isLoading: isTasksLoading } = useTasks();
  const { data: projects = [], isLoading: isProjectsLoading } = useProjects();
  const createTaskMutation = useCreateTask();

  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterType, setFilterType] = useState<string>("all");

  // New Event Modal State
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventType, setNewEventType] = useState<"task" | "milestone">("task");
  const [newEventProjectId, setNewEventProjectId] = useState("");
  const [newEventPriority, setNewEventPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [newEventDueDate, setNewEventDueDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );

  // Normalize all tasks, milestones, and sprints into unified calendar events
  const allEvents = useMemo(() => {
    return normalizeCalendarEvents(tasks, projects);
  }, [tasks, projects]);

  // Filtered by selected type
  const filteredEvents = useMemo(() => {
    return allEvents.filter((e) => {
      if (filterType === "all") return true;
      return e.type === filterType;
    });
  }, [allEvents, filterType]);

  // Date Navigation handlers
  const handlePrev = () => {
    if (viewMode === "month") setCurrentDate((d) => subMonths(d, 1));
    else if (viewMode === "week") setCurrentDate((d) => subWeeks(d, 1));
    else setCurrentDate((d) => subDays(d, 1));
  };

  const handleNext = () => {
    if (viewMode === "month") setCurrentDate((d) => addMonths(d, 1));
    else if (viewMode === "week") setCurrentDate((d) => addWeeks(d, 1));
    else setCurrentDate((d) => addDays(d, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Quick event creation
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetProjectId = newEventProjectId || projects[0]?.id;
    if (!targetProjectId || !newEventTitle.trim()) return;

    if (newEventType === "task") {
      await createTaskMutation.mutateAsync({
        title: newEventTitle.trim(),
        projectId: targetProjectId,
        priority: newEventPriority,
        dueDate: newEventDueDate ? new Date(newEventDueDate).toISOString() : undefined,
        status: "TODO",
      });
    }

    setIsNewEventModalOpen(false);
    setNewEventTitle("");
  };

  // Month grid day calculations
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const monthDays = eachDayOfInterval({ start: startDate, end: endDate });

  // Week view calculations
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Events for selected day
  const selectedDayEvents = useMemo(() => {
    return filteredEvents.filter((e) => isSameDay(e.date, selectedDate));
  }, [filteredEvents, selectedDate]);

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="flex flex-col w-full">
        {/* Top Command & Perspective Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 mb-2">
          <div className="flex items-center gap-3">
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
              {format(currentDate, "MMMM")}{" "}
              <span className="text-outline font-normal">
                {format(currentDate, "yyyy")}
              </span>
            </h1>
          </div>

          {/* Right Controls: Filters & New Event */}
          <div className="flex items-center gap-2">
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

            <button
              type="button"
              onClick={() => {
                setNewEventDueDate(format(selectedDate, "yyyy-MM-dd"));
                setIsNewEventModalOpen(true);
              }}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-primary text-on-primary font-headline-sm text-body-sm shadow-sm hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[15px]">add</span>
              <span>New Item</span>
            </button>

            <Link
              href="/schedule"
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm border border-outline-variant/30 transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">date_range</span>
              <span>Schedule</span>
            </Link>
          </div>
        </div>

        {/* Calendar View Container */}
        {viewMode === "month" && (
          <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low shadow-sm overflow-hidden flex flex-col">
            {/* Weekdays Header */}
            <div className="grid grid-cols-7 border-b border-outline-variant/30 bg-surface-container-high/40 text-center font-label-badge text-outline text-[11px] py-2 uppercase tracking-wider">
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
              <div>Sun</div>
            </div>

            {/* Month Calendar Grid */}
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-outline-variant/20 min-h-[640px]">
              {monthDays.map((day) => {
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isToday = isSameDay(day, new Date());
                const isSelected = isSameDay(day, selectedDate);
                const dayEvents = filteredEvents.filter((e) => isSameDay(e.date, day));

                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`p-2 transition-colors cursor-pointer flex flex-col min-h-[100px] ${
                      isSelected
                        ? "bg-surface-container border-2 border-primary-container"
                        : "hover:bg-surface-container/60"
                    } ${isToday ? "bg-primary-container/10" : ""} ${
                      !isCurrentMonth ? "bg-surface-container-lowest/40 opacity-40" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-label-code text-[12px] ${
                          isToday
                            ? "bg-primary-container text-on-primary-container font-bold"
                            : "text-on-surface"
                        }`}
                      >
                        {format(day, "d")}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      )}
                    </div>

                    {/* Day Events Pills */}
                    <div className="flex flex-col gap-1 overflow-y-auto max-h-[90px]">
                      {dayEvents.map((ev) => (
                        <div
                          key={ev.id}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-label-badge truncate ${ev.color}`}
                          title={`${ev.title} (${ev.projectName || "Project"})`}
                        >
                          {ev.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Week View Timeline */}
        {viewMode === "week" && (
          <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low shadow-sm overflow-hidden flex flex-col">
            <div className="grid grid-cols-7 border-b border-outline-variant/30 bg-surface-container-high/40 text-center font-label-badge text-outline text-[11px] py-2.5">
              {weekDays.map((day) => {
                const isToday = isSameDay(day, new Date());
                return (
                  <div key={day.toISOString()} className="flex flex-col items-center">
                    <span className="uppercase text-[10px] text-outline">{format(day, "EEE")}</span>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold mt-0.5 ${
                      isToday ? "bg-primary-container text-on-primary-container" : "text-on-surface"
                    }`}>
                      {format(day, "d")}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-7 divide-x divide-outline-variant/20 min-h-[500px]">
              {weekDays.map((day) => {
                const isSelected = isSameDay(day, selectedDate);
                const dayEvents = filteredEvents.filter((e) => isSameDay(e.date, day));

                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`p-3 transition-colors cursor-pointer flex flex-col gap-2 ${
                      isSelected ? "bg-surface-container/80 border-t-2 border-primary" : "hover:bg-surface-container/40"
                    }`}
                  >
                    <div className="flex flex-col gap-1.5">
                      {dayEvents.map((ev) => (
                        <div
                          key={ev.id}
                          className={`p-2 rounded-lg text-body-xs font-label-badge flex flex-col gap-1 border shadow-xs ${ev.color}`}
                        >
                          <span className="font-medium truncate">{ev.title}</span>
                          <span className="text-[9px] uppercase tracking-wider opacity-80">{ev.type}</span>
                        </div>
                      ))}
                      {dayEvents.length === 0 && (
                        <span className="text-outline/40 text-[11px] italic text-center py-6">No entries</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Day Agenda Timeline */}
        {viewMode === "day" && (
          <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low shadow-sm p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
              <div>
                <h2 className="text-headline-md font-headline-md text-on-surface">
                  {format(currentDate, "EEEE, MMMM d, yyyy")}
                </h2>
                <p className="text-body-sm text-outline">
                  Daily project deliverables and deadline timeline
                </p>
              </div>
              <span className="font-label-code text-[12px] px-2.5 py-1 rounded bg-surface-container text-outline">
                {filteredEvents.filter((e) => isSameDay(e.date, currentDate)).length} Items Due
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {filteredEvents
                .filter((e) => isSameDay(e.date, currentDate))
                .map((ev) => (
                  <div
                    key={ev.id}
                    className="p-4 rounded-lg bg-surface-container border border-outline-variant/20 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-[10px] uppercase font-label-code ${ev.color}`}>
                        {ev.type}
                      </span>
                      <div>
                        <h4 className="text-body-md font-semibold text-on-surface">{ev.title}</h4>
                        <span className="text-body-xs text-outline">
                          Project: {ev.projectName || "General"}
                        </span>
                      </div>
                    </div>
                    {ev.type === "task" && (
                      <Link
                        href={`/tasks/${ev.rawItem.id}`}
                        className="px-3 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-primary font-body-sm text-body-xs transition-colors"
                      >
                        Inspect Task
                      </Link>
                    )}
                  </div>
                ))}
              {filteredEvents.filter((e) => isSameDay(e.date, currentDate)).length === 0 && (
                <div className="p-8 text-center text-outline text-body-sm">
                  No deliverables scheduled for {format(currentDate, "MMMM d, yyyy")}.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selected Day Inspector Panel */}
        {selectedDate && (
          <div className="mt-4 p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-headline-sm text-body-md text-on-surface font-semibold">
                Agenda for {format(selectedDate, "MMMM d, yyyy")}
              </span>
              <span className="font-label-code text-[11px] text-outline">
                {selectedDayEvents.length} Scheduled Deliverables
              </span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {selectedDayEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3 rounded-lg bg-surface-container border border-outline-variant/20 flex flex-col gap-1 min-w-[260px]"
                >
                  <span className="text-body-sm text-on-surface font-medium">{ev.title}</span>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-outline">
                    <span className="uppercase font-label-badge">{ev.type}</span>
                    <span>{ev.projectName || "Workspace"}</span>
                  </div>
                </div>
              ))}
              {selectedDayEvents.length === 0 && (
                <span className="text-outline text-body-sm py-2">
                  No tasks, milestones, or sprints scheduled on this date.
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Event Creation Modal */}
      {isNewEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl bg-surface-container border border-outline-variant/40 p-6 shadow-xl flex flex-col gap-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-headline-sm font-semibold text-on-surface">Create Calendar Item</h3>
              <button
                type="button"
                onClick={() => setIsNewEventModalOpen(false)}
                className="text-outline hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-body-xs font-label-badge text-outline">Item Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewEventType("task")}
                    className={`py-1.5 px-3 rounded-lg text-body-sm font-medium border transition-colors ${
                      newEventType === "task"
                        ? "bg-primary-container text-on-primary-container border-primary"
                        : "bg-surface-container-low text-outline border-outline-variant/30"
                    }`}
                  >
                    Task
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewEventType("milestone")}
                    className={`py-1.5 px-3 rounded-lg text-body-sm font-medium border transition-colors ${
                      newEventType === "milestone"
                        ? "bg-primary-container text-on-primary-container border-primary"
                        : "bg-surface-container-low text-outline border-outline-variant/30"
                    }`}
                  >
                    Milestone
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-body-xs font-label-badge text-outline">Project</label>
                <select
                  value={newEventProjectId}
                  onChange={(e) => setNewEventProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface text-body-sm focus:outline-none focus:border-primary"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.key})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-body-xs font-label-badge text-outline">Title</label>
                <input
                  type="text"
                  required
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="e.g. Release candidate sync"
                  className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface text-body-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-body-xs font-label-badge text-outline">Due Date</label>
                  <input
                    type="date"
                    required
                    value={newEventDueDate}
                    onChange={(e) => setNewEventDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface text-body-sm focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-body-xs font-label-badge text-outline">Priority</label>
                  <select
                    value={newEventPriority}
                    onChange={(e) => setNewEventPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface text-body-sm focus:outline-none focus:border-primary"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewEventModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-outline text-body-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTaskMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-primary hover:opacity-90 text-on-primary font-medium text-body-sm transition-opacity"
                >
                  {createTaskMutation.isPending ? "Saving..." : "Create Deliverable"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
