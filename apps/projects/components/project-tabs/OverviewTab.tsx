"use client";

import Link from "next/link";
import React, { useState } from "react";

export function OverviewTab() {
  const [viewVariant, setViewVariant] = useState<"dashboard" | "execution">("dashboard");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col w-full">
      {/* Top Command & Action Bar */}
      <div className="w-full flex flex-col gap-space-md pt-2 pb-space-lg">
        {/* Breadcrumb + Live Sync indicator */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-body-sm text-outline">
            <Link href="/projects" className="hover:text-on-surface">Projects</Link>
            <span>/</span>
            <span className="font-label-code text-label-code uppercase tracking-wider text-outline">PRJ-204</span>
            <span>/</span>
            <span className="font-headline-sm text-on-surface font-medium">Nexus 2.0 Redesign</span>
          </nav>

          <div className="flex items-center gap-2">
            {/* View Variant Toggle: code-16 (Executive Dashboard) vs code-12 (Detailed Execution) */}
            <div className="flex items-center bg-surface-container-lowest p-0.5 rounded-lg border border-outline-variant/30 shadow-sm">
              <button
                type="button"
                onClick={() => setViewVariant("dashboard")}
                className={`px-2.5 py-1 text-label-badge font-label-badge rounded-md transition-all ${
                  viewVariant === "dashboard"
                    ? "bg-surface-container-high text-on-surface font-medium shadow-sm"
                    : "text-outline hover:text-on-surface"
                }`}
              >
                Executive Dashboard
              </button>
              <button
                type="button"
                onClick={() => setViewVariant("execution")}
                className={`px-2.5 py-1 text-label-badge font-label-badge rounded-md transition-all ${
                  viewVariant === "execution"
                    ? "bg-surface-container-high text-on-surface font-medium shadow-sm"
                    : "text-outline hover:text-on-surface"
                }`}
              >
                Detailed Execution
              </button>
            </div>

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
              Nexus 2.0 Redesign {viewVariant === "execution" && "& Kinetic Real-Time Engine"}
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-label-badge bg-primary-container/20 text-primary uppercase">
              Live Pipeline
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-label-badge bg-surface-container-high text-outline">
              Sprint 14
            </span>
          </div>

          <div className="flex items-center gap-2 font-label-code text-[12px] text-outline">
            <span>Health: 94%</span>
            <span>•</span>
            <span>Target: Oct 29, 2024</span>
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
        <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
          <span className="text-outline text-body-sm">Progress</span>
          <span className="text-headline-lg font-headline-lg text-on-surface font-semibold">68%</span>
          <span className="text-[11px] text-emerald-400 font-label-code">42 / 58 issues closed</span>
        </div>
        <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
          <span className="text-outline text-body-sm">Sprint 14 Cadence</span>
          <span className="text-headline-lg font-headline-lg text-on-surface font-semibold">4 Days Left</span>
          <span className="text-[11px] text-primary font-label-code">84% cycle velocity</span>
        </div>
        <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
          <span className="text-outline text-body-sm">Engineering Effort</span>
          <span className="text-headline-lg font-headline-lg text-on-surface font-semibold">142h Logged</span>
          <span className="text-[11px] text-outline font-label-code">168h target capacity</span>
        </div>
        <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-1">
          <span className="text-outline text-body-sm">Active Squad</span>
          <span className="text-headline-lg font-headline-lg text-on-surface font-semibold">4 Engineers</span>
          <span className="text-[11px] text-emerald-400 font-label-code">All squads on track</span>
        </div>
      </div>

      {/* Variant Content */}
      {viewVariant === "dashboard" ? (
        /* Executive Dashboard (Code-16 Layout: Sprint + Milestones + RFC preview cards) */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-8 flex flex-col gap-6">
            {/* Active Sprint Section */}
            <div className="p-5 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">cycle</span>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    Sprint 14: Core UI & Analytics
                  </h2>
                </div>
                <Link href="/projects/204?tab=cycles" className="text-body-sm text-primary hover:underline">
                  View Cycle Roadmap →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded bg-surface-container-lowest border border-outline-variant/20">
                  <div className="text-[11px] text-outline">Sprint Progress</div>
                  <div className="text-headline-sm font-semibold text-on-surface mt-1">72%</div>
                  <div className="w-full h-1 bg-surface-container-highest rounded-full mt-2">
                    <div className="h-full bg-primary-container rounded-full w-[72%]"></div>
                  </div>
                </div>
                <div className="p-3 rounded bg-surface-container-lowest border border-outline-variant/20">
                  <div className="text-[11px] text-outline">Remaining Issues</div>
                  <div className="text-headline-sm font-semibold text-on-surface mt-1">16 Open</div>
                  <div className="text-[11px] text-outline mt-1 font-label-code">12 in progress</div>
                </div>
                <div className="p-3 rounded bg-surface-container-lowest border border-outline-variant/20">
                  <div className="text-[11px] text-outline">Burndown Health</div>
                  <div className="text-headline-sm font-semibold text-emerald-400 mt-1">Optimal</div>
                  <div className="text-[11px] text-emerald-400 mt-1 font-label-code">+3d buffer</div>
                </div>
              </div>
            </div>

            {/* Architecture RFC Preview */}
            <div className="p-5 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[18px]">article</span>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    Architecture RFC Preview: Realtime Synchronization Protocol
                  </h2>
                </div>
                <Link href="/projects/204?tab=docs" className="text-body-sm text-primary hover:underline">
                  Open RFC Doc →
                </Link>
              </div>
              <p className="text-body-sm text-on-surface-variant leading-relaxed">
                RFC-8819 introduces memory-mapped buffers for WebGL viewport rendering and event multiplexing across distributed Socket.IO cluster workers with failover routing.
              </p>
            </div>
          </div>

          {/* Right Rail: Release Milestones */}
          <div className="xl:col-span-4 flex flex-col gap-4">
            <div className="p-5 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">flag</span>
                  <h2 className="font-headline-sm text-body-md text-on-surface font-semibold">Release Milestones</h2>
                </div>
                <Link href="/projects/204?tab=milestones" className="text-[12px] text-primary hover:underline">
                  All (4)
                </Link>
              </div>

              <div className="flex flex-col gap-3">
                <div className="p-3 rounded bg-surface-container border border-outline-variant/20 flex flex-col gap-1">
                  <span className="text-body-sm font-medium text-on-surface">Milestone 1: Multi-theme Token Ingestion</span>
                  <span className="text-[11px] text-emerald-400 font-label-code">Completed • Oct 14</span>
                  <div className="w-full h-1 bg-surface-container-highest rounded-full mt-1">
                    <div className="h-full bg-emerald-400 rounded-full w-full"></div>
                  </div>
                </div>

                <div className="p-3 rounded bg-surface-container border border-outline-variant/20 flex flex-col gap-1">
                  <span className="text-body-sm font-medium text-on-surface">Milestone 2: Nexus 2.0 Beta Release Candidate</span>
                  <span className="text-[11px] text-primary font-label-code">In Progress • Oct 29</span>
                  <div className="w-full h-1 bg-surface-container-highest rounded-full mt-1">
                    <div className="h-full bg-primary-container rounded-full w-[85%]"></div>
                  </div>
                </div>

                <div className="p-3 rounded bg-surface-container border border-outline-variant/20 flex flex-col gap-1">
                  <span className="text-body-sm font-medium text-on-surface">Milestone 3: Okta & Google SSO Certification</span>
                  <span className="text-[11px] text-outline font-label-code">Planned • Oct 31</span>
                  <div className="w-full h-1 bg-surface-container-highest rounded-full mt-1">
                    <div className="h-full bg-surface-container-highest rounded-full w-[20%]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Detailed Execution (Code-12 Layout) */
        <div className="flex flex-col gap-6">
          <div className="p-6 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col gap-4">
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Execution Telemetry & Spec Progress
            </h3>
            <p className="text-body-md text-on-surface-variant">
              The project is currently pacing 8% ahead of target cadence with 42 of 58 issues closed or currently undergoing code review.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded bg-surface-container-lowest border border-outline-variant/20">
                <span className="text-[11px] text-outline uppercase font-label-badge">Commit Frequency</span>
                <div className="text-headline-sm font-bold text-on-surface mt-1">38 Commits / Week</div>
                <div className="text-[11px] text-emerald-400 mt-1 font-label-code">+14% velocity</div>
              </div>
              <div className="p-4 rounded bg-surface-container-lowest border border-outline-variant/20">
                <span className="text-[11px] text-outline uppercase font-label-badge">Test Coverage</span>
                <div className="text-headline-sm font-bold text-on-surface mt-1">92.4% Unit & E2E</div>
                <div className="text-[11px] text-primary mt-1 font-label-code">0 regression alerts</div>
              </div>
              <div className="p-4 rounded bg-surface-container-lowest border border-outline-variant/20">
                <span className="text-[11px] text-outline uppercase font-label-badge">Open PRs</span>
                <div className="text-headline-sm font-bold text-on-surface mt-1">4 Under Review</div>
                <div className="text-[11px] text-amber-400 mt-1 font-label-code">Avg review turnaround 2.4h</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
