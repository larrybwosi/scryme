"use client";

import Link from "next/link";
import React, { useState } from "react";
import { useProject, useTasks, useMilestones, useSprints, useProjectDocuments } from "@/lib/hooks/use-projects";

export function OverviewTab({ projectId }: { projectId: string }) {
  const { data: project } = useProject(projectId);
  const { data: tasks = [] } = useTasks(projectId);
  const { data: milestones = [] } = useMilestones(projectId);
  const { data: sprints = [] } = useSprints(projectId);
  const { data: docs = [] } = useProjectDocuments(projectId);

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const closedTasks = tasks.filter((t) => t.status === "DONE").length;
  const progressPct = tasks.length > 0 ? Math.round((closedTasks / tasks.length) * 100) : 0;
  const activeSprint = sprints.find((s) => s.status === "ACTIVE") || sprints[0];

  return (
    <div className="flex flex-col w-full">
      {/* Top Command & Action Bar */}
      <div className="w-full flex flex-col gap-space-md pt-2 pb-space-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-body-sm text-outline">
            <Link href="/projects" className="hover:text-on-surface">Projects</Link>
            <span>/</span>
            <span className="font-label-code text-label-code uppercase tracking-wider text-outline">
              {project?.key || "PRJ"}
            </span>
            <span>/</span>
            <span className="font-headline-sm text-on-surface font-medium">
              {project?.name || "Overview"}
            </span>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="h-8 px-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-body-sm flex items-center gap-1.5 transition-colors border border-outline-variant/30"
            >
              <span className="material-symbols-outlined text-[15px]">
                {copied ? "check" : "link"}
              </span>
              <span>{copied ? "Copied" : "Copy URL"}</span>
            </button>

            <Link
              href="/tasks"
              className="h-8 px-3 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container text-body-sm font-headline-sm flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">add_circle</span>
              <span>New Issue</span>
            </Link>
          </div>
        </div>

        {/* Project Title & Primary Badges */}
        <div className="flex flex-wrap items-baseline justify-between gap-4 pt-1">
          <div className="flex items-center gap-3">
            <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight">
              {project?.name}
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-label-badge bg-primary-container/20 text-primary uppercase">
              {project?.status}
            </span>
          </div>

          <div className="flex items-center gap-2 font-label-code text-[12px] text-outline">
            <span>Tasks: {tasks.length}</span>
            <span>•</span>
            <span>Milestones: {milestones.length}</span>
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
        <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
          <span className="text-outline text-body-sm">Progress</span>
          <span className="text-headline-lg font-headline-lg text-on-surface font-semibold">
            {progressPct}%
          </span>
          <span className="text-[11px] text-emerald-400 font-label-code">
            {closedTasks} / {tasks.length} issues closed
          </span>
        </div>
        <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
          <span className="text-outline text-body-sm">Active Sprints</span>
          <span className="text-headline-lg font-headline-lg text-on-surface font-semibold">
            {activeSprint ? activeSprint.name : "No active sprint"}
          </span>
          <span className="text-[11px] text-primary font-label-code">
            {sprints.length} total cycles
          </span>
        </div>
        <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
          <span className="text-outline text-body-sm">Documentation</span>
          <span className="text-headline-lg font-headline-lg text-on-surface font-semibold">
            {docs.length} Specs
          </span>
          <span className="text-[11px] text-outline font-label-code">RFCs & Architecture</span>
        </div>
        <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
          <span className="text-outline text-body-sm">Milestones</span>
          <span className="text-headline-lg font-headline-lg text-on-surface font-semibold">
            {milestones.filter((m) => m.status === "COMPLETED").length} / {milestones.length}
          </span>
          <span className="text-[11px] text-emerald-400 font-label-code">Delivered Targets</span>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8 flex flex-col gap-6">
          <div className="p-5 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-4">
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Project Objective & Scope
            </h2>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              {project?.description || "No extended description provided for this project workspace."}
            </p>
          </div>
        </div>

        <div className="xl:col-span-4 flex flex-col gap-4">
          <div className="p-5 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-4">
            <h2 className="font-headline-sm text-body-md text-on-surface font-semibold">Recent Milestones</h2>
            <div className="flex flex-col gap-2">
              {milestones.slice(0, 4).map((m) => (
                <div key={m.id} className="p-2.5 rounded bg-surface-container border border-outline-variant/20 flex flex-col gap-1">
                  <span className="text-body-sm font-medium text-on-surface">{m.title}</span>
                  <span className="text-[11px] text-primary font-label-code">{m.status}</span>
                </div>
              ))}
              {milestones.length === 0 && (
                <span className="text-outline text-body-sm italic">No milestones configured</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
