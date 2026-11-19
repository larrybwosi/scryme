"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  X,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { useWorkspaceContext } from "@/lib/hooks/use-projects";
import { FOCUS_RING, NAV_GROUPS, isPathActive } from "@/lib/navigation";
import { OPEN_COMMAND_PALETTE_EVENT } from "@/components/CommandPalette";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE_EVENT));
}

function NavLinks({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-3 overflow-y-auto px-space-sm py-space-sm">
      {NAV_GROUPS.map((group) => (
        <section key={group.id} aria-label={group.title}>
          {!collapsed && (
            <h2 className="px-space-sm pb-1 font-label-badge text-[11px] font-medium uppercase tracking-wider text-outline">
              {group.title}
            </h2>
          )}
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isPathActive(pathname, item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                  className={`group flex items-center rounded-sm font-body-sm text-[13px] transition-colors ${FOCUS_RING} ${
                    collapsed ? "h-9 justify-center px-0" : "h-8 gap-space-sm px-space-sm"
                  } ${
                    active
                      ? "bg-surface-container font-medium text-on-surface"
                      : "text-on-surface-variant hover:bg-surface-container/60 hover:text-on-surface"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${active ? "text-primary" : "text-outline group-hover:text-on-surface"}`}
                    aria-hidden
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </nav>
  );
}

function SidebarContent({
  collapsed,
  onToggleCollapsed,
  onCloseMobile,
  mobile,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onCloseMobile?: () => void;
  mobile: boolean;
}) {
  const { data: session } = useSession();
  const { data: workspace, isLoading, isError } = useWorkspaceContext();

  const orgLabel =
    workspace?.orgName || workspace?.orgSlug || (isLoading || isError ? "Workspace" : "Workspace");
  const user = session?.user;
  const userName = user?.name || user?.email?.split("@")[0] || "Operator";

  return (
    <>
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-outline-variant/60 px-space-sm">
        {collapsed && !mobile ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label="Expand navigation rail"
            title="Expand navigation rail"
            className={`mx-auto flex h-8 w-8 items-center justify-center rounded-sm text-outline transition-colors hover:bg-surface-container hover:text-on-surface ${FOCUS_RING}`}
          >
            <PanelLeftOpen className="h-4 w-4" aria-hidden />
          </button>
        ) : (
          <>
            <Link
              href="/projects"
              onClick={onCloseMobile}
              className={`flex min-w-0 items-center gap-2 rounded-sm py-1 pr-1 transition-opacity hover:opacity-90 ${FOCUS_RING}`}
              title={orgLabel}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-primary-container font-headline-sm text-[11px] font-bold text-on-primary-container">
                SP
              </span>
              <span className="truncate font-headline-sm text-body-sm font-semibold tracking-tight text-on-surface">
                {orgLabel}
              </span>
            </Link>

            {mobile ? (
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close navigation"
                className={`flex h-7 w-7 items-center justify-center rounded-sm text-outline transition-colors hover:bg-surface-container hover:text-on-surface ${FOCUS_RING}`}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            ) : (
              <button
                type="button"
                onClick={onToggleCollapsed}
                aria-label="Collapse navigation rail"
                title="Collapse navigation rail"
                className={`flex h-7 w-7 items-center justify-center rounded-sm text-outline transition-colors hover:bg-surface-container hover:text-on-surface ${FOCUS_RING}`}
              >
                <PanelLeftClose className="h-4 w-4" aria-hidden />
              </button>
            )}
          </>
        )}
      </div>

      <div className={collapsed && !mobile ? "px-1.5 pb-1 pt-space-sm" : "p-space-sm pb-1"}>
        <button
          type="button"
          onClick={openCommandPalette}
          aria-label="Search pages and actions"
          title="Search pages and actions"
          className={`flex w-full items-center justify-between rounded-sm border border-outline-variant bg-surface-container-low py-1.5 text-on-surface-variant transition-colors hover:border-outline hover:text-on-surface ${FOCUS_RING} ${
            collapsed && !mobile ? "justify-center px-1" : "px-space-sm"
          }`}
        >
          <span className="flex items-center gap-space-sm">
            <Search className="h-4 w-4 text-outline" aria-hidden />
            {!(collapsed && !mobile) && (
              <span className="font-body-sm text-body-sm text-outline">Search</span>
            )}
          </span>
          {!(collapsed && !mobile) && (
            <kbd className="rounded-sm border border-outline-variant bg-surface-container px-1.5 py-0.5 font-label-kbd text-label-kbd text-outline">
              ⌘K
            </kbd>
          )}
        </button>
      </div>

      <NavLinks collapsed={collapsed && !mobile} onNavigate={onCloseMobile} />

      <div className="shrink-0 border-t border-outline-variant/60 p-space-sm">
        <div
          className={`flex items-center rounded-sm py-1.5 ${collapsed && !mobile ? "justify-center" : "gap-space-sm px-space-sm"}`}
          title={collapsed && !mobile ? userName : undefined}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-surface-container-high font-label-badge text-[11px] font-medium text-on-surface-variant">
            {userName.charAt(0).toUpperCase()}
          </span>
          {!(collapsed && !mobile) && (
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate font-body-sm text-body-sm text-on-surface">{userName}</span>
              <span className="font-body-sm text-[11px] text-outline">{orgLabel}</span>
            </span>
          )}
        </div>
      </div>
    </>
  );
}

export function Sidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseMobile();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, onCloseMobile]);

  return (
    <>
      <aside
        aria-label="Workspace sidebar"
        className={`fixed bottom-0 left-0 top-0 z-40 hidden flex-col border-r border-outline-variant/60 bg-surface-container-lowest transition-[width] duration-200 motion-reduce:transition-none lg:flex ${
          collapsed ? "w-14" : "w-60"
        }`}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggleCollapsed={onToggleCollapsed}
          mobile={false}
        />
      </aside>

      {mounted && mobileOpen && (
        <div className="fixed inset-0 z-[64] lg:hidden">
          <button
            type="button"
            aria-label="Close navigation overlay"
            onClick={onCloseMobile}
            className="absolute inset-0 bg-surface-container-lowest/80 backdrop-blur-xs"
          />
          <aside
            aria-label="Workspace navigation drawer"
            data-drawer-open="true"
            className="absolute bottom-0 left-0 top-0 flex w-64 flex-col border-r border-outline-variant bg-surface-container-lowest shadow-2xl"
          >
            <SidebarContent
              collapsed={false}
              onToggleCollapsed={onToggleCollapsed}
              onCloseMobile={onCloseMobile}
              mobile
            />
          </aside>
        </div>
      )}
    </>
  );
}
