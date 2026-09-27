import React, { useState } from 'react';
import { useTaskStore, taskStore } from '../lib/store';
import { Task, TaskStatus } from '../lib/types';
import {
  List,
  Kanban,
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  CheckCircle2,
  Trash2,
  User,
  Tag as TagIcon
} from 'lucide-react';

export default function TasksPage() {
  const { tasks } = useTaskStore();
  const [activeTab, setActiveTab] = useState<'list' | 'board' | 'calendar' | 'timeline'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string>('All');
  const [newTaskGroup, setNewTaskGroup] = useState<'Today' | 'Tomorrow' | 'Feb 16, 2024' | null>(null);
  const [newTaskName, setNewTaskName] = useState('');

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.project.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = filterTag === 'All' || t.tags.includes(filterTag);
    return matchesSearch && matchesTag;
  });

  const dateGroups: ('Today' | 'Tomorrow' | 'Feb 16, 2024')[] = ['Today', 'Tomorrow', 'Feb 16, 2024'];

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'Review':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">Review</span>;
      case 'InProgress':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">In Progress</span>;
      case 'Stopped':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60">Stopped</span>;
      case 'ToDo':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">To Do</span>;
      case 'Completed':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">Completed</span>;
    }
  };

  const getTagBadge = (tag: string) => {
    switch (tag) {
      case 'Design':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">Design</span>;
      case 'Frontend':
      case 'Front-End':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400">Frontend</span>;
      case 'UX Design':
      case 'UX Research':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400">{tag}</span>;
      case 'Development':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">Development</span>;
      case 'Back-end':
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">Back-end</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{tag}</span>;
    }
  };

  const handleCreateTask = (group: 'Today' | 'Tomorrow' | 'Feb 16, 2024') => {
    if (!newTaskName.trim()) return;
    taskStore.addTask({
      name: newTaskName.trim(),
      client: 'Snazzy Studio',
      project: 'Landing Page',
      status: 'ToDo',
      tags: ['Design'],
      estimation: `${group}, 5:00 PM`,
      dateGroup: group,
      assignees: [
        { name: 'Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' }
      ],
    });
    setNewTaskName('');
    setNewTaskGroup(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title & View Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Tasks
          </h1>
        </div>

        {/* View Tabs */}
        <div className="flex items-center p-1 bg-slate-200/60 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/60 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'list'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span>List</span>
          </button>
          <button
            onClick={() => setActiveTab('board')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'board'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Kanban className="h-3.5 w-3.5" />
            <span>Board</span>
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'calendar'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            <span>Calendar</span>
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'timeline'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Timeline</span>
          </button>
        </div>
      </div>

      {/* Toolbar Filters & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks, clients, projects..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-xs rounded-lg border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tag Filter Dropdown */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span>Tags:</span>
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="bg-transparent font-semibold border-none outline-none text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="All">All Tags</option>
              <option value="Design">Design</option>
              <option value="Frontend">Frontend</option>
              <option value="UX Design">UX Design</option>
              <option value="Development">Development</option>
              <option value="Back-end">Back-end</option>
              <option value="UX Research">UX Research</option>
            </select>
          </div>

          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg transition-colors">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            <span>Sort</span>
          </button>
        </div>
      </div>

      {/* Main View Content */}
      {activeTab === 'list' && (
        <div className="space-y-6">
          {dateGroups.map((group) => {
            const groupTasks = filteredTasks.filter((t) => t.dateGroup === group);

            return (
              <div key={group} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
                {/* Group Header */}
                <div className="px-4 py-3 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {group}
                    </span>
                    <span className="h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold flex items-center justify-center">
                      {groupTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setNewTaskGroup(newTaskGroup === group ? null : group)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Task</span>
                  </button>
                </div>

                {/* Task Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px] bg-slate-50/30 dark:bg-slate-900/40">
                        <th className="py-2.5 px-4 w-8"></th>
                        <th className="py-2.5 px-4 min-w-[220px]">Name</th>
                        <th className="py-2.5 px-4 min-w-[140px]">Client</th>
                        <th className="py-2.5 px-4 min-w-[180px]">Project</th>
                        <th className="py-2.5 px-4 min-w-[110px]">Status</th>
                        <th className="py-2.5 px-4 min-w-[110px]">Tags</th>
                        <th className="py-2.5 px-4 min-w-[130px]">Estimation</th>
                        <th className="py-2.5 px-4 min-w-[80px]">People</th>
                        <th className="py-2.5 px-4 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {groupTasks.map((task) => (
                        <tr
                          key={task.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                        >
                          <td className="py-3 px-4">
                            <input
                              type="checkbox"
                              checked={task.status === 'Completed'}
                              onChange={(e) =>
                                taskStore.updateTaskStatus(
                                  task.id,
                                  e.target.checked ? 'Completed' : 'ToDo'
                                )
                              }
                              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                            <span className={task.status === 'Completed' ? 'line-through text-slate-400' : ''}>
                              {task.name}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">
                            {task.client}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                            {task.project}
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={task.status}
                              onChange={(e) => taskStore.updateTaskStatus(task.id, e.target.value as TaskStatus)}
                              className="bg-transparent border-none outline-none cursor-pointer p-0 m-0"
                            >
                              <option value="ToDo">To Do</option>
                              <option value="InProgress">In Progress</option>
                              <option value="Stopped">Stopped</option>
                              <option value="Review">Review</option>
                              <option value="Completed">Completed</option>
                            </select>
                            <div className="inline-block ml-1">
                              {getStatusBadge(task.status)}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-1 flex-wrap">
                              {task.tags.map((tag) => (
                                <React.Fragment key={tag}>
                                  {getTagBadge(tag)}
                                </React.Fragment>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-medium">
                            {task.estimation}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex -space-x-1.5 overflow-hidden">
                              {task.assignees.map((person, idx) => (
                                <img
                                  key={idx}
                                  src={person.avatar}
                                  alt={person.name}
                                  title={person.name}
                                  className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover"
                                />
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => taskStore.deleteTask(task.id)}
                              className="p-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all rounded"
                              title="Delete task"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}

                      {/* Inline New Task Row */}
                      {newTaskGroup === group && (
                        <tr className="bg-indigo-50/40 dark:bg-indigo-950/20">
                          <td className="py-3 px-4"></td>
                          <td className="py-3 px-4" colSpan={7}>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={newTaskName}
                                onChange={(e) => setNewTaskName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateTask(group)}
                                placeholder="Task title..."
                                autoFocus
                                className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                              <button
                                onClick={() => handleCreateTask(group)}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg"
                              >
                                Add
                              </button>
                              <button
                                onClick={() => setNewTaskGroup(null)}
                                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs rounded-lg"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4"></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Bottom "+ Add new task" action button */}
                <div className="p-2.5 bg-slate-50/40 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setNewTaskGroup(group)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add new task</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Kanban Board View */}
      {activeTab === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {(['ToDo', 'InProgress', 'Stopped', 'Review'] as TaskStatus[]).map((colStatus) => {
            const colTasks = filteredTasks.filter((t) => t.status === colStatus);
            return (
              <div
                key={colStatus}
                className="bg-slate-100/70 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                      {colStatus === 'ToDo' ? 'To Do' : colStatus === 'InProgress' ? 'In Progress' : colStatus}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                      {colTasks.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 bg-white dark:bg-slate-800/90 rounded-lg border border-slate-200/80 dark:border-slate-700/60 shadow-xs space-y-2 hover:border-indigo-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 leading-snug">
                          {task.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {task.client} • {task.project}
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex gap-1">
                          {task.tags.map((tag) => (
                            <React.Fragment key={tag}>
                              {getTagBadge(tag)}
                            </React.Fragment>
                          ))}
                        </div>
                        <div className="flex -space-x-1">
                          {task.assignees.map((person, idx) => (
                            <img
                              key={idx}
                              src={person.avatar}
                              alt={person.name}
                              className="h-5 w-5 rounded-full ring-1 ring-white object-cover"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Calendar & Timeline Placeholder Tabs */}
      {(activeTab === 'calendar' || activeTab === 'timeline') && (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <CalendarIcon className="h-10 w-10 text-indigo-500 mx-auto" />
          <h3 className="font-bold text-slate-900 dark:text-white">
            {activeTab === 'calendar' ? 'Calendar View' : 'Timeline View'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Interactive timeline and scheduling view for tasks across projects.
          </p>
        </div>
      )}
    </div>
  );
}
