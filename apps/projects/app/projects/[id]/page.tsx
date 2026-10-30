"use client";

import Link from "next/link";
import { useProjects, useTasks } from "@/lib/hooks/use-projects";
import {
  Calendar,
  Layers,
  Users,
  Activity,
  BarChart2,
  GitBranch,
  Plus,
  ArrowLeft
} from "lucide-react";
import { use } from "react";

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const { data: projects = [] } = useProjects();
  const { data: tasks = [] } = useTasks(projectId);

  const project = projects.find((p) => p.id === projectId) || {
    id: projectId,
    name: "Nexus 2.0 Redesign",
    description: "Interactive analytics dashboard & real-time canvas execution engine.",
    status: "ACTIVE",
    startDate: "2024-10-01",
    endDate: "2024-11-15",
  };

  const completedTasks = tasks.filter((t) => t.status === "DONE").length;
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "IN_REVIEW").length;
  const totalTasks = tasks.length || 12;
  const progressPercent = Math.round((completedTasks / totalTasks) * 100) || 68;

  return (
    <div className="space-y-6">
      {/* Header Breadcrumbs & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2E3039]/50 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link href="/projects" className="hover:text-slate-200 transition-colors flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" />
              <span>Projects</span>
            </Link>
            <span>/</span>
            <span className="font-mono text-indigo-400">PRJ-{project.id.slice(0, 4).toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-slate-100">{project.name}</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {project.status}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">{project.description}</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/tasks?projectId=${project.id}`}
            className="inline-flex items-center gap-1.5 bg-[#5E6AD2] hover:bg-[#717DE3] text-white px-3 py-1.5 rounded-md text-xs font-medium transition-all shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Task to Project</span>
          </Link>
        </div>
      </div>

      {/* Grid Specs Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Details (Col 2) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Progress & Velocity Metrics */}
          <div className="bg-[#12141A] border border-[#2E3039] p-5 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-[#5E6AD2]" />
                <span>Sprint Completion & Velocity</span>
              </h2>
              <span className="font-mono text-xs text-indigo-300 font-semibold">{progressPercent}%</span>
            </div>

            <div className="w-full bg-[#1f1f23] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#5E6AD2] h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2 text-center border-t border-[#2E3039]/50">
              <div>
                <div className="text-[10px] font-medium text-slate-500 uppercase">Completed Tasks</div>
                <div className="text-base font-bold text-slate-200 font-mono mt-0.5">{completedTasks}</div>
              </div>
              <div>
                <div className="text-[10px] font-medium text-slate-500 uppercase">In Progress</div>
                <div className="text-base font-bold text-amber-400 font-mono mt-0.5">{inProgressTasks}</div>
              </div>
              <div>
                <div className="text-[10px] font-medium text-slate-500 uppercase">Total Backlog</div>
                <div className="text-base font-bold text-indigo-400 font-mono mt-0.5">{totalTasks}</div>
              </div>
            </div>
          </div>

          {/* Architecture Spec & Description */}
          <div className="bg-[#12141A] border border-[#2E3039] p-5 rounded-lg space-y-3">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Layers className="h-4 w-4 text-slate-400" />
              <span>Technical Scope & Architecture</span>
            </h2>
            <div className="text-xs text-slate-300 leading-relaxed space-y-2 bg-[#171922] p-3 rounded-md border border-[#2E3039]/60 font-mono">
              <p>
                - 60fps streaming telemetry canvas pipeline with WebGL hardware buffer.
              </p>
              <p>
                - Concurrent worker thread polling for live WebSocket backpressure management.
              </p>
              <p>
                - Time scrubbing keyframe controller with sub-4ms buffer drain latency.
              </p>
            </div>
          </div>

          {/* Recent Commits & Branch Links */}
          <div className="bg-[#12141A] border border-[#2E3039] p-5 rounded-lg space-y-3">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-slate-400" />
              <span>Linked Repository Branches</span>
            </h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-[#171922] p-2.5 rounded-md border border-[#2E3039]/50 text-xs">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-3.5 w-3.5 text-[#5E6AD2]" />
                  <span className="font-mono text-slate-200">feat/nexus-canvas-v2</span>
                  <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-semibold">Active</span>
                </div>
                <span className="text-[11px] text-slate-500">Updated 2h ago by Elena R.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info Sheet (Col 1) */}
        <div className="space-y-5">
          <div className="bg-[#12141A] border border-[#2E3039] p-5 rounded-lg space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-[#2E3039]/50 pb-2">
              Project Parameters
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  <span>Timeline</span>
                </span>
                <span className="text-slate-200 font-mono">{project.startDate} to {project.endDate}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-slate-500" />
                  <span>Lead Squad</span>
                </span>
                <span className="text-slate-200 font-medium">Core Graphics Team</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-slate-500" />
                  <span>Health Metric</span>
                </span>
                <span className="text-emerald-400 font-semibold">Optimal (Zero Blockers)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
