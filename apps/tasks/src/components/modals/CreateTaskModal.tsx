import React, { useState } from 'react';
import { useTaskStore } from '../../lib/store';
import { PriorityLevel } from '../../lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@repo/ui/components/ui/dialog';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateTaskModal({ isOpen, onClose }: CreateTaskModalProps) {
  const projects = useTaskStore((state) => state.projects);
  const addTask = useTaskStore((state) => state.addTask);

  const [name, setName] = useState('');
  const [project, setProject] = useState(projects[0]?.name || 'AI-Powered Learning Platform');
  const [priority, setPriority] = useState<PriorityLevel>('MEDIUM');
  const [estimatedHours, setEstimatedHours] = useState('8');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addTask({
      name,
      client: 'Internal Workspace',
      project,
      status: 'ToDo',
      tags: ['Frontend'],
      priority,
      estimation: 'Next week',
      dateGroup: 'Today',
      assignees: [
        {
          id: `ta-${Date.now()}`,
          name: 'Sarah Jenkins',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        },
      ],
      estimatedHours: parseInt(estimatedHours) || 8,
    });

    setName('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Create New Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Task Title</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Implement OAuth2 Refresh Token Strategy"
              className="text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Project</Label>
              <select
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Priority</Label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Estimated Work Hours</Label>
            <Input
              type="number"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              className="text-xs"
              min="1"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="text-xs">
              Cancel
            </Button>
            <Button type="submit" className="text-xs">
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
