"use client";

import React, { useState } from "react";

interface CycleItem {
  id: string;
  name: string;
  status: "Active" | "Upcoming" | "Completed";
  dates: string;
  scopePoints: number;
  completedPoints: number;
  velocity: string;
  lead: string;
}

const CYCLES: CycleItem[] = [
  {
    id: "c-13",
    name: "Sprint 13: Architecture & Design Foundation",
    status: "Completed",
    dates: "Oct 01 – Oct 14, 2024",
    scopePoints: 84,
    completedPoints: 84,
    velocity: "100%",
    lead: "Elena Rostova",
  },
  {
    id: "c-14",
    name: "Sprint 14: Core UI & Analytics Telemetry",
    status: "Active",
    dates: "Oct 15 – Oct 29, 2024",
    scopePoints: 92,
    completedPoints: 66,
    velocity: "72%",
    lead: "Elena Rostova",
  },
  {
    id: "c-15",
    name: "Sprint 15: Enterprise SSO & SCIM Provisioning",
    status: "Upcoming",
    dates: "Oct 30 – Nov 13, 2024",
    scopePoints: 78,
    completedPoints: 0,
    velocity: "0%",
    lead: "Sarah Chen",
  },
  {
    id: "c-16",
    name: "Sprint 16: Distributed STOMP Scaling & SIEM",
    status: "Upcoming",
    dates: "Nov 14 – Nov 28, 2024",
    scopePoints: 65,
    completedPoints: 0,
    velocity: "0%",
    lead: "Marcus Vance",
  },
];

export function CyclesTab() {
  const [cycles, setCycles] = useState<CycleItem[]>(CYCLES);
  const [filter, setFilter] = useState<"all" | "Active" | "Upcoming" | "Completed">("all");

  const filteredCycles = cycles.filter((c) => filter === "all" || c.status === filter);

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
            Cycles & Sprints Roadmap
          </h2>
          <p className="text-body-sm text-outline">
            PRJ-204 Cadence • 2-Week Iteration Intervals
          </p>
        </div>

        <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded-lg border border-outline-variant/30 text-body-sm">
          {(["all", "Active", "Upcoming", "Completed"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`px-2.5 py-0.5 rounded text-[11px] font-label-code capitalize ${
                filter === s
                  ? "bg-surface-container-high text-on-surface font-medium"
                  : "text-outline hover:text-on-surface"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Active Sprint Spotlight */}
      <div className="p-5 rounded-lg bg-surface-container-low border border-primary-container/40 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Sprint 14: Core UI & Analytics (Current)
            </span>
            <span className="px-2 py-0.2 rounded bg-primary-container/20 text-primary text-[10px] font-label-badge uppercase">
              4 Days Remaining
            </span>
          </div>
          <span className="font-label-code text-[12px] text-outline">Oct 15 – Oct 29, 2024</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-3 rounded bg-surface-container-lowest border border-outline-variant/20">
            <span className="text-[11px] text-outline uppercase font-label-badge">Commitment</span>
            <div className="text-headline-sm font-semibold text-on-surface mt-1">92 Story Points</div>
          </div>
          <div className="p-3 rounded bg-surface-container-lowest border border-outline-variant/20">
            <span className="text-[11px] text-outline uppercase font-label-badge">Completed</span>
            <div className="text-headline-sm font-semibold text-primary mt-1">66 Points (72%)</div>
          </div>
          <div className="p-3 rounded bg-surface-container-lowest border border-outline-variant/20">
            <span className="text-[11px] text-outline uppercase font-label-badge">Burn Rate</span>
            <div className="text-headline-sm font-semibold text-emerald-400 mt-1">4.7 pts / day</div>
          </div>
          <div className="p-3 rounded bg-surface-container-lowest border border-outline-variant/20">
            <span className="text-[11px] text-outline uppercase font-label-badge">Lead</span>
            <div className="text-headline-sm font-semibold text-on-surface mt-1">Elena Rostova</div>
          </div>
        </div>

        <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
          <div className="h-full bg-primary-container rounded-full" style={{ width: "72%" }}></div>
        </div>
      </div>

      {/* Cycle Cadence List */}
      <div className="flex flex-col gap-3">
        {filteredCycles.map((cycle) => (
          <div
            key={cycle.id}
            className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-wrap items-center justify-between gap-4 hover:border-outline-variant transition-colors"
          >
            <div className="flex flex-col gap-1 min-w-[240px]">
              <div className="flex items-center gap-2">
                <span className="font-headline-sm text-body-md text-on-surface font-semibold">{cycle.name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-label-badge uppercase ${
                    cycle.status === "Active"
                      ? "bg-primary-container/20 text-primary"
                      : cycle.status === "Completed"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-surface-container text-outline"
                  }`}
                >
                  {cycle.status}
                </span>
              </div>
              <span className="text-[11px] text-outline font-label-code">{cycle.dates}</span>
            </div>

            <div className="flex items-center gap-6 text-[12px] font-label-code">
              <div>
                <span className="text-outline">Scope: </span>
                <span className="text-on-surface">{cycle.scopePoints} pts</span>
              </div>
              <div>
                <span className="text-outline">Burned: </span>
                <span className="text-on-surface">{cycle.completedPoints} pts</span>
              </div>
              <div>
                <span className="text-outline">Velocity: </span>
                <span className="text-primary font-medium">{cycle.velocity}</span>
              </div>
              <div className="text-outline hidden sm:inline">Lead: {cycle.lead}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
