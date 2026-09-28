import React from 'react';
import { useTaskStore } from '../lib/store';
import {
  CheckSquare,
  Clock,
  FolderKanban,
  Users,
  TrendingUp,
  ArrowUpRight,
  CheckCircle2,
  Play
} from 'lucide-react';
import { Link } from '@tanstack/react-router';

export default function DashboardPage() {
  const { tasks, timeEntries } = useTaskStore();

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'InProgress').length;
  const reviewTasks = tasks.filter((t) => t.status === 'Review').length;

  const totalLoggedSeconds = timeEntries.reduce((acc, curr) => acc + curr.duration, 0);
  const totalHours = (totalLoggedSeconds / 3600).toFixed(1);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="p-6 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-2xl text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
            Workspace Overview
          </span>
          <h1 className="text-2xl font-bold tracking-tight mt-1">
            Welcome back, Snazzy Studio Team 👋
          </h1>
          <p className="text-xs text-indigo-100 mt-1 max-w-lg">
            Here's what is happening across your projects and time logs today. You have {inProgressTasks} tasks in progress.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/tasks"
            className="px-4 py-2 bg-white text-indigo-700 hover:bg-indigo-50 font-semibold text-xs rounded-xl shadow-xs transition-all"
          >
            View Tasks
          </Link>
          <Link
            to="/time-tracker"
            className="px-4 py-2 bg-indigo-500/40 hover:bg-indigo-500/60 border border-indigo-300/30 text-white font-semibold text-xs rounded-xl transition-all"
          >
            Start Timer
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Tasks</span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600 dark:text-indigo-400">
              <CheckSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{totalTasks}</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <ArrowUpRight className="h-3.5 w-3.5" /> +12%
            </span>
          </div>
          <div className="text-[11px] text-slate-400">{completedTasks} completed • {reviewTasks} in review</div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Hours Logged</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/60 rounded-xl text-amber-600 dark:text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{totalHours} hrs</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <ArrowUpRight className="h-3.5 w-3.5" /> +8%
            </span>
          </div>
          <div className="text-[11px] text-slate-400">Across {timeEntries.length} logged sessions</div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Projects</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 rounded-xl text-blue-600 dark:text-blue-400">
              <FolderKanban className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">8</span>
            <span className="text-xs font-semibold text-slate-400">Active</span>
          </div>
          <div className="text-[11px] text-slate-400">8 clients connected</div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Team Velocity</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">94%</span>
            <span className="text-xs font-semibold text-emerald-600">On Track</span>
          </div>
          <div className="text-[11px] text-slate-400">Sprint efficiency rate</div>
        </div>
      </div>

      {/* Recent Tasks Preview */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Recent Tasks
          </h2>
          <Link to="/tasks" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            View All Tasks →
          </Link>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {tasks.slice(0, 5).map((task) => (
            <div key={task.id} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <CheckCircle2 className={`h-4 w-4 shrink-0 ${task.status === 'Completed' ? 'text-emerald-500' : 'text-slate-300'}`} />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {task.name}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {task.client} • {task.project}
                  </div>
                </div>
              </div>

              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 shrink-0">
                {task.estimation}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
