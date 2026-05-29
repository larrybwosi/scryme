import { PrinterService } from '@/lib/printerService';
import { ReceiptBuilder } from '@/lib/receipt-builder';
import { useState, useCallback } from 'react';

export type PrintMethod = 'network' | 'system' | 'usb';

interface PrintConfig {
  ip?: string; // For network
  printerName?: string; // For system
  vid?: string; // For USB (hex string or number)
  pid?: string; // For USB
}

export const useSilentPrinter = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const printReceipt = useCallback(
    async (method: PrintMethod, config: PrintConfig, items: { name: string; price: string }[]) => {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);

      try {
        // 1. Construct Receipt using Builder
        const receipt = new ReceiptBuilder()
          .center('MY TAURI APP')
          .line(2)
          .text('Date: ' + new Date().toLocaleDateString())
          .line()
          .text('--------------------------------')
          .line()
          .bold('ITEM             PRICE')
          .line();

        items.forEach(item => {
          receipt.text(`${item.name.padEnd(16)} ${item.price}`).line();
        });

        receipt.line().bold('TOTAL:           $99.99').line(2).center('Thank You!').line(4).cut().build();

        const rawData = receipt.build();

        // 2. Send to appropriate service
        let res;
        if (method === 'network') {
          if (!config.ip) throw new Error('IP Address required for Network print');
          res = await PrinterService.printNetwork(config.ip, rawData);
        } else if (method === 'system') {
          if (!config.printerName) throw new Error('Printer Name required for System print');
          res = await PrinterService.printSystem(config.printerName, rawData);
        } else if (method === 'usb') {
          if (!config.vid || !config.pid) throw new Error('VID/PID required for USB print');
          // Convert hex strings (e.g., "0x04b8") to numbers
          const vidNum = parseInt(config.vid.toString(), 16);
          const pidNum = parseInt(config.pid.toString(), 16);
          res = await PrinterService.printUsb(vidNum, pidNum, rawData);
        } else {
          throw new Error('Invalid print method');
        }

        // 3. Update State
        if (res.success) {
          setSuccessMsg(res.message);
        } else {
          setError(res.message);
        }
      } catch (err: any) {
        setError(err.message || 'Unknown print error');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { printReceipt, loading, error, successMsg };
};
