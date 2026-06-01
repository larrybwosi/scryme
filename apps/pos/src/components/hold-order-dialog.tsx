'use client';

import { useState } from 'react';
import { usePosStore, type HeldOrderPriority } from '@/store/store';
import posthog from 'posthog-js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@repo/ui/components/ui/dialog';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Badge } from '@repo/ui/components/ui/badge';
import { Separator } from '@repo/ui/components/ui/separator';
import { Pause, Clock, AlertTriangle, AlertCircle, ShoppingBag, User, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface HoldOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onHoldComplete?: () => void;
}

const QUICK_REASONS = [
  'Customer stepped away',
  'Price check needed',
  'Manager approval',
  'Payment issue',
  'Item lookup',
  'Loyalty lookup',
];

// Updated priorityOptions with dark-mode safe semantic colors
const priorityOptions: {
  value: HeldOrderPriority;
  label: string;
  description: string;
  color: string;
  iconColor: string;
}[] = [
  {
    value: 'normal',
    label: 'Normal',
    description: 'Standard hold priority',
    color: 'border-border bg-card hover:bg-accent',
    iconColor: 'text-muted-foreground',
  },
  {
    value: 'high',
    label: 'High',
    description: 'Customer waiting nearby',
    color: 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 dark:border-amber-500/20 dark:bg-amber-500/10',
    iconColor: 'text-amber-600 dark:text-amber-500',
  },
  {
    value: 'urgent',
    label: 'Urgent',
    description: 'Immediate attention needed',
    color:
      'border-destructive/30 bg-destructive/5 hover:bg-destructive/10 dark:border-destructive/20 dark:bg-destructive/10',
    iconColor: 'text-destructive',
  },
];

export function HoldOrderDialog({ open, onOpenChange, onHoldComplete }: HoldOrderDialogProps) {
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState<HeldOrderPriority>('normal');

  const currentOrder = usePosStore(state => state.currentOrder);
  const holdCurrentOrder = usePosStore(state => state.holdCurrentOrder);
  const heldOrders = usePosStore(state => state.heldOrders);
  const maxHeldOrders = usePosStore(state => state.settings.maxHeldOrders);
  const requireHoldReason = usePosStore(state => state.settings.requireHoldReason);
  const currency = usePosStore(state => state.settings.currency) || 'KSH';

  const itemsCount = currentOrder.items.length;
  const total = currentOrder.items.reduce((sum, item) => {
    return sum + (item.selectedUnit?.price ?? 0) * item.quantity;
  }, 0);

  const canHold = heldOrders.length < maxHeldOrders;
  const reasonValid = !requireHoldReason || reason.trim().length > 0;

  const handleHold = () => {
    if (!canHold) {
      toast.error('Maximum held orders reached');
      return;
    }

    if (!reasonValid) {
      toast.error('Reason required');
      return;
    }

    holdCurrentOrder(reason.trim() || undefined, priority);

    posthog.capture('order_held', {
      items_count: itemsCount,
      total,
      priority,
      has_reason: reason.trim().length > 0,
    });

    toast.success('Order Held', {
      description: `${itemsCount} item${itemsCount !== 1 ? 's' : ''} held successfully`,
      icon: <Pause className="w-4 h-4" />,
    });

    setReason('');
    setPriority('normal');
    onOpenChange(false);
    onHoldComplete?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pause className="w-5 h-5 text-primary" />
            Hold Order
          </DialogTitle>
          <DialogDescription>
            Temporarily save this order and clear the cart. You can recall it later.
          </DialogDescription>
        </DialogHeader>

        {/* Order Summary - Uses bg-muted/50 for subtle contrast in both modes */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2 border border-border/50">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <ShoppingBag className="w-4 h-4" />
              Items
            </span>
            <span className="font-medium">{itemsCount}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <User className="w-4 h-4" />
              Customer
            </span>
            <span className="font-medium">{currentOrder.customerName || 'Walk-in'}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Estimated Total</span>
            <span className="text-lg font-bold text-primary">
              {currency} {total.toLocaleString()}
            </span>
          </div>
        </div>

        {!canHold && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-destructive">Maximum Held Orders Reached</p>
              <p className="text-muted-foreground text-xs">
                You have {heldOrders.length}/{maxHeldOrders} held orders.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Label htmlFor="reason" className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            Reason {requireHoldReason && <span className="text-destructive">*</span>}
          </Label>
          <Input
            id="reason"
            placeholder={requireHoldReason ? 'Enter reason...' : 'Optional reason...'}
            value={reason}
            onChange={e => setReason(e.target.value)}
            className={cn(!reasonValid && 'border-destructive focus-visible:ring-destructive')}
          />

          <div className="flex flex-wrap gap-1.5">
            {QUICK_REASONS.map(quickReason => (
              <Badge
                key={quickReason}
                variant="secondary"
                className={cn(
                  'cursor-pointer transition-colors text-xs font-normal border-transparent',
                  reason === quickReason
                    ? 'bg-primary text-primary-foreground hover:bg-primary'
                    : 'hover:bg-accent text-muted-foreground'
                )}
                onClick={() => setReason(quickReason)}
              >
                {quickReason}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Priority
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {priorityOptions.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPriority(option.value)}
                className={cn(
                  'p-3 rounded-lg border text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  option.color,
                  priority === option.value
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                    : 'opacity-80 hover:opacity-100'
                )}
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  {option.value === 'high' && <AlertTriangle className={cn('w-3 h-3', option.iconColor)} />}
                  {option.value === 'urgent' && <AlertCircle className={cn('w-3 h-3', option.iconColor)} />}
                  <span className="font-semibold text-xs">{option.label}</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">{option.description}</p>
              </button>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleHold} disabled={!canHold || !reasonValid || itemsCount === 0} className="gap-2">
            <Pause className="w-4 h-4" />
            Hold Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
