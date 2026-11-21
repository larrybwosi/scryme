"use client";

import React, { use } from "react";
import { ProjectWorkspaceShell } from "@/components/project-workspace/ProjectWorkspaceShell";
import { TeamTab } from "@/components/project-tabs/TeamTab";

export default function ProjectTeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ProjectWorkspaceShell projectId={id} activeTab="team">
      <TeamTab projectId={id} />
    </ProjectWorkspaceShell>
  );
}
