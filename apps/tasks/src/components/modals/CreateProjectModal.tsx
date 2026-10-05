import React, { useState } from 'react';
import { useTaskStore } from '../../lib/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@repo/ui/components/ui/dialog';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const addProject = useTaskStore((state) => state.addProject);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('2025-12-31');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addProject({
      name,
      key: name.substring(0, 3).toUpperCase(),
      client: 'Acme Corp',
      description: description || 'New enterprise workspace project.',
      endDate: dueDate,
      progress: 0,
      status: 'ACTIVE',
      members: [
        {
          id: `pm-${Date.now()}`,
          memberId: 'mem-1',
          role: 'ADMIN',
          name: 'Sarah Jenkins',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        },
      ],
    });

    setName('');
    setDescription('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Create New Project</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Project Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. AI Customer Portal Redesign"
              className="text-xs"
              required
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of project objectives"
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Target Completion Date</Label>
            <Input
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              placeholder="e.g. 2025-12-31"
              className="text-xs"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="text-xs">
              Cancel
            </Button>
            <Button type="submit" className="text-xs">
              Save Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
