import React, { useState } from 'react';
import { useTaskStore, taskStore } from '../../lib/store';
import { TaskStatus, PriorityLevel } from '../../lib/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from '@repo/ui/components/ui/sheet';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateTaskModal({ isOpen, onClose }: CreateTaskModalProps) {
  const { projects, clients, teamMembers, tags: availableTags } = useTaskStore();

  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [client, setClient] = useState(clients[0]?.name || 'Snazzy Studio');
  const [status, setStatus] = useState<TaskStatus>('ToDo');
  const [priority, setPriority] = useState<PriorityLevel>('MEDIUM');
  const [selectedTag, setSelectedTag] = useState(availableTags[0]?.name || 'Design');
  const [estimatedHours, setEstimatedHours] = useState('8');
  const [dateGroup, setDateGroup] = useState<'Today' | 'Tomorrow' | 'Feb 16, 2024'>('Today');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const selectedProj = projects.find((p) => p.id === projectId);
    const projectName = selectedProj ? selectedProj.name : 'Workspace Project';

    taskStore.addTask({
      name: name.trim(),
      client,
      projectId,
      project: projectName,
      status,
      priority,
      tags: [selectedTag],
      estimation: `${dateGroup}, 5:00 PM`,
      estimatedHours: parseFloat(estimatedHours) || 8,
      actualHours: 0,
      dateGroup,
      assignees: [
        { id: teamMembers[0]?.id || 'm-1', name: teamMembers[0]?.name || 'Sarah Jenkins', avatar: teamMembers[0]?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' }
      ],
      subtasks: [],
      comments: [],
      activityLogs: []
    });

    onClose();
    setName('');
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-md flex flex-col p-0 gap-0">
        <SheetHeader className="p-6 border-b border-border bg-muted/30">
          <SheetTitle className="text-lg font-bold text-foreground">
            Create New Task
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Fill in details below to add a task to your workspace.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Task Name *
            </Label>
            <Input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Design User Onboarding Flow"
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Project
              </Label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Client
              </Label>
              <select
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="w-full bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Status
              </Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ToDo">To Do</option>
                <option value="InProgress">In Progress</option>
                <option value="Review">In Review</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Priority
              </Label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Est. Hours
              </Label>
              <Input
                type="number"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <SheetFooter className="p-0 pt-4 flex gap-2 border-t border-border mt-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="text-xs"
            >
              Create Task
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
