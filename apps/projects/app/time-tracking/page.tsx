"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Play, Pause, CheckCircle2, CalendarDays, Download, Send, History as HistoryIcon, Trash2, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import {
  useTasks,
  useTimeEntries,
  useLogTimeEntry,
  useDeleteTimeEntry,
  useWeeklyTimesheets,
  useSubmitWeeklyTimesheet,
  useProcessWeeklyTimesheet,
  WeeklyTimesheetRecord,
} from "@/lib/hooks/use-projects";
import { usePermissions } from "@/lib/permissions";
import { useTimerStore } from "@/lib/timer-store";
import { toast } from "sonner";

function TimeTrackingContent() {
  const searchParams = useSearchParams();
  const initialTaskId = searchParams.get("taskId") || "";

  const [activeTab, setActiveTab] = useState<"my-timesheet" | "approvals">("my-timesheet");

  const { data: tasks = [] } = useTasks();
  const [activeTaskId, setActiveTaskId] = useState<string>(initialTaskId);

  // Sync initial task once tasks load
  useEffect(() => {
    if (!activeTaskId && tasks.length > 0) {
      setActiveTaskId(tasks[0].id);
    }
  }, [tasks, activeTaskId]);

  const activeTask = tasks.find((t) => t.id === activeTaskId);
  const { data: logs = [], isLoading: isLogsLoading } = useTimeEntries(activeTaskId);
  const logTimeMutation = useLogTimeEntry(activeTask?.projectId);
  const deleteTimeMutation = useDeleteTimeEntry(activeTaskId);

  const { data: timesheets = [], isLoading: isTimesheetsLoading } = useWeeklyTimesheets();
  const submitTimesheetMutation = useSubmitWeeklyTimesheet();
  const processTimesheetMutation = useProcessWeeklyTimesheet();

  const { canManageTasks, memberId: currentMemberId } = usePermissions();

  // Active stopwatch state via hook
  const { state: timerState, startTimer, pauseTimer, resetTimer } = useTimerStore();

  // Manual Entry Form State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualHours, setManualHours] = useState("1.0");
  const [manualNote, setManualNote] = useState("");
  const [isBillable, setIsBillable] = useState(true);
  const [isOperational, setIsOperational] = useState(false);
  const [operationalCategory, setOperationalCategory] = useState("OPERATION");

  // Timesheet submission modal
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitNotes, setSubmitNotes] = useState("");

  // Approval review modal
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedTimesheet, setSelectedTimesheet] = useState<WeeklyTimesheetRecord | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  const formatStopwatch = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleStartTimer = () => {
    if (!activeTaskId) return;
    startTimer({ id: activeTaskId, title: activeTask?.title || "Task Execution", taskKey: activeTask?.taskKey });
    toast.info("Timer started");
  };

  const handlePauseResume = () => {
    if (timerState.isRunning) {
      pauseTimer();
      toast.info("Timer paused");
    } else {
      startTimer();
      toast.info("Timer resumed");
    }
  };

  const handleStopAndLog = async () => {
    const hours = Math.max(0.1, parseFloat((timerState.elapsedSeconds / 3600).toFixed(2)));
    const taskId = timerState.activeTaskId || activeTaskId;
    if (!taskId) return;

    try {
      await logTimeMutation.mutateAsync({
        taskId,
        hours,
        description: `Stopwatch session: ${formatStopwatch(timerState.elapsedSeconds)}`,
      });
      resetTimer();
      toast.success(`Logged ${hours}h successfully`);
    } catch (err: any) {
      toast.error("Failed to log time entry");
    }
  };

  const handleManualLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const hours = parseFloat(manualHours);
    if (!hours || hours <= 0) return;

    try {
      await logTimeMutation.mutateAsync({
        taskId: isOperational ? undefined : activeTaskId,
        hours,
        description: manualNote ? `${manualNote} ${isBillable ? "(Billable)" : "(Non-billable)"}` : isBillable ? "Billable" : "Non-billable",
        category: isOperational ? operationalCategory : undefined,
        isBillable,
      });
      toast.success(isOperational ? `Logged ${hours}h operational time` : `Logged ${hours}h on task`);
      setManualHours("1.0");
      setManualNote("");
      setIsManualModalOpen(false);
    } catch (err: any) {
      toast.error("Failed to save log entry");
    }
  };

  const handleDeleteLog = async (entry: any) => {
    if (entry.isLocked) {
      toast.error("Cannot delete an approved and locked time entry");
      return;
    }
    if (!window.confirm("Delete this time log entry?")) return;
    try {
      await deleteTimeMutation.mutateAsync(entry.id);
      toast.success("Time entry deleted");
    } catch (err: any) {
      toast.error("Failed to delete time entry");
    }
  };

  const handleSubmitTimesheet = async (e: React.FormEvent) => {
    e.preventDefault();
    const monday = new Date();
    const day = (monday.getDay() + 6) % 7;
    monday.setDate(monday.getDate() - day);
    monday.setHours(0, 0, 0, 0);

    try {
      await submitTimesheetMutation.mutateAsync({
        weekStartDate: monday.toISOString(),
        notes: submitNotes || undefined,
      });
      toast.success("Weekly timesheet submitted for manager review");
      setIsSubmitModalOpen(false);
      setSubmitNotes("");
    } catch (err: any) {
      toast.error("Failed to submit timesheet");
    }
  };

  const handleProcessTimesheet = async (action: "APPROVE" | "REJECT") => {
    if (!selectedTimesheet) return;
    try {
      await processTimesheetMutation.mutateAsync({
        timesheetId: selectedTimesheet.memberId,
        action,
        notes: reviewNotes || undefined,
      });
      toast.success(`Timesheet ${action.toLowerCase()}ed`);
      setIsApprovalModalOpen(false);
      setSelectedTimesheet(null);
      setReviewNotes("");
    } catch (err: any) {
      toast.error(`Failed to ${action.toLowerCase()} timesheet`);
    }
  };

  const exportTimesheetCSV = () => {
    if (!logs.length) {
      toast.info("No time logs to export");
      return;
    }
    const headers = ["Member", "Task", "Hours", "Date", "Description"];
    const rows = logs.map((l) => [
      `"${l.member?.user?.name || "Member"}"`,
      `"${activeTask?.taskKey || activeTaskId}"`,
      l.hours,
      new Date(l.date).toLocaleDateString(),
      `"${(l.description || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `timesheet_${activeTask?.taskKey || "task"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Timesheet CSV exported");
  };

  const totalLoggedHours = useMemo(() => {
    return logs.reduce((acc, curr) => acc + Number(curr.hours), 0);
  }, [logs]);

  // Weekly Matrix breakdown (Mon-Sun)
  const weeklyMatrix = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const hoursByDay = [0, 0, 0, 0, 0, 0, 0];

    logs.forEach((log) => {
      const d = new Date(log.date);
      const dayIndex = (d.getDay() + 6) % 7;
      hoursByDay[dayIndex] += Number(log.hours);
    });

    return days.map((day, idx) => ({
      day,
      hours: Math.round(hoursByDay[idx] * 10) / 10,
    }));
  }, [logs]);

  return (
    <div className="flex flex-col w-full min-h-screen bg-surface text-on-surface">
      <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
        {/* Header & View Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
              Enterprise Time Tracking & Timesheets
            </h1>
            <p className="font-body-sm text-body-sm text-outline mt-1">
              Active stopwatch timer, billable hour allocation, weekly matrix review, and timesheet approvals.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg bg-surface-container-low p-1 border border-outline-variant/30">
              <button
                type="button"
                onClick={() => setActiveTab("my-timesheet")}
                className={`px-3 py-1 text-body-sm rounded-md font-medium transition-colors ${
                  activeTab === "my-timesheet"
                    ? "bg-surface-container-high text-on-surface shadow-xs"
                    : "text-outline hover:text-on-surface"
                }`}
              >
                My Timesheet
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("approvals")}
                className={`px-3 py-1 text-body-sm rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === "approvals"
                    ? "bg-surface-container-high text-on-surface shadow-xs"
                    : "text-outline hover:text-on-surface"
                }`}
              >
                <span>Approvals & Team</span>
                {timesheets.filter((t) => t.status === "SUBMITTED").length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-primary-container"></span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tab 1: My Timesheet */}
        {activeTab === "my-timesheet" && (
          <div className="flex flex-col gap-6">
            {/* Active Stopwatch Card */}
            <div className="p-6 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
              <div className="flex flex-col gap-1 text-center md:text-left">
                <span className="text-[11px] font-label-badge uppercase tracking-wider text-outline">
                  Live Work Session
                </span>
                <div className="font-label-code text-[42px] tracking-tight font-semibold text-primary">
                  {timerState.activeTaskId === activeTaskId ? formatStopwatch(timerState.elapsedSeconds) : "00:00:00"}
                </div>
                <div className="text-body-sm text-on-surface font-medium truncate max-w-md">
                  {activeTask?.title || "No task selected"}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {(!timerState.activeTaskId || timerState.activeTaskId !== activeTaskId) && (
                  <button
                    type="button"
                    onClick={handleStartTimer}
                    disabled={!activeTaskId}
                    className="h-9 px-4 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm flex items-center gap-1.5 transition-colors shadow-md disabled:opacity-50"
                  >
                    <Play className="h-4 w-4" />
                    <span>Start Timer</span>
                  </button>
                )}

                {timerState.activeTaskId === activeTaskId && (
                  <>
                    <button
                      type="button"
                      onClick={handlePauseResume}
                      className="h-9 px-4 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-headline-sm text-body-sm flex items-center gap-1.5 transition-colors border border-outline-variant/30"
                    >
{timerState.isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      <span>{timerState.isRunning ? "Pause" : "Resume"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleStopAndLog}
                      disabled={timerState.elapsedSeconds < 5}
                      className="h-9 px-4 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm flex items-center gap-1.5 transition-colors shadow-md disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Stop & Log</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(true)}
                  disabled={!activeTaskId}
                  className="h-9 px-4 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm flex items-center gap-1.5 transition-colors border border-outline-variant/30 disabled:opacity-50"
                >
                  <CalendarDays className="h-4 w-4" />
                  <span>Manual Log</span>
                </button>
              </div>
            </div>

            {/* Task Switcher & Action Strip */}
            <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-body-sm font-medium text-outline">Active Task:</span>
                <select
                  value={activeTaskId}
                  onChange={(e) => setActiveTaskId(e.target.value)}
                  className="h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm max-w-sm truncate"
                >
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.taskKey || t.id.slice(-6)} - {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={exportTimesheetCSV}
                  className="h-8 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm flex items-center gap-1.5 transition-colors border border-outline-variant/30"
                >
                  <Download className="h-4 w-4" />
                  <span>Export CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="h-8 px-3 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Send className="h-4 w-4" />
                  <span>Submit Weekly Timesheet</span>
                </button>
              </div>
            </div>

            {/* KPI Strip & Weekly Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
                <span className="text-outline text-body-sm">Total Logged on Task</span>
                <span className="text-headline-lg font-headline-lg text-on-surface">{totalLoggedHours}h</span>
              </div>
              <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
                <span className="text-outline text-body-sm">Estimated Hours</span>
                <span className="text-headline-lg font-headline-lg text-on-surface">{activeTask?.estimatedHours || 0}h</span>
              </div>
              <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
                <span className="text-outline text-body-sm">Logged Sessions</span>
                <span className="text-headline-lg font-headline-lg text-on-surface">{logs.length} Entries</span>
              </div>
              <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
                <span className="text-outline text-body-sm">Variance</span>
                <span
                  className={`text-headline-lg font-headline-lg ${
                    totalLoggedHours > (activeTask?.estimatedHours || 0) && (activeTask?.estimatedHours || 0) > 0
                      ? "text-red-400"
                      : "text-emerald-400"
                  }`}
                >
                  {Math.round((totalLoggedHours - (activeTask?.estimatedHours || 0)) * 10) / 10}h
                </span>
              </div>
            </div>

            {/* Weekly Matrix Strip */}
            <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-3">
              <span className="text-[11px] font-label-badge uppercase tracking-wider text-outline">
                Weekly Hours Matrix (Monday - Sunday)
              </span>
              <div className="grid grid-cols-7 gap-2">
                {weeklyMatrix.map((item) => (
                  <div
                    key={item.day}
                    className="p-3 rounded-lg bg-surface-container border border-outline-variant/20 flex flex-col items-center justify-center gap-1"
                  >
                    <span className="text-[11px] font-medium text-outline">{item.day}</span>
                    <span className="font-label-code text-body-md font-semibold text-on-surface">
                      {item.hours}h
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Time Logs Table */}
            <div className="rounded-lg bg-surface-container-low border border-outline-variant/30 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between p-4 border-b border-outline-variant/30">
                <div className="flex items-center gap-2">
                  <HistoryIcon className="h-4 w-4 text-primary" />
                  <h3 className="font-headline-sm text-body-md text-on-surface font-semibold">
                    Logged Entries on {activeTask?.taskKey || "Task"}
                  </h3>
                </div>
              </div>

              {isLogsLoading && (
                <div className="p-8 text-center text-outline text-body-sm">Loading time entries...</div>
              )}

              {!isLogsLoading && logs.length === 0 && (
                <div className="p-8 text-center text-outline text-body-sm">
                  No time logged on this task yet. Use the timer above or create a manual entry.
                </div>
              )}

              {!isLogsLoading && logs.length > 0 && (
                <table className="w-full text-left font-body-sm">
                  <thead className="bg-surface-container-high/40 text-outline text-[11px] font-label-badge uppercase tracking-wider border-b border-outline-variant/30">
                    <tr>
                      <th className="px-4 py-2.5">Member</th>
                      <th className="px-4 py-2.5">Description</th>
                      <th className="px-4 py-2.5">Duration</th>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-surface-container transition-colors group">
                        <td className="px-4 py-3 font-medium text-on-surface">
                          {log.member?.user?.name || "Member"}
                        </td>
                        <td className="px-4 py-3 text-on-surface">{log.description || "--"}</td>
                        <td className="px-4 py-3 font-label-code text-[12px] text-on-surface font-medium">
                          {log.hours}h
                        </td>
                        <td className="px-4 py-3 font-label-code text-[11px] text-outline">
                          {new Date(log.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {canManageTasks && (
                            <button
                              type="button"
                              onClick={() => handleDeleteLog(log.id)}
                              className="text-outline hover:text-red-400 p-1 transition-colors"
                              title="Delete Entry"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Approvals & Team Timesheets */}
        {activeTab === "approvals" && (
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="font-headline-sm text-body-md text-on-surface font-semibold">
                Submitted Weekly Timesheets
              </h3>
              <p className="text-[12px] text-outline">
                Review squad timesheets, audit project billable allocations, and process payroll approvals.
              </p>
            </div>

            {isTimesheetsLoading && (
              <div className="p-8 text-center text-outline text-body-sm">Loading team timesheets...</div>
            )}

            {!isTimesheetsLoading && timesheets.length === 0 && (
              <div className="p-12 rounded-lg bg-surface-container-low border border-dashed border-outline-variant/30 text-center text-outline text-body-sm">
                No submitted weekly timesheets found.
              </div>
            )}

            {!isTimesheetsLoading && timesheets.length > 0 && (
              <div className="rounded-lg bg-surface-container-low border border-outline-variant/30 overflow-hidden shadow-sm">
                <table className="w-full text-left font-body-sm">
                  <thead className="bg-surface-container-high/40 text-outline text-[11px] font-label-badge uppercase tracking-wider border-b border-outline-variant/30">
                    <tr>
                      <th className="px-4 py-2.5">Member</th>
                      <th className="px-4 py-2.5">Week Starting</th>
                      <th className="px-4 py-2.5">Total Hours</th>
                      <th className="px-4 py-2.5">Billable</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5 text-right">Review</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {timesheets.map((ts) => (
                      <tr key={ts.memberId} className="hover:bg-surface-container transition-colors">
                        <td className="px-4 py-3 font-medium text-on-surface">
                          <div>{ts.memberName}</div>
                          <div className="text-[11px] text-outline">{ts.memberEmail}</div>
                        </td>
                        <td className="px-4 py-3 font-label-code text-[12px] text-on-surface">
                          {new Date(ts.weekStartDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3 font-label-code text-[12px] text-on-surface font-semibold">
                          {ts.totalHours}h
                        </td>
                        <td className="px-4 py-3 font-label-code text-[12px] text-emerald-400">
                          {ts.billableHours}h
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-label-badge uppercase ${
                              ts.status === "APPROVED"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : ts.status === "REJECTED"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-primary-container/20 text-primary"
                            }`}
                          >
                            {ts.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTimesheet(ts);
                              setIsApprovalModalOpen(true);
                            }}
                            className="px-3 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-[12px] font-medium border border-outline-variant/30 transition-colors"
                          >
                            Audit & Decide
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal: Manual Time Log */}
        {isManualModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-lg bg-surface-container-low border border-outline-variant/50 p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Log Time Entry</h3>
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="w-6 h-6 rounded flex items-center justify-center text-outline hover:text-on-surface"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleManualLog} className="flex flex-col gap-4 mt-4">
                <div>
                  <label className="block text-body-sm font-medium text-on-surface mb-1">Target Task</label>
                  <select
                    value={activeTaskId}
                    onChange={(e) => setActiveTaskId(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm"
                  >
                    {tasks.map((t) => (
                      <option key={t.id} value={t.id}>{t.taskKey || t.id.slice(-6)} - {t.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-body-sm font-medium text-on-surface mb-1">Log Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsOperational(false)}
                      className={`py-1.5 px-3 rounded-lg text-body-sm font-medium border ${
                        !isOperational
                          ? "bg-primary-container text-on-primary-container border-primary-container"
                          : "bg-surface-container border-outline-variant text-outline"
                      }`}
                    >
                      Project Task
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsOperational(true)}
                      className={`py-1.5 px-3 rounded-lg text-body-sm font-medium border ${
                        isOperational
                          ? "bg-primary-container text-on-primary-container border-primary-container"
                          : "bg-surface-container border-outline-variant text-outline"
                      }`}
                    >
                      General Operation
                    </button>
                  </div>
                </div>

                {isOperational && (
                  <div>
                    <label className="block text-body-sm font-medium text-on-surface mb-1">Operation Category</label>
                    <select
                      value={operationalCategory}
                      onChange={(e) => setOperationalCategory(e.target.value)}
                      className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm"
                    >
                      <option value="OPERATION">General Operations & Production</option>
                      <option value="MEETING">Team Sync & Architecture Meeting</option>
                      <option value="SUPPORT">Customer Issue & SLA Support</option>
                      <option value="TRAINING">Skill Development & Onboarding</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-body-sm font-medium text-on-surface mb-1">Hours</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    value={manualHours}
                    onChange={(e) => setManualHours(e.target.value)}
                    className="w-full h-8 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm"
                  />
                </div>
                <div>
                  <label className="block text-body-sm font-medium text-on-surface mb-1">Notes</label>
                  <input
                    type="text"
                    placeholder="Summary of work completed"
                    value={manualNote}
                    onChange={(e) => setManualNote(e.target.value)}
                    className="w-full h-8 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="billableCheck"
                    checked={isBillable}
                    onChange={(e) => setIsBillable(e.target.checked)}
                    className="rounded border-outline-variant text-primary"
                  />
                  <label htmlFor="billableCheck" className="text-body-sm text-on-surface cursor-pointer">
                    Classify as Billable Project Work
                  </label>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsManualModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-body-sm text-outline hover:text-on-surface"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={logTimeMutation.isPending}
                    className="px-4 py-1.5 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm disabled:opacity-50"
                  >
                    {logTimeMutation.isPending ? "Saving..." : "Save Log"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Submit Timesheet */}
        {isSubmitModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-lg bg-surface-container-low border border-outline-variant/50 p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Submit Weekly Timesheet
                </h3>
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="w-6 h-6 rounded flex items-center justify-center text-outline hover:text-on-surface"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleSubmitTimesheet} className="flex flex-col gap-4 mt-4">
                <p className="text-body-sm text-on-surface-variant">
                  This will finalize and submit your weekly hours for manager and project lead approval.
                </p>
                <div>
                  <label className="block text-body-sm font-medium text-on-surface mb-1">
                    Notes / Comments for Reviewer
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Completed all sprint objectives and client review sessions"
                    value={submitNotes}
                    onChange={(e) => setSubmitNotes(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSubmitModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-body-sm text-outline hover:text-on-surface"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitTimesheetMutation.isPending}
                    className="px-4 py-1.5 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm disabled:opacity-50"
                  >
                    {submitTimesheetMutation.isPending ? "Submitting..." : "Submit Timesheet"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Process Timesheet Review */}
        {isApprovalModalOpen && selectedTimesheet && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg rounded-lg bg-surface-container-low border border-outline-variant/50 p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Review Timesheet: {selectedTimesheet.memberName}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsApprovalModalOpen(false)}
                  className="w-6 h-6 rounded flex items-center justify-center text-outline hover:text-on-surface"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-col gap-4 mt-4">
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-surface-container text-body-sm">
                  <div>
                    <span className="text-outline text-[11px] block">Total Hours</span>
                    <strong className="text-on-surface font-semibold">{selectedTimesheet.totalHours}h</strong>
                  </div>
                  <div>
                    <span className="text-outline text-[11px] block">Billable Hours</span>
                    <strong className="text-emerald-400 font-semibold">{selectedTimesheet.billableHours}h</strong>
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-label-badge uppercase tracking-wider text-outline mb-1.5">
                    Logged Entries
                  </h4>
                  <div className="max-h-40 overflow-y-auto rounded-lg border border-outline-variant/30 divide-y divide-outline-variant/20 bg-surface-container-lowest">
                    {selectedTimesheet.entries.map((e) => (
                      <div key={e.id} className="p-2.5 flex justify-between items-center text-body-sm">
                        <span className="truncate max-w-[280px]">{e.description || e.taskTitle || "Work Entry"}</span>
                        <span className="font-label-code text-on-surface font-medium">{e.hours}h</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-body-sm font-medium text-on-surface mb-1">
                    Reviewer Notes / Feedback
                  </label>
                  <input
                    type="text"
                    placeholder="Optional feedback note"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="w-full h-8 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/30">
                  <button
                    type="button"
                    onClick={() => handleProcessTimesheet("REJECT")}
                    disabled={processTimesheetMutation.isPending}
                    className="px-4 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium text-body-sm transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleProcessTimesheet("APPROVE")}
                    disabled={processTimesheetMutation.isPending}
                    className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-medium text-body-sm transition-colors"
                  >
                    Approve
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TimeTrackingPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-outline text-body-sm">Loading time tracker...</div>}>
      <TimeTrackingContent />
    </React.Suspense>
  );
}
