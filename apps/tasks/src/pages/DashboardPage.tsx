import React from 'react';
import { useTaskStore } from '../lib/store';
import {
  CheckCircle2,
  Clock,
  FolderKanban,
  Plus,
  UserCheck
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@repo/ui/components/ui/card';
import { Button } from '@repo/ui/components/ui/button';
import { Badge } from '@repo/ui/components/ui/badge';
import { Progress } from '@repo/ui/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/ui/avatar';
import { Link } from '@tanstack/react-router';

export default function DashboardPage() {
  const tasks = useTaskStore((state) => state.tasks);
  const projects = useTaskStore((state) => state.projects);
  const teamMembers = useTaskStore((state) => state.teamMembers);
  const timeEntries = useTaskStore((state) => state.timeEntries);

  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'InProgress').length;
  const openTasks = tasks.filter((t) => t.status !== 'Completed').length;

  const totalLoggedSecs = timeEntries.reduce((acc, curr) => acc + curr.duration, 0);
  const totalLoggedHours = (totalLoggedSecs / 3600).toFixed(1);

  const overallProgress = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Workspace Dashboard
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Overview of project health, team productivity, and active tasks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" asChild className="gap-1.5 text-xs h-9">
            <Link to="/tasks">
              <Plus className="h-4 w-4" />
              <span>New Task</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <FolderKanban className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground font-medium">Active Projects</div>
            <div className="text-xl font-bold text-foreground">{projects.length}</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground font-medium">Completed Tasks</div>
            <div className="text-xl font-bold text-foreground">{completedTasks} / {tasks.length}</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground font-medium">Total Logged Time</div>
            <div className="text-xl font-bold text-foreground">{totalLoggedHours}h</div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground font-medium">Team Members</div>
            <div className="text-xl font-bold text-foreground">{teamMembers.length}</div>
          </div>
        </Card>
      </div>

      {/* Progress & Overview Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workspace Completion Rate */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold">Workspace Project Velocity</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {overallProgress}% Completion
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span>Task Delivery Progress</span>
                <span>{completedTasks} of {tasks.length} tasks</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-lg border border-border bg-muted/30">
                <div className="text-[10px] text-muted-foreground uppercase font-bold">In Progress</div>
                <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{inProgressTasks}</div>
              </div>

              <div className="p-3 rounded-lg border border-border bg-muted/30">
                <div className="text-[10px] text-muted-foreground uppercase font-bold">Open Tasks</div>
                <div className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">{openTasks}</div>
              </div>

              <div className="p-3 rounded-lg border border-border bg-muted/30">
                <div className="text-[10px] text-muted-foreground uppercase font-bold">Completed</div>
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{completedTasks}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Team Members */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Team Roster</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {teamMembers.slice(0, 4).map((member) => (
              <div key={member.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback className="text-xs font-bold">
                      {member.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground truncate">{member.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{member.role}</div>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase">
                  Active
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-bold">Active Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {projects.map((project) => (
              <div key={project.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1 min-w-0">
                  <div className="font-semibold text-foreground truncate">{project.name}</div>
                  <div className="text-[11px] text-muted-foreground line-clamp-1">{project.description}</div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="w-28 space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Progress</span>
                      <span>{project.progress || 0}%</span>
                    </div>
                    <Progress value={project.progress || 0} className="h-1.5" />
                  </div>

                  <Badge variant="outline" className="text-[10px]">
                    {project.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
