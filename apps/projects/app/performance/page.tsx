"use client";

import React, { useState } from "react";
import { TrendingUp, ChevronRight } from "lucide-react";
import { useTeamPerformance, useMembers } from "@/lib/hooks/use-projects";
import { MemberPerformanceDrawer } from "@/components/MemberPerformanceDrawer";

function PerformanceContent() {
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const fromDate = React.useMemo(() => {
    const days = dateRange === "7d" ? 7 : dateRange === "90d" ? 90 : 30;
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  }, [dateRange]);

  const toDate = React.useMemo(() => new Date().toISOString(), []);

  const { data: teamData, isLoading } = useTeamPerformance(fromDate, toDate);
  const { data: members = [] } = useMembers();

  const overview = teamData?.squadOverview;
  const leaderboard = teamData?.leaderboard || [];

  return (
    <div className="flex flex-col w-full min-h-screen bg-surface p-6 md:p-8 space-y-6">
      {/* Header with Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h1 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Squad Performance & Throughput
            </h1>
          </div>
          <p className="font-body-sm text-body-sm text-outline mt-1">
            Enterprise delivery tracking, velocity analytics, on-time SLA metrics, and capacity utilization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-surface-container-low border border-outline-variant/40 p-1 text-body-sm">
            <button
              type="button"
              onClick={() => setDateRange("7d")}
              className={`px-3 py-1 rounded-md transition-colors ${
                dateRange === "7d"
                  ? "bg-surface-container-high text-on-surface font-medium"
                  : "text-outline hover:text-on-surface"
              }`}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => setDateRange("30d")}
              className={`px-3 py-1 rounded-md transition-colors ${
                dateRange === "30d"
                  ? "bg-surface-container-high text-on-surface font-medium"
                  : "text-outline hover:text-on-surface"
              }`}
            >
              Last 30 Days
            </button>
            <button
              type="button"
              onClick={() => setDateRange("90d")}
              className={`px-3 py-1 rounded-md transition-colors ${
                dateRange === "90d"
                  ? "bg-surface-container-high text-on-surface font-medium"
                  : "text-outline hover:text-on-surface"
              }`}
            >
              Quarter (90d)
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="p-12 text-center text-outline text-body-sm">
          Aggregating squad telemetry & KPIs...
        </div>
      )}

      {!isLoading && (
        <>
          {/* Executive KPI Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Average On-Time SLA */}
            <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1 shadow-xs">
              <span className="text-[11px] font-label-badge uppercase tracking-wider text-outline">
                Average On-Time SLA
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-display-sm font-headline-lg font-bold text-on-surface">
                  {overview?.averageOnTimeCompletionRate ?? 100}%
                </span>
                <span className="text-emerald-400 text-body-sm font-medium">Delivery Reliability</span>
              </div>
              <span className="text-[11px] text-outline mt-1">Closed on or before target milestone date</span>
            </div>

            {/* Total Velocity / Throughput */}
            <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1 shadow-xs">
              <span className="text-[11px] font-label-badge uppercase tracking-wider text-outline">
                Total Throughput / Velocity
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-display-sm font-headline-lg font-bold text-primary">
                  {overview?.totalVelocity ?? 0}
                </span>
                <span className="text-outline text-body-sm">Tasks Resolved</span>
              </div>
              <span className="text-[11px] text-outline mt-1">Across all projects in active window</span>
            </div>

            {/* Total Actual Hours Logged */}
            <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1 shadow-xs">
              <span className="text-[11px] font-label-badge uppercase tracking-wider text-outline">
                Logged Effort
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-display-sm font-headline-lg font-bold text-on-surface">
                  {overview?.totalHoursLogged ?? 0}h
                </span>
                <span className="text-outline text-body-sm">Actual Duration</span>
              </div>
              <span className="text-[11px] text-outline mt-1">Billable work + operational activities</span>
            </div>

            {/* Average Capacity Utilization */}
            <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1 shadow-xs">
              <span className="text-[11px] font-label-badge uppercase tracking-wider text-outline">
                Squad Capacity Utilization
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span
                  className={`text-display-sm font-headline-lg font-bold ${
                    (overview?.averageCapacityUtilization || 0) > 100
                      ? "text-red-400"
                      : (overview?.averageCapacityUtilization || 0) > 85
                      ? "text-amber-400"
                      : "text-on-surface"
                  }`}
                >
                  {overview?.averageCapacityUtilization ?? 0}%
                </span>
                <span className="text-outline text-body-sm font-label-code">Shift Load</span>
              </div>
              <span className="text-[11px] text-outline mt-1">Rostered shift capacity vs actual hours</span>
            </div>
          </div>

          {/* Member Performance Leaderboard & Comparison */}
          <div className="flex flex-col gap-3 rounded-xl bg-surface-container-low border border-outline-variant/30 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <div>
                <h3 className="font-headline-sm text-body-md text-on-surface font-semibold">
                  Squad Performance Leaderboard ({leaderboard.length || members.length})
                </h3>
                <p className="text-[11px] text-outline mt-0.5">
                  Click on any team member row to inspect granular KPIs, resolution averages, and task breakdown.
                </p>
              </div>
            </div>

            {leaderboard.length === 0 && members.length === 0 ? (
              <div className="p-8 text-center text-outline text-body-sm border border-dashed border-outline-variant/30 rounded-lg">
                No active team telemetry available for this period.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-body-sm">
                  <thead>
                    <tr className="border-b border-outline-variant/20 text-outline text-[11px] font-label-badge uppercase">
                      <th className="py-2.5 px-3">Team Member</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3 text-center">On-Time Rate</th>
                      <th className="py-2.5 px-3 text-center">Velocity</th>
                      <th className="py-2.5 px-3 text-center">Overdue</th>
                      <th className="py-2.5 px-3 text-center">Capacity Load</th>
                      <th className="py-2.5 px-3 text-right">Logged Hours</th>
                      <th className="py-2.5 px-3 text-right">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/15">
                    {leaderboard.map((item) => {
                      const m = item.member;
                      const kpis = item.kpis;
                      return (
                        <tr
                          key={m.id}
                          onClick={() => setSelectedMemberId(m.id)}
                          className="hover:bg-surface-container cursor-pointer transition-colors group"
                        >
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-semibold text-body-sm shrink-0">
                                {m.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-on-surface group-hover:text-primary transition-colors truncate">
                                  {m.name}
                                </div>
                                <div className="text-[11px] text-outline truncate">{m.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-label-code text-[11px] uppercase text-outline">
                              {m.role}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center gap-1 font-semibold text-on-surface">
                              {kpis.onTimeCompletionRate}%
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="font-label-code font-bold text-primary">
                              {kpis.velocity}
                            </span>
                            <span className="text-[10px] text-outline ml-1">/ {kpis.totalTasks}</span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            {kpis.overdueTaskCount > 0 ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-label-code bg-red-500/20 text-red-400 font-bold">
                                {kpis.overdueTaskCount}
                              </span>
                            ) : (
                              <span className="text-emerald-400 text-body-sm font-medium">0</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`font-semibold ${
                                kpis.capacityUtilizationRate > 100
                                  ? "text-red-400"
                                  : kpis.capacityUtilizationRate > 85
                                  ? "text-amber-400"
                                  : "text-on-surface"
                              }`}
                            >
                              {kpis.capacityUtilizationRate}%
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-label-code text-on-surface">
                            {kpis.totalActualHours}h
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              className="text-primary hover:text-primary/80 transition-colors inline-flex items-center text-[12px] font-medium"
                            >
                              <span>Drawer</span>
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Member Performance Inspection Drawer */}
      <MemberPerformanceDrawer
        isOpen={!!selectedMemberId}
        memberId={selectedMemberId}
        onClose={() => setSelectedMemberId(null)}
      />
    </div>
  );
}

export default function PerformancePage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-outline text-body-sm">Loading squad performance...</div>}>
      <PerformanceContent />
    </React.Suspense>
  );
}
