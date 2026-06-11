"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  CalendarDays,
  BedDouble,
  ShoppingCart,
  Users,
  UserSquare2,
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
  ArrowLeftRight,
  ShieldCheck,
  FileText,
  Zap,
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
        items: [],
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
        ],
      },
      {
        title: "Stocking",
        icon: TrendingUp,
        href: "/stocking",
        items: [
          { title: "Stocking List", href: "/stocking/list" },
          { title: "Dashboard", href: "/stocking" },
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
    items: [
      { title: "Workflows", icon: Zap, href: "/workflows" },
    ],
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
      { title: "Settings", icon: Settings, href: "/settings" },
    ],
  },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<string[]>(["Report"]);
  const pathname = usePathname();

  const toggleSubmenu = (title: string) => {
    setOpenMenus((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title],
    );
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-screen border-r bg-white transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[80px]" : "w-[280px]",
      )}
    >
      {/* Brand Header */}
      <div
        className={cn(
          "flex items-center h-[80px] px-6",
          isCollapsed ? "flex-col justify-center gap-2" : "justify-between",
        )}
      >
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#34A853] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <span className="font-bold text-xl text-[#1D1D1F]">
                Scryme <sup className="text-[10px] font-medium">TM</sup>
              </span>
            </div>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label="Collapse sidebar"
              className="p-1.5 rounded-md border bg-white hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label="Expand sidebar"
              className="p-1.5 rounded-md border bg-white hover:bg-gray-50 transition-colors"
            >
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
              <div className="text-[11px] font-bold text-gray-400 mb-3 px-2 tracking-wider">
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
                    onClick={() =>
                      hasSubmenu && !isCollapsed
                        ? toggleSubmenu(item.title)
                        : null
                    }
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors",
                      isActive
                        ? "text-[#34A853] bg-[#34A853]/5 font-medium"
                        : "text-gray-500 hover:bg-gray-50",
                      isCollapsed && "justify-center",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon
                        size={20}
                        className={cn(
                          isActive ? "text-[#34A853]" : "text-gray-400",
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
                        <TooltipContent side="right">{item.title}</TooltipContent>
                      </Tooltip>
                    ) : (
                      itemContent
                    )}

                    {!isCollapsed && hasSubmenu && isOpen && (
                      <div className="mt-1 ml-4 border-l-2 border-gray-100 pl-4 space-y-1">
                        {item.items?.map((subItem, subIdx) => {
                          const isSubActive = pathname === subItem.href;
                          return (
                            <Link
                              key={subIdx}
                              href={subItem.href}
                              className={cn(
                                "block py-2 text-sm transition-colors",
                                isSubActive
                                  ? "text-[#1D1D1F] font-bold"
                                  : "text-gray-500 hover:text-gray-800",
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

      {/* Bottom Nav */}
      <div className="p-4 border-t space-y-1">
        {isCollapsed ? (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  aria-label="Notifications"
                  className="w-full flex items-center justify-center px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg"
                >
                  <div className="relative">
                    <Bell size={20} />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Notifications</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  aria-label="Support"
                  className="w-full flex items-center justify-center px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg"
                >
                  <HelpCircle size={20} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Support</TooltipContent>
            </Tooltip>
          </>
        ) : (
          <>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg">
              <div className="relative">
                <Bell size={20} />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
              </div>
              <span>Notifications</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg">
              <HelpCircle size={20} />
              <span>Support</span>
            </button>
          </>
        )}
      </div>

      {/* User Profile */}
      <div className="p-4 bg-gray-50 border-t flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center font-bold flex-shrink-0">
            N
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <div className="font-bold text-sm truncate text-[#1D1D1F]">
                Rahat Ali
              </div>
              <div className="text-[11px] text-gray-500 truncate">
                Super Admin
              </div>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <LogOut size={16} className="text-gray-400 cursor-pointer" />
        )}
      </div>
    </aside>
  );
}
