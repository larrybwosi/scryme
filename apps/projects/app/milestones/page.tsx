"use client";

import React, { useState } from "react";
import { useProjects } from "@/lib/hooks/use-projects";
import { MilestonesTab } from "@/components/project-tabs/MilestonesTab";

export default function StandaloneMilestonesPage() {
  const { data: projects = [], isLoading } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  const currentProjectId = selectedProjectId || (projects[0]?.id || "");

  if (isLoading) {
    return (
      <div className="flex flex-col w-full pb-16 p-8 text-outline text-body-sm">
        Loading milestones...
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col w-full pb-16 p-12 text-center text-outline text-body-sm">
        No projects found. Please create a project first to manage milestones.
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="mb-4">
        <label className="block text-[11px] text-outline font-label-badge uppercase mb-1">Select Project</label>
        <select
          value={currentProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="h-8 px-2 rounded-lg bg-surface-container border border-outline-variant text-on-surface text-body-sm max-w-xs"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      <MilestonesTab projectId={currentProjectId} />
    </div>
  );
}
