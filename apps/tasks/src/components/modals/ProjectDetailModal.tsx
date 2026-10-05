import React from 'react';
import { useTaskStore } from '../../lib/store';
import { Project } from '../../lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@repo/ui/components/ui/dialog';
import { Button } from '@repo/ui/components/ui/button';
import { Badge } from '@repo/ui/components/ui/badge';
import { Progress } from '@repo/ui/components/ui/progress';
import { Trash2 } from 'lucide-react';

interface ProjectDetailModalProps {
  project: Project | null;
  onClose: () => void;
}

export default function ProjectDetailModal({ project, onClose }: ProjectDetailModalProps) {
  const deleteProject = useTaskStore((state) => state.deleteProject);

  if (!project) return null;

  const handleDelete = () => {
    deleteProject(project.id);
    onClose();
  };

  return (
    <Dialog open={!!project} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] uppercase">
              {project.status}
            </Badge>
            <DialogTitle className="text-base font-bold">{project.name}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          <p className="text-muted-foreground">{project.description}</p>

          <div className="space-y-1.5 p-3 rounded-lg border border-border bg-muted/30">
            <div className="flex justify-between font-semibold">
              <span>Overall Progress</span>
              <span>{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>

          <div className="p-3 rounded-lg border border-border bg-card space-y-1">
            <div className="text-[10px] text-muted-foreground uppercase font-bold">Target Completion</div>
            <div className="font-semibold text-foreground">{project.endDate || 'Dec 2025'}</div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="destructive" size="sm" onClick={handleDelete} className="text-xs gap-1.5">
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Project</span>
          </Button>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
