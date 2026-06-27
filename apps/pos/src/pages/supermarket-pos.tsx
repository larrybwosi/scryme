'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { usePosStore } from '@/store/store';
import { usePosPricingSync } from '@/hooks/use-pricing-sync';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import {
  Search,
  X,
  WifiOff,
  Wifi,
  CheckCircle2,
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  Settings as SettingsIcon,
  LogOut,
  Package,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { shiftService } from '@/lib/shift-service';
import { usePosProducts } from '@/hooks/products';
import { useScanner } from '@/hooks/use-scanner';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import PaymentModal from '@/components/pos/payment-dialog';
import { ReceiptDialog } from '@/components/receipt-dialog';
import { useProcessSale, PaymentMethod, PaymentStatus } from '@/hooks/sales';
import { useAuthStore } from '@/store/pos-auth-store';
import { useCashDrawer } from '@/hooks/use-cash-drawer';
import { logger } from '@/lib/logger';
import { format } from 'date-fns';
import { convertFileSrc, invoke } from '@tauri-apps/api/core';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@repo/ui/components/ui/alert-dialog';
import { SettingsDialog } from '@/components/settings-dialog';
import { useNavigate } from 'react-router';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@repo/ui/components/ui/sheet';
import { Virtuoso } from 'react-virtuoso';

export function SupermarketPOS() {
  const [inputValue, setInputValue] = useState('');
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [showHeldOrders, setShowHeldOrders] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [lastCompletedOrder, setLastCompletedOrder] = useState<any>(null);
  const [lastAddedItemId, setLastAddedItemId] = useState<{
    productId: string;
    variantId: string;
    unitId: string;
  } | null>(null);
  const [unknownBarcode, setUnknownBarcode] = useState<string | null>(null);

  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const lastProcessedBarcode = useRef<string | null>(null);
  const lastScanTime = useRef<number>(0);

  const { checkOut } = useAuth();
  const { mutateAsync: createSale, isPending: isProcessingSale } = useProcessSale();
  const { openPhysicalDrawer } = useCashDrawer();
  const locationId = useAuthStore(state => state.currentLocation?.id);
  const { startScanner, stopScanner, isConnected, lastScanned, clearLastScanned } = useScanner();

  // Trigger pricing sync
  usePosPricingSync();

  const { products } = usePosProducts({
    search: inputValue,
    category: 'all',
    page: 1,
    pageSize: 10,
  });

  const currentOrder = usePosStore(state => state.currentOrder);
  const addItemToOrder = usePosStore(state => state.addItemToOrder);
  const removeItemFromOrder = usePosStore(state => state.removeItemFromOrder);
  const updateItemInOrder = usePosStore(state => state.updateItemInOrder);
  const resetOrder = usePosStore(state => state.resetOrder);
  const holdCurrentOrder = usePosStore(state => state.holdCurrentOrder);
  const heldOrders = usePosStore(state => state.heldOrders);
  const retrieveHeldOrder = usePosStore(state => state.retrieveHeldOrder);
  const deleteHeldOrder = usePosStore(state => state.deleteHeldOrder);
  const settings = usePosStore(state => state.settings);
  const taxRate = useMemo(() => settings.taxRate || 0, [settings.taxRate]);

  // Auto-focus search input on mount and after actions
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Handle barcode scans
  useEffect(() => {
    if (!lastScanned) {
      return;
    }

    const now = Date.now();
    // Debounce duplicate scans within 500ms
    if (lastScanned === lastProcessedBarcode.current && now - lastScanTime.current < 500) {
      clearLastScanned();
      return;
    }

    const processScan = async () => {
      const barcode = lastScanned;
      lastProcessedBarcode.current = barcode;
      lastScanTime.current = now;
      clearLastScanned(); // Clear immediately so the same barcode can be scanned again

      const product = await invoke<any>('get_product_by_barcode_command', {
        barcode,
      });

      if (!product) {
        logger.warn('Barcode not found', { barcode });
        setUnknownBarcode(barcode);
        return;
      }

      const variant = product.variants?.find((v: any) => v.barcode === barcode) || product.variants?.[0];
      const defaultUnit = product.sellableUnits?.find((u: any) => u.isBaseUnit) || product.sellableUnits?.[0];

      if (!variant || !defaultUnit) return;

      // Instant price resolution
      let customPrice: number | null = null;
      try {
        const prices = await invoke<Array<number | null>>('resolve_price_batch_command', {
          customerId: currentOrder.customerId,
          requests: [
            {
              variant_id: variant.variantId,
              unit_id: defaultUnit.unitId || null,
              is_base_unit: !!defaultUnit.isBaseUnit,
            },
          ],
        });
        if (prices && prices.length > 0) {
          customPrice = prices[0];
        }
      } catch (err) {
        console.error('Price resolution failed:', err);
      }

      const unitToAdd = {
        ...defaultUnit,
        price: customPrice !== null ? customPrice : defaultUnit.price,
        originalRetailPrice: defaultUnit.price,
      };

      addItemToOrder(
        {
          ...product,
          variantId: variant.variantId,
          variantName: variant.variantName,
          name: product.productName,
          variants: product.variants?.map((v: any) => ({
            ...v,
            name: v.variantName || v.name || 'Default Variant',
          })),
        },
        variant.variantId,
        unitToAdd,
        1
      );

      setLastAddedItemId({
        productId: product.productId,
        variantId: variant.variantId,
        unitId: unitToAdd.unitId,
      });

      toast.success('Added to Cart', {
        description: `${product.productName}`,
        duration: 1000,
        icon: <CheckCircle2 className="w-5 h-5" />,
      });
    };

    processScan();
  }, [lastScanned, addItemToOrder, currentOrder.customerId, clearLastScanned]);

  useEffect(() => {
    if (settings.enableBarcodeScanner) {
      startScanner();
    }
    return () => stopScanner();
  }, [settings.enableBarcodeScanner, startScanner, stopScanner]);

  const subTotal = (currentOrder?.items ?? []).reduce(
    (sum, item) => sum + (item.selectedUnit?.price || 0) * item.quantity,
    0
  );
  const taxAmount = subTotal * (taxRate / 100);
  const total = subTotal + taxAmount;

  const handlePaymentComplete = useCallback(
    (completedOrder: any) => {
      setLastCompletedOrder(completedOrder);
      setPaymentDialogOpen(false);
      setReceiptDialogOpen(true);
      resetOrder();
    },
    [resetOrder]
  );

  const handleQuickPayExactCash = useCallback(async () => {
    if (currentOrder.items.length === 0 || isProcessingSale) return;

    if (settings.enforceShiftForCashPayments && import.meta.env.MODE !== 'standalone') {
      const shift = await shiftService.getShiftStatus();
      if (!shift) {
        toast.error('No Active Shift', {
          description: 'You must open a shift before processing cash payments.',
        });
        return;
      }
    }

    const saleNumber = `SALE-${Date.now().toString().slice(-6)}`;
    const accountRef = Date.now().toString().slice(-6);

    const payload: any = {
      cartItems: currentOrder.items.map(item => ({
        productId: item.productId || '',
        productName: item.productName || 'Unknown Product',
        variantId: item.variantId || '',
        variantName: item.variantName || '',
        quantity: item.quantity,
        sellingUnitId: item.selectedUnit?.unitId || '',
        sellingUnitName: item.selectedUnit?.unitName || '',
        unitPrice: item.price,
      })),
      locationId,
      saleNumber,
      accountRef,
      isWholesale: false,
      customerId: null,
      enableStockTracking: true,
      notes: 'Exact Cash Quick Pay',
      discountAmount: 0,
      paymentMethod: PaymentMethod.CASH,
      paymentStatus: PaymentStatus.COMPLETED,
      amountReceived: total,
      change: 0,
      payments: [
        {
          method: PaymentMethod.CASH,
          amount: total,
        },
      ],
    };

    try {
      const queuedSale: any = await createSale(payload);

      const completedOrder: any = {
        id: queuedSale?.id || Date.now().toString(),
        orderNumber: queuedSale?.orderNumber || `ORD-${Date.now().toString().slice(-6)}`,
        items: currentOrder.items,
        customer: null,
        subtotal: subTotal,
        discount: 0,
        tax: taxAmount,
        total: total,
        orderType: 'takeaway',
        datetime: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        notes: 'Exact Cash Quick Pay',
        status: 'completed',
        paymentMethod: PaymentMethod.CASH,
        saleNumber,
        amountPaid: total,
        change: 0,
      };

      if (settings.autoPrintConfig.openCashDrawer) {
        openPhysicalDrawer();
      }

      toast.success('Sale Completed (Exact Cash)');
      handlePaymentComplete(completedOrder);
    } catch (err: any) {
      toast.error('Quick Pay Failed', {
        description: err.message || 'Unknown error occurred',
      });
    }
  }, [
    currentOrder,
    isProcessingSale,
    locationId,
    total,
    subTotal,
    taxAmount,
    createSale,
    settings,
    openPhysicalDrawer,
    handlePaymentComplete,
  ]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // F1 or / to focus search
      if (e.key === 'F1' || (e.key === '/' && document.activeElement !== searchInputRef.current)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      // F2 to pay
      if (e.key === 'F2') {
        e.preventDefault();
        if (currentOrder.items.length > 0) {
          setPaymentDialogOpen(true);
        }
      }

      // F3 to clear cart
      if (e.key === 'F3') {
        e.preventDefault();
        resetOrder();
      }

      // F4 to hold sale
      if (e.key === 'F4') {
        e.preventDefault();
        if (currentOrder.items.length > 0) {
          holdCurrentOrder('Quick Hold');
          toast.info('Sale Held');
        }
      }

      // F5 to Quick Pay Exact Cash
      if (e.key === 'F5') {
        e.preventDefault();
        handleQuickPayExactCash();
      }

      // F6 to show held orders
      if (e.key === 'F6') {
        e.preventDefault();
        setShowHeldOrders(true);
      }

      // Esc to clear search or close dialogs
      if (e.key === 'Escape') {
        setInputValue('');
      }

      // + and - for quantity of last added item
      if (lastAddedItemId) {
        const lastItem = currentOrder.items.find(
          i =>
            i.productId === lastAddedItemId.productId &&
            i.variantId === lastAddedItemId.variantId &&
            i.selectedUnit?.unitId === lastAddedItemId.unitId
        );

        if (lastItem) {
          if (e.key === '+' || e.key === '=') {
            e.preventDefault();
            updateItemInOrder({ ...lastItem, quantity: lastItem.quantity + 1 });
          }
          if (e.key === '-' || e.key === '_') {
            e.preventDefault();
            if (lastItem.quantity > 1) {
              updateItemInOrder({ ...lastItem, quantity: lastItem.quantity - 1 });
            }
          }
        }
      }

      // Delete to remove last added item
      if (e.key === 'Delete' && lastAddedItemId) {
        e.preventDefault();
        removeItemFromOrder(lastAddedItemId.productId, lastAddedItemId.variantId, lastAddedItemId.unitId);
        setLastAddedItemId(null);
      }
    },
    [
      currentOrder.items,
      lastAddedItemId,
      updateItemInOrder,
      removeItemFromOrder,
      resetOrder,
      holdCurrentOrder,
      handleQuickPayExactCash,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleCheckout = () => {
    checkOut();
    setShowCheckoutDialog(false);
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      {/* Header / Utility Bar */}
      <header className="h-16 border-b bg-white dark:bg-zinc-900 px-6 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-2 rounded-lg">
            <ShoppingCart className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Supermarket POS</h1>
        </div>

        <div className="flex items-center gap-3">
          {import.meta.env.MODE !== 'standalone' && (
            <Button variant="outline" size="sm" className="gap-2 font-bold" onClick={() => setShowHeldOrders(true)}>
              <Clock className="w-4 h-4" />
              Held Sales
              {heldOrders.length > 0 && (
                <span className="bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full text-[10px]">
                  {heldOrders.length}
                </span>
              )}
            </Button>
          )}

          <div
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border',
              isConnected
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            )}
          >
            {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {isConnected ? 'Scanner Active' : 'Scanner Offline'}
          </div>

          <Button variant="ghost" size="icon" onClick={() => setShowSettingsDialog(true)}>
            <SettingsIcon className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:bg-destructive/10"
            onClick={() => setShowCheckoutDialog(true)}
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Side: Cart & Checkout (Prominent) */}
        <div className="flex-[3] flex flex-col border-r bg-white dark:bg-zinc-900 shadow-xl z-10">
          <div className="p-4 border-b bg-zinc-50/50 dark:bg-zinc-800/50 flex justify-between items-center">
            <h2 className="font-bold text-lg">Transaction</h2>
            <span className="text-sm font-medium text-muted-foreground bg-white dark:bg-zinc-800 px-2 py-1 rounded border">
              {(currentOrder?.items ?? []).reduce((acc, i) => acc + i.quantity, 0)} Items
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
            {(currentOrder?.items ?? []).length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-40">
                <div className="p-8 border-2 border-dashed rounded-full mb-4">
                  <ShoppingCart className="w-16 h-16" />
                </div>
                <p className="text-lg font-medium text-center">Ready to scan products...</p>
              </div>
            ) : (
              (currentOrder?.items ?? []).map((item, idx) => {
                const isLastAdded =
                  lastAddedItemId?.productId === item.productId &&
                  lastAddedItemId?.variantId === item.variantId &&
                  lastAddedItemId?.unitId === item.selectedUnit?.unitId;

                return (
                  <div
                    key={idx}
                    className={cn(
                      'flex gap-3 p-3 rounded-xl border bg-white dark:bg-zinc-800 shadow-sm transition-all animate-in fade-in slide-in-from-left-2',
                      isLastAdded && 'ring-2 ring-primary border-primary bg-primary/5'
                    )}
                  >
                    <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-700 overflow-hidden border shrink-0">
                      {item.imageUrl ? (
                        <img src={convertFileSrc(item.imageUrl)} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-300">
                          <Package className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm truncate">{item.productName}</h4>
                          <p className="text-[10px] text-muted-foreground truncate">{item.variantName}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-base">{(item.selectedUnit?.price || 0).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-700 p-1 rounded-lg">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-md"
                            onClick={() => updateItemInOrder({ ...item, quantity: Math.max(1, item.quantity - 1) })}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-10 text-center font-bold">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-md"
                            onClick={() => updateItemInOrder({ ...item, quantity: item.quantity + 1 })}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive h-8 w-8"
                          onClick={() => removeItemFromOrder(item.productId, item.variantId, item.selectedUnit?.unitId)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-6 border-t bg-zinc-50 dark:bg-zinc-800/80 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-medium text-foreground">
                  {subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax ({taxRate}%)</span>
                <span className="font-medium text-foreground">
                  {taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="pt-2 border-t flex justify-between items-end bg-primary/5 -mx-6 px-6 py-4">
                <span className="font-black text-2xl uppercase tracking-tighter">Total</span>
                <div className="text-right">
                  <span className="text-sm font-bold text-primary mr-1">KSH</span>
                  <span className="text-6xl font-black text-primary tracking-tighter drop-shadow-sm">
                    {total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-16 text-sm font-bold border-2 leading-tight"
                  onClick={resetOrder}
                  disabled={(currentOrder?.items ?? []).length === 0}
                >
                  Clear Sale
                  <br />
                  <span className="text-[10px] opacity-70">(F3)</span>
                </Button>
                {import.meta.env.MODE !== 'standalone' && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-16 text-sm font-bold border-2 leading-tight"
                    onClick={() => {
                      holdCurrentOrder('Quick Hold');
                      toast.info('Sale Held');
                    }}
                    disabled={(currentOrder?.items ?? []).length === 0}
                  >
                    Hold Sale
                    <br />
                    <span className="text-[10px] opacity-70">(F4)</span>
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {import.meta.env.MODE !== 'standalone' && (
                  <Button
                    size="lg"
                    variant="secondary"
                    className="h-16 text-sm font-bold uppercase leading-tight shadow-md"
                    disabled={(currentOrder?.items ?? []).length === 0 || isProcessingSale}
                    onClick={handleQuickPayExactCash}
                  >
                    Exact Cash
                    <br />
                    <span className="text-[10px] opacity-70">(F5)</span>
                  </Button>
                )}
                <Button
                  size="lg"
                  className="h-16 text-xl font-black uppercase tracking-wider shadow-lg shadow-primary/20"
                  disabled={(currentOrder?.items ?? []).length === 0}
                  onClick={() => setPaymentDialogOpen(true)}
                >
                  Pay Now
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Quick Product Search / Info */}
        <div className="flex-[2] flex flex-col bg-zinc-50 dark:bg-zinc-950 p-6 space-y-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              ref={searchInputRef}
              placeholder="Search products manually or scan barcode..."
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              className="pl-12 h-14 text-lg rounded-2xl bg-white dark:bg-zinc-800 border-2 border-transparent focus:border-primary shadow-sm transition-all"
            />
            {inputValue && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setInputValue('')}
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              Manual Lookup
            </h3>

            <div className="flex-1 overflow-hidden">
              {products.length > 0 ? (
                <Virtuoso
                  style={{ height: '100%' }}
                  data={products}
                  className="no-scrollbar"
                  itemContent={(_, p: any) => (
                    <div className="pb-1.5">
                      <button
                        key={p.productId}
                        className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border bg-white dark:bg-zinc-900 hover:border-primary hover:ring-1 hover:ring-primary transition-all text-left group"
                        onClick={() => {
                          const variant = p.variants?.[0];
                          const unit = p.sellableUnits?.find((u: any) => u.isBaseUnit) || p.sellableUnits?.[0];
                          if (variant && unit) {
                            addItemToOrder(
                              {
                                ...p,
                                variantId: variant.variantId,
                                variantName: variant.variantName,
                                name: p.productName,
                                variants: p.variants?.map((v: any) => ({ ...v, name: v.variantName || v.name })),
                              },
                              variant.variantId,
                              { ...unit, originalRetailPrice: unit.price },
                              1
                            );

                            setLastAddedItemId({
                              productId: p.productId,
                              variantId: variant.variantId,
                              unitId: unit.unitId,
                            });

                            setInputValue('');
                            searchInputRef.current?.focus();
                          }
                        }}
                      >
                        <div className="w-9 h-9 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                          <Package className="w-4 h-4 text-zinc-400 group-hover:text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs truncate">{p.productName}</p>
                          <p className="text-[9px] text-muted-foreground uppercase tracking-tight">
                            {p.category || 'No Category'}
                          </p>
                        </div>
                        <p className="font-black text-sm text-primary">
                          {(p.sellableUnits?.[0]?.price || 0).toLocaleString()}
                        </p>
                      </button>
                    </div>
                  )}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-30 italic text-sm">
                  {inputValue ? 'No products found matching your search' : 'Start typing to search products'}
                </div>
              )}
            </div>
          </div>

          {/* Quick Help / Info */}
          <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
            <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">POS Status</h4>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Location:</span>
                <span className="font-semibold">Main Branch</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Session Started:</span>
                <span className="font-semibold">{new Date().toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Printer:</span>
                <span className="font-semibold text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Ready
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Dialogs */}
      <PaymentModal
        isOpen={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        cartItems={(currentOrder?.items ?? []).map(i => ({ ...i, price: i.selectedUnit?.price || 0 })) as any}
        subtotal={total}
        discount={0}
        customer={null}
        orderType="Takeaway"
        tableNumber=""
        onPaymentComplete={handlePaymentComplete}
      />

      <ReceiptDialog
        open={receiptDialogOpen}
        onOpenChange={setReceiptDialogOpen}
        completedOrder={lastCompletedOrder}
        onClose={() => setReceiptDialogOpen(false)}
      />

      <AlertDialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Check Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to check out? This will end your current session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCheckout} className="bg-destructive hover:bg-destructive/90">
              Check Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SettingsDialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog} />

      <AlertDialog open={!!unknownBarcode} onOpenChange={open => !open && setUnknownBarcode(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unknown Barcode</AlertDialogTitle>
            <AlertDialogDescription>
              Barcode <span className="font-mono font-bold">{unknownBarcode}</span> was not found in the system. Would
              you like to register a new product for it?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const barcode = unknownBarcode;
                setUnknownBarcode(null);
                navigate('/product-management');
                // Give it some time to navigate and mount
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('barcode-scanned-for-registration', { detail: { barcode } }));
                }, 500);
              }}
            >
              Register Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={showHeldOrders} onOpenChange={setShowHeldOrders}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Held Sales</SheetTitle>
            <SheetDescription>Retrieve or manage sales that were put on hold.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {(heldOrders ?? []).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No held sales found</p>
              </div>
            ) : (
              (heldOrders ?? []).map(order => (
                <div key={order.id} className="p-4 border rounded-xl space-y-3 bg-zinc-50 dark:bg-zinc-900">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-lg">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.heldAt).toLocaleTimeString()} • {order.items.length} items
                      </p>
                    </div>
                    <p className="font-black text-xl text-primary">{order.estimatedTotal.toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 font-bold"
                      onClick={() => {
                        retrieveHeldOrder(order.id);
                        setShowHeldOrders(false);
                        toast.success('Sale Retrieved');
                      }}
                    >
                      Retrieve
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => deleteHeldOrder(order.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
