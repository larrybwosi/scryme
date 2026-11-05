"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  CheckCircle2,
  List,
  Kanban,
  GitCommitHorizontal,
  Calendar,
  CalendarDays,
  Folder,
  Flag,
  Timer,
  TrendingUp,
  Users,
  FileText,
  Search,
  ChevronDown,
  Plus,
  ChevronsUpDown,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { useWorkspaceContext } from "@/lib/hooks/use-projects";

interface NavSubItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
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
    quickAction: { href: "/new?type=TASK", title: "New task" },
    items: [
      {
        name: "Tasks",
        href: "/tasks",
        icon: CheckCircle2,
        matchPrefixes: ["/tasks", "/board", "/gantt"],
        children: [
          { name: "List", href: "/tasks", icon: List },
          { name: "Board", href: "/board", icon: Kanban },
          { name: "Timeline", href: "/gantt", icon: GitCommitHorizontal },
        ],
      },
      { name: "Calendar", href: "/calendar", icon: Calendar, matchPrefixes: ["/calendar"] },
      { name: "Schedule", href: "/schedule", icon: CalendarDays, matchPrefixes: ["/schedule"] },
    ],
  },
  {
    id: "operations",
    title: "Operations",
    quickAction: { href: "/new?type=PROJECT", title: "New project" },
    items: [
      { name: "Projects", href: "/projects", icon: Folder, matchPrefixes: ["/projects"] },
      { name: "Milestones", href: "/milestones", icon: Flag, matchPrefixes: ["/milestones"] },
      { name: "Time tracking", href: "/time-tracking", icon: Timer, matchPrefixes: ["/time-tracking"] },
      { name: "Performance", href: "/performance", icon: TrendingUp, matchPrefixes: ["/performance"] },
      { name: "Team", href: "/team", icon: Users, matchPrefixes: ["/team"] },
      { name: "Notes & docs", href: "/notes-and-docs", icon: FileText, matchPrefixes: ["/notes-and-docs"] },
    ],
  },
];

// TODO: point this at a real settings route once one exists.
const SETTINGS_HREF = "/team";

const SECTIONS_KEY = "scryme_projects_sidebar_sections";
const EXPANDED_KEY = "scryme_projects_expanded_items";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-0";

