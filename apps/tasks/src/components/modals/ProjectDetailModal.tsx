import React from 'react';
import { Project } from '../../lib/types';
import { useTaskStore, taskStore } from '../../lib/store';
import { Trash2 } from 'lucide-react';
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

interface ProjectDetailModalProps {
  project: Project | null;
  onClose: () => void;
}

export default function ProjectDetailModal({ project, onClose }: ProjectDetailModalProps) {
  if (!project) return null;

  const tasks = useTaskStore((state) => state.tasks);
  const projectTasks = tasks.filter((t) => t.projectId === project.id || t.project === project.name);
  const completedTasks = projectTasks.filter((t) => t.status === 'Completed').length;
  const progress = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : (project.progress || 0);

  return (
    <Dialog open={!!project} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-5 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm border border-indigo-200 dark:border-indigo-800">
              {project.key || 'PRJ'}
            </div>
            <div>
              <div className="text-xs font-semibold text-muted-foreground">{project.client}</div>
              <DialogTitle className="text-base font-bold text-foreground">
                {project.name}
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="sr-only">
            Project details for {project.name}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {project.description && (
            <p className="text-xs text-muted-foreground leading-relaxed bg-muted/40 p-3.5 rounded-xl border border-border">
              {project.description}
            </p>
          )}

          <div className="grid grid-cols-3 gap-3 p-3.5 bg-muted/40 rounded-xl border border-border text-center">
            <div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase">Status</div>
              <div className="text-xs font-bold text-foreground mt-0.5">{project.status}</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase">Priority</div>
              <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">{project.priority || 'MEDIUM'}</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase">Completion</div>
              <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{progress}%</div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium text-muted-foreground">
              <span>Overall Progress</span>
              <span>{completedTasks} of {projectTasks.length} tasks completed</span>
            </div>
            <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Project Tasks
            </h3>
            {projectTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3 text-center">No tasks assigned to this project yet.</p>
            ) : (
              <div className="divide-y divide-border max-h-48 overflow-y-auto">
                {projectTasks.map((t) => (
                  <div key={t.id} className="py-2 flex items-center justify-between text-xs">
                    <span className={`font-medium ${t.status === 'Completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {t.name}
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      {t.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-border flex items-center justify-between sm:justify-between bg-muted/30">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              taskStore.deleteProject(project.id);
              onClose();
            }}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 text-xs"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Project</span>
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
