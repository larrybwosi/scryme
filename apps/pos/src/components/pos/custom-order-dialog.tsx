'use client';

import { useState } from 'react';
import { usePosStore } from '@/store/store';
import { useUiStore } from '@/store/ui-store';
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
import { Textarea } from '@repo/ui/components/ui/textarea';
import { Checkbox } from '@repo/ui/components/ui/checkbox';
import { Separator } from '@repo/ui/components/ui/separator';
import { Calendar, Clock, User, Phone, Mail, FileText, ShoppingBag, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export function CustomOrderDialog() {
  const { customOrderDialogOpen, setCustomOrderDialogOpen, setPaymentDialogOpen } = useUiStore();
  const currentOrder = usePosStore(state => state.currentOrder);
  const setCustomer = usePosStore(state => state.setCustomer);
  const setOrderType = usePosStore(state => state.setOrderType);
  const currency = usePosStore(state => state.settings.currency) || 'KSH';

  const [customerName, setCustomerName] = useState(currentOrder.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(currentOrder.customerPhone || '');
  const [customerEmail, setCustomerEmail] = useState('');
  const [saveAsCustomer, setSaveAsCustomer] = useState(true);

  // Customization & Due Schedule
  const todayStr = new Date().toISOString().split('T')[0];
  const [dueDate, setDueDate] = useState(todayStr);
  const [dueTime, setDueTime] = useState('14:00');
  const [cakeFlavor, setCakeFlavor] = useState('');
  const [inscription, setInscription] = useState('');
  const [customizationNotes, setCustomizationNotes] = useState('');

  // Deposit
  const total = currentOrder.items.reduce((sum, item) => {
    return sum + (item.selectedUnit?.price ?? 0) * item.quantity;
  }, 0);
  const [depositAmount, setDepositAmount] = useState<number>(Math.round(total * 0.5));

  const itemsCount = currentOrder.items.length;

  const handleProceed = () => {
    if (!customerName.trim()) {
      toast.error('Customer name is required for custom orders');
      return;
    }
    if (!customerPhone.trim()) {
      toast.error('Customer phone number is required for pickup coordination');
      return;
    }
    if (!dueDate || !dueTime) {
      toast.error('Due date and time are required');
      return;
    }

    // 1. Update customer profile in order context
    setCustomer({
      id: currentOrder.customerId || 'temp-custom-customer',
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      totalPurchases: 0,
      lastVisit: new Date(),
      loyaltyPoints: currentOrder.loyaltyPoints || 0,
      customerType: 'retail',
    });

    // 2. Set order type to pickup
    setOrderType('pickup');

    // 3. Attach custom order metadata to state
    usePosStore.setState(state => ({
      currentOrder: {
        ...state.currentOrder,
        orderType: 'pickup',
        customerName,
        customerPhone,
        instructions: customizationNotes || state.currentOrder.instructions,
        metadata: {
          ...state.currentOrder.metadata,
          isCustomOrder: true,
          dueDate,
          dueTime,
          scheduledAt: `${dueDate}T${dueTime}:00`,
          cakeFlavor,
          inscription,
          customizationNotes,
          saveAsCustomer,
          customerEmail,
          depositAmount: Math.min(depositAmount, total),
        },
      },
    }));

    toast.success('Custom Order Configured', {
      description: `Due on ${dueDate} at ${dueTime}. Proceeding to deposit payment.`,
    });

    setCustomOrderDialogOpen(false);
    setPaymentDialogOpen(true);
  };

  return (
    <Dialog open={customOrderDialogOpen} onOpenChange={setCustomOrderDialogOpen}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Custom Customer Order (Cake / Pre-order)
          </DialogTitle>
          <DialogDescription>
            Record customer details, customization specifications, pickup schedule, and deposit amount.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* --- Section 1: Customer Info --- */}
          <div className="space-y-3 bg-muted/40 p-3 rounded-lg border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Customer Contact Information
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="cust-name" className="text-xs">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cust-name"
                  placeholder="e.g. Jane Doe"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cust-phone" className="text-xs">
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cust-phone"
                  placeholder="e.g. +254712345678"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 items-center">
              <div className="space-y-1">
                <Label htmlFor="cust-email" className="text-xs">
                  Email Address (Optional)
                </Label>
                <Input
                  id="cust-email"
                  type="email"
                  placeholder="jane@example.com"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="flex items-center space-x-2 pt-4">
                <Checkbox
                  id="save-customer"
                  checked={saveAsCustomer}
                  onCheckedChange={(checked) => setSaveAsCustomer(!!checked)}
                />
                <Label htmlFor="save-customer" className="text-xs cursor-pointer font-medium">
                  Save as permanent customer profile
                </Label>
              </div>
            </div>
          </div>

          {/* --- Section 2: Due Date & Time --- */}
          <div className="space-y-3 bg-muted/40 p-3 rounded-lg border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Scheduled Completion & Pickup
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="due-date" className="text-xs">
                  Completion Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="due-date"
                  type="date"
                  value={dueDate}
                  min={todayStr}
                  onChange={e => setDueDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="due-time" className="text-xs">
                  Completion Time <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="due-time"
                  type="time"
                  value={dueTime}
                  onChange={e => setDueTime(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>

          {/* --- Section 3: Customization Specifications --- */}
          <div className="space-y-3 bg-muted/40 p-3 rounded-lg border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Order Customizations & Inscription
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="cake-flavor" className="text-xs">
                  Flavor / Tier Specs
                </Label>
                <Input
                  id="cake-flavor"
                  placeholder="e.g. Red Velvet, 2-Tier, Vanilla Filling"
                  value={cakeFlavor}
                  onChange={e => setCakeFlavor(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="inscription" className="text-xs">
                  Writing / Inscription on Cake
                </Label>
                <Input
                  id="inscription"
                  placeholder='e.g. "Happy 30th Birthday Sarah!"'
                  value={inscription}
                  onChange={e => setInscription(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="custom-notes" className="text-xs">
                Design & Decoration Notes
              </Label>
              <Textarea
                id="custom-notes"
                placeholder="Specific color themes, reference images, dietary requests (e.g., eggless, nut-free)..."
                value={customizationNotes}
                onChange={e => setCustomizationNotes(e.target.value)}
                rows={2}
                className="text-xs resize-none"
              />
            </div>
          </div>

          {/* --- Section 4: Deposit & Totals Summary --- */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 rounded-lg space-y-2">
            <div className="flex justify-between items-center text-xs text-amber-900 dark:text-amber-200 font-medium">
              <span>Total Order Value ({itemsCount} items)</span>
              <span className="font-bold text-sm">{currency} {total.toLocaleString()}</span>
            </div>
            <Separator className="bg-amber-200 dark:bg-amber-800/60" />
            <div className="flex justify-between items-center gap-4">
              <div>
                <Label htmlFor="deposit-amount" className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  Initial Deposit Amount
                </Label>
                <p className="text-[10px] text-amber-700 dark:text-amber-300">
                  Remaining balance of {currency} {Math.max(0, total - depositAmount).toLocaleString()} will be due at pickup.
                </p>
              </div>
              <div className="w-36">
                <Input
                  id="deposit-amount"
                  type="number"
                  value={depositAmount}
                  max={total}
                  onChange={e => setDepositAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="h-9 text-right font-bold text-sm bg-background border-amber-300"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={() => setCustomOrderDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleProceed} className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold">
            <ShoppingBag className="w-4 h-4" /> Collect Deposit ({currency} {depositAmount.toLocaleString()})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
