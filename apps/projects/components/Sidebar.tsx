"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
    quickAction: { href: "/new?type=TASK", title: "New task" },
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
      { name: "Calendar", href: "/calendar", icon: "calendar_today", matchPrefixes: ["/calendar"] },
      { name: "Schedule", href: "/schedule", icon: "date_range", matchPrefixes: ["/schedule"] },
    ],
  },
  {
    id: "operations",
    title: "Operations",
    quickAction: { href: "/new?type=PROJECT", title: "New project" },
    items: [
      { name: "Projects", href: "/projects", icon: "folder", matchPrefixes: ["/projects"] },
      { name: "Milestones", href: "/milestones", icon: "flag", matchPrefixes: ["/milestones"] },
      { name: "Time tracking", href: "/time-tracking", icon: "timer", matchPrefixes: ["/time-tracking"] },
      { name: "Performance", href: "/performance", icon: "trending_up", matchPrefixes: ["/performance"] },
      { name: "Team", href: "/team", icon: "group", matchPrefixes: ["/team"] },
      { name: "Notes & docs", href: "/notes-and-docs", icon: "description", matchPrefixes: ["/notes-and-docs"] },
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

function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStored(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage unavailable; state stays in memory only
  }
}

interface SidebarProps {
  /** Called when the search field is clicked or ⌘K / Ctrl+K is pressed. */
  onSearch?: () => void;
}

export function Sidebar({ onSearch }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { data: workspace } = useWorkspaceContext();

  const orgName = workspace?.orgName || session?.session?.activeOrganizationName || "Scryme";
  const orgSlug = workspace?.orgSlug || session?.session?.activeOrganizationSlug || "workspace";
  const userName = session?.user?.name || session?.user?.email || "Account";

  // Both default to open; persisted after mount to avoid hydration mismatch.
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [collapsedItems, setCollapsedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setCollapsedSections(readStored<Record<string, boolean>>(SECTIONS_KEY, {}));
    setCollapsedItems(readStored<Record<string, boolean>>(EXPANDED_KEY, {}));
  }, []);

  useEffect(() => {
    if (!onSearch) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onSearch();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onSearch]);

  const toggleSection = (id: string) => {
    setCollapsedSections((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      writeStored(SECTIONS_KEY, next);
      return next;
    });
  };

  const toggleItem = (name: string) => {
    setCollapsedItems((prev) => {
      const next = { ...prev, [name]: !prev[name] };
      writeStored(EXPANDED_KEY, next);
      return next;
    });
  };

  const isRouteActive = (item: NavItem) => {
    const prefixes = item.matchPrefixes ?? [item.href];
    return prefixes.some((p) => (p === "/" ? pathname === "/" : matchesPath(pathname, p)));
  };

  const isChildActive = (href: string) => matchesPath(pathname, href);

  // Shared row styling. The active marker is an absolutely positioned pill,
  // so selecting an item never shifts its content (the old border-l did).
  const rowClasses = (active: boolean) =>
    `group/item relative flex items-center rounded-lg font-body-md text-body-md transition-colors ${
      active
        ? "bg-surface-container-high text-on-surface font-medium before:absolute before:left-0 before:top-1/2 before:h-4 before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-primary"
        : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
    }`;

  const iconClasses = (active: boolean) =>
    `material-symbols-outlined text-[18px] shrink-0 transition-colors ${
      active ? "text-primary" : "text-outline group-hover/item:text-on-surface"
    }`;

  return (
    <aside
      className="fixed left-0 top-0 z-50 flex h-full w-60 select-none flex-col justify-between border-r border-outline-variant/30 bg-surface-container-lowest"
      aria-label="Primary"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Workspace header */}
        <div className="flex h-14 shrink-0 items-center px-space-sm">
          <Link
            href="/projects"
            className={`flex w-full min-w-0 items-center gap-space-sm rounded-lg px-space-xs py-1.5 text-left transition-colors hover:bg-surface-container ${FOCUS_RING}`}
            title={`${orgName} workspace`}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-container font-headline-sm text-body-sm font-semibold text-on-primary-container">
              {orgName.charAt(0).toUpperCase()}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5 leading-none">
              <span className="truncate font-headline-sm text-body-sm font-medium text-on-surface">
                {orgName}
              </span>
              <span className="truncate font-body-sm text-[11px] text-outline">{orgSlug}</span>
            </div>
            <span className="material-symbols-outlined shrink-0 text-[16px] text-outline">unfold_more</span>
          </Link>
        </div>

        {/* Search */}
        <div className="shrink-0 px-space-sm pb-space-xs">
          <button
            type="button"
            onClick={onSearch}
            className={`flex w-full cursor-pointer items-center justify-between rounded-lg border border-outline-variant/30 bg-surface-container-low px-space-sm py-1.5 text-on-surface-variant transition-colors hover:border-outline/60 hover:text-on-surface ${FOCUS_RING}`}
          >
            <span className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-[16px] text-outline">search</span>
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
                    <span
                      className={`material-symbols-outlined text-[14px] transition-transform duration-200 motion-reduce:transition-none ${
                        isCollapsed ? "-rotate-90" : "rotate-0"
                      }`}
                      aria-hidden
                    >
                      expand_more
                    </span>
                    <span>{group.title}</span>
                  </button>

                  {group.quickAction && (
                    <Link
                      href={group.quickAction.href}
                      title={group.quickAction.title}
                      aria-label={group.quickAction.title}
                      className={`flex h-5 w-5 items-center justify-center rounded-md text-outline opacity-0 transition hover:bg-surface-container-high hover:text-on-surface focus-visible:opacity-100 group-hover/header:opacity-100 ${FOCUS_RING}`}
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                    </Link>
                  )}
                </div>

                {!isCollapsed && (
                  <nav className="flex flex-col gap-0.5">
                    {group.items.map((item) => {
                      const isActive = isRouteActive(item);
                      const children = item.children;

                      if (!children || children.length === 0) {
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            aria-current={isActive ? "page" : undefined}
                            className={`${rowClasses(isActive)} gap-space-sm px-space-sm py-1.5 ${FOCUS_RING}`}
                          >
                            <span className={iconClasses(isActive)} aria-hidden>
                              {item.icon}
                            </span>
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
                              <span className={iconClasses(isActive)} aria-hidden>
                                {item.icon}
                              </span>
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
                              <span
                                className={`material-symbols-outlined block text-[16px] transition-transform duration-200 motion-reduce:transition-none ${
                                  isOpen ? "rotate-0" : "-rotate-90"
                                }`}
                                aria-hidden
                              >
                                expand_more
                              </span>
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
                                      <span
                                        className={`material-symbols-outlined shrink-0 text-[16px] transition-colors ${
                                          active ? "text-primary" : "text-outline group-hover/sub:text-on-surface"
                                        }`}
                                        aria-hidden
                                      >
                                        {sub.icon}
                                      </span>
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