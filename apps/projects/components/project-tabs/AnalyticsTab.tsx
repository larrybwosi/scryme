"use client";

import React, { useState } from "react";

export function AnalyticsTab() {
  const [timeRange, setTimeRange] = useState<"7d" | "14d" | "30d" | "90d">("14d");
  const [metricScope, setMetricScope] = useState<"all" | "velocity" | "burn" | "quality">("all");

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Top Header & Range Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
            Executive Telemetry & Velocity Analytics
          </h2>
          <p className="text-body-sm text-outline">
            PRJ-204 Real-time Engineering Graph • 84% Cadence Velocity
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time Range Selector */}
          <div className="flex items-center bg-surface-container-lowest p-0.5 rounded-lg border border-outline-variant/30 text-body-sm">
            {(["7d", "14d", "30d", "90d"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 text-label-badge font-label-badge rounded-md uppercase transition-all ${
                  timeRange === r
                    ? "bg-surface-container-high text-on-surface font-medium shadow-sm"
                    : "text-outline hover:text-on-surface"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Metric Filter */}
          <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded-lg border border-outline-variant/30 text-body-sm">
            {(["all", "velocity", "burn", "quality"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setMetricScope(s)}
                className={`px-2 py-0.5 rounded text-[11px] font-label-code capitalize ${
                  metricScope === s
                    ? "bg-surface-container-high text-on-surface font-medium"
                    : "text-outline hover:text-on-surface"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
          <span className="text-outline text-body-sm">Cycle Velocity</span>
          <span className="text-headline-lg font-headline-lg text-on-surface font-semibold">48.2 pts</span>
          <span className="text-[11px] text-emerald-400 font-label-code">+18% vs previous cycle</span>
        </div>
        <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
          <span className="text-outline text-body-sm">Lead Time to Production</span>
          <span className="text-headline-lg font-headline-lg text-on-surface font-semibold">18.4 hrs</span>
          <span className="text-[11px] text-primary font-label-code">P95 turnaround</span>
        </div>
        <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
          <span className="text-outline text-body-sm">PR Review Latency</span>
          <span className="text-headline-lg font-headline-lg text-on-surface font-semibold">2.4 hrs</span>
          <span className="text-[11px] text-emerald-400 font-label-code">Median first review</span>
        </div>
        <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
          <span className="text-outline text-body-sm">Defect Escape Rate</span>
          <span className="text-headline-lg font-headline-lg text-on-surface font-semibold">0.4%</span>
          <span className="text-[11px] text-emerald-400 font-label-code">0 critical breaches</span>
        </div>
      </div>

      {/* Interactive Charts Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Velocity Burndown Chart */}
        <div className="p-5 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
            <h3 className="font-headline-sm text-body-md text-on-surface font-semibold">
              Interactive Sprint Burndown ({timeRange})
            </h3>
            <span className="text-[11px] font-label-code text-outline">Ideal vs Actual</span>
          </div>

          <div className="h-48 flex items-end justify-between gap-2 pt-6 px-2">
            {[90, 82, 75, 68, 62, 54, 46, 38, 28, 22, 16, 12, 8, 4].map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-primary-container hover:bg-primary transition-all rounded-t-sm"
                  style={{ height: `${val * 1.8}px` }}
                  title={`Day ${idx + 1}: ${val} points remaining`}
                ></div>
                <span className="text-[9px] text-outline font-label-code">D{idx + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Issue Distribution by Squad */}
        <div className="p-5 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
            <h3 className="font-headline-sm text-body-md text-on-surface font-semibold">
              Issue Distribution & Capital Burn
            </h3>
            <span className="text-[11px] font-label-code text-outline">58 Active Issues</span>
          </div>

          <div className="flex flex-col gap-3 justify-center h-48">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px] font-label-code">
                <span className="text-on-surface">Frontend & Real-time Canvas (SCR-104)</span>
                <span className="text-outline">42% (24 issues)</span>
              </div>
              <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-primary-container rounded-full w-[42%]"></div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px] font-label-code">
                <span className="text-on-surface">Graphics & WebGL Buffer Pipeline</span>
                <span className="text-outline">28% (16 issues)</span>
              </div>
              <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-secondary-container rounded-full w-[28%]"></div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px] font-label-code">
                <span className="text-on-surface">Security & SAML Authentication</span>
                <span className="text-outline">18% (11 issues)</span>
              </div>
              <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-[18%]"></div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px] font-label-code">
                <span className="text-on-surface">Distributed Infrastructure & Caching</span>
                <span className="text-outline">12% (7 issues)</span>
              </div>
              <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full w-[12%]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
