'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { usePosStore } from '@/store/store';
import { useUiStore } from '@/store/ui-store';
import { Card } from '@repo/ui/components/ui/card';
import { Button } from '@repo/ui/components/ui/button';
import { Textarea } from '@repo/ui/components/ui/textarea';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@repo/ui/components/ui/dialog';
import { Trash2, Edit2, Minus, Plus, PanelRightClose, PanelRightOpen, ShoppingCart, Pause, Clock, ImageOff, User, ReceiptText, Printer, Package, Tag, ShieldCheck } from 'lucide-react';
import { Kbd } from '@/components/ui/kbd';
import PaymentModal from '@/components/pos/payment-dialog';
import { CustomerSelector } from '@/components/customer-selector';
import { ToggleGroup, ToggleGroupItem } from '@repo/ui/components/ui/toggle-group';
import { AgeVerificationDialog } from '@/components/age-verification-dialog';
import type { Order, CartItem, Customer, OrderType } from '@/types';
import { ReceiptDialog } from '@/components/receipt-dialog';
import { cn } from '@/lib/utils';
import { emitTo } from '@tauri-apps/api/event';
import { HeldOrdersDialog } from '@/components/held-orders-dialog';
import { PrescriptionDialog } from '@/components/pos/prescription-dialog';
import { HoldOrderDialog } from '@/components/hold-order-dialog';
import { convertFileSrc } from '@tauri-apps/api/core';
import { usePrinter } from '@/hooks/use-printer';
import { toast } from 'sonner';

