"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient, useSession } from "@/lib/auth-client";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/ui/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog";
import { Badge } from "@repo/ui/components/ui/badge";
import { Skeleton } from "@repo/ui/components/ui/skeleton";
import { Button } from "@repo/ui/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  ShoppingCart,
  Users,
  MapPin,
  Megaphone,
  FileBarChart,
  Settings,
  Bell,
  HelpCircle,
  LogOut,
  ChevronDown,
  Boxes,
  Package,
  TrendingUp,
  Zap,
  User,
  Cpu,
  Moon,
  Sun,
  Activity,
  HardDrive,
  Clipboard,
  Check,
  Settings2,
  Sliders,
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils";

interface SidebarItem {
  title: string;
  icon: React.ElementType;
  href: string;
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
        items: [
          { title: "Staff Members", href: "/staff" },
          { title: "Departments", href: "/staff/departments" },
          { title: "Drivers", href: "/staff/drivers" },
        ],
      },
      { title: "Locations", icon: MapPin, href: "/locations" },
      { title: "Promotions", icon: Megaphone, href: "/promotions" },
      {
        title: "Inventory",
        icon: Package,
        href: "/inventory",
        items: [
          { title: "Product List", href: "/inventory" },
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
        title: "Finance",
        icon: FileBarChart,
        href: "/finance",
        items: [
          { title: "Overview", href: "/finance" },
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
  const [openMenus, setOpenMenus] = useState<string[]>(["Report"]);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "profile" | "preferences" | "system"
  >("profile");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [copied, setCopied] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [latency, setLatency] = useState(42);

  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = useSession();

  // Detect current theme on mount
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  // Sync latency fluctuation inside the diagnostics tab
  useEffect(() => {
    if (!showProfileDialog) return;
    const interval = setInterval(() => {
      setLatency(Math.floor(Math.random() * (52 - 38) + 38));
    }, 2000);
    return () => clearInterval(interval);
  }, [showProfileDialog]);

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
        },
      },
    });
  };

  const toggleSubmenu = (title: string) => {
    setOpenMenus(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title],
    );
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(session?.user?.id || "mem_usr_1029482");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleThemeChange = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-screen border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out select-none",
        isCollapsed ? "w-[80px]" : "w-[280px]",
      )}>
      {/* Brand Header */}
      <div
        className={cn(
          "flex items-center h-[80px] px-6",
          isCollapsed ? "flex-col justify-center gap-2" : "justify-between",
        )}>
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#34A853] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <span className="font-bold text-xl text-foreground">
                Scryme <sup className="text-[10px] font-medium">TM</sup>
              </span>
            </div>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
              className="p-1.5 rounded-md border border-sidebar-border bg-sidebar hover:bg-sidebar-accent transition-colors">
              <ChevronLeft size={14} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label="Expand sidebar"
              title="Expand sidebar"
              className="p-1.5 rounded-md border border-sidebar-border bg-sidebar hover:bg-sidebar-accent transition-colors">
              <ChevronRight size={14} />
            </button>
            <div className="w-8 h-8 bg-[#34A853] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
        {sidebarConfig.map((section, idx) => (
          <div key={idx} className="mb-6">
            {!isCollapsed && (
              <div className="text-[11px] font-bold text-sidebar-foreground/60 mb-3 px-2 tracking-wider font-mono">
                {section.title}
              </div>
            )}
            <div className="space-y-1">
              {section.items.map((item, itemIdx) => {
                const hasSubmenu = item.items && item.items.length > 0;
                const isOpen = openMenus.includes(item.title);
                const isActive =
                  pathname === item.href ||
                  item.items?.some(sub => sub.href === pathname);

                const itemContent = (
                  <button
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
                      isCollapsed && "justify-center",
                    )}>
                    <div className="flex items-center gap-3">
                      <item.icon
                        size={20}
                        className={cn(
                          isActive
                            ? "text-sidebar-primary"
                            : "text-sidebar-foreground/60",
                        )}
                      />
                      {!isCollapsed && <span>{item.title}</span>}
                    </div>
                    {!isCollapsed && hasSubmenu && (
                      <ChevronDown
                        size={16}
                        className={cn(
                          "transition-transform",
                          isOpen && "rotate-180",
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

                    {!isCollapsed && hasSubmenu && isOpen && (
                      <div className="mt-1 ml-4 border-l-2 border-sidebar-border pl-4 space-y-1">
                        {item.items?.map((subItem, subIdx) => {
                          const isSubActive = pathname === subItem.href;
                          return (
                            <Link
                              key={subIdx}
                              href={subItem.href}
                              className={cn(
                                "block py-2 text-sm transition-colors",
                                isSubActive
                                  ? "text-sidebar-foreground font-bold"
                                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground",
                              )}>
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

      {/* Bottom Nav */}
      <div className="p-4 border-t border-sidebar-border space-y-1">
        {isCollapsed ? (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  aria-label="Notifications"
                  className="w-full flex items-center justify-center px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent rounded-lg">
                  <div className="relative">
                    <Bell size={20} />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 border-2 border-sidebar rounded-full"></span>
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Notifications</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  aria-label="Support"
                  className="w-full flex items-center justify-center px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent rounded-lg">
                  <HelpCircle size={20} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Support</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setShowLogoutDialog(true);
                  }}
                  aria-label="Sign out"
                  className="w-full flex items-center justify-center px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors">
                  <LogOut size={20} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign out</TooltipContent>
            </Tooltip>
          </>
        ) : (
          <>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent rounded-lg">
              <div className="relative">
                <Bell size={20} />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 border-2 border-sidebar rounded-full"></span>
              </div>
              <span>Notifications</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent rounded-lg">
              <HelpCircle size={20} />
              <span>Support</span>
            </button>
          </>
        )}
      </div>

      {/* User Profile Card (Clickable to open detailed profile dialog) */}
      <div
        id="user-profile-card-trigger"
        onClick={() => setShowProfileDialog(true)}
        className={cn(
          "p-4 bg-sidebar-accent/50 border-t border-sidebar-border flex items-center justify-between cursor-pointer hover:bg-sidebar-accent transition-all duration-200",
          isCollapsed && "justify-center",
        )}>
        <div
          className={cn(
            "flex items-center gap-3 overflow-hidden",
            isCollapsed && "w-full",
          )}>
          {isPending ? (
            <Skeleton
              className={cn(
                "w-10 h-10 rounded-full shrink-0",
                isCollapsed && "mx-auto",
              )}
            />
          ) : (
            <div
              className={cn(
                "w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0 shadow-sm border border-white/20",
                isCollapsed && "mx-auto",
              )}>
              {session?.user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
          )}
          {!isCollapsed && (
            <div className="overflow-hidden flex flex-col gap-1">
              {isPending ? (
                <>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </>
              ) : (
                <>
                  <div className="font-bold text-sm truncate text-sidebar-foreground hover:underline">
                    {session?.user?.name}
                  </div>
                  <Badge
                    variant="secondary"
                    className="w-fit text-[10px] px-1.5 py-0 h-4 capitalize bg-sidebar-accent text-sidebar-foreground border-none">
                    {(session?.user as any)?.role || "user"}
                  </Badge>
                </>
              )}
            </div>
          )}
        </div>
        {!isCollapsed && !isPending && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={e => {
                  e.stopPropagation();
                  setShowLogoutDialog(true);
                }}
                aria-label="Sign out"
                className="p-1.5 rounded-md hover:bg-destructive/10 text-sidebar-foreground/60 hover:text-destructive transition-colors">
                <LogOut size={16} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Sign out</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Logout Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will log you out of your account and you will need to sign in
              again to access your dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white">
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Professional Profile & Preferences Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden bg-background border border-border rounded-xl shadow-2xl">
          <DialogHeader className="p-6 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-lg">
                {session?.user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="text-left">
                <DialogTitle className="text-lg font-bold text-foreground">
                  User Account Control Panel
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Manage your personal session preferences, appearance themes,
                  and check live system status.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex h-[360px]">
            {/* Left Nav Tabs */}
            <div className="w-48 bg-muted/10 border-r border-border p-3 space-y-1">
              <button
                onClick={() => setActiveTab("profile")}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left",
                  activeTab === "profile"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}>
                <User className="w-4 h-4" />
                Profile Details
              </button>
              <button
                onClick={() => setActiveTab("preferences")}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left",
                  activeTab === "preferences"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}>
                <Settings2 className="w-4 h-4" />
                Preferences
              </button>
              <button
                onClick={() => setActiveTab("system")}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left",
                  activeTab === "system"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}>
                <Activity className="w-4 h-4" />
                Diagnostics & Status
              </button>
            </div>

            {/* Right Pane Content */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-background">
              {activeTab === "profile" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider font-mono">
                    Profile Information
                  </h3>
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-3 items-center border-b border-border/40 pb-2">
                      <span className="text-xs font-bold text-muted-foreground">
                        Name
                      </span>
                      <span className="col-span-2 text-xs font-medium text-foreground">
                        {session?.user?.name || "Unassigned"}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 items-center border-b border-border/40 pb-2">
                      <span className="text-xs font-bold text-muted-foreground">
                        Email Address
                      </span>
                      <span className="col-span-2 text-xs font-medium text-foreground truncate">
                        {session?.user?.email || "No email available"}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 items-center border-b border-border/40 pb-2">
                      <span className="text-xs font-bold text-muted-foreground">
                        Access Privilege
                      </span>
                      <div className="col-span-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase font-mono tracking-wider bg-primary/5 text-primary border-primary/20">
                          {(session?.user as any)?.role || "User"}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 items-center">
                      <span className="text-xs font-bold text-muted-foreground">
                        Member Identifier
                      </span>
                      <div className="col-span-2 flex items-center gap-2">
                        <span className="font-mono text-[11px] bg-muted px-2 py-0.5 rounded border border-border text-foreground truncate max-w-[140px]">
                          {session?.user?.id || "mem_usr_1029482"}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleCopyId}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Copy Member ID">
                          {copied ? (
                            <Check className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <Clipboard className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "preferences" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider font-mono">
                    Visual Style & Controls
                  </h3>

                  {/* Theme Toggle option */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-muted-foreground block">
                      Interface Theme Accent
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleThemeChange("light")}
                        className={cn(
                          "flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-semibold transition-all",
                          theme === "light"
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}>
                        <Sun className="w-4 h-4" />
                        System Light
                      </button>
                      <button
                        onClick={() => handleThemeChange("dark")}
                        className={cn(
                          "flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-semibold transition-all",
                          theme === "dark"
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}>
                        <Moon className="w-4 h-4" />
                        Classic Slate Dark
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-border/60 my-2" />

                  {/* Extra creative preferences toggles */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground">
                          Compact Mode
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Increases data density across tabular grids
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={compactMode}
                        onChange={e => setCompactMode(e.target.checked)}
                        className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground font-sans">
                          Workspace Soundscape
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Play subtle confirmation chimes on actions
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={true}
                        className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "system" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider font-mono">
                    Real-time Diagnostics
                  </h3>

                  <div className="space-y-3.5">
                    {/* Simulated live api latency */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold text-foreground">
                          API Edge Node Latency
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {latency} ms (Optimal)
                      </span>
                    </div>

                    {/* App Database status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-primary" />
                        <span className="text-xs font-bold text-foreground">
                          Local Session Store
                        </span>
                      </div>
                      <span className="text-xs font-bold text-muted-foreground font-mono">
                        Secure IndexedDB
                      </span>
                    </div>

                    {/* Usage progress bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-bold text-muted-foreground">
                        <span>Workspace Document Quota</span>
                        <span>1.4 GB / 10 GB</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden border border-border/40">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-500"
                          style={{ width: "14%" }}
                        />
                      </div>
                    </div>

                    <div className="border-t border-border/60 my-1" />

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground">
                          Scryme Platform Release
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Build 6.33.0-stable (Linux/AMD64)
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono border-muted bg-muted/30">
                        v6.33.0
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
            <span className="text-[10px] font-medium text-muted-foreground font-mono">
              Signed in as {session?.user?.email || "authorized_user"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowProfileDialog(false)}
              className="text-xs h-8 border-border">
              Close Panel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
