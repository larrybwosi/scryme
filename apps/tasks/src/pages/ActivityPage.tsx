import React from 'react';
import { useTaskStore } from '../lib/store';
import { Activity, CheckCircle2, Clock, User, Sparkles } from 'lucide-react';

export default function ActivityPage() {
  const { tasks } = useTaskStore();

  const activityFeed = tasks.flatMap((t) =>
    (t.activityLogs || []).map((log) => ({
      ...log,
      taskName: t.name,
      project: t.project
    }))
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Organization Activity Feed
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Real-time audit log of task updates, project status changes, and team comments.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
        {activityFeed.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No activity events recorded yet. Perform task updates or status changes to see live logs.
          </div>
        ) : (
          <div className="relative border-l-2 border-indigo-100 dark:border-slate-800 ml-4 space-y-6">
            {activityFeed.map((event) => (
              <div key={event.id} className="relative pl-6 group">
                <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-indigo-600 ring-4 ring-white dark:ring-slate-900 flex items-center justify-center">
                  <Activity className="h-2.5 w-2.5 text-white" />
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">{event.actor.name}</span>
                    <span className="text-[10px] text-slate-400">{new Date(event.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-slate-700 dark:text-slate-300">
                    <span className="text-slate-500">{event.action} on </span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">{event.taskName}</span>
                    <span className="text-slate-400"> ({event.project})</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
