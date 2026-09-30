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
  Search,
  Plus,
  Bell,
  Sparkles,
  Menu,
  X,
  RotateCcw,
  Settings2
} from 'lucide-react';
import { taskStore, useTaskStore } from '../lib/store';
import { useSession } from '../lib/auth-client';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Badge } from '@repo/ui/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@repo/ui/components/ui/avatar';

export default function Layout({ children }: { children?: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { data: session } = useSession();

  const tasks = useTaskStore((state) => state.tasks);
  const projects = useTaskStore((state) => state.projects);
  const clients = useTaskStore((state) => state.clients);
  const teamMembers = useTaskStore((state) => state.teamMembers);

  const displayName = session?.user?.name || 'User';
  const displayEmail = session?.user?.email || 'user@scryme.tech';
  const userImage = session?.user?.image;

  const userInitials = displayName
    ? displayName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : 'U';

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare, badge: String(tasks.length) },
    { name: 'Projects', path: '/projects', icon: FolderKanban, count: String(projects.length) },
    { name: 'Clients', path: '/clients', icon: Users, count: String(clients.length) },
    { name: 'Teams', path: '/teams', icon: UserCheck, count: String(teamMembers.length) },
    { name: 'Schedule', path: '/schedule', icon: CalendarDays },
    { name: 'Time tracker', path: '/time-tracker', icon: Clock },
    { name: 'Tags', path: '/tags', icon: TagIcon },
    { name: 'Activity', path: '/activity', icon: Activity },
    { name: 'Time off', path: '/time-off', icon: CalendarOff },
  ];

  const pathname = location.pathname;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row antialiased font-sans">
      {/* Mobile Top Navbar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-background border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
            T
          </div>
          <span className="font-bold text-lg tracking-tight text-foreground">Taskifity</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-muted-foreground"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
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
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border flex flex-col transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="font-bold text-foreground text-base tracking-tight leading-none">
                Taskifity
              </div>
              <div className="text-[10px] text-muted-foreground font-medium mt-0.5">
                Enterprise Workspace
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => taskStore.syncWithApi()}
            title="Refresh workspace data from API"
            className="h-7 w-7 text-muted-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Global Search Bar in Sidebar */}
        <div className="px-3 py-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search..."
              className="pl-8 text-xs h-8 bg-muted/50 border-transparent focus-visible:ring-1"
            />
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
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                    {item.badge}
                  </Badge>
                )}
                {item.count && (
                  <span className="text-muted-foreground text-[11px] font-normal">
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Footer Card */}
        <div className="p-3 border-t border-border">
          <div
            className="w-full flex items-center gap-2.5 p-2 rounded-lg bg-muted/40 hover:bg-muted border border-border transition-colors cursor-pointer group"
            title="User Info & Preferences"
          >
            <Avatar className="h-8 w-8 border border-border shrink-0 ring-2 ring-indigo-500/20 group-hover:ring-indigo-500 transition-all">
              {userImage ? (
                <AvatarImage src={userImage} alt={displayName} />
              ) : null}
              <AvatarFallback className="bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-xs font-bold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-foreground truncate leading-tight">
                {displayName}
              </div>
              <div className="text-[10px] text-muted-foreground truncate leading-none mt-0.5">
                {displayEmail}
              </div>
            </div>
            <Settings2 className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-14 bg-background/80 backdrop-blur border-b border-border px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <span>Project Management</span>
            <span>/</span>
            <span className="text-foreground font-semibold capitalize">
              {pathname.replace('/', '').replace('-', ' ') || 'Tasks'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button size="sm" asChild className="gap-1.5 text-xs h-8">
              <Link to="/tasks">
                <Plus className="h-3.5 w-3.5" />
                <span>Create Task</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <Bell className="h-4 w-4" />
            </Button>
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
