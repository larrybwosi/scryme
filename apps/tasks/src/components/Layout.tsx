import React, { useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Users,
  UserCheck,
  CalendarDays,
  Clock,
  Tag as TagIcon,
  Activity,
  CalendarOff,
  FileText,
  CreditCard,
  Search,
  Plus,
  Bell,
  ChevronDown,
  Sparkles,
  Menu,
  X,
  RotateCcw
} from 'lucide-react';
import { taskStore } from '../lib/store';

export default function Layout({ children }: { children?: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare, badge: '11' },
    { name: 'Projects', path: '/projects', icon: FolderKanban, count: '8' },
    { name: 'Clients', path: '/clients', icon: Users, count: '8' },
    { name: 'Teams', path: '/teams', icon: UserCheck },
    { name: 'Schedule', path: '/schedule', icon: CalendarDays },
    { name: 'Time tracker', path: '/time-tracker', icon: Clock },
    { name: 'Tags', path: '/tags', icon: TagIcon },
    { name: 'Activity', path: '/activity', icon: Activity },
    { name: 'Time off', path: '/time-off', icon: CalendarOff },
    { name: 'Invoices', path: '/invoices', icon: FileText },
    { name: 'Expenses', path: '/expenses', icon: CreditCard },
  ];

  const pathname = location.pathname;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col md:flex-row antialiased font-sans">
      {/* Mobile Top Navbar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
            T
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">Taskifity</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="font-bold text-slate-900 dark:text-white text-base tracking-tight leading-none">
                Taskifity
              </div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                Local-First Workspace
              </div>
            </div>
          </div>
          <button
            onClick={() => taskStore.resetStateToSeed()}
            title="Reset data to initial screenshot seed"
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Global Search Bar in Sidebar */}
        <div className="px-3 py-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-8 pr-7 py-1.5 bg-slate-100 dark:bg-slate-800 text-xs rounded-lg border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 transition-all outline-none"
            />
            <span className="absolute right-2 top-2 text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1 py-0.5 rounded font-mono">
              ⌘K
            </span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.path) || (item.path === '/tasks' && pathname === '/');

            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
                {item.count && (
                  <span className="text-slate-400 text-[11px] font-normal">
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User / Workspace Switcher Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-7 w-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs ring-1 ring-slate-200 dark:ring-slate-700 shrink-0">
                SS
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                  Snazzy Studio
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  @snazzystudioco
                </div>
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200/80 dark:border-slate-800 px-6 flex items-center justify-between">
          {/* Breadcrumbs or Page Category */}
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="text-slate-400">Project Management</span>
            <span>/</span>
            <span className="text-slate-900 dark:text-white font-semibold capitalize">
              {pathname.replace('/', '').replace('-', ' ') || 'Tasks'}
            </span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button className="h-8 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors">
              <Plus className="h-3.5 w-3.5" />
              <span>Create Task</span>
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <Bell className="h-4 w-4" />
            </button>
            <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center text-xs font-bold border border-slate-300 dark:border-slate-600">
              JS
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
