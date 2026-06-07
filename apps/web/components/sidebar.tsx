'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  CalendarDays,
  BedDouble,
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
  Package
} from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';

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
        title: "Reservation",
        icon: CalendarDays,
        href: "/reservation",
        items: []
      },
      { title: "Room Operation", icon: BedDouble, href: "/rooms" },
      {
        title: "Manage Staff",
        icon: Users,
        href: "/staff",
        items: []
      },
      {
        title: "Manage Guests",
        icon: UserSquare2,
        href: "/guests",
        items: []
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
        ]
      },
      { title: "Integrations", icon: Boxes, href: "/integrations" },
    ]
  },
  {
    title: "ACCOUNTING",
    items: [
      {
        title: "Report",
        icon: FileBarChart,
        href: "/",
        items: [
          { title: "Overview", href: "/report/overview" },
          { title: "Booking Report", href: "/report/booking" },
          { title: "Purchase Report", href: "/" },
        ]
      },
      { title: "Maintenance", icon: Settings, href: "/maintenance" },
    ]
  }
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<string[]>(['Report']);
  const pathname = usePathname();

  const toggleSubmenu = (title: string) => {
    setOpenMenus(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-screen border-r bg-white transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[80px]" : "w-[280px]"
      )}
    >
      {/* Brand Header */}
      <div className={cn(
        "flex items-center h-[80px] px-6",
        isCollapsed ? "flex-col justify-center gap-2" : "justify-between"
      )}>
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#34A853] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <span className="font-bold text-xl text-[#1D1D1F]">Fixoria <sup className="text-[10px] font-medium">TM</sup></span>
            </div>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-md border bg-white hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-md border bg-white hover:bg-gray-50 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
            <div className="w-8 h-8 bg-[#34A853] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">F</span>
            </div>
          </>
        )}
      </div>

      {/* Org Switcher */}
      {!isCollapsed && (
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between p-3 border rounded-xl bg-white hover:bg-gray-50 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-medium">
                G
              </div>
              <div>
                <div className="font-semibold text-sm">Grand Sylhet Hotel</div>
                <div className="text-[11px] text-gray-500 uppercase font-medium">3 ADMIN ADDED</div>
              </div>
            </div>
            <ChevronDown size={16} className="text-gray-400" />
          </div>
        </div>
      )}

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
                const isActive = pathname === item.href || item.items?.some(sub => sub.href === pathname);

                return (
                  <div key={itemIdx}>
                    <button
                      onClick={() => hasSubmenu && !isCollapsed ? toggleSubmenu(item.title) : null}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors",
                        isActive ? "text-[#34A853] bg-[#34A853]/5 font-medium" : "text-gray-500 hover:bg-gray-50",
                        isCollapsed && "justify-center"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={20} className={cn(isActive ? "text-[#34A853]" : "text-gray-400")} />
                        {!isCollapsed && <span>{item.title}</span>}
                      </div>
                      {!isCollapsed && hasSubmenu && (
                        <ChevronDown
                          size={16}
                          className={cn("transition-transform", isOpen && "rotate-180")}
                        />
                      )}
                    </button>

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
                                isSubActive ? "text-[#1D1D1F] font-bold" : "text-gray-500 hover:text-gray-800"
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
        <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg">
          <div className="relative">
            <Bell size={20} />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
          </div>
          {!isCollapsed && <span>Notifications</span>}
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg">
          <HelpCircle size={20} />
          {!isCollapsed && <span>Support</span>}
        </button>
      </div>

      {/* User Profile */}
      <div className="p-4 bg-gray-50 border-t flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-full bg-[#1D1D1F] text-white flex items-center justify-center font-bold flex-shrink-0">
            N
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <div className="font-bold text-sm truncate text-[#1D1D1F]">Rahat Ali</div>
              <div className="text-[11px] text-gray-500 truncate">Super Admin</div>
            </div>
          )}
        </div>
        {!isCollapsed && <LogOut size={16} className="text-gray-400 cursor-pointer" />}
      </div>
    </aside>
  );
}
