"use client";

import React, { useState } from "react";
import { X, AlertCircle, CheckCircle2 } from "lucide-react";
import { useMemberPerformance } from "@/lib/hooks/use-projects";

interface MemberPerformanceDrawerProps {
  isOpen?: boolean;
  memberId: string | null;
  onClose: () => void;
}

export function MemberPerformanceDrawer({
  isOpen = true,
  memberId,
  onClose,
}: MemberPerformanceDrawerProps) {
  const [dateFilter, setDateFilter] = useState<"7d" | "30d" | "90d">("30d");
  const { data: performance, isLoading } = useMemberPerformance(memberId || "");

  if (!isOpen || !memberId) return null;

  const kpis = performance?.kpis;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-xl bg-surface-container-lowest border-l border-outline-variant/30 h-full overflow-y-auto flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-body-md">
              {performance?.member.name?.charAt(0) || "U"}
            </div>
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface font-semibold tracking-tight">
                {performance?.member.name || "Member Performance"}
              </h2>
              <div className="text-[12px] text-outline">
                {performance?.member.role || "Member"} • {performance?.member.email}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Date Filter Strip */}
        <div className="px-6 py-3 bg-surface-container-low border-b border-outline-variant/20 flex items-center justify-between">
          <span className="text-[11px] font-label-badge uppercase tracking-wider text-outline">
            Performance Window
          </span>
          <div className="flex rounded-md bg-surface-container p-0.5 border border-outline-variant/30 text-[11px]">
            <button
              type="button"
              onClick={() => setDateFilter("7d")}
              className={`px-2.5 py-1 rounded-sm font-medium transition-colors ${
                dateFilter === "7d" ? "bg-surface-container-high text-on-surface" : "text-outline hover:text-on-surface"
              }`}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => setDateFilter("30d")}
              className={`px-2.5 py-1 rounded-sm font-medium transition-colors ${
                dateFilter === "30d" ? "bg-surface-container-high text-on-surface" : "text-outline hover:text-on-surface"
              }`}
            >
              Last 30 Days
            </button>
            <button
              type="button"
              onClick={() => setDateFilter("90d")}
              className={`px-2.5 py-1 rounded-sm font-medium transition-colors ${
                dateFilter === "90d" ? "bg-surface-container-high text-on-surface" : "text-outline hover:text-on-surface"
              }`}
            >
              Quarter (90d)
            </button>
          </div>
        </div>

        {/* Content Body */}
        {isLoading && (
          <div className="flex-1 flex items-center justify-center p-12 text-outline text-body-sm">
            Calculating member KPIs...
          </div>
        )}

        {!isLoading && performance && (
          <div className="p-6 flex flex-col gap-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* On-Time Completion Rate */}
              <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
                <span className="text-[11px] font-label-badge uppercase text-outline">On-Time Completion</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-headline-lg font-headline-lg font-semibold text-on-surface">
                    {kpis?.onTimeCompletionRate}%
                  </span>
                </div>
                <span className="text-[10px] text-outline">Tasks closed on or before due date</span>
              </div>

              {/* Velocity / Throughput */}
              <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
                <span className="text-[11px] font-label-badge uppercase text-outline">Throughput / Velocity</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-headline-lg font-headline-lg font-semibold text-on-surface">
                    {kpis?.velocity}
                  </span>
                  <span className="text-[11px] text-outline">/ {kpis?.totalTasks} issues</span>
                </div>
                <span className="text-[10px] text-outline">Completed in selected window</span>
              </div>

              {/* Capacity Utilization */}
              <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
                <span className="text-[11px] font-label-badge uppercase text-outline">Capacity Utilization</span>
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-headline-lg font-headline-lg font-semibold ${
                      (kpis?.capacityUtilizationRate || 0) > 100
                        ? "text-red-400"
                        : (kpis?.capacityUtilizationRate || 0) > 85
                        ? "text-amber-400"
                        : "text-on-surface"
                    }`}
                  >
                    {kpis?.capacityUtilizationRate}%
                  </span>
                  <span className="text-[11px] text-outline font-label-code">
                    ({kpis?.totalActualHours}h / {kpis?.expectedCapacityHours}h)
                  </span>
                </div>
                <span className="text-[10px] text-outline">Logged hours vs rostered shift capacity</span>
              </div>

              {/* Average Resolution Time */}
              <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
                <span className="text-[11px] font-label-badge uppercase text-outline">Avg Resolution Time</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-headline-lg font-headline-lg font-semibold text-on-surface">
                    {kpis?.averageResolutionHours}h
                  </span>
                </div>
                <span className="text-[10px] text-outline">Mean cycle duration from start to done</span>
              </div>
            </div>

            {/* Overdue Task Alert Banner */}
            {(kpis?.overdueTaskCount || 0) > 0 ? (
              <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-between text-body-sm text-red-400">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span><strong>{kpis?.overdueTaskCount} Overdue Issue(s)</strong> currently pending resolution.</span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-body-sm text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>Zero overdue tasks in active backlog. Excellent SLA adherence!</span>
              </div>
            )}

            {/* Estimation Accuracy Strip */}
            <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-headline-sm text-body-sm text-on-surface font-semibold">
                  Estimation Accuracy
                </span>
                <span className="text-outline font-label-code text-[11px]">
                  {kpis?.totalActualHours}h actual / {kpis?.totalEstimatedHours}h estimated
                </span>
              </div>
              <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-primary-container rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        ((kpis?.totalActualHours || 0) / Math.max(1, kpis?.totalEstimatedHours || 1)) * 100
                      )
                    )}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Recent Tasks List */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="font-headline-sm text-body-sm text-on-surface font-semibold">
                  Recent Workload & Issues ({performance.recentTasks?.length || 0})
                </h4>
              </div>

              {(!performance.recentTasks || performance.recentTasks.length === 0) && (
                <div className="p-6 rounded-lg bg-surface-container-low border border-dashed border-outline-variant/30 text-center text-outline text-body-sm">
                  No issues updated in this time period.
                </div>
              )}

              <div className="divide-y divide-outline-variant/20 rounded-lg bg-surface-container-low border border-outline-variant/30 overflow-hidden">
                {performance.recentTasks?.map((task) => (
                  <div key={task.id} className="p-3 flex items-center justify-between gap-3 text-body-sm hover:bg-surface-container transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-label-code text-[11px] text-primary shrink-0">
                        {task.taskKey || task.id.slice(-6)}
                      </span>
                      <span className="text-on-surface truncate font-medium">{task.title}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] font-label-code text-outline">
                        {task.actualHours || 0}h / {task.estimatedHours || 0}h
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-label-code bg-surface-container-high text-on-surface">
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
