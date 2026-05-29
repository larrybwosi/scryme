import { invoke } from '@tauri-apps/api/core';
import { CheckCircle2, ExternalLink, Loader2, Plus, Printer, ArrowRight, Copy, Check, Download } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { processFileDownload } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { usePrinter } from '@/hooks/use-printer';
import { usePosStore } from '@/store/store';
import { useAuthStore } from '@/store/pos-auth-store';

function OrderSuccessView({
  orderId,
  invoiceUrl,
  onReset,
}: {
  orderId: string;
  invoiceUrl: string;
  onReset: () => void;
}) {
  const navigate = useNavigate();
  const { printDocument } = usePrinter();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleDownloadInvoice = async () => {
    if (!invoiceUrl || isDownloading) return;

    const loadingToastId = toast.loading('Preparing your document...', {
      description: `Order: ${orderId}`,
    });

    setIsDownloading(true);
    try {
      const pdfBytes = await invoke<number[]>('get_invoice_blob_command', { url: invoiceUrl });
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const safeOrderNum = orderId.replace(/[^a-z0-9]/gi, '_');
      const fileName = `Invoice_${safeOrderNum}.pdf`;

      await processFileDownload(blob, fileName, loadingToastId);
    } catch {
      toast.error('Download failed', {
        description: 'Please try again or contact support.',
        id: loadingToastId,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrintInvoice = async () => {
    if (!invoiceUrl || isPrinting) return;

    setIsPrinting(true);
    const loadingToastId = toast.loading('Sending to printer...', {
      description: `Order: ${orderId}`,
    });

    try {
      const settings = usePosStore.getState().settings;
      const branchName = useAuthStore.getState().currentLocation?.name;

      await printDocument('invoice', { invoiceUrl, number: orderId }, settings, branchName);
      toast.success('Invoice sent to printer', { id: loadingToastId });
    } catch (error) {
      console.error('Print failed:', error);
      toast.error('Print failed', {
        description: error instanceof Error ? error.message : 'Please check your printer configuration.',
        id: loadingToastId,
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleCopyInvoiceUrl = async () => {
    if (!invoiceUrl || isCopied) return;
    try {
      await navigator.clipboard.writeText(invoiceUrl);
      setIsCopied(true);
      toast.success('Invoice URL copied to clipboard');
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error('Failed to copy URL');
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-500">
      <Card className="w-full max-w-lg border-zinc-200/60 dark:border-zinc-800/60 shadow-xl shadow-zinc-200/20 dark:shadow-none bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm">
        <CardContent className="pt-12 pb-10 flex flex-col items-center text-center">
          {/* Success Icon with Pulse Effect */}
          <div className="relative mb-8">
            <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping duration-[2000ms]" />
            <div className="relative h-24 w-24 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/20 rounded-full flex items-center justify-center border-4 border-white dark:border-zinc-950 shadow-sm">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="space-y-2 mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              Order Confirmed!
            </h2>
            <div className="inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-800 px-3 py-1 text-xs font-medium text-zinc-500 bg-zinc-50 dark:bg-zinc-900">
              Reference: <span className="ml-1.5 font-mono text-zinc-900 dark:text-zinc-300">{orderId}</span>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto pt-2">
              Your order has been processed. You can now manage your receipt or track the transaction status.
            </p>
          </div>

          {/* Action Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full mb-8">
            <Button
              variant="outline"
              className="h-12 gap-2 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
              onClick={handlePrintInvoice}
              disabled={!invoiceUrl || isPrinting}
            >
              {isPrinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
              Print Invoice
            </Button>

            <Button
              variant="outline"
              className="h-12 gap-2 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
              onClick={handleDownloadInvoice}
              disabled={!invoiceUrl || isDownloading}
            >
              {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Save Invoice
            </Button>

            <Button
              variant="outline"
              className="h-12 gap-2 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
              onClick={handleCopyInvoiceUrl}
              disabled={!invoiceUrl || isCopied}
            >
              {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              {isCopied ? 'Copied!' : 'Copy URL'}
            </Button>

            <Button
              variant="outline"
              className="h-12 gap-2 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
              onClick={() => navigate(`/pending-transactions?id=${orderId}`)}
            >
              <ExternalLink className="h-4 w-4" />
              Details
            </Button>
          </div>

          <hr className="w-full border-zinc-100 dark:border-zinc-800 mb-8" />

          <Button
            size="lg"
            className="w-full sm:w-auto px-10 h-12 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-white font-semibold transition-all group"
            onClick={onReset}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Another Order
            <ArrowRight className="ml-2 h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default OrderSuccessView;