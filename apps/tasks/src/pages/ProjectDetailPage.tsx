import React, { useState } from 'react';
import { useTaskStore } from '../lib/store';
import { Task, TaskStatus, PriorityLevel } from '../lib/types';
import CreateTaskModal from '../components/modals/CreateTaskModal';
import TaskDetailModal from '../components/modals/TaskDetailModal';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart3,
  Filter
} from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Badge } from '@repo/ui/components/ui/badge';
import { Card } from '@repo/ui/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/ui/select';

interface ProjectDetailPageProps {
  slug?: string;
}

export default function ProjectDetailPage({ slug }: ProjectDetailPageProps) {
  const { projects, tasks, updateTaskStatus, deleteTask } = useTaskStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Find project by slug/key or id
  const project = projects.find(
    (p) =>
      p.key.toLowerCase() === slug?.toLowerCase() ||
      p.id.toLowerCase() === slug?.toLowerCase() ||
      p.name.toLowerCase().replace(/\s+/g, '-') === slug?.toLowerCase()
  ) || projects[0] || {
    id: 'prj-default',
    key: slug?.toUpperCase() || 'WEBSITE',
    name: 'Website Redesign',
    client: 'Acme Corp',
    description: 'Overhaul marketing website and brand redesign',
    status: 'ACTIVE',
  };

  // Filter project tasks
  const projectTasks = tasks.filter((t) => {
    if (t.projectId && project.id) {
      if (t.projectId === project.id) return true;
    }
    if (t.project && project.name) {
      if (t.project.toLowerCase() === project.name.toLowerCase()) return true;
    }
    // Fallback: match by key prefix or default fallback
    return true;
  });

  const filteredTasks = projectTasks.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' || t.status.toLowerCase() === statusFilter.toLowerCase();

    const matchesPriority =
      priorityFilter === 'ALL' || (t.priority && t.priority.toLowerCase() === priorityFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Calculate statistics
  const totalTasks = projectTasks.length;
  const completedTasks = projectTasks.filter(
    (t) => t.status === 'Completed'
  ).length;

  const now = new Date();
  const overdueTasks = projectTasks.filter((t) => {
    if (t.status === 'Completed') return false;
    if (!t.dueDate) return false;
    const dueDate = new Date(t.dueDate);
    return !isNaN(dueDate.getTime()) && dueDate < now;
  }).length;

  const progressPercent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'Completed':
        return <Badge className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200">Completed</Badge>;
      case 'InProgress':
        return <Badge className="bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200">In Progress</Badge>;
      case 'Review':
        return <Badge className="bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200">Review</Badge>;
      case 'Stopped':
        return <Badge className="bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200">Stopped</Badge>;
      case 'ToDo':
      default:
        return <Badge variant="outline">To Do</Badge>;
    }
  };

  const getPriorityBadge = (priority?: PriorityLevel) => {
    switch (priority) {
      case 'URGENT':
        return <Badge variant="destructive">Urgent</Badge>;
      case 'HIGH':
        return <Badge className="bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400 border-orange-200">High</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400 border-sky-200">Medium</Badge>;
      case 'LOW':
      default:
        return <Badge variant="secondary">Low</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Navigation Bar */}
      <div className="border-b border-border pb-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
              <a href="/projects" className="hover:underline">Projects</a>
              <span>/</span>
              <span>{project.key}</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Project: {project.name}
            </h1>
            {project.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {project.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsCreateTaskOpen(true)}
              size="sm"
              className="gap-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="h-4 w-4" />
              <span>New Task</span>
            </Button>
          </div>
        </div>

        {/* Header Tabs */}
        <div className="flex items-center gap-6 text-sm font-medium pt-2">
          <a
            href={`/projects/${slug || project.key.toLowerCase()}`}
            className="text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 pb-2 font-semibold"
          >
            Tasks
          </a>
          <a
            href="/projects"
            className="text-muted-foreground hover:text-foreground pb-2 transition-colors"
          >
            Projects
          </a>
          <a
            href="/teams"
            className="text-muted-foreground hover:text-foreground pb-2 transition-colors"
          >
            Team
          </a>
        </div>
      </div>

      {/* Project Statistics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 shadow-xs border-border space-y-1">
          <div className="text-xs font-semibold text-muted-foreground">Status</div>
          <div className="pt-1">
            <Badge className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200">
              In Progress
            </Badge>
          </div>
        </Card>

        <Card className="p-4 shadow-xs border-border space-y-1">
          <div className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
            <span>Total Tasks</span>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold text-foreground">{totalTasks}</div>
        </Card>

        <Card className="p-4 shadow-xs border-border space-y-1">
          <div className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
            <span>Completed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {completedTasks}
          </div>
        </Card>

        <Card className="p-4 shadow-xs border-border space-y-1">
          <div className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
            <span>Overdue</span>
            <AlertCircle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
            {overdueTasks}
          </div>
        </Card>

        <Card className="p-4 shadow-xs border-border space-y-2 sm:col-span-2 lg:col-span-1">
          <div className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
            <span>Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Search and Filters Toolbar */}
      <Card className="p-3 shadow-xs border-border flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-2.5" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="pl-9 text-xs h-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            <span>Status:</span>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-9 text-xs">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="ToDo">To Do</SelectItem>
              <SelectItem value="InProgress">In Progress</SelectItem>
              <SelectItem value="Review">Review</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Stopped">Stopped</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-2">
            <span>Priority:</span>
          </div>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-36 h-9 text-xs">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Priorities</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Task List Table */}
      <Card className="shadow-xs border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                <th className="p-3.5 pl-4">Title</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Priority</th>
                <th className="p-3.5">Due Date</th>
                <th className="p-3.5">Assignee</th>
                <th className="p-3.5 text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-muted-foreground">
                    No tasks found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="p-3.5 pl-4 font-medium text-foreground">
                      <button
                        onClick={() => setSelectedTask(t)}
                        className="hover:text-indigo-600 dark:hover:text-indigo-400 text-left font-semibold"
                      >
                        {t.name}
                      </button>
                    </td>
                    <td className="p-3.5">
                      {getStatusBadge(t.status)}
                    </td>
                    <td className="p-3.5">
                      {getPriorityBadge(t.priority)}
                    </td>
                    <td className="p-3.5 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{t.dueDate || t.estimation || 'No due date'}</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      {t.assignees && t.assignees.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={t.assignees[0].avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'}
                            alt={t.assignees[0].name}
                            className="h-5 w-5 rounded-full object-cover"
                          />
                          <span className="text-foreground">{t.assignees[0].name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right pr-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedTask(t)}
                          className="h-7 w-7 text-muted-foreground hover:text-indigo-600"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTask(t.id)}
                          className="h-7 w-7 text-muted-foreground hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modals */}
      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
      />

      <TaskDetailModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
}
