"use client";

import React, { use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { OverviewTab } from "@/components/project-tabs/OverviewTab";
import { IssuesTab } from "@/components/project-tabs/IssuesTab";
import { CyclesTab } from "@/components/project-tabs/CyclesTab";
import { MilestonesTab } from "@/components/project-tabs/MilestonesTab";
import { DocsTab } from "@/components/project-tabs/DocsTab";
import { TeamTab } from "@/components/project-tabs/TeamTab";
import { AnalyticsTab } from "@/components/project-tabs/AnalyticsTab";

const tabs = [
  { id: "overview", label: "Overview", icon: "dashboard" },
  { id: "issues", label: "Issues", icon: "check_box", count: "58" },
  { id: "cycles", label: "Cycles & Sprints", icon: "cycle" },
  { id: "milestones", label: "Milestones", icon: "flag", count: "4" },
  { id: "docs", label: "Documents & RFCs", icon: "description", count: "6" },
  { id: "team", label: "Team & Access", icon: "shield_person" },
  { id: "analytics", label: "Analytics & Telemetry", icon: "monitoring" },
];

export default function ProjectWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeTab = searchParams.get("tab") || "overview";

  const handleTabChange = (tabId: string) => {
    router.replace(`/projects/${projectId}?tab=${tabId}`, { scroll: false });
  };

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
                {tab.count && (
                  <span className="px-1.5 py-0.2 bg-surface-container text-outline rounded font-label-code text-[10px]">
                    {tab.count}
                  </span>
                )}
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary ml-1"></span>}
              </button>
            );
          })}
        </nav>

        <div className="hidden xl:flex items-center gap-2 px-3 text-outline font-label-code text-[11px]">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          <span>Live Workspace: PRJ-{projectId.toUpperCase()}</span>
        </div>
      </div>

      {/* Dynamic Tab Body View */}
      {activeTab === "overview" && <OverviewTab />}
      {activeTab === "issues" && <IssuesTab />}
      {activeTab === "cycles" && <CyclesTab />}
      {activeTab === "milestones" && <MilestonesTab />}
      {activeTab === "docs" && <DocsTab />}
      {activeTab === "team" && <TeamTab />}
      {activeTab === "analytics" && <AnalyticsTab />}
    </div>
  );
}
