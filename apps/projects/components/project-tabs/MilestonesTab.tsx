"use client";

import React, { useState } from "react";

interface MilestoneItem {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  status: "Completed" | "In Progress" | "Planned";
  progress: number;
  sprint: string;
  closedIssues: number;
  totalIssues: number;
}

const INITIAL_MILESTONES: MilestoneItem[] = [
  {
    id: "ms-1",
    title: "Milestone 1: Multi-theme Token Ingestion",
    description: "Tailwind CSS v4 token registry and high-contrast dark tokens pipeline.",
    targetDate: "Oct 14, 2024",
    status: "Completed",
    progress: 100,
    sprint: "Sprint 13",
    closedIssues: 16,
    totalIssues: 16,
  },
  {
    id: "ms-2",
    title: "Milestone 2: Nexus 2.0 Beta Release Candidate",
    description: "Core UI views, WebGL frame canvas, and board interactions verified.",
    targetDate: "Oct 29, 2024",
    status: "In Progress",
    progress: 85,
    sprint: "Sprint 14",
    closedIssues: 22,
    totalIssues: 26,
  },
  {
    id: "ms-3",
    title: "Milestone 3: Okta & Google SSO Certification",
    description: "SAML 2.0 automated metadata exchange and SCIM directory synchronization.",
    targetDate: "Oct 31, 2024",
    status: "Planned",
    progress: 20,
    sprint: "Sprint 15",
    closedIssues: 2,
    totalIssues: 10,
  },
  {
    id: "ms-4",
    title: "Milestone 4: Enterprise Audit Logging & SIEM Export",
    description: "Immutable append-only audit trail exportable to Splunk and Datadog.",
    targetDate: "Nov 15, 2024",
    status: "Planned",
    progress: 0,
    sprint: "Sprint 16",
    closedIssues: 0,
    totalIssues: 8,
  },
];

export function MilestonesTab() {
  const [milestones, setMilestones] = useState<MilestoneItem[]>(INITIAL_MILESTONES);
  const [filter, setFilter] = useState<"all" | "In Progress" | "Completed" | "Planned">("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDate, setNewDate] = useState("Nov 30, 2024");

  const filtered = milestones.filter((m) => filter === "all" || m.status === filter);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newMs: MilestoneItem = {
      id: `ms-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim() || "Milestone deliverable objective",
      targetDate: newDate,
      status: "Planned",
      progress: 0,
      sprint: "Sprint 15",
      closedIssues: 0,
      totalIssues: 5,
    };

    setMilestones([...milestones, newMs]);
    setNewTitle("");
    setNewDesc("");
    setIsCreateOpen(false);
  };

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Top Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
            Release Milestones
          </h2>
          <p className="text-body-sm text-outline">
            PRJ-204 Cadence • 4 Key Verification Checkpoints
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-surface-container-lowest p-1 rounded-lg border border-outline-variant/30 text-body-sm">
            {(["all", "In Progress", "Completed", "Planned"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(s)}
                className={`px-2.5 py-0.5 rounded text-[11px] font-label-code capitalize ${
                  filter === s
                    ? "bg-surface-container-high text-on-surface font-medium"
                    : "text-outline hover:text-on-surface"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>New Milestone</span>
          </button>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-lg bg-surface-container-low border border-outline-variant/50 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">New Milestone</h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="w-6 h-6 rounded flex items-center justify-center text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <form onSubmit={handleCreate} className="flex flex-col gap-4 mt-4">
              <div>
                <label className="block text-body-sm font-medium text-on-surface mb-1">Milestone Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Milestone 5: WebGL Shading Pipeline"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full h-8 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
                />
              </div>
              <div>
                <label className="block text-body-sm font-medium text-on-surface mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Summary of deliverables"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full h-8 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm focus:outline-none focus:border-primary-container"
                />
              </div>
              <div>
                <label className="block text-body-sm font-medium text-on-surface mb-1">Target Date</label>
                <input
                  type="text"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full h-8 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-body-sm text-outline hover:text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline-sm text-body-sm"
                >
                  Add Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Milestones Card Deck */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((ms) => (
          <div
            key={ms.id}
            className="p-5 rounded-lg bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between gap-4 shadow-sm hover:border-outline-variant transition-colors"
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-headline-sm text-body-md text-on-surface font-semibold">{ms.title}</h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-label-badge uppercase ${
                    ms.status === "Completed"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : ms.status === "In Progress"
                      ? "bg-primary-container/20 text-primary"
                      : "bg-surface-container text-outline"
                  }`}
                >
                  {ms.status}
                </span>
              </div>
              <p className="text-body-sm text-on-surface-variant">{ms.description}</p>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-outline-variant/20">
              <div className="flex items-center justify-between text-[11px] font-label-code">
                <span className="text-outline">Completion</span>
                <span className="text-on-surface font-medium">{ms.progress}% ({ms.closedIssues}/{ms.totalIssues} issues)</span>
              </div>
              <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${ms.status === "Completed" ? "bg-emerald-400" : "bg-primary-container"}`}
                  style={{ width: `${ms.progress}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-outline pt-1">
                <span>{ms.sprint}</span>
                <span>Due: {ms.targetDate}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
