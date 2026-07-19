'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authClient, useSession } from '../lib/auth-client';
import { getCurrentMember } from '../app/actions/auth';
import {
  LayoutDashboard,
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
  ChevronRight,
  Zap,
  UserPlus,
  Search,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';

interface NavItem {
  title: string;
  icon: React.ElementType;
  href: string;
  badge?: string | number;
}

interface NavGroup {
  title: string;
  items: NavItem[];
  collapsible?: boolean;
}

const navGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { title: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    ],
  },
  {
    title: 'Sales',
    items: [
      { title: 'Leads', icon: UserPlus, href: '/leads' },
      { title: 'Pipeline', icon: TrendingUp, href: '/pipeline' },
      { title: 'Customers', icon: Users, href: '/customers' },
    ],
  },
  {
    title: 'Directory',
    items: [
      { title: 'Contacts', icon: Contact, href: '/contacts' },
      { title: 'Companies', icon: Building2, href: '/companies' },
    ],
  },
  {
    title: 'Marketing',
    collapsible: true,
    items: [
      { title: 'Campaigns', icon: Megaphone, href: '/campaigns' },
      { title: 'Segments', icon: Layers, href: '/campaigns/segments' },
      { title: 'Workflows', icon: GitBranch, href: '/campaigns/workflows' },
    ],
  },
  {
    title: 'Insights',
    items: [
      { title: 'Reports', icon: BarChart3, href: '/reports' },
      { title: 'Activities', icon: Activity, href: '/activities' },
    ],
  },
];

