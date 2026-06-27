'use client';

import { useMemo, useState, useEffect } from 'react';
import { Printer, Download, Check, Loader2, ArrowRight, CreditCard, Wallet, Tag } from 'lucide-react';
import QRCode from 'qrcode';

// UI Components
import { Dialog, DialogContent } from '@repo/ui/components/ui/dialog';
import { Button } from '@repo/ui/components/ui/button';
import { Separator } from '@repo/ui/components/ui/separator';
import { Badge } from '@repo/ui/components/ui/badge';

import { ReceiptPdfDocument } from '@/components/receipt-pdf';
import { usePosStore, type Order, type ReceiptConfig } from '@/store/store';
import { useAuthStore } from '@/store/pos-auth-store';
import { usePdfActions } from '@/hooks/use-pdf-actions';
import { usePrinter } from '@/hooks/use-printer';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// --- Types ---
interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  completedOrder: any;
  onClose: () => void;
}

// --- Utility: Mapper ---
const formatOrderForReceipt = (order: any): Order | null => {
  if (!order) return null;

  const subTotal = parseFloat(order.subtotal || order.subTotal || '0');
  const discount = parseFloat(order.discount || '0');
  const taxes = parseFloat(order.tax || order.taxes || '0');
  const total = parseFloat(order.total || '0');

  return {
    id: order.id || 'temp-id',
    orderNumber: order.orderNumber || `#${Math.floor(Math.random() * 10000)}`,
    customerName: order.customer?.name || order.customerName || 'Guest',
    orderType: order.orderType || 'Walk-in',
    cashierName: order.cashierName || 'Staff',
    userName: order.cashierName || 'Staff', // For backend
    paymentMethod: order.paymentMethod || 'Cash',
    status: 'completed',
    tableNumber: order.tableNumber,
    tableName: order.tableNumber, // For backend
    items: (order.items || []).map((item: any) => {
      const price = parseFloat(item.price || item.selectedUnit?.price || '0');
      const quantity = item.quantity || 1;
      const name = item.productName || item.name || 'Unknown Product';
      return {
        productId: item.productId || item.id,
        productName: name,
        name: name, // For backend
        variantName: item.variantName || item.variant || '',
        sku: item.sku || '',
        quantity: quantity,
        selectedUnit: {
          unitName: item.unitName || item.unit || item.selectedUnit?.unitName || 'Unit',
          price: price,
        },
        price: price, // For backend
        total: price * quantity, // For backend
        note: item.note || item.notes || '',
      };
    }),
    subTotal,
    discount,
    discountAmount: discount, // For backend
    taxes,
    taxAmount: taxes, // For backend
    total,
    createdAt: order.datetime ? new Date(order.datetime) : new Date(),
    payments: order.payments || [
      { method: order.paymentMethod || 'Cash', amount: total }
    ], // For backend
  } as any;
};

