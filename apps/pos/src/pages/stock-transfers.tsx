'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@repo/ui/components/ui/button';
import { Label } from '@repo/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select';
import { Textarea } from '@repo/ui/components/ui/textarea';
import { Badge } from '@repo/ui/components/ui/badge';
import { Separator } from '@repo/ui/components/ui/separator';
import { ScrollArea } from '@repo/ui/components/ui/scroll-area';
import { Input } from '@repo/ui/components/ui/input';
import {
  Package,
  Trash2,
  Send,
  Building2,
  Loader2,
  X,
  Search,
  PackageSearch,
  ArrowRightLeft,
  Store,
  Layers,
  Upload,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';
import { useAuthStore } from '@/store/pos-auth-store';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import posthog from 'posthog-js';

import { usePosLocations } from '@/hooks/locations';
import { FileReceiveDialog } from '@/components/file-receive';
import { PosProduct, usePosProducts } from '@/hooks/products';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface ProductVariant {
  variantId: string;
  variantName: string;
  sku: string;
  barcode?: string;
  stock: number;
  price?: number;
}

interface TransferItem {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  variantName?: string | null;
  sku: string;
  currentStock: number;
  quantity: number;
  unit: string;
  isDefaultVariant: boolean;
}

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  path?: string; // Tauri path (optional)
  localFile?: File; // Browser File object (optional)
  source: 'device' | 'system';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isDefaultVariant = (variantName?: string | null) =>
  !variantName || variantName === 'Default' || variantName === 'default';

const getProductDisplayName = (productName: string, variantName?: string | null) => {
  if (variantName && !isDefaultVariant(variantName)) return `${productName} — ${variantName}`;
  return productName;
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const getFileIcon = (type: string) => {
  if (type.includes('pdf')) return '📄';
  if (type.includes('image')) return '🖼️';
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) return '📊';
  if (type.includes('word') || type.includes('document')) return '📝';
  return '📎';
};

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step, current }: { step: number; current: number }) {
  const done = current > step;
  const active = current === step;
  return (
    <div
      className={`
      flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border-2 transition-all select-none
      ${
        done
          ? 'bg-emerald-600 border-emerald-600 text-white dark:bg-emerald-500 dark:border-emerald-500'
          : active
            ? 'bg-slate-900 border-slate-900 text-white dark:bg-slate-50 dark:border-slate-50 dark:text-slate-900'
            : 'bg-white border-slate-200 text-slate-400 dark:bg-background dark:border-slate-700 dark:text-slate-500'
      }
    `}
    >
      {done ? <CheckCircle2 className="h-4 w-4" /> : step}
    </div>
  );
}

// ─── Document Upload Zone ─────────────────────────────────────────────────────

