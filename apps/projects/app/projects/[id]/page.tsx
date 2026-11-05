"use client";

import React, { use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useProject } from "@/lib/hooks/use-projects";
import { OverviewTab } from "@/components/project-tabs/OverviewTab";
import { IssuesTab } from "@/components/project-tabs/IssuesTab";
import { CyclesTab } from "@/components/project-tabs/CyclesTab";
import { MilestonesTab } from "@/components/project-tabs/MilestonesTab";
import { DocsTab } from "@/components/project-tabs/DocsTab";
import { TeamTab } from "@/components/project-tabs/TeamTab";
import { AnalyticsTab } from "@/components/project-tabs/AnalyticsTab";

const tabs = [
  { id: "overview", label: "Overview", icon: "dashboard" },
  { id: "issues", label: "Issues", icon: "check_box" },
  { id: "cycles", label: "Cycles & Sprints", icon: "cycle" },
  { id: "milestones", label: "Milestones", icon: "flag" },
  { id: "docs", label: "Documents & RFCs", icon: "description" },
  { id: "team", label: "Team & Access", icon: "shield_person" },
  { id: "analytics", label: "Analytics & Telemetry", icon: "monitoring" },
];

function ProjectWorkspaceContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const { data: project, isLoading } = useProject(projectId);
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeTab = searchParams.get("tab") || "overview";

  const handleTabChange = (tabId: string) => {
    router.replace(`/projects/${projectId}?tab=${tabId}`, { scroll: false });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col w-full p-8 text-outline text-body-sm">
        Loading project workspace...
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Top Floating Project Sub-Tabs Nav Rail */}
      <div className="sticky top-12 z-30 mb-space-lg flex items-center justify-between bg-surface-container-lowest/95 backdrop-blur-md px-space-sm pt-space-xs pb-1 rounded-lg border border-outline-variant/30 overflow-x-auto shadow-sm">
        <nav className="flex items-center gap-space-xs font-body-sm text-body-sm">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`px-space-md py-2 rounded-t-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? "text-on-surface bg-surface-container-high font-medium relative shadow-sm border-b-2 border-primary-container"
                    : "text-outline hover:text-on-surface hover:bg-surface-container"
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[15px] ${
                    isActive ? "text-primary" : ""
                  }`}
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary ml-1"></span>}
              </button>
            );
          })}
        </nav>

        <div className="hidden xl:flex items-center gap-2 px-3 text-outline font-label-code text-[11px]">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          <span>{project?.key || "WORKSPACE"}: {project?.name}</span>
        </div>
      </div>

      {/* Dynamic Tab Body View */}
      {activeTab === "overview" && <OverviewTab projectId={projectId} />}
      {activeTab === "issues" && <IssuesTab projectId={projectId} />}
      {activeTab === "cycles" && <CyclesTab projectId={projectId} />}
      {activeTab === "milestones" && <MilestonesTab projectId={projectId} />}
      {activeTab === "docs" && <DocsTab projectId={projectId} />}
      {activeTab === "team" && <TeamTab projectId={projectId} />}
      {activeTab === "analytics" && <AnalyticsTab projectId={projectId} />}
    </div>
  );
}


export default function ProjectWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <React.Suspense fallback={<div className="p-8 text-outline text-body-sm">Loading workspace...</div>}>
      <ProjectWorkspaceContent params={params} />
    </React.Suspense>
  );
}
