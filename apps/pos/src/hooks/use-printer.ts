import { PrinterDevice, PrinterJobType, usePrinterStore } from '@/store/printer-store';
import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

import { Order, BusinessSettings } from '@/store/store';
import { PrintResult } from '@/types/print-types';
import { v4 as uuidv4 } from 'uuid';
import posthog from 'posthog-js';

export const usePrinter = () => {
  const store = usePrinterStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshPrinters = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch system printers
      const systemPrinters = (await invoke<any[]>('get_system_printers')) || [];

      // 2. Fetch network printers
      let networkPrinters: any[] = [];
      try {
        networkPrinters = (await invoke<any[]>('discover_network_printers')) || [];
      } catch (e) {
        console.warn('Network discovery failed', e);
      }

      const allPrinters = [...(systemPrinters || []), ...(networkPrinters || [])];

      const formatted: PrinterDevice[] = allPrinters.map(p => ({
        id: p.id,
        name: p.name,
        description: p.port_name ? `Port: ${p.port_name}` : '',
        driver_name: p.driver_name || 'Generic Driver',
        status: p.status || 'Ready',
        method: p.type,
        port_name: p.port_name,
      }));

      store.setPrinters(formatted);

      // 3. Also load the saved assignments
      await store.loadConfig();
    } catch (err: any) {
      console.error('Printer Error:', err);
      setError('Failed to load printers.');
    } finally {
      setLoading(false);
    }
  };

  const printDocument = async (
    type: PrinterJobType,
    order: any,
    settings: any,
    branchName?: string
  ) => {
    // Note: We don't need to look up printerId manually here anymore,
    // because the backend 'print_job' does that lookup based on the 'type' (job_type).

    // However, we should check if the store has a config for it to fail fast UI side
    const printerId = store.assignments[type];
    if (!printerId) {
      throw new Error(`No printer assigned for ${type}s. Please check your printer settings.`);
    }

    try {
      const result = await invoke('print_job', {
        jobType: type,
        order,
        settings,
        branchName
      });

      console.log('Print Job Success:', result);
      return true;
    } catch (err) {
      console.error('Print Failed:', err);
      throw err;
    }
  };

  const printNative = async (
    type: PrinterJobType,
    order: Order,
    settings: BusinessSettings,
    branchName?: string,
    copies: number = 1
  ): Promise<PrintResult> => {
    const jobId = uuidv4();
    store.addPrintJob({
      id: jobId,
      orderId: order.id,
      orderNumber: order.orderNumber,
      timestamp: new Date(),
      status: 'printing',
      format: 'thermal',
      retryCount: 0,
      maxRetries: 2,
      jobType: type === 'kitchen' ? 'kitchen' : 'customer',
    });

    try {
      for (let i = 0; i < copies; i++) {
        await printDocument(type, order, settings, branchName);
      }

      store.updatePrintJob(jobId, { status: 'success' });
      posthog.capture("receipt_printed", { job_type: type });
      return { success: true, jobId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      store.updatePrintJob(jobId, { status: 'failed', error: errorMessage });
      return { success: false, jobId, error: errorMessage, requiresRetry: true };
    }
  };

  const retryPrintJob = async (queueItem: any): Promise<PrintResult> => {
    return printNative(
      queueItem.jobType === 'kitchen' ? 'kitchen' : 'receipt',
      queueItem.orderData,
      queueItem.orderData.settings,
      queueItem.orderData.branchName,
      1
    );
  };

  useEffect(() => {
    refreshPrinters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...store,
    loading,
    error,
    refreshPrinters,
    printDocument,
    printNative,
    retryPrintJob,
  };
};
