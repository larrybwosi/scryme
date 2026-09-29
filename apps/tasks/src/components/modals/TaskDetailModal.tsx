import React, { useState } from 'react';
import { Task, TaskStatus, PriorityLevel } from '../../lib/types';
import { taskStore, useTaskStore } from '../../lib/store';
import {
  X,
  CheckCircle2,
  Clock,
  User,
  Tag as TagIcon,
  MessageSquare,
  Activity,
  Plus,
  Trash2,
  ListTodo,
  Paperclip,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
}

export default function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  if (!task) return null;

  const { teamMembers } = useTaskStore();
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [activeTab, setActiveTab] = useState<'subtasks' | 'comments' | 'activity'>('subtasks');

  const handleStatusChange = (status: TaskStatus) => {
    taskStore.updateTaskStatus(task.id, status);
  };

  const handlePriorityChange = (priority: PriorityLevel) => {
    taskStore.updateTask(task.id, { priority });
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    taskStore.addSubtask(task.id, newSubtaskTitle);
    setNewSubtaskTitle('');
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    taskStore.addComment(task.id, newCommentText, 'Sarah Jenkins');
    setNewCommentText('');
  };

  const completedSubtasksCount = (task.subtasks || []).filter((st) => st.completed).length;
  const totalSubtasksCount = (task.subtasks || []).length;
  const subtaskProgress = totalSubtasksCount > 0 ? Math.round((completedSubtasksCount / totalSubtasksCount) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/50 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl h-full max-h-[92vh] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="space-y-1 pr-6">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                {task.taskKey || 'TASK'}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {task.client} • {task.project}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {task.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status & Priority Control Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Status
              </label>
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ToDo">To Do</option>
                <option value="InProgress">In Progress</option>
                <option value="Stopped">Stopped</option>
                <option value="Review">In Review</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Priority
              </label>
              <select
                value={task.priority || 'MEDIUM'}
                onChange={(e) => handlePriorityChange(e.target.value as PriorityLevel)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Due Date
              </label>
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 py-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>{task.estimation}</span>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Hours (Est / Act)
              </label>
              <div className="flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-slate-300 py-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>{task.estimatedHours || 0}h / {task.actualHours || 0}h</span>
              </div>
            </div>
          </div>

          {/* Assignees & Tags Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Assignees & Labels
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Assigned to:</span>
                <div className="flex -space-x-1">
                  {task.assignees.map((person, idx) => (
                    <img
                      key={idx}
                      src={person.avatar}
                      alt={person.name}
                      title={person.name}
                      className="h-7 w-7 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover"
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">Tags:</span>
                <div className="flex gap-1">
                  {task.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="border-b border-slate-200 dark:border-slate-800 flex gap-4">
            <button
              onClick={() => setActiveTab('subtasks')}
              className={`pb-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'subtasks'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <ListTodo className="h-3.5 w-3.5" />
              <span>Subtasks ({completedSubtasksCount}/{totalSubtasksCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`pb-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'comments'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Comments ({(task.comments || []).length})</span>
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`pb-2 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'activity'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Activity Log</span>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'subtasks' && (
            <div className="space-y-4">
              {/* Subtask Progress Bar */}
              {totalSubtasksCount > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>Checklist completion</span>
                    <span>{subtaskProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full transition-all duration-300"
                      style={{ width: `${subtaskProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Subtasks List */}
              <div className="space-y-2">
                {(task.subtasks || []).map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800 hover:bg-slate-100/60 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={() => taskStore.toggleSubtask(task.id, st.id)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span
                      className={`text-xs font-medium flex-1 ${
                        st.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {st.title}
                    </span>
                  </div>
                ))}
              </div>

              {/* Add Subtask Form */}
              <form onSubmit={handleAddSubtask} className="flex gap-2">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Add a new checklist item..."
                  className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl flex items-center gap-1 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add</span>
                </button>
              </form>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4">
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {(task.comments || []).length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No comments yet. Start the conversation!</p>
                ) : (
                  (task.comments || []).map((c) => (
                    <div key={c.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 dark:text-white">{c.author.name}</span>
                        <span className="text-[10px] text-slate-400">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{c.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Input */}
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl transition-colors"
                >
                  Post
                </button>
              </form>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(task.activityLogs || []).length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No recent activity logged for this task.</p>
              ) : (
                (task.activityLogs || []).map((log) => (
                  <div key={log.id} className="flex items-start gap-2.5 text-xs p-2.5 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200/40 dark:border-slate-800">
                    <Activity className="h-3.5 w-3.5 text-indigo-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white">{log.actor.name}</span>
                      <span className="text-slate-600 dark:text-slate-400"> {log.action}</span>
                      <div className="text-[10px] text-slate-400 mt-0.5">{new Date(log.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={() => {
              taskStore.deleteTask(task.id);
              onClose();
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 px-3 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Task</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
