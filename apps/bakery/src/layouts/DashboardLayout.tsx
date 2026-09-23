import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import {
  LayoutDashboard,
  Layers,
  BookOpen,
  FileCode2,
  Users,
  Truck,
  Tags,
  Settings,
  LogOut,
  User,
  Clock,
  Briefcase
} from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/providers/auth-context';
import { UserSwitcher } from '@/components/UserSwitcher';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/' },
  { id: 'batches', label: 'Batches', icon: Layers, path: '/batches' },
  { id: 'recipes', label: 'Recipes', icon: BookOpen, path: '/recipes' },
  { id: 'templates', label: 'Templates', icon: FileCode2, path: '/templates' },
  { id: 'bakers', label: 'Staff & Shift Trading', icon: Users, path: '/bakers' },
  { id: 'deliveries', label: 'Deliveries', icon: Truck, path: '/deliveries' },
  { id: 'categories', label: 'Categories', icon: Tags, path: '/categories' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const currentMember = user;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col justify-between shrink-0 relative z-20">
        <div>
          {/* Header - Star icon removed */}
          <div className="h-16 flex items-center gap-3 px-6 border-b border-sidebar-border">
            <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-sm">
              S
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-sidebar-foreground block">
                SCRYME
              </span>
              <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground -mt-0.5 block">
                BAKERY OS
              </span>
            </div>
          </div>

          {/* Active Shift / User Indicator */}
          {currentMember && (
            <div className="mx-3 mt-4 p-3 rounded-lg bg-sidebar-accent/50 border border-sidebar-border">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="h-7 w-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-sidebar-foreground truncate">
                      {currentMember.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium truncate capitalize flex items-center gap-1">
                      <Briefcase className="h-2.5 w-2.5" />
                      {currentMember.role}
                    </p>
                  </div>
                </div>
                <div><UserSwitcher /></div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 mt-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));

              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium text-xs transition-colors group relative',
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold border border-primary/20'
                      : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent'
                  )}
                >
                  <Icon className={cn(
                    'h-4 w-4 shrink-0 transition-transform duration-150',
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-sidebar-foreground'
                  )} />
                  <span className="truncate">{item.label}</span>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-r-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer / User Profile & Logout */}
        <div className="p-3 border-t border-sidebar-border bg-sidebar">
          <div className="flex items-center justify-between p-1.5">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-muted-foreground">System Ready</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
              title="Logout / Switch User"
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              <span className="text-xs">Exit</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background relative">
        {/* Top Header / Status bar */}
        <header className="h-16 border-b border-border bg-card px-8 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-foreground capitalize">
              {NAV_ITEMS.find((i) => i.path === location.pathname || (i.path !== '/' && location.pathname.startsWith(i.path)))?.label || 'Bakery Workstation'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted border border-border text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Shift Active</span>
            </div>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <div className="flex-1 overflow-auto p-8 relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
