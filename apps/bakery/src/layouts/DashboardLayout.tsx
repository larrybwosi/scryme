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
  Sparkles,
  LogOut,
  User,
  MapPin,
  Clock,
  Briefcase
} from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import { Badge } from '@repo/ui/components/ui/badge';
import { cn } from '@/lib/utils';
import { useBakeryAuth, isStaffMode } from '@/lib/providers/auth-context';
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
  const { currentMember, clearMemberSession } = useBakeryAuth();

  const handleLogout = () => {
    clearMemberSession();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950/80 backdrop-blur-md border-r border-slate-800/80 flex flex-col justify-between shrink-0 shadow-2xl relative z-20">
        <div>
          {/* Header */}
          <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/80">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 flex items-center justify-center text-slate-950 shadow-lg shadow-orange-500/20 ring-1 ring-white/20">
              <Sparkles className="h-5 w-5 fill-slate-950" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-amber-200 via-amber-400 to-orange-400 bg-clip-text text-transparent block">
                SCRYME
              </span>
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 -mt-1 block">
                BAKERY OS
              </span>
            </div>
          </div>

          {/* Active Shift / User Indicator */}
          {currentMember && (
            <div className="mx-3 mt-4 p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-inner">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="h-7 w-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-200 truncate">
                      {currentMember.firstName} {currentMember.lastName}
                    </p>
                    <p className="text-[10px] text-amber-400/90 font-medium truncate capitalize flex items-center gap-1">
                      <Briefcase className="h-2.5 w-2.5" />
                      {currentMember.role}
                    </p>
                  </div>
                </div>
                <UserSwitcher className="shrink-0" />
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5 mt-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));

              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group relative',
                    isActive
                      ? 'bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent text-amber-300 font-semibold border border-amber-500/30 shadow-lg shadow-amber-500/5'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  )}
                >
                  <Icon className={cn(
                    'h-4 w-4 transition-transform duration-200 group-hover:scale-110',
                    isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'
                  )} />
                  <span className="truncate">{item.label}</span>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-amber-400 to-orange-500 rounded-r-full shadow-sm shadow-amber-400/50" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer / User Profile & Logout */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/50">
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-slate-400">System Ready</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="h-8 px-2.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Logout / Switch User"
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              <span className="text-xs">Exit</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-900 relative">
        {/* Top Header / Status bar */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-950/40 backdrop-blur-md px-8 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-slate-100 capitalize">
              {NAV_ITEMS.find((i) => i.path === location.pathname || (i.path !== '/' && location.pathname.startsWith(i.path)))?.label || 'Bakery Workstation'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs text-slate-300">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
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
