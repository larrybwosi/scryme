"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useWorkspaceContext } from "@/lib/hooks/use-projects";

interface NavSubItem {
  name: string;
  href: string;
  icon: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: string;
  children?: NavSubItem[];
  matchPrefixes?: string[];
}

interface NavGroup {
  id: string;
  title: string;
  quickAction?: {
    href: string;
    title: string;
  };
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    id: "views",
    title: "Views",
    quickAction: {
      href: "/new?type=TASK",
      title: "New Task",
    },
    items: [
      {
        name: "Tasks",
        href: "/tasks",
        icon: "check_circle",
        matchPrefixes: ["/tasks", "/board", "/gantt"],
        children: [
          { name: "List", href: "/tasks", icon: "format_list_bulleted" },
          { name: "Board", href: "/board", icon: "view_kanban" },
          { name: "Timeline", href: "/gantt", icon: "reorder" },
        ],
      },
      {
        name: "Calendar",
        href: "/calendar",
        icon: "calendar_today",
        matchPrefixes: ["/calendar"],
      },
      {
        name: "Schedule",
        href: "/schedule",
        icon: "date_range",
        matchPrefixes: ["/schedule"],
      },
    ],
  },
  {
    id: "operations",
    title: "Operations",
    quickAction: {
      href: "/new?type=PROJECT",
      title: "New Project",
    },
    items: [
      {
        name: "Projects",
        href: "/projects",
        icon: "folder",
        matchPrefixes: ["/projects"],
      },
      {
        name: "Milestones",
        href: "/milestones",
        icon: "flag",
        matchPrefixes: ["/milestones"],
      },
      {
        name: "Time Tracking",
        href: "/time-tracking",
        icon: "timer",
        matchPrefixes: ["/time-tracking"],
      },
      {
        name: "Performance",
        href: "/performance",
        icon: "trending_up",
        matchPrefixes: ["/performance"],
      },
      {
        name: "Team",
        href: "/team",
        icon: "group",
        matchPrefixes: ["/team"],
      },
      {
        name: "Notes & Docs",
        href: "/notes-and-docs",
        icon: "description",
        matchPrefixes: ["/notes-and-docs"],
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { data: workspace } = useWorkspaceContext();

  const orgName = workspace?.orgName || session?.session?.activeOrganizationName || "Scryme";
  const orgSlug = workspace?.orgSlug || session?.session?.activeOrganizationSlug || "workspace";

  // Section collapse state (persisted to localStorage, default open)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  // Tasks sub-tree collapse state (default open)
  const [tasksExpanded, setTasksExpanded] = useState<boolean>(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("scryme_projects_sidebar_sections");
      if (stored) {
        setCollapsedSections(JSON.parse(stored));
      }
      const storedTasks = localStorage.getItem("scryme_projects_tasks_expanded");
      if (storedTasks !== null) {
        setTasksExpanded(storedTasks === "true");
      }
    } catch {
      // LocalStorage unavailable or parsing failed
    }
  }, []);

  const toggleSection = (groupId: string) => {
    setCollapsedSections((prev) => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      try {
        localStorage.setItem("scryme_projects_sidebar_sections", JSON.stringify(next));
      } catch {
        // Fallback
      }
      return next;
    });
  };

  const toggleTasks = () => {
    setTasksExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("scryme_projects_tasks_expanded", String(next));
      } catch {
        // Fallback
      }
      return next;
    });
  };

  const isRouteActive = (item: NavItem) => {
    if (item.matchPrefixes) {
      return item.matchPrefixes.some((prefix) =>
        prefix === "/" ? pathname === "/" : pathname === prefix || pathname.startsWith(`${prefix}/`)
      );
    }
    return pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
  };

  const isExactChildActive = (href: string) => {
    if (href === "/tasks") {
      return pathname === "/tasks" || pathname.startsWith("/tasks/");
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-surface-container-lowest border-r border-outline-variant/30 z-50 flex flex-col justify-between select-none">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Workspace Brand Switcher */}
        <div className="h-12 px-space-md border-b border-outline-variant/30 flex items-center justify-between shrink-0">
          <Link
            href="/projects"
            className="flex items-center gap-space-sm rounded-lg px-space-xs py-1 hover:bg-surface-container transition-colors text-left min-w-0"
          >
            <div className="w-5 h-5 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container font-headline-sm text-body-sm font-semibold shrink-0">
              {orgName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col leading-none min-w-0">
              <span className="font-headline-sm text-body-sm text-on-surface font-medium truncate max-w-[120px]">
                {orgName}
              </span>
              <span className="font-body-sm text-[10px] text-outline leading-none truncate max-w-[120px]">
                {orgSlug}
              </span>
            </div>
            <span className="material-symbols-outlined text-outline text-[16px] shrink-0">unfold_more</span>
          </Link>
          <button
            className="w-6 h-6 rounded-lg flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-colors shrink-0"
            type="button"
            title="Edit workspace"
          >
            <span className="material-symbols-outlined text-[16px]">edit_square</span>
          </button>
        </div>

        {/* Global Search Input Trigger */}
        <div className="p-space-xs shrink-0">
          <button
            className="w-full flex items-center justify-between px-space-sm py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:border-outline transition-colors cursor-pointer"
            type="button"
          >
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-[16px] text-outline">search</span>
              <span className="font-body-sm text-body-sm text-outline">Search...</span>
            </div>
            <div className="flex items-center gap-0.5 bg-surface-container px-1 py-0.5 rounded border border-outline-variant/40">
              <span className="font-label-kbd text-label-kbd text-outline">⌘K</span>
            </div>
          </button>
        </div>

        {/* Grouped Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-space-xs py-space-xs space-y-3">
          {navGroups.map((group) => {
            const isCollapsed = collapsedSections[group.id] ?? false;

            return (
              <div key={group.id} className="space-y-1">
                {/* Group Header */}
                <div className="flex items-center justify-between px-space-sm py-1 group/header">
                  <button
                    type="button"
                    onClick={() => toggleSection(group.id)}
                    className="flex items-center gap-1 text-[11px] font-label-badge text-outline hover:text-on-surface uppercase tracking-wider transition-colors cursor-pointer text-left"
                    title={isCollapsed ? `Expand ${group.title}` : `Collapse ${group.title}`}
                  >
                    <span
                      className={`material-symbols-outlined text-[14px] transition-transform duration-200 ${
                        isCollapsed ? "-rotate-90 text-outline/70" : "rotate-0 text-outline"
                      }`}
                    >
                      expand_more
                    </span>
                    <span>{group.title}</span>
                  </button>

                  {/* Quick Action Button */}
                  {group.quickAction && (
                    <Link
                      href={group.quickAction.href}
                      className="w-4 h-4 rounded flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors opacity-70 group-hover/header:opacity-100"
                      title={group.quickAction.title}
                    >
                      <span className="material-symbols-outlined text-[14px]">add</span>
                    </Link>
                  )}
                </div>

                {/* Group Items */}
                {!isCollapsed && (
                  <nav className="flex flex-col gap-0.5">
                    {group.items.map((item) => {
                      const isActive = isRouteActive(item);
                      const hasChildren = Boolean(item.children && item.children.length > 0);

                      if (hasChildren && item.children) {
                        return (
                          <div key={item.name} className="flex flex-col">
                            {/* Parent Item with Expand/Collapse & Direct Navigation */}
                            <div
                              className={`group/item flex items-center justify-between rounded-lg transition-all font-body-md text-body-md ${
                                isActive
                                  ? "bg-surface-container-high text-on-surface font-medium border-l-2 border-primary-container"
                                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                              }`}
                            >
                              <Link
                                href={item.href}
                                className="flex-1 flex items-center gap-space-sm px-space-sm py-1.5 min-w-0"
                              >
                                <span
                                  className={`material-symbols-outlined text-[18px] shrink-0 transition-colors ${
                                    isActive ? "text-primary font-normal" : "text-outline group-hover/item:text-on-surface"
                                  }`}
                                >
                                  {item.icon}
                                </span>
                                <span className="truncate">{item.name}</span>
                              </Link>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleTasks();
                                }}
                                className="px-2 py-1.5 text-outline hover:text-on-surface transition-colors cursor-pointer shrink-0"
                                title={tasksExpanded ? "Collapse task views" : "Expand task views"}
                              >
                                <span
                                  className={`material-symbols-outlined text-[14px] transition-transform duration-200 block ${
                                    tasksExpanded ? "rotate-0" : "-rotate-90"
                                  }`}
                                >
                                  expand_more
                                </span>
                              </button>
                            </div>

                            {/* Sub items */}
                            {tasksExpanded && (
                              <div className="ml-3 pl-3 border-l border-outline-variant/30 flex flex-col gap-0.5 mt-0.5">
                                {item.children.map((sub) => {
                                  const isChildActive = isExactChildActive(sub.href);
                                  return (
                                    <Link
                                      key={sub.name}
                                      href={sub.href}
                                      className={`flex items-center gap-2 px-space-sm py-1 rounded-md transition-all text-xs font-body-sm ${
                                        isChildActive
                                          ? "bg-surface-container text-primary font-medium border-l-2 border-primary"
                                          : "text-outline hover:text-on-surface hover:bg-surface-container/60"
                                      }`}
                                    >
                                      <span
                                        className={`material-symbols-outlined text-[15px] shrink-0 ${
                                          isChildActive ? "text-primary" : "text-outline"
                                        }`}
                                      >
                                        {sub.icon}
                                      </span>
                                      <span className="truncate">{sub.name}</span>
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`group/item flex items-center gap-space-sm px-space-sm py-1.5 rounded-lg transition-all font-body-md text-body-md ${
                            isActive
                              ? "bg-surface-container-high text-on-surface font-medium border-l-2 border-primary-container"
                              : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                          }`}
                        >
                          <span
                            className={`material-symbols-outlined text-[18px] shrink-0 transition-colors ${
                              isActive ? "text-primary font-normal" : "text-outline group-hover/item:text-on-surface"
                            }`}
                          >
                            {item.icon}
                          </span>
                          <span className="truncate">{item.name}</span>
                        </Link>
                      );
                    })}
                  </nav>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Settings */}
      <div className="p-space-xs border-t border-outline-variant/30 shrink-0">
        <Link
          href="/team"
          className="flex items-center justify-between px-space-sm py-1.5 rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-space-sm">
            <div className="w-5 h-5 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center">
              <span className="material-symbols-outlined text-outline text-[13px]">tune</span>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant">Settings</span>
          </div>
          <span className="font-label-kbd text-label-kbd text-outline">⌘,</span>
        </Link>
      </div>
    </aside>
  );
}
