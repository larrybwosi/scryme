import React, { useEffect, useState } from 'react';
import { useTaskStore, taskStore } from '../lib/store';
import { TimeEntry } from '../lib/types';
import {
  Play,
  Square,
  Clock,
  Plus,
  Folder,
  Tag as TagIcon,
  Search,
  Filter,
  MoreVertical,
  RotateCcw
} from 'lucide-react';

export default function TimeTrackerPage() {
  const { timeEntries, activeTimer } = useTaskStore();
  const [descriptionInput, setDescriptionInput] = useState(activeTimer.description);
  const [selectedProject, setSelectedProject] = useState(activeTimer.project || 'AI-Powered Learning Platform');

  // Timer ticker hook
  useEffect(() => {
    let interval: any = null;
    if (activeTimer.isRunning) {
      interval = setInterval(() => {
        taskStore.updateTimerElapsed(activeTimer.elapsedSeconds + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [activeTimer.isRunning, activeTimer.elapsedSeconds]);

  const formatSeconds = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateGroupTotal = (entries: TimeEntry[]) => {
    const totalSecs = entries.reduce((acc, curr) => acc + curr.duration, 0);
    return formatSeconds(totalSecs);
  };

  const handleToggleTimer = () => {
    if (activeTimer.isRunning) {
      taskStore.stopAndSaveTimer();
    } else {
      taskStore.startTimer(descriptionInput, selectedProject);
    }
  };

  const handleContinueEntry = (entry: TimeEntry) => {
    setDescriptionInput(entry.description);
    setSelectedProject(entry.project);
    taskStore.startTimer(entry.description, entry.project);
  };

  const dateGroups: ('Today' | 'Yesterday' | 'Friday, 14 Feb 2024')[] = ['Today', 'Yesterday', 'Friday, 14 Feb 2024'];

  const projects = [
    'AI-Powered Learning Platform',
    'Smarthome Dashboard',
    'Fitness Tracker',
    'Healthcare Portal',
    'Educational Platform UX',
    'FinTech Dashboard',
    'Travel Booking',
    'Snazzy Studio'
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Time Tracker
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track activity, log time entries, and monitor weekly progress.
          </p>
        </div>
      </div>

      {/* Active Live Timer Card Widget */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            value={descriptionInput}
            onChange={(e) => {
              setDescriptionInput(e.target.value);
              taskStore.setActiveTimerField({ description: e.target.value });
            }}
            placeholder="What are you working on?"
            className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 transition-all"
          />

          {/* Project Selector */}
          <div className="flex items-center gap-1 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            <Folder className="h-3.5 w-3.5 text-indigo-500" />
            <select
              value={selectedProject}
              onChange={(e) => {
                setSelectedProject(e.target.value);
                taskStore.setActiveTimerField({ project: e.target.value });
              }}
              className="bg-transparent border-none outline-none cursor-pointer text-xs font-semibold text-indigo-600 dark:text-indigo-400"
            >
              {projects.map((p) => (
                <option key={p} value={p} className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900">
                  + {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Timer Actions & Clock Counter */}
        <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Clock className={`h-4 w-4 ${activeTimer.isRunning ? 'text-indigo-600 animate-pulse' : 'text-slate-400'}`} />
            <span className="font-mono font-bold text-lg tracking-wider text-slate-900 dark:text-white">
              {formatSeconds(activeTimer.elapsedSeconds)}
            </span>
          </div>

          <button
            onClick={handleToggleTimer}
            className={`h-10 px-5 rounded-xl text-xs font-bold flex items-center gap-2 text-white transition-all shadow-sm ${
              activeTimer.isRunning
                ? 'bg-rose-600 hover:bg-rose-700 ring-2 ring-rose-200 dark:ring-rose-950'
                : 'bg-indigo-600 hover:bg-indigo-700 ring-2 ring-indigo-200 dark:ring-indigo-950'
            }`}
          >
            {activeTimer.isRunning ? (
              <>
                <Square className="h-3.5 w-3.5 fill-current" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Start</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Entry Logs Grouped By Date */}
      <div className="space-y-6">
        {dateGroups.map((group) => {
          const groupEntries = timeEntries.filter((e) => e.dateGroup === group);
          const groupTotal = calculateGroupTotal(groupEntries);

          return (
            <div
              key={group}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs"
            >
              {/* Group Header */}
              <div className="px-5 py-3 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  {group}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-slate-400">Total:</span>
                  <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                    {groupTotal}
                  </span>
                </div>
              </div>

              {/* Entries List */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {groupEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {entry.description}
                        </div>
                        <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1 mt-0.5">
                          <span>• {entry.project}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0">
                      <div className="text-[11px] font-medium text-slate-400 font-mono">
                        {entry.startTime} - {entry.endTime}
                      </div>

                      <div className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 min-w-[70px] text-right">
                        {formatSeconds(entry.duration)}
                      </div>

                      <button
                        onClick={() => handleContinueEntry(entry)}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        <Play className="h-3 w-3 fill-current" />
                        <span>Continue</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
