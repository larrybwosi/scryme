import React, { useState } from 'react';
import { useTaskStore } from '../lib/store';
import { Project } from '../lib/types';
import ProjectDetailModal from '../components/modals/ProjectDetailModal';
import CreateProjectModal from '../components/modals/CreateProjectModal';
import { Plus, Search } from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Badge } from '@repo/ui/components/ui/badge';
import { Card } from '@repo/ui/components/ui/card';

export default function ProjectsPage() {
  const projects = useTaskStore((state) => state.projects);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Projects
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage organization project portfolios, milestones, and team assignments.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="gap-2 self-start sm:self-auto text-xs"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="p-3 shadow-xs flex items-center gap-2 border-border">
        <Search className="h-4 w-4 text-muted-foreground ml-1" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search projects by name, key, or client..."
          className="border-0 shadow-none focus-visible:ring-0 text-xs h-8"
        />
      </Card>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.map((p) => (
          <Card
            key={p.id}
            onClick={() => setSelectedProject(p)}
            className="p-5 cursor-pointer hover:border-indigo-500/50 transition-all space-y-4 group shadow-xs border-border"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-sm"
                  style={{ backgroundColor: p.color || '#6366F1' }}
                >
                  {p.key}
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-muted-foreground">{p.client}</div>
                  <h3 className="font-bold text-sm text-foreground group-hover:text-indigo-600 transition-colors">
                    {p.name}
                  </h3>
                </div>
              </div>
              <Badge
                variant={p.status === 'ACTIVE' ? 'secondary' : 'outline'}
                className={p.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : ''}
              >
                {p.status}
              </Badge>
            </div>

            {p.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {p.description}
              </p>
            )}

            {/* Progress Bar */}
            <div className="space-y-1.5 pt-2 border-t border-border">
              <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                <span>Completion</span>
                <span>{p.progress || 50}%</span>
              </div>
              <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${p.progress || 50}%` }}
                />
              </div>
            </div>

            {/* Owner & Meta */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <div className="flex items-center gap-1.5">
                {p.owner?.avatar && (
                  <img src={p.owner.avatar} alt={p.owner.name} className="h-5 w-5 rounded-full object-cover" />
                )}
                <span className="text-foreground font-medium text-[11px]">
                  {p.owner?.name || 'Unassigned'}
                </span>
              </div>
              <span className="text-[10px]">{p.taskCount || 0} tasks</span>
            </div>
          </Card>
        ))}
      </div>

      <ProjectDetailModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />

      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}
