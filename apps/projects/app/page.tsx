"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProjectsAPI, Project } from "@/lib/api";
import { FolderKanban, Plus, Clock, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";

export default function ProjectsDashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ProjectsAPI.getProjects().then((data) => {
      setProjects(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Projects Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Overview of active projects, timelines, and progress milestones across your organization.
          </p>
        </div>
        <Link
          href="/new"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md shadow-indigo-600/20"
        >
          <Plus className="h-4 w-4" />
          Create Project
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#121824] border border-[#1F293D] p-5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Projects</div>
            <div className="text-2xl font-bold text-slate-100 mt-1">{projects.length}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <FolderKanban className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-[#121824] border border-[#1F293D] p-5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Sprints</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">
              {projects.filter((p) => p.status === "ACTIVE").length}
            </div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-[#121824] border border-[#1F293D] p-5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">In Planning</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">
              {projects.filter((p) => p.status === "PLANNING").length}
            </div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="bg-[#121824] border border-[#1F293D] rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-100">All Projects</h2>
          <span className="text-xs text-slate-400">Syncing with NestJS V3 Engine</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">Loading workspace projects...</div>
        ) : projects.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">No projects created yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-[#0B0F17] border border-[#1F293D] hover:border-indigo-500/50 rounded-lg p-5 transition-all group flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {project.status}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">{project.id}</span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-100 mt-3 group-hover:text-indigo-400 transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{project.description}</p>
                </div>

                <div className="pt-3 border-t border-[#1F293D] flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    <span>{project.startDate ? `${project.startDate} - ${project.endDate}` : "Flexible Timeline"}</span>
                  </div>
                  <Link
                    href={`/tasks?projectId=${project.id}`}
                    className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    View Tasks <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
