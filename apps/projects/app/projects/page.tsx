"use client";

import Link from "next/link";
import React, { useState } from "react";
import { INITIAL_PROJECTS, ProjectItem } from "@/lib/mock-data";

export default function ProjectsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [activeFilter, setActiveFilter] = useState<"all" | "in-progress" | "planning" | "paused">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<ProjectItem[]>(INITIAL_PROJECTS);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectTagline, setNewProjectTagline] = useState("");

  const filteredProjects = projects.filter((project) => {
    const matchesFilter =
      activeFilter === "all" ? true : project.status === activeFilter;
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.leadName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const newProject: ProjectItem = {
      id: `prj-${Date.now().toString().slice(-4)}`,
      name: newProjectName.trim(),
      tagline: newProjectTagline.trim() || "Next-gen development track",
      badge: "Active",
      badgeColor: "bg-surface-container-highest text-primary",
      health: "On Track",
      healthColor: "bg-emerald-400",
      targetDate: "Dec 15",
      sprint: "Sprint 1",
      progress: 0,
      totalIssues: 0,
      closedIssues: 0,
      inProgressIssues: 0,
      backlogIssues: 0,
      status: "in-progress",
      leadName: "Current User",
      leadAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=faces",
    };

    setProjects([newProject, ...projects]);
    setNewProjectName("");
    setNewProjectTagline("");
    setIsNewProjectOpen(false);
  };

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="flex flex-col w-full">
        {/* Top Utility Bar: Title, Counters, Scope Filters, Actions */}
        <div className="flex flex-col gap-4 py-4 mb-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Projects</span>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-surface-container-high text-outline text-label-badge font-label-badge">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                  {projects.filter((p) => p.status === "in-progress").length} Active
                </span>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-surface-container-low text-outline text-label-badge font-label-badge">
                  {projects.filter((p) => p.status === "completed").length} Completed
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              {/* View Mode Switcher */}
              <div className="flex items-center bg-surface-container-lowest p-0.5 rounded-lg shadow-sm border border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-body-sm text-body-sm transition-all ${
                    viewMode === "grid"
                      ? "bg-surface-container-high text-on-surface shadow-sm"
                      : "text-outline hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">grid_view</span>
                  <span className="hidden sm:inline">Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-body-sm text-body-sm transition-all ${
                    viewMode === "table"
                      ? "bg-surface-container-high text-on-surface shadow-sm"
                      : "text-outline hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">view_agenda</span>
                  <span className="hidden sm:inline">Table</span>
                </button>
              </div>
              <div className="h-4 w-px bg-surface-container-highest"></div>
              {/* New Project Action */}
              <button
                type="button"
                onClick={() => setIsNewProjectOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-[15px]">add</span>
                <span>New Project</span>
                <span className="ml-1 text-label-kbd font-label-kbd text-on-primary-container/70 bg-on-primary-fixed/20 px-1 py-0.2 rounded-lg">P</span>
              </button>
            </div>
          </div>

          {/* Sub-navigation: Scope tabs & quick search */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className={`px-2.5 py-1 rounded-lg font-body-sm text-body-sm transition-colors ${
                  activeFilter === "all"
                    ? "bg-surface-container text-on-surface font-headline-sm"
                    : "text-outline hover:text-on-surface hover:bg-surface-container-low"
                }`}
              >
                All Projects
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("in-progress")}
                className={`px-2.5 py-1 rounded-lg font-body-sm text-body-sm transition-colors flex items-center gap-1.5 ${
                  activeFilter === "in-progress"
                    ? "bg-surface-container text-on-surface font-headline-sm"
                    : "text-outline hover:text-on-surface hover:bg-surface-container-low"
                }`}
              >
                <span>In Progress</span>
                <span className="text-label-badge font-label-badge px-1 rounded-lg bg-surface-container-highest text-outline">
                  {projects.filter((p) => p.status === "in-progress").length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("planning")}
                className={`px-2.5 py-1 rounded-lg font-body-sm text-body-sm transition-colors flex items-center gap-1.5 ${
                  activeFilter === "planning"
                    ? "bg-surface-container text-on-surface font-headline-sm"
                    : "text-outline hover:text-on-surface hover:bg-surface-container-low"
                }`}
              >
                <span>Planning</span>
                <span className="text-label-badge font-label-badge px-1 rounded-lg bg-surface-container-highest text-outline">
                  {projects.filter((p) => p.status === "planning").length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("paused")}
                className={`px-2.5 py-1 rounded-lg font-body-sm text-body-sm transition-colors flex items-center gap-1.5 ${
                  activeFilter === "paused"
                    ? "bg-surface-container text-on-surface font-headline-sm"
                    : "text-outline hover:text-on-surface hover:bg-surface-container-low"
                }`}
              >
                <span>Paused</span>
                <span className="text-label-badge font-label-badge px-1 rounded-lg bg-surface-container-highest text-outline">
                  {projects.filter((p) => p.status === "paused").length}
                </span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-surface-container-lowest border border-outline-variant/30 text-outline focus-within:text-on-surface focus-within:bg-surface-container-low transition-all">
                <span className="material-symbols-outlined text-[14px]">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects, leads, tags..."
                  className="bg-transparent font-body-sm text-body-sm text-on-surface focus:outline-none placeholder:text-outline w-44 md:w-60"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-outline hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal: New Project */}
        {isNewProjectOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-lg bg-surface-container-low border border-outline-variant/50 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Create New Project</h3>
                <button
                  type="button"
                  onClick={() => setIsNewProjectOpen(false)}
                  className="w-6 h-6 rounded flex items-center justify-center text-outline hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
              <form onSubmit={handleCreateProject} className="flex flex-col gap-4 mt-4">
                <div>
                  <label className="block text-body-sm font-medium text-on-surface mb-1">Project Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kinetic Engine 3.0"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full h-8 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
                  />
                </div>
                <div>
                  <label className="block text-body-sm font-medium text-on-surface mb-1">Tagline / Description</label>
                  <input
                    type="text"
                    placeholder="Brief objective"
                    value={newProjectTagline}
                    onChange={(e) => setNewProjectTagline(e.target.value)}
                    className="w-full h-8 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsNewProjectOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-body-sm text-outline hover:text-on-surface"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm"
                  >
                    Create Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Layout: Grid vs Table */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5 mb-6">
            {filteredProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id.replace("prj-", "")}?tab=overview`}
                className="group relative flex flex-col justify-between p-4 rounded-lg bg-surface-container-low hover:bg-surface-container transition-all duration-150 shadow-sm border border-outline-variant/30 hover:border-outline-variant"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary text-[13px] font-label-code shrink-0">
                        <span className="material-symbols-outlined text-[15px] text-primary">auto_awesome</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-headline-sm text-headline-sm text-on-surface truncate group-hover:text-primary transition-colors">
                          {project.name}
                        </h3>
                        <p className="font-body-sm text-body-sm text-outline truncate">{project.tagline}</p>
                      </div>
                    </div>
                    {project.badge && (
                      <span className={`shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-label-badge uppercase tracking-wider ${project.badgeColor}`}>
                        {project.badge}
                      </span>
                    )}
                  </div>

                  {/* Health and Metadata strip */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-surface-container-highest">
                      <span className={`w-1.5 h-1.5 rounded-full ${project.healthColor}`}></span>
                      <span className="font-label-badge text-label-badge text-on-surface">{project.health}</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-container-highest text-outline font-label-code text-label-code">
                      <span className="material-symbols-outlined text-[13px]">date_range</span>
                      <span>{project.targetDate}</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-container-highest text-outline font-label-code text-label-code">
                      <span>{project.sprint}</span>
                    </div>
                  </div>

                  {/* Burnup Progress Indicator */}
                  <div className="flex flex-col gap-1.5 pt-2">
                    <div className="flex items-center justify-between text-body-sm font-body-sm">
                      <span className="text-outline">Execution Progress</span>
                      <span className="font-label-code text-label-code text-on-surface font-medium">{project.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-container rounded-full transition-all duration-500"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Issues Breakdown Matrix */}
                  <div className="grid grid-cols-3 gap-1 pt-2 border-t border-outline-variant/30 text-center font-label-code">
                    <div className="p-1 rounded bg-surface-container-lowest">
                      <div className="text-[10px] text-outline">Closed</div>
                      <div className="text-[12px] text-on-surface font-medium">{project.closedIssues}</div>
                    </div>
                    <div className="p-1 rounded bg-surface-container-lowest">
                      <div className="text-[10px] text-outline">In Prog</div>
                      <div className="text-[12px] text-primary font-medium">{project.inProgressIssues}</div>
                    </div>
                    <div className="p-1 rounded bg-surface-container-lowest">
                      <div className="text-[10px] text-outline">Backlog</div>
                      <div className="text-[12px] text-outline font-medium">{project.backlogIssues}</div>
                    </div>
                  </div>
                </div>

                {/* Footer Lead strip */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-outline-variant/30 text-body-sm">
                  <div className="flex items-center gap-2">
                    <img
                      src={project.leadAvatar}
                      alt={project.leadName}
                      className="w-5 h-5 rounded-full object-cover ring-1 ring-outline-variant"
                    />
                    <span className="text-outline text-[12px]">{project.leadName}</span>
                  </div>
                  <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-[16px]">
                    arrow_forward
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="w-full overflow-x-auto rounded-lg border border-outline-variant/30 bg-surface-container-low shadow-sm mb-6">
            <table className="w-full text-left font-body-sm">
              <thead className="bg-surface-container-high/60 text-outline text-[11px] font-label-badge uppercase tracking-wider border-b border-outline-variant/30">
                <tr>
                  <th className="px-4 py-2.5">Project</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Health</th>
                  <th className="px-4 py-2.5">Progress</th>
                  <th className="px-4 py-2.5">Issues</th>
                  <th className="px-4 py-2.5">Target Date</th>
                  <th className="px-4 py-2.5">Lead</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filteredProjects.map((project) => (
                  <tr
                    key={project.id}
                    className="hover:bg-surface-container transition-colors group cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/projects/${project.id.replace("prj-", "")}?tab=overview`}
                        className="flex items-center gap-2"
                      >
                        <span className="font-headline-sm text-body-sm text-on-surface group-hover:text-primary transition-colors">
                          {project.name}
                        </span>
                        {project.badge && (
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-label-badge ${project.badgeColor}`}>
                            {project.badge}
                          </span>
                        )}
                      </Link>
                      <div className="text-[11px] text-outline">{project.tagline}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-on-surface-variant">{project.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${project.healthColor}`}></span>
                        <span className="text-on-surface">{project.health}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-container rounded-full"
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        <span className="font-label-code text-[11px] text-on-surface">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-label-code text-[11px]">
                      {project.closedIssues} / {project.totalIssues}
                    </td>
                    <td className="px-4 py-3 font-label-code text-[11px] text-outline">
                      {project.targetDate}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <img
                          src={project.leadAvatar}
                          alt={project.leadName}
                          className="w-4 h-4 rounded-full object-cover"
                        />
                        <span className="text-[12px] text-on-surface-variant">{project.leadName}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Milestone Tracker Bottom Section */}
        <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">flag</span>
              <h4 className="font-headline-sm text-body-md text-on-surface font-semibold">Active Milestone Delivery</h4>
            </div>
            <Link
              href="/milestones"
              className="text-body-sm text-primary hover:underline flex items-center gap-1"
            >
              <span>View all milestones</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded bg-surface-container-lowest border border-outline-variant/20 flex flex-col gap-1">
              <span className="text-on-surface font-medium text-body-sm">Nexus 2.0 Beta Release Candidate</span>
              <span className="text-outline text-[11px]">Sprint 14 • Oct 29</span>
              <div className="w-full h-1 bg-surface-container-highest rounded-full mt-2">
                <div className="h-full bg-primary-container rounded-full w-[85%]"></div>
              </div>
            </div>
            <div className="p-3 rounded bg-surface-container-lowest border border-outline-variant/20 flex flex-col gap-1">
              <span className="text-on-surface font-medium text-body-sm">Okta & Google SSO Certification</span>
              <span className="text-outline text-[11px]">Enterprise SSO • Oct 31</span>
              <div className="w-full h-1 bg-surface-container-highest rounded-full mt-2">
                <div className="h-full bg-emerald-400 rounded-full w-[90%]"></div>
              </div>
            </div>
            <div className="p-3 rounded bg-surface-container-lowest border border-outline-variant/20 flex flex-col gap-1">
              <span className="text-on-surface font-medium text-body-sm">Telemetry Sharding & STOMP Jitter</span>
              <span className="text-outline text-[11px]">Core Engine v3 • Nov 12</span>
              <div className="w-full h-1 bg-surface-container-highest rounded-full mt-2">
                <div className="h-full bg-amber-400 rounded-full w-[45%]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
