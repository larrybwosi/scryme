'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import posthog from 'posthog-js';
import {
  Plus,
  Search,
  AlertCircle,
  Banknote,
  Truck,
  RefreshCw,
  Loader2,
  Cloud,
  CheckCircle2,
  Wifi,
  WifiOff,
  Trash2,
  AlertTriangle,
  Eye,
  Printer,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, processFileDownload } from '@/lib/utils';
import { usePrinter } from '@/hooks/use-printer';
import { trackPosEvent } from '@/lib/openpanel';
import { usePosStore } from '@/store/store';
import { useAuthStore } from '@/store/pos-auth-store';
import { usePendingSales, useNetworkStatus, useRetrySale, useDeleteSale, useOldSalesCheck } from '@/hooks/sales';
import { useNavigate, useSearchParams } from 'react-router';
import { API_ROUTES } from '@/config/api';
import { Order, Transaction } from '@/types';

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/ui/table';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Badge } from '@repo/ui/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select';
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

import { PaymentDialog } from '@/components/pending-page/payment';
import { ReconciliationDialog } from '@/components/pending-page/reconcile';
import { DispatchDialog } from '@/components/pending-page/dispatch-dialog';
import { TransactionRow } from '@/components/pending-page/transaction-row';
import { ReceiptDialog } from '@/components/receipt-dialog';

const TRANSACTIONS_CACHE_KEY_PREFIX = 'scryme_cached_transactions_';

