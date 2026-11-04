"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient, useSession } from "@/lib/auth-client";
import { SetupGuideTour } from "@/components/onboarding/setup-guide-tour";
import { UserSettingsDialog } from "@repo/ui/components/user-settings-dialog";
import { getActiveOrganization } from "@/app/actions/organization";
import { useModules } from "@/providers/module-provider";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LayoutDashboard,
  ShoppingCart,
  Users,
  MapPin,
  FileBarChart,
  Receipt,
  Settings,
  Boxes,
  Package,
  TrendingUp,
  Zap,
  Settings2,
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils";

/* -------------------------------------------------------------------------- */
/*                                   Config                                   */
/* -------------------------------------------------------------------------- */

interface SidebarSubItem {
  title: string;
  href: string;
  moduleKey?: string;
}

interface SidebarItem {
  title: string;
  icon: React.ElementType;
  href: string;
  tourId?: string;
  moduleKey?: string;
  items?: SidebarSubItem[];
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

const sidebarConfig: SidebarSection[] = [
  {
    title: "Daily Operation",
    items: [
      { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
      {
        title: "Sales",
        icon: ShoppingCart,
        href: "/sales/transactions",
        tourId: "sales",
        items: [
          { title: "Transactions", href: "/sales/transactions" },
          { title: "New Order", href: "/sales/new" },
          { title: "Deliveries", href: "/sales/deliveries", moduleKey: "deliveries" },
        ],
      },
      {
        title: "Manage Staff",
        icon: Users,
        href: "/staff",
        tourId: "staff",
        items: [
          { title: "Staff Members", href: "/staff" },
          { title: "Shifts & Scheduling", href: "/staff/shifts", moduleKey: "services" },
          { title: "Departments", href: "/staff/departments" },
          { title: "Drivers", href: "/staff/drivers", moduleKey: "deliveries" },
        ],
      },
      { title: "Locations", icon: MapPin, href: "/locations", tourId: "locations" },
      {
        title: "Inventory",
        icon: Package,
        href: "/inventory",
        tourId: "inventory",
        items: [
          { title: "Items", href: "/inventory" },
          { title: "Services", href: "/inventory/services", moduleKey: "services" },
          { title: "Suppliers", href: "/inventory/supplier" },
          { title: "Units", href: "/inventory/units" },
          { title: "Archived Items", href: "/inventory/archived" },
        ],
      },
      {
        title: "Stocking",
        icon: TrendingUp,
        href: "/stocking/list",
        items: [
          { title: "Stocking List", href: "/stocking/list" },
          { title: "Transfers", href: "/stocking/transfers" },
          { title: "Stock Reception", href: "/stocking/reception" },
          { title: "Reorder Rules", href: "/stocking/reorder-rules" },
          { title: "Audit Trail", href: "/stocking/audit" },
        ],
      },
      { title: "Integrations", icon: Boxes, href: "/integrations", moduleKey: "ecommerce" },
    ],
  },
  {
    title: "Automations",
    items: [{ title: "Workflows", icon: Zap, href: "/workflows" }],
  },
  {
    title: "Accounting",
    items: [
      {
        title: "Finance & Accounting",
        icon: FileBarChart,
        href: "/finance/accounting",
        moduleKey: "finance",
        items: [
          { title: "Chart of Accounts", href: "/finance/accounting/coa" },
          { title: "Journal Entries", href: "/finance/accounting/journal" },
          { title: "Bank Reconciliation", href: "/finance/accounting/reconciliation" },
          { title: "Recurring Templates", href: "/finance/accounting/recurring" },
          { title: "Financial Reports", href: "/finance/reports" },
          { title: "Petty Cash", href: "/finance/petty-cash" },
        ],
      },
      {
        title: "Purchases & Expenses",
        icon: Receipt,
        href: "/finance/purchases",
        moduleKey: "finance",
        items: [
          { title: "Expenses", href: "/finance/expenses" },
          { title: "Purchases", href: "/finance/purchases" },
          { title: "Utilities", href: "/finance/utilities" },
          { title: "Approvals", href: "/finance/approvals" },
        ],
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        title: "Settings",
        icon: Settings,
        href: "/settings",
        tourId: "org-setup",
        items: [
          { title: "Organization", href: "/settings" },
          { title: "Reports", href: "/settings/reports" },
          { title: "Documents", href: "/settings/documents" },
          { title: "Authorized Devices", href: "/settings/devices" },
          { title: "Loyalty Program", href: "/settings/loyalty", moduleKey: "loyalty" },
        ],
      },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*                               Persistence                                  */
/* -------------------------------------------------------------------------- */

const STORAGE_COLLAPSED_KEY = "sidebar:v1:collapsed";
const STORAGE_OPEN_MENUS_KEY = "sidebar:v1:open-menus";

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode, quota) – ignore */
  }
}

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

const matchesPath = (href: string, pathname: string) =>
  pathname === href || pathname.startsWith(href + "/");

/** The most specific sub item matching the current path (longest href wins). */
function getActiveSubHref(subItems: SidebarSubItem[] | undefined, pathname: string) {
  if (!subItems) return null;
  let best: string | null = null;
  for (const sub of subItems) {
    if (matchesPath(sub.href, pathname) && (!best || sub.href.length > best.length)) {
      best = sub.href;
    }
  }
  return best;
}

/* -------------------------------------------------------------------------- */
/*                       Collapsed-rail flyout (submenus)                     */
/* -------------------------------------------------------------------------- */

interface CollapsedFlyoutProps {
  item: SidebarItem;
  subItems: SidebarSubItem[];
  isActive: boolean;
  activeSubHref: string | null;
}

function CollapsedFlyout({ item, subItems, isActive, activeSubHref }: CollapsedFlyoutProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLAnchorElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  const clearTimer = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  const show = () => {
    clearTimer();
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setPos({ top: rect.top, left: rect.right });
    setOpen(true);
  };

  const hide = () => {
    clearTimer();
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  // Close the flyout after navigating
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => clearTimer, []);

  // Keep the panel inside the viewport vertically
  const maxTop =
    typeof window !== "undefined"
      ? Math.max(8, Math.min(pos.top, window.innerHeight - (subItems.length * 36 + 64)))
      : pos.top;

  return (
    <div onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      <Link
        ref={triggerRef}
        href={item.href}
        {...(item.tourId ? { "data-tour": item.tourId } : {})}
        aria-label={item.title}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "relative mx-auto flex h-11 w-11 items-center justify-center rounded-xl transition-colors",
          isActive
            ? "bg-sidebar-accent text-sidebar-primary"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        )}
      >
        {isActive && (
          <span className="absolute -left-3 top-2.5 bottom-2.5 w-1 rounded-r-full bg-sidebar-primary" />
        )}
        <item.icon size={20} />
        {/* tiny corner chevron hints at the flyout */}
        <ChevronRight
          size={10}
          className="absolute bottom-1 right-1 text-sidebar-foreground/40"
        />
      </Link>

      {open && (
        <div
          className="fixed z-50 pl-2"
          style={{ top: maxTop, left: pos.left }}
          role="menu"
          aria-label={item.title}
        >
          <div className="min-w-[220px] rounded-xl border border-sidebar-border bg-sidebar p-1.5 shadow-xl animate-in fade-in-0 zoom-in-95 slide-in-from-left-1 duration-100">
            <div className="px-2.5 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              {item.title}
            </div>
            {subItems.map((sub) => {
              const active = sub.href === activeSubHref;
              return (
                <Link
                  key={sub.href}
                  href={sub.href}
                  role="menuitem"
                  className={cn(
                    "block rounded-lg px-2.5 py-2 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent font-medium text-sidebar-primary"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  {sub.title}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Sidebar                                   */
/* -------------------------------------------------------------------------- */

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [showUserSettingsDialog, setShowUserSettingsDialog] = useState(false);
  const [showManualTour, setShowManualTour] = useState(false);
  const [activeOrg, setActiveOrg] = useState<{ name?: string } | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { isModuleEnabled } = useModules();

  /* ----- restore persisted state (once, on the client) ----- */
  useEffect(() => {
    setIsCollapsed(readStorage<boolean>(STORAGE_COLLAPSED_KEY, false));
    setOpenMenus(readStorage<string[]>(STORAGE_OPEN_MENUS_KEY, []));
    setHydrated(true);
  }, []);

  /* ----- persist on change (only after restore, so we never clobber it) ----- */
  useEffect(() => {
    if (hydrated) writeStorage(STORAGE_COLLAPSED_KEY, isCollapsed);
  }, [isCollapsed, hydrated]);

  useEffect(() => {
    if (hydrated) writeStorage(STORAGE_OPEN_MENUS_KEY, openMenus);
  }, [openMenus, hydrated]);

  /* ----- keyboard shortcut: Ctrl/Cmd + B toggles the sidebar ----- */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setIsCollapsed((c) => !c);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  /* ----- organization ----- */
  useEffect(() => {
    getActiveOrganization()
      .then((org) => {
        if (org) setActiveOrg(org);
      })
      .catch((err) => {
        console.error("Failed to load active organization:", err);
      });
  }, []);

  const activeOrgName = activeOrg?.name || "Organization";

  /* ----- visible config, filtered by enabled modules ----- */
  const sections = useMemo(
    () =>
      sidebarConfig
        .map((section) => ({
          ...section,
          items: section.items
            .filter((item) => !item.moduleKey || isModuleEnabled(item.moduleKey))
            .map((item) => ({
              ...item,
              items: item.items?.filter(
                (sub) => !sub.moduleKey || isModuleEnabled(sub.moduleKey)
              ),
            })),
        }))
        .filter((section) => section.items.length > 0),
    [isModuleEnabled]
  );

  /* ----- make sure the menu holding the current page is open ----- */
  useEffect(() => {
    const toOpen: string[] = [];
    sections.forEach((section) =>
      section.items.forEach((item) => {
        if (item.items?.length && getActiveSubHref(item.items, pathname)) {
          toOpen.push(item.title);
        }
      })
    );
    if (toOpen.length === 0) return;
    setOpenMenus((prev) => {
      const missing = toOpen.filter((t) => !prev.includes(t));
      return missing.length ? [...prev, ...missing] : prev;
    });
  }, [pathname, sections]);

  const toggleSubmenu = useCallback((title: string) => {
    setOpenMenus((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  }, []);

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
        },
      },
    });
  };

  const userInitials =
    session?.user?.name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  const orgInitial = activeOrgName.charAt(0).toUpperCase();

  return (
    <>
      <SetupGuideTour
        forceOpen={showManualTour}
        onClose={() => setShowManualTour(false)}
      />

      <UserSettingsDialog
        open={showUserSettingsDialog}
        onOpenChange={setShowUserSettingsDialog}
        user={session?.user}
        activeOrgName={activeOrgName}
        onSignOut={handleSignOut}
        onLaunchTour={() => setShowManualTour(true)}
      />

      <aside
        data-collapsed={isCollapsed}
        className={cn(
          "relative z-20 flex h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
          // skip the width animation on first paint so a restored state doesn't "slide"
          hydrated && "transition-[width] duration-300 ease-in-out",
          isCollapsed ? "w-[72px]" : "w-64"
        )}
      >
        {/* ------------------------------ Header ------------------------------ */}
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b border-sidebar-border",
            isCollapsed ? "justify-center px-3" : "justify-between px-4"
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-sm font-bold text-white shadow-sm ring-1 ring-black/5">
              {orgInitial}
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-tight">
                  {activeOrgName}
                </p>
                <p className="truncate text-[11px] leading-tight text-sidebar-foreground/50">
                  Workspace
                </p>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsCollapsed(true)}
                  aria-label="Collapse sidebar"
                  className="rounded-lg p-1.5 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                >
                  <ChevronLeft size={18} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Collapse (Ctrl/⌘ + B)</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Floating expand handle on the border when collapsed */}
        {isCollapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setIsCollapsed(false)}
                aria-label="Expand sidebar"
                className="absolute -right-3 top-[52px] z-30 flex h-6 w-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground/70 shadow-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                <ChevronRight size={14} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Expand (Ctrl/⌘ + B)</TooltipContent>
          </Tooltip>
        )}

        {/* ---------------------------- Navigation ---------------------------- */}
        <nav
          aria-label="Main navigation"
          className={cn(
            "custom-scrollbar flex-1 overflow-y-auto overflow-x-hidden py-4",
            isCollapsed ? "px-3" : "px-3"
          )}
        >
          {sections.map((section, sectionIdx) => (
            <div key={section.title} className={cn(sectionIdx > 0 && "mt-5")}>
              {/* Section label (expanded) or divider (collapsed) */}
              {isCollapsed ? (
                sectionIdx > 0 && (
                  <div className="mx-auto mb-4 h-px w-8 bg-sidebar-border" />
                )
              ) : (
                <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                  {section.title}
                </div>
              )}

              <div className="space-y-1">
                {section.items.map((item) => {
                  const subItems = item.items ?? [];
                  const hasSubmenu = subItems.length > 0;
                  const activeSubHref = getActiveSubHref(subItems, pathname);
                  const isActive = hasSubmenu
                    ? !!activeSubHref || pathname === item.href
                    : matchesPath(item.href, pathname);
                  const isOpen = openMenus.includes(item.title);

                  /* ------------------------- Collapsed rail ------------------------- */
                  if (isCollapsed) {
                    if (hasSubmenu) {
                      return (
                        <CollapsedFlyout
                          key={item.title}
                          item={item}
                          subItems={subItems}
                          isActive={isActive}
                          activeSubHref={activeSubHref}
                        />
                      );
                    }

                    return (
                      <Tooltip key={item.title}>
                        <TooltipTrigger asChild>
                          <Link
                            href={item.href}
                            {...(item.tourId ? { "data-tour": item.tourId } : {})}
                            aria-label={item.title}
                            className={cn(
                              "relative mx-auto flex h-11 w-11 items-center justify-center rounded-xl transition-colors",
                              isActive
                                ? "bg-sidebar-accent text-sidebar-primary"
                                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                            )}
                          >
                            {isActive && (
                              <span className="absolute -left-3 top-2.5 bottom-2.5 w-1 rounded-r-full bg-sidebar-primary" />
                            )}
                            <item.icon size={20} />
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">{item.title}</TooltipContent>
                      </Tooltip>
                    );
                  }

                  /* ---------------------------- Expanded ---------------------------- */
                  const rowClasses = cn(
                    "group relative flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-accent font-medium text-sidebar-primary"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  );

                  const rowInner = (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-sidebar-primary" />
                      )}
                      <span className="flex min-w-0 items-center gap-3">
                        <item.icon
                          size={20}
                          className={cn(
                            "shrink-0",
                            isActive
                              ? "text-sidebar-primary"
                              : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
                          )}
                        />
                        <span className="truncate">{item.title}</span>
                      </span>
                      {hasSubmenu && (
                        <ChevronDown
                          size={16}
                          className={cn(
                            "shrink-0 text-sidebar-foreground/50 transition-transform duration-200",
                            isOpen && "rotate-180"
                          )}
                        />
                      )}
                    </>
                  );

                  return (
                    <div key={item.title}>
                      {hasSubmenu ? (
                        <button
                          type="button"
                          onClick={() => toggleSubmenu(item.title)}
                          aria-expanded={isOpen}
                          aria-controls={`submenu-${item.title}`}
                          {...(item.tourId ? { "data-tour": item.tourId } : {})}
                          className={rowClasses}
                        >
                          {rowInner}
                        </button>
                      ) : (
                        <Link
                          href={item.href}
                          {...(item.tourId ? { "data-tour": item.tourId } : {})}
                          className={rowClasses}
                        >
                          {rowInner}
                        </Link>
                      )}

                      {/* Animated submenu (grid-rows trick = smooth height transition) */}
                      {hasSubmenu && (
                        <div
                          id={`submenu-${item.title}`}
                          className={cn(
                            "grid transition-[grid-template-rows] duration-200 ease-in-out",
                            isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                          )}
                        >
                          <div className="overflow-hidden">
                            <div className="ml-[22px] mt-1 space-y-0.5 border-l border-sidebar-border pl-3">
                              {subItems.map((sub) => {
                                const isSubActive = sub.href === activeSubHref;
                                return (
                                  <Link
                                    key={sub.href}
                                    href={sub.href}
                                    tabIndex={isOpen ? 0 : -1}
                                    className={cn(
                                      "block rounded-md px-3 py-1.5 text-[13px] transition-colors",
                                      isSubActive
                                        ? "bg-sidebar-accent/60 font-medium text-sidebar-primary"
                                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
                                    )}
                                  >
                                    {sub.title}
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* ------------------------------ Footer ------------------------------ */}
        <div className="shrink-0 border-t border-sidebar-border p-3">
          {!isCollapsed ? (
            <button
              onClick={() => setShowUserSettingsDialog(true)}
              className="group flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-sidebar-accent"
              title="User Info & Preferences"
            >
              <Avatar className="h-9 w-9 shrink-0 border border-border transition-all group-hover:ring-2 group-hover:ring-indigo-500">
                {session?.user?.image ? (
                  <AvatarImage
                    src={session.user.image}
                    alt={session.user.name || "User"}
                  />
                ) : null}
                <AvatarFallback className="bg-slate-800 text-xs font-bold text-slate-200">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-tight">
                  {session?.user?.name || "User"}
                </p>
                <p className="truncate text-[11px] text-sidebar-foreground/60">
                  {session?.user?.email}
                </p>
              </div>
              <Settings2 className="h-4 w-4 shrink-0 text-sidebar-foreground/50 transition-colors group-hover:text-sidebar-foreground" />
            </button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowUserSettingsDialog(true)}
                  aria-label="User Info & Preferences"
                  className="mx-auto flex rounded-full transition-all hover:ring-2 hover:ring-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <Avatar className="h-10 w-10 border border-border">
                    {session?.user?.image ? (
                      <AvatarImage
                        src={session.user.image}
                        alt={session.user.name || "User"}
                      />
                    ) : null}
                    <AvatarFallback className="bg-slate-800 text-xs font-bold text-slate-200">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {session?.user?.name || "User"} · Preferences
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </aside>
    </>
  );
}