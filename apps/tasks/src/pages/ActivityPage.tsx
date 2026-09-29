import React from 'react';
import { useTaskStore } from '../lib/store';
import { Activity } from 'lucide-react';
import { Card } from '@repo/ui/components/ui/card';

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
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Organization Activity Feed
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Real-time audit log of task updates, project status changes, and team comments.
        </p>
      </div>

      <Card className="p-6 border-border shadow-xs space-y-4">
        {activityFeed.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-xs">
            No activity events recorded yet. Perform task updates or status changes to see live logs.
          </div>
        ) : (
          <div className="relative border-l-2 border-indigo-100 dark:border-border ml-4 space-y-6">
            {activityFeed.map((event) => (
              <div key={event.id} className="relative pl-6 group">
                <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-indigo-600 ring-4 ring-background flex items-center justify-center">
                  <Activity className="h-2.5 w-2.5 text-white" />
                </div>
                <div className="bg-muted/40 p-3.5 rounded-xl border border-border space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">{event.actor.name}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(event.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span>{event.action} on </span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">{event.taskName}</span>
                    <span> ({event.project})</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