function NavItemLink({
  item,
  isCollapsed,
  isActive,
}: {
  item: NavItem;
  isCollapsed: boolean;
  isActive: boolean;
}) {
  return (
    <Link
      href={item.href}
      title={isCollapsed ? item.title : undefined}
      className={cn(
        'relative flex items-center gap-2.5 px-3 py-[7px] rounded-md text-[13px] transition-all duration-150 group/item',
        isActive
          ? 'nav-item-active'
          : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/5'
      )}
    >
      <item.icon
        size={15}
        className={cn(
          'flex-shrink-0 transition-colors',
          isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/50 group-hover/item:text-sidebar-foreground/80'
        )}
      />
      {!isCollapsed && (
        <>
          <span className="truncate leading-none">{item.title}</span>
          {item.badge !== undefined && (
            <span className="ml-auto bg-sidebar-primary/20 text-sidebar-primary text-[10px] font-bold px-1.5 py-0.5 rounded min-w-[18px] text-center">
              {item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
}

function CollapsibleGroup({
  group,
  isCollapsed,
  pathname,
}: {
  group: NavGroup;
  isCollapsed: boolean;
  pathname: string;
}) {
  const isAnyActive = group.items.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
  );
  const [isOpen, setIsOpen] = useState(isAnyActive);

  if (!group.collapsible) {
    return (
      <div className="mb-4">
        {!isCollapsed && (
          <div className="px-3 mb-1">
            <span className="text-[10px] font-semibold text-sidebar-foreground/35 uppercase tracking-[0.08em]">
              {group.title}
            </span>
          </div>
        )}
        {isCollapsed && <div className="h-px bg-sidebar-border/40 mx-3 mb-2" />}
        <div className="space-y-px">
          {group.items.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <NavItemLink
                key={item.href}
                item={item}
                isCollapsed={isCollapsed}
                isActive={isActive}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      {!isCollapsed ? (
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="w-full flex items-center justify-between px-3 mb-1 group/toggle"
        >
          <span className="text-[10px] font-semibold text-sidebar-foreground/35 uppercase tracking-[0.08em] group-hover/toggle:text-sidebar-foreground/60 transition-colors">
            {group.title}
          </span>
          <ChevronDown
            size={11}
            className={cn(
              'text-sidebar-foreground/30 transition-transform duration-200',
              !isOpen && '-rotate-90'
            )}
          />
        </button>
      ) : (
        <div className="h-px bg-sidebar-border/40 mx-3 mb-2" />
      )}

      {(isOpen || isCollapsed) && (
        <div className="space-y-px">
          {group.items.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <NavItemLink
                key={item.href}
                item={item}
                isCollapsed={isCollapsed}
                isActive={isActive}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [member, setMember] = useState<any>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    getCurrentMember().then(setMember);
  }, []);

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push('/login');
        },
      },
    });
  };

  const displayName = member?.user?.name || session?.user?.name || 'User';
  const displayEmail = member?.user?.email || session?.user?.email || '';
  const displayRole = member?.jobTitle || (member?.role === 'OWNER' ? 'Owner' : 'Member');

  const userInitials = displayName
    ? displayName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : 'U';

  return (
    <aside
      className={cn(
        'flex flex-col h-screen border-r border-sidebar-border bg-sidebar transition-[width] duration-250 ease-in-out relative flex-shrink-0 select-none',
        isCollapsed ? 'w-[56px]' : 'w-[228px]'
      )}
    >
      {/* Brand Header */}
      <div
        className={cn(
          'flex items-center h-[52px] border-b border-sidebar-border px-3 flex-shrink-0',
          isCollapsed ? 'justify-center' : 'gap-2.5'
        )}
      >
        <div className="w-7 h-7 bg-primary rounded-[6px] flex items-center justify-center flex-shrink-0 shadow-sm">
          <Zap size={14} className="text-primary-foreground" fill="currentColor" />
        </div>
        {!isCollapsed && (
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="font-bold text-[14px] text-sidebar-foreground tracking-tight truncate">
              Scryme
            </span>
            <span className="text-[9px] font-bold text-primary bg-primary/15 px-1.5 py-0.5 rounded uppercase tracking-wide flex-shrink-0">
              CRM
            </span>
          </div>
        )}
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="ml-auto p-1 rounded-md text-sidebar-foreground/40 hover:text-sidebar-foreground/70 hover:bg-white/5 transition-colors"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose size={14} />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center justify-center h-9 mx-2 mt-2 rounded-md text-sidebar-foreground/40 hover:text-sidebar-foreground/70 hover:bg-white/5 transition-colors"
          aria-label="Expand sidebar"
        >
          <PanelLeftOpen size={14} />
        </button>
      )}

      {/* Search shortcut */}
      {!isCollapsed && (
        <div className="px-3 py-2 flex-shrink-0">
          <button className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/8 border border-sidebar-border/50 transition-colors text-left">
            <Search size={12} className="text-sidebar-foreground/35 flex-shrink-0" />
            <span className="text-[11.5px] text-sidebar-foreground/35 flex-1">Search...</span>
            <kbd className="text-[9px] text-sidebar-foreground/25 bg-white/5 px-1 py-0.5 rounded border border-sidebar-border/30 leading-none">
              ⌘K
            </kbd>
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav
        className="flex-1 overflow-y-auto custom-scrollbar py-2 px-3 space-y-0"
        aria-label="Main navigation"
      >
        {navGroups.map((group) => (
          <CollapsibleGroup
            key={group.title}
            group={group}
            isCollapsed={isCollapsed}
            pathname={pathname}
          />
        ))}
      </nav>

      {/* Bottom Utilities */}
      <div className="border-t border-sidebar-border px-3 py-2 space-y-px flex-shrink-0">
        {[
          { icon: Bell, label: 'Notifications', dot: true },
          { icon: Settings, label: 'Settings' },
          { icon: HelpCircle, label: 'Help & Support' },
        ].map(({ icon: Icon, label, dot }) => (
          <button
            key={label}
            title={isCollapsed ? label : undefined}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-[7px] rounded-md text-[13px] text-sidebar-foreground/55 hover:text-sidebar-foreground/80 hover:bg-white/5 transition-all',
              isCollapsed && 'justify-center'
            )}
          >
            <div className="relative flex-shrink-0">
              <Icon size={15} />
              {dot && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-destructive rounded-full" />
              )}
            </div>
            {!isCollapsed && <span className="leading-none">{label}</span>}
          </button>
        ))}
      </div>

      {/* User Profile */}
      <div
        className={cn(
          'border-t border-sidebar-border p-3 flex items-center gap-2.5 flex-shrink-0',
          isCollapsed && 'justify-center p-2.5'
        )}
      >
        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-[11px] flex-shrink-0 ring-2 ring-primary/20">
          {userInitials}
        </div>
        {!isCollapsed && (
          <>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-sidebar-foreground/85 truncate leading-none">
                {displayName}
              </div>
              <div className="text-[10px] text-sidebar-foreground/40 mt-1 leading-none truncate">
                {displayEmail}
              </div>
              <div className="text-[10px] text-primary/70 mt-0.5 leading-none truncate font-medium">
                {displayRole}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1 rounded-md hover:bg-white/8 transition-colors"
              aria-label="Log out"
            >
              <LogOut size={13} className="text-sidebar-foreground/40" />
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
