import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router';
import {
  BarChart3,
  BookOpen,
  File,
  Clock,
  Package,
  PieChart,
  Users,
  Settings,
  Menu,
  ChevronLeft,
  ChevronRight,
  Zap,
  User,
  Truck,
  WifiOff,
  Database
} from 'lucide-react';
import { UserSwitcher } from "@/components/UserSwitcher";
import { Button } from '@repo/ui/components/ui/button';
import { cn } from '@/lib/utils';
import { isOfflineMode } from '@/lib/sdk';
import { useAuth } from '@/lib/providers/auth-context';
import { BakeryAuthGuard } from '@/components/bakery/BakeryAuthGuard';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@repo/ui/components/ui/sidebar';

const navItems = [
  { id: 'overview', label: 'Overview', icon: BarChart3, path: '/' },
  { id: 'recipes', label: 'Master Recipes', icon: BookOpen, path: '/recipes' },
  { id: 'templates', label: 'Production Templates', icon: File, path: '/templates' },
  { id: 'batches', label: 'Batch Execution', icon: Clock, path: '/batches' },
  { id: 'ingredients', label: 'Inventory Management', icon: Package, path: '/ingredients' },
  { id: 'categories', label: 'Classifications', icon: PieChart, path: '/categories' },
  { id: 'bakers', label: 'Operator Matrix', icon: Users, path: '/bakers' },
  { id: 'deliveries', label: 'Delivery Tracking', icon: Truck, path: '/deliveries' },
  { id: 'settings', label: 'System Configuration', icon: Settings, path: '/settings' },
];

export function DashboardLayout() {
  const location = useLocation();
  const { user } = useAuth();

  const activeLabel = navItems.find(item =>
    item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
  )?.label || 'Dashboard';

  return (
    <SidebarProvider defaultOpen={true} forceDefaultOpen={true}>
        <div className="flex min-h-screen w-full bg-background font-sans">
          <Sidebar collapsible="none" className="border-r border-sidebar-border shadow-[1px_0_0_0_rgba(0,0,0,0.02)]">
            <SidebarHeader className="h-16 flex items-center px-6 border-b border-sidebar-border/50 bg-sidebar/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="bg-primary p-2 rounded-md">
                   <Zap className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex flex-col group-data-[collapsible=icon]:hidden overflow-hidden transition-all duration-300">
                  <span className="font-bold text-sm tracking-tight truncate">BAKERY ERP</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Production</span>
                </div>
              </div>
            </SidebarHeader>
            <UserSwitcher />

            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel className="px-4 py-2 group-data-[collapsible=icon]:hidden">Main Navigation</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navItems.map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          asChild
                          isActive={item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)}
                          tooltip={item.label}
                          className="px-4"
                        >
                          <NavLink to={item.path}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="p-4 border-t border-border/50">
               <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col group-data-[collapsible=icon]:hidden overflow-hidden">
                    <span className="text-xs font-medium truncate">{user?.name || 'System Admin'}</span>
                    <span className="text-[10px] text-muted-foreground truncate">{user?.email || 'admin@bakery.com'}</span>
                  </div>
               </div>
            </SidebarFooter>
          </Sidebar>

            <SidebarInset className="flex flex-col flex-1 min-w-0 bg-background/30">
            <header className="h-16 flex items-center justify-between px-8 border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-30">
              <div className="flex items-center gap-6">
                <SidebarTrigger className="-ml-2 hover:bg-accent/50 transition-colors sm:hidden" />
                <div className="h-4 w-px bg-border/40 hidden sm:block" />
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-semibold tracking-tight text-foreground/90">
                    Bakery
                  </h1>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                  <h2 className="text-sm font-medium text-muted-foreground">
                    {activeLabel}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-3">
                 {isOfflineMode() && (
                   <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-600 text-[10px] font-black uppercase tracking-widest shadow-sm">
                     <Database className="h-3 w-3" />
                     Local Mode
                   </div>
                 )}
                 {!window.navigator.onLine && !isOfflineMode() && (
                   <div className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive/10 border border-destructive/20 rounded-full text-destructive text-[10px] font-black uppercase tracking-widest shadow-sm">
                     <WifiOff className="h-3 w-3" />
                     Offline
                   </div>
                 )}
                 <div className="flex items-center gap-1 px-3 py-1.5 bg-muted/40 rounded-full border border-border/50 text-[11px] font-semibold text-muted-foreground">
                   <Clock className="h-3.5 w-3.5 text-primary/70" />
                   {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 </div>
              </div>
            </header>

            <main className="flex-1 p-8 overflow-auto animate-in fade-in slide-in-from-bottom-1 duration-700">
              <div className="max-w-[1600px] mx-auto space-y-8">
                <Outlet />
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
  );
}
