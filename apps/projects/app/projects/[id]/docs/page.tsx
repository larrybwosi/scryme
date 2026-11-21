"use client";

import React, { use } from "react";
import { ProjectWorkspaceShell } from "@/components/project-workspace/ProjectWorkspaceShell";
import { DocsTab } from "@/components/project-tabs/DocsTab";

export default function ProjectDocsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ProjectWorkspaceShell projectId={id} activeTab="docs">
      <DocsTab projectId={id} />
    </ProjectWorkspaceShell>
  );
}
