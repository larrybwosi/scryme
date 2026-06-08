'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Users,
  TrendingUp,
  Building2,
  Contact,
  BarChart3,
  Activity,
  Megaphone,
  GitBranch,
  Settings,
  Bell,
  HelpCircle,
  LogOut,
  ChevronDown,
  Zap,
} from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';

interface SidebarItem {
  title: string;
  icon: React.ElementType;
  href: string;
  badge?: string | number;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

const sidebarConfig: SidebarSection[] = [
  {
    title: 'CRM',
    items: [
      { title: 'Customers', icon: Users, href: '/customers' },
      { title: 'Pipeline', icon: TrendingUp, href: '/pipeline' },
      { title: 'Contacts', icon: Contact, href: '/contacts' },
      { title: 'Companies', icon: Building2, href: '/companies' },
      {
        title: 'Campaigns',
        icon: Megaphone,
        href: '/campaigns',
      },
      { title: 'Segments', icon: Users, href: '/campaigns/segments' },
      { title: 'Workflows', icon: GitBranch, href: '/campaigns/workflows' },
    ],
  },
  {
    title: 'ANALYTICS',
    items: [
      { title: 'Reports', icon: BarChart3, href: '/reports' },
      { title: 'Activities', icon: Activity, href: '/activities' },
    ],
  },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'flex flex-col h-screen border-r border-border bg-sidebar transition-all duration-300 ease-in-out relative flex-shrink-0',
        isCollapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Brand Header */}
      <div
        className={cn(
          'flex items-center h-[64px] px-4 border-b border-border',
          isCollapsed ? 'justify-center' : 'justify-between'
        )}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap size={16} className="text-primary-foreground" fill="currentColor" />
            </div>
            <div>
              <span className="font-bold text-[15px] text-sidebar-foreground tracking-tight">
                Scryme
              </span>
              <span className="ml-1.5 text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-sm">
                CRM
              </span>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-primary-foreground" fill="currentColor" />
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-[44px] z-20 w-6 h-6 rounded-full border border-border bg-card shadow-sm flex items-center justify-center hover:bg-accent transition-colors"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? (
          <ChevronRight size={12} className="text-muted-foreground" />
        ) : (
          <ChevronLeft size={12} className="text-muted-foreground" />
        )}
      </button>

      {/* Org Switcher */}
      {!isCollapsed && (
        <div className="px-3 py-3 border-b border-border">
          <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-accent hover:bg-accent/80 transition-colors text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-primary/15 flex items-center justify-center text-primary font-semibold text-xs flex-shrink-0">
                SC
              </div>
              <div>
                <div className="text-[12.5px] font-semibold text-sidebar-foreground">
                  Scryme Corp
                </div>
                <div className="text-[10.5px] text-muted-foreground">Enterprise Plan</div>
              </div>
            </div>
            <ChevronDown size={14} className="text-muted-foreground" />
          </button>
        </div>
      )}
      {isCollapsed && (
        <div className="px-3 py-3 border-b border-border flex justify-center">
          <div className="w-7 h-7 rounded-md bg-primary/15 flex items-center justify-center text-primary font-semibold text-xs">
            SC
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav
        className="flex-1 overflow-y-auto custom-scrollbar py-3 px-3"
        aria-label="Main navigation"
      >
        {sidebarConfig.map((section) => (
          <div key={section.title} className="mb-5">
            {!isCollapsed && (
              <div className="text-[10px] font-bold text-muted-foreground/70 mb-1.5 px-2 tracking-widest uppercase">
                {section.title}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? item.title : undefined}
                    className={cn(
                      'flex items-center gap-3 px-2.5 py-2 rounded-lg text-[13px] transition-colors',
                      isCollapsed ? 'justify-center' : '',
                      isActive
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                    )}
                  >
                    <item.icon
                      size={17}
                      className={cn(
                        'flex-shrink-0',
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      )}
                    />
                    {!isCollapsed && (
                      <span className="truncate">{item.title}</span>
                    )}
                    {!isCollapsed && item.badge !== undefined && (
                      <span className="ml-auto bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Utilities */}
      <div className="border-t border-border px-3 py-2 space-y-0.5">
        <button
          className={cn(
            'w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-[13px] text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors',
            isCollapsed && 'justify-center'
          )}
        >
          <div className="relative flex-shrink-0">
            <Bell size={17} className="text-muted-foreground" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-destructive rounded-full border border-sidebar" />
          </div>
          {!isCollapsed && <span>Notifications</span>}
        </button>
        <button
          className={cn(
            'w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-[13px] text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors',
            isCollapsed && 'justify-center'
          )}
        >
          <Settings size={17} className="text-muted-foreground flex-shrink-0" />
          {!isCollapsed && <span>Settings</span>}
        </button>
        <button
          className={cn(
            'w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-[13px] text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors',
            isCollapsed && 'justify-center'
          )}
        >
          <HelpCircle size={17} className="text-muted-foreground flex-shrink-0" />
          {!isCollapsed && <span>Help & Support</span>}
        </button>
      </div>

      {/* User Profile */}
      <div
        className={cn(
          'border-t border-border p-3 flex items-center',
          isCollapsed ? 'justify-center' : 'justify-between gap-2'
        )}
      >
        <div className={cn('flex items-center gap-2.5 overflow-hidden', isCollapsed && 'justify-center')}>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs flex-shrink-0">
            MR
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <div className="text-[12.5px] font-semibold text-sidebar-foreground truncate">
                Marcus Reid
              </div>
              <div className="text-[10.5px] text-muted-foreground truncate">Account Manager</div>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <button className="p-1.5 rounded-md hover:bg-sidebar-accent transition-colors" aria-label="Log out">
            <LogOut size={15} className="text-muted-foreground" />
          </button>
        )}
      </div>
    </aside>
  );
}
