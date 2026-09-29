import React, { useState } from 'react';
import { useTaskStore, taskStore } from '../lib/store';
import { Task, TaskStatus } from '../lib/types';
import TaskDetailModal from '../components/modals/TaskDetailModal';
import CreateTaskModal from '../components/modals/CreateTaskModal';
import {
  List,
  Kanban,
  Calendar as CalendarIcon,
  Plus,
  Search,
  Trash2
} from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Badge } from '@repo/ui/components/ui/badge';
import { Card } from '@repo/ui/components/ui/card';

export default function TasksPage() {
  const { tasks, myTasksOnly } = useTaskStore();
  const [activeTab, setActiveTab] = useState<'list' | 'board' | 'calendar' | 'timeline'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag] = useState<string>('All');
  const [newTaskGroup, setNewTaskGroup] = useState<'Today' | 'Tomorrow' | 'Feb 16, 2024' | null>(null);
  const [newTaskName, setNewTaskName] = useState('');

  const [selectedTaskForModal, setSelectedTaskForModal] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Filtering
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.project.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = filterTag === 'All' || t.tags.includes(filterTag);
    const matchesMyTasks = !myTasksOnly || t.assignees.some((a) => a.name === 'Sarah Jenkins');
    return matchesSearch && matchesTag && matchesMyTasks;
  });

  const dateGroups: ('Today' | 'Tomorrow' | 'Feb 16, 2024')[] = ['Today', 'Tomorrow', 'Feb 16, 2024'];

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'Review':
        return <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800">In Review</Badge>;
      case 'InProgress':
        return <Badge variant="secondary" className="bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800">In Progress</Badge>;
      case 'Completed':
        return <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">Completed</Badge>;
      case 'Stopped':
        return <Badge variant="destructive">Stopped</Badge>;
      case 'ToDo':
      default:
        return <Badge variant="outline">To Do</Badge>;
    }
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'URGENT':
        return <Badge variant="destructive">Urgent</Badge>;
      case 'HIGH':
        return <Badge variant="secondary" className="bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-800">High</Badge>;
      case 'LOW':
        return <Badge variant="outline" className="text-muted-foreground">Low</Badge>;
      case 'MEDIUM':
      default:
        return <Badge variant="secondary" className="bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-800">Medium</Badge>;
    }
  };

  const handleInlineTaskCreate = (group: 'Today' | 'Tomorrow' | 'Feb 16, 2024') => {
    if (!newTaskName.trim()) return;
    taskStore.addTask({
      name: newTaskName.trim(),
      client: 'Snazzy Studio',
      projectId: 'proj-1',
      project: 'Mobile App Redesign',
      status: 'ToDo',
      priority: 'MEDIUM',
      tags: ['Design'],
      estimation: `${group}, 5:00 PM`,
      estimatedHours: 4,
      actualHours: 0,
      dateGroup: group,
      assignees: [
        { id: 'm-1', name: 'Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' }
      ],
      subtasks: [],
      comments: [],
      activityLogs: []
    });
    setNewTaskName('');
    setNewTaskGroup(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        {/* Left: View Tabs */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'list'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span>List</span>
          </button>
          <button
            onClick={() => setActiveTab('board')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'board'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Kanban className="h-3.5 w-3.5" />
            <span>Board</span>
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'calendar'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            <span>Calendar</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-9 w-44 sm:w-60"
            />
          </div>

          <Button
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="gap-1.5 text-xs h-9 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>New Task</span>
          </Button>
        </div>
      </div>

      {/* Main Tab Views */}
      {activeTab === 'list' && (
        <div className="space-y-6">
          {dateGroups.map((group) => {
            const groupTasks = filteredTasks.filter((t) => t.dateGroup === group || (!t.dateGroup && group === 'Today'));
            const completedCount = groupTasks.filter((t) => t.status === 'Completed').length;

            return (
              <Card key={group} className="overflow-hidden border-border shadow-xs">
                {/* Group Header */}
                <div className="px-5 py-3.5 bg-muted/40 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-sm text-foreground">{group}</span>
                    <Badge variant="secondary" className="text-xs">
                      {groupTasks.length} tasks
                    </Badge>
                    {completedCount > 0 && (
                      <span className="text-xs text-muted-foreground font-medium">
                        ({completedCount} completed)
                      </span>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setNewTaskGroup(group)}
                    className="text-xs h-8 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Task</span>
                  </Button>
                </div>

                {/* Inline Task Form */}
                {newTaskGroup === group && (
                  <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-border flex gap-2">
                    <Input
                      type="text"
                      autoFocus
                      placeholder="Task name..."
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleInlineTaskCreate(group);
                        if (e.key === 'Escape') setNewTaskGroup(null);
                      }}
                      className="text-xs h-9 bg-background"
                    />
                    <Button size="sm" onClick={() => handleInlineTaskCreate(group)} className="text-xs h-9">
                      Add
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setNewTaskGroup(null)}
                      className="text-xs h-9"
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                {/* Tasks List */}
                <div className="divide-y divide-border">
                  {groupTasks.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground italic">
                      No tasks for {group.toLowerCase()}.
                    </div>
                  ) : (
                    groupTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-4 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={task.status === 'Completed'}
                            onChange={() => {
                              taskStore.updateTaskStatus(
                                task.id,
                                task.status === 'Completed' ? 'ToDo' : 'Completed'
                              );
                            }}
                            className="h-4 w-4 rounded border-input text-indigo-600 focus:ring-ring cursor-pointer shrink-0"
                          />
                          <div
                            onClick={() => setSelectedTaskForModal(task)}
                            className="cursor-pointer flex-1 min-w-0"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-semibold truncate ${
                                  task.status === 'Completed'
                                    ? 'line-through text-muted-foreground'
                                    : 'text-foreground hover:text-indigo-600 dark:hover:text-indigo-400'
                                }`}
                              >
                                {task.name}
                              </span>
                              {task.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                              <span>{task.client}</span>
                              <span>•</span>
                              <span className="font-medium text-indigo-600 dark:text-indigo-400">{task.project}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {getStatusBadge(task.status)}
                          {getPriorityBadge(task.priority)}

                          <div className="flex -space-x-1">
                            {task.assignees.map((person, idx) => (
                              <img
                                key={idx}
                                src={person.avatar}
                                alt={person.name}
                                title={person.name}
                                className="h-6 w-6 rounded-full ring-2 ring-background object-cover"
                              />
                            ))}
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => taskStore.deleteTask(task.id)}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {activeTab === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {(['ToDo', 'InProgress', 'Review', 'Completed', 'Stopped'] as TaskStatus[]).map((status) => {
            const columnTasks = filteredTasks.filter((t) => t.status === status);
            const statusTitles: Record<TaskStatus, string> = {
              ToDo: 'To Do',
              InProgress: 'In Progress',
              Review: 'In Review',
              Completed: 'Completed',
              Stopped: 'Stopped'
            };

            return (
              <div key={status} className="bg-muted/40 p-4 rounded-xl border border-border flex flex-col min-h-[450px]">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                    <span>{statusTitles[status]}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {columnTasks.length}
                    </Badge>
                  </h3>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {columnTasks.map((task) => (
                    <Card
                      key={task.id}
                      onClick={() => setSelectedTaskForModal(task)}
                      className="p-3.5 cursor-pointer hover:border-indigo-500/50 transition-all shadow-xs"
                    >
                      <div className="text-xs font-semibold text-foreground mb-1">
                        {task.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground mb-3 truncate">
                        {task.project}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        {getPriorityBadge(task.priority)}
                        <div className="flex -space-x-1">
                          {task.assignees.map((person, idx) => (
                            <img
                              key={idx}
                              src={person.avatar}
                              alt={person.name}
                              className="h-5 w-5 rounded-full ring-1 ring-background object-cover"
                            />
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'calendar' && (
        <Card className="p-8 text-center border-border">
          <CalendarIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-sm font-bold text-foreground">Calendar View</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Interactive schedule view showing due dates for all workspace tasks across clients.
          </p>
        </Card>
      )}

      {/* Modals */}
      <TaskDetailModal
        task={selectedTaskForModal}
        onClose={() => setSelectedTaskForModal(null)}
      />

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