function DocumentUploadZone({
  files,
  onFilesAdded,
  onRemove,
  onSystemFileReceived,
}: {
  files: AttachedFile[];
  onFilesAdded: (files: AttachedFile[]) => void;
  onRemove: (id: string) => void;
  onSystemFileReceived: (path: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const processFiles = useCallback(
    (fileList: FileList) => {
      const newFiles: AttachedFile[] = Array.from(fileList).map(f => ({
        id: Math.random().toString(36).slice(2),
        name: f.name,
        size: f.size,
        type: f.type,
        localFile: f,
        source: 'device' as const,
      }));
      onFilesAdded(newFiles);
    },
    [onFilesAdded]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        onDragOver={e => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed
          cursor-pointer transition-all duration-200 p-6 text-center select-none
          ${
            dragging
              ? 'border-slate-900 bg-slate-50 scale-[1.01] dark:border-slate-400 dark:bg-slate-800/80'
              : 'border-slate-200 bg-slate-50/50 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/30 dark:hover:border-slate-500 dark:hover:bg-slate-800/60'
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.webp"
          onChange={e => {
            if (e.target.files) processFiles(e.target.files);
          }}
        />
        <div className="w-10 h-10 rounded-full bg-white dark:bg-background border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm">
          <Upload className="h-4.5 w-4.5 text-slate-500 dark:text-slate-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {dragging ? 'Drop files here' : 'Upload from device'}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">PDF, Word, Excel, Images — max 25 MB each</p>
        </div>
        <Badge
          variant="secondary"
          className="text-[10px] font-mono uppercase tracking-wider dark:bg-slate-800 dark:text-slate-300"
        >
          Click or drag &amp; drop
        </Badge>
      </div>

      {/* System-level picker (Tauri) */}
      <div className="flex items-center gap-2 select-none">
        <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
        <span className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-medium">or</span>
        <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
      </div>
      <FileReceiveDialog onFileReceived={onSystemFileReceived} />

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2 mt-2">
          {files.map(f => (
            <div
              key={f.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white dark:bg-background border border-slate-100 dark:border-slate-800 shadow-sm group transition-colors"
            >
              <span className="text-lg leading-none">{getFileIcon(f.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{f.name}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                  {f.source === 'device' ? formatBytes(f.size) : 'System file'} •{' '}
                  <span className="capitalize">{f.source}</span>
                </p>
              </div>
              <button
                onClick={() => onRemove(f.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StockTransferCreate() {
  const { currentLocation } = useAuthStore();
  const { locations, isLoading: isLoadingLocations } = usePosLocations();

  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const { products: searchResults, isLoading: isLoadingProducts } = usePosProducts({
    search: searchTerm,
    category: 'all',
    enabled: searchTerm.length >= 2,
  });

  const [toBranch, setToBranch] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<TransferItem[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableDestinations = locations.filter(loc => loc.id !== currentLocation?.id);
  const selectedToBranch = locations.find(b => b.id === toBranch);
  const getTotalItems = () => items.reduce((sum, i) => sum + i.quantity, 0);
  const isFormReady = toBranch && items.length > 0 && !isSubmitting;

  // Determine wizard step progress
  const currentStep = !toBranch ? 1 : items.length === 0 ? 2 : 3;

  // ── Variant helpers ─────────────────────────────────────────────────────────

  const getProductVariants = (product: PosProduct): ProductVariant[] => {
    const rawVariants = product.variants || [];
    let variants: ProductVariant[] = rawVariants.map((v: any) => ({
      variantId: v.variantId || v.variant_id,
      variantName: v.variantName || v.variant_name || 'Default',
      barcode: v.barcode,
      sku: v.sku || '',
      stock: typeof v.stock === 'number' ? v.stock : 0,
      price: v.price,
    }));
    if (variants.length === 0) {
      variants.push({
        variantId: product.variantId || `${product.productId}-default`,
        variantName: product.variantName || 'Default',
        sku: product.sku || '',
        stock: product.stock ?? 0,
        barcode: product.barcode,
        price: (product as any).price,
      });
    }
    return variants;
  };

  const addItem = (product: PosProduct, specificVariantId?: string) => {
    const allVariants = getProductVariants(product);
    const safeProductName = product.productName || (product as any).product_name || product.name || 'Unknown Product';

    let selectedVariant = specificVariantId
      ? allVariants.find(v => v.variantId === specificVariantId) || null
      : allVariants.find(v => isDefaultVariant(v.variantName)) || allVariants[0];

    if (!selectedVariant) {
      toast.error('Could not determine product variant');
      return;
    }

    if (items.some(i => i.variantId === selectedVariant!.variantId)) {
      toast.info(`${getProductDisplayName(safeProductName, selectedVariant.variantName)} is already in the list`);
      return;
    }

    const baseUnit = product.sellableUnits?.find(u => u.isBaseUnit) || product.sellableUnits?.[0];
    const unitName = baseUnit?.unitName || 'unit';

    setItems(prev => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        variantId: selectedVariant!.variantId,
        productId: product.productId,
        productName: safeProductName,
        variantName: selectedVariant!.variantName,
        sku: selectedVariant!.sku || selectedVariant!.variantName || '',
        currentStock: selectedVariant!.stock,
        quantity: 1,
        unit: unitName,
        isDefaultVariant: isDefaultVariant(selectedVariant!.variantName),
      },
    ]);
    setSearchTerm('');
    setShowResults(false);
    toast.success('Item added to transfer list');
  };

  const updateQuantity = (id: string, quantity: number) =>
    setItems(prev => prev.map(i => (i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i)));

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  // ── File handling ────────────────────────────────────────────────────────────

  const handleDeviceFiles = (newFiles: AttachedFile[]) => {
    const unique = newFiles.filter(f => !attachedFiles.some(a => a.name === f.name && a.size === f.size));
    if (unique.length < newFiles.length) toast.info('Some files already attached');
    if (unique.length) {
      setAttachedFiles(prev => [...prev, ...unique]);
      toast.success(`${unique.length} file${unique.length > 1 ? 's' : ''} attached`);
    }
  };

  const handleSystemFileReceived = (filePath: string) => {
    const name = filePath.split(/[/\\]/).pop() || filePath;
    if (attachedFiles.some(f => f.path === filePath)) {
      toast.info('File already attached');
      return;
    }
    setAttachedFiles(prev => [
      ...prev,
      { id: Math.random().toString(36).slice(2), name, size: 0, type: '', path: filePath, source: 'system' },
    ]);
    toast.success('System file attached');
  };

  const removeFile = (id: string) => setAttachedFiles(prev => prev.filter(f => f.id !== id));

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!toBranch || items.length === 0) return;
    try {
      setIsSubmitting(true);
      const payload = {
        toLocationId: toBranch,
        items: items.map(({ variantId, quantity }) => ({ variantId, quantity })),
        notes: notes || undefined,
        documents: attachedFiles.map(f => f.path || f.name),
      };
      await invoke('submit_stock_transfer', { payload });
      posthog.capture("stock_transfer_initiated");
      toast.success('Stock transfer submitted successfully');
      setItems([]);
      setNotes('');
      setToBranch('');
      setAttachedFiles([]);
      setSearchTerm('');
      setShowResults(false);
    } catch (error: any) {
      toast.error('Transfer failed', { description: error.message || 'Unknown error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen dark:bg-slate-950 font-sans transition-colors duration-200">
      {/* ── Top Bar ──────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-background border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 transition-colors duration-200">
        <div className="max-w-full mx-auto px-6 h-16 flex items-center justify-between">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm select-none">
            <span className="text-slate-400 dark:text-slate-500">Inventory</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
            <span className="text-slate-400 dark:text-slate-500">Stock Transfers</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">New Transfer</span>
          </div>

          {/* Route indicator */}
          <div className="hidden md:flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 select-none">
            <div className="flex items-center gap-1.5">
              <Store className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {currentLocation?.name || 'Origin'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-slate-300 dark:text-slate-600">
              <div className="h-px w-4 bg-slate-300 dark:bg-slate-600" />
              <ArrowRightLeft className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              <div className="h-px w-4 bg-slate-300 dark:bg-slate-600" />
            </div>
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
              <span
                className={`text-sm font-medium ${selectedToBranch ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}
              >
                {selectedToBranch?.name || 'Destination'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-6 py-8">
        {/* ── Page Header ────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
                Create Stock Transfer
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Transfer inventory between your business locations. All transfers are logged and traceable.
              </p>
            </div>
            {items.length > 0 && (
              <Badge className="bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 text-xs px-3 py-1.5 rounded-full">
                {items.length} SKU{items.length !== 1 ? 's' : ''} · {getTotalItems()} units
              </Badge>
            )}
          </div>

          {/* Step progress */}
          <div className="mt-6 flex items-center gap-0 select-none">
            {[
              { n: 1, label: 'Set Destination' },
              { n: 2, label: 'Add Products' },
              { n: 3, label: 'Review & Submit' },
            ].map((s, i, arr) => (
              <div key={s.n} className="flex items-center">
                <div className="flex items-center gap-2.5">
                  <StepIndicator step={s.n} current={currentStep} />
                  <span
                    className={`text-xs font-medium hidden sm:block ${currentStep >= s.n ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <div
                    className={`h-px w-12 mx-3 ${currentStep > s.n ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Grid Layout ────────────────────────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* ── LEFT COLUMN ────────────────────────────────────────────────── */}
          <div className="space-y-5">
            {/* Step 1 — Destination */}
            <div className="bg-white dark:bg-background rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-800 select-none">
                <div className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-slate-50 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-3.5 w-3.5 text-white dark:text-slate-900" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Destination Location</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Select the branch that will receive this stock
                  </p>
                </div>
              </div>
              <div className="p-6">
                <div className="grid sm:grid-cols-2 gap-4 items-end">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider select-none">
                      From (Origin)
                    </Label>
                    <div className="flex items-center gap-2.5 h-10 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                        {currentLocation?.name || 'Current Location'}
                      </span>
                      <Badge
                        variant="secondary"
                        className="ml-auto text-[10px] dark:bg-slate-800 dark:text-slate-300 select-none"
                      >
                        Origin
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider select-none">
                      To (Destination) <span className="text-red-400 dark:text-red-500 ml-0.5">*</span>
                    </Label>
                    <Select value={toBranch} onValueChange={setToBranch} disabled={isSubmitting}>
                      <SelectTrigger className="h-10 text-sm border-slate-200 dark:border-slate-700 focus:ring-slate-900 dark:focus:ring-slate-50 dark:bg-background">
                        <SelectValue
                          placeholder={isLoadingLocations ? 'Loading locations…' : 'Select destination branch'}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDestinations.map(loc => (
                          <SelectItem key={loc.id} value={loc.id}>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-sky-500" />
                              {loc.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 — Products */}
            <div className="bg-white dark:bg-background rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-800 select-none">
                <div className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-slate-50 flex items-center justify-center flex-shrink-0">
                  <Package className="h-3.5 w-3.5 text-white dark:text-slate-900" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Transfer Items</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Search by name, SKU or barcode</p>
                </div>
                {items.length > 0 && (
                  <Badge
                    variant="outline"
                    className="text-xs border-slate-300 dark:border-slate-700 dark:text-slate-300"
                  >
                    {items.length} product{items.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>

              <div className="p-6 space-y-5">
                {/* Search rounded */}
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                    <Input
                      type="search"
                      placeholder="Search products…"
                      className="pl-9 pr-10 h-10 text-sm bg-white dark:bg-background border-slate-200 dark:border-slate-700 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-50 dark:placeholder:text-slate-500"
                      value={searchTerm}
                      onChange={e => {
                        setSearchTerm(e.target.value);
                        setShowResults(true);
                      }}
                      onFocus={() => setShowResults(true)}
                    />
                    {searchTerm && (
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setShowResults(false);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Dropdown */}
                  {showResults && searchTerm.length >= 2 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl bg-white dark:bg-background overflow-hidden">
                      {isLoadingProducts ? (
                        <div className="flex justify-center py-10">
                          <Loader2 className="h-5 w-5 animate-spin text-slate-400 dark:text-slate-500" />
                        </div>
                      ) : searchResults.length === 0 ? (
                        <div className="py-10 text-center select-none">
                          <PackageSearch className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            No products found for "{searchTerm}"
                          </p>
                        </div>
                      ) : (
                        <ScrollArea className="max-h-80">
                          <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                            {searchResults.map(product => {
                              const variants = getProductVariants(product);
                              const available = variants.filter(v => v.stock > 0);
                              const safeProductName =
                                product.productName || (product as any).product_name || product.name || 'Unknown';

                              if (available.length === 0) {
                                return (
                                  <div
                                    key={product.productId}
                                    className="flex items-center justify-between px-4 py-3 opacity-50 select-none"
                                  >
                                    <span className="text-sm dark:text-slate-300">{safeProductName}</span>
                                    <Badge variant="destructive" className="text-[10px]">
                                      Out of Stock
                                    </Badge>
                                  </div>
                                );
                              }

                              if (available.length > 1) {
                                return (
                                  <div key={product.productId}>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 select-none">
                                      <Layers className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                        {safeProductName}
                                      </span>
                                    </div>
                                    {available.map(variant => (
                                      <div
                                        key={variant.variantId}
                                        onClick={() => addItem(product, variant.variantId)}
                                        className="flex items-center justify-between px-4 py-3 pl-8 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                                      >
                                        <div>
                                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                            {variant.variantName}
                                          </p>
                                          <p className="text-xs text-slate-400 dark:text-slate-500">
                                            Stock: {variant.stock}
                                          </p>
                                        </div>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-7 text-xs dark:border-slate-700 dark:bg-background dark:hover:bg-slate-800"
                                        >
                                          Add
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                );
                              }

                              const v = available[0];
                              return (
                                <div
                                  key={product.productId}
                                  onClick={() => addItem(product, v.variantId)}
                                  className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                                >
                                  <div>
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                      {getProductDisplayName(safeProductName, v.variantName)}
                                    </p>
                                    <div className="flex gap-3 text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                      <span>
                                        Stock: <b className="text-slate-600 dark:text-slate-400">{v.stock}</b>
                                      </span>
                                      {v.sku && <span>SKU: {v.sku}</span>}
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    className="h-7 text-xs bg-slate-900 hover:bg-slate-700 dark:bg-slate-50 dark:hover:bg-slate-200 text-white dark:text-slate-900"
                                  >
                                    Add
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      )}
                    </div>
                  )}
                </div>

                <Separator className="bg-slate-100 dark:bg-slate-800" />

                {/* Item Table */}
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-14 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-800/20 select-none">
                    <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <PackageSearch className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No items added yet</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        Use the search above to add products
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Header row */}
                    <div className="grid grid-cols-[1fr_auto_auto] gap-4 items-center px-3 pb-2 select-none">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">
                        Product
                      </span>
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 text-center w-28">
                        Qty
                      </span>
                      <span className="w-8" />
                    </div>
                    <ScrollArea className="max-h-96">
                      <div className="space-y-2">
                        {items.map(item => (
                          <div
                            key={item.id}
                            className="grid grid-cols-[1fr_auto_auto] gap-4 items-center px-3 py-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                          >
                            <div>
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                                {getProductDisplayName(item.productName, item.variantName)}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5 select-none">
                                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                                  {item.sku}
                                </span>
                                <span className="text-[10px] text-slate-300 dark:text-slate-600">·</span>
                                <span
                                  className={`text-[10px] font-medium ${item.currentStock <= 5 ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`}
                                >
                                  {item.currentStock} available
                                </span>
                              </div>
                            </div>

                            {/* Quantity control */}
                            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-background overflow-hidden w-28">
                              <button
                                className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                −
                              </button>
                              <div className="flex-1 text-center text-sm font-semibold text-slate-800 dark:text-slate-200 select-none">
                                {item.quantity}
                              </div>
                              <button
                                className="w-8 h-8 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                disabled={item.quantity >= item.currentStock}
                              >
                                +
                              </button>
                            </div>

                            <button
                              onClick={() => removeItem(item.id)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ─────────────────────────────────────────────────── */}
          <div className="space-y-5">
            {/* Summary card */}
            <div className="bg-white dark:bg-background rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden sticky top-24 transition-colors">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800 select-none">
                <div className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-slate-50 flex items-center justify-center flex-shrink-0">
                  <ClipboardList className="h-3.5 w-3.5 text-white dark:text-slate-900" />
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Transfer Summary</p>
              </div>

              <div className="p-5 space-y-5">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 select-none">
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 p-3 text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{items.length}</div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                      SKUs
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 p-3 text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{getTotalItems()}</div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                      Total Units
                    </div>
                  </div>
                </div>

                {/* Route summary */}
                {(currentLocation || selectedToBranch) && (
                  <div className="rounded-lg border border-slate-100 dark:border-slate-800 p-3 space-y-2 select-none">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Transfer Route
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-lg bg-emerald-500 flex-shrink-0" />
                      <span className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate">
                        {currentLocation?.name || 'Origin'}
                      </span>
                    </div>
                    <div className="ml-[3px] h-3 w-px bg-slate-200 dark:bg-slate-700" />
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-1.5 w-1.5 rounded-lg flex-shrink-0 ${selectedToBranch ? 'bg-sky-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                      />
                      <span
                        className={`text-xs font-medium truncate ${selectedToBranch ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}
                      >
                        {selectedToBranch?.name || 'Not selected'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider select-none">
                    Notes
                  </Label>
                  <Textarea
                    placeholder="Internal notes or instructions…"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="resize-none text-sm h-20 bg-white dark:bg-background border-slate-200 dark:border-slate-700 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  />
                </div>

                <Separator className="bg-slate-100 dark:bg-slate-800" />

                {/* Documents */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between select-none">
                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Documents
                    </Label>
                    {attachedFiles.length > 0 && (
                      <Badge variant="secondary" className="text-[10px] dark:bg-slate-800 dark:text-slate-300">
                        {attachedFiles.length} attached
                      </Badge>
                    )}
                  </div>
                  <DocumentUploadZone
                    files={attachedFiles}
                    onFilesAdded={handleDeviceFiles}
                    onRemove={removeFile}
                    onSystemFileReceived={handleSystemFileReceived}
                  />
                </div>

                <Separator className="bg-slate-100 dark:bg-slate-800" />

                {/* Validation notice */}
                {!isFormReady && (
                  <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-2.5 border border-amber-100 dark:border-amber-900/50 select-none">
                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    <span>
                      {!toBranch ? 'Select a destination to continue.' : 'Add at least one product to submit.'}
                    </span>
                  </div>
                )}

                {/* Submit */}
                <Button
                  size="lg"
                  onClick={handleSubmit}
                  disabled={!isFormReady}
                  className="w-full h-11 bg-slate-900 dark:bg-slate-50 hover:bg-slate-700 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-semibold text-sm rounded-lg shadow-sm disabled:opacity-40 transition-all select-none"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Confirm Transfer
                    </>
                  )}
                </Button>

                <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 select-none">
                  This transfer will be logged and sent to the destination for review.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
