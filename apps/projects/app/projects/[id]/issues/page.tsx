"use client";

import React, { use } from "react";
import { ProjectWorkspaceShell } from "@/components/project-workspace/ProjectWorkspaceShell";
import { IssuesTab } from "@/components/project-tabs/IssuesTab";

export default function ProjectIssuesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ProjectWorkspaceShell projectId={id} activeTab="issues">
      <IssuesTab projectId={id} />
    </ProjectWorkspaceShell>
  );
}
