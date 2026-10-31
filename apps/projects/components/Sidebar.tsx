"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Tasks", href: "/tasks", icon: "check_circle" },
  { name: "Board", href: "/board", icon: "view_kanban" },
  { name: "Timeline", href: "/gantt", icon: "reorder" },
  { name: "Calendar", href: "/calendar", icon: "calendar_today" },
  { name: "Schedule", href: "/schedule", icon: "date_range" },
  { name: "Task Detail", href: "/task-detail", icon: "assignment" },
  { name: "Notes & Docs", href: "/notes-and-docs", icon: "description" },
  { name: "Time Tracking", href: "/time-tracking", icon: "timer" },
  { name: "Projects", href: "/projects", icon: "folder" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-surface-container-lowest border-r border-outline-variant/30 z-50 flex flex-col justify-between">
      <div className="flex flex-col">
        {/* Workspace Brand Switcher */}
        <div className="h-12 px-space-md border-b border-outline-variant/30 flex items-center justify-between">
          <Link
            href="/projects"
            className="flex items-center gap-space-sm rounded-lg px-space-xs py-1 hover:bg-surface-container transition-colors text-left"
          >
            <div className="w-5 h-5 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container font-headline-sm text-body-sm font-semibold">
              S
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-headline-sm text-body-sm text-on-surface font-medium truncate max-w-[120px]">
                Scryme
              </span>
              <span className="font-body-sm text-[10px] text-outline leading-none truncate max-w-[120px]">
                Acme Global
              </span>
            </div>
            <span className="material-symbols-outlined text-outline text-[16px]">unfold_more</span>
          </Link>
          <button
            className="w-6 h-6 rounded-lg flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
            type="button"
            title="Edit workspace"
          >
            <span className="material-symbols-outlined text-[16px]">edit_square</span>
          </button>
        </div>

        {/* Global Search Input Trigger */}
        <div className="p-space-xs">
          <button
            className="w-full flex items-center justify-between px-space-sm py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:border-outline transition-colors"
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

        {/* Navigation Section */}
        <div className="px-space-xs py-space-xs">
          <div className="px-space-sm py-1 text-[11px] font-label-badge text-outline uppercase tracking-wider">
            Workspace
          </div>
          <nav className="flex flex-col gap-0.5">
            {navigation.map((item) => {
              const isActive =
                item.href === "/projects"
                  ? pathname === "/projects" || pathname.startsWith("/projects/")
                  : pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-space-sm px-space-sm py-1.5 rounded-lg transition-all font-body-md text-body-md ${
                    isActive
                      ? "bg-surface-container-high text-on-surface font-medium border-l-2 border-primary-container"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Settings */}
      <div className="p-space-xs border-t border-outline-variant/30">
        <div className="flex items-center justify-between px-space-sm py-1.5 rounded-lg hover:bg-surface-container transition-colors cursor-pointer">
          <div className="flex items-center gap-space-sm">
            <div className="w-5 h-5 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center">
              <span className="material-symbols-outlined text-outline text-[13px]">tune</span>
            </div>
            <span className="font-body-sm text-body-sm text-on-surface-variant">Settings</span>
          </div>
          <span className="font-label-kbd text-label-kbd text-outline">⌘,</span>
        </div>
      </div>
    </aside>
  );
}
