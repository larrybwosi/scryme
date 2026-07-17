'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/store/pos-auth-store';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/ui/card';
import { Textarea } from '@repo/ui/components/ui/textarea';
import { Badge } from '@repo/ui/components/ui/badge';
import { Separator } from '@repo/ui/components/ui/separator';
import {
  Banknote,
  History,
  RefreshCcw,
  Upload,
  X,
  Loader2,
  Wallet,
  TrendingDown,
  TrendingUp,
  Receipt,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { invoke } from '@tauri-apps/api/core';
import { usePosStore } from '@/store/store';
import { useCashDrawer } from '@/hooks/use-cash-drawer';

export default function PettyCashPage() {
  const { openPhysicalDrawer } = useCashDrawer();
  const { currentLocation } = useAuth();
  const orgSlug = useAuthStore(state => state.deviceConfig?.orgSlug);
  const currency = usePosStore(state => state.settings.currency);

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [funds, setFunds] = useState<any[]>([]);
  const [isLoadingFunds, setIsLoadingFunds] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);

  useEffect(() => {
    if (orgSlug) {
      fetchFunds();
      fetchTransactions();
    }
  }, [orgSlug]);

  const fetchFunds = async () => {
    if (!orgSlug) return;
    try {
      setIsLoadingFunds(true);
      const response = await invoke<any>('authenticated_api_request', {
        method: 'GET',
        path: `api/v2/pos/petty-cash/funds`,
      });
      setFunds(response.data || []);
    } catch (error) {
      console.error('Failed to fetch petty cash funds:', error);
    } finally {
      setIsLoadingFunds(false);
    }
  };

  const fetchTransactions = async () => {
    if (!orgSlug) return;
    try {
      setIsLoadingTransactions(true);
      const response = await invoke<any>('authenticated_api_request', {
        method: 'GET',
        path: `api/v2/pos/petty-cash/transactions`,
        query: { limit: 10 },
      });
      setTransactions(response.data || []);
    } catch (error) {
      console.error('Failed to fetch petty cash transactions:', error);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const handleFileUpload = async () => {
    if (!orgSlug) return;

    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({
        multiple: false,
        filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
      });

      if (selected && typeof selected === 'string') {
        setIsUploading(true);
        toast.info('Uploading receipt...');

        const response = await invoke<any>('upload_file_command', {
          filePath: selected,
        });

        if (response.url) {
          setReceiptUrl(response.url);
          toast.success('Receipt uploaded');
        } else {
          throw new Error('No URL returned from upload');
        }
      }
    } catch (error) {
      console.error('Upload failed', error);
      toast.error('Failed to upload receipt');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !orgSlug) return;

    setIsSubmitting(true);
    try {
      const payload = {
        amount: parseFloat(amount),
        description,
        paymentMethod: 'CASH',
        receiptUrl: receiptUrl || null,
        pettyCashFundId: funds[0]?.id || null,
      };

      await invoke('register_petty_cash_command', {
        orgSlug,
        payload,
      });

      // Open physical drawer
      await openPhysicalDrawer();

      toast.success('Petty cash expense registered successfully');
      setAmount('');
      setDescription('');
      setReceiptUrl(null);
      fetchFunds(); // Refresh balance
      fetchTransactions(); // Refresh activity
    } catch (error: any) {
      console.error('Failed to register petty cash:', error);
      toast.error('Failed to register petty cash', {
        description: error.message || 'An unexpected error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Derived stats for the top summary row
  const todaysTxs = transactions.filter(tx => {
    const d = new Date(tx.createdAt);
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const todaysExpenseTotal = todaysTxs
    .filter(tx => tx.type === 'EXPENSE')
    .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
  const todaysReplenishTotal = todaysTxs
    .filter(tx => tx.type !== 'EXPENSE')
    .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

  return (
    <div className="min-h-screen w-full bg-muted/30">
      <div className="w-full max-w-[1600px] mx-auto p-6 lg:p-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-1 pb-2 border-b lg:flex-row lg:items-end lg:justify-between lg:gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Petty Cash</h1>
                <p className="text-muted-foreground text-sm">
                  Register and track minor cash expenses for your location
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 py-1.5 px-3 text-xs font-normal">
              <MapPin className="h-3 w-3" />
              {currentLocation?.name || 'Global'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                fetchFunds();
                fetchTransactions();
              }}
              disabled={isLoadingFunds || isLoadingTransactions}
            >
              <RefreshCcw className={`h-4 w-4 ${isLoadingFunds || isLoadingTransactions ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Fund Balance"
            icon={<Banknote className="h-4 w-4" />}
            isLoading={isLoadingFunds}
            value={funds.length > 0 ? `${currency} ${parseFloat(funds[0].amount).toLocaleString()}` : '—'}
            hint={funds.length > 0 ? 'Available for expenses' : 'No active fund'}
          />
          <StatCard
            label="Today's Expenses"
            icon={<TrendingDown className="h-4 w-4 text-red-500" />}
            isLoading={isLoadingTransactions}
            value={`${currency} ${todaysExpenseTotal.toLocaleString()}`}
            hint={`${todaysTxs.filter(t => t.type === 'EXPENSE').length} transaction(s) today`}
            valueClassName="text-red-600 dark:text-red-400"
          />
          <StatCard
            label="Today's Replenishments"
            icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
            isLoading={isLoadingTransactions}
            value={`${currency} ${todaysReplenishTotal.toLocaleString()}`}
            hint={`${todaysTxs.filter(t => t.type !== 'EXPENSE').length} transaction(s) today`}
            valueClassName="text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            label="Recent Activity"
            icon={<Receipt className="h-4 w-4" />}
            isLoading={isLoadingTransactions}
            value={String(transactions.length)}
            hint="Transactions on record"
          />
        </div>

        {/* Main content */}
        <div className="grid gap-6 xl:grid-cols-5">
          {/* Form */}
          <Card className="xl:col-span-3 shadow-sm">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-lg">Register New Expense</CardTitle>
              <CardDescription>Enter details for the petty cash expense</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleRegister} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount ({currency})</Label>
                    <div className="relative">
                      <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="pl-10 h-11 text-base"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Receipt (Optional)</Label>
                    <div className="flex items-center gap-4">
                      {receiptUrl ? (
                        <div className="relative w-11 h-11 rounded-md border overflow-hidden group shrink-0">
                          <img src={receiptUrl} alt="Receipt" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setReceiptUrl(null)}
                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 gap-2 w-full justify-start text-muted-foreground font-normal"
                          disabled={isUploading}
                          onClick={handleFileUpload}
                        >
                          {isUploading ? <Loader2 className="animate-spin h-4 w-4" /> : <Upload className="h-4 w-4" />}
                          <span>{isUploading ? 'Uploading...' : 'Attach receipt image'}</span>
                        </Button>
                      )}
                      {receiptUrl && <span className="text-xs text-muted-foreground">Receipt attached</span>}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description / Purpose</Label>
                  <Textarea
                    id="description"
                    placeholder="What was this expense for?"
                    rows={4}
                    className="resize-none"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    required
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Registering will deduct from the active fund and open the cash drawer.
                  </p>
                  <Button
                    type="submit"
                    size="lg"
                    className="gap-2 min-w-[200px]"
                    disabled={isSubmitting || isUploading}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      <>
                        Register Expense
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Activity */}
          <Card className="xl:col-span-2 shadow-sm flex flex-col">
            <CardHeader className="border-b bg-muted/30 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <CardDescription>Latest transactions on this fund</CardDescription>
              </div>
              <History className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardHeader>
            <CardContent className="pt-6 flex-1">
              {isLoadingTransactions ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-14 w-full animate-pulse bg-muted rounded-lg" />
                  ))}
                </div>
              ) : transactions.length > 0 ? (
                <div className="space-y-1">
                  {transactions.map(tx => {
                    const isExpense = tx.type === 'EXPENSE';
                    return (
                      <div key={tx.id} className="flex items-center justify-between gap-3 py-3 border-b last:border-0">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                              isExpense
                                ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400'
                                : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                            }`}
                          >
                            {isExpense ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium leading-tight truncate">{tx.description}</p>
                            <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                        <div
                          className={`text-sm font-semibold whitespace-nowrap shrink-0 ${
                            isExpense ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {isExpense ? '-' : '+'} {currency} {parseFloat(tx.amount).toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                  <Receipt className="h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No recent activity found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
  isLoading,
  valueClassName = '',
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
  isLoading?: boolean;
  valueClassName?: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
          <div className="text-muted-foreground">{icon}</div>
        </div>
        {isLoading ? (
          <div className="h-8 w-28 mt-2 animate-pulse bg-muted rounded" />
        ) : (
          <div className={`text-2xl font-bold mt-2 ${valueClassName}`}>{value}</div>
        )}
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}
