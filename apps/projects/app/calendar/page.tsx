"use client";

import Link from "next/link";
import React, { useState, useMemo } from "react";
import {
  useUnifiedCalendarEvents,
  useUpdateUnifiedEvent,
  useProjects,
} from "@/lib/hooks/use-projects";
import { usePermissions } from "@/lib/permissions";
import { UnifiedCalendarEvent } from "@/lib/api";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const CATEGORIES = [
  { id: "all", label: "All Activities", icon: "dashboard" },
  { id: "tasks", label: "User Tasks", icon: "check_circle" },
  { id: "production", label: "Production", icon: "bakery_dining" },
  { id: "deliveries", label: "Deliveries", icon: "local_shipping" },
  { id: "crm", label: "Customer Follow-ups", icon: "support_agent" },
  { id: "shifts", label: "Staff Shifts", icon: "badge" },
];

export default function CalendarPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const { data: projects = [] } = useProjects();
  const { canManageTasks } = usePermissions();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedEvent, setSelectedEvent] = useState<UnifiedCalendarEvent | null>(null);

  // Compute date range for fetching unified calendar events
  const { rangeFrom, rangeTo } = useMemo(() => {
    const from = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const to = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0);
    return { rangeFrom: from.toISOString(), rangeTo: to.toISOString() };
  }, [currentDate]);

  const { data: unifiedData, isLoading } = useUnifiedCalendarEvents({
    from: rangeFrom,
    to: rangeTo,
    categories: selectedCategory === "all" ? undefined : selectedCategory,
    projectId: selectedProjectId || undefined,
  });

  const updateUnifiedEventMutation = useUpdateUnifiedEvent();

  const currentYear = currentDate.getFullYear();
  const currentMonthIdx = currentDate.getMonth();
  const currentMonthName = MONTH_NAMES[currentMonthIdx];

  // Normalized events mapped to dates
  const events = useMemo(() => {
    return unifiedData?.events || [];
  }, [unifiedData]);

  // Color mapper based on domain category and priority/status
  const getEventBadgeClass = (e: UnifiedCalendarEvent) => {
    switch (e.category) {
      case "production":
        return e.status === "COMPLETED"
          ? "bg-emerald-950/70 text-emerald-300 border-emerald-500/30"
          : "bg-amber-950/70 text-amber-300 border-amber-500/40";
      case "delivery":
        return e.status === "DELIVERED"
          ? "bg-emerald-950/70 text-emerald-300 border-emerald-500/30"
          : e.status === "FAILED"
          ? "bg-rose-950/70 text-rose-300 border-rose-500/50"
          : "bg-cyan-950/70 text-cyan-300 border-cyan-500/40";
      case "crm":
        return e.status === "COMPLETED"
          ? "bg-slate-800/80 text-slate-300 border-slate-600/30"
          : "bg-indigo-950/80 text-indigo-300 border-indigo-500/40";
      case "shift":
        return "bg-teal-950/70 text-teal-300 border-teal-500/30";
      case "milestone":
        return "bg-purple-950/70 text-purple-300 border-purple-500/40";
      case "task":
      default:
        return e.status === "DONE"
          ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/30"
          : e.priority === "URGENT"
          ? "bg-rose-950/70 text-rose-300 border-rose-500/50"
          : "bg-surface-container-high text-primary border-primary/30";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "production": return "bakery_dining";
      case "delivery": return "local_shipping";
      case "crm": return "support_agent";
      case "shift": return "badge";
      case "milestone": return "flag";
      case "task": default: return "check_circle";
    }
  };

  // Status transition handler for selected event
  const handleStatusTransition = async (newStatus: string) => {
    if (!selectedEvent || !canManageTasks) return;
    await updateUnifiedEventMutation.mutateAsync({
      eventId: selectedEvent.id,
      payload: {
        category: selectedEvent.category as any,
        status: newStatus,
      },
    });
    setSelectedEvent((prev) => (prev ? { ...prev, status: newStatus } : null));
  };

  // Month calendar grid calculation
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonthIdx, 1);
    const lastDay = new Date(currentYear, currentMonthIdx + 1, 0);

    const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0
    const totalDays = lastDay.getDate();

    const prevMonthLastDay = new Date(currentYear, currentMonthIdx, 0).getDate();

    const days: { date: Date; isCurrentMonth: boolean; events: UnifiedCalendarEvent[] }[] = [];

    // Prev month padding
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonthIdx - 1, prevMonthLastDay - i);
      days.push({ date: d, isCurrentMonth: false, events: [] });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(currentYear, currentMonthIdx, i);
      const dayEvents = events.filter((ev) => {
        const evDate = new Date(ev.startAt);
        return (
          evDate.getFullYear() === d.getFullYear() &&
          evDate.getMonth() === d.getMonth() &&
          evDate.getDate() === d.getDate()
        );
      });
      days.push({ date: d, isCurrentMonth: true, events: dayEvents });
    }

    // Next month padding to fill complete weeks (multiples of 7)
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(currentYear, currentMonthIdx + 1, i);
        days.push({ date: d, isCurrentMonth: false, events: [] });
      }
    }

    return days;
  }, [currentYear, currentMonthIdx, events]);

  const goToPrev = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(currentYear, currentMonthIdx - 1, 1));
    } else if (viewMode === "week") {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 86400000));
    } else {
      setCurrentDate(new Date(currentDate.getTime() - 86400000));
    }
  };

  const goToNext = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(currentYear, currentMonthIdx + 1, 1));
    } else if (viewMode === "week") {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 86400000));
    } else {
      setCurrentDate(new Date(currentDate.getTime() + 86400000));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="flex flex-col w-full">
        {/* Top Control Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 mb-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-semibold">
              Cross-System Calendar & Schedules
            </h1>

            {projects.length > 0 && (
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-surface-container-high border border-outline-variant/30 text-on-surface text-body-sm rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary"
              >
                <option value="">All Projects & Workspaces</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.key})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Buttons */}
            <div className="flex items-center bg-surface-container-lowest p-1 rounded-lg border border-outline-variant/20">
              {(["month", "week", "day"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 rounded-md text-body-sm font-label-badge capitalize transition-colors ${
                    viewMode === mode
                      ? "bg-surface-container-high text-primary font-medium shadow-sm"
                      : "text-outline hover:text-on-surface"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Date Navigator */}
            <div className="flex items-center gap-1 bg-surface-container-high border border-outline-variant/30 rounded-lg p-1">
              <button
                type="button"
                onClick={goToPrev}
                className="p-1 hover:bg-surface-container-highest text-outline hover:text-on-surface rounded transition-colors"
                title="Previous"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={goToToday}
                className="px-2.5 py-0.5 text-body-sm text-on-surface hover:bg-surface-container-highest rounded transition-colors font-medium"
              >
                Today
              </button>
              <button
                type="button"
                onClick={goToNext}
                className="p-1 hover:bg-surface-container-highest text-outline hover:text-on-surface rounded transition-colors"
                title="Next"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* Operational Category Layer Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {CATEGORIES.map((cat) => {
            const count =
              cat.id === "all"
                ? unifiedData?.counts.total ?? 0
                : (unifiedData?.counts as any)?.[cat.id] ?? 0;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-body-sm transition-all ${
                  isSelected
                    ? "bg-primary-container text-on-primary-container border-primary/40 font-medium shadow-sm"
                    : "bg-surface-container-high text-outline hover:text-on-surface border-outline-variant/30"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
                <span>{cat.label}</span>
                {count > 0 && (
                  <span
                    className={`ml-1 text-[11px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container-highest text-outline"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Current Active Date Display */}
        <div className="flex items-center justify-between py-2 border-b border-outline-variant/20 mb-3">
          <span className="text-title-md font-semibold text-on-surface">
            {currentMonthName} {currentYear}
          </span>
          {isLoading && (
            <span className="text-outline text-body-sm flex items-center gap-1.5">
              <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
              Syncing operational schedules...
            </span>
          )}
        </div>

        {/* Month View Grid */}
        {viewMode === "month" && (
          <div className="flex flex-col border border-outline-variant/30 rounded-xl overflow-hidden bg-surface-container-lowest">
            {/* Weekday Header */}
            <div className="grid grid-cols-7 border-b border-outline-variant/20 bg-surface-container">
              {WEEKDAY_NAMES.map((name) => (
                <div
                  key={name}
                  className="py-2.5 text-center text-outline text-label-sm font-label-badge"
                >
                  {name}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-outline-variant/15">
              {calendarDays.map((day, idx) => {
                const isToday =
                  day.date.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={idx}
                    className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors ${
                      day.isCurrentMonth
                        ? "bg-surface-container-lowest hover:bg-surface-container-low/40"
                        : "bg-surface-container/30 text-outline-variant opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-body-sm font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday
                            ? "bg-primary text-on-primary font-bold shadow-sm"
                            : day.isCurrentMonth
                            ? "text-on-surface"
                            : "text-outline"
                        }`}
                      >
                        {day.date.getDate()}
                      </span>
                      {day.events.length > 0 && (
                        <span className="text-[10px] text-outline font-label-code">
                          {day.events.length} item{day.events.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    {/* Day Events Stack */}
                    <div className="flex flex-col gap-1 overflow-y-auto max-h-[85px] scrollbar-none">
                      {day.events.slice(0, 3).map((ev) => (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => setSelectedEvent(ev)}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] truncate border text-left transition-all hover:scale-[1.01] ${getEventBadgeClass(
                            ev
                          )}`}
                          title={`${ev.title} (${ev.status})`}
                        >
                          <span className="material-symbols-outlined text-[13px] shrink-0">
                            {getCategoryIcon(ev.category)}
                          </span>
                          <span className="truncate">{ev.title}</span>
                        </button>
                      ))}

                      {day.events.length > 3 && (
                        <button
                          type="button"
                          onClick={() => setSelectedEvent(day.events[3])}
                          className="text-[10px] text-outline hover:text-primary text-left px-1 font-medium"
                        >
                          +{day.events.length - 3} more
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Week & Day Timeline Perspectives */}
        {viewMode !== "month" && (
          <div className="flex flex-col gap-3 p-4 border border-outline-variant/30 rounded-xl bg-surface-container-lowest">
            <h2 className="text-title-sm font-semibold text-on-surface">
              {viewMode === "week" ? "Weekly Schedule Breakdown" : "Day Agenda"}
            </h2>

            {events.length === 0 ? (
              <div className="py-12 text-center text-outline text-body-sm">
                No scheduled activities found for this time period.
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-outline-variant/15">
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 hover:bg-surface-container-low/40 px-2 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center border ${getEventBadgeClass(
                          ev
                        )}`}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {getCategoryIcon(ev.category)}
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-body-sm font-medium text-on-surface">
                          {ev.title}
                        </span>
                        <div className="flex items-center gap-2 text-[12px] text-outline">
                          <span className="capitalize">{ev.category}</span>
                          <span>•</span>
                          <span>
                            {new Date(ev.startAt).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {ev.projectName && (
                            <>
                              <span>•</span>
                              <span>{ev.projectName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-label-code bg-surface-container-high text-outline border border-outline-variant/20">
                        {ev.status}
                      </span>
                      {ev.priority && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-label-code bg-surface-container-highest text-on-surface">
                          {ev.priority}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Detailed Event Inspection & Status Action Dialog */}
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-lg bg-surface-container rounded-2xl border border-outline-variant/40 shadow-2xl p-6 flex flex-col gap-4 animate-in fade-in-50">
              <div className="flex items-start justify-between border-b border-outline-variant/20 pb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border ${getEventBadgeClass(
                      selectedEvent
                    )}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {getCategoryIcon(selectedEvent.category)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-label-code uppercase text-outline">
                      {selectedEvent.category} • {selectedEvent.code || selectedEvent.id}
                    </span>
                    <h2 className="text-title-sm font-semibold text-on-surface">
                      {selectedEvent.title}
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="p-1 hover:bg-surface-container-highest rounded text-outline hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Event Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 text-body-sm py-2">
                <div>
                  <label className="text-[11px] text-outline font-label-badge block">Status</label>
                  <span className="text-on-surface font-medium">{selectedEvent.status}</span>
                </div>
                <div>
                  <label className="text-[11px] text-outline font-label-badge block">Schedule Window</label>
                  <span className="text-on-surface">
                    {new Date(selectedEvent.startAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {selectedEvent.projectName && (
                  <div>
                    <label className="text-[11px] text-outline font-label-badge block">Project</label>
                    <span className="text-on-surface">{selectedEvent.projectName}</span>
                  </div>
                )}

                {selectedEvent.assignees && selectedEvent.assignees.length > 0 && (
                  <div>
                    <label className="text-[11px] text-outline font-label-badge block">Responsible</label>
                    <span className="text-on-surface">
                      {selectedEvent.assignees.map((a) => a.name).join(", ")}
                    </span>
                  </div>
                )}
              </div>

              {/* Domain Specific Detail Display */}
              {selectedEvent.details && Object.keys(selectedEvent.details).length > 0 && (
                <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/20 flex flex-col gap-1.5 text-[12px]">
                  <span className="font-semibold text-on-surface uppercase text-[10px] tracking-wider text-outline">
                    Domain Details
                  </span>
                  {selectedEvent.category === "production" && (
                    <>
                      <div>Recipe: <span className="text-on-surface font-medium">{selectedEvent.details.recipeName}</span></div>
                      <div>Planned Quantity: <span className="text-on-surface font-medium">{selectedEvent.details.plannedQuantity}</span></div>
                      {selectedEvent.details.orderReference && (
                        <div>Order Ref: <span className="text-on-surface font-medium">{selectedEvent.details.orderReference}</span></div>
                      )}
                    </>
                  )}

                  {selectedEvent.category === "delivery" && (
                    <>
                      <div>Customer: <span className="text-on-surface font-medium">{selectedEvent.details.customerName || "--"}</span></div>
                      <div>Phone: <span className="text-on-surface font-medium">{selectedEvent.details.customerPhone || "--"}</span></div>
                      <div>Reconciled: <span className="text-on-surface font-medium">{selectedEvent.details.isReconciled ? "Yes" : "No"}</span></div>
                    </>
                  )}

                  {selectedEvent.category === "crm" && (
                    <>
                      <div>Type: <span className="text-on-surface font-medium">{selectedEvent.details.followUpType}</span></div>
                      <div>Entity: <span className="text-on-surface font-medium">{selectedEvent.details.recordObject || "CRM Contact"}</span></div>
                      {selectedEvent.details.description && (
                        <div>Notes: <span className="text-on-surface">{selectedEvent.details.description}</span></div>
                      )}
                    </>
                  )}

                  {selectedEvent.category === "shift" && (
                    <>
                      <div>Hours: <span className="text-on-surface font-medium">{selectedEvent.details.startTime} - {selectedEvent.details.endTime}</span></div>
                      {selectedEvent.details.locationName && (
                        <div>Location: <span className="text-on-surface font-medium">{selectedEvent.details.locationName}</span></div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Status Action Buttons */}
              {canManageTasks && (
                <div className="flex flex-col gap-2 pt-2 border-t border-outline-variant/20">
                  <span className="text-[11px] text-outline font-label-badge">Quick Status Transition</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedEvent.category === "production" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStatusTransition("IN_PROGRESS")}
                          className="px-2.5 py-1 text-[11px] rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                        >
                          Start Batch
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusTransition("COMPLETED")}
                          className="px-2.5 py-1 text-[11px] rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                        >
                          Complete Batch
                        </button>
                      </>
                    )}

                    {selectedEvent.category === "delivery" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStatusTransition("IN_TRANSIT")}
                          className="px-2.5 py-1 text-[11px] rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30"
                        >
                          Mark In-Transit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusTransition("DELIVERED")}
                          className="px-2.5 py-1 text-[11px] rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                        >
                          Mark Delivered
                        </button>
                      </>
                    )}

                    {selectedEvent.category === "crm" && (
                      <button
                        type="button"
                        onClick={() => handleStatusTransition("COMPLETED")}
                        className="px-2.5 py-1 text-[11px] rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                      >
                        Complete Follow-up
                      </button>
                    )}

                    {selectedEvent.category === "task" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStatusTransition("IN_PROGRESS")}
                          className="px-2.5 py-1 text-[11px] rounded bg-primary-container text-on-primary-container"
                        >
                          In Progress
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusTransition("DONE")}
                          className="px-2.5 py-1 text-[11px] rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                        >
                          Mark Done
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Footer navigation */}
              <div className="flex items-center justify-between pt-3 border-t border-outline-variant/30">
                {selectedEvent.category === "task" ? (
                  <Link
                    href={`/tasks/${selectedEvent.rawId}`}
                    className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary-container font-headline-sm text-body-sm hover:opacity-90 transition-opacity"
                  >
                    Open Task Inspector
                  </Link>
                ) : selectedEvent.projectId ? (
                  <Link
                    href={`/projects/${selectedEvent.projectId}`}
                    className="px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface font-headline-sm text-body-sm hover:bg-surface-container-highest transition-colors"
                  >
                    View Project
                  </Link>
                ) : (
                  <div></div>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
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
