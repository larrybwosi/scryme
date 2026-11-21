"use client";

import React, { use } from "react";
import { ProjectWorkspaceShell } from "@/components/project-workspace/ProjectWorkspaceShell";
import { MilestonesTab } from "@/components/project-tabs/MilestonesTab";

export default function ProjectMilestonesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ProjectWorkspaceShell projectId={id} activeTab="milestones">
      <MilestonesTab projectId={id} />
    </ProjectWorkspaceShell>
  );
}
