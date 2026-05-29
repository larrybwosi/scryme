import React, { useState, useEffect, useMemo } from 'react';
import { listen } from '@tauri-apps/api/event';

import { Shift, shiftService } from '@/lib/shift-service';
import { useCashDrawer } from '@/hooks/use-cash-drawer';
import { toast } from 'sonner';
import { usePrinterStore } from '@/store/printer-store';
import {
  CashDenominationCounter,
  DEFAULT_DENOMINATIONS,
  CashDenomination
} from '@/components/cash-denomination-counter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  History,
  Lock,
  ArrowRightCircle,
  ArrowLeftCircle,
  DollarSign,
  LogOut,
  ChevronDown,
  ChevronUp,
  LayoutGrid
} from 'lucide-react';

const ShiftManager: React.FC = () => {
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const { openPhysicalDrawer } = useCashDrawer();
  const { assignments } = usePrinterStore();
  const [loading, setLoading] = useState(false);

  // Auth State
  const [cardId, setCardId] = useState('');
  const [pin, setPin] = useState('');

  // Form State
  const [amount, setAmount] = useState('');
  const [denominations, setDenominations] = useState<CashDenomination[]>(DEFAULT_DENOMINATIONS);
  const [useDetails, setUseDetails] = useState(false);
  const [view, setView] = useState<'STATUS' | 'OPEN' | 'CLOSE' | 'DROP'>('STATUS');
  const [showDenomDetails, setShowDenomDetails] = useState(false);

  // Calculate total from denominations
  const denomTotal = useMemo(() =>
    denominations.reduce((acc, curr) => acc + curr.value * curr.count, 0),
  [denominations]);

  // 1. Initialize: Check if shift is open
  useEffect(() => {
    loadShiftStatus();

    // 2. Setup NFC Listener
    const unlisten = listen<string>('nfc-read', event => {
      setCardId(event.payload);
      document.getElementById('pin-input')?.focus();
    });

    return () => {
      unlisten.then(f => f());
    };
  }, []);

  const loadShiftStatus = async () => {
    try {
      const shift = await shiftService.getShiftStatus();
      setCurrentShift(shift);
      setView(shift ? 'STATUS' : 'OPEN');
    } catch (err) {
      console.error("Failed to load shift status:", err);
    }
  };

  // --- ACTIONS ---

  const handleOpenShift = async () => {
    if (!cardId || !pin) return toast.error('Please scan card and enter PIN');

    const openingAmount = useDetails ? denomTotal : Number(amount);
    if (isNaN(openingAmount) || openingAmount < 0) {
        return toast.error('Please enter a valid amount');
    }

    setLoading(true);
    try {
      const shift = await shiftService.openShift(
        cardId,
        pin,
        openingAmount,
        useDetails ? denominations : null
      );
      setCurrentShift(shift);
      setView('STATUS');

      await openPhysicalDrawer();
      toast.success('Shift Opened Successfully');

      clearAuth();
    } catch (e) {
      toast.error('Error opening shift: ' + e);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseShift = async () => {
    if (!cardId || !pin) return toast.error('Please scan card and enter PIN');

    const closingAmount = useDetails ? denomTotal : Number(amount);
    if (isNaN(closingAmount) || closingAmount < 0) {
        return toast.error('Please enter a valid amount');
    }

    setLoading(true);
    try {
      const receiptPrinter = assignments.receipt || undefined;
      const shift = await shiftService.closeShift(
        cardId,
        pin,
        closingAmount,
        useDetails ? denominations : null,
        receiptPrinter
      );

      setCurrentShift(null);
      await openPhysicalDrawer();

      toast.success('Shift Closed', {
        description: `Variance: ${shift.variance?.toFixed(2)}`,
      });

      setView('OPEN');
      clearAuth();
    } catch (e) {
      toast.error('Error closing shift: ' + e);
    } finally {
      setLoading(false);
    }
  };

  const clearAuth = () => {
    setCardId('');
    setPin('');
    setAmount('');
    setDenominations(DEFAULT_DENOMINATIONS);
  };

  // --- RENDER HELPERS ---

  const AuthForm = () => (
    <div className="p-4 bg-muted/50 rounded-lg mb-6 border border-border space-y-4">
      <div className="flex items-center space-x-2 text-primary">
        <Lock className="w-4 h-4" />
        <h3 className="font-semibold text-sm">Operator Authorization</h3>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="card-id" className="text-xs uppercase text-muted-foreground">NFC Card ID</Label>
        <div className="relative">
            <Input
              id="card-id"
              type="text"
              value={cardId}
              readOnly
              placeholder="Scan Card..."
              className="bg-background italic"
            />
            {!cardId && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                </div>
            )}
        </div>
        {!cardId && <small className="text-blue-500 text-[10px]">Waiting for NFC Scan...</small>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pin-input" className="text-xs uppercase text-muted-foreground">Employee PIN</Label>
        <Input
          id="pin-input"
          type="password"
          value={pin}
          onChange={e => setPin(e.target.value)}
          placeholder="Enter PIN"
          className="bg-background"
        />
      </div>
    </div>
  );

  // --- MAIN VIEWS ---

  if (view === 'OPEN') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
                <ArrowRightCircle className="w-6 h-6 text-green-500" />
                <CardTitle>Start New Shift</CardTitle>
            </div>
            <CardDescription>Verify your credentials and record the starting float.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <AuthForm />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold">Opening Float</Label>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setUseDetails(!useDetails)}
                        className="text-primary h-8"
                    >
                        {useDetails ? "Switch to Simple Amount" : "Use Cash Counter"}
                    </Button>
                </div>

                {useDetails ? (
                    <div className="p-4 border rounded-lg bg-muted/30">
                         <CashDenominationCounter
                            denominations={denominations}
                            onChange={setDenominations}
                        />
                    </div>
                ) : (
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className="pl-10 text-xl h-12"
                            placeholder="0.00"
                        />
                    </div>
                )}
            </div>

            <Button
              onClick={handleOpenShift}
              disabled={loading || !cardId || !pin}
              className="w-full h-12 text-lg font-bold bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Opening...' : 'Open Shift'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (view === 'CLOSE') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-red-200">
          <CardHeader>
            <div className="flex items-center space-x-2 text-red-600">
                <ArrowLeftCircle className="w-6 h-6" />
                <CardTitle>Close Shift</CardTitle>
            </div>
            <CardDescription>Reconcile cash and finalize the session.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                <div className="text-sm font-medium">Expected Cash in Drawer</div>
                <div className="text-xl font-bold">${currentShift?.expected_cash.toFixed(2)}</div>
            </div>

            <AuthForm />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold">Actual Cash Counted</Label>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setUseDetails(!useDetails)}
                        className="text-primary h-8"
                    >
                        {useDetails ? "Switch to Simple Amount" : "Use Cash Counter"}
                    </Button>
                </div>

                {useDetails ? (
                    <div className="p-4 border rounded-lg bg-muted/30">
                         <CashDenominationCounter
                            denominations={denominations}
                            onChange={setDenominations}
                        />
                    </div>
                ) : (
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className="pl-10 text-xl h-12"
                            placeholder="0.00"
                        />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" onClick={() => setView('STATUS')} className="h-12">
                    Cancel
                </Button>
                <Button
                    variant="destructive"
                    onClick={handleCloseShift}
                    disabled={loading || !cardId || !pin}
                    className="h-12 font-bold"
                >
                    {loading ? 'Closing...' : 'Close & Print Report'}
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // STATUS VIEW
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="border-green-200 overflow-hidden">
        <div className="h-1 bg-green-500 w-full" />
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="text-2xl font-bold text-green-700">Shift Active</CardTitle>
                <CardDescription className="flex items-center space-x-2 mt-1">
                    <span className="bg-green-100 text-green-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                        Live
                    </span>
                    <span>Started {new Date(currentShift?.opened_at || '').toLocaleTimeString()}</span>
                </CardDescription>
            </div>
            <div className="text-right">
                <div className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Current Operator</div>
                <div className="text-sm font-medium flex items-center justify-end space-x-1">
                    <LayoutGrid className="w-3 h-3 text-primary" />
                    <span>{currentShift?.operator_id || 'Unknown'}</span>
                </div>
            </div>
        </CardHeader>

        <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-blue-50/50 border-blue-100 shadow-none">
                    <CardHeader className="p-4 pb-0">
                        <CardDescription className="text-blue-600 font-bold text-[10px] uppercase">Cash Sales</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-1">
                        <div className="text-2xl font-bold text-blue-700">${currentShift?.total_cash_sales.toFixed(2)}</div>
                    </CardContent>
                </Card>

                <Card className="bg-orange-50/50 border-orange-100 shadow-none">
                    <CardHeader className="p-4 pb-0">
                        <CardDescription className="text-orange-600 font-bold text-[10px] uppercase">Cash Drops</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-1">
                        <div className="text-2xl font-bold text-orange-700">${currentShift?.total_cash_drops.toFixed(2)}</div>
                    </CardContent>
                </Card>

                <Card className="bg-muted/50 border-border shadow-none">
                    <CardHeader className="p-4 pb-0">
                        <CardDescription className="text-muted-foreground font-bold text-[10px] uppercase">Starting Float</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-1">
                        <div className="text-2xl font-bold">${currentShift?.starting_float.toFixed(2)}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="p-6 bg-primary/5 border border-primary/10 rounded-xl flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <div>
                    <div className="text-xs text-primary font-bold uppercase tracking-widest">Expected Drawer Balance</div>
                    <div className="text-3xl font-black text-primary">${currentShift?.expected_cash.toFixed(2)}</div>
                </div>

                <div className="flex space-x-3 w-full md:w-auto">
                    <Button
                        onClick={() => { setView('CLOSE'); clearAuth(); }}
                        className="flex-1 md:w-40 bg-red-600 hover:bg-red-700 font-bold shadow-lg shadow-red-900/20 h-12"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Close Shift
                    </Button>
                </div>
            </div>

            {currentShift?.opening_cash_details && (
                <div className="border rounded-lg overflow-hidden">
                    <button
                        onClick={() => setShowDenomDetails(!showDenomDetails)}
                        className="w-full flex items-center justify-between p-3 bg-muted/20 hover:bg-muted/30 transition-colors"
                    >
                        <div className="flex items-center space-x-2 text-xs font-bold text-muted-foreground uppercase">
                            <History className="w-3 h-3" />
                            <span>Opening Denomination Details</span>
                        </div>
                        {showDenomDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {showDenomDetails && (
                        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-background">
                            {(currentShift.opening_cash_details as CashDenomination[]).map((d: any) => (
                                d.count > 0 && (
                                    <div key={d.value} className="flex flex-col p-2 border rounded bg-muted/5">
                                        <span className="text-[10px] text-muted-foreground font-bold">${d.label}</span>
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-xs">x{d.count}</span>
                                            <span className="font-mono font-bold">${(d.value * d.count).toFixed(2)}</span>
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>
                    )}
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ShiftManager;
