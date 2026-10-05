import React, { useState } from 'react';
import { useTaskStore } from '../../lib/store';
import { Task } from '../../lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@repo/ui/components/ui/dialog';
import { Button } from '@repo/ui/components/ui/button';
import { Badge } from '@repo/ui/components/ui/badge';
import { Input } from '@repo/ui/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/ui/avatar';
import { Send, Trash2 } from 'lucide-react';

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
}

export default function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  const updateTask = useTaskStore((state) => state.updateTask);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const [commentInput, setCommentInput] = useState('');

  if (!task) return null;

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    const newComment = {
      id: `tc-${Date.now()}`,
      taskId: task.id,
      author: {
        id: 'usr-current',
        name: 'Sarah Jenkins',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      },
      content: commentInput,
      createdAt: new Date().toISOString(),
    };

    const newComments = [...(task.comments || []), newComment];
    updateTask(task.id, { comments: newComments });
    setCommentInput('');
  };

  const handleDelete = () => {
    deleteTask(task.id);
    onClose();
  };

  return (
    <Dialog open={!!task} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] uppercase">
              {task.project}
            </Badge>
            <DialogTitle className="text-base font-bold leading-tight">{task.name}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Status & Priority Row */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg border border-border">
            <div>
              <div className="text-[10px] text-muted-foreground uppercase font-bold">Status</div>
              <select
                value={task.status}
                onChange={(e) => updateTask(task.id, { status: e.target.value as any })}
                className="mt-1 bg-background border border-input rounded-md px-2 py-1 text-xs text-foreground outline-none"
              >
                <option value="ToDo">To Do</option>
                <option value="InProgress">In Progress</option>
                <option value="Review">In Review</option>
                <option value="Completed">Completed</option>
                <option value="Stopped">Stopped</option>
              </select>
            </div>

            <div>
              <div className="text-[10px] text-muted-foreground uppercase font-bold">Priority</div>
              <Badge
                variant="outline"
                className={`mt-1 text-[10px] uppercase ${
                  task.priority === 'HIGH' || task.priority === 'URGENT'
                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {task.priority || 'MEDIUM'} Priority
              </Badge>
            </div>
          </div>

          {/* Assignees */}
          <div className="space-y-1">
            <div className="text-[10px] text-muted-foreground uppercase font-bold">Assignees</div>
            <div className="flex items-center gap-2 pt-1">
              {task.assignees.map((person, idx) => (
                <div key={idx} className="flex items-center gap-1.5 p-1 rounded-md bg-muted/30 border border-border">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={person.avatar} />
                    <AvatarFallback className="text-[9px]">
                      {person.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-[11px]">{person.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="text-[10px] text-muted-foreground uppercase font-bold">Activity Comments</div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {task.comments && task.comments.length > 0 ? (
                task.comments.map((c, idx) => (
                  <div key={idx} className="p-2 rounded-md bg-muted/30 text-foreground text-xs space-y-0.5">
                    <div className="font-semibold text-[11px]">{c.author?.name || 'User'}</div>
                    <div>{c.content}</div>
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-muted-foreground italic">No comments yet on this task.</p>
              )}
            </div>

            <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-1">
              <Input
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Write a comment..."
                className="text-xs h-8 flex-1"
              />
              <Button type="submit" size="icon" className="h-8 w-8 shrink-0">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="destructive" size="sm" onClick={handleDelete} className="text-xs gap-1.5">
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Task</span>
          </Button>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
