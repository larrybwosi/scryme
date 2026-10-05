import React, { useState } from 'react';
import { useTaskStore } from '../lib/store';
import { Clock, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@repo/ui/components/ui/card';
import { Button } from '@repo/ui/components/ui/button';
import { Badge } from '@repo/ui/components/ui/badge';
import { Progress } from '@repo/ui/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/ui/avatar';
import CreateProjectModal from '../components/modals/CreateProjectModal';

export default function ProjectsPage() {
  const projects = useTaskStore((state) => state.projects);
  const tasks = useTaskStore((state) => state.tasks);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Workspace Projects
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage projects, monitor completion status, and organize team task force allocations.
          </p>
        </div>

        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 text-xs shadow-xs">
          <Plus className="h-4 w-4" />
          <span>Create Project</span>
        </Button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => {
          const projectTasks = tasks.filter((t) => t.project === project.name);
          const completedTasks = projectTasks.filter((t) => t.status === 'Completed').length;

          return (
            <Card key={project.id} className="flex flex-col justify-between hover:shadow-xs transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {project.status || 'ACTIVE'}
                  </Badge>
                </div>
                <CardTitle className="text-base font-bold text-foreground mt-2">
                  {project.name}
                </CardTitle>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {project.description}
                </p>
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="font-semibold">Completion</span>
                    <span>{project.progress || 0}% ({completedTasks}/{projectTasks.length} tasks)</span>
                  </div>
                  <Progress value={project.progress || 0} className="h-2" />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Due {project.endDate || 'Dec 2025'}</span>
                  </div>

                  <div className="flex -space-x-1.5 overflow-hidden">
                    {project.members?.map((m: any, idx: number) => (
                      <Avatar key={idx} className="h-6 w-6 border-2 border-background">
                        <AvatarImage src={m.avatar} />
                        <AvatarFallback className="text-[9px]">
                          {m.name ? m.name.substring(0, 2).toUpperCase() : 'U'}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