export function Cart() {
  // --- Layout & Resize States ---
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [width, setWidth] = useState(384);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // --- UI States ---
  const {
    paymentDialogOpen, setPaymentDialogOpen,
    holdOrderDialogOpen, setHoldOrderDialogOpen,
    prescriptionDialogOpen, setPrescriptionDialogOpen
  } = useUiStore();

  const [ageVerificationOpen, setAgeVerificationOpen] = useState(false);
  const [ageVerified, setAgeVerified] = useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [lastCompletedOrder, setLastCompletedOrder] = useState<any>(null);

  // --- Edit Item States ---
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editQuantity, setEditQuantity] = useState(1);
  const [editNotes, setEditNotes] = useState('');
  const [editDosageInstructions, setEditDosageInstructions] = useState('');
  const [editUnitId, setEditUnitId] = useState('');

  // --- UI Control States ---
  const [showPharmacistVerification, setShowPharmacistVerification] = useState(false);
  const [showHeldOrdersDialog, setShowHeldOrdersDialog] = useState(false);
  const [isPrintingBill, setIsPrintingBill] = useState(false);

  // --- Printer Hook ---
  const { printNative } = usePrinter();

  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modifier = isMac ? '⌘' : 'Ctrl';

  // --- Store Hooks ---
  const currentOrder = usePosStore(state => state.currentOrder);
  const taxRate = usePosStore(state => state.settings.taxRate) || 0;
  const getBusinessConfig = usePosStore(state => state.getBusinessConfig);
  const tables = usePosStore(state => state.tables);
  const setOrderType = usePosStore(state => state.setOrderType);
  const setTableNumber = usePosStore(state => state.setTableNumber);
  const setInstructions = usePosStore(state => state.setInstructions);
  const removeItemFromOrder = usePosStore(state => state.removeItemFromOrder);
  const updateItemInOrder = usePosStore(state => state.updateItemInOrder);
  const resetOrder = usePosStore(state => state.resetOrder);

  // --- Hold Sale Store Hooks ---
  const heldOrders = usePosStore(state => state.heldOrders);
  const enableHoldSale = usePosStore(state => state.settings.enableHoldSale) && import.meta.env.MODE !== 'standalone';

  // --- Config ---
  const businessConfig = getBusinessConfig();
  const availableOrderTypes = businessConfig.orderTypes;
  const showTableField = businessConfig.features.tableManagement && import.meta.env.MODE !== 'standalone';
  const requiresAgeVerification = businessConfig.features.ageVerification;
  const availableTables = tables.filter(t => t.status === 'available');

  // --- Resizing Logic ---
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        const newWidth = document.body.clientWidth - mouseMoveEvent.clientX;
        if (newWidth > 320 && newWidth < 800) {
          setWidth(newWidth);
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  // --- Calculations ---
  const { subTotal, taxAmount, total } = useMemo(() => {
    const totalWithTax = currentOrder.items.reduce((sum, item) => {
      const price = item.selectedUnit?.price || 0;
      return sum + price * item.quantity;
    }, 0);

    const extractedTax = totalWithTax - totalWithTax / (1 + taxRate / 100);
    const subTotalBeforeTax = totalWithTax - extractedTax;

    return {
      subTotal: subTotalBeforeTax,
      taxAmount: extractedTax,
      total: totalWithTax,
    };
  }, [currentOrder.items, taxRate]);

  // --- CUSTOMER DISPLAY SYNC ---
  useEffect(() => {
    const syncToCustomerScreen = async () => {
      try {
        const displayItems = currentOrder.items.map(item => ({
          name: item.productName,
          variant: item.variantName || '',
          qty: item.quantity,
          price: item.selectedUnit?.price || 0,
        }));

        await emitTo('customer', 'cart-update', {
          items: displayItems,
          subtotal: subTotal,
          tax: taxAmount,
          discount: 0,
          finalTotal: total,
        });
      } catch (e) {
        console.warn('Failed to emit to customer screen:', e);
      }
    };

    syncToCustomerScreen();
  }, [currentOrder.items, subTotal, taxAmount, total]);

  // --- Mappers ---
  const mappedCartItems: CartItem[] = useMemo(() => {
    return currentOrder.items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      price: item.selectedUnit?.price || 0,
      imageUrl: item.imageUrl,
      variant: item.variantName,
      variantId: item.variantId || undefined,
      unitId: item.selectedUnit?.unitId,
      unitName: item.selectedUnit?.unitName,
      selectedUnit: item.selectedUnit,
      notes: item.notes,
    }));
  }, [currentOrder.items]);

  const activeCustomer: Customer | null = useMemo(() => {
    if (!currentOrder.customerId && !currentOrder.customerName) return null;
    return {
      id: currentOrder.customerId || 'guest',
      name: currentOrder.customerName || 'Guest',
      phone: (currentOrder as any).customerPhone,
      loyaltyPoints: (currentOrder as any).loyaltyPoints || 0,
    };
  }, [currentOrder]);

  // --- Handlers ---
  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setEditQuantity(item.quantity);
    setEditNotes(item.notes || '');
    setEditDosageInstructions(item.dosageInstructions || '');
    setEditUnitId(item.selectedUnit?.unitId || '');
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;

    // Find the product to get the full unit info
    const product = usePosStore.getState().products.find(p => p.productId === editingItem.productId);
    const variant = (product?.variants as any[])?.find(v => v.variantId === editingItem.variantId);
    const unit = variant?.sellableUnits.find((u: any) => u.unitId === editUnitId);
    const newUnit = unit || editingItem.selectedUnit;

    // Recalculate price based on the current pricing mode (if needed, although store usually handles it on add)
    // Here we should probably just use the unit's price as the default,
    // but the store expect `price` at the root of OrderItem too.

    // We check the URL or state to see if we are in wholesale mode.
    // In this component, we don't have a direct `pricingMode` state like POS.tsx,
    // but we can infer it from the item itself if it was already marked as wholesale,
    // or better, check if the business supports it.

    const isWholesale = editingItem.isWholesale;
    let newPrice = Number(newUnit.price);
    if (isWholesale && newUnit.wholesalePrice) {
      newPrice = Number(newUnit.wholesalePrice);
    }

    updateItemInOrder({
      ...editingItem,
      quantity: editQuantity,
      notes: editNotes,
      dosageInstructions: editDosageInstructions,
      price: newPrice, // CRITICAL: Update the root price
      selectedUnit: newUnit,
      originalUnitId: editingItem.selectedUnit?.unitId,
    } as any);
    setIsEditDialogOpen(false);
    setEditingItem(null);
  };

  const hasPrescriptionItems = useMemo(() => {
    return currentOrder.items.some(item => item.requiresPrescription);
  }, [currentOrder.items]);

  const handleConfirmPayment = () => {
    if (businessConfig.type === 'pharmacy' && hasPrescriptionItems && !currentOrder.isPharmacistVerified) {
      setShowPharmacistVerification(true);
      return;
    }

    if (requiresAgeVerification && !ageVerified) {
      setAgeVerificationOpen(true);
    } else {
      setPaymentDialogOpen(true);
    }
  };

  const handlePharmacistVerify = () => {
    usePosStore.setState(state => ({
      currentOrder: { ...state.currentOrder, isPharmacistVerified: true }
    }));
    setShowPharmacistVerification(false);

    // Proceed to next step
    if (requiresAgeVerification && !ageVerified) {
      setAgeVerificationOpen(true);
    } else {
      setPaymentDialogOpen(true);
    }
  };

  const handleAgeVerified = () => {
    setAgeVerified(true);
    setPaymentDialogOpen(true);
  };

  const handlePaymentComplete = useCallback(
    (completedOrder: Order) => {
      setLastCompletedOrder(completedOrder);
      setPaymentDialogOpen(false);
      setReceiptDialogOpen(true);
      setAgeVerified(false);
      resetOrder();
    },
    [resetOrder, setPaymentDialogOpen]
  );

  const handleCloseReceipt = () => {
    setReceiptDialogOpen(false);
    setLastCompletedOrder(null);
  };

  const handlePrintBill = async () => {
    if (currentOrder.items.length === 0) return;

    setIsPrintingBill(true);
    try {
      // Prepare order data for backend
      const orderData = {
        ...currentOrder,
        subTotal,
        taxAmount,
        total,
        createdAt: new Date().toISOString(),
        userName: (usePosStore.getState().settings as any).userName || 'Staff',
      };

      const result = await printNative('bill', orderData as any, usePosStore.getState().settings);

      if (result.success) {
        toast.success('Bill Printed', {
          description: 'The pro-forma bill has been sent to the printer.',
          icon: <ReceiptText className="w-5 h-5 text-green-500" />,
        });
      } else {
        throw new Error(result.error || 'Failed to print');
      }
    } catch (error) {
      console.error('Print Bill Error:', error);
      toast.error('Print Failed', {
        description: error instanceof Error ? error.message : 'Could not print the bill. Please check your printer connection.',
      });
    } finally {
      setIsPrintingBill(false);
    }
  };

  const getNormalizedOrderType = (type: string): OrderType => {
    const map: Record<string, OrderType> = {
      takeaway: 'Takeaway',
      delivery: 'Delivery',
      'dine-in': 'Dine in',
      pickup: 'Pickup',
      online: 'Online',
    };
    return map[type] || 'Dine in';
  };

  return (
    <>
      <div
        ref={sidebarRef}
        className="relative flex h-screen bg-card shadow-xl z-20 border-l border-border"
        style={{
          width: isCollapsed ? 0 : width,
          transition: isResizing ? 'none' : 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* --- 1. Expand Button --- */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          className={cn(
            'absolute top-4 -left-12 h-10 w-10 rounded-r-none rounded-l-md border border-r-0 border-border z-50 bg-card hover:bg-muted transition-all duration-300 shadow-sm',
            isCollapsed ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'
          )}
          title="Open Cart"
        >
          <PanelRightOpen className="h-4 w-4" />
          {currentOrder.items.length > 0 && (
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-in zoom-in shadow-sm">
              {currentOrder.items.length}
            </span>
          )}
        </Button>

        {/* --- 2. Resize Handle --- */}
        <div
          className={cn(
            'absolute top-0 bottom-0 -left-1.5 w-3 cursor-col-resize hover:bg-primary/10 transition-colors z-50 flex items-center justify-center group touch-none',
            isCollapsed ? 'hidden' : 'block'
          )}
          onMouseDown={startResizing}
        >
          <div className="h-12 w-1 rounded-full bg-border group-hover:bg-primary transition-colors" />
        </div>

        {/* --- 3. Inner Content Wrapper --- */}
        <div
          className={cn(
            'flex flex-col h-full w-full overflow-hidden bg-background',
            isCollapsed ? 'invisible opacity-0' : 'visible opacity-100 transition-opacity duration-300'
          )}
        >
          {/* --- Header Section --- */}
          <div className="p-4 border-b border-border bg-card shrink-0 space-y-3 shadow-sm z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold tracking-tight">Current Order</h2>
                <p className="text-xs text-muted-foreground">Order #{'New'}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground -mr-2"
                onClick={() => setIsCollapsed(true)}
                title="Collapse Cart"
              >
                <PanelRightClose className="h-5 w-5" />
              </Button>
            </div>

            {/* Customer & Type Selectors */}
            <div className="grid grid-cols-5 gap-2">
              {import.meta.env.MODE !== 'standalone' && (
                <div className="col-span-3">
                  <CustomerSelector />
                </div>
              )}
              <div className={cn(import.meta.env.MODE === 'standalone' ? 'col-span-5' : 'col-span-2')}>
                <Select value={currentOrder.orderType} onValueChange={(value: any) => setOrderType(value)}>
                  <SelectTrigger className="h-10 text-xs bg-muted/40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOrderTypes.map(t => (
                      <SelectItem key={t} value={t}>
                        {getNormalizedOrderType(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table & Notes */}
            <div className="grid grid-cols-1 gap-2">
              <div className="flex gap-2">
                {showTableField && (
                  <Select value={currentOrder.tableNumber || 'No Table'} onValueChange={(val) => setTableNumber(val === 'No Table' ? '' : val)}>
                    <SelectTrigger className="h-9 text-xs flex-1 bg-muted/40">
                      <SelectValue placeholder="Select Table" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="No Table">No Table</SelectItem>
                      {availableTables.map(table => (
                        <SelectItem key={table.id} value={table.number}>
                          Table {table.number} ({table.capacity} pax)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {currentOrder.orderType === 'dine-in' && (
                  <div className="w-[88px] shrink-0">
                    <div className="relative flex items-center bg-muted/40 rounded-md border border-input h-9 overflow-hidden">
                      <button 
                        className="px-2 h-full text-muted-foreground hover:bg-muted/80 transition-colors"
                        onClick={() => {
                          const currentStr = usePosStore.getState().currentOrder.metadata?.guestsCount;
                          const guests = Math.max(1, (parseInt(currentStr) || 1) - 1);
                          usePosStore.setState(state => ({
                            currentOrder: { ...state.currentOrder, metadata: { ...state.currentOrder.metadata, guestsCount: guests } }
                          }));
                        }}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <div className="flex-1 flex justify-center text-xs font-medium">
                        {currentOrder.metadata?.guestsCount || 1}
                        <User className="w-3 h-3 ml-0.5 opacity-50" />
                      </div>
                      <button 
                        className="px-2 h-full text-muted-foreground hover:bg-muted/80 transition-colors"
                        onClick={() => {
                          const currentStr = usePosStore.getState().currentOrder.metadata?.guestsCount;
                          const guests = (parseInt(currentStr) || 1) + 1;
                          usePosStore.setState(state => ({
                            currentOrder: { ...state.currentOrder, metadata: { ...state.currentOrder.metadata, guestsCount: guests } }
                          }));
                        }}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <Textarea
                  placeholder="Add order notes regarding preparation..."
                  value={currentOrder.instructions || ''}
                  onChange={e => setInstructions(e.target.value)}
                  rows={1}
                  className="resize-none text-xs min-h-[38px] bg-muted/40 pr-8"
                />
                <Edit2 className="w-3 h-3 absolute right-3 top-3 text-muted-foreground opacity-50" />
              </div>
            </div>
          </div>

          {/* --- Cart Items List --- */}
          <div className="flex-1 overflow-y-auto bg-muted/5 p-2 space-y-2">
            {currentOrder.items.length > 0 ? (
              currentOrder.items.map((item, index) => {
                const unitId = item.selectedUnit?.unitId || 'default';
                const unitName = item.selectedUnit?.unitName || 'Unit';
                const price = item.selectedUnit?.price || 0;

                return (
                  <Card
                    key={`${item.productId}-${unitId}-${index}`}
                    className="group relative flex gap-3 p-2 bg-card hover:bg-accent/5 transition-colors border-border/40 rounded-none shadow-sm"
                  >
                    {/* Image */}
                    <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted shrink-0 border border-border/50">
                      {item.imageUrl ? (
                        <img
                          src={convertFileSrc(item.imageUrl)}
                          alt={item.productName}
                          className="object-cover w-full h-full"
                          loading="lazy"
                        />
                      ):(
                        <div className="flex flex-col items-center justify-center w-full h-full text-muted-foreground/30">
                          <ImageOff className="w-6 h-6 mb-1.5" />
                          <span className="text-xs font-medium">No Image</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm truncate text-foreground leading-tight">
                            {item.productName}
                          </h4>
                          <div className="text-[11px] text-muted-foreground flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                            <span className="truncate max-w-[100px]">{item.variantName}</span>
                            <span className="text-border mx-1">|</span>
                            <span>{unitName}</span>
                          </div>
                          {item.notes && (
                            <div className="text-[10px] text-amber-600 italic bg-amber-50 dark:bg-amber-950/30 px-1 py-0.5 rounded mt-1 inline-block truncate max-w-full">
                              Note: "{item.notes}"
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold text-sm">{price.toLocaleString()}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-1 bg-muted/50 rounded-md border border-border/50 h-7 px-1">
                          <button
                            className="h-full px-2 text-muted-foreground hover:text-foreground disabled:opacity-30"
                            onClick={() => updateItemInOrder({ ...item, quantity: Math.max(1, item.quantity - 1) })}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-mono font-medium min-w-[1.5rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            className="h-full px-2 text-muted-foreground hover:text-foreground"
                            onClick={() => updateItemInOrder({ ...item, quantity: item.quantity + 1 })}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                            onClick={() => handleOpenEdit(item)}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => removeItemFromOrder(item.productId, item.variantId, unitId)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground/50 space-y-4">
                <div className="p-6 bg-muted/30 rounded-full border border-dashed border-border">
                  <ShoppingCart className="w-10 h-10" />
                </div>
                <div className="text-center px-6">
                  <p className="font-medium text-foreground/80">Your cart is empty</p>
                  <p className="text-xs mt-1">Select items from the product list to start an order.</p>
                </div>
              </div>
            )}
          </div>

          {/* --- Footer --- */}
          <div className="p-4 bg-card border-t border-border shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] z-20 space-y-3">
            {/* Totals */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground text-xs">
                <span>Subtotal</span>
                <span>{subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-muted-foreground text-xs">
                <span>Tax ({taxRate}%)</span>
                <span>{taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="my-2 h-px bg-border/60 w-full" />

              <div className="flex justify-between items-end">
                <span className="font-bold text-base">Total</span>
                <span className="text-xl font-extrabold text-primary tracking-tight">
                  <span className="text-sm font-normal text-muted-foreground mr-1">KSH</span>
                  {total.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  {currentOrder.items.reduce((acc, i) => acc + i.quantity, 0)} items
                </span>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs text-destructive hover:text-destructive/80"
                  onClick={resetOrder}
                  disabled={currentOrder.items.length === 0}
                >
                  Clear Cart
                </Button>
              </div>
            </div>

            {/* Main Actions */}
            <div className="grid grid-cols-5 gap-2">
              {businessConfig.type === 'pharmacy' && (
                <Button
                  variant="outline"
                  className="col-span-1 h-12 flex-col gap-0.5 border-emerald-200 bg-emerald-50 text-emerald-700"
                  onClick={() => setPrescriptionDialogOpen(true)}
                  disabled={currentOrder.items.length === 0}
                  title="Prescription"
                >
                  <ReceiptText className="w-4 h-4" />
                  <span className="text-[10px] font-medium">RX</span>
                </Button>
              )}

              {enableHoldSale && (
                <Button
                  variant="outline"
                  className="col-span-1 h-12 flex-col gap-0.5 border-dashed relative group/btn"
                  onClick={() => setHoldOrderDialogOpen(true)}
                  disabled={currentOrder.items.length === 0}
                  title={`Hold Order (${modifier}+S)`}
                >
                  <Pause className="w-4 h-4" />
                  <span className="text-[10px] font-medium">Hold</span>
                  <Kbd className="absolute -top-2 -right-1 opacity-0 group-hover/btn:opacity-100 transition-opacity scale-75">S</Kbd>
                </Button>
              )}

              {businessConfig.type === 'restaurant' && (
                <Button
                  variant="outline"
                  className="col-span-1 h-12 flex-col gap-0.5"
                  onClick={handlePrintBill}
                  disabled={currentOrder.items.length === 0 || isPrintingBill}
                  title="Print Pro-forma Bill"
                >
                  {isPrintingBill ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : (
                    <Printer className="w-4 h-4" />
                  )}
                  <span className="text-[10px] font-medium">Bill</span>
                </Button>
              )}

              <Button
                className={cn(
                  'h-12 shadow-md text-sm font-bold uppercase tracking-wide relative group/btn',
                  (enableHoldSale && businessConfig.type === 'restaurant') ? 'col-span-3' :
                  (enableHoldSale || businessConfig.type === 'restaurant') ? 'col-span-4' : 'col-span-5'
                )}
                onClick={handleConfirmPayment}
                disabled={currentOrder.items.length === 0}
                title={`Checkout (${modifier}+Enter)`}
              >
                Checkout
                <Kbd className="absolute -top-2 -right-1 opacity-0 group-hover/btn:opacity-100 transition-opacity scale-75 text-primary-foreground bg-primary-foreground/20">↵</Kbd>
              </Button>
            </div>

            {/* Secondary Actions Row */}
            {enableHoldSale && heldOrders.length > 0 && (
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground gap-2 h-7"
                  onClick={() => setShowHeldOrdersDialog(true)}
                >
                  <Clock className="w-3.5 h-3.5" />
                  View {heldOrders.length} Held Order{heldOrders.length !== 1 ? 's' : ''}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- Dialogs --- */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription className="flex flex-col gap-1">
              <span>{editingItem?.productName}</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Package className="w-3 h-3" /> {editingItem?.variantName}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Unit Selection in Edit Dialog */}
            {(() => {
              const product = usePosStore.getState().products.find(p => p.productId === editingItem?.productId);
              const variant = (product?.variants as any[])?.find(v => v.variantId === editingItem?.variantId);
              const units = variant?.sellableUnits || [];

              if (units.length <= 1) return null;

              return (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider opacity-70">Selling Unit</Label>
                  <ToggleGroup
                    type="single"
                    value={editUnitId}
                    onValueChange={val => val && setEditUnitId(val)}
                    className="flex-wrap gap-2 justify-start"
                  >
                    {units.map((u: any) => (
                      <ToggleGroupItem
                        key={u.unitId}
                        value={u.unitId}
                        variant="outline"
                        className="h-8 px-3 text-xs rounded-full data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                      >
                        {u.unitName}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
              );
            })()}

            <div className="flex items-center justify-between">
              <Label htmlFor="quantity" className="text-right">
                Quantity
              </Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setEditQuantity(prev => Math.max(1, prev - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="quantity"
                  type="number"
                  value={editQuantity}
                  onChange={e => setEditQuantity(parseInt(e.target.value) || 1)}
                  className="w-16 text-center h-8"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setEditQuantity(prev => prev + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Item Notes</Label>
              <Textarea
                id="notes"
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
                placeholder="e.g., No Sugar, Extra Spicy..."
                className="resize-none"
                rows={2}
              />
            </div>

            {businessConfig.type === 'pharmacy' && (
              <div className="grid gap-2">
                <Label htmlFor="dosage" className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5" /> Dosage Instructions
                </Label>
                <Textarea
                  id="dosage"
                  value={editDosageInstructions}
                  onChange={e => setEditDosageInstructions(e.target.value)}
                  placeholder="e.g., Take 1 tablet twice daily after meals"
                  className="resize-none border-emerald-200 focus-visible:ring-emerald-500"
                  rows={2}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AgeVerificationDialog
        open={ageVerificationOpen}
        onOpenChange={setAgeVerificationOpen}
        onVerified={handleAgeVerified}
      />

      <PaymentModal
        isOpen={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        cartItems={mappedCartItems}
        subtotal={total}
        discount={0}
        customer={activeCustomer}
        orderType={getNormalizedOrderType(currentOrder.orderType)}
        tableNumber={currentOrder.tableNumber}
        onPaymentComplete={handlePaymentComplete}
      />

      <ReceiptDialog
        open={receiptDialogOpen}
        onOpenChange={setReceiptDialogOpen}
        completedOrder={lastCompletedOrder}
        onClose={handleCloseReceipt}
      />

      {/* Hold Sale Dialogs (Enterprise) */}
      <HoldOrderDialog open={holdOrderDialogOpen} onOpenChange={setHoldOrderDialogOpen} />

      {/* Pharmacy Dialogs */}
      <PrescriptionDialog open={prescriptionDialogOpen} onOpenChange={setPrescriptionDialogOpen} />

      <Dialog open={showPharmacistVerification} onOpenChange={setShowPharmacistVerification}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
              Pharmacist Verification Required
            </DialogTitle>
            <DialogDescription>
              This order contains prescription-only items. A registered pharmacist must verify this order before proceeding.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 flex items-center gap-3">
            <User className="w-10 h-10 text-emerald-600" />
            <div>
              <p className="text-sm font-bold text-emerald-900">Verification Step</p>
              <p className="text-xs text-emerald-700">Please confirm that you have reviewed the prescription and the items.</p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowPharmacistVerification(false)}>
              Cancel
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handlePharmacistVerify}>
              Verify & Proceed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <HeldOrdersDialog open={showHeldOrdersDialog} onOpenChange={setShowHeldOrdersDialog} />
    </>
  );
}
