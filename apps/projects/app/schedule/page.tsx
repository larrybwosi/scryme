"use client";

import React, { useState, useMemo } from "react";
import {
  useMembers,
  useProjects,
  useCreateTask,
  useUnifiedCalendarEvents,
  useStaffShifts,
  useCreateStaffShift,
  useUpdateStaffShift,
  useDeleteStaffShift,
  useShiftTrades,
  useRequestShiftTrade,
  useProcessShiftTrade,
  StaffShiftItem,
} from "@/lib/hooks/use-projects";
import { usePermissions } from "@/lib/permissions";
import { toast } from "sonner";

const DAYS_OF_WEEK = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
];

export default function SchedulePage() {
  const [activeTab, setActiveTab] = useState<"roster" | "shifts" | "trades">("roster");
  const [weekOffset, setWeekOffset] = useState(0);

  const { data: members = [], isLoading: isMembersLoading } = useMembers();
  const { data: projects = [] } = useProjects();
  const { data: staffShifts = [], isLoading: isShiftsLoading } = useStaffShifts();
  const { data: shiftTrades = [], isLoading: isTradesLoading } = useShiftTrades();

  const createTaskMutation = useCreateTask();
  const createShiftMutation = useCreateStaffShift();
  const updateShiftMutation = useUpdateStaffShift();
  const deleteShiftMutation = useDeleteStaffShift();
  const requestTradeMutation = useRequestShiftTrade();
  const processTradeMutation = useProcessShiftTrade();

  const { canManageTasks, memberId: currentMemberId } = usePermissions();

  // Booking Capacity Modal State
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [bookingMemberId, setBookingMemberId] = useState("");
  const [bookingProjectId, setBookingProjectId] = useState("");
  const [bookingHours, setBookingHours] = useState("4");
  const [bookingTask, setBookingTask] = useState("");

  // Shift Modal State (Create & Edit)
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [shiftMemberId, setShiftMemberId] = useState("");
  const [shiftDayOfWeek, setShiftDayOfWeek] = useState<number>(1);
  const [shiftStartTime, setShiftStartTime] = useState("09:00");
  const [shiftEndTime, setShiftEndTime] = useState("17:00");

  // Trade Modal State
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [tradeShiftId, setTradeShiftId] = useState("");
  const [tradeTargetMemberId, setTradeTargetMemberId] = useState("");
  const [tradeReason, setTradeReason] = useState("");

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

  // Query unified events for the active week window
  const { data: unifiedData } = useUnifiedCalendarEvents({
    from: weekStart.toISOString(),
    to: weekEnd.toISOString(),
  });

  // Calculate shift conflicts (overlapping intervals for same member on same day)
  const shiftConflicts = useMemo(() => {
    const conflicts = new Set<string>();
    for (let i = 0; i < staffShifts.length; i++) {
      const s1 = staffShifts[i];
      if (!s1.isActive) continue;
      const [s1H1, s1M1] = s1.startTime.split(":").map(Number);
      const [s1H2, s1M2] = s1.endTime.split(":").map(Number);
      const start1 = s1H1 * 60 + s1M1;
      const end1 = s1H2 * 60 + s1M2;

      for (let j = i + 1; j < staffShifts.length; j++) {
        const s2 = staffShifts[j];
        if (!s2.isActive) continue;
        if (s1.memberId === s2.memberId && s1.dayOfWeek === s2.dayOfWeek) {
          const [s2H1, s2M1] = s2.startTime.split(":").map(Number);
          const [s2H2, s2M2] = s2.endTime.split(":").map(Number);
          const start2 = s2H1 * 60 + s2M1;
          const end2 = s2H2 * 60 + s2M2;

          if (Math.max(start1, start2) < Math.min(end1, end2)) {
            conflicts.add(s1.id);
            conflicts.add(s2.id);
          }
        }
      }
    }
    return conflicts;
  }, [staffShifts]);

  // Capacity calculations combining shifts and tasks
  const memberAllocations = useMemo(() => {
    if (!members.length) return [];

    return members.map((member) => {
      const assignedTasks = (unifiedData?.events || []).filter(
        (e) =>
          (e.category === "task" || e.category === "production" || e.category === "delivery") &&
          e.assignees?.some((a) => a.id === member.id)
      );

      const assignedHours = assignedTasks.reduce((acc, curr) => {
        const hours = (curr.details as any)?.estimatedHours || 3;
        return acc + Number(hours);
      }, 0);

      const memberShifts = staffShifts.filter((s) => s.memberId === member.id && s.isActive);
      let calculatedCapacity = 0;
      for (const s of memberShifts) {
        const [h1, m1] = s.startTime.split(":").map(Number);
        const [h2, m2] = s.endTime.split(":").map(Number);
        const diffM = h2 * 60 + m2 - (h1 * 60 + m1);
        if (diffM > 0) calculatedCapacity += diffM / 60;
      }

      const totalCapacity = calculatedCapacity > 0 ? calculatedCapacity : 40;

      return {
        member,
        assignedHours,
        totalCapacity,
        shiftCount: memberShifts.length,
        assignedTasks,
      };
    });
  }, [members, unifiedData, staffShifts]);

  const totalAssigned = memberAllocations.reduce((acc, m) => acc + m.assignedHours, 0);
  const totalCapacity = memberAllocations.reduce((acc, m) => acc + m.totalCapacity, 0);
  const clusterPercentage = totalCapacity > 0 ? Math.round((totalAssigned / totalCapacity) * 100) : 0;

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
    });

    toast.success("Squad capacity booked successfully");
    setIsBookModalOpen(false);
    setBookingTask("");
  };

  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetMember = shiftMemberId || members[0]?.id;
    if (!targetMember) return;

    // Check for overlapping intervals in local shifts
    const [h1, m1] = shiftStartTime.split(":").map(Number);
    const [h2, m2] = shiftEndTime.split(":").map(Number);
    const newStart = h1 * 60 + m1;
    const newEnd = h2 * 60 + m2;

    if (newEnd <= newStart) {
      toast.error("Shift end time must be after start time");
      return;
    }

    const hasConflict = staffShifts.some((s) => {
      if (!s.isActive || s.id === editingShiftId) return false;
      if (s.memberId === targetMember && s.dayOfWeek === shiftDayOfWeek) {
        const [s1, sm1] = s.startTime.split(":").map(Number);
        const [s2, sm2] = s.endTime.split(":").map(Number);
        return Math.max(newStart, s1 * 60 + sm1) < Math.min(newEnd, s2 * 60 + sm2);
      }
      return false;
    });

    if (hasConflict) {
      const proceed = window.confirm(
        "Warning: This shift overlaps with an existing shift for this member on that day. Save anyway?"
      );
      if (!proceed) return;
    }

    try {
      if (editingShiftId) {
        await updateShiftMutation.mutateAsync({
          shiftId: editingShiftId,
          data: {
            dayOfWeek: shiftDayOfWeek,
            startTime: shiftStartTime,
            endTime: shiftEndTime,
          },
        });
        toast.success("Shift updated successfully");
      } else {
        await createShiftMutation.mutateAsync({
          memberId: targetMember,
          dayOfWeek: shiftDayOfWeek,
          startTime: shiftStartTime,
          endTime: shiftEndTime,
          isActive: true,
        });
        toast.success("Shift created and scheduled");
      }
      setIsShiftModalOpen(false);
      setEditingShiftId(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save shift");
    }
  };

  const handleDeleteShift = async (shiftId: string) => {
    if (!window.confirm("Are you sure you want to delete this staff shift?")) return;
    try {
      await deleteShiftMutation.mutateAsync(shiftId);
      toast.success("Shift deleted");
    } catch (err: any) {
      toast.error("Failed to delete shift");
    }
  };

  const handleOpenEditShift = (shift: StaffShiftItem) => {
    setEditingShiftId(shift.id);
    setShiftMemberId(shift.memberId);
    setShiftDayOfWeek(shift.dayOfWeek);
    setShiftStartTime(shift.startTime);
    setShiftEndTime(shift.endTime);
    setIsShiftModalOpen(true);
  };

  const handleCreateTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tradeShiftId) return;

    try {
      await requestTradeMutation.mutateAsync({
        shiftId: tradeShiftId,
        targetMemberId: tradeTargetMemberId || undefined,
        reason: tradeReason || undefined,
      });
      toast.success("Shift trade request submitted");
      setIsTradeModalOpen(false);
      setTradeShiftId("");
      setTradeReason("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit trade request");
    }
  };

  const handleProcessTrade = async (tradeId: string, action: "APPROVE" | "REJECT" | "CANCEL") => {
    try {
      await processTradeMutation.mutateAsync({ tradeId, action });
      toast.success(`Trade request ${action.toLowerCase()}ed`);
    } catch (err: any) {
      toast.error(`Failed to ${action.toLowerCase()} trade request`);
    }
  };

  const myShifts = staffShifts.filter((s) => s.memberId === currentMemberId);

  return (
    <div className="flex flex-col w-full min-h-screen bg-surface text-on-surface">
      <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
        {/* Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
              Enterprise Scheduling & Workload
            </h1>
            <p className="font-body-sm text-body-sm text-outline mt-1">
              Roster management, conflict detection, capacity planning, and shift trade workflows.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg bg-surface-container-low p-1 border border-outline-variant/30">
              <button
                type="button"
                onClick={() => setActiveTab("roster")}
                className={`px-3 py-1 text-body-sm rounded-md font-medium transition-colors ${
                  activeTab === "roster"
                    ? "bg-surface-container-high text-on-surface shadow-xs"
                    : "text-outline hover:text-on-surface"
                }`}
              >
                Workload & Capacity
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("shifts")}
                className={`px-3 py-1 text-body-sm rounded-md font-medium transition-colors ${
                  activeTab === "shifts"
                    ? "bg-surface-container-high text-on-surface shadow-xs"
                    : "text-outline hover:text-on-surface"
                }`}
              >
                Staff Shifts ({staffShifts.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("trades")}
                className={`px-3 py-1 text-body-sm rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === "trades"
                    ? "bg-surface-container-high text-on-surface shadow-xs"
                    : "text-outline hover:text-on-surface"
                }`}
              >
                <span>Trades & Requests</span>
                {shiftTrades.filter((t) => t.status === "PENDING").length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tab 1: Workload & Capacity */}
        {activeTab === "roster" && (
          <div className="flex flex-col gap-6">
            {/* Week navigation strip */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-surface-container-low border border-outline-variant/30">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWeekOffset((p) => p - 1)}
                  className="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <div className="font-headline-sm text-body-md text-on-surface font-semibold px-2 min-w-[200px] text-center">
                  {weekLabel}
                </div>
                <button
                  type="button"
                  onClick={() => setWeekOffset((p) => p + 1)}
                  className="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
                {weekOffset !== 0 && (
                  <button
                    type="button"
                    onClick={() => setWeekOffset(0)}
                    className="text-body-sm text-primary hover:underline px-2"
                  >
                    Current Week
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/20">
                  <div className="flex flex-col text-right">
                    <span className="font-headline-sm text-body-sm text-on-surface font-semibold tracking-tight">
                      {totalAssigned}h / {totalCapacity}h
                    </span>
                    <span className="font-body-sm text-[10px] text-outline">Cluster Allocation</span>
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
              {memberAllocations.map(({ member, assignedHours, totalCapacity, shiftCount, assignedTasks }) => {
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
                          <div className="text-[11px] text-outline">
                            {member.role} • {member.email} {shiftCount > 0 ? `• ${shiftCount} rostered shift(s)` : ""}
                          </div>
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
                              ? "bg-red-500/20 text-red-400 font-semibold"
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
                        className={`h-full rounded-full transition-all duration-300 ${
                          usagePercent > 100 ? "bg-red-500" : "bg-primary-container"
                        }`}
                        style={{ width: `${Math.min(usagePercent, 100)}%` }}
                      ></div>
                    </div>

                    {/* Allocation Chips */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {assignedTasks.slice(0, 8).map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container text-[11px] text-on-surface-variant border border-outline-variant/20"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                          <span className="text-outline font-label-code capitalize">{t.category}:</span>
                          <span className="truncate max-w-[140px]">{t.title}</span>
                        </div>
                      ))}
                      {assignedTasks.length === 0 && (
                        <span className="text-[11px] text-outline italic">Available for squad and operational allocations</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Staff Shifts Management */}
        {activeTab === "shifts" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-headline-sm text-body-md text-on-surface font-semibold">
                  Rostered Weekly Shifts
                </h3>
                <p className="text-[12px] text-outline">
                  Configure recurring weekly schedules and active working hours per squad member.
                </p>
              </div>
              {canManageTasks && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingShiftId(null);
                    setShiftMemberId(members[0]?.id || "");
                    setShiftDayOfWeek(1);
                    setShiftStartTime("09:00");
                    setShiftEndTime("17:00");
                    setIsShiftModalOpen(true);
                  }}
                  className="h-8 px-space-md bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>Schedule Shift</span>
                </button>
              )}
            </div>

            {shiftConflicts.size > 0 && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-body-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                <span>
                  <strong>Shift Conflicts Detected:</strong> {shiftConflicts.size} shift(s) have overlapping scheduled intervals on the same day. Please review highlighted rows below.
                </span>
              </div>
            )}

            {isShiftsLoading && (
              <div className="p-8 text-center text-outline text-body-sm">Loading staff shifts...</div>
            )}

            {!isShiftsLoading && staffShifts.length === 0 && (
              <div className="p-12 rounded-lg bg-surface-container-low border border-dashed border-outline-variant/30 text-center text-outline text-body-sm">
                No shifts created yet. Click Schedule Shift to add team working hours.
              </div>
            )}

            {!isShiftsLoading && staffShifts.length > 0 && (
              <div className="rounded-lg bg-surface-container-low border border-outline-variant/30 overflow-hidden shadow-sm">
                <table className="w-full text-left font-body-sm">
                  <thead className="bg-surface-container-high/40 text-outline text-[11px] font-label-badge uppercase tracking-wider border-b border-outline-variant/30">
                    <tr>
                      <th className="px-4 py-2.5">Member</th>
                      <th className="px-4 py-2.5">Day</th>
                      <th className="px-4 py-2.5">Working Hours</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {staffShifts.map((shift) => {
                      const hasConflict = shiftConflicts.has(shift.id);
                      const dayName = DAYS_OF_WEEK.find((d) => d.value === shift.dayOfWeek)?.label || `Day ${shift.dayOfWeek}`;
                      return (
                        <tr
                          key={shift.id}
                          className={`hover:bg-surface-container transition-colors ${
                            hasConflict ? "bg-red-500/5" : ""
                          }`}
                        >
                          <td className="px-4 py-3 font-medium text-on-surface">
                            {shift.member?.user?.name || "Member"}
                          </td>
                          <td className="px-4 py-3 text-on-surface font-medium">{dayName}</td>
                          <td className="px-4 py-3 font-label-code text-[12px] text-on-surface">
                            {shift.startTime} - {shift.endTime}
                          </td>
                          <td className="px-4 py-3">
                            {hasConflict ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-label-badge uppercase bg-red-500/20 text-red-400">
                                Conflict
                              </span>
                            ) : shift.isActive ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-label-badge uppercase bg-emerald-500/20 text-emerald-400">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-label-badge uppercase bg-surface-container text-outline">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {canManageTasks && (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditShift(shift)}
                                  className="text-outline hover:text-on-surface p-1 transition-colors"
                                  title="Edit Shift"
                                >
                                  <span className="material-symbols-outlined text-[16px]">edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteShift(shift.id)}
                                  className="text-outline hover:text-red-400 p-1 transition-colors"
                                  title="Delete Shift"
                                >
                                  <span className="material-symbols-outlined text-[16px]">delete</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Shift Trades & Time-off Requests */}
        {activeTab === "trades" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-headline-sm text-body-md text-on-surface font-semibold">
                  Shift Trades & Swap Requests
                </h3>
                <p className="text-[12px] text-outline">
                  Request schedule coverage or swaps with squad colleagues.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTradeModalOpen(true)}
                className="h-8 px-space-md bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">swap_horiz</span>
                <span>Request Shift Trade</span>
              </button>
            </div>

            {isTradesLoading && (
              <div className="p-8 text-center text-outline text-body-sm">Loading trade requests...</div>
            )}

            {!isTradesLoading && shiftTrades.length === 0 && (
              <div className="p-12 rounded-lg bg-surface-container-low border border-dashed border-outline-variant/30 text-center text-outline text-body-sm">
                No shift trade requests currently open.
              </div>
            )}

            {!isTradesLoading && shiftTrades.length > 0 && (
              <div className="rounded-lg bg-surface-container-low border border-outline-variant/30 overflow-hidden shadow-sm">
                <table className="w-full text-left font-body-sm">
                  <thead className="bg-surface-container-high/40 text-outline text-[11px] font-label-badge uppercase tracking-wider border-b border-outline-variant/30">
                    <tr>
                      <th className="px-4 py-2.5">Requester</th>
                      <th className="px-4 py-2.5">Shift</th>
                      <th className="px-4 py-2.5">Target Teammate</th>
                      <th className="px-4 py-2.5">Reason</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {shiftTrades.map((trade) => {
                      const dayName = trade.shift
                        ? DAYS_OF_WEEK.find((d) => d.value === trade.shift?.dayOfWeek)?.label
                        : "";
                      const isPending = trade.status === "PENDING";
                      return (
                        <tr key={trade.id} className="hover:bg-surface-container transition-colors">
                          <td className="px-4 py-3 font-medium text-on-surface">
                            {trade.requesterMember?.user?.name || "Requester"}
                          </td>
                          <td className="px-4 py-3 text-on-surface font-label-code text-[12px]">
                            {dayName} ({trade.shift?.startTime} - {trade.shift?.endTime})
                          </td>
                          <td className="px-4 py-3 text-outline">
                            {trade.targetMember?.user?.name || "Open to Squad"}
                          </td>
                          <td className="px-4 py-3 text-on-surface-variant text-[12px]">
                            {trade.reason || "--"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-label-badge uppercase ${
                                trade.status === "APPROVED"
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : trade.status === "REJECTED"
                                  ? "bg-red-500/20 text-red-400"
                                  : trade.status === "CANCELLED"
                                  ? "bg-surface-container text-outline"
                                  : "bg-amber-500/20 text-amber-400"
                              }`}
                            >
                              {trade.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {isPending && canManageTasks && (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleProcessTrade(trade.id, "APPROVE")}
                                  className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[11px] font-medium transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleProcessTrade(trade.id, "REJECT")}
                                  className="px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 text-[11px] font-medium transition-colors"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                            {isPending && trade.requesterMemberId === currentMemberId && !canManageTasks && (
                              <button
                                type="button"
                                onClick={() => handleProcessTrade(trade.id, "CANCEL")}
                                className="px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high text-outline text-[11px] font-medium transition-colors"
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

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
                    placeholder="e.g. Production staging or code review"
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

        {/* Modal: Create / Edit Staff Shift */}
        {isShiftModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-lg bg-surface-container-low border border-outline-variant/50 p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  {editingShiftId ? "Edit Staff Shift" : "Schedule Staff Shift"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsShiftModalOpen(false)}
                  className="w-6 h-6 rounded flex items-center justify-center text-outline hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
              <form onSubmit={handleSaveShift} className="flex flex-col gap-4 mt-4">
                <div>
                  <label className="block text-body-sm font-medium text-on-surface mb-1">Squad Member</label>
                  <select
                    disabled={!!editingShiftId}
                    value={shiftMemberId || (members[0]?.id || "")}
                    onChange={(e) => setShiftMemberId(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm disabled:opacity-50"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-body-sm font-medium text-on-surface mb-1">Day of Week</label>
                  <select
                    value={shiftDayOfWeek}
                    onChange={(e) => setShiftDayOfWeek(parseInt(e.target.value, 10))}
                    className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-body-sm font-medium text-on-surface mb-1">Start Time</label>
                    <input
                      type="time"
                      required
                      value={shiftStartTime}
                      onChange={(e) => setShiftStartTime(e.target.value)}
                      className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-body-sm font-medium text-on-surface mb-1">End Time</label>
                    <input
                      type="time"
                      required
                      value={shiftEndTime}
                      onChange={(e) => setShiftEndTime(e.target.value)}
                      className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsShiftModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-body-sm text-outline hover:text-on-surface"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createShiftMutation.isPending || updateShiftMutation.isPending}
                    className="px-4 py-1.5 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm disabled:opacity-50"
                  >
                    {createShiftMutation.isPending || updateShiftMutation.isPending ? "Saving..." : "Save Shift"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Request Shift Trade */}
        {isTradeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-lg bg-surface-container-low border border-outline-variant/50 p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Request Shift Trade / Cover
                </h3>
                <button
                  type="button"
                  onClick={() => setIsTradeModalOpen(false)}
                  className="w-6 h-6 rounded flex items-center justify-center text-outline hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
              <form onSubmit={handleCreateTrade} className="flex flex-col gap-4 mt-4">
                <div>
                  <label className="block text-body-sm font-medium text-on-surface mb-1">My Shift to Trade</label>
                  <select
                    value={tradeShiftId || (myShifts[0]?.id || staffShifts[0]?.id || "")}
                    onChange={(e) => setTradeShiftId(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm"
                  >
                    {(myShifts.length > 0 ? myShifts : staffShifts).map((s) => {
                      const d = DAYS_OF_WEEK.find((day) => day.value === s.dayOfWeek)?.label;
                      return (
                        <option key={s.id} value={s.id}>
                          {d} ({s.startTime} - {s.endTime})
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-body-sm font-medium text-on-surface mb-1">Target Teammate (Optional)</label>
                  <select
                    value={tradeTargetMemberId}
                    onChange={(e) => setTradeTargetMemberId(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm"
                  >
                    <option value="">Open to anyone</option>
                    {members
                      .filter((m) => m.id !== currentMemberId)
                      .map((m) => (
                        <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-body-sm font-medium text-on-surface mb-1">Reason / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Personal appointment or doctor visit"
                    value={tradeReason}
                    onChange={(e) => setTradeReason(e.target.value)}
                    className="w-full h-8 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsTradeModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-body-sm text-outline hover:text-on-surface"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={requestTradeMutation.isPending}
                    className="px-4 py-1.5 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm disabled:opacity-50"
                  >
                    {requestTradeMutation.isPending ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
