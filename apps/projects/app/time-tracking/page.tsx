"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";

interface TimeLog {
  id: string;
  issueKey: string;
  project: string;
  description: string;
  duration: string;
  seconds: number;
  billable: boolean;
  rate: number;
  timeRange: string;
  userName: string;
}

const INITIAL_LOGS: TimeLog[] = [
  {
    id: "log-1",
    issueKey: "SCR-104",
    project: "Nexus 2.0 Redesign",
    description: "Interactive Analytics Dashboard & Real-time Canvas",
    duration: "02h 45m",
    seconds: 9900,
    billable: true,
    rate: 140,
    timeRange: "09:15 AM - 12:00 PM",
    userName: "Elena Rostova",
  },
  {
    id: "log-2",
    issueKey: "SCR-102",
    project: "Nexus 2.0 Redesign",
    description: "WebGL 60FPS memory-mapped viewport pipeline profiling",
    duration: "01h 30m",
    seconds: 5400,
    billable: true,
    rate: 140,
    timeRange: "01:30 PM - 03:00 PM",
    userName: "Elena Rostova",
  },
  {
    id: "log-3",
    issueKey: "SCR-103",
    project: "Nexus 2.0 Redesign",
    description: "Design tokens schema validation with Zod runtime guards",
    duration: "00h 50m",
    seconds: 3000,
    billable: false,
    rate: 0,
    timeRange: "03:15 PM - 04:05 PM",
    userName: "Elena Rostova",
  },
];

