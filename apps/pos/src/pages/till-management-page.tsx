'use client';

import { useState, useMemo } from 'react';
import { usePosStore } from '@/store/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/ui/card';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Badge } from '@repo/ui/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/ui/tabs';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Lock, Unlock, Plus, Minus, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';
import posthog from 'posthog-js';

export default function TillManagementPage() {
  const settings = usePosStore(state => state.settings);
  const cashDrawers = usePosStore(state => state.cashDrawers);
  const activeCashDrawerId = usePosStore(state => state.activeCashDrawerId);
  const openCashDrawer = usePosStore(state => state.openCashDrawer);
  const closeCashDrawer = usePosStore(state => state.closeCashDrawer);
  const addCashTransaction = usePosStore(state => state.addCashTransaction);
  // const currentEmployeeId = usePosStore((state) => state.currentEmployeeId)
  // const employees = usePosStore((state) => state.employees)

  const [openingBalance, setOpeningBalance] = useState('');
  const [closingBalance, setClosingBalance] = useState('');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionNotes, setTransactionNotes] = useState('');

  const activeDrawer = cashDrawers.find(d => d.id === activeCashDrawerId);
  // const currentEmployee = employees.find((e) => e.id === currentEmployeeId)

  // Calculate current balance
  const currentBalance = useMemo(() => {
    if (!activeDrawer) return 0;
    const salesTotal = activeDrawer.transactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.amount, 0);
    const cashIn = activeDrawer.transactions.filter(t => t.type === 'cash-in').reduce((sum, t) => sum + t.amount, 0);
    const cashOut = activeDrawer.transactions.filter(t => t.type === 'cash-out').reduce((sum, t) => sum + t.amount, 0);
    const refunds = activeDrawer.transactions.filter(t => t.type === 'refund').reduce((sum, t) => sum + t.amount, 0);

    return activeDrawer.openingBalance + salesTotal + cashIn - cashOut - refunds;
  }, [activeDrawer]);

  const handleOpenDrawer = () => {
    const amount = Number.parseFloat(openingBalance);
    if (isNaN(amount) || amount < 0) return;
    openCashDrawer(amount);
    posthog.capture("cash_drawer_opened", { opening_balance: amount });
    setOpeningBalance('');
  };

  const handleCloseDrawer = () => {
    const amount = Number.parseFloat(closingBalance);
    if (isNaN(amount) || amount < 0) return;
    posthog.capture("cash_drawer_closed", {
        closing_balance: amount,
        expected_balance: currentBalance,
        difference: amount - currentBalance
    });
    closeCashDrawer(amount);
    setClosingBalance('');
  };

  const handleCashIn = () => {
    const amount = Number.parseFloat(transactionAmount);
    if (isNaN(amount) || amount <= 0) return;
    addCashTransaction('cash-in', amount, transactionNotes);
    posthog.capture("cash_in_out", { type: "cash-in", amount });
    setTransactionAmount('');
    setTransactionNotes('');
  };

  const handleCashOut = () => {
    const amount = Number.parseFloat(transactionAmount);
    if (isNaN(amount) || amount <= 0) return;
    addCashTransaction('cash-out', amount, transactionNotes);
    posthog.capture("cash_in_out", { type: "cash-out", amount });
    setTransactionAmount('');
    setTransactionNotes('');
  };

  const formatCurrency = (amount: number) => {
    return `${settings.currency} ${amount.toLocaleString()}`;
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Till Management</h1>
        <p className="text-muted-foreground mt-1">Manage cash drawer operations for retail and wholesale</p>
      </div>

      {/* Active Drawer Status */}
      {activeDrawer ? (
        <Card className="bg-primary/5 border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                  <Unlock className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Till Open</h3>
                  <p className="text-sm text-muted-foreground">
                    Opened by {activeDrawer.employeeName} at {new Date(activeDrawer.openedAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{formatCurrency(currentBalance)}</div>
                <p className="text-sm text-muted-foreground">Current Balance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Lock className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Till Closed</h3>
                <p className="text-sm text-muted-foreground">Open the till to start accepting cash payments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue={activeDrawer ? 'operations' : 'open'} className="space-y-6">
        <TabsList>
          <TabsTrigger value="open" disabled={!!activeDrawer}>
            Open Till
          </TabsTrigger>
          <TabsTrigger value="operations" disabled={!activeDrawer}>
            Operations
          </TabsTrigger>
          <TabsTrigger value="close" disabled={!activeDrawer}>
            Close Till
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Open Till Tab */}
        <TabsContent value="open" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Open Cash Drawer</CardTitle>
              <CardDescription>Enter the opening balance to start the shift</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="openingBalance">Opening Balance</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="openingBalance"
                    type="number"
                    placeholder="0.00"
                    value={openingBalance}
                    onChange={e => setOpeningBalance(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button onClick={handleOpenDrawer} className="w-full" size="lg">
                <Unlock className="w-4 h-4 mr-2" />
                Open Till
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-6">
          {activeDrawer && (
            <>
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Opening Balance</CardTitle>
                    <Calculator className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(activeDrawer.openingBalance)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Sales</CardTitle>
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-emerald-600">
                      {formatCurrency(
                        activeDrawer.transactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.amount, 0)
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cash Out</CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(
                        activeDrawer.transactions
                          .filter(t => t.type === 'cash-out')
                          .reduce((sum, t) => sum + t.amount, 0)
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(currentBalance)}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Cash In/Out */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Cash In</CardTitle>
                    <CardDescription>Add cash to the drawer</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cashInAmount">Amount</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="cashInAmount"
                          type="number"
                          placeholder="0.00"
                          value={transactionAmount}
                          onChange={e => setTransactionAmount(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cashInNotes">Notes (optional)</Label>
                      <Input
                        id="cashInNotes"
                        placeholder="Reason for cash in"
                        value={transactionNotes}
                        onChange={e => setTransactionNotes(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleCashIn} className="w-full" variant="default">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Cash
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Cash Out</CardTitle>
                    <CardDescription>Remove cash from the drawer</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cashOutAmount">Amount</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="cashOutAmount"
                          type="number"
                          placeholder="0.00"
                          value={transactionAmount}
                          onChange={e => setTransactionAmount(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cashOutNotes">Notes (optional)</Label>
                      <Input
                        id="cashOutNotes"
                        placeholder="Reason for cash out"
                        value={transactionNotes}
                        onChange={e => setTransactionNotes(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleCashOut} className="w-full" variant="destructive">
                      <Minus className="w-4 h-4 mr-2" />
                      Remove Cash
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>All transactions in this session</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activeDrawer.transactions.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No transactions yet</p>
                    ) : (
                      activeDrawer.transactions
                        .slice()
                        .reverse()
                        .map((transaction, index) => (
                          <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  'w-8 h-8 rounded-full flex items-center justify-center',
                                  transaction.type === 'sale' || transaction.type === 'cash-in'
                                    ? 'bg-emerald-500/10 text-emerald-600'
                                    : 'bg-red-500/10 text-red-600'
                                )}
                              >
                                {transaction.type === 'sale' || transaction.type === 'cash-in' ? (
                                  <TrendingUp className="w-4 h-4" />
                                ) : (
                                  <TrendingDown className="w-4 h-4" />
                                )}
                              </div>
                              <div>
                                <div className="font-medium capitalize">{transaction.type.replace('-', ' ')}</div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(transaction.timestamp).toLocaleString()}
                                  {transaction.notes && ` • ${transaction.notes}`}
                                </div>
                              </div>
                            </div>
                            <div
                              className={cn(
                                'font-semibold',
                                transaction.type === 'sale' || transaction.type === 'cash-in'
                                  ? 'text-emerald-600'
                                  : 'text-red-600'
                              )}
                            >
                              {transaction.type === 'sale' || transaction.type === 'cash-in' ? '+' : '-'}
                              {formatCurrency(transaction.amount)}
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Close Till Tab */}
        <TabsContent value="close" className="space-y-6">
          {activeDrawer && (
            <Card>
              <CardHeader>
                <CardTitle>Close Cash Drawer</CardTitle>
                <CardDescription>Count the cash and close the shift</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted">
                  <div>
                    <div className="text-sm text-muted-foreground">Expected Balance</div>
                    <div className="text-2xl font-bold">{formatCurrency(currentBalance)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Opening Balance</div>
                    <div className="text-xl font-semibold">{formatCurrency(activeDrawer.openingBalance)}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="closingBalance">Actual Closing Balance</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="closingBalance"
                      type="number"
                      placeholder="0.00"
                      value={closingBalance}
                      onChange={e => setClosingBalance(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {closingBalance && (
                  <div
                    className={cn(
                      'p-4 rounded-lg flex items-center gap-3',
                      Math.abs(Number.parseFloat(closingBalance) - currentBalance) > 0.01
                        ? 'bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800'
                        : 'bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800'
                    )}
                  >
                    <AlertCircle
                      className={cn(
                        'w-5 h-5',
                        Math.abs(Number.parseFloat(closingBalance) - currentBalance) > 0.01
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      )}
                    />
                    <div>
                      <div className="font-medium">
                        Difference: {formatCurrency(Math.abs(Number.parseFloat(closingBalance) - currentBalance))}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {Number.parseFloat(closingBalance) > currentBalance
                          ? 'Overage'
                          : Number.parseFloat(closingBalance) < currentBalance
                            ? 'Shortage'
                            : 'Balanced'}
                      </div>
                    </div>
                  </div>
                )}

                <Button onClick={handleCloseDrawer} className="w-full" size="lg" variant="destructive">
                  <Lock className="w-4 h-4 mr-2" />
                  Close Till
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Till History</CardTitle>
              <CardDescription>Previous cash drawer sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cashDrawers.filter(d => d.status === 'closed').length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No previous sessions</p>
                ) : (
                  cashDrawers
                    .filter(d => d.status === 'closed')
                    .slice()
                    .reverse()
                    .map(drawer => (
                      <div key={drawer.id} className="p-4 rounded-lg border space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">{drawer.employeeName}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(drawer.openedAt).toLocaleDateString()} •{' '}
                              {new Date(drawer.openedAt).toLocaleTimeString()} -{' '}
                              {drawer.closedAt && new Date(drawer.closedAt).toLocaleTimeString()}
                            </div>
                          </div>
                          <Badge
                            variant="secondary"
                            className={cn(
                              drawer.difference && Math.abs(drawer.difference) > 0.01
                                ? 'bg-amber-500/10 text-amber-700'
                                : 'bg-emerald-500/10 text-emerald-700'
                            )}
                          >
                            {drawer.difference && Math.abs(drawer.difference) > 0.01 ? 'Variance' : 'Balanced'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Opening</div>
                            <div className="font-medium">{formatCurrency(drawer.openingBalance)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Expected</div>
                            <div className="font-medium">{formatCurrency(drawer.expectedBalance || 0)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Actual</div>
                            <div className="font-medium">{formatCurrency(drawer.closingBalance || 0)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Difference</div>
                            <div
                              className={cn(
                                'font-medium',
                                drawer.difference && drawer.difference > 0
                                  ? 'text-emerald-600'
                                  : drawer.difference && drawer.difference < 0
                                    ? 'text-red-600'
                                    : ''
                              )}
                            >
                              {drawer.difference ? formatCurrency(Math.abs(drawer.difference)) : '-'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