// --- Sub-component: Summary Card ---
const SummaryMetric = ({
  label,
  value,
  currency,
  highlight = false,
}: {
  label: string;
  value: number;
  currency: string;
  highlight?: boolean;
}) => (
  <div
    className={cn(
      'flex flex-col gap-1 p-3 rounded-lg border',
      highlight
        ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900'
        : 'bg-card border-border'
    )}
  >
    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
    <span
      className={cn(
        'text-lg font-bold tabular-nums',
        highlight ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
      )}
    >
      <span className="text-xs opacity-70 mr-0.5">{currency}</span>
      {value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  </div>
);

// --- Sub-component: Action Panel ---
interface ActionPanelProps {
  completedOrder: any;
  formattedOrder: Order;
  onPrint: () => void;
  onPrintLabels: () => void;
  onDownload: () => void;
  onClose: () => void;
  isPrinting: boolean;
  isDownloading: boolean;
  currency: string;
}

const ActionPanel = ({
  completedOrder,
  formattedOrder,
  onPrint,
  onPrintLabels,
  onDownload,
  onClose,
  isPrinting,
  isDownloading,
  currency,
}: ActionPanelProps) => {
  const [isPrintingLabels, setIsPrintingLabels] = useState(false);
  const changeDue = completedOrder.change ? parseFloat(completedOrder.change) : 0;
  const amountPaid = parseFloat(completedOrder.amountPaid || formattedOrder.total);

  return (
    <div className="flex flex-col h-full justify-between p-6 md:p-8 animate-in slide-in-from-left-4 duration-500">
      <div className="space-y-8">
        {/* Header & Success State */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center shadow-sm ring-4 ring-emerald-50 dark:ring-emerald-950/50">
              <Check className="h-6 w-6 stroke-[3px]" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">Payment Successful</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="font-mono text-xs px-1.5 py-0 h-5">
                  {formattedOrder.orderNumber}
                </Badge>
                <span>•</span>
                <span className="text-xs">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="space-y-4">
          {/* Hero Change Display */}
          <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card to-secondary/30 p-6 shadow-sm">
            <div className="relative z-10">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Change Due</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-medium text-muted-foreground self-start mt-2">{currency}</span>
                <span className="text-5xl font-extrabold tracking-tight text-foreground tabular-nums">
                  {changeDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            {/* Background decoration */}
            <div className="absolute -right-6 -bottom-6 opacity-5 dark:opacity-10">
              <Wallet className="h-32 w-32" />
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <SummaryMetric label="Total Bill" value={formattedOrder.total} currency={currency} />
            <SummaryMetric label="Amount Paid" value={amountPaid} currency={currency} />
            {completedOrder.payments?.some((p: any) => p.method === 'INSURANCE') && (
              <SummaryMetric
                label="Insurance Co-pay"
                value={completedOrder.payments.filter((p: any) => p.method === 'INSURANCE').reduce((s: number, p: any) => s + p.amount, 0)}
                currency={currency}
                highlight
              />
            )}
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
            <span className="flex items-center gap-1.5">
              <CreditCard className="h-4 w-4" />
              Method: <span className="font-medium text-foreground">{formattedOrder.paymentMethod}</span>
            </span>
            <span>{formattedOrder.items.length} items</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 mt-auto pt-6">
        <div className="grid grid-cols-1 gap-3">
          <div className="flex gap-2">
            <Button
              onClick={onPrint}
              disabled={isPrinting}
              className="flex-1 h-12 shadow-sm transition-all active:scale-[0.98]"
              variant="default"
            >
              {isPrinting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
              {isPrinting ? 'Printing...' : 'Print Receipt'}
            </Button>

            {import.meta.env.VITE_BUSINESS_MODE === 'pharmacy' && (
              <Button
                onClick={async () => {
                  setIsPrintingLabels(true);
                  try {
                    await onPrintLabels?.();
                  } finally {
                    setIsPrintingLabels(false);
                  }
                }}
                disabled={isPrintingLabels}
                className="flex-1 h-12 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all active:scale-[0.98]"
                variant="outline"
              >
                {isPrintingLabels ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Tag className="mr-2 h-4 w-4" />}
                Print Labels
              </Button>
            )}
          </div>

          <Button
            variant="outline"
            onClick={onDownload}
            disabled={isDownloading}
            className="h-12 border-input bg-background hover:bg-accent/50 transition-all active:scale-[0.98]"
          >
            {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Download
          </Button>
        </div>

        <Separator className="my-2" />

        <Button
          onClick={onClose}
          size="lg"
          className="w-full h-12 text-base font-medium bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-all group"
        >
          Start New Order
          <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </div>
  );
};

// --- Main Component ---
export function ReceiptDialog({ open, onOpenChange, completedOrder, onClose }: ReceiptDialogProps) {
  const settings = usePosStore(state => state.settings);
  const currentMember = useAuthStore(state => state.currentMember);
  const receiptConfig = settings.receiptConfig as ReceiptConfig;
  const { handleDownload, handlePrint, isPrinting, isDownloading } = usePdfActions();
  const { printNative } = usePrinter();
  const [qrCodePdfUrl, setQrCodePdfUrl] = useState<string>('');
  const [barcodeUrl, setBarcodeUrl] = useState<string>('');

  // Map Data
  const formattedOrder = useMemo(() => {
    const order = formatOrderForReceipt(completedOrder);
    if (order && currentMember?.name) {
      // If the order doesn't have a specific cashier saved (or is generic), override with current logged-in user
      if (order.cashierName === 'Staff' || !order.cashierName) {
        order.cashierName = currentMember.name;
      }
    }
    return order;
  }, [completedOrder, currentMember]);

  // Generate QR for PDF
  useEffect(() => {
    if (formattedOrder && receiptConfig?.showQrCode) {
      const qrData =
        receiptConfig.qrCodeTarget === 'website' && receiptConfig.qrCodeCustomUrl
          ? receiptConfig.qrCodeCustomUrl
          : JSON.stringify({ id: formattedOrder.orderNumber, tot: formattedOrder.total });

      QRCode.toDataURL(qrData, { width: 150, margin: 1 })
        .then(url => setQrCodePdfUrl(url))
        .catch(err => console.error('QR Generation failed', err));
    }
  }, [formattedOrder, receiptConfig]);

  // Generate Barcode for PDF
  useEffect(() => {
    const generateBarcode = async () => {
      if (formattedOrder && receiptConfig?.showBarcode) {
        try {
          const bwipjs = await import('@bwip-js/browser');
          const canvas = document.createElement('canvas');
          bwipjs.toCanvas(canvas, {
            bcid: 'code128',
            text: formattedOrder.orderNumber,
            scale: 3,
            height: 10,
            includetext: false,
          });
          setBarcodeUrl(canvas.toDataURL('image/png'));
        } catch (e) {
          console.error('Barcode generation failed', e);
        }
      }
    };
    generateBarcode();
  }, [formattedOrder, receiptConfig]);

  // Document Instance
  const DocumentInstance = useMemo(() => {
    return (
      <ReceiptPdfDocument
        order={formattedOrder!}
        settings={settings}
        qrCodeUrl={qrCodePdfUrl}
        barcodeUrl={barcodeUrl}
        branchName={useAuthStore.getState().currentLocation?.name}
      />
    );
  }, [formattedOrder, settings, qrCodePdfUrl, barcodeUrl]);

  // Auto-print logic
  useEffect(() => {
    if (open && formattedOrder && settings.autoPrintConfig?.enabled && DocumentInstance && !isPrinting) {
      const safeOrderNum = formattedOrder.orderNumber.replace(/[^a-z0-9]/gi, '_');
      handlePrint(DocumentInstance, `Receipt_${safeOrderNum}`, {
        ...formattedOrder,
        subTotal: (formattedOrder as any).subTotal,
        taxAmount: (formattedOrder as any).taxAmount,
        discountAmount: (formattedOrder as any).discountAmount,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, formattedOrder, settings.autoPrintConfig?.enabled, !!DocumentInstance]);

  if (!formattedOrder) return null;
  const safeOrderNum = formattedOrder.orderNumber.replace(/[^a-z0-9]/gi, '_');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-border bg-background shadow-2xl duration-300">
        <div className="h-auto min-h-[500px] flex flex-col">
          <ActionPanel
            completedOrder={completedOrder}
            formattedOrder={formattedOrder}
            onPrint={() => DocumentInstance && handlePrint(DocumentInstance, `Receipt_${safeOrderNum}`, {
              ...formattedOrder,
              // Ensure backend-specific fields are present even if TypeScript complained
              subTotal: (formattedOrder as any).subTotal,
              taxAmount: (formattedOrder as any).taxAmount,
              discountAmount: (formattedOrder as any).discountAmount,
            })}
            onPrintLabels={async () => {
              if (!completedOrder) return;
              try {
                const result = await printNative('label', completedOrder as any, settings);
                if (result.success) {
                  toast.success('Labels Sent to Printer');
                } else {
                  throw new Error(result.error);
                }
              } catch (error) {
                toast.error('Failed to print labels');
              }
            }}
            onDownload={() => DocumentInstance && handleDownload(DocumentInstance, `Receipt_${safeOrderNum}`)}
            onClose={onClose}
            isPrinting={isPrinting}
            isDownloading={isDownloading}
            currency={settings.currency}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
