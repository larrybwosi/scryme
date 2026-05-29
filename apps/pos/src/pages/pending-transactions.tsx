'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { Plus, Search, AlertCircle, Banknote, Truck, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { processFileDownload } from '@/lib/utils';
import { usePrinter } from '@/hooks/use-printer';
import { usePosStore } from '@/store/store';
import { useAuthStore } from '@/store/pos-auth-store';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaymentDialog } from '@/components/pending-page/payment';
import { ReconciliationDialog } from '@/components/pending-page/reconcile';
import { DispatchDialog } from '@/components/pending-page/dispatch-dialog';
import { useNavigate, useSearchParams } from 'react-router';
import { API_ROUTES } from '@/config/api';

// Import the new components
import { TransactionRow } from '@/components/pending-page/transaction-row';
import { Transaction } from '@/types';

// --- Fetch Functions ---
const fetchTransactions = async (locationId?: string) => {
  const data = await invoke<Transaction[]>('get_sales_history_command', { locationId });
  return data;
};

// Fetch drivers function
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

export default function PendingTransactionsPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const navigate = useNavigate();
  const { printDocument } = usePrinter();

  // Get the ID from URL if it exists (e.g., /transactions?id=123)
  const [highlightId] = searchParams;

  const [activeTxId, setActiveTxId] = useState<string | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReconcileOpen, setIsReconcileOpen] = useState(false);
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);

  // State to control which dropdown is open programmatically
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // State for download tracking
  const [isDownloading, setIsDownloading] = useState(false);

  // --- Query: Get Transactions ---
  const {
    data: transactions = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => fetchTransactions(),
  });

  // --- Query: Get Drivers ---
  const { data: drivers = [] } = useQuery<DriverOption[]>({
    queryKey: ['drivers'],
    queryFn: () => fetchDrivers(),
    enabled: isDispatchOpen, // Only fetch when dispatch dialog is open
  });

  // --- Effect: Handle Deep Linking / Highlighting ---
  useEffect(() => {
    if (highlightId && transactions.length > 0 && !isLoading) {
      setOpenMenuId(highlightId.get('id'));

      const rowElement = document.getElementById(`tx-row-${highlightId}`);
      if (rowElement) {
        rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightId, transactions, isLoading]);

  // --- Handlers ---
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
    refetch();
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success('Transaction ID copied to clipboard');
  };

  // --- Invoice Download Handler ---
  const handleDownloadInvoice = async (tx: Transaction) => {
    if (!tx.invoiceLink) return;
    if (isDownloading) return;

    setIsDownloading(true);

    // Create a loading toast
    const loadingToastId = toast.loading('Downloading invoice...', {
      description: `Order: ${tx.number || tx.id}`,
    });

    try {
      const blob = await invoke<number[]>('get_invoice_blob_command', { url: tx.invoiceLink });
      const uint8Array = new Uint8Array(blob);
      const blobObj = new Blob([uint8Array], { type: 'application/pdf' });
      const safeOrderNum = (tx.number || tx.id).replace(/[^a-z0-9]/gi, '_');
      const fileName = `Invoice_${safeOrderNum}.pdf`;

      await processFileDownload(blobObj, fileName, loadingToastId);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to save invoice', {
        description: 'Please try again',
        id: loadingToastId,
      });
    } finally {
      setIsDownloading(false);
      setOpenMenuId(null);
    }
  };

  // --- Waybill Download Handler (NEW) ---
  const handleDownloadWaybill = async (tx: Transaction) => {
    // Waybills usually require a fulfillment/dispatch to exist
    if (!tx.fulfillmentId) {
      toast.error('This transaction has not been dispatched yet.');
      return;
    }

    if (isDownloading) return;

    setIsDownloading(true);

    // Create a loading toast
    const loadingToastId = toast.loading('Downloading waybill...', {
      description: `Order: ${tx.number || tx.id}`,
    });

    try {
      // Request waybill based on fulfillment ID
      const url = API_ROUTES.FULFILLMENT.WAYBILL(tx.id);
      const blob = await invoke<number[]>('get_invoice_blob_command', { url });
      const uint8Array = new Uint8Array(blob);
      const blobObj = new Blob([uint8Array], { type: 'application/pdf' });

      const safeOrderNum = (tx.number || tx.id).replace(/[^a-z0-9]/gi, '_');
      const fileName = `Waybill_${safeOrderNum}.pdf`;

      await processFileDownload(blobObj, fileName, loadingToastId);
    } catch (error) {
      console.error('Waybill download error:', error);
      toast.error('Failed to save waybill', {
        description: 'Please try again',
        id: loadingToastId,
      });
    } finally {
      setIsDownloading(false);
      setOpenMenuId(null);
    }
  };

  const handlePrintInvoice = async (tx: Transaction) => {
    if (!tx.invoiceLink) return;
    try {
      toast.info('Sending invoice to printer...');
      const settings = usePosStore.getState().settings;
      const branchName = useAuthStore.getState().currentLocation?.name;

      await printDocument(
        'invoice',
        { invoiceUrl: tx.invoiceLink, number: tx.number || tx.id },
        settings,
        branchName
      );
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
      const settings = usePosStore.getState().settings;
      const branchName = useAuthStore.getState().currentLocation?.name;

      await printDocument(
        'waybill',
        { waybillUrl: url, number: tx.number || tx.id },
        settings,
        branchName
      );
      toast.success('Print job sent');
    } catch (err: any) {
      toast.error('Print failed', { description: err.message || 'Check printer settings' });
    }
  };

  const handleOpenMenuChange = (isOpen: boolean, txId: string) => {
    setOpenMenuId(isOpen ? txId : null);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'KSH' }).format(amount);

  const getActiveTransaction = () => transactions.find(t => t.id === activeTxId);

  const pendingTx = transactions.filter(t => t.status === 'pending');
  const dispatchedTx = transactions.filter(t => t.status === 'dispatched');
  const totalOutstanding = transactions.reduce((acc, curr) => acc + (curr.totalAmount - curr.paidAmount), 0);

  const TransactionTable = ({ data }: { data: Transaction[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">ID</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Progress</TableHead>
          <TableHead className="text-right">Balance</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading && data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center h-24">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading transactions...
              </div>
            </TableCell>
          </TableRow>
        ) : data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
              No transactions found.
            </TableCell>
          </TableRow>
        ) : (
          data.map(tx => (
            <TransactionRow
              key={tx.id}
              tx={tx}
              isHighlighted={tx.id === highlightId?.get('id')}
              isDownloading={isDownloading}
              openMenuId={openMenuId}
              onOpenMenuChange={isOpen => handleOpenMenuChange(isOpen, tx.id)}
              onCopyId={handleCopyId}
              onDownloadInvoice={handleDownloadInvoice}
              onDownloadWaybill={handleDownloadWaybill}
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
  );

  const activeTransaction = getActiveTransaction();

  return (
    <div className="min-h-screen bg-background text-foreground p-8 space-y-8">
      {/* Header & Metrics */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground mt-1">Manage payments, balances, and outstanding invoices.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading || isRefetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {import.meta.env.MODE !== 'standalone' && (
            <Button
              onClick={() => {
                navigate('/create-order');
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Create Invoice
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalOutstanding)}</div>
          </CardContent>
        </Card>
        <Card className="rounded-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dispatched / En-Route</CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dispatchedTx.length}</div>
            <p className="text-xs text-muted-foreground">Require reconciliation</p>
          </CardContent>
        </Card>
        <Card className="rounded-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Action Required</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTx.length}</div>
            <p className="text-xs text-muted-foreground">Unpaid invoices</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="all">All Outstanding</TabsTrigger>
            <TabsTrigger value="dispatched">Dispatched</TabsTrigger>
            <TabsTrigger value="pending">Unpaid</TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-8" />
          </div>
        </div>

        <TabsContent value="all">
          <Card className="rounded-none">
            <CardContent className="p-0">
              <TransactionTable data={transactions} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="dispatched">
          <Card className="rounded-none">
            <CardContent className="p-0">
              <TransactionTable data={dispatchedTx} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="pending">
          <Card className="rounded-none">
            <CardContent className="p-0">
              <TransactionTable data={pendingTx} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Components */}
      <PaymentDialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen} transactionId={activeTxId} />

      <ReconciliationDialog
        open={isReconcileOpen}
        onOpenChange={setIsReconcileOpen}
        fulfillmentId={activeTransaction?.fulfillmentId}
      />

      {/* Dispatch Dialog */}
      <DispatchDialog
        open={isDispatchOpen}
        onOpenChange={setIsDispatchOpen}
        transactionId={activeTxId || ''}
        drivers={drivers}
      />
    </div>
  );
}
