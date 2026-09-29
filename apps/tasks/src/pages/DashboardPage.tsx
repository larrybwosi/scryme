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
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/ui/card';
import { Badge } from '@repo/ui/components/ui/badge';

export default function DashboardPage() {
  const { tasks, projects, clients, teamMembers, timeEntries } = useTaskStore();

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'InProgress').length;
  const reviewTasks = tasks.filter((t) => t.status === 'Review').length;

  const totalLoggedSeconds = timeEntries.reduce((acc, curr) => acc + curr.duration, 0);
  const totalHours = (totalLoggedSeconds / 3600).toFixed(1);

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Dashboard Overview
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Workspace key indicators, task execution metrics, and operational performance.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 shadow-xs border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Total Tasks</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <CheckSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{totalTasks}</div>
          <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
            <span className="text-emerald-600 font-semibold">{completedTasks} completed</span>
            <span>•</span>
            <span>{inProgressTasks} in progress</span>
          </div>
        </Card>

        <Card className="p-4 shadow-xs border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Active Projects</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <FolderKanban className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{projects.length}</div>
          <div className="text-[11px] text-muted-foreground mt-1">
            For {clients.length} active clients
          </div>
        </Card>

        <Card className="p-4 shadow-xs border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Logged Hours</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{totalHours} hrs</div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Tracked across all team members
          </div>
        </Card>

        <Card className="p-4 shadow-xs border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Completion Rate</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{completionRate}%</div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Overall workspace velocity
          </div>
        </Card>
      </div>

      {/* Projects & Team Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Projects List */}
        <Card className="p-0 overflow-hidden shadow-xs border-border">
          <div className="p-4 bg-muted/40 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">Projects Summary</h2>
            <Link to="/tasks" className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1">
              <span>View Tasks</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {projects.map((p) => (
              <div key={p.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div>
                  <div className="text-xs font-bold text-foreground">{p.name}</div>
                  <div className="text-[11px] text-muted-foreground">{p.client}</div>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="text-[10px]">
                    {p.status}
                  </Badge>
                  <div className="text-[10px] text-muted-foreground mt-1">{p.progress || 0}% complete</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Team Activity */}
        <Card className="p-0 overflow-hidden shadow-xs border-border">
          <div className="p-4 bg-muted/40 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">Team Allocation</h2>
            <Badge variant="outline" className="text-xs">
              {teamMembers.length} members
            </Badge>
          </div>
          <div className="divide-y divide-border">
            {teamMembers.map((m) => (
              <div key={m.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <img src={m.avatar} alt={m.name} className="h-8 w-8 rounded-full object-cover" />
                  <div>
                    <div className="text-xs font-bold text-foreground">{m.name}</div>
                    <div className="text-[11px] text-muted-foreground">{m.role}</div>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <span className="font-semibold text-foreground">{m.loggedHoursThisWeek} hrs</span>
                  <div className="text-[10px] text-muted-foreground">this week</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
