"use client";

import React, { useState, useMemo } from "react";
import {
  useMembers,
  useTasks,
  useProjects,
  useCreateTask,
} from "@/lib/hooks/use-projects";
import { usePermissions } from "@/lib/permissions";

export default function SchedulePage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const { data: members = [], isLoading: isMembersLoading } = useMembers();
  const { data: tasks = [] } = useTasks();
  const { data: projects = [] } = useProjects();
  const createTaskMutation = useCreateTask();
  const { canManageTasks } = usePermissions();

  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [bookingMemberId, setBookingMemberId] = useState("");
  const [bookingProjectId, setBookingProjectId] = useState("");
  const [bookingHours, setBookingHours] = useState("4");
  const [bookingTask, setBookingTask] = useState("");

  // Calculate week window boundaries
  const { weekStart, weekEnd, weekLabel } = useMemo(() => {
    const now = new Date();
    const curr = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayOfWeek = (curr.getDay() + 6) % 7; // Monday = 0

    const monday = new Date(curr);
    monday.setDate(curr.getDate() - dayOfWeek + weekOffset * 7);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const label = `${monday.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${sunday.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

    return { weekStart: monday, weekEnd: sunday, weekLabel: label };
  }, [weekOffset]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const projectId = bookingProjectId || (projects[0]?.id || "");
    if (!projectId || !bookingTask.trim() || !canManageTasks) return;

    const hours = parseFloat(bookingHours) || 2;
    await createTaskMutation.mutateAsync({
      title: bookingTask.trim(),
      projectId,
      estimatedHours: hours,
      dueDate: weekEnd.toISOString(),
      assigneeIds: bookingMemberId ? [bookingMemberId] : undefined,
      status: "IN_PROGRESS",
      priority: "MEDIUM",
    });

    setIsBookModalOpen(false);
    setBookingTask("");
  };

  // Aggregate member allocations within the selected week
  const memberAllocations = useMemo(() => {
    return members.map((member) => {
      const memberTasks = tasks.filter((t) => {
        const isAssigned = t.assignees?.some((a) => a.member?.id === member.id);
        if (!isAssigned) return false;

        // Check if task falls into current week
        if (t.dueDate) {
          const due = new Date(t.dueDate);
          return due >= weekStart && due <= weekEnd;
        }
        // If no due date, include if weekOffset === 0 (current week)
        return weekOffset === 0;
      });

      const assignedHours = memberTasks.reduce(
        (acc, t) => acc + (Number(t.estimatedHours) || Number(t.actualHours) || 2),
        0
      );
      const totalCapacity = 40;

      return {
        member,
        assignedHours,
        totalCapacity,
        tasks: memberTasks,
      };
    });
  }, [members, tasks, weekStart, weekEnd, weekOffset]);

  const totalAssigned = memberAllocations.reduce((acc, m) => acc + m.assignedHours, 0);
  const totalCapacity = memberAllocations.length * 40 || 40;
  const clusterPercentage = Math.round((totalAssigned / totalCapacity) * 100);

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="flex flex-col w-full">
        {/* Top Action & Capacity Overview Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 mb-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded-lg border border-outline-variant/30">
              <button
                type="button"
                onClick={() => setWeekOffset(weekOffset - 1)}
                className="w-6 h-6 flex items-center justify-center text-outline hover:text-on-surface"
                title="Previous Week"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              <div className="flex items-center gap-1.5 px-2">
                <span className="material-symbols-outlined text-[15px] text-primary">calendar_month</span>
                <span className="font-headline-sm text-body-md text-on-surface font-medium">
                  {weekLabel} {weekOffset === 0 ? "(Current)" : ""}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setWeekOffset(weekOffset + 1)}
                className="w-6 h-6 flex items-center justify-center text-outline hover:text-on-surface"
                title="Next Week"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
              {weekOffset !== 0 && (
                <button
                  type="button"
                  onClick={() => setWeekOffset(0)}
                  className="px-2 py-0.5 ml-1 text-label-badge font-label-badge bg-surface-container-high text-on-surface rounded"
                >
                  Current
                </button>
              )}
            </div>
          </div>

          {/* Right: Capacity Metric & Booking Action */}
          <div className="flex items-center gap-space-md">
            <div className="flex items-center gap-space-sm bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/30">
              <div className="flex flex-col text-right">
                <span className="font-headline-sm text-body-sm text-on-surface font-semibold tracking-tight">
                  {totalAssigned}h / {totalCapacity}h
                </span>
                <span className="font-body-sm text-[10px] text-outline">Squad Allocation</span>
              </div>
              <span
                className={`font-label-badge text-label-badge px-1.5 py-0.5 rounded ${
                  clusterPercentage > 100
                    ? "bg-red-500/20 text-red-400"
                    : clusterPercentage > 85
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-primary-container/20 text-primary"
                }`}
              >
                {clusterPercentage}%
              </span>
            </div>

            {canManageTasks && (
              <button
                type="button"
                onClick={() => setIsBookModalOpen(true)}
                className="h-8 px-space-md bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                <span>Book Capacity</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal: Book Capacity */}
        {isBookModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-lg bg-surface-container-low border border-outline-variant/50 p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Book Squad Capacity</h3>
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="w-6 h-6 rounded flex items-center justify-center text-outline hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
              <form onSubmit={handleBooking} className="flex flex-col gap-4 mt-4">
                <div>
                  <label className="block text-body-sm font-medium text-on-surface mb-1">Project</label>
                  <select
                    value={bookingProjectId || (projects[0]?.id || "")}
                    onChange={(e) => setBookingProjectId(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-body-sm font-medium text-on-surface mb-1">Squad Member</label>
                  <select
                    value={bookingMemberId || (members[0]?.id || "")}
                    onChange={(e) => setBookingMemberId(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-body-sm font-medium text-on-surface mb-1">Hours to Reserve</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="40"
                    value={bookingHours}
                    onChange={(e) => setBookingHours(e.target.value)}
                    className="w-full h-8 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm"
                  />
                </div>
                <div>
                  <label className="block text-body-sm font-medium text-on-surface mb-1">Task / Objective</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Memory profiling session"
                    value={bookingTask}
                    onChange={(e) => setBookingTask(e.target.value)}
                    className="w-full h-8 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsBookModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-body-sm text-outline hover:text-on-surface"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createTaskMutation.isPending}
                    className="px-4 py-1.5 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm disabled:opacity-50"
                  >
                    {createTaskMutation.isPending ? "Reserving..." : "Reserve Hours"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Member Capacity Deck */}
        {isMembersLoading && (
          <div className="w-full py-12 text-center text-outline text-body-sm">
            Loading squad capacity...
          </div>
        )}

        {!isMembersLoading && memberAllocations.length === 0 && (
          <div className="p-12 rounded-lg bg-surface-container-low border border-dashed border-outline-variant/30 text-center text-outline text-body-sm">
            No squad members found in this organization.
          </div>
        )}

        <div className="flex flex-col gap-3">
          {memberAllocations.map(({ member, assignedHours, totalCapacity, tasks: mTasks }) => {
            const usagePercent = Math.round((assignedHours / totalCapacity) * 100);
            return (
              <div
                key={member.id}
                className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-3 shadow-xs hover:border-outline-variant transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-headline-sm text-body-sm">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-headline-sm text-body-md text-on-surface font-semibold">{member.name}</div>
                      <div className="text-[11px] text-outline">{member.role} • {member.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-baseline gap-1 font-label-code">
                      <span className="text-body-md font-semibold text-on-surface">{assignedHours}h</span>
                      <span className="text-[11px] text-outline">/ {totalCapacity}h</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-label-code ${
                        usagePercent > 100
                          ? "bg-red-500/20 text-red-400"
                          : usagePercent > 80
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-surface-container text-on-surface"
                      }`}
                    >
                      {usagePercent}%
                    </span>
                  </div>
                </div>

                {/* Capacity Progress Bar */}
                <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-primary-container rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                  ></div>
                </div>

                {/* Allocation Chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {mTasks.slice(0, 8).map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container text-[11px] text-on-surface-variant border border-outline-variant/20"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      <span className="text-outline font-label-code">{t.taskKey || t.id.slice(-6)}:</span>
                      <span className="truncate max-w-[140px]">{t.title}</span>
                      <span className="font-label-code text-outline">({t.estimatedHours || 2}h)</span>
                    </div>
                  ))}
                  {mTasks.length === 0 && (
                    <span className="text-[11px] text-outline italic">Available for sprint allocations this week</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
