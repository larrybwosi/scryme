import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router';
import { useEffect, lazy, Suspense } from 'react';
import SetupPage from '@/pages/set-up';
import CheckinPage from '@/pages/checkin';
import { useAuth, useSessionActivityListener } from '@/hooks/use-auth';
import { useAuthStore } from '@/store/pos-auth-store';
import { usePosStore } from '@/store/store';
import { initializeNetworkRole } from '@/lib/kds';
import posthog from 'posthog-js';
import AppLayout from '@/components/app.layout';
import { AutoShiftModal } from './components/shift/auto-shift-modal';
import { IdleTimer } from './components/auth/idle-timer';

// Lazy load pages to reduce initial bundle size and allow variant-based code splitting
const HistoryPage = lazy(() => import('@/pages/history-page').then(m => ({ default: m.HistoryPage })));
const AnalyticsPage = lazy(() => import('@/pages/analytics-page'));
const CustomersPage = lazy(() => import('@/pages/customers-page'));
const ManageTablesPage = import.meta.env.VITE_BUSINESS_MODE === 'restaurant' || !import.meta.env.VITE_BUSINESS_MODE
  ? lazy(() => import('@/pages/manage-tables-page'))
  : () => null;
const PettyCashPage = lazy(() => import('@/pages/petty-cash-page'));
const ReceiptSettingsPage = lazy(() => import('@/pages/receipt-settings-page'));
const PendingTransactionsPage = lazy(() => import('@/pages/pending-transactions'));
const CreateOrderPage = lazy(() => import('@/pages/create-order'));
const POS = lazy(() => import('@/pages/pos').then(m => ({ default: m.POS })));
const SupermarketPOS = import.meta.env.VITE_BUSINESS_MODE === 'supermarket' || !import.meta.env.VITE_BUSINESS_MODE
  ? lazy(() => import('@/pages/supermarket-pos').then(m => ({ default: m.SupermarketPOS })))
  : () => null;
const SettingsPage = lazy(() => import('@/pages/settings-page'));
const CustomerDisplay = lazy(() => import('@/pages/customer-display'));
const PricingViewPage = lazy(() => import('@/pages/pricing-view-page'));
const NotFound = lazy(() => import('@/pages/not-found'));
const ShiftManager = lazy(() => import('./components/shift-manager'));
const StockDeliveryPage = lazy(() => import('./pages/stock-acceptance'));
const StockTransferCreate = lazy(() => import('./pages/stock-transfers'));
const StockRequestCreate = lazy(() => import('./pages/stock-requests'));
const KDSPage = import.meta.env.VITE_BUSINESS_MODE === 'restaurant' || !import.meta.env.VITE_BUSINESS_MODE
  ? lazy(() => import('./pages/kitchen-display'))
  : () => null;
const HubOverviewPage = import.meta.env.VITE_BUSINESS_MODE === 'restaurant' || !import.meta.env.VITE_BUSINESS_MODE
  ? lazy(() => import('./pages/hub-overview'))
  : () => null;
const ProductManagementPage = lazy(() => import('./pages/product-management'));
const StandaloneSetup = lazy(() => import('./pages/standalone-setup'));
const BarcodePrintingPage = lazy(() => import('./pages/barcode-printing-page'));
const LogsPage = lazy(() => import('./pages/logs-page'));

// Loading component for Suspense
const PageLoader = () => (
  <div className="h-full w-full flex items-center justify-center bg-zinc-950/50">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
  </div>
);

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
      <Suspense fallback={<PageLoader />}>
        <IdleTimer />
        <AutoShiftModal />
        <Routes>
          <Route index path="/" element={<SupermarketPOS />} />
          <Route path="*" element={<SupermarketPOS />} />
        </Routes>
      </Suspense>
    );
  }

  // If KDS device, boot directly to KDS page
  if (deviceType === 'KDS') {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route index path="/" element={<KDSPage />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route path="*" element={<KDSPage />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
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
            <Route path="/cash-drawer" element={<ShiftManager />} />
            <Route path="/petty-cash" element={<PettyCashPage />} />
            <Route path="/till-management" element={<ShiftManager />} />
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

        {/* Restaurant/Hub and Spoke routes - Build-time conditional inclusion */}
        {(import.meta.env.VITE_BUSINESS_MODE === 'restaurant' || !import.meta.env.VITE_BUSINESS_MODE) && businessMode === 'restaurant' && (
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
    </Suspense>
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

  const storeBusinessType = usePosStore(state => state.settings.businessType);
  const businessMode = import.meta.env.VITE_BUSINESS_MODE || storeBusinessType || 'retail';
  const isRestaurant = businessMode === 'restaurant';

  useEffect(() => {
    if (isRestaurant) {
      initializeNetworkRole();
      fetchTables();
    }
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
