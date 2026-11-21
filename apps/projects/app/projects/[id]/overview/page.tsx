"use client";

import React, { use } from "react";
import { ProjectWorkspaceShell } from "@/components/project-workspace/ProjectWorkspaceShell";
import { OverviewTab } from "@/components/project-tabs/OverviewTab";

export default function ProjectOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ProjectWorkspaceShell projectId={id} activeTab="overview">
      <OverviewTab projectId={id} />
    </ProjectWorkspaceShell>
  );
}
