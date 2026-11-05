"use client";

import Link from "next/link";
import React, { useState, useMemo } from "react";
import { useUnifiedCalendarEvents, useProjects } from "@/lib/hooks/use-projects";
import { UnifiedCalendarEvent } from "@/lib/api";

const CATEGORY_TABS = [
  { id: "all", label: "All Items", icon: "dashboard" },
  { id: "tasks", label: "Tasks", icon: "check_circle" },
  { id: "production", label: "Production", icon: "bakery_dining" },
  { id: "deliveries", label: "Deliveries", icon: "local_shipping" },
  { id: "crm", label: "CRM Follow-ups", icon: "support_agent" },
];

export default function GanttPage() {
  const { data: projects = [] } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [zoomLevel, setZoomLevel] = useState<"days" | "weeks" | "months">("days");

  // Fetch unified operational events for a 60-day horizon
  const { rangeFrom, rangeTo } = useMemo(() => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    const to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 45);
    return { rangeFrom: from.toISOString(), rangeTo: to.toISOString() };
  }, []);

  const { data: unifiedData, isLoading } = useUnifiedCalendarEvents({
    from: rangeFrom,
    to: rangeTo,
    categories: selectedCategory === "all" ? undefined : selectedCategory,
    projectId: selectedProjectId || undefined,
  });

  const events = useMemo(() => {
    return (unifiedData?.events || []).filter(
      (e) => e.category !== "shift" // shifts are typically daily rosters displayed on schedule
    );
  }, [unifiedData]);

  // Determine timeline window bounds
  const { timelineStart, totalUnits, scaleDays } = useMemo(() => {
    const now = new Date();
    let minDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2);
    let maxDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 28);

    events.forEach((ev) => {
      const s = new Date(ev.startAt);
      const e = new Date(ev.endAt);
      if (!isNaN(s.getTime()) && s < minDate) minDate = s;
      if (!isNaN(e.getTime()) && e > maxDate) maxDate = e;
    });

    const start = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
    const totalDays = Math.max(28, Math.ceil((maxDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 4);

    return {
      timelineStart: start,
      totalUnits: zoomLevel === "days" ? totalDays : zoomLevel === "weeks" ? Math.ceil(totalDays / 7) : Math.ceil(totalDays / 30),
      scaleDays: totalDays,
    };
  }, [events, zoomLevel]);

  const getEventBarClass = (e: UnifiedCalendarEvent) => {
    switch (e.category) {
      case "production":
        return e.status === "COMPLETED"
          ? "bg-emerald-600/90 text-white"
          : "bg-amber-600/90 text-white";
      case "delivery":
        return e.status === "DELIVERED"
          ? "bg-emerald-600/90 text-white"
          : e.status === "FAILED"
          ? "bg-rose-600/90 text-white"
          : "bg-cyan-600/90 text-white";
      case "crm":
        return e.status === "COMPLETED"
          ? "bg-slate-700 text-slate-200"
          : "bg-indigo-600/90 text-white";
      case "milestone":
        return "bg-purple-600/90 text-white";
      case "task":
      default:
        return e.status === "DONE"
          ? "bg-emerald-600/90 text-white"
          : e.priority === "URGENT"
          ? "bg-rose-600/90 text-white"
          : "bg-primary-container text-on-primary-container";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "production": return "bakery_dining";
      case "delivery": return "local_shipping";
      case "crm": return "support_agent";
      case "milestone": return "flag";
      case "task": default: return "check_circle";
    }
  };

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="flex flex-col w-full">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 mb-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-semibold">
              Cross-System Timeline Gantt
            </h1>

            {projects.length > 0 && (
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-surface-container-high border border-outline-variant/30 text-on-surface text-body-sm rounded-lg px-2.5 py-1.5 focus:outline-none"
              >
                <option value="">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.key})
                  </option>
                ))}
              </select>
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
              href="/calendar"
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm border border-outline-variant/30"
            >
              <span className="material-symbols-outlined text-[15px]">calendar_month</span>
              <span>Calendar</span>
            </Link>
            <Link
              href="/schedule"
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm border border-outline-variant/30"
            >
              <span className="material-symbols-outlined text-[15px]">schedule</span>
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
                <span className="material-symbols-outlined text-[15px]">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {isLoading && (
          <div className="w-full py-16 text-center text-outline text-body-sm flex items-center justify-center gap-2">
            <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
            Loading timeline activities...
          </div>
        )}

        {!isLoading && events.length === 0 && (
          <div className="p-12 rounded-lg bg-surface-container-low border border-dashed border-outline-variant/30 text-center text-outline text-body-sm">
            No scheduled items found in this window to display on the timeline.
          </div>
        )}

        {!isLoading && events.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-12 rounded-lg border border-outline-variant/30 bg-surface-container-low shadow-sm overflow-hidden">
            {/* Left Rail */}
            <div className="xl:col-span-4 border-r border-outline-variant/30 bg-surface-container-low/60 flex flex-col">
              <div className="p-3 bg-surface-container-high/40 border-b border-outline-variant/30 font-label-badge text-outline text-[11px] uppercase tracking-wider flex items-center justify-between">
                <span>Operational Activity</span>
                <span>Schedule Date</span>
              </div>
              <div className="divide-y divide-outline-variant/20 flex flex-col">
                {events.map((ev) => (
                  <div key={ev.id} className="p-3 h-14 flex items-center justify-between hover:bg-surface-container transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span className="material-symbols-outlined text-[16px] text-outline shrink-0">
                        {getCategoryIcon(ev.category)}
                      </span>
                      <div className="min-w-0">
                        <span className="font-label-code text-[11px] text-primary">
                          {ev.code || ev.category.toUpperCase()}
                        </span>
                        <div className="text-[12px] text-on-surface truncate">{ev.title}</div>
                      </div>
                    </div>
                    <span className="font-label-code text-[11px] text-outline shrink-0">
                      {new Date(ev.startAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Gantt Canvas */}
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

              {/* Event Timeline Bars */}
              <div className="flex flex-col divide-y divide-outline-variant/15 min-w-[700px] relative">
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
                  const widthPct = Math.max(4, Math.min(100 - leftPct, (durationDays / scaleDays) * 100));

                  return (
                    <div key={ev.id} className="h-14 flex items-center px-1 relative">
                      <div
                        className={`h-7 rounded-md ${getEventBarClass(
                          ev
                        )} shadow-xs relative flex items-center px-2 group cursor-pointer hover:brightness-110 transition-all`}
                        style={{
                          marginLeft: `${leftPct}%`,
                          width: `${widthPct}%`,
                        }}
                        title={`${ev.title} (${ev.status})`}
                      >
                        <span className="font-label-code text-[11px] truncate z-10 font-medium">
                          {ev.title}
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