function matchesPath(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { data: workspace } = useWorkspaceContext();

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [collapsedItems, setCollapsedItems] = useState<Record<string, boolean>>({});

  // Restore disclosure state on client mount only to prevent SSR hydration mismatches.
  useEffect(() => {
    try {
      const storedSections = localStorage.getItem(SECTIONS_KEY);
      if (storedSections) {
        setCollapsedSections(JSON.parse(storedSections));
      }
      const storedItems = localStorage.getItem(EXPANDED_KEY);
      if (storedItems) {
        setCollapsedItems(JSON.parse(storedItems));
      }
    } catch {
      // Ignore localStorage read errors in restricted contexts
    }
  }, []);

  const toggleSection = (id: string) => {
    setCollapsedSections((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(SECTIONS_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const toggleItem = (name: string) => {
    setCollapsedItems((prev) => {
      // Default state is expanded (false in collapsed map)
      const isCurrentlyCollapsed = prev[name] ?? false;
      const next = { ...prev, [name]: !isCurrentlyCollapsed };
      try {
        localStorage.setItem(EXPANDED_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const isChildActive = (href: string) => matchesPath(pathname, href);

  const isRouteActive = (item: NavItem) => {
    if (item.matchPrefixes) {
      return item.matchPrefixes.some((p) => matchesPath(pathname, p));
    }
    return matchesPath(pathname, item.href);
  };

  const orgName = workspace?.orgName || session?.session?.activeOrganizationName || "Scryme Workspace";
  const user = session?.user;
  const userName = user?.name || user?.email?.split("@")[0] || "Operator";

  const rowClasses = (active: boolean) =>
    `group flex items-center rounded-lg font-body-sm text-[13px] transition-colors ${
      active
        ? "bg-surface-container text-on-surface font-medium"
        : "text-on-surface-variant hover:bg-surface-container/60 hover:text-on-surface"
    }`;

  const iconClasses = (active: boolean) =>
    `h-4 w-4 shrink-0 transition-colors ${
      active ? "text-primary" : "text-outline group-hover:text-on-surface"
    }`;

  return (
    <aside
      aria-label="Workspace sidebar"
      className="fixed left-0 top-0 bottom-0 z-50 flex w-60 flex-col border-r border-outline-variant/30 bg-surface-container-lowest"
    >
      {/* Workspace Brand / Header */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-outline-variant/30 px-space-md">
        <Link
          href="/projects"
          className={`flex min-w-0 items-center gap-2 rounded-md py-1 pr-1 hover:opacity-90 ${FOCUS_RING}`}
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary-container text-on-primary-container font-headline-sm text-[11px] font-bold shadow-xs">
            SP
          </div>
          <span className="truncate font-headline-sm text-body-sm font-semibold tracking-tight text-on-surface">
            {orgName}
          </span>
        </Link>
        <button
          type="button"
          aria-label="Switch workspace"
          title="Switch workspace"
          className={`flex h-7 w-7 items-center justify-center rounded-md text-outline hover:bg-surface-container hover:text-on-surface ${FOCUS_RING}`}
        >
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-outline" />
        </button>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Quick Search Trigger */}
        <div className="p-space-sm pb-1">
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
            }}
            className={`flex w-full cursor-pointer items-center justify-between rounded-lg border border-outline-variant/30 bg-surface-container-low px-space-sm py-1.5 text-on-surface-variant transition-colors hover:border-outline/60 hover:text-on-surface ${FOCUS_RING}`}
          >
            <span className="flex items-center gap-space-sm">
              <Search className="h-4 w-4 text-outline" />
              <span className="font-body-sm text-body-sm text-outline">Search</span>
            </span>
            <kbd className="rounded border border-outline-variant/40 bg-surface-container px-1.5 py-0.5 font-label-kbd text-label-kbd text-outline">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 space-y-space-sm overflow-y-auto px-space-sm py-space-xs">
          {navGroups.map((group) => {
            const isCollapsed = collapsedSections[group.id] ?? false;

            return (
              <section key={group.id} aria-label={group.title}>
                <div className="group/header mb-0.5 flex items-center justify-between px-space-xs">
                  <button
                    type="button"
                    onClick={() => toggleSection(group.id)}
                    aria-expanded={!isCollapsed}
                    className={`-ml-1 flex cursor-pointer items-center gap-1 rounded-md px-1 py-1 text-left font-label-badge text-[12px] font-medium text-outline transition-colors hover:text-on-surface ${FOCUS_RING}`}
                  >
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-200 motion-reduce:transition-none ${
                        isCollapsed ? "-rotate-90" : "rotate-0"
                      }`}
                      aria-hidden
                    />
                    <span>{group.title}</span>
                  </button>

                  {group.quickAction && (
                    <Link
                      href={group.quickAction.href}
                      title={group.quickAction.title}
                      aria-label={group.quickAction.title}
                      className={`flex h-5 w-5 items-center justify-center rounded-md text-outline opacity-0 transition hover:bg-surface-container-high hover:text-on-surface focus-visible:opacity-100 group-hover/header:opacity-100 ${FOCUS_RING}`}
                    >
                      <Plus className="h-4 w-4" />
                    </Link>
                  )}
                </div>

                {!isCollapsed && (
                  <nav className="flex flex-col gap-0.5">
                    {group.items.map((item) => {
                      const isActive = isRouteActive(item);
                      const children = item.children;
                      const IconComponent = item.icon;

                      if (!children || children.length === 0) {
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            aria-current={isActive ? "page" : undefined}
                            className={`${rowClasses(isActive)} gap-space-sm px-space-sm py-1.5 ${FOCUS_RING}`}
                          >
                            <IconComponent className={iconClasses(isActive)} aria-hidden />
                            <span className="truncate">{item.name}</span>
                          </Link>
                        );
                      }

                      const isOpen = !(collapsedItems[item.name] ?? false);
                      const panelId = `nav-sub-${item.name.toLowerCase().replace(/\s+/g, "-")}`;

                      return (
                        <div key={item.name} className="flex flex-col">
                          <div className={`${rowClasses(isActive)} justify-between`}>
                            <Link
                              href={item.href}
                              aria-current={isActive && !children.some((c) => isChildActive(c.href)) ? "page" : undefined}
                              className={`flex min-w-0 flex-1 items-center gap-space-sm rounded-lg px-space-sm py-1.5 ${FOCUS_RING}`}
                            >
                              <IconComponent className={iconClasses(isActive)} aria-hidden />
                              <span className="truncate">{item.name}</span>
                            </Link>
                            <button
                              type="button"
                              onClick={() => toggleItem(item.name)}
                              aria-expanded={isOpen}
                              aria-controls={panelId}
                              title={isOpen ? `Collapse ${item.name.toLowerCase()} views` : `Expand ${item.name.toLowerCase()} views`}
                              className={`mr-1 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-outline transition-colors hover:bg-surface-container-highest hover:text-on-surface ${FOCUS_RING}`}
                            >
                              <ChevronDown
                                className={`block h-4 w-4 transition-transform duration-200 motion-reduce:transition-none ${
                                  isOpen ? "rotate-0" : "-rotate-90"
                                }`}
                                aria-hidden
                              />
                            </button>
                          </div>

                          {/* Animated sub-tree: grid rows 0fr -> 1fr */}
                          <div
                            id={panelId}
                            className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${
                              isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                            }`}
                          >
                            <div className="min-h-0 overflow-hidden">
                              <div className="ml-[18px] mt-0.5 flex flex-col gap-0.5 border-l border-outline-variant/40 pl-2">
                                {children.map((sub) => {
                                  const active = isChildActive(sub.href);
                                  const SubIcon = sub.icon;
                                  return (
                                    <Link
                                      key={sub.name}
                                      href={sub.href}
                                      tabIndex={isOpen ? 0 : -1}
                                      aria-current={active ? "page" : undefined}
                                      className={`group/sub relative flex items-center gap-space-sm rounded-md px-space-sm py-1 font-body-sm text-[13px] transition-colors ${FOCUS_RING} ${
                                        active
                                          ? "bg-surface-container text-on-surface font-medium"
                                          : "text-outline hover:bg-surface-container/60 hover:text-on-surface"
                                      }`}
                                    >
                                      {active && (
                                        <span
                                          className="absolute -left-[9px] top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-primary"
                                          aria-hidden
                                        />
                                      )}
                                      <SubIcon
                                        className={`h-4 w-4 shrink-0 transition-colors ${
                                          active ? "text-primary" : "text-outline group-hover/sub:text-on-surface"
                                        }`}
                                        aria-hidden
                                      />
                                      <span className="truncate">{sub.name}</span>
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </nav>
                )}
              </section>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-outline-variant/30 p-space-sm">
        <Link
          href={SETTINGS_HREF}
          className={`group/item flex items-center justify-between rounded-lg px-space-sm py-1.5 transition-colors hover:bg-surface-container ${FOCUS_RING}`}
        >
          <span className="flex min-w-0 items-center gap-space-sm">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-surface-container-high font-label-badge text-[11px] font-medium text-on-surface-variant">
              {userName.charAt(0).toUpperCase()}
            </span>
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate font-body-sm text-body-sm text-on-surface">{userName}</span>
              <span className="font-body-sm text-[11px] text-outline">Settings</span>
            </span>
          </span>
          <kbd className="font-label-kbd text-label-kbd text-outline">⌘,</kbd>
        </Link>
      </div>
    </aside>
  );
}
