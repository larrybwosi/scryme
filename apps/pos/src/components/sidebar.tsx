'use client';

import { cn } from '@/lib/utils';
import {
  ShoppingBag,
  Package,
  History,
  ClipboardList,
  BarChart3,
  CreditCard,
  DollarSign,
  Table,
  Settings,
  Receipt,
  Users,
  UserCheck,
  Calculator,
  SidebarClose,
  SidebarOpen,
  Clock,
  Plus,
  Banknote,
  Wallet,
  LogOut,
  QrCode,
  LayoutGrid,
  MapPin,
  Activity,
  Box,
  Keyboard,
  Barcode,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/components/ui/avatar';
import { usePosStore } from '@/store/store';
import { useAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/store/pos-auth-store';
import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Button } from '@repo/ui/components/ui/button';
import { ScanOrderDialog } from './scan-order-dialog';
import { ShortcutsHelpDialog } from './shortcuts-help-dialog';
import { useUiStore } from '@/store/ui-store';

const routeMap: Record<string, string> = {
  order: '/',
  'create-order': '/create-order',
  'pending-transactions': '/pending-transactions',
  history: '/history',
  analytics: '/analytics',
  customers: '/customers',
  'manage-table': '/manage-tables',
  'cash-drawer': '/cash-drawer',
  'till-management': '/till-management',
  'receipt-settings': '/receipt-settings',
  'stock-acceptance': '/stock-acceptance',
  'stock-transfer': '/stock-transfer',
  'stock-request': '/stock-request',
  'kitchen-display': '/kds',
  'hub-overview': '/hub-overview',
  settings: '/settings',
  pricing: '/pricing',
  barcodes: '/barcodes',
  'petty-cash': '/petty-cash',
};

const iconMap: Record<string, any> = {
  ShoppingBag,
  Package,
  History,
  ClipboardList,
  BarChart3,
  CreditCard,
  DollarSign,
  Table,
  Users,
  UserCheck,
  Calculator,
  Clock,
  Plus,
  Receipt,
  Settings,
  LayoutGrid,
  QrCode,
  Wallet,
  Banknote,
  Activity,
  Barcode,
};

interface SidebarProps {
  onCheckout?: () => void;
}

export function Sidebar({ onCheckout }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);

  const { shortcutsHelpDialogOpen: isShortcutsOpen, setShortcutsHelpDialogOpen: setIsShortcutsOpen } = useUiStore();

  const sidebarItems = usePosStore(state => state.settings.sidebarItems.filter(item => item.enabled));
  const businessName = usePosStore(state => state.settings.businessName);
  const { deviceType, checkedInMembers, switchMember } = useAuthStore();
  const { currentMember, currentLocation } = useAuth();
  const location = useLocation();

  /**
   * Helper to check if a route is active.
   * Handles the root path exactly and sub-paths for others.
   */
  const isRouteActive = (route: string) => {
    if (route === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(route);
  };

  return (
    <>
      <div
        className={cn(
          'border-r bg-card h-screen flex flex-col transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Header Section */}
        <div className="p-6 border-b flex items-center gap-3 relative">
          {import.meta.env.MODE === 'standalone' && (
            <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" title="Standalone Mode" />
          )}
          <Link
            to="/"
            className="flex items-center gap-3 no-underline hover:opacity-80 transition-opacity overflow-hidden"
          >
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-bold text-sm">
                {(businessName || 'DL').substring(0, 2).toUpperCase()}
              </span>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-lg truncate text-foreground leading-tight">{businessName}</span>
                {currentLocation && import.meta.env.MODE !== 'standalone' && (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                    <MapPin className="w-2.5 h-2.5" />
                    <span className="truncate">{currentLocation.name}</span>
                  </div>
                )}
              </div>
            )}
          </Link>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              'absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border bg-background flex items-center justify-center hover:bg-accent transition-colors z-10 shadow-sm',
              isCollapsed && 'right-1/2 translate-x-1/2'
            )}
          >
            {isCollapsed ? <SidebarOpen className="w-4 h-4" /> : <SidebarClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {sidebarItems.map(item => {
            const Icon = iconMap[item.icon] || ShoppingBag;
            const route = routeMap[item.id] || `/${item.id}`;
            const isActive = isRouteActive(route);

            const isStandalone = import.meta.env.MODE === 'standalone';
            const businessMode = import.meta.env.VITE_BUSINESS_MODE || 'retail';

            const excludedInStandalone = [
              'stock-acceptance',
              'stock-transfer',
              'stock-request',
              'kitchen-display',
              'hub-overview',
              'pricing',
              'till-management',
              'customers',
              'manage-table',
              'analytics',
              'create-order',
            ];
            if (isStandalone && excludedInStandalone.includes(item.id)) return null;

            const restaurantOnly = ['kitchen-display', 'hub-overview', 'manage-table'];
            if (businessMode !== 'restaurant' && restaurantOnly.includes(item.id)) return null;

            return (
              <Button
                key={item.id}
                asChild
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn('w-full justify-start gap-3 mb-1', isCollapsed && 'justify-center px-0')}
                title={isCollapsed ? item.label : undefined}
              >
                <Link to={route}>
                  <Icon className={cn('w-4 h-4 shrink-0', isActive && 'text-primary')} />
                  {!isCollapsed && <span className={cn('truncate', isActive && 'font-semibold')}>{item.label}</span>}
                </Link>
              </Button>
            );
          })}

          {deviceType === 'MAIN_HUB' &&
            import.meta.env.MODE !== 'standalone' &&
            (import.meta.env.VITE_BUSINESS_MODE || 'retail') === 'restaurant' && (
              <Button
                asChild
                variant={isRouteActive('/hub-overview') ? 'secondary' : 'ghost'}
                className={cn('w-full justify-start gap-3 mb-1', isCollapsed && 'justify-center px-0')}
              >
                <Link to="/hub-overview">
                  <Activity className={cn('w-4 h-4 shrink-0', isRouteActive('/hub-overview') && 'text-primary')} />
                  {!isCollapsed && (
                    <span className={cn('truncate', isRouteActive('/hub-overview') && 'font-semibold')}>
                      Hub Overview
                    </span>
                  )}
                </Link>
              </Button>
            )}

          <div className="my-4 border-t pt-4">
            {/* Hardcoded Items with correct isActive check */}
            {import.meta.env.MODE !== 'standalone' && (
              <Button
                variant={isScanOpen ? 'secondary' : 'ghost'}
                className={cn('w-full justify-start gap-3 mb-1', isCollapsed && 'justify-center px-0')}
                onClick={() => setIsScanOpen(true)}
              >
                <QrCode className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span className="truncate">Validate Order</span>}
              </Button>
            )}

            {[
              ...(import.meta.env.MODE !== 'standalone'
                ? [
                    { id: 'pending-transactions', label: 'Pending', icon: Clock, route: '/pending-transactions' },
                    { id: 'create-order', label: 'Create Order', icon: Plus, route: '/create-order' },
                    { id: 'cash-drawer', label: 'Cash Drawer', icon: Wallet, route: '/cash-drawer' },
                  ]
                : []),
              ...(import.meta.env.MODE === 'standalone'
                ? [{ id: 'product-management', label: 'Products', icon: Box, route: '/product-management' }]
                : []),
            ].map(item => {
              const isActive = isRouteActive(item.route);
              return (
                <Button
                  key={item.id}
                  asChild
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn('w-full justify-start gap-3 mb-1', isCollapsed && 'justify-center px-0')}
                >
                  <Link to={item.route}>
                    <item.icon className={cn('w-4 h-4 shrink-0', isActive && 'text-primary')} />
                    {!isCollapsed && <span className={cn('truncate', isActive && 'font-semibold')}>{item.label}</span>}
                  </Link>
                </Button>
              );
            })}
          </div>
        </nav>

        {/* Footer / Settings Section */}
        <div className="p-4 border-t space-y-2">
          <Button
            variant="ghost"
            className={cn('w-full justify-start gap-3 mb-1', isCollapsed && 'justify-center px-0')}
            onClick={() => setIsShortcutsOpen(true)}
          >
            <Keyboard className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="truncate">Shortcuts Help</span>}
          </Button>

          {[
            { route: '/receipt-settings', label: 'Receipt Settings', icon: Receipt },
            { route: '/settings', label: 'Settings', icon: Settings },
          ].map(({ route, label, icon: Icon }) => {
            const isActive = isRouteActive(route);
            return (
              <Button
                key={route}
                asChild
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn('w-full justify-start gap-3', isCollapsed && 'justify-center px-0')}
              >
                <Link to={route}>
                  <Icon className={cn('w-4 h-4 shrink-0', isActive && 'text-primary')} />
                  {!isCollapsed && <span className="truncate">{label}</span>}
                </Link>
              </Button>
            );
          })}

          <div className="mt-4 space-y-2">
            {!isCollapsed && checkedInMembers.length > 1 && (
              <div className="px-2 pb-2">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">
                  Switch User
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {checkedInMembers.map(member => (
                    <button
                      key={member.id}
                      onClick={() => switchMember(member.id)}
                      className={cn(
                        'relative group transition-all',
                        currentMember?.id === member.id &&
                          'ring-2 ring-primary ring-offset-2 ring-offset-card rounded-full'
                      )}
                      title={member.name}
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={member.image} />
                        <AvatarFallback className="text-[10px]">
                          {member.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {currentMember?.id === member.id && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-card flex items-center justify-center">
                          <div className="w-1 h-1 bg-white rounded-full" />
                        </div>
                      )}
                    </button>
                  ))}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 rounded-full border border-dashed border-muted-foreground/50"
                    asChild
                  >
                    <Link to="/checkin">
                      <Plus className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            <div className={cn('p-3 rounded-lg bg-muted flex items-center gap-3', isCollapsed && 'justify-center')}>
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarImage src={currentMember?.image} />
                <AvatarFallback>{currentMember?.name?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {import.meta.env.MODE === 'standalone' ? 'Admin' : currentMember?.name || 'User'}
                  </div>
                  {import.meta.env.MODE !== 'standalone' && (
                    <div className="text-xs text-muted-foreground truncate">{currentMember?.email}</div>
                  )}
                </div>
              )}
              {isCollapsed && checkedInMembers.length > 1 ? (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" asChild>
                  <Link to="/checkin">
                    <Plus className="w-4 h-4" />
                  </Link>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={onCheckout}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ScanOrderDialog open={isScanOpen} onOpenChange={setIsScanOpen} />
      <ShortcutsHelpDialog open={isShortcutsOpen} onOpenChange={setIsShortcutsOpen} />
    </>
  );
}
