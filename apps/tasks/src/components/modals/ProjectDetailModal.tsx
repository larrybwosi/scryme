import React from 'react';
import { Project, Task } from '../../lib/types';
import { useTaskStore, taskStore } from '../../lib/store';
import { X, Calendar, User, CheckCircle2, Clock, Trash2, FolderKanban } from 'lucide-react';

interface ProjectDetailModalProps {
  project: Project | null;
  onClose: () => void;
}

export default function ProjectDetailModal({ project, onClose }: ProjectDetailModalProps) {
  if (!project) return null;

  const { tasks } = useTaskStore();
  const projectTasks = tasks.filter((t) => t.projectId === project.id || t.project === project.name);
  const completedTasks = projectTasks.filter((t) => t.status === 'Completed').length;
  const progress = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : (project.progress || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm border border-indigo-200 dark:border-indigo-800">
              {project.key || 'PRJ'}
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500">{project.client}</div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {project.name}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Description */}
          {project.description && (
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
              {project.description}
            </p>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 text-center">
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase">Status</div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5">{project.status}</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase">Priority</div>
              <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">{project.priority || 'MEDIUM'}</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase">Completion</div>
              <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{progress}%</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium text-slate-500">
              <span>Overall Progress</span>
              <span>{completedTasks} of {projectTasks.length} tasks completed</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Project Tasks */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Project Tasks
            </h3>
            {projectTasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No tasks assigned to this project yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto">
                {projectTasks.map((t) => (
                  <div key={t.id} className="py-2 flex items-center justify-between text-xs">
                    <span className={`font-medium ${t.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                      {t.name}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={() => {
              taskStore.deleteProject(project.id);
              onClose();
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 px-3 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Project</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
