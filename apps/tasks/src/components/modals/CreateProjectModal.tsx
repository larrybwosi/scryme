import React, { useState } from 'react';
import { useTaskStore, taskStore } from '../../lib/store';
import { PriorityLevel } from '../../lib/types';
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
import { Textarea } from '@repo/ui/components/ui/textarea';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const { clients, teamMembers } = useTaskStore();

  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [client, setClient] = useState(clients[0]?.name || 'Workspace Client');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const prjKey = key.trim() || name.substring(0, 3).toUpperCase();

    try {
      await taskStore.addProject({
        name: name.trim(),
        key: prjKey,
        client: client || 'Workspace Client',
        description: description.trim(),
        status: 'ACTIVE',
        priority,
        color: '#6366F1',
        owner: teamMembers[0]
          ? {
              id: teamMembers[0].id,
              name: teamMembers[0].name,
              avatar: teamMembers[0].avatar,
            }
          : undefined,
        taskCount: 0,
        completedTaskCount: 0,
        progress: 0,
      });

      onClose();
      setName('');
      setKey('');
      setDescription('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-md flex flex-col p-0 gap-0">
        <SheetHeader className="p-6 border-b border-border bg-muted/30">
          <SheetTitle className="text-lg font-bold text-foreground">
            Create New Project
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Add a new project to organize tasks and manage team deliverables.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold">
                Project Name *
              </Label>
              <Input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mobile App Redesign"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Key Prefix
              </Label>
              <Input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase())}
                placeholder="APP"
                maxLength={6}
                className="text-xs font-mono uppercase font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Client
              </Label>
              {clients.length > 0 ? (
                <select
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              ) : (
                <Input
                  type="text"
                  placeholder="Client Name"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  className="text-xs"
                />
              )}
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
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Description
            </Label>
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the project goals..."
              className="text-xs resize-none"
            />
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
              disabled={isSubmitting}
              size="sm"
              className="text-xs"
            >
              Create Project
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