export default function TimeTrackingPage() {
  const [isRunning, setIsRunning] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(13342); // 03:42:22
  const [currentNote, setCurrentNote] = useState("Drafting WebGL viewport sync & frame-rate telemetry");
  const [currentIssue, setCurrentIssue] = useState("SCR-104");
  const [logs, setLogs] = useState<TimeLog[]>(INITIAL_LOGS);
  const [billableRate, setBillableRate] = useState(140);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualIssue, setManualIssue] = useState("SCR-104");
  const [manualHours, setManualHours] = useState("1.5");
  const [manualNote, setManualNote] = useState("");

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStopAndLog = () => {
    if (elapsedSeconds < 5) return;

    const newLog: TimeLog = {
      id: `log-${Date.now()}`,
      issueKey: currentIssue,
      project: "Nexus 2.0 Redesign",
      description: currentNote || "General engineering task",
      duration: `${Math.floor(elapsedSeconds / 3600)}h ${Math.floor((elapsedSeconds % 3600) / 60)}m`,
      seconds: elapsedSeconds,
      billable: true,
      rate: billableRate,
      timeRange: "Just now",
      userName: "Elena Rostova",
    };

    setLogs([newLog, ...logs]);
    setElapsedSeconds(0);
    setIsRunning(false);
  };

  const handleManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    const hoursNum = parseFloat(manualHours) || 1;
    const totalSec = Math.round(hoursNum * 3600);

    const newLog: TimeLog = {
      id: `log-${Date.now()}`,
      issueKey: manualIssue,
      project: "Nexus 2.0 Redesign",
      description: manualNote.trim() || "Manual time allocation",
      duration: `${Math.floor(hoursNum)}h ${Math.round((hoursNum % 1) * 60)}m`,
      seconds: totalSec,
      billable: true,
      rate: billableRate,
      timeRange: "Manual Entry",
      userName: "Elena Rostova",
    };

    setLogs([newLog, ...logs]);
    setIsManualModalOpen(false);
    setManualNote("");
  };

  const handleDeleteLog = (id: string) => {
    setLogs((prev) => prev.filter((l) => l.id !== id));
  };

  const totalLoggedSec = logs.reduce((acc, l) => acc + l.seconds, 0) + elapsedSeconds;
  const totalLoggedHours = (totalLoggedSec / 3600).toFixed(1);

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="flex flex-col w-full">
        <div className="py-space-md flex flex-col gap-space-lg">
          {/* Active Timer Controller Console */}
          <div className="relative overflow-hidden rounded-lg bg-surface-container-low shadow-xl p-space-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-lg border border-outline-variant/30">
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary-container/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Left: Running Timer Info & Counter */}
            <div className="flex items-center gap-space-lg min-w-0">
              <div className="relative flex items-center justify-center w-12 h-12 rounded-lg bg-surface-container-high shrink-0 shadow-md">
                <span
                  className={`material-symbols-outlined text-primary-container text-[28px] ${isRunning ? "animate-pulse" : ""}`}
                >
                  timer
                </span>
                {isRunning && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full ring-2 ring-surface-container-low"></span>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-space-sm">
                  <span className="font-label-badge text-label-badge px-1.5 py-0.5 rounded bg-surface-container-high text-primary font-medium tracking-wide">
                    {currentIssue}
                  </span>
                  <span className="font-body-sm text-body-sm text-outline truncate">Nexus 2.0 Redesign</span>
                  <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                  <span className="font-label-badge text-label-badge text-primary-container font-medium uppercase tracking-wider flex items-center gap-1">
                    {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-ping"></span>}
                    {isRunning ? "Live Recording" : "Timer Paused"}
                  </span>
                </div>
                <div className="flex items-baseline gap-space-md mt-0.5">
                  <span className="font-label-code text-[26px] leading-[30px] font-medium tracking-tight text-on-surface">
                    {formatTimer(elapsedSeconds)}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant truncate max-w-[280px]">
                    {currentNote || "Interactive Analytics Dashboard"}
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
                  value={currentNote}
                  onChange={(e) => setCurrentNote(e.target.value)}
                  placeholder="What are you working on?"
                  className="w-full bg-transparent font-body-md text-body-md text-on-surface placeholder-outline focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setBillableRate(billableRate > 0 ? 0 : 140)}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant hover:text-on-surface text-label-kbd font-label-kbd transition-colors ml-2"
                  title="Toggle Billable Status"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${billableRate > 0 ? "bg-primary" : "bg-outline"}`}></span>
                  <span>{billableRate > 0 ? `$${billableRate}/hr` : "Non-billable"}</span>
                </button>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-space-sm w-full lg:w-auto justify-end">
              <button
                type="button"
                onClick={() => setIsRunning(!isRunning)}
                className="h-8 px-space-md rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body-sm text-body-sm flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isRunning ? "pause" : "play_arrow"}
                </span>
                <span>{isRunning ? "Pause" : "Resume"}</span>
              </button>
              <button
                type="button"
                onClick={handleStopAndLog}
                className="h-8 px-space-md rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm flex items-center gap-1.5 transition-colors shadow-md"
              >
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>Stop & Log</span>
              </button>
              <button
                type="button"
                onClick={() => setElapsedSeconds(0)}
                className="h-8 w-8 rounded-lg bg-surface-container-high hover:bg-error-container hover:text-on-error-container text-outline flex items-center justify-center transition-colors"
                title="Discard Timer"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
              </button>
            </div>
          </div>

          {/* Top KPI Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
              <span className="text-outline text-body-sm">Today Logged</span>
              <span className="text-headline-lg font-headline-lg text-on-surface">{totalLoggedHours}h</span>
              <span className="text-[11px] text-emerald-400 font-label-code">+12% vs last week</span>
            </div>
            <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
              <span className="text-outline text-body-sm">Week Target</span>
              <span className="text-headline-lg font-headline-lg text-on-surface">34h 15m / 40h</span>
              <span className="text-[11px] text-primary font-label-code">85.6% target reached</span>
            </div>
            <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
              <span className="text-outline text-body-sm">Billable Ratio</span>
              <span className="text-headline-lg font-headline-lg text-on-surface">88.5%</span>
              <span className="text-[11px] text-outline font-label-code">$4,760 accrued</span>
            </div>
            <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
              <span className="text-outline text-body-sm">Active Engineers</span>
              <span className="text-headline-lg font-headline-lg text-on-surface">4 Logging</span>
              <span className="text-[11px] text-emerald-400 font-label-code">All squads accounted</span>
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
                    <label className="block text-body-sm font-medium text-on-surface mb-1">Issue</label>
                    <select
                      value={manualIssue}
                      onChange={(e) => setManualIssue(e.target.value)}
                      className="w-full h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm"
                    >
                      <option value="SCR-104">SCR-104 - Interactive Analytics Dashboard</option>
                      <option value="SCR-102">SCR-102 - WebGL Viewport Pipeline</option>
                      <option value="SCR-103">SCR-103 - Design Tokens Schema</option>
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
                      className="px-4 py-1.5 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm"
                    >
                      Save Log
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
                <h3 className="font-headline-sm text-body-md text-on-surface font-semibold">Today's Recorded Sessions</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm transition-colors border border-outline-variant/30"
              >
                <span className="material-symbols-outlined text-[15px]">add</span>
                <span>Manual Entry</span>
              </button>
            </div>

            <table className="w-full text-left font-body-sm">
              <thead className="bg-surface-container-high/40 text-outline text-[11px] font-label-badge uppercase tracking-wider border-b border-outline-variant/30">
                <tr>
                  <th className="px-4 py-2.5">Issue</th>
                  <th className="px-4 py-2.5">Description</th>
                  <th className="px-4 py-2.5">Duration</th>
                  <th className="px-4 py-2.5">Billable</th>
                  <th className="px-4 py-2.5">Session Window</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-container transition-colors group">
                    <td className="px-4 py-3">
                      <Link
                        href={`/tasks/${log.issueKey}`}
                        className="font-label-code text-label-code text-primary hover:underline"
                      >
                        {log.issueKey}
                      </Link>
                      <div className="text-[11px] text-outline">{log.project}</div>
                    </td>
                    <td className="px-4 py-3 text-on-surface">{log.description}</td>
                    <td className="px-4 py-3 font-label-code text-[12px] text-on-surface font-medium">
                      {log.duration}
                    </td>
                    <td className="px-4 py-3">
                      {log.billable ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-label-code text-[11px]">
                          ${log.rate}/hr
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-surface-container text-outline font-label-code text-[11px]">
                          Non-billable
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-label-code text-[11px] text-outline">{log.timeRange}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteLog(log.id)}
                        className="text-outline hover:text-red-400 p-1 transition-colors"
                        title="Delete Entry"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