// --- Fetch Functions with Local Storage Fallback & Persistence ---
const fetchTransactions = async (locationId?: string): Promise<Transaction[]> => {
  const cacheKey = `${TRANSACTIONS_CACHE_KEY_PREFIX}${locationId || 'default'}`;
  try {
    const data = await invoke<Transaction[]>('get_sales_history_command', { locationId });
    if (Array.isArray(data) && data.length > 0) {
      try {
        localStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (e) {
        console.warn('Failed to cache transactions to localStorage:', e);
      }
    }
    return data;
  } catch (err) {
    console.warn('Failed to fetch sales history from backend, falling back to local cache:', err);
    try {
      const stored = localStorage.getItem(cacheKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse cached transactions:', e);
    }
    throw err;
  }
};

const fetchDrivers = async (): Promise<DriverOption[]> => {
  const data = await invoke<DriverOption[]>('get_drivers_command');
  return data;
};

interface DriverOption {
  id: string;
  member: {
    name: string;
  };
}

export function TransactionsPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { printDocument } = usePrinter();
  const settings = usePosStore(state => state.settings);
  const locationId = useAuthStore(state => state.currentLocation?.id);

  // --- Offline Sales Hook & Network ---
  const { pendingSales: queue, isLoading: isQueueLoading, syncSales, isSyncing } = usePendingSales();
  const { isOnline } = useNetworkStatus();
  const retrySale = useRetrySale();
  const deleteSale = useDeleteSale();
  useOldSalesCheck();

  // Get the ID from URL if it exists (e.g., /transactions?id=123)
  const highlightId = searchParams.get('id');

  // Dialog & Active Transaction States
  const [activeTxId, setActiveTxId] = useState<string | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReconcileOpen, setIsReconcileOpen] = useState(false);
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Receipt Printing State
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  // Delete Confirm Dialog State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);

  // Selected Offline Sale Drawer State
  const [selectedQueueSaleId, setSelectedQueueSaleId] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('week');
  const [isDownloading, setIsDownloading] = useState(false);

  // Load initial cached transactions if available
  const [cachedTransactions, setCachedTransactions] = useState<Transaction[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const cacheKey = `${TRANSACTIONS_CACHE_KEY_PREFIX}${locationId || 'default'}`;
      const stored = localStorage.getItem(cacheKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // --- Query: Get Outstanding / Dispatched Transactions with Stale-While-Revalidate Background Sync ---
  const {
    data: transactions = cachedTransactions,
    isLoading: isTxLoading,
    isRefetching: isTxRefetching,
    refetch: refetchTx,
  } = useQuery({
    queryKey: ['transactions', locationId],
    queryFn: async () => {
      const data = await fetchTransactions(locationId);
      setCachedTransactions(data);
      return data;
    },
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
  });

  // --- Query: Get Drivers ---
  const { data: drivers = [] } = useQuery<DriverOption[]>({
    queryKey: ['drivers'],
    queryFn: () => fetchDrivers(),
    enabled: isDispatchOpen,
  });

  // --- Deep Linking ---
  useEffect(() => {
    if (highlightId && transactions.length > 0 && !isTxLoading) {
      setOpenMenuId(highlightId);
      const rowElement = document.getElementById(`tx-row-${highlightId}`);
      if (rowElement) {
        rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightId, transactions, isTxLoading]);

  // Analytics tracking
  useEffect(() => {
    if (searchQuery) {
      const timer = setTimeout(() => {
        posthog.capture('transactions_search', { query: searchQuery.substring(0, 50) });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  // Handlers for Pending/Outstanding Invoices
  const handleOpenPayment = (txId: string) => {
    setActiveTxId(txId);
    setIsPaymentOpen(true);
    setOpenMenuId(null);
  };

  const handleOpenReconcile = (txId: string) => {
    setActiveTxId(txId);
    setIsReconcileOpen(true);
    setOpenMenuId(null);
  };

  const handleOpenDispatch = (txId: string) => {
    setActiveTxId(txId);
    setIsDispatchOpen(true);
    setOpenMenuId(null);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    refetchTx();
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success('Transaction ID copied to clipboard');
  };

  // Downloads & Printing
  const handleDownloadInvoice = async (tx: Transaction) => {
    if (!tx.invoiceLink || isDownloading) return;
    setIsDownloading(true);
    trackPosEvent('pos_invoice_downloaded', { txId: tx.id, number: tx.number });
    const loadingToastId = toast.loading('Downloading invoice...', { description: `Order: ${tx.number || tx.id}` });
    try {
      const blob = await invoke<number[]>('get_invoice_blob_command', { url: tx.invoiceLink });
      const uint8Array = new Uint8Array(blob);
      const blobObj = new Blob([uint8Array], { type: 'application/pdf' });
      const safeOrderNum = (tx.number || tx.id).replace(/[^a-z0-9]/gi, '_');
      await processFileDownload(blobObj, `Invoice_${safeOrderNum}.pdf`, loadingToastId);
    } catch (error) {
      toast.error('Failed to save invoice', { id: loadingToastId });
    } finally {
      setIsDownloading(false);
      setOpenMenuId(null);
    }
  };

  const handleDownloadWaybill = async (tx: Transaction) => {
    if (!tx.fulfillmentId) {
      toast.error('This transaction has not been dispatched yet.');
      return;
    }
    if (isDownloading) return;
    setIsDownloading(true);
    const loadingToastId = toast.loading('Downloading waybill...', { description: `Order: ${tx.number || tx.id}` });
    try {
      const url = API_ROUTES.FULFILLMENT.WAYBILL(tx.id);
      const blob = await invoke<number[]>('get_invoice_blob_command', { url });
      const blobObj = new Blob([new Uint8Array(blob)], { type: 'application/pdf' });
      const safeOrderNum = (tx.number || tx.id).replace(/[^a-z0-9]/gi, '_');
      await processFileDownload(blobObj, `Waybill_${safeOrderNum}.pdf`, loadingToastId);
    } catch (error) {
      toast.error('Failed to save waybill', { id: loadingToastId });
    } finally {
      setIsDownloading(false);
      setOpenMenuId(null);
    }
  };

  const handleDownloadPackingList = async (tx: Transaction) => {
    if (!tx.fulfillmentId) {
      toast.error('This transaction has not been dispatched yet.');
      return;
    }
    if (isDownloading) return;
    setIsDownloading(true);
    const loadingToastId = toast.loading('Downloading packing list...', { description: `Order: ${tx.number || tx.id}` });
    try {
      const url = API_ROUTES.FULFILLMENT.PACKING_LIST(tx.id);
      const blob = await invoke<number[]>('get_invoice_blob_command', { url });
      const blobObj = new Blob([new Uint8Array(blob)], { type: 'application/pdf' });
      const safeOrderNum = (tx.number || tx.id).replace(/[^a-z0-9]/gi, '_');
      await processFileDownload(blobObj, `PackingList_${safeOrderNum}.pdf`, loadingToastId);
    } catch (error) {
      toast.error('Failed to save packing list', { id: loadingToastId });
    } finally {
      setIsDownloading(false);
      setOpenMenuId(null);
    }
  };

  const handlePrintInvoice = async (tx: Transaction) => {
    if (!tx.invoiceLink) return;
    try {
      toast.info('Sending invoice to printer...');
      trackPosEvent('pos_invoice_printed', { txId: tx.id, number: tx.number });
      const branchName = useAuthStore.getState().currentLocation?.name;
      await printDocument('invoice', { invoiceUrl: tx.invoiceLink, number: tx.number || tx.id }, settings, branchName);
      toast.success('Print job sent');
    } catch (err: any) {
      toast.error('Print failed', { description: err.message || 'Check printer settings' });
    }
  };

  const handlePrintWaybill = async (tx: Transaction) => {
    if (!tx.fulfillmentId) return;
    try {
      toast.info('Sending waybill to printer...');
      const url = API_ROUTES.FULFILLMENT.WAYBILL(tx.id);
      const branchName = useAuthStore.getState().currentLocation?.name;
      await printDocument('waybill', { waybillUrl: url, number: tx.number || tx.id }, settings, branchName);
      toast.success('Print job sent');
    } catch (err: any) {
      toast.error('Print failed', { description: err.message || 'Check printer settings' });
    }
  };

  const handlePrintQueueReceipt = (transaction: any) => {
    const orderItems = transaction.cartItems.map((item: any) => ({
      productId: item.productId,
      productName: item.productName || item.productId,
      quantity: item.quantity,
      price: item.unitPrice || 0,
      variant: item.variantName,
      variantName: item.variantName,
      unitName: item.sellingUnitName,
      selectedUnit: {
        unitId: item.sellingUnitId,
        unitName: item.sellingUnitName || '',
        price: item.unitPrice || 0,
      },
    }));

    const order: any = {
      id: transaction.saleNumber || 'TEMP',
      orderNumber: transaction.saleNumber || 'PENDING',
      items: orderItems,
      customer: transaction.customerId ? { name: 'Customer', id: transaction.customerId } : null,
      subtotal: transaction.amountReceived || 0,
      discount: transaction.discountAmount || 0,
      tax: 0,
      total: Math.max(0, (transaction.amountReceived || 0) - (transaction.change || 0)),
      status: 'completed',
      paymentMethod: transaction.paymentMethod,
      datetime: new Date().toISOString(),
    };

    setReceiptOrder(order);
    setReceiptOpen(true);
  };

  // Helper Calculations for Pending Transactions
  const outstandingTx = useMemo(() => {
    const now = new Date();
    let startDate: Date | null = null;

    switch (dateFilter) {
      case 'today':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date();
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(now.getMonth() - 1);
        break;
      default:
        startDate = null;
        break;
    }

    return transactions.filter(t => {
      if (startDate && t.date) {
        const txDate = new Date(t.date);
        if (!isNaN(txDate.getTime()) && txDate < startDate) {
          return false;
        }
      }
      const isDispatched = t.status === 'dispatched';
      const isUnpaid = t.status === 'pending' || t.status === 'partially_paid';
      const hasBalance = t.paidAmount < t.totalAmount;
      return isDispatched || isUnpaid || hasBalance;
    });
  }, [transactions, dateFilter]);

  const totalOutstanding = useMemo(
    () => outstandingTx.reduce((acc, curr) => acc + (curr.totalAmount - curr.paidAmount), 0),
    [outstandingTx]
  );
  const globalDispatchedCount = useMemo(
    () => outstandingTx.filter(t => t.status === 'dispatched').length,
    [outstandingTx]
  );
  const globalPendingCount = useMemo(
    () => outstandingTx.filter(t => t.status !== 'dispatched').length,
    [outstandingTx]
  );

  const filteredOutstandingTx = useMemo(() => {
    return outstandingTx.filter(t => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.id.toLowerCase().includes(q) ||
        (t.number && t.number.toLowerCase().includes(q)) ||
        (t.customer && t.customer.toLowerCase().includes(q)) ||
        (t.email && t.email.toLowerCase().includes(q))
      );
    });
  }, [outstandingTx, searchQuery]);

  const dispatchedTx = useMemo(() => filteredOutstandingTx.filter(t => t.status === 'dispatched'), [filteredOutstandingTx]);

  // Helper Calculations for Sales Queue / History
  const filteredQueue = useMemo(() => {
    const now = new Date();
    let startDate: Date | null = null;

    switch (dateFilter) {
      case 'today':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date();
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(now.getMonth() - 1);
        break;
      default:
        startDate = null;
        break;
    }

    return queue.filter(item => {
      if (locationId && item.locationId !== locationId) return false;
      const customerId = item.transactionData.customerId || '';
      const saleNumber = item.transactionData.saleNumber || '';
      const q = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || customerId.toLowerCase().includes(q) || saleNumber.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesDate = !startDate || new Date(item.timestamp) >= startDate;
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [queue, searchQuery, statusFilter, dateFilter, locationId]);

  const selectedQueueSale = useMemo(
    () => (selectedQueueSaleId ? queue.find(o => o.id === selectedQueueSaleId) : null),
    [queue, selectedQueueSaleId]
  );

  const getActiveTransaction = () => transactions.find(t => t.id === activeTxId);
  const activeTransaction = getActiveTransaction();

  const calculateTotal = (data: any) => {
    const received = data.amountReceived || 0;
    const change = data.change || 0;
    return Math.max(0, received - change);
  };

  return (
    <div className="flex h-full min-h-screen bg-background text-foreground">
      {/* Main Content Area */}
      <div className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
            <p className="text-muted-foreground mt-1">
              Manage outstanding invoices, dispatched orders, and offline sales queue.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Network Badge */}
            <Badge
              variant={isOnline ? 'default' : 'destructive'}
              className={cn(
                'gap-2 px-3 py-1.5',
                isOnline ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'
              )}
            >
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {isOnline ? 'Online' : 'Offline'}
            </Badge>

            {/* Manual Sync Button */}
            <Button
              onClick={() => syncSales()}
              disabled={isSyncing || !isOnline || queue.filter(s => s.status === 'PENDING').length === 0}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className={cn('w-4 h-4', isSyncing && 'animate-spin')} />
              {isSyncing ? 'Syncing...' : 'Sync Offline Queue'}
            </Button>

            {/* Refresh Backend Invoices */}
            <Button variant="outline" onClick={handleRefresh} disabled={isTxLoading || isTxRefetching}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isTxRefetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            {import.meta.env.MODE !== 'standalone' && (
              <Button onClick={() => navigate('/create-order')}>
                <Plus className="mr-2 h-4 w-4" /> Create Invoice
              </Button>
            )}
          </div>
        </div>

        {/* Global KPI Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
              <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{settings.currency} {totalOutstanding.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dispatched / En-Route</CardTitle>
              <Truck className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{globalDispatchedCount}</div>
              <p className="text-xs text-muted-foreground">Require reconciliation</p>
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Action Required (Unpaid)</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{globalPendingCount}</div>
              <p className="text-xs text-muted-foreground">Unpaid invoices</p>
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offline Queue Items</CardTitle>
              <Cloud className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{queue.length}</div>
              <p className="text-xs text-muted-foreground">
                {queue.filter(q => q.status === 'PENDING').length} pending sync
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Outstanding Invoices vs Offline Queue */}
        <Tabs defaultValue="outstanding" className="w-full space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="outstanding" className="gap-2">
                <Banknote className="w-4 h-4" /> Outstanding Invoices ({outstandingTx.length})
              </TabsTrigger>
              <TabsTrigger value="dispatched" className="gap-2">
                <Truck className="w-4 h-4" /> Dispatched ({globalDispatchedCount})
              </TabsTrigger>
              <TabsTrigger value="offline" className="gap-2">
                <Cloud className="w-4 h-4" /> Offline Sales Queue ({queue.length})
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search ID, customer, sale #..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* TAB 1: Outstanding / All Pending Invoices */}
          <TabsContent value="outstanding">
            <Card className="rounded-lg overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">ID / Sale #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isTxLoading && filteredOutstandingTx.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-24">
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading transactions...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredOutstandingTx.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                          No outstanding transactions found matching your criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOutstandingTx.map(tx => (
                        <TransactionRow
                          key={tx.id}
                          tx={tx}
                          isHighlighted={tx.id === highlightId}
                          isDownloading={isDownloading}
                          openMenuId={openMenuId}
                          onOpenMenuChange={isOpen => setOpenMenuId(isOpen ? tx.id : null)}
                          onCopyId={handleCopyId}
                          onDownloadInvoice={handleDownloadInvoice}
                          onDownloadWaybill={handleDownloadWaybill}
                          onDownloadPackingList={handleDownloadPackingList}
                          onPrintInvoice={handlePrintInvoice}
                          onPrintWaybill={handlePrintWaybill}
                          onOpenReconcile={handleOpenReconcile}
                          onOpenPayment={handleOpenPayment}
                          onOpenDispatch={handleOpenDispatch}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: Dispatched Transactions */}
          <TabsContent value="dispatched">
            <Card className="rounded-lg overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">ID / Sale #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dispatchedTx.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                          No dispatched transactions found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      dispatchedTx.map(tx => (
                        <TransactionRow
                          key={tx.id}
                          tx={tx}
                          isHighlighted={tx.id === highlightId}
                          isDownloading={isDownloading}
                          openMenuId={openMenuId}
                          onOpenMenuChange={isOpen => setOpenMenuId(isOpen ? tx.id : null)}
                          onCopyId={handleCopyId}
                          onDownloadInvoice={handleDownloadInvoice}
                          onDownloadWaybill={handleDownloadWaybill}
                          onDownloadPackingList={handleDownloadPackingList}
                          onPrintInvoice={handlePrintInvoice}
                          onPrintWaybill={handlePrintWaybill}
                          onOpenReconcile={handleOpenReconcile}
                          onOpenPayment={handleOpenPayment}
                          onOpenDispatch={handleOpenDispatch}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: Offline Sales Queue */}
          <TabsContent value="offline" className="space-y-4">
            <Card className="p-4 rounded-lg">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter sync status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sync Status</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="SYNCING">Syncing</SelectItem>
                      <SelectItem value="SYNCED">Synced</SelectItem>
                      <SelectItem value="FAILED">Failed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            <Card className="rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="text-sm text-muted-foreground">
                    <TableHead className="font-medium">Sale #</TableHead>
                    <TableHead className="font-medium">Customer</TableHead>
                    <TableHead className="font-medium">Payment</TableHead>
                    <TableHead className="font-medium">Date & Time</TableHead>
                    <TableHead className="font-medium">Items</TableHead>
                    <TableHead className="font-medium">Total</TableHead>
                    <TableHead className="font-medium">Sync Status</TableHead>
                    <TableHead className="font-medium text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isQueueLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                        Loading offline queue...
                      </TableCell>
                    </TableRow>
                  ) : filteredQueue.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        <Cloud className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        No offline transactions found matching criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredQueue.map(item => (
                      <TableRow
                        key={item.id}
                        className={cn(
                          'hover:bg-muted/50 cursor-pointer transition-colors',
                          selectedQueueSaleId === item.id && 'bg-muted'
                        )}
                        onClick={() => setSelectedQueueSaleId(item.id)}
                      >
                        <TableCell className="font-medium">
                          {item.transactionData.saleNumber || <span className="text-muted-foreground text-xs italic">Pending Gen</span>}
                        </TableCell>
                        <TableCell className="text-sm">
                          {item.transactionData.customerId ? (
                            item.transactionData.customerId.slice(0, 8) + '...'
                          ) : (
                            <span className="text-muted-foreground">Guest</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {item.transactionData.paymentMethod}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}{' '}
                          <span className="text-xs">
                            {new Date(item.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{item.transactionData.cartItems.length} items</TableCell>
                        <TableCell className="font-semibold">
                          {settings.currency} {calculateTotal(item.transactionData).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className={getQueueStatusColor(item.status)}>
                              {getQueueStatusIcon(item.status)}
                              <span className="ml-1">{item.status}</span>
                            </Badge>
                            {(() => {
                              const ageInDays = (Date.now() - item.timestamp) / (1000 * 60 * 60 * 24);
                              return ageInDays > 3 && item.status !== 'SYNCED' ? (
                                <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-200 gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  Old
                                </Badge>
                              ) : null;
                            })()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setSelectedQueueSaleId(item.id)}
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary"
                              onClick={() => handlePrintQueueReceipt(item.transactionData)}
                              title="Print Receipt"
                            >
                              <Printer className="w-4 h-4" />
                            </Button>
                            {item.status === 'FAILED' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => retrySale.mutate(item.id)}
                                disabled={retrySale.isPending}
                                title="Retry Sync"
                              >
                                <RefreshCw className={cn('w-4 h-4', retrySale.isPending && 'animate-spin')} />
                              </Button>
                            )}
                            {(item.status === 'FAILED' || item.retryCount > 5) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  setSaleToDelete(item.id);
                                  setDeleteConfirmOpen(true);
                                }}
                                title="Delete Sale"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Transaction Details Sidebar Drawer (for Queue Items) */}
      {selectedQueueSale && (
        <div className="w-96 border-l border-border bg-card overflow-y-auto shrink-0 p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b">
            <h2 className="text-xl font-semibold">Sale Details</h2>
            <Button variant="ghost" size="icon" onClick={() => setSelectedQueueSaleId(null)}>
              ✕
            </Button>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground">Queue ID (UUID)</div>
              <div className="font-mono text-xs text-muted-foreground break-all">{selectedQueueSale.id}</div>
            </div>

            <div className="flex gap-2">
              <Badge variant="secondary" className={getQueueStatusColor(selectedQueueSale.status)}>
                {selectedQueueSale.status}
              </Badge>
              {selectedQueueSale.transactionData.isWholesale && (
                <Badge variant="outline" className="bg-purple-500/10 text-purple-700">
                  Wholesale
                </Badge>
              )}
            </div>

            {selectedQueueSale.status === 'FAILED' && selectedQueueSale.lastError && (
              <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded-md text-red-900 dark:text-red-300 text-sm">
                <span className="font-semibold block mb-1">Sync Error:</span>
                {selectedQueueSale.lastError}
                <div className="text-xs mt-1 opacity-80">
                  Retry attempts: {selectedQueueSale.retryCount || 0}
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-sm">Customer & Payment</h3>
            <div className="space-y-2 text-sm bg-muted/20 p-3 rounded-lg">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer ID</span>
                <span className="font-mono text-xs">{selectedQueueSale.transactionData.customerId || 'Guest'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="font-medium">{selectedQueueSale.transactionData.paymentMethod}</span>
              </div>
              {selectedQueueSale.transactionData.paymentMethod === 'MPESA' && selectedQueueSale.transactionData.mpesaPhoneNumber && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">M-Pesa Phone</span>
                  <span className="font-medium">{selectedQueueSale.transactionData.mpesaPhoneNumber}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-sm">Items</h3>
            <div className="space-y-2 bg-muted/30 p-3 rounded-lg">
              {selectedQueueSale.transactionData.cartItems.map((item, index) => (
                <div key={index} className="flex justify-between text-sm border-b pb-2 last:border-0 border-border/40">
                  <div className="flex-1 pr-2">
                    <div className="font-medium text-xs truncate" title={item.productName || item.productId}>
                      {item.productName || item.productId}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {item.variantName} {item.sellingUnitName && `• ${item.sellingUnitName}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-xs">x{item.quantity}</div>
                    {item.unitPrice && (
                      <div className="text-[10px] text-muted-foreground">
                        @ {settings.currency} {item.unitPrice.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount Received</span>
              <span>{settings.currency} {(selectedQueueSale.transactionData.amountReceived || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Change</span>
              <span>{settings.currency} {(selectedQueueSale.transactionData.change || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-2 border-t font-bold text-base">
              <span>Total</span>
              <span>{settings.currency} {calculateTotal(selectedQueueSale.transactionData).toLocaleString()}</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => handlePrintQueueReceipt(selectedQueueSale.transactionData)}
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </Button>

          {selectedQueueSale.status === 'FAILED' && (
            <Button
              className="w-full gap-2 bg-red-600 hover:bg-red-700 text-white"
              onClick={() => retrySale.mutate(selectedQueueSale.id)}
              disabled={retrySale.isPending}
            >
              <RefreshCw className={cn('w-4 h-4', retrySale.isPending && 'animate-spin')} />
              Retry Sync
            </Button>
          )}
        </div>
      )}

      {/* Dialog Components */}
      <PaymentDialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen} transactionId={activeTxId} />

      <ReconciliationDialog
        open={isReconcileOpen}
        onOpenChange={setIsReconcileOpen}
        fulfillmentId={activeTransaction?.fulfillmentId}
      />

      <DispatchDialog
        open={isDispatchOpen}
        onOpenChange={setIsDispatchOpen}
        transactionId={activeTxId || ''}
        drivers={drivers}
      />

      {receiptOrder && (
        <ReceiptDialog
          open={receiptOpen}
          onOpenChange={setReceiptOpen}
          completedOrder={receiptOrder}
          onClose={() => setReceiptOpen(false)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Failed Sale?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this sale from the offline queue. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSaleToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (saleToDelete) {
                  deleteSale.mutate(saleToDelete);
                  setSaleToDelete(null);
                }
              }}
            >
              Delete Sale
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const getQueueStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'bg-amber-500/10 text-amber-700 border-amber-200';
    case 'SYNCING':
      return 'bg-blue-500/10 text-blue-700 border-blue-200 animate-pulse';
    case 'SYNCED':
      return 'bg-emerald-500/10 text-emerald-700 border-emerald-200';
    case 'FAILED':
      return 'bg-red-500/10 text-red-700 border-red-200';
    default:
      return 'bg-gray-500/10 text-gray-700';
  }
};

const getQueueStatusIcon = (status: string) => {
  switch (status) {
    case 'PENDING':
      return <Cloud className="w-3 h-3" />;
    case 'SYNCING':
      return <RefreshCw className="w-3 h-3 animate-spin" />;
    case 'SYNCED':
      return <CheckCircle2 className="w-3 h-3" />;
    case 'FAILED':
      return <AlertCircle className="w-3 h-3" />;
    default:
      return null;
  }
};

export default TransactionsPage;
