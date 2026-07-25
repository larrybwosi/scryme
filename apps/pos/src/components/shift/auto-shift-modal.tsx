import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@repo/ui/components/ui/dialog';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { usePosStore } from '@/store/store';
import { useAuth } from '@/hooks/use-auth';
import { shiftService } from '@/lib/shift-service';
import { useCashDrawer } from '@/hooks/use-cash-drawer';
import { toast } from 'sonner';
import { ArrowRightCircle, DollarSign, Lock, LayoutGrid } from 'lucide-react';
import {
  CashDenominationCounter,
  DEFAULT_DENOMINATIONS,
  CashDenomination
} from '@/components/cash-denomination-counter';

export const AutoShiftModal: React.FC = () => {
  const { settings } = usePosStore();
  const { isAuthenticated, currentMember } = useAuth();
  const { openPhysicalDrawer } = useCashDrawer();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [denominations, setDenominations] = useState<CashDenomination[]>(DEFAULT_DENOMINATIONS);
  const [useDetails, setUseDetails] = useState(false);

  const denomTotal = useMemo(() =>
    denominations.reduce((acc, curr) => acc + curr.value * curr.count, 0),
  [denominations]);

  useEffect(() => {
    const checkShiftStatus = async () => {
      if (
        isAuthenticated &&
        settings.enableAutoShiftPrompt &&
        import.meta.env.MODE !== 'standalone'
      ) {
        try {
          const shift = await shiftService.getShiftStatus();
          if (!shift) {
            setIsOpen(true);
          }
        } catch (err) {
          console.error("Failed to check shift status for auto-prompt:", err);
        }
      }
    };

    checkShiftStatus();
  }, [isAuthenticated, settings.enableAutoShiftPrompt]);

  const handleOpenShift = async () => {
    if (!isAuthenticated) {
      if (!currentMember?.cardId) return toast.error('No card ID associated with current user');
      if (!pin) return toast.error('Please enter your PIN');
    }

    const openingAmount = useDetails ? denomTotal : Number(amount);
    if (isNaN(openingAmount) || openingAmount < 0) {
        return toast.error('Please enter a valid amount');
    }

    setLoading(true);
    try {
      await shiftService.openShift(
        isAuthenticated ? null : currentMember?.cardId,
        isAuthenticated ? null : pin,
        openingAmount,
        useDetails ? denominations : null
      );

      await openPhysicalDrawer();
      toast.success('Shift Opened Successfully');
      setIsOpen(false);

      // Clear state
      setPin('');
      setAmount('');
      setDenominations(DEFAULT_DENOMINATIONS);
    } catch (e) {
      toast.error('Error opening shift: ' + e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => {
        // Prevent closing the modal without opening a shift if it's forced
        // But usually it's better to allow closing and just prompt again on next check/refresh
        setIsOpen(val);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <ArrowRightCircle className="w-6 h-6 text-green-500" />
            <DialogTitle>Start New Shift</DialogTitle>
          </div>
          <DialogDescription>
            You need to open a shift to begin operations. Record the starting float.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Operator Info */}
          <div className="p-3 bg-muted/50 rounded-lg border border-border flex items-center justify-between">
             <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <LayoutGrid className="w-4 h-4 text-primary" />
                </div>
                <div>
                    <div className="text-[10px] uppercase font-bold text-muted-foreground">Operator</div>
                    <div className="text-sm font-medium">{currentMember?.name || 'Unknown'}</div>
                </div>
             </div>
             <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-muted-foreground">Card ID</div>
                <div className="text-xs font-mono">{currentMember?.cardId || 'None'}</div>
             </div>
          </div>

          {!isAuthenticated && (
            <div className="space-y-1.5">
              <Label htmlFor="auto-pin-input" className="text-xs uppercase text-muted-foreground">Confirm Your PIN</Label>
              <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                  id="auto-pin-input"
                  type="password"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder="Enter PIN"
                  className="pl-10 bg-background"
                  />
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-bold">Opening Float</Label>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUseDetails(!useDetails)}
                    className="text-primary h-8"
                >
                    {useDetails ? "Simple Amount" : "Cash Counter"}
                </Button>
            </div>

            {useDetails ? (
                <div className="p-4 border rounded-lg bg-muted/30 max-h-[300px] overflow-y-auto no-scrollbar">
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
                        autoFocus
                    />
                </div>
            )}
          </div>

          <Button
            onClick={handleOpenShift}
            disabled={loading || (!isAuthenticated && !pin)}
            className="w-full h-12 text-lg font-bold bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Opening...' : 'Open Shift & Drawer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
