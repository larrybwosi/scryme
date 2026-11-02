"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  useTasks,
  useTimeEntries,
  useLogTimeEntry,
  useDeleteTimeEntry,
} from "@/lib/hooks/use-projects";
import { useTimerStore } from "@/lib/timer-store";
import { usePermissions } from "@/lib/permissions";

function TimeTrackingContent() {
  const searchParams = useSearchParams();
  const paramTaskId = searchParams.get("taskId") || "";

  const { data: tasks = [] } = useTasks();
  const { canManageTasks } = usePermissions();
  const { state: timerState, startTimer, pauseTimer, resetTimer, setActiveTask, setNote } = useTimerStore();

  const [selectedTaskId, setSelectedTaskId] = useState<string>(paramTaskId || timerState.activeTaskId || "");

  useEffect(() => {
    if (paramTaskId) {
      setSelectedTaskId(paramTaskId);
    } else if (timerState.activeTaskId) {
      setSelectedTaskId(timerState.activeTaskId);
    } else if (tasks.length > 0 && !selectedTaskId) {
      setSelectedTaskId(tasks[0].id);
    }
  }, [paramTaskId, tasks, selectedTaskId, timerState.activeTaskId]);

  const activeTaskId = selectedTaskId || (tasks[0]?.id || "");
  const activeTask = tasks.find((t) => t.id === activeTaskId);

  // Sync selected task into timer store
  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
    const t = tasks.find((item) => item.id === taskId);
    if (t) {
      setActiveTask({ id: t.id, title: t.title, taskKey: t.taskKey });
    }
  };

  const { data: logs = [], isLoading } = useTimeEntries(activeTaskId);
  const logTimeMutation = useLogTimeEntry(activeTask?.projectId);
  const deleteTimeMutation = useDeleteTimeEntry(activeTaskId);

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualHours, setManualHours] = useState("1.0");
  const [manualNote, setManualNote] = useState("");

  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStopAndLog = async () => {
    if (timerState.elapsedSeconds < 5 || !activeTaskId || !canManageTasks) return;

    const hours = Number((timerState.elapsedSeconds / 3600).toFixed(2));
    await logTimeMutation.mutateAsync({
      taskId: activeTaskId,
      hours,
      description: timerState.note.trim() || "Recorded timer session",
    });

    resetTimer();
  };

  const handleManualLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTaskId || !canManageTasks) return;

    const hours = parseFloat(manualHours) || 1;
    await logTimeMutation.mutateAsync({
      taskId: activeTaskId,
      hours,
      description: manualNote.trim() || "Manual entry",
    });

    setIsManualModalOpen(false);
    setManualNote("");
  };

  const handleDeleteLog = (id: string) => {
    if (!canManageTasks) return;
    deleteTimeMutation.mutate(id);
  };

  const totalLoggedHours = logs
    .reduce((acc, l) => acc + (Number(l.hours) || 0), 0)
    .toFixed(1);

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="flex flex-col w-full">
        <div className="py-space-md flex flex-col gap-space-lg">
          {/* Active Timer Console */}
          <div className="relative overflow-hidden rounded-lg bg-surface-container-low shadow-xl p-space-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-lg border border-outline-variant/30">
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary-container/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Left: Running Timer Info */}
            <div className="flex items-center gap-space-lg min-w-0">
              <div className="relative flex items-center justify-center w-12 h-12 rounded-lg bg-surface-container-high shrink-0 shadow-md">
                <span
                  className={`material-symbols-outlined text-primary-container text-[28px] ${timerState.isRunning ? "animate-pulse" : ""}`}
                >
                  timer
                </span>
                {timerState.isRunning && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full ring-2 ring-surface-container-low"></span>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-space-sm">
                  {tasks.length > 0 && (
                    <select
                      value={activeTaskId}
                      onChange={(e) => handleTaskSelect(e.target.value)}
                      className="font-label-badge text-label-badge px-2 py-0.5 rounded bg-surface-container-high text-primary font-medium tracking-wide border-0 focus:outline-none cursor-pointer max-w-[200px] truncate"
                    >
                      {tasks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.taskKey || t.id.slice(-6)} - {t.title}
                        </option>
                      ))}
                    </select>
                  )}
                  <span className="font-label-badge text-label-badge text-primary-container font-medium uppercase tracking-wider flex items-center gap-1">
                    {timerState.isRunning && <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-ping"></span>}
                    {timerState.isRunning ? "Live Recording" : "Timer Paused"}
                  </span>
                </div>
                <div className="flex items-baseline gap-space-md mt-0.5">
                  <span className="font-label-code text-[26px] leading-[30px] font-medium tracking-tight text-on-surface">
                    {formatTimer(timerState.elapsedSeconds)}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant truncate max-w-[280px]">
                    {activeTask?.title || "Select a task to record time"}
                  </span>
                </div>
              </div>
            </div>

            {/* Center: Contextual Note Input */}
            <div className="flex-1 w-full lg:max-w-md">
              <div className="relative flex items-center rounded-lg bg-surface-container px-space-md py-1.5 shadow-inner border border-outline-variant/30">
                <span className="material-symbols-outlined text-outline text-[16px] mr-2">edit_note</span>
                <input
                  type="text"
                  value={timerState.note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What are you working on?"
                  className="w-full bg-transparent font-body-md text-body-md text-on-surface placeholder-outline focus:outline-none"
                />
              </div>
            </div>

            {/* Right: Action Buttons */}
            {canManageTasks && (
              <div className="flex items-center gap-space-sm w-full lg:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (timerState.isRunning) {
                      pauseTimer();
                    } else {
                      startTimer(activeTask ? { id: activeTask.id, title: activeTask.title, taskKey: activeTask.taskKey } : undefined);
                    }
                  }}
                  disabled={!activeTaskId}
                  className="h-8 px-space-md rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body-sm text-body-sm flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {timerState.isRunning ? "pause" : "play_arrow"}
                  </span>
                  <span>{timerState.isRunning ? "Pause" : "Resume"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleStopAndLog}
                  disabled={!activeTaskId || timerState.elapsedSeconds < 5}
                  className="h-8 px-space-md rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm flex items-center gap-1.5 transition-colors shadow-md disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>Stop & Log</span>
                </button>
              </div>
            )}
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
              <span className="text-outline text-body-sm">Total Hours on Selected Issue</span>
              <span className="text-headline-lg font-headline-lg text-on-surface">{totalLoggedHours}h</span>
            </div>
            <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
              <span className="text-outline text-body-sm">Estimated Hours</span>
              <span className="text-headline-lg font-headline-lg text-on-surface">{activeTask?.estimatedHours || 0}h</span>
            </div>
            <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
              <span className="text-outline text-body-sm">Session Logs Count</span>
              <span className="text-headline-lg font-headline-lg text-on-surface">{logs.length} Entries</span>
            </div>
          </div>

          {/* Manual Entry Dialog */}
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
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
                <form onSubmit={handleManualLog} className="flex flex-col gap-4 mt-4">
                  <div>
                    <label className="block text-body-sm font-medium text-on-surface mb-1">Target Task</label>
                    <select
                      value={activeTaskId}
                      onChange={(e) => handleTaskSelect(e.target.value)}
                      className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm"
                    >
                      {tasks.map((t) => (
                        <option key={t.id} value={t.id}>{t.taskKey || t.id.slice(-6)} - {t.title}</option>
                      ))}
                    </select>
                  </div>
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

          {/* Time Logs Table */}
          <div className="rounded-lg bg-surface-container-low border border-outline-variant/30 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">history</span>
                <h3 className="font-headline-sm text-body-md text-on-surface font-semibold">
                  Logged Time on {activeTask?.taskKey || "Task"}
                </h3>
              </div>
              {canManageTasks && (
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(true)}
                  disabled={!activeTaskId}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm transition-colors border border-outline-variant/30 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[15px]">add</span>
                  <span>Manual Entry</span>
                </button>
              )}
            </div>

            {isLoading && (
              <div className="p-8 text-center text-outline text-body-sm">
                Loading time entries...
              </div>
            )}

            {!isLoading && logs.length === 0 && (
              <div className="p-8 text-center text-outline text-body-sm">
                No time logged on this task yet. Use the timer above or create a manual entry.
              </div>
            )}

            {!isLoading && logs.length > 0 && (
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
                            <span className="material-symbols-outlined text-[16px]">delete</span>
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
