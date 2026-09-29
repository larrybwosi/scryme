import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, PriorityLevel } from '../../lib/types';
import { taskStore } from '../../lib/store';
import {
  Clock,
  MessageSquare,
  Activity,
  Plus,
  Trash2,
  ListTodo,
  Calendar,
  Edit2,
  Check,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@repo/ui/components/ui/dialog';
import { Button } from '@repo/ui/components/ui/button';
import { Badge } from '@repo/ui/components/ui/badge';
import { Input } from '@repo/ui/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@repo/ui/components/ui/tabs';

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
}

export default function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  if (!task) return null;

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.name);

  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editedDesc, setEditedDesc] = useState(task.description || '');

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [activeTab, setActiveTab] = useState<'subtasks' | 'comments' | 'activity'>('subtasks');

  useEffect(() => {
    setEditedTitle(task.name);
    setEditedDesc(task.description || '');
  }, [task]);

  const handleSaveTitle = () => {
    if (editedTitle.trim() && editedTitle !== task.name) {
      taskStore.updateTask(task.id, { name: editedTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleSaveDesc = () => {
    if (editedDesc !== task.description) {
      taskStore.updateTask(task.id, { description: editedDesc });
    }
    setIsEditingDesc(false);
  };

  const handleStatusChange = (status: TaskStatus) => {
    taskStore.updateTaskStatus(task.id, status);
  };

  const handlePriorityChange = (priority: PriorityLevel) => {
    taskStore.updateTask(task.id, { priority });
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    taskStore.addSubtask(task.id, newSubtaskTitle.trim());
    setNewSubtaskTitle('');
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    taskStore.addComment(
      task.id,
      newCommentText.trim(),
      'Sarah Jenkins'
    );
    setNewCommentText('');
  };

  const totalSubtasksCount = (task.subtasks || []).length;
  const completedSubtasksCount = (task.subtasks || []).filter((s) => s.completed).length;
  const subtaskProgress = totalSubtasksCount > 0 ? Math.round((completedSubtasksCount / totalSubtasksCount) * 100) : 0;

  return (
    <Dialog open={!!task} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-5 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-muted-foreground">{task.client}</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{task.project}</span>
          </div>

          {/* Editable Title */}
          {isEditingTitle ? (
            <div className="flex items-center gap-2 mt-1">
              <Input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                className="text-base font-bold h-9"
                autoFocus
              />
              <Button size="sm" onClick={handleSaveTitle} className="h-9 px-2.5">
                <Check className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditingTitle(false)} className="h-9 px-2.5">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between group">
              <DialogTitle className="text-lg font-bold text-foreground">
                {task.name}
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingTitle(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity h-7 px-2 text-xs text-muted-foreground"
              >
                <Edit2 className="h-3.5 w-3.5 mr-1" />
                Edit
              </Button>
            </div>
          )}

          <DialogDescription className="sr-only">
            Task details for {task.name}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Quick Actions & Status Control */}
          <div className="grid grid-cols-2 gap-4 p-3.5 bg-muted/40 rounded-xl border border-border">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Status
              </label>
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                className="w-full bg-background border border-input rounded-lg px-2.5 py-1 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ToDo">To Do</option>
                <option value="InProgress">In Progress</option>
                <option value="Review">In Review</option>
                <option value="Completed">Completed</option>
                <option value="Stopped">Stopped</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Priority
              </label>
              <select
                value={task.priority}
                onChange={(e) => handlePriorityChange(e.target.value as PriorityLevel)}
                className="w-full bg-background border border-input rounded-lg px-2.5 py-1 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          {/* Task Description */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Description
              </label>
              {!isEditingDesc && (
                <button
                  onClick={() => setIsEditingDesc(true)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                >
                  {task.description ? 'Edit' : '+ Add Description'}
                </button>
              )}
            </div>

            {isEditingDesc ? (
              <div className="space-y-2 mt-1">
                <textarea
                  value={editedDesc}
                  onChange={(e) => setEditedDesc(e.target.value)}
                  placeholder="Add detailed task requirements..."
                  className="w-full min-h-[80px] p-2.5 text-xs bg-background border border-input rounded-xl outline-none focus:ring-2 focus:ring-ring"
                />
                <div className="flex items-center justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => setIsEditingDesc(false)} className="h-8 text-xs">
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveDesc} className="h-8 text-xs">
                    Save Description
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground leading-relaxed p-2.5 bg-muted/20 rounded-xl border border-border/50">
                {task.description || 'No description provided for this task.'}
              </p>
            )}
          </div>

          {/* Details Metadata */}
          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Due: <strong className="text-foreground">{task.estimation}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Logged: <strong className="text-foreground">{task.actualHours || 0} / {task.estimatedHours || 0} hrs</strong></span>
            </div>
          </div>

          {/* Assignees & Tags */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Assignees:</span>
              <div className="flex -space-x-1">
                {task.assignees.map((person, idx) => (
                  <img
                    key={idx}
                    src={person.avatar}
                    alt={person.name}
                    title={person.name}
                    className="h-7 w-7 rounded-full ring-2 ring-background object-cover"
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground font-medium">Tags:</span>
              <div className="flex gap-1">
                {task.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[11px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Tabs Navigation & Content */}
          <Tabs value={activeTab} onValueChange={(val: string) => setActiveTab(val as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="subtasks" className="text-xs gap-1.5">
                <ListTodo className="h-3.5 w-3.5" />
                <span>Subtasks ({completedSubtasksCount}/{totalSubtasksCount})</span>
              </TabsTrigger>
              <TabsTrigger value="comments" className="text-xs gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Comments ({(task.comments || []).length})</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="text-xs gap-1.5">
                <Activity className="h-3.5 w-3.5" />
                <span>Activity</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="subtasks" className="space-y-4 pt-3">
              {totalSubtasksCount > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                    <span>Checklist completion</span>
                    <span>{subtaskProgress}%</span>
                  </div>
                  <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full transition-all duration-300"
                      style={{ width: `${subtaskProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {(task.subtasks || []).map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center gap-2 p-2.5 bg-muted/40 rounded-xl border border-border hover:bg-muted/70 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={() => taskStore.toggleSubtask(task.id, st.id)}
                      className="h-4 w-4 rounded border-input text-indigo-600 focus:ring-ring cursor-pointer"
                    />
                    <span
                      className={`text-xs font-medium flex-1 ${
                        st.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                      }`}
                    >
                      {st.title}
                    </span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddSubtask} className="flex gap-2">
                <Input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Add a new checklist item..."
                  className="flex-1 text-xs h-9"
                />
                <Button type="submit" size="sm" className="gap-1 h-9">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add</span>
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="comments" className="space-y-4 pt-3">
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {(task.comments || []).length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">No comments yet. Start the conversation!</p>
                ) : (
                  (task.comments || []).map((c) => (
                    <div key={c.id} className="p-3 bg-muted/40 rounded-xl border border-border space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-foreground">{c.author.name}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{c.content}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddComment} className="flex gap-2">
                <Input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 text-xs h-9"
                />
                <Button type="submit" size="sm" className="h-9">
                  Post
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="activity" className="space-y-2 pt-3 max-h-60 overflow-y-auto">
              {(task.activityLogs || []).length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No recent activity logged for this task.</p>
              ) : (
                (task.activityLogs || []).map((log) => (
                  <div key={log.id} className="flex items-start gap-2.5 text-xs p-2.5 bg-muted/30 rounded-xl border border-border">
                    <Activity className="h-3.5 w-3.5 text-indigo-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground">{log.actor.name}</span>
                      <span className="text-muted-foreground"> {log.action}</span>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{new Date(log.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="p-4 border-t border-border flex items-center justify-between sm:justify-between bg-muted/30">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              taskStore.deleteTask(task.id);
              onClose();
            }}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 text-xs"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Task</span>
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
