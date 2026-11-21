"use client";

import React, { use } from "react";
import { ProjectWorkspaceShell } from "@/components/project-workspace/ProjectWorkspaceShell";
import { AnalyticsTab } from "@/components/project-tabs/AnalyticsTab";

export default function ProjectAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ProjectWorkspaceShell projectId={id} activeTab="analytics">
      <AnalyticsTab projectId={id} />
    </ProjectWorkspaceShell>
  );
}
