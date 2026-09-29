import React, { useState } from 'react';
import { useTaskStore, taskStore } from '../lib/store';
import { Project } from '../lib/types';
import ProjectDetailModal from '../components/modals/ProjectDetailModal';
import CreateProjectModal from '../components/modals/CreateProjectModal';
import { FolderKanban, Plus, Search, Filter, Calendar, Users, CheckCircle2, MoreHorizontal } from 'lucide-react';

export default function ProjectsPage() {
  const { projects } = useTaskStore();
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Projects
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage organization project portfolios, milestones, and team assignments.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl shadow-xs flex items-center gap-2 self-start sm:self-auto transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-2">
        <Search className="h-4 w-4 text-slate-400 ml-1" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search projects by name, key, or client..."
          className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-200 outline-none"
        />
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.map((p) => (
          <div
            key={p.id}
            onClick={() => setSelectedProject(p)}
            className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-400 cursor-pointer transition-all space-y-4 group"
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
                  <div className="text-[11px] font-semibold text-slate-400">{p.client}</div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                    {p.name}
                  </h3>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                p.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {p.status}
              </span>
            </div>

            {p.description && (
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {p.description}
              </p>
            )}

            {/* Progress Bar */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                <span>Completion</span>
                <span>{p.progress || 50}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${p.progress || 50}%` }}
                />
              </div>
            </div>

            {/* Owner & Meta */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <div className="flex items-center gap-1.5">
                {p.owner?.avatar && (
                  <img src={p.owner.avatar} alt={p.owner.name} className="h-5 w-5 rounded-full object-cover" />
                )}
                <span className="text-slate-600 dark:text-slate-300 font-medium text-[11px]">
                  {p.owner?.name || 'Unassigned'}
                </span>
              </div>
              <span className="text-[10px]">{p.taskCount || 0} tasks</span>
            </div>
          </div>
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
