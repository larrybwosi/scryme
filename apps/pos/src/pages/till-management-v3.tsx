'use client';

import { useState, useEffect } from 'react';
import { Button } from '@repo/ui/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/ui/card';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select';
import {
  Banknote,
  History,
  ArrowUpCircle,
  ArrowDownCircle,
  Lock,
  Unlock,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { invoke } from '@tauri-apps/api/core';

interface PettyCashFund {
    id: string;
    name: string;
    currentBalance: number;
}

export default function TillManagementV3() {
  const [funds, setFunds] = useState<PettyCashFund[]>([]);
  const [selectedFundId, setSelectedFundId] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingFunds, setIsFetchingFunds] = useState(false);

  const fetchFunds = async () => {
    setIsFetchingFunds(true);
    try {
        const data = await invoke<PettyCashFund[]>('get_petty_cash_funds');
        setFunds(data);
        if (data.length > 0 && !selectedFundId) {
            setSelectedFundId(data[0].id);
        }
    } catch (e) {
        console.error(e);
    } finally {
        setIsFetchingFunds(false);
    }
  };

  useEffect(() => {
    fetchFunds();
  }, []);

  const handleTopUp = async () => {
    if (!selectedFundId || !cashAmount) return;
    setIsLoading(true);
    try {
        await invoke('top_up_petty_cash', {
            fundId: selectedFundId,
            amount: parseFloat(cashAmount),
            notes: reason
        });
        toast.success("Petty cash topped up");
        setCashAmount('');
        setReason('');
        fetchFunds();
    } catch (e: any) {
        toast.error("Failed to top up", { description: e.message });
    } finally {
        setIsLoading(false);
    }
  };

  const handleExpense = async () => {
    if (!selectedFundId || !cashAmount || !reason) return;
    setIsLoading(true);
    try {
        await invoke('record_petty_cash_expense', {
            fundId: selectedFundId,
            amount: parseFloat(cashAmount),
            category: "General",
            notes: reason
        });
        toast.success("Expense recorded");
        setCashAmount('');
        setReason('');
        fetchFunds();
    } catch (e: any) {
        toast.error("Failed to record expense", { description: e.message });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Till Management</h1>
        <div className="flex gap-2">
            <Button variant="outline" size="sm">
                <History className="h-4 w-4 mr-2" />
                History
            </Button>
            <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fund Balance</CardTitle>
                <Banknote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {funds.find(f => f.id === selectedFundId)?.currentBalance.toLocaleString() || '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">Current Petty Cash Balance</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Shift Status</CardTitle>
                <Unlock className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-green-500">OPEN</div>
                <p className="text-xs text-muted-foreground">Started at 08:30 AM</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Drawer</CardTitle>
                <Lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">Drawer #1</div>
                <p className="text-xs text-muted-foreground">Main Counter</p>
            </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="petty-cash" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="petty-cash">Petty Cash</TabsTrigger>
          <TabsTrigger value="shift">Shift Control</TabsTrigger>
        </TabsList>
        <TabsContent value="petty-cash" className="mt-4">
          <Card>
            <CardHeader>
                <CardTitle>Petty Cash Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Select Fund</Label>
                        <Select value={selectedFundId} onValueChange={setSelectedFundId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select fund" />
                            </SelectTrigger>
                            <SelectContent>
                                {funds.map(f => (
                                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Amount</Label>
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={cashAmount}
                            onChange={e => setCashAmount(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Reason / Category</Label>
                        <Input
                            placeholder="e.g. Lunch, Stationery"
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex gap-4">
                    <Button className="flex-1" onClick={handleTopUp} disabled={isLoading}>
                        <ArrowUpCircle className="h-4 w-4 mr-2" />
                        Top Up Fund
                    </Button>
                    <Button className="flex-1" variant="destructive" onClick={handleExpense} disabled={isLoading}>
                        <ArrowDownCircle className="h-4 w-4 mr-2" />
                        Record Expense
                    </Button>
                </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="shift" className="mt-4">
          <Card>
            <CardHeader>
                <CardTitle>End of Shift</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    Closing the shift will reconcile all transactions and prepare a report.
                </p>
                <Button variant="destructive" className="w-full h-12 text-lg font-bold">
                    CLOSE SHIFT & PRINT X-REPORT
                </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
