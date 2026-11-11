"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select";
import Link from "next/link";
import React, { useState, useMemo } from "react";
import { useUnifiedCalendarEvents, useProjects, useUpdateUnifiedEvent } from "@/lib/hooks/use-projects";
import { UnifiedCalendarEvent } from "@/lib/api";
import type { LucideIcon } from "lucide-react";
import {
  Calendar,
  Clock,
  Loader2,
  LayoutDashboard,
  CheckCircle2,
  UtensilsCrossed,
  Truck,
  Headphones,
  Flag,
  ChevronLeft,
  ChevronRight,
  User,
  ExternalLink,
  X,
  CircleDot,
} from "lucide-react";
import { toast } from "sonner";

interface CategoryTabConfig {
  id: string;
  label: string;
  icon: LucideIcon;
}

const CATEGORY_TABS: CategoryTabConfig[] = [
  { id: "all", label: "All Items", icon: LayoutDashboard },
  { id: "tasks", label: "Tasks", icon: CheckCircle2 },
  { id: "production", label: "Production", icon: UtensilsCrossed },
  { id: "deliveries", label: "Deliveries", icon: Truck },
  { id: "crm", label: "CRM Follow-ups", icon: Headphones },
];

export default function GanttPage() {
  const { data: projects = [] } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [zoomLevel, setZoomLevel] = useState<"days" | "weeks" | "months">("days");
  const [timelineOffsetDays, setTimelineOffsetDays] = useState<number>(0);
  const [selectedEvent, setSelectedEvent] = useState<UnifiedCalendarEvent | null>(null);

  const updateStatusMutation = useUpdateUnifiedEvent();

  // Dynamic Horizon calculation based on offset
  const { rangeFrom, rangeTo, timelineStart, scaleDays, totalUnits } = useMemo(() => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    const start = new Date(base);
    start.setDate(base.getDate() - 7 + timelineOffsetDays);

    let spanDays = 45;
    if (zoomLevel === "weeks") spanDays = 70;
    if (zoomLevel === "months") spanDays = 120;

    const end = new Date(start);
    end.setDate(start.getDate() + spanDays);

    let units = spanDays;
    if (zoomLevel === "weeks") units = Math.ceil(spanDays / 7);
    if (zoomLevel === "months") units = Math.ceil(spanDays / 30);

    return {
      rangeFrom: start.toISOString(),
      rangeTo: end.toISOString(),
      timelineStart: start,
      timelineEnd: end,
      scaleDays: spanDays,
      totalUnits: Math.max(1, units),
    };
  }, [zoomLevel, timelineOffsetDays]);

  const { data: unifiedData, isLoading } = useUnifiedCalendarEvents({
    from: rangeFrom,
    to: rangeTo,
    categories: selectedCategory === "all" ? undefined : selectedCategory,
    projectId: selectedProjectId || undefined,
  });

  const events = useMemo(() => {
    return (unifiedData?.events || []).filter(
      (e) => e.category !== "shift" // shifts are rosters displayed on schedule page
    );
  }, [unifiedData]);

  // Today position percentage within active scale
  const todayPct = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = (today.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24);
    if (diff < 0 || diff > scaleDays) return null;
    return (diff / scaleDays) * 100;
  }, [timelineStart, scaleDays]);

  const getEventBarClass = (event: UnifiedCalendarEvent) => {
    const s = (event.status || "").toUpperCase();
    if (s === "DONE" || s === "COMPLETED" || s === "DELIVERED") {
      return "bg-gradient-to-r from-emerald-500/25 to-emerald-600/35 text-emerald-300 border border-emerald-500/40";
    }
    if (s === "IN_PROGRESS" || s === "ACTIVE" || s === "DISPATCHED" || s === "RUNNING") {
      return "bg-gradient-to-r from-primary-container/40 to-primary-container/60 text-primary border border-primary/50 shadow-sm";
    }
    if (s === "BLOCKED" || s === "CRITICAL" || s === "OVERDUE") {
      return "bg-gradient-to-r from-red-500/30 to-red-600/40 text-red-300 border border-red-500/50";
    }
    if (event.category === "production") {
      return "bg-gradient-to-r from-amber-500/25 to-amber-600/35 text-amber-300 border border-amber-500/40";
    }
    if (event.category === "delivery") {
      return "bg-gradient-to-r from-sky-500/25 to-sky-600/35 text-sky-300 border border-sky-500/40";
    }
    if (event.category === "crm") {
      return "bg-gradient-to-r from-purple-500/25 to-purple-600/35 text-purple-300 border border-purple-500/40";
    }
    return "bg-gradient-to-r from-surface-container-high to-surface-container-highest text-on-surface border border-outline-variant/40";
  };

  const getCategoryIcon = (category: string): LucideIcon => {
    switch (category) {
      case "production": return UtensilsCrossed;
      case "delivery": return Truck;
      case "crm": return Headphones;
      case "milestone": return Flag;
      case "task": default: return CheckCircle2;
    }
  };

  const handleStatusTransition = async (eventId: string, category: any, targetStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        eventId,
        payload: {
          category,
          status: targetStatus,
        },
      });
      toast.success(`Updated status to ${targetStatus}`);
      if (selectedEvent && selectedEvent.id === eventId) {
        setSelectedEvent({ ...selectedEvent, status: targetStatus });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update event status");
    }
  };

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="flex flex-col w-full">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 mb-2 border-b border-outline-variant/30">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Cross-System Timeline Gantt
            </h1>

            {projects.length > 0 && (
              <Select value={selectedProjectId || "ALL"} onValueChange={(val) => setSelectedProjectId(val === "ALL" ? "" : val)}>
                <SelectTrigger className="h-8 bg-surface-container-high border-outline-variant/30 text-on-surface text-body-sm min-w-[150px]">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent className="bg-surface-container-high border-outline-variant text-on-surface">
                  <SelectItem value="ALL">All Projects</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.key})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Pan / Timeline Navigation Controls */}
            <div className="flex items-center gap-1 bg-surface-container-low p-0.5 rounded-lg border border-outline-variant/30">
              <button
                type="button"
                onClick={() => setTimelineOffsetDays((prev) => prev - (zoomLevel === "days" ? 7 : 14))}
                className="p-1 rounded hover:bg-surface-container text-outline hover:text-on-surface transition-colors"
                title="Pan Left (Earlier)"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setTimelineOffsetDays(0)}
                className={`px-2 py-0.5 text-label-badge font-label-badge rounded hover:bg-surface-container transition-colors ${
                  timelineOffsetDays === 0 ? "text-primary font-medium" : "text-outline"
                }`}
                title="Jump to Today"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setTimelineOffsetDays((prev) => prev + (zoomLevel === "days" ? 7 : 14))}
                className="p-1 rounded hover:bg-surface-container text-outline hover:text-on-surface transition-colors"
                title="Pan Right (Later)"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

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
              href="/calendar"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm border border-outline-variant/30 transition-colors"
            >
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>Calendar</span>
            </Link>
            <Link
              href="/schedule"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm border border-outline-variant/30 transition-colors"
            >
              <Clock className="h-3.5 w-3.5 text-secondary" />
              <span>Schedule</span>
            </Link>
          </div>
        </div>

        {/* Operational Category Layer Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {CATEGORY_TABS.map((tab) => {
            const isSelected = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-body-sm transition-all ${
                  isSelected
                    ? "bg-primary-container text-on-primary-container border-primary/40 font-medium shadow-sm"
                    : "bg-surface-container-high text-outline hover:text-on-surface border-outline-variant/30"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {isLoading && (
          <div className="w-full py-16 text-center text-outline text-body-sm flex items-center justify-center gap-2">
            <Loader2 className="animate-spin h-4 w-4 text-primary" />
            <span>Loading timeline activities across operational domains...</span>
          </div>
        )}

        {!isLoading && events.length === 0 && (
          <div className="p-12 rounded-xl bg-surface-container-low border border-dashed border-outline-variant/30 text-center text-outline text-body-sm flex flex-col items-center justify-center">
            <Calendar className="h-8 w-8 text-outline mb-2" />
            <span className="font-medium text-on-surface">No scheduled activities found</span>
            <span className="text-xs text-outline mt-1">Try shifting your horizon, switching category filters, or selecting All Projects.</span>
          </div>
        )}

        {!isLoading && events.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-12 rounded-xl border border-outline-variant/30 bg-surface-container-low shadow-sm overflow-hidden">
            {/* Left Rail: Event Details */}
            <div className="xl:col-span-4 border-r border-outline-variant/30 bg-surface-container-low/80 flex flex-col">
              <div className="p-3 bg-surface-container-high/40 border-b border-outline-variant/30 font-label-badge text-outline text-[11px] uppercase tracking-wider flex items-center justify-between">
                <span>Operational Activity</span>
                <span>Date Horizon</span>
              </div>
              <div className="divide-y divide-outline-variant/20 flex flex-col">
                {events.map((ev) => {
                  const isSelected = selectedEvent?.id === ev.id;
                  const IconComp = getCategoryIcon(ev.category);
                  return (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className={`p-3 h-14 flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? "bg-surface-container-high border-l-2 border-primary"
                          : "hover:bg-surface-container/60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div className="p-1 rounded-md bg-surface-container shrink-0">
                          <IconComp className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-label-code text-[10px] text-primary font-bold">
                              {ev.code || ev.category.toUpperCase()}
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-label-badge uppercase ${
                                ev.status === "DONE" || ev.status === "COMPLETED"
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : ev.status === "IN_PROGRESS"
                                  ? "bg-primary-container text-on-primary-container"
                                  : "bg-surface-container text-outline"
                              }`}
                            >
                              {ev.status}
                            </span>
                          </div>
                          <div className="text-[12px] font-medium text-on-surface truncate">{ev.title}</div>
                        </div>
                      </div>
                      <span className="font-label-code text-[11px] text-outline shrink-0">
                        {new Date(ev.startAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Gantt Canvas */}
            <div className="xl:col-span-8 flex flex-col overflow-x-auto relative">
              {/* Timeline Header Track */}
              <div className="flex border-b border-outline-variant/30 bg-surface-container-high/40 font-label-code text-[10px] text-outline py-2.5 min-w-[750px] relative">
                {Array.from({ length: totalUnits }).map((_, i) => {
                  let label = `Day ${i + 1}`;
                  if (zoomLevel === "days") {
                    const d = new Date(timelineStart);
                    d.setDate(timelineStart.getDate() + i);
                    label = `${d.getDate()} ${d.toLocaleString("default", { month: "short" })}`;
                  } else if (zoomLevel === "weeks") {
                    const d = new Date(timelineStart);
                    d.setDate(timelineStart.getDate() + i * 7);
                    label = `Wk of ${d.getDate()} ${d.toLocaleString("default", { month: "short" })}`;
                  } else {
                    const d = new Date(timelineStart);
                    d.setMonth(timelineStart.getMonth() + i);
                    label = d.toLocaleString("default", { month: "short", year: "2-digit" });
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

              {/* Event Timeline Bars Canvas */}
              <div className="flex flex-col divide-y divide-outline-variant/15 min-w-[750px] relative">
                {/* Vertical "Today" Indicator Line */}
                {todayPct !== null && (
                  <div
                    className="absolute top-0 bottom-0 z-20 pointer-events-none flex flex-col items-center"
                    style={{ left: `${todayPct}%` }}
                  >
                    <div className="w-0.5 h-full bg-red-400/80 shadow-[0_0_8px_rgba(248,113,113,0.6)]"></div>
                    <span className="absolute top-1 -translate-x-1/2 px-1.5 py-0.5 rounded text-[9px] font-label-badge bg-red-500 text-white shadow-xs">
                      Today
                    </span>
                  </div>
                )}

                {events.map((ev, idx) => {
                  const evStart = new Date(ev.startAt);
                  const evEnd = new Date(ev.endAt);

                  let startDay = 0;
                  if (!isNaN(evStart.getTime())) {
                    startDay = Math.max(0, Math.floor((evStart.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24)));
                  } else {
                    startDay = (idx * 2) % (scaleDays - 5);
                  }

                  let durationDays = 1;
                  if (!isNaN(evEnd.getTime()) && evEnd > evStart) {
                    const endDay = Math.floor((evEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
                    durationDays = Math.max(1, endDay - startDay);
                  }

                  const leftPct = Math.min(95, (startDay / scaleDays) * 100);
                  const widthPct = Math.max(5, Math.min(100 - leftPct, (durationDays / scaleDays) * 100));
                  const isSelected = selectedEvent?.id === ev.id;

                  return (
                    <div key={ev.id} className="h-14 flex items-center px-1 relative">
                      <div
                        onClick={() => setSelectedEvent(ev)}
                        className={`h-8 rounded-lg ${getEventBarClass(ev)} relative flex items-center px-2.5 group cursor-pointer transition-all duration-150 hover:brightness-125 ${
                          isSelected ? "ring-2 ring-primary ring-offset-1 ring-offset-surface scale-[1.01]" : ""
                        }`}
                        style={{
                          marginLeft: `${leftPct}%`,
                          width: `${widthPct}%`,
                        }}
                        title={`${ev.title} (${ev.status})`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0 z-10">
                          <CircleDot className="h-3 w-3 shrink-0 opacity-80" />
                          <span className="font-label-code text-[11px] truncate font-medium">
                            {ev.title}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Modal: Event Inspector Drawer */}
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg rounded-xl bg-surface-container border border-outline-variant/50 p-6 shadow-2xl flex flex-col gap-4">
              <div className="flex items-start justify-between pb-3 border-b border-outline-variant/30">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-surface-container-high">
                    {(() => {
                      const IconComp = getCategoryIcon(selectedEvent.category);
                      return <IconComp className="h-5 w-5 text-primary" />;
                    })()}
                  </div>
                  <div>
                    <span className="text-[11px] font-mono text-outline uppercase">
                      {selectedEvent.code || selectedEvent.id}
                    </span>
                    <h2 className="text-base font-bold text-on-surface leading-tight">
                      {selectedEvent.title}
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="p-1 rounded text-outline hover:text-on-surface transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-surface-container-high/40 border border-outline-variant/30">
                  <span className="text-outline block mb-1">Domain Category</span>
                  <p className="font-semibold text-on-surface capitalize">{selectedEvent.category}</p>
                </div>
                <div className="p-3 rounded-lg bg-surface-container-high/40 border border-outline-variant/30">
                  <span className="text-outline block mb-1">Current Status</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-label-badge uppercase bg-primary-container text-on-primary-container font-medium">
                    {selectedEvent.status}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-surface-container-high/40 border border-outline-variant/30">
                  <span className="text-outline block mb-1">Start Date & Time</span>
                  <p className="font-semibold text-on-surface">
                    {new Date(selectedEvent.startAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-surface-container-high/40 border border-outline-variant/30">
                  <span className="text-outline block mb-1">End / Due Date</span>
                  <p className="font-semibold text-on-surface">
                    {new Date(selectedEvent.endAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>

              {/* Status Action Transitions */}
              <div className="pt-2 border-t border-outline-variant/30 flex flex-col gap-2">
                <span className="text-xs font-semibold text-on-surface">Transition Status</span>
                <div className="flex flex-wrap items-center gap-2">
                  {["TODO", "IN_PROGRESS", "DONE"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      disabled={selectedEvent.status === st || updateStatusMutation.isPending}
                      onClick={() => handleStatusTransition(selectedEvent.id, selectedEvent.category, st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedEvent.status === st
                          ? "bg-surface-container-high text-outline cursor-default"
                          : "bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/40"
                      }`}
                    >
                      Mark as {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-outline-variant/30">
                {selectedEvent.category === "task" ? (
                  <Link
                    href={`/task-detail?id=${selectedEvent.id}`}
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>Open Task Inspector</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                ) : (
                  <div></div>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-1.5 rounded-lg bg-surface-container-high text-on-surface text-xs font-medium hover:bg-surface-container-highest"
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
