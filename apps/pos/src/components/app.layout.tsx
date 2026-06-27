import { useState } from 'react';
import { GlobalSearch } from './global-search';
import { Sidebar } from '@/components/sidebar';
import { Calendar, Settings } from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import { NotificationCenter } from '@/components/notification-center';
import { NetworkStatusBadge } from './network-status-badge';
import { NotificationSettingsDialog } from '@/components/notification-settings-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@repo/ui/components/ui/alert-dialog';
import { useAuth } from '@/hooks/use-auth';
import { useLocation, useNavigate } from 'react-router';
import { Cart } from './cart';
import { useAuthStore } from '@/store/pos-auth-store';
import { useEffect, useCallback } from 'react';
import { usePosStore } from '@/store/store';
import { useUiStore } from '@/store/ui-store';
import { ConnectionStatusBanner } from './connection-status-banner';
import { useShortcuts } from '@/hooks/use-shortcuts';
import { sendTabletActivity } from '@/lib/kds';

interface AppLayoutProviderProps {
  children: React.ReactNode;
}

export default function AppLayoutProvider({ children }: AppLayoutProviderProps) {
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const { checkOut } = useAuth();
  const deviceType = useAuthStore(state => state.deviceType);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentOrder, resetOrder } = usePosStore();
  const { setPaymentDialogOpen, setShortcutsHelpDialogOpen, setHoldOrderDialogOpen } = useUiStore();

  const handleProceedToCheckout = useCallback(() => {
    if (location.pathname !== '/') {
      navigate('/');
    }
    setPaymentDialogOpen(true);
  }, [location.pathname, navigate, setPaymentDialogOpen]);

  useShortcuts({
    onCheckout: handleProceedToCheckout,
    onHoldOrder: () => setHoldOrderDialogOpen(true),
    onClearCart: () => resetOrder(),
    onOpenShortcuts: () => setShortcutsHelpDialogOpen(true),
    onFocusSearch: () => {
      if (location.pathname !== '/') {
        navigate('/');
      }
      // The POS component will handle the actual focus via its own effect or global listener
    },
  });

  useEffect(() => {
    if (deviceType === 'TABLET') {
      sendTabletActivity({
        current_page: location.pathname,
        cart_items: currentOrder.items.map(item => ({
          id: item.productId,
          product_name: item.productName,
          quantity: item.quantity,
          modifiers: [],
        })),
        table_number: currentOrder.tableNumber || null,
      });
    }
  }, [location.pathname, currentOrder.items, currentOrder.tableNumber, deviceType]);

  const handleCheckout = () => {
    checkOut();
    setShowCheckoutDialog(false);
  };

  // Show sidebar for all routes except checkout/setup, and KDS mode
  const showSidebar = !['/checkin', '/setup'].includes(location.pathname) && deviceType !== 'KDS';
  // Show cart only on order page, not in KDS mode
  const showCart = location.pathname === '/' && deviceType !== 'KDS';
  // Show header only if not in KDS mode
  const showHeader = deviceType !== 'KDS';

  return (
    <div className="flex h-screen overflow-hidden">
      {showSidebar && <Sidebar onCheckout={() => setShowCheckoutDialog(true)} />}

      <div className="flex-1 flex flex-col overflow-hidden">
        {import.meta.env.MODE !== 'standalone' && <ConnectionStatusBanner />}
        {showHeader && (
          <header className="h-16 border-b border-border px-6 flex items-center justify-between bg-background">
            <div className="flex items-center gap-6 flex-1">
              <div className="relative max-w-md flex-1">
                <GlobalSearch />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <NetworkStatusBadge />
              <NotificationCenter />
              <Button variant="ghost" size="icon" onClick={() => setShowNotificationSettings(true)}>
                <Settings className="h-5 w-5" />
              </Button>
              <NotificationSettingsDialog open={showNotificationSettings} onOpenChange={setShowNotificationSettings} />

              <Button variant="outline" className="gap-2 bg-transparent">
                <Calendar className="w-4 h-4" />
                {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
              </Button>
            </div>
          </header>
        )}

        <div className="flex-1 overflow-auto">{children}</div>
      </div>

      {showCart && <Cart />}

      <AlertDialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Check Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to check out? This will end your current session and return you to the check-in
              screen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCheckout} className="bg-destructive hover:bg-destructive/90">
              Check Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
