import React, { useState, useEffect } from 'react';
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
import { Sparkles, Calendar, User, FileText, ShoppingBag, UserCheck } from 'lucide-react';
import { usePosStore } from '@/store/store';
import { useUiStore } from '@/store/ui-store';
import { CustomerSelector } from '@/components/customer-selector';
import { toast } from 'sonner';

export function CustomOrderDialog() {
  const { customOrderDialogOpen, setCustomOrderDialogOpen, setPaymentDialogOpen } = useUiStore();
  const { currentOrder, setCustomer, setOrderType } = usePosStore();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [saveAsCustomer, setSaveAsCustomer] = useState(true);

  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('14:00');

  const [itemSpecs, setItemSpecs] = useState('');
  const [inscription, setInscription] = useState('');
  const [customizationNotes, setCustomizationNotes] = useState('');

  const [depositAmount, setDepositAmount] = useState<number>(0);

  const isCustomerSelected = Boolean(
    currentOrder.customerId &&
      currentOrder.customerId !== 'temp-custom-customer' &&
      !currentOrder.customerId.startsWith('temp-')
  );

  const itemsCount = currentOrder.items.reduce((acc, i) => acc + i.quantity, 0);
  const total = currentOrder.items.reduce((acc, i) => {
    const itemPrice = i.selectedUnit?.price ?? 0;
    return acc + itemPrice * i.quantity;
  }, 0);
  const currency = 'KES';

  // Initialize values when dialog opens or cart items change
  useEffect(() => {
    if (customOrderDialogOpen) {
      setCustomerName(currentOrder.customerName || '');
      setCustomerPhone(currentOrder.customerPhone || '');
      setCustomerEmail(currentOrder.metadata?.customerEmail || '');
      if (currentOrder.customerId) {
        setSaveAsCustomer(false);
      }

      // Default due date to tomorrow if not set
      if (!dueDate) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setDueDate(tomorrow.toISOString().split('T')[0]);
      }

      // Default deposit to 50% or full if total is small
      if (depositAmount === 0 && total > 0) {
        setDepositAmount(Math.round(total * 0.5));
      }
    }
  }, [customOrderDialogOpen, total]);

  // Sync state when customer is selected via CustomerSelector
  useEffect(() => {
    if (customOrderDialogOpen && currentOrder.customerId) {
      setCustomerName(currentOrder.customerName || '');
      setCustomerPhone(currentOrder.customerPhone || '');
      if (currentOrder.metadata?.customerEmail) {
        setCustomerEmail(currentOrder.metadata.customerEmail);
      }
      setSaveAsCustomer(false);
    }
  }, [customOrderDialogOpen, currentOrder.customerId, currentOrder.customerName, currentOrder.customerPhone]);

  const todayStr = new Date().toISOString().split('T')[0];

  const handleProceed = () => {
    const finalName = isCustomerSelected ? (currentOrder.customerName || customerName) : customerName;
    const finalPhone = isCustomerSelected ? (currentOrder.customerPhone || customerPhone) : customerPhone;
    const finalEmail = isCustomerSelected ? (currentOrder.metadata?.customerEmail || customerEmail) : customerEmail;

    if (!finalName || !finalName.trim()) {
      toast.error('Customer name is required');
      return;
    }
    if (!finalPhone || !finalPhone.trim()) {
      toast.error('Customer phone number is required');
      return;
    }
    if (!dueDate || !dueTime) {
      toast.error('Due date and time are required');
      return;
    }

    // 1. Update customer profile in order context
    setCustomer({
      id: currentOrder.customerId || 'temp-custom-customer',
      name: finalName,
      email: finalEmail,
      phone: finalPhone,
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
        customerName: finalName,
        customerPhone: finalPhone,
        instructions: customizationNotes || state.currentOrder.instructions,
        metadata: {
          ...state.currentOrder.metadata,
          isCustomOrder: true,
          dueDate,
          dueTime,
          scheduledAt: `${dueDate}T${dueTime}:00`,
          itemSpecs,
          inscription,
          customizationNotes,
          saveAsCustomer: isCustomerSelected ? false : saveAsCustomer,
          customerEmail: finalEmail,
          depositAmount: Math.min(depositAmount, total),
          remainingBalance: Math.max(0, total - Math.min(depositAmount, total)),
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
            Custom Customer Order (Pre-order)
          </DialogTitle>
          <DialogDescription>
            Select an existing customer or enter details, customization specifications, schedule, and deposit amount.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* --- Section 1: Customer Info --- */}
          <div className="space-y-3 bg-muted/40 p-3 rounded-lg border">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Customer Contact Information
              </h4>
              {currentOrder.customerId ? (
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <UserCheck className="w-3 h-3" /> Registered Customer
                </span>
              ) : null}
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">
                Select Existing Customer (Optional)
              </Label>
              <CustomerSelector />
            </div>

            {isCustomerSelected ? (
              <div className="bg-background/80 p-2.5 rounded border text-xs space-y-1">
                <div className="font-semibold text-foreground">
                  {currentOrder.customerName || 'Selected Customer'}
                </div>
                {currentOrder.customerPhone ? (
                  <div className="text-muted-foreground">Phone: {currentOrder.customerPhone}</div>
                ) : (
                  <div className="space-y-1">
                    <Label htmlFor="cust-phone-selected" className="text-xs font-medium">
                      Phone Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="cust-phone-selected"
                      placeholder="e.g. +254712345678"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                )}
                {currentOrder.metadata?.customerEmail && (
                  <div className="text-muted-foreground">Email: {currentOrder.metadata.customerEmail}</div>
                )}
              </div>
            ) : (
              <>
                <Separator className="my-2" />

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="cust-name" className="text-xs">
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="cust-name"
                      placeholder="e.g. Jane Doe"
                      value={customerName}
                      onChange={e => {
                        setCustomerName(e.target.value);
                        if (currentOrder.customerId) {
                          usePosStore.getState().setCustomerId('');
                        }
                      }}
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
                      onChange={e => {
                        setCustomerPhone(e.target.value);
                        if (currentOrder.customerId) {
                          usePosStore.getState().setCustomerId('');
                        }
                      }}
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
              </>
            )}
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
              <FileText className="w-3.5 h-3.5" /> Order Customizations & Specifications
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="item-specs" className="text-xs">
                  Item Specifications / Variants
                </Label>
                <Input
                  id="item-specs"
                  placeholder="e.g. Size, Color, Custom Options"
                  value={itemSpecs}
                  onChange={e => setItemSpecs(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="inscription" className="text-xs">
                  Custom Marking / Inscription
                </Label>
                <Input
                  id="inscription"
                  placeholder='e.g. Engraving, Custom text or label'
                  value={inscription}
                  onChange={e => setInscription(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="custom-notes" className="text-xs">
                Design & Customization Notes
              </Label>
              <Textarea
                id="custom-notes"
                placeholder="Specific instructions, reference details, special handling..."
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

        <DialogFooter className="gap-2 pt-2 sm:justify-between">
          {currentOrder.metadata?.isCustomOrder ? (
            <Button
              variant="destructive"
              onClick={() => {
                usePosStore.getState().cancelPreOrder();
                toast.info('Pre-order cancelled. Switched to normal sale mode.');
                setCustomOrderDialogOpen(false);
              }}
            >
              Cancel Pre-Order
            </Button>
          ) : <div />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCustomOrderDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={handleProceed} className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold">
              <ShoppingBag className="w-4 h-4" /> Collect Deposit ({currency} {depositAmount.toLocaleString()})
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
