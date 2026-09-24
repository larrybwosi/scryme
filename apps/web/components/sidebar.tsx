"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient, useSession } from "@/lib/auth-client";
import { SetupGuideTour } from "@/components/onboarding/setup-guide-tour";
import { UserSettingsDialog } from "@/components/user-settings-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  ShoppingCart,
  Users,
  MapPin,
  FileBarChart,
  Settings,
  ChevronDown,
  Boxes,
  Package,
  TrendingUp,
  Zap,
  Settings2,
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils";

interface SidebarItem {
  title: string;
  icon: React.ElementType;
  href: string;
  tourId?: string;
  items?: { title: string; href: string }[];
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

const sidebarConfig: SidebarSection[] = [
  {
    title: "DAILY OPERATION",
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
          { title: "Deliveries", href: "/sales/deliveries" },
        ],
      },
      {
        title: "Manage Staff",
        icon: Users,
        href: "/staff",
        tourId: "staff",
        items: [
          { title: "Staff Members", href: "/staff" },
          { title: "Shifts & Scheduling", href: "/staff/shifts" },
          { title: "Departments", href: "/staff/departments" },
          { title: "Drivers", href: "/staff/drivers" },
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
          { title: "Services", href: "/inventory/services" },
          { title: "Suppliers", href: "/inventory/supplier" },
          { title: "Units", href: "/inventory/units" },
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
          { title: "Reports", href: "/stocking/reports" },
          { title: "Audit Trail", href: "/stocking/audit" },
        ],
      },
      { title: "Integrations", icon: Boxes, href: "/integrations" },
    ],
  },
  {
    title: "AUTOMATIONS",
    items: [{ title: "Workflows", icon: Zap, href: "/workflows" }],
  },
  {
    title: "ACCOUNTING",
    items: [
      {
        title: "Finance & Accounting",
        icon: FileBarChart,
        href: "/finance/accounting",
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
        icon: ShoppingCart,
        href: "/finance/purchases",
        items: [
          { title: "Expenses", href: "/finance/expenses" },
          { title: "Purchases", href: "/finance/purchases" },
          { title: "Utilities", href: "/finance/utilities" },
          { title: "Approvals", href: "/finance/approvals" },
        ],
      },
      {
        title: "Settings",
        icon: Settings,
        href: "/settings",
        tourId: "org-setup",
        items: [
          { title: "Organization", href: "/settings" },
          { title: "Documents", href: "/settings/documents" },
          { title: "Authorized Devices", href: "/settings/devices" },
        ],
      },
    ],
  },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [showUserSettingsDialog, setShowUserSettingsDialog] = useState(false);
  const [showManualTour, setShowManualTour] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { data: activeOrg } = authClient.useActiveOrganization();

  const activeOrgName = activeOrg?.name || "Scryme";

  useEffect(() => {
    // Keep active parent menu open
    sidebarConfig.forEach((section) => {
      section.items.forEach((item) => {
        if (
          item.items?.some((sub) => sub.href === pathname) ||
          item.href === pathname
        ) {
          if (!openMenus.includes(item.title)) {
            setOpenMenus((prev) => [...prev, item.title]);
          }
        }
      });
    });
  }, [pathname]);

  const toggleSubmenu = (title: string) => {
    setOpenMenus((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
        },
      },
    });
  };

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
        className={cn(
          "relative h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col transition-all duration-300 ease-in-out z-20 shrink-0",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Header Header */}
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          {!isCollapsed ? (
            <div className="flex items-center gap-3 px-2 min-w-0">
              <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                {activeOrgName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate leading-tight">
                  {activeOrgName}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm mx-auto shadow-sm">
              {activeOrgName.charAt(0).toUpperCase()}
            </div>
          )}

          {!isCollapsed ? (
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeft size={18} />
            </button>
          ) : (
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors mx-auto"
              title="Expand sidebar"
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
          {sidebarConfig.map((section, idx) => (
            <div key={idx} className="mb-6">
              {!isCollapsed && (
                <div className="text-[11px] font-bold text-sidebar-foreground/60 mb-3 px-2 tracking-wider font-mono uppercase">
                  {section.title}
                </div>
              )}
              <div className="space-y-1">
                {section.items.map((item, itemIdx) => {
                  const hasSubmenu = item.items && item.items.length > 0;
                  const isOpen = openMenus.includes(item.title);
                  const isActive =
                    pathname === item.href ||
                    item.items?.some((sub) => sub.href === pathname);

                  const itemContent = (
                    <button
                      {...(item.tourId ? { "data-tour": item.tourId } : {})}
                      onClick={() => {
                        if (hasSubmenu && !isCollapsed) {
                          toggleSubmenu(item.title);
                        } else {
                          router.push(item.href);
                        }
                      }}
                      aria-label={item.title}
                      title={isCollapsed ? item.title : undefined}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors",
                        isActive
                          ? "text-sidebar-primary bg-sidebar-accent font-medium"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                        isCollapsed && "justify-center"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon
                          size={20}
                          className={cn(
                            isActive
                              ? "text-sidebar-primary"
                              : "text-sidebar-foreground/60"
                          )}
                        />
                        {!isCollapsed && <span>{item.title}</span>}
                      </div>
                      {!isCollapsed && hasSubmenu && (
                        <ChevronDown
                          size={16}
                          className={cn(
                            "transition-transform",
                            isOpen && "rotate-180"
                          )}
                        />
                      )}
                    </button>
                  );

                  return (
                    <div key={itemIdx}>
                      {isCollapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>{itemContent}</TooltipTrigger>
                          <TooltipContent side="right">
                            {item.title}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        itemContent
                      )}

                      {/* Submenu Items */}
                      {!isCollapsed && hasSubmenu && isOpen && (
                        <div className="ml-9 mt-1 space-y-1 border-l-2 border-sidebar-border pl-2">
                          {item.items?.map((subItem, subIdx) => {
                            const isSubActive = pathname === subItem.href;
                            return (
                              <Link
                                key={subIdx}
                                href={subItem.href}
                                className={cn(
                                  "block px-3 py-1.5 rounded-md text-xs transition-colors",
                                  isSubActive
                                    ? "text-sidebar-primary font-medium bg-sidebar-accent/50"
                                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/30"
                                )}
                              >
                                {subItem.title}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer User Profile Card */}
        <div className="p-3 border-t border-sidebar-border">
          {!isCollapsed ? (
            <button
              onClick={() => setShowUserSettingsDialog(true)}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent transition-colors text-left group"
              title="User Info & Preferences"
            >
              <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-200 shrink-0 group-hover:ring-2 group-hover:ring-indigo-500 transition-all">
                {session?.user?.name?.charAt(0) || "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate leading-tight">
                  {session?.user?.name || "User"}
                </p>
                <p className="text-[10px] text-sidebar-foreground/60 truncate">
                  {session?.user?.email}
                </p>
              </div>
              <Settings2 className="h-4 w-4 text-sidebar-foreground/60 group-hover:text-sidebar-foreground transition-colors shrink-0" />
            </button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowUserSettingsDialog(true)}
                  className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-200 mx-auto hover:ring-2 hover:ring-indigo-500 transition-all"
                >
                  {session?.user?.name?.charAt(0) || "U"}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                User Info & Preferences
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </aside>
    </>
  );
}
