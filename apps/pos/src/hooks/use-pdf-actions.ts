import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { toast } from 'sonner';
import { isTauri } from '@tauri-apps/api/core';
import { usePrinter } from '@/hooks/use-printer';
import { processFileDownload } from '@/lib/utils';
import { usePosStore } from '@/store/store';
import { useAuthStore } from '@/store/pos-auth-store';
import { PrinterJobType } from '@/store/printer-store';

export function usePdfActions() {
  const { printNative } = usePrinter();
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePrint = async (
    docInstance: React.ReactElement<any>,
    _fileNamePrefix: string,
    orderData?: any,
    jobType: PrinterJobType = 'receipt'
  ) => {
    if (!docInstance) return;

    if (isPrinting) return;
    setIsPrinting(true);
    const toastId = toast.loading('Preparing print job...');

    try {
      // Use native thermal printing if on Tauri
      if (isTauri()) {
        const settings = usePosStore.getState().settings;
        const branchName = useAuthStore.getState().currentLocation?.name;
        const paperSize =
          jobType === 'kitchen' ? settings.kitchenTicketConfig?.paperSize : settings.receiptConfig?.paperSize;

        const isThermal = paperSize === '58mm' || paperSize === '80mm';

        // Path A: Native ESC/POS (Optimized for thermal printers)
        if (isThermal && orderData) {
          const result = await printNative(jobType, orderData, settings, branchName);

          if (result.success) {
            toast.success('Sent to printer!', { id: toastId });
            setIsPrinting(false);
            return;
          }
          console.warn('Native ESC/POS print failed, trying silent PDF fallback');
        }

        // Path B: Silent PDF Printing (Backend-driven)
        const blob = await pdf(docInstance).toBlob();
        const arrayBuffer = await blob.arrayBuffer();
        const pdfBytes = Array.from(new Uint8Array(arrayBuffer));

        const orderWithPdf = {
          ...orderData,
          pdfBytes,
        };

        const result = await printNative(jobType, orderWithPdf, settings, branchName);

        if (result.success) {
          toast.success('Sent to printer!', { id: toastId });
        } else {
          throw new Error(result.error || 'Native silent print failed');
        }
        return;
      }

      // Web Fallback: Use a hidden iframe to print without popups
      const blob = await pdf(docInstance).toBlob();
      const url = URL.createObjectURL(blob);
      const iframe = document.createElement('iframe');

      // Use styles that keep it in the DOM but invisible
      Object.assign(iframe.style, {
        position: 'absolute',
        width: '0',
        height: '0',
        border: '0',
        margin: '0',
        padding: '0',
        overflow: 'hidden',
        visibility: 'hidden',
      });

      iframe.src = url;
      document.body.appendChild(iframe);

      iframe.onload = () => {
        try {
          if (iframe.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
            toast.success('Print dialog opened', { id: toastId });
          } else {
            throw new Error('Iframe content window not available');
          }
        } catch (err) {
          console.error('Iframe print error:', err);
          toast.error('Could not open print dialog', { id: toastId });
        } finally {
          // Clean up after a delay
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
            URL.revokeObjectURL(url);
          }, 5000);
        }
      };
    } catch (error) {
      console.error('Print failed:', error);
      toast.error(`Print failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: toastId });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownload = async (docInstance: React.ReactElement<any>, fileNamePrefix: string) => {
    if (!docInstance) return toast.error('No document instance provided');
    if (isDownloading) return toast.error('Already downloading');

    setIsDownloading(true);
    const loadingToastId = toast.loading('Generating PDF...');

    try {
      const blob = await pdf(docInstance).toBlob();
      const fileName = `${fileNamePrefix}_${Date.now()}.pdf`;
      await processFileDownload(blob, fileName, loadingToastId);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to save PDF', { id: loadingToastId });
    } finally {
      setIsDownloading(false);
    }
  };

  return {
    isPrinting,
    isDownloading,
    handlePrint,
    handleDownload,
  };
}
