"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select";
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
        <Select value={currentProjectId} onValueChange={(val) => setSelectedProjectId(val)}>
          <SelectTrigger className="h-8 bg-surface-container border-outline-variant text-on-surface text-body-sm max-w-xs">
            <SelectValue placeholder="Select Project" />
          </SelectTrigger>
          <SelectContent className="bg-surface-container border-outline-variant text-on-surface">
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <MilestonesTab projectId={currentProjectId} />
    </div>
  );
}
