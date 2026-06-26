import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router';
import { useEffect } from 'react';
import SetupPage from '@/pages/set-up';
import CheckinPage from '@/pages/checkin';
import { useAuth, useSessionActivityListener } from '@/hooks/use-auth';
import { useAuthStore } from '@/store/pos-auth-store';
import { usePosStore } from '@/store/store';
import { initializeNetworkRole } from '@/lib/kds';
import posthog from 'posthog-js';
import AppLayout from '@/components/app.layout';
import { HistoryPage } from '@/pages/history-page';
import AnalyticsPage from '@/pages/analytics-page';
import CustomersPage from '@/pages/customers-page';
import ManageTablesPage from '@/pages/manage-tables-page';
import CashDrawerPage from '@/pages/cash-drawer-page';
import PettyCashPage from '@/pages/petty-cash-page';
import TillManagementPage from '@/pages/till-management-page';
import ReceiptSettingsPage from '@/pages/receipt-settings-page';
import PendingTransactionsPage from '@/pages/pending-transactions';
import CreateOrderPage from '@/pages/create-order';
import { POS } from '@/pages/pos';
import { SupermarketPOS } from '@/pages/supermarket-pos';
import SettingsPage from '@/pages/settings-page';
import CustomerDisplay from '@/pages/customer-display';
import PricingViewPage from '@/pages/pricing-view-page';
import NotFound from '@/pages/not-found';
import ShiftManager from './components/shift-manager';
import StockDeliveryPage from './pages/stock-acceptance';
import StockTransferCreate from './pages/stock-transfers';
import StockRequestCreate from './pages/stock-requests';
import KDSPage from './pages/kitchen-display';
import HubOverviewPage from './pages/hub-overview';
import ProductManagementPage from './pages/product-management';
import StandaloneSetup from './pages/standalone-setup';
import BarcodePrintingPage from './pages/barcode-printing-page';
import LogsPage from './pages/logs-page';
import { AutoShiftModal } from './components/shift/auto-shift-modal';
import { IdleTimer } from './components/auth/idle-timer';

// Layout wrapper component that uses AppLayout
const LayoutWrapper = () => {
  return (
    <AppLayout>
      <Outlet /> {/* This renders the nested routes */}
    </AppLayout>
  );
};

const AppRoutes = () => {
  const isConfigured = useAuthStore(state => state.isConfigured);
  const currentLocation = useAuthStore(state => state.currentLocation);
  const storeBusinessType = usePosStore(state => state.settings.businessType);
  const businessMode = import.meta.env.VITE_BUSINESS_MODE || storeBusinessType || 'retail';
  const initializeFromBackend = useAuthStore(state => state.initializeFromBackend);
  const isInitialized = useAuthStore(state => state.isInitialized);
  const deviceType = useAuthStore(state => state.deviceType);

  const { isAuthenticated, currentMember } = useAuth();

  useEffect(() => {
    initializeFromBackend();
  }, [initializeFromBackend]);

  if (!isInitialized) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-zinc-950 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!isConfigured || !currentLocation?.id) {
    if (import.meta.env.MODE === 'standalone') {
      return <StandaloneSetup />;
    }
    return <SetupPage />;
  }

  if (!isAuthenticated) {
    return <CheckinPage />;
  }

  // Supermarket mode: bypass layout and show dedicated POS
  if (businessMode === 'supermarket') {
    console.log('Rendering SupermarketPOS', { isAuthenticated, currentMember });
    return (
      <>
        <IdleTimer />
        <AutoShiftModal />
        <Routes>
          <Route index path="/" element={<SupermarketPOS />} />
          <Route path="*" element={<SupermarketPOS />} />
        </Routes>
      </>
    );
  }

  // If KDS device, boot directly to KDS page
  if (deviceType === 'KDS') {
    return (
      <Routes>
        <Route index path="/" element={<KDSPage />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="*" element={<KDSPage />} />
      </Routes>
    );
  }

  return (
    <>
    <IdleTimer />
    <AutoShiftModal />
    <Routes>
      {/* Routes with AppLayout wrapper */}
      <Route element={<LayoutWrapper />}>
        <Route index path="/" element={<POS />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/history" element={<HistoryPage />} />
        {import.meta.env.MODE !== 'standalone' && <Route path="/analytics" element={<AnalyticsPage />} />}
        {import.meta.env.MODE !== 'standalone' && (
          <>
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/cash-drawer" element={<CashDrawerPage />} />
            <Route path="/petty-cash" element={<PettyCashPage />} />
            <Route path="/till-management" element={<TillManagementPage />} />
            <Route path="/pending-transactions" element={<PendingTransactionsPage />} />
            <Route path="/create-order" element={<CreateOrderPage />} />
          </>
        )}
        <Route path="/receipt-settings" element={<ReceiptSettingsPage />} />

        {import.meta.env.MODE !== 'standalone' && (
          <>
            <Route path="/pricing" element={<PricingViewPage />} />
            <Route path="/stock-acceptance" element={<StockDeliveryPage />} />
            <Route path="/stock-transfer" element={<StockTransferCreate />} />
            <Route path="/stock-request" element={<StockRequestCreate />} />
          </>
        )}

        {/* Restaurant/Hub and Spoke routes */}
        {businessMode === 'restaurant' && (
          <>
            <Route path="/kds" element={<KDSPage />} />
            <Route path="/hub-overview" element={<HubOverviewPage />} />
            {import.meta.env.MODE !== 'standalone' && <Route path="/manage-tables" element={<ManageTablesPage />} />}
          </>
        )}

        {import.meta.env.MODE !== 'standalone' && <Route path="/shift-manager" element={<ShiftManager />} />}

        <Route path="/product-management" element={<ProductManagementPage />} />
        <Route path="/barcodes" element={<BarcodePrintingPage />} />
        <Route path="/logs" element={<LogsPage />} />
      </Route>

      {/* Routes without AppLayout */}
      <Route path="/checkin" element={<CheckinPage />} />
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/customer" element={<CustomerDisplay />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    </>
  );
};

const DynamicRenderer = () => {
  useSessionActivityListener();

  const fetchTables = usePosStore(state => state.fetchTables);
  const swapUserCart = usePosStore(state => state.swapUserCart);

  useEffect(() => {
    const handleMemberSwitched = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { memberId, previousMemberId } = customEvent.detail;
      if (previousMemberId && memberId) {
        swapUserCart(previousMemberId, memberId);
      }
    };

    window.addEventListener('member-switched', handleMemberSwitched);
    return () => window.removeEventListener('member-switched', handleMemberSwitched);
  }, [swapUserCart]);

  useEffect(() => {
    initializeNetworkRole();
    fetchTables();
    posthog.capture('app_started');
    // Hide and remove the splashscreen from index.html
    const splash = document.getElementById('splash-root');
    if (splash) {
      setTimeout(() => {
        splash.style.opacity = '0';
        setTimeout(() => {
          splash.remove();
        }, 500);
      }, 500);
    }
  }, [fetchTables]);

  return (
    <Router>
      <AppRoutes />
    </Router>
  );
};

export default DynamicRenderer;
