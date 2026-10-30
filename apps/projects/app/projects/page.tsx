"use client";

import Link from "next/link";
import { useState } from "react";
import { useProjects } from "@/lib/hooks/use-projects";
import {
  FolderKanban,
  Plus,
  Clock,
  CheckCircle2,
  ArrowRight,
  Search,
  Filter,
  BarChart2,
  Calendar
} from "lucide-react";

export default function ProjectsPage() {
  const { data: projects = [], isLoading } = useProjects();
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const filteredProjects = projects.filter((p) => {
    const matchesFilter =
      filter === "ALL" ||
      (filter === "ACTIVE" && p.status === "ACTIVE") ||
      (filter === "PLANNING" && p.status === "PLANNING") ||
      (filter === "COMPLETED" && p.status === "COMPLETED");
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2E3039]/50 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <FolderKanban className="h-3.5 w-3.5 text-[#5E6AD2]" />
            <span>Workspace</span>
            <span>/</span>
            <span className="text-slate-200 font-medium">Projects Overview</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            Projects Portfolio
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Active engineering initiatives, progress metrics, sprint velocity, and milestone targets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/new"
            className="inline-flex items-center gap-1.5 bg-[#5E6AD2] hover:bg-[#717DE3] text-white px-3 py-1.5 rounded-md text-xs font-medium transition-all shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Project</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#12141A] border border-[#2E3039] p-4 rounded-lg flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Portfolio
            </div>
            <div className="text-xl font-bold text-slate-100 mt-1 font-mono">
              {projects.length}
            </div>
          </div>
          <div className="h-9 w-9 rounded-md bg-[#5E6AD2]/10 border border-[#5E6AD2]/20 flex items-center justify-center text-[#5E6AD2]">
            <FolderKanban className="h-4 w-4" />
          </div>
        </div>

        <div className="bg-[#12141A] border border-[#2E3039] p-4 rounded-lg flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Active Sprints
            </div>
            <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">
              {projects.filter((p) => p.status === "ACTIVE").length}
            </div>
          </div>
          <div className="h-9 w-9 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>

        <div className="bg-[#12141A] border border-[#2E3039] p-4 rounded-lg flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              In Planning
            </div>
            <div className="text-xl font-bold text-amber-400 mt-1 font-mono">
              {projects.filter((p) => p.status === "PLANNING").length}
            </div>
          </div>
          <div className="h-9 w-9 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="h-4 w-4" />
          </div>
        </div>

        <div className="bg-[#12141A] border border-[#2E3039] p-4 rounded-lg flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Velocity Index
            </div>
            <div className="text-xl font-bold text-indigo-400 mt-1 font-mono">
              94.8%
            </div>
          </div>
          <div className="h-9 w-9 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <BarChart2 className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Search & Filter Control Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#12141A] p-2.5 rounded-lg border border-[#2E3039]">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter projects by title or key..."
            className="w-full bg-[#171922] border border-[#2E3039] rounded-md pl-8 pr-3 py-1 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#5E6AD2]"
          />
        </div>

        <div className="flex items-center gap-1 text-xs font-medium text-slate-400">
          <Filter className="h-3.5 w-3.5 text-slate-500 mr-1" />
          <button
            onClick={() => setFilter("ALL")}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filter === "ALL"
                ? "bg-[#1f1f23] text-slate-100 border border-[#2E3039]"
                : "hover:text-slate-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("ACTIVE")}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filter === "ACTIVE"
                ? "bg-[#1f1f23] text-emerald-400 border border-[#2E3039]"
                : "hover:text-slate-200"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter("PLANNING")}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filter === "PLANNING"
                ? "bg-[#1f1f23] text-amber-400 border border-[#2E3039]"
                : "hover:text-slate-200"
            }`}
          >
            Planning
          </button>
        </div>
      </div>

      {/* Projects Grid Container */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-500 text-xs">
          Syncing projects with NestJS V3 Engine...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-xs bg-[#12141A] rounded-lg border border-[#2E3039]">
          No projects matching filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-[#12141A] border border-[#2E3039] hover:border-[#5E6AD2]/50 rounded-lg p-4 transition-all group flex flex-col justify-between space-y-4 hover:shadow-lg hover:shadow-indigo-950/20"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase border ${
                      project.status === "ACTIVE"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}
                  >
                    {project.status}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    PRJ-{project.id.slice(0, 4).toUpperCase()}
                  </span>
                </div>

                <Link
                  href={`/projects/${project.id}`}
                  className="text-sm font-semibold text-slate-100 group-hover:text-[#5E6AD2] transition-colors line-clamp-1"
                >
                  {project.name}
                </Link>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {project.description || "Interactive engineering initiative with streaming telemetry and WebGL canvas execution."}
                </p>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Sprint Completion</span>
                  <span className="font-mono text-slate-200">72%</span>
                </div>
                <div className="w-full bg-[#1f1f23] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#5E6AD2] h-full rounded-full transition-all duration-300"
                    style={{ width: "72%" }}
                  ></div>
                </div>
              </div>

              {/* Footer Links & Metadata */}
              <div className="pt-3 border-t border-[#2E3039]/60 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5 text-[11px]">
                  <Calendar className="h-3 w-3 text-slate-500" />
                  <span>{project.startDate || "Oct 1"} - {project.endDate || "Nov 15"}</span>
                </div>

                <Link
                  href={`/projects/${project.id}`}
                  className="inline-flex items-center gap-1 text-[#5E6AD2] hover:text-[#717DE3] font-medium text-xs"
                >
                  <span>Overview</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
