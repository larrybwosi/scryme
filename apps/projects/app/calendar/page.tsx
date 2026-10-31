"use client";

import Link from "next/link";
import React, { useState } from "react";

interface CalendarEvent {
  id: string;
  day: number;
  title: string;
  type: "sprint" | "milestone" | "task" | "review";
  time?: string;
  color: string;
}

const DAYS_IN_MONTH = 31;
const START_DAY_OFFSET = 1; // Starts on Tuesday for Oct 2024

const EVENTS: CalendarEvent[] = [
  { id: "e1", day: 2, title: "Sprint 14 Planning & Token Alignment", type: "sprint", color: "bg-primary-container text-on-primary-container" },
  { id: "e2", day: 8, title: "RFC-8819 Architecture Sync", type: "review", color: "bg-surface-container-high text-primary border border-primary/30" },
  { id: "e3", day: 15, title: "WebGL Canvas Performance Benchmark", type: "task", color: "bg-surface-container-high text-amber-400 border border-amber-400/30" },
  { id: "e4", day: 21, title: "Sprint 14 Mid-Cycle Review", type: "sprint", color: "bg-primary-container/80 text-on-primary-container" },
  { id: "e5", day: 24, title: "SCR-104 Real-time Telemetry Delivery", type: "task", color: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" },
  { id: "e6", day: 29, title: "Nexus 2.0 Beta Release Candidate", type: "milestone", color: "bg-secondary-container text-on-secondary-container font-semibold" },
  { id: "e7", day: 31, title: "Okta & Google SSO Certification", type: "milestone", color: "bg-surface-container-highest text-on-surface" },
];

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [currentMonth, setCurrentMonth] = useState("October");
  const [currentYear, setCurrentYear] = useState(2024);
  const [selectedDay, setSelectedDay] = useState<number | null>(24);
  const [filterType, setFilterType] = useState<string>("all");

  const prevMonth = () => {
    if (currentMonth === "October") setCurrentMonth("September");
    else if (currentMonth === "November") setCurrentMonth("October");
  };

  const nextMonth = () => {
    if (currentMonth === "September") setCurrentMonth("October");
    else if (currentMonth === "October") setCurrentMonth("November");
  };

  const filteredEvents = EVENTS.filter(
    (e) => filterType === "all" || e.type === filterType
  );

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
                onClick={prevMonth}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-container-low hover:bg-surface-container text-outline hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentMonth("October");
                  setSelectedDay(24);
                }}
                className="px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-body-sm text-body-sm transition-colors"
              >
                Today
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-container-low hover:bg-surface-container text-outline hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>

            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight pl-2">
              {currentMonth} <span className="text-outline font-normal">{currentYear}</span>
            </h1>
          </div>

          {/* Right Controls: Filters & New Event */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded-lg border border-outline-variant/30 text-body-sm">
              <span className="text-outline text-[11px] px-1 font-label-badge">Show:</span>
              {["all", "sprint", "milestone", "task", "review"].map((type) => (
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

        {/* Calendar View Container */}
        {viewMode === "month" ? (
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
              {/* Empty leading offset days */}
              {Array.from({ length: START_DAY_OFFSET }).map((_, i) => (
                <div key={`offset-${i}`} className="p-2 bg-surface-container-lowest/40 opacity-40">
                  <span className="text-outline font-label-code text-[11px]">
                    {30 - START_DAY_OFFSET + i + 1}
                  </span>
                </div>
              ))}

              {/* Day cells */}
              {Array.from({ length: DAYS_IN_MONTH }).map((_, idx) => {
                const day = idx + 1;
                const isToday = day === 24;
                const isSelected = selectedDay === day;
                const dayEvents = filteredEvents.filter((e) => e.day === day);

                return (
                  <div
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`p-2 transition-colors cursor-pointer flex flex-col min-h-[100px] ${
                      isSelected
                        ? "bg-surface-container border-2 border-primary-container"
                        : "hover:bg-surface-container/60"
                    } ${isToday ? "bg-primary-container/5" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-label-code text-[12px] ${
                          isToday
                            ? "bg-primary-container text-on-primary-container font-bold"
                            : "text-on-surface"
                        }`}
                      >
                        {day}
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
                          title={ev.title}
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
        ) : (
          <div className="p-8 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col items-center justify-center text-center gap-3">
            <span className="material-symbols-outlined text-[40px] text-primary">calendar_view_week</span>
            <h3 className="text-headline-sm font-headline-sm text-on-surface">
              {viewMode === "week" ? "Week Schedule Perspective" : "Day Schedule Timeline"}
            </h3>
            <p className="text-body-sm text-outline max-w-md">
              Switching to the detailed capacity schedule view provides resource allocations and hourly distribution.
            </p>
            <Link
              href="/schedule"
              className="px-4 py-2 rounded-lg bg-primary-container text-on-primary-container font-headline-sm text-body-sm mt-2"
            >
              Open Resource Schedule
            </Link>
          </div>
        )}

        {/* Selected Day Inspector Panel */}
        {selectedDay && (
          <div className="mt-4 p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-headline-sm text-body-md text-on-surface font-semibold">
                Agenda for {currentMonth} {selectedDay}, {currentYear}
              </span>
              <span className="font-label-code text-[11px] text-outline">
                {filteredEvents.filter((e) => e.day === selectedDay).length} Scheduled Events
              </span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {filteredEvents.filter((e) => e.day === selectedDay).map((ev) => (
                <div
                  key={ev.id}
                  className="p-3 rounded-lg bg-surface-container border border-outline-variant/20 flex flex-col gap-1 min-w-[240px]"
                >
                  <span className="text-body-sm text-on-surface font-medium">{ev.title}</span>
                  <span className="text-[11px] text-outline uppercase font-label-badge">{ev.type}</span>
                </div>
              ))}
              {filteredEvents.filter((e) => e.day === selectedDay).length === 0 && (
                <span className="text-outline text-body-sm py-2">No milestones or sprint releases scheduled on this date.</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
