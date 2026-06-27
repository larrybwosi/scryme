'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { usePosStore } from '@/store/store';
import { usePosPricingSync, useBatchPricing } from '@/hooks/use-pricing-sync';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import {
  Search,
  Store,
  Truck,
  RefreshCw,
  X,
  WifiOff,
  Wifi,
  MonitorCheck,
  CheckCircle2,
  LayoutGrid,
  List,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import posthog from 'posthog-js';
import { BarcodeScannerDialog } from '../components/barcode-scanner-dialog';
import { usePosProducts } from '@/hooks/products';
import { useNavigate } from 'react-router';
import { Badge } from '@repo/ui/components/ui/badge';
import { Skeleton } from '@repo/ui/components/ui/skeleton';
import { ProductCard } from '@/components/pos/product-card';
import { ProductListItem } from '@/components/pos/product-list-item';
import { useDebounce } from 'use-debounce';
import { ScrollArea } from '@repo/ui/components/ui/scroll-area';
import PendingOrdersList from '@/components/orders-list';
import { useScanner } from '@/hooks/use-scanner';
import { toast } from 'sonner';
import { TableSelectorDialog } from '@/components/pos/table-selector-dialog';
import { Kbd } from '@/components/ui/kbd';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/components/ui/tooltip';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@repo/ui/components/ui/pagination';
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

// --- TAURI IMPORTS ---
import { invoke } from '@tauri-apps/api/core';

export function POS() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [inputValue, setInputValue] = useState('');
  const [knownCategories, setKnownCategories] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // 1. Debounce Search
  const [debouncedSearch] = useDebounce(inputValue, 500);

  const [pricingMode, setPricingMode] = useState<'retail' | 'wholesale'>('retail');
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [unknownBarcode, setUnknownBarcode] = useState<string | null>(null);

  const navigate = useNavigate();
  const [showTableSelector, setShowTableSelector] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const lastProcessedBarcode = useRef<string | null>(null);
  const lastScanTime = useRef<number>(0);

  // Initialize scanner hook
  const { startScanner, stopScanner, isConnected, lastScanned, clearLastScanned, error: scannerError } = useScanner();

  // Shortcuts are now managed centrally in AppLayout

  // 2. Fetching Logic
  const { products, isSyncing, triggerSync, totalCount } = usePosProducts({
    search: debouncedSearch,
    category: activeCategory,
    page: page,
    pageSize: pageSize,
  });

  // 3. Store Actions
  const { addItemToOrder, businessConfig, settings, currentOrder, setTableNumber } = usePosStore(state => ({
    addItemToOrder: state.addItemToOrder,
    businessConfig: state.getBusinessConfig(),
    settings: state.settings,
    currentOrder: state.currentOrder,
    setTableNumber: state.setTableNumber,
  }));

  // --- PRICING SYNC & BATCH RESOLUTION ---
  // A. Trigger Sync in Background
  usePosPricingSync();

  // B. Prepare Items for Batch Pricing
  const pricingItems = useMemo(() => {
    const items: { variantId: string; unitId: string | null; isBaseUnit: boolean }[] = [];
    products.forEach((p: any) => {
      if (!p.variants) return;
      p.variants.forEach((v: any) => {
        if (!v.sellableUnits) return;
        v.sellableUnits.forEach((u: any) => {
          items.push({
            variantId: v.variantId,
            unitId: u.unitId || null,
            isBaseUnit: !!u.isBaseUnit,
          });
        });
      });
    });
    return items;
  }, [products]);

  // C. Fetch Prices from Rust
  const { priceMap } = useBatchPricing(pricingItems, currentOrder.customerId);

  const handleGetPrice = useCallback(
    (variantId: string, unitId: string | null, _isBaseUnit: boolean = false) => {
      // Create lookup key matching useBatchPricing logic
      const key = `${variantId}:${unitId ?? 'null'}`;
      const price = priceMap[key];
      return typeof price === 'number' ? price : null;
    },
    [priceMap]
  );

  // 4. Extract Categories
  useEffect(() => {
    if (activeCategory === 'all' && products.length > 0) {
      const categories = new Set(knownCategories);
      products.forEach((p: any) => {
        if (p.category) categories.add(p.category);
      });
      setKnownCategories(new Set(Array.from(categories).sort()));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, activeCategory]);

  // 5. Reset page on filter change
  useEffect(() => {
    setPage(1);
    if (debouncedSearch) {
      // trackEvent("pos_search", { query: debouncedSearch.substring(0, 50) });
      posthog.capture("pos_search", { query: debouncedSearch.substring(0, 50) });
    }
  }, [debouncedSearch]);


  useEffect(() => {
    if (activeCategory !== 'all') {
      // trackEvent("pos_category_change", { category: activeCategory });
      posthog.capture('product_category_selected', { category: activeCategory });
    }
  }, [activeCategory]);

  useEffect(() => {
    // trackEvent("pos_pricing_mode_change", { mode: pricingMode });
    posthog.capture('pricing_mode_changed', { mode: pricingMode });
  }, [pricingMode]);

  const [showAlternatives, setShowAlternatives] = useState(false);
  const [selectedProductForAlternatives, setSelectedProductForAlternatives] = useState<any>(null);

  const alternativeProducts = useMemo(() => {
    if (!selectedProductForAlternatives?.activeIngredient) return [];
    return products.filter(
      p =>
        p.activeIngredient === selectedProductForAlternatives.activeIngredient &&
        p.productId !== selectedProductForAlternatives.productId
    );
  }, [selectedProductForAlternatives, products]);

  // 6. Global Keyboard Shortcuts
  const inputValueRef = useRef(inputValue);
  inputValueRef.current = inputValue;

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'Escape') {
        if (inputValueRef.current) {
          setInputValue('');
          setPage(1);
          searchInputRef.current?.focus();
        } else {
          searchInputRef.current?.blur();
        }
      } else if (e.key.length === 1) {
        if (/[a-zA-Z0-9]/.test(e.key)) {
          // If not focused, focus and let the event propagate
          if (document.activeElement !== searchInputRef.current) {
             searchInputRef.current?.focus();
          }
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleAddToCartWrapper = useCallback(
    (item: any) => {
      // Normalize product for the store
      const storeProduct = {
        ...item.product,
        productName: item.product.productName || item.product.name,
        variants: item.product.variants?.map((v: any) => ({
          ...v,
          name: v.variantName || v.name || 'Default Variant',
        })),
      };

      addItemToOrder(
        storeProduct,
        item.variant.variantId, // Pass variantId explicitly if we update the store signature
        { ...item.unit, originalRetailPrice: item.unit.price },
        item.quantity,
        {
          isWholesale: pricingMode === 'wholesale',
        }
      );
    },
    [addItemToOrder, pricingMode]
  );

  const clearSearch = () => {
    setInputValue('');
    setPage(1);
    searchInputRef.current?.focus();
  };

  const handleRefresh = async () => {
    await triggerSync();
  };

  useEffect(() => {
    if (settings.enableBarcodeScanner) {
      startScanner();
    }
    return () => {
      stopScanner();
    };
  }, [settings.enableBarcodeScanner, startScanner, stopScanner]);

  // Handle barcode scans
  useEffect(() => {
    if (!lastScanned) return;

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
      clearLastScanned();

      // Search across all products, not just the visible ones
      // Using the backend command for efficiency and correctness
      const product = await invoke<any>('get_product_by_barcode_command', {
        barcode,
      });

      if (!product) {
        setUnknownBarcode(barcode);
        return;
      }

      const variant = product.variants?.find((v: any) => v.barcode === barcode) || product.variants?.[0];

      if (!variant) {
        toast.error('Invalid Product', {
          description: `Product ${product.productName} has no valid variants`,
          duration: 2000,
        });
        return;
      }

      const defaultUnit = product.sellableUnits?.find((u: any) => u.isBaseUnit) || product.sellableUnits?.[0];

      if (!defaultUnit) {
        toast.error('Invalid Product', {
          description: `Product ${product.productName} has no sellable units`,
          duration: 2000,
        });
        return;
      }

      const storeProduct = {
        ...product,
        variantId: variant.variantId,
        variantName: variant.variantName,
        name: product.productName,
        variants: product.variants?.map((v: any) => ({
          ...v,
          name: v.variantName || v.name || 'Default Variant',
        })),
      };

      // Calculate dynamic price
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
        console.error('Failed to resolve price for scanned item:', err);
      }

      const unitToAdd = {
        ...defaultUnit,
        price: customPrice !== null ? customPrice : defaultUnit.price,
        originalRetailPrice: defaultUnit.price,
      };

      addItemToOrder(storeProduct, variant.variantId, unitToAdd, 1, { isWholesale: pricingMode === 'wholesale' });

      posthog.capture('product_added_to_cart', {
        product_id: product.productId,
        product_name: product.productName,
        variant_id: variant.variantId,
        variant_name: variant.variantName,
        price: unitToAdd.price,
        pricing_mode: pricingMode,
        via_barcode_scan: true,
      });

      toast.success('Added to Cart', {
        description: `${product.productName} (${variant.variantName || 'Default'})`,
        duration: 1500,
        icon: <CheckCircle2 className="w-5 h-5" />,
      });
    };

    processScan();
  }, [lastScanned, clearLastScanned, addItemToOrder, pricingMode, currentOrder.customerId]);

  useEffect(() => {
    if (scannerError) {
      toast.error('Scanner Error', {
        description: scannerError,
        duration: 2000,
      });
    }
  }, [scannerError]);

  const handleOpenCustomerScreen = async () => {
    if (!settings.customerDisplayConfig?.enabled) {
      toast.error('Customer Screen Disabled', {
        description: 'Please enable the customer display in settings first.',
        duration: 3000,
      });
      return;
    }

    try {
      await invoke('open_customer_screen');
    } catch (error) {
      console.error('Failed to open customer screen:', error);
      toast.error('Failed to open screen', {
        description: 'Check if the screen is already open or try again.',
        duration: 3000,
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-muted/5">
      {businessConfig.features.showOrdersList && <PendingOrdersList />}

      {/* --- Filter Bar (Header) --- */}
      <div className="flex flex-col gap-3 p-3 bg-background border-b z-10 shadow-sm shrink-0">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search */}
          <div className="relative w-full md:w-[320px] lg:w-[400px] group transition-all duration-300">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              ref={searchInputRef}
              placeholder={businessConfig.type === 'supermarket' ? 'Search products manually...' : 'Search products...'}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              className="pl-9 pr-12 h-9 bg-muted/40 focus:bg-background border-border/60 focus:ring-primary/20 transition-all rounded-full"
            />
            {!inputValue && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 group-focus-within:opacity-0 transition-opacity">
                <Kbd>/</Kbd>
              </div>
            )}
            {inputValue && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-muted"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Quick Actions (Mode & Sync) */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
            {/* Pharmacy Specific: Alternatives Button */}
            {(import.meta.env.VITE_BUSINESS_MODE || 'retail') === 'pharmacy' && (
              <div className="flex items-center gap-2">
                <Button
                  variant={showAlternatives ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'gap-2 h-9 rounded-full',
                    showAlternatives
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  )}
                  onClick={() => {
                    if (showAlternatives) {
                      setShowAlternatives(false);
                      setSelectedProductForAlternatives(null);
                    } else {
                      setShowAlternatives(true);
                    }
                  }}
                >
                  <Store className="w-4 h-4" />
                  <span className="text-[10px] uppercase font-bold tracking-wider">
                    {showAlternatives ? 'Viewing Alternatives' : 'Alternatives'}
                  </span>
                </Button>

                {showAlternatives && selectedProductForAlternatives && (
                  <Badge variant="secondary" className="h-9 px-3 gap-2 bg-emerald-100 text-emerald-800 border-emerald-200 animate-in fade-in slide-in-from-left-2">
                    <span className="text-[10px] uppercase font-bold opacity-70">For:</span>
                    <span className="font-bold truncate max-w-[150px]">{selectedProductForAlternatives.name}</span>
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-destructive"
                      onClick={() => {
                        setShowAlternatives(false);
                        setSelectedProductForAlternatives(null);
                      }}
                    />
                  </Badge>
                )}
              </div>
            )}
            {/* View Mode Toggle */}
            <div className="bg-muted/40 p-0.5 rounded-lg flex items-center border border-border/60">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-1.5 rounded-full transition-all duration-200',
                  viewMode === 'grid'
                    ? 'bg-background text-foreground shadow-sm ring-1 ring-border/20'
                    : 'text-muted-foreground hover:bg-background/40 hover:text-foreground'
                )}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-1.5 rounded-full transition-all duration-200',
                  viewMode === 'list'
                    ? 'bg-background text-foreground shadow-sm ring-1 ring-border/20'
                    : 'text-muted-foreground hover:bg-background/40 hover:text-foreground'
                )}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <div className="w-px h-6 bg-border/60 mx-1" />

            {/* Table Selector */}
            {businessConfig.features.tableManagement && import.meta.env.MODE !== 'standalone' && (
              <Button
                variant={currentOrder.tableNumber ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'gap-2 h-9 rounded-full',
                  currentOrder.tableNumber && 'bg-indigo-600 hover:bg-indigo-700 text-white'
                )}
                onClick={() => setShowTableSelector(true)}
              >
                <span className="text-[10px] uppercase font-bold tracking-wider">Table</span>
                <span className="font-bold">{currentOrder.tableNumber || 'None'}</span>
              </Button>
            )}

            {/* Pricing Toggle */}
            {(import.meta.env.VITE_BUSINESS_MODE || 'retail') === 'restaurant' && (
              <div className="bg-muted/40 p-0.5 rounded-lg flex items-center border border-border/60">
                <button
                  onClick={() => setPricingMode('retail')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200',
                    pricingMode === 'retail'
                      ? 'bg-background text-foreground shadow-sm ring-1 ring-border/20'
                      : 'text-muted-foreground hover:bg-background/40 hover:text-foreground'
                  )}
                >
                  <Store className="w-3.5 h-3.5" /> Retail
                </button>
                <button
                  onClick={() => setPricingMode('wholesale')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200',
                    pricingMode === 'wholesale'
                      ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100 dark:bg-blue-900/40 dark:text-blue-200 dark:ring-blue-800'
                      : 'text-muted-foreground hover:bg-background/40 hover:text-foreground'
                  )}
                >
                  <Truck className="w-3.5 h-3.5" /> Wholesale
                </button>
              </div>
            )}

            <div className="w-px h-6 bg-border/60 mx-1" />

            {/* Util Buttons */}
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-full border-dashed"
                    onClick={handleRefresh}
                    disabled={isSyncing}
                  >
                    <RefreshCw className={cn('w-3.5 h-3.5', isSyncing && 'animate-spin')} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Sync Products
                </TooltipContent>
              </Tooltip>

              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleOpenCustomerScreen}
                    className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
                  >
                    <MonitorCheck className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Customer Screen
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {settings.enableBarcodeScanner && (
              <Button
                variant={isConnected ? 'outline' : 'ghost'}
                size="icon"
                className={cn(
                  'h-9 w-9 rounded-full',
                  isConnected ? 'text-green-600 border-green-200 bg-green-50/50' : 'text-amber-500'
                )}
                onClick={() => setShowBarcodeScanner(true)}
                title={isConnected ? 'Scanner Connected' : 'Scanner Disconnected'}
              >
                {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              </Button>
            )}
          </div>
        </div>

        {/* Categories Scroller */}
        <div className="w-full">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex w-max space-x-2 p-1">
              <CategoryBadge
                label="All Items"
                isActive={activeCategory === 'all'}
                onClick={() => setActiveCategory('all')}
              />
              {Array.from(knownCategories).map(cat => (
                <CategoryBadge
                  key={cat}
                  label={cat}
                  isActive={activeCategory === cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    setPage(1);
                  }}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* --- Product Grid Content --- */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-muted/10 scroll-smooth no-scrollbar">
        {businessConfig.type === 'supermarket' ? (
          /* Scan-Only Mode for Supermarket */
          <div className="flex flex-col items-center justify-center h-full py-20 text-center">
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-12 rounded-3xl mb-6 border-2 border-dashed border-primary/30">
              <svg
                className="w-24 h-24 text-primary mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
              {isConnected ? (
                <div className="flex items-center gap-2 justify-center text-green-600">
                  <Wifi className="w-5 h-5" />
                  <span className="font-semibold">Scanner Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 justify-center text-amber-600">
                  <WifiOff className="w-5 h-5" />
                  <span className="font-semibold">Scanner Disconnected</span>
                </div>
              )}
            </div>

            <h3 className="text-2xl font-bold text-foreground mb-2">Scan Items to Add to Cart</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              This is a scan-only POS. Use your barcode scanner to add items to the cart.
              <br />
              You can also use the search bar above to manually look up products.
            </p>

            {settings.enableBarcodeScanner && !isConnected && (
              <Button variant="outline" onClick={() => setShowBarcodeScanner(true)} className="gap-2">
                <WifiOff className="w-4 h-4" />
                Configure Scanner
              </Button>
            )}
          </div>
        ) : (
          /* Standard Product Grid for Other Business Types */
          <>
            {isSyncing && products.length === 0 ? (
              <ProductGridSkeleton />
            ) : (
              <div className="pb-20">
                {/* Optimized Grid Layouts */}
                <div
                  className={cn(
                    viewMode === 'grid'
                      ? 'grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 4xl:grid-cols-7 gap-3 sm:gap-4 md:gap-5 content-start'
                      : 'flex flex-col gap-1.5 w-full'
                  )}
                >
                  {(showAlternatives && (import.meta.env.VITE_BUSINESS_MODE || 'retail') === 'pharmacy' && selectedProductForAlternatives
                    ? alternativeProducts
                    : products
                  ).map(product =>
                    viewMode === 'grid' ? (
                      <ProductCard
                        key={product.productId}
                        product={product as any}
                        onAddToCart={item => {
                          handleAddToCartWrapper(item);
                          setShowAlternatives(false);
                          setSelectedProductForAlternatives(null);
                        }}
                        onSelectProduct={p => {
                          setSelectedProductForAlternatives(p);
                        }}
                        pricingMode={pricingMode}
                        customPriceCalculator={handleGetPrice}
                      />
                    ) : (
                      <ProductListItem
                        key={product.productId}
                        product={product as any}
                        onAddToCart={item => {
                          handleAddToCartWrapper(item);
                          setShowAlternatives(false);
                          setSelectedProductForAlternatives(null);
                        }}
                        onSelectProduct={p => {
                          setSelectedProductForAlternatives(p);
                        }}
                        pricingMode={pricingMode}
                        customPriceCalculator={handleGetPrice}
                      />
                    )
                  )}
                </div>

                {!isSyncing && products.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-in fade-in-50">
                    <div className="bg-muted/50 p-6 rounded-full mb-4">
                      <Search className="w-12 h-12 opacity-30" />
                    </div>
                    <h4 className="font-semibold text-lg text-foreground">No products found</h4>
                    <p className="max-w-xs text-center mt-1 text-sm">
                      No matches for "{inputValue}" in {activeCategory === 'all' ? 'any category' : activeCategory}.
                    </p>
                    <Button
                      variant="link"
                      onClick={() => {
                        setInputValue('');
                        setActiveCategory('all');
                        setPage(1);
                      }}
                      className="mt-2 text-primary"
                    >
                      Clear filters
                    </Button>
                  </div>
                )}

                {totalCount > pageSize && (
                  <div className="mt-8 mb-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>

                        {Array.from({ length: Math.ceil(totalCount / pageSize) }).map((_, i) => {
                          const pageNum = i + 1;
                          // Basic pagination logic: show current, first, last, and neighbors
                          if (
                            pageNum === 1 ||
                            pageNum === Math.ceil(totalCount / pageSize) ||
                            (pageNum >= page - 1 && pageNum <= page + 1)
                          ) {
                            return (
                              <PaginationItem key={pageNum}>
                                <PaginationLink
                                  isActive={page === pageNum}
                                  onClick={() => setPage(pageNum)}
                                  className="cursor-pointer"
                                >
                                  {pageNum}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          } else if (pageNum === page - 2 || pageNum === page + 2) {
                            return (
                              <PaginationItem key={pageNum}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          return null;
                        })}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setPage(p => Math.min(Math.ceil(totalCount / pageSize), p + 1))}
                            className={
                              page >= Math.ceil(totalCount / pageSize)
                                ? 'pointer-events-none opacity-50'
                                : 'cursor-pointer'
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                    <div className="text-center text-xs text-muted-foreground mt-2">
                      Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalCount)} of {totalCount}{' '}
                      products
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <TableSelectorDialog
        open={showTableSelector}
        onOpenChange={setShowTableSelector}
        onSelectTable={(num, guests) => setTableNumber(num, guests)}
      />

      <BarcodeScannerDialog open={showBarcodeScanner} onOpenChange={setShowBarcodeScanner} />

      <AlertDialog open={!!unknownBarcode} onOpenChange={(open) => !open && setUnknownBarcode(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unknown Barcode</AlertDialogTitle>
            <AlertDialogDescription>
              Barcode <span className="font-mono font-bold">{unknownBarcode}</span> was not found in the system. Would you like to register a new product for it?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              const barcode = unknownBarcode;
              setUnknownBarcode(null);
              navigate('/product-management');
              // Give it some time to navigate and mount
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('barcode-scanned-for-registration', { detail: { barcode } }));
              }, 500);
            }}>
              Register Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CategoryBadge({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 py-2 text-sm font-medium rounded-sm transition-all border',
        isActive
          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
          : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:bg-muted/50'
      )}
    >
      {label}
    </button>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-4">
      {[...Array(12)].map((_, i) => (
        <div key={i} className="flex flex-col space-y-3 p-3 border rounded-xl bg-background shadow-sm">
          <Skeleton className="h-40 w-full rounded-lg bg-muted/60" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <div className="flex gap-2 pt-2 mt-auto">
            <Skeleton className="h-9 w-full rounded-md" />
            <Skeleton className="h-9 w-12 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
