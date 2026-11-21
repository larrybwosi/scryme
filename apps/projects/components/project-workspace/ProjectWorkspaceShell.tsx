"use client";

import Link from "next/link";
import React from "react";
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

interface TabConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
}

export function getProjectTabs(projectId: string): TabConfig[] {
  return [
    { id: "overview", label: "Overview", icon: LayoutDashboard, href: `/projects/${projectId}/overview` },
    { id: "issues", label: "Issues", icon: CheckSquare, href: `/projects/${projectId}/issues` },
    { id: "cycles", label: "Cycles & Sprints", icon: RotateCw, href: `/projects/${projectId}/cycles` },
    { id: "milestones", label: "Milestones", icon: Flag, href: `/projects/${projectId}/milestones` },
    { id: "docs", label: "Documents & RFCs", icon: FileText, href: `/projects/${projectId}/docs` },
    { id: "team", label: "Team & Access", icon: ShieldCheck, href: `/projects/${projectId}/team` },
    { id: "analytics", label: "Analytics & Telemetry", icon: BarChart2, href: `/projects/${projectId}/analytics` },
  ];
}

export function ProjectWorkspaceShell({
  projectId,
  activeTab,
  children,
}: {
  projectId: string;
  activeTab: string;
  children: React.ReactNode;
}) {
  const { data: project, isLoading } = useProject(projectId);
  const tabs = getProjectTabs(projectId);

  if (isLoading) {
    return (
      <div className="flex flex-col w-full p-8 text-outline text-body-sm">
        Loading project workspace...
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="sticky top-12 z-30 mb-space-lg flex items-center justify-between bg-surface-container-lowest/95 backdrop-blur-md px-space-sm pt-space-xs pb-1 rounded-lg border border-outline-variant/30 overflow-x-auto shadow-sm">
        <nav className="flex items-center gap-space-xs font-body-sm text-body-sm">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const TabIcon = tab.icon;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`px-space-md py-2 rounded-t-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? "text-on-surface bg-surface-container-high font-medium relative shadow-sm border-b-2 border-primary-container"
                    : "text-outline hover:text-on-surface hover:bg-surface-container"
                }`}
              >
                <TabIcon
                  className={`h-4 w-4 shrink-0 transition-colors ${isActive ? "text-primary" : ""}`}
                />
                <span>{tab.label}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary ml-1"></span>}
              </Link>
            );
          })}
        </nav>

        <div className="hidden xl:flex items-center gap-2 px-3 text-outline font-label-code text-[11px]">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          <span>{project?.key || "WORKSPACE"}: {project?.name}</span>
        </div>
      </div>
      {children}
    </div>
  );
}
