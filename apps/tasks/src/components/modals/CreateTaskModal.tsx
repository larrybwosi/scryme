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
import {
  FileText,
  Folder,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Tag,
  Calendar,
  Clock
} from 'lucide-react';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateTaskModal({ isOpen, onClose }: CreateTaskModalProps) {
  const projects = useTaskStore((state) => state.projects);
  const clients = useTaskStore((state) => state.clients);
  const teamMembers = useTaskStore((state) => state.teamMembers);
  const availableTags = useTaskStore((state) => state.tags);

  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [client, setClient] = useState(clients[0]?.name || 'Enterprise Workspace');
  const [status, setStatus] = useState<TaskStatus>('ToDo');
  const [priority, setPriority] = useState<PriorityLevel>('MEDIUM');
  const [selectedTag, setSelectedTag] = useState(availableTags[0]?.name || 'Development');
  const [estimatedHours, setEstimatedHours] = useState('8');
  const [dateGroup, setDateGroup] = useState<'Today' | 'Tomorrow' | 'Feb 16, 2024'>('Today');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const selectedProj = projects.find((p) => p.id === projectId);
    const projectName = selectedProj ? selectedProj.name : 'Workspace Project';

    try {
      await taskStore.addTask({
        name: name.trim(),
        client: client || (selectedProj ? selectedProj.client : 'Workspace Client'),
        projectId: projectId || undefined,
        project: projectName,
        status,
        priority,
        tags: [selectedTag],
        estimation: `${dateGroup}, 5:00 PM`,
        estimatedHours: parseFloat(estimatedHours) || 8,
        actualHours: 0,
        dateGroup,
        assignees: teamMembers[0]
          ? [
              {
                id: teamMembers[0].id,
                name: teamMembers[0].name,
                avatar: teamMembers[0].avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
              },
            ]
          : [],
        subtasks: [],
        comments: [],
        activityLogs: []
      });

      onClose();
      setName('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-md flex flex-col p-0 gap-0">
        <SheetHeader className="p-6 border-b border-border bg-muted/30">
          <SheetTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Create Enterprise Work Task
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Define task details, assign project resources, and set target priorities.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <span>Task Name</span>
              <span className="text-destructive">*</span>
            </Label>
            <Input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Implement API route for task status"
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Folder className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Project Assignment</span>
              </Label>
              {projects.length > 0 ? (
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select Project...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              ) : (
                <Input
                  type="text"
                  placeholder="Project Name"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="text-xs"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Client Entity</span>
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Status</span>
              </Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ToDo">To Do</option>
                <option value="InProgress">In Progress</option>
                <option value="Review">In Review</option>
                <option value="Completed">Completed</option>
                <option value="Stopped">Stopped</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Priority</span>
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
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Category Tag</span>
              </Label>
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="w-full bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="Development">Development</option>
                <option value="Design">Design</option>
                <option value="Frontend">Frontend</option>
                <option value="Back-end">Back-end</option>
                {availableTags.map((t) => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Schedule Bucket</span>
              </Label>
              <select
                value={dateGroup}
                onChange={(e) => setDateGroup(e.target.value as any)}
                className="w-full bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="Today">Today</option>
                <option value="Tomorrow">Tomorrow</option>
                <option value="Feb 16, 2024">Feb 16, 2024</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Est. Allocation (Hours)</span>
              </Label>
              <Input
                type="number"
                min="0.5"
                step="0.5"
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
              disabled={isSubmitting}
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
