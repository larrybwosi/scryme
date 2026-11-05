"use client";

import React, { use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  CheckSquare,
  RotateCw,
  Flag,
  FileText,
  ShieldCheck,
  BarChart2,
} from "lucide-react";
import { useProject } from "@/lib/hooks/use-projects";
import { OverviewTab } from "@/components/project-tabs/OverviewTab";
import { IssuesTab } from "@/components/project-tabs/IssuesTab";
import { CyclesTab } from "@/components/project-tabs/CyclesTab";
import { MilestonesTab } from "@/components/project-tabs/MilestonesTab";
import { DocsTab } from "@/components/project-tabs/DocsTab";
import { TeamTab } from "@/components/project-tabs/TeamTab";
import { AnalyticsTab } from "@/components/project-tabs/AnalyticsTab";

interface TabConfig {
  id: string;
  label: string;
  icon: LucideIcon;
}

const tabs: TabConfig[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "issues", label: "Issues", icon: CheckSquare },
  { id: "cycles", label: "Cycles & Sprints", icon: RotateCw },
  { id: "milestones", label: "Milestones", icon: Flag },
  { id: "docs", label: "Documents & RFCs", icon: FileText },
  { id: "team", label: "Team & Access", icon: ShieldCheck },
  { id: "analytics", label: "Analytics & Telemetry", icon: BarChart2 },
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
            const TabIcon = tab.icon;
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
                <TabIcon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive ? "text-primary" : ""
                  }`}
                />
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
