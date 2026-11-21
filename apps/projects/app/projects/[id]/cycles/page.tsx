"use client";

import React, { use } from "react";
import { ProjectWorkspaceShell } from "@/components/project-workspace/ProjectWorkspaceShell";
import { CyclesTab } from "@/components/project-tabs/CyclesTab";

export default function ProjectCyclesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ProjectWorkspaceShell projectId={id} activeTab="cycles">
      <CyclesTab projectId={id} />
    </ProjectWorkspaceShell>
  );
}
