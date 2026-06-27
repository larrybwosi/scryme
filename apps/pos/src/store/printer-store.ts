import { createWithEqualityFn as create } from 'zustand/traditional';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PrintJob, PrintQueueItem } from '@/types/print-types';
import { invoke } from '@tauri-apps/api/core';

export interface PrinterDevice {
  id: string;
  name: string;
  driver_name: string;
  description: string;
  status?: string;
  method?: 'system' | 'network';
  port_name?: string;
}

// Define the types of documents we handle
export type PrinterJobType = 'receipt' | 'invoice' | 'kitchen' | 'bill' | 'bar' | 'waybill' | 'label';

interface PrinterState {
  availablePrinters: PrinterDevice[];

  // This maps a Job Type to a Printer ID
  assignments: Record<PrinterJobType, string | null>;

  // Settings
  autoPrintInvoice: boolean;

  // Print job tracking
  printHistory: PrintJob[];
  printQueue: PrintQueueItem[];

  setPrinters: (printers: PrinterDevice[]) => void;
  assignPrinter: (type: PrinterJobType, printerId: string) => void;
  setAutoPrintInvoice: (enabled: boolean) => void;

  // Print job management
  addPrintJob: (job: PrintJob) => void;
  updatePrintJob: (jobId: string, updates: Partial<PrintJob>) => void;
  addToQueue: (item: PrintQueueItem) => void;
  removeFromQueue: (jobId: string) => void;
  clearPrintHistory: () => void;
  getPrintJob: (jobId: string) => PrintJob | undefined;
  loadConfig: () => Promise<void>;
}

export const usePrinterStore = create<PrinterState>()(
  persist(
    (set, get) => ({
      availablePrinters: [],
      printHistory: [],
      printQueue: [],

      // Default assignments are null
      assignments: {
        receipt: null,
        invoice: null,
        kitchen: null,
        bill: null,
        bar: null,
        waybill: null,
        label: null,
      },

      autoPrintInvoice: false,

      // UPDATE setPrinters to not just set list, but also check for auto-assignments
      setPrinters: printers => {
        set({ availablePrinters: printers });

        // Check for auto-assignments
        const autoAssignments = get().assignments;
        const newAssignments = { ...autoAssignments };

        Object.keys(autoAssignments).forEach(key => {
          const type = key as PrinterJobType;
          if (autoAssignments[type]) {
            const printer = printers.find(p => p.id === autoAssignments[type]);
            if (printer) {
              newAssignments[type] = printer.id;
            }
          }
        });

        set({ assignments: newAssignments });
      },

      assignPrinter: async (type, printerId) => {
        // 1. Update State
        set(state => ({
          assignments: { ...state.assignments, [type]: printerId },
        }));

        // 2. Persist to Disk via Rust
        const currentAssignments = get().assignments;
        const autoPrint = get().autoPrintInvoice;

        // Helper function to format the string ID into the Rust PrinterConfig struct
        const formatConfig = (id: string | null) => {
          if (!id) return null;
          return {
            type: 'system', // Assuming system printers based on the "XP-80C" error. Change to "network" if it's an IP address.
            target: id,
          };
        };

        try {
          await invoke('save_printer_config', {
            config: {
              receipt_printer: formatConfig(currentAssignments.receipt),
              kitchen_printer: formatConfig(currentAssignments.kitchen),
              invoice_printer: formatConfig(currentAssignments.invoice),
              bill_printer: formatConfig(currentAssignments.bill),
              bar_printer: formatConfig(currentAssignments.bar),
              waybill_printer: formatConfig(currentAssignments.waybill),
              label_printer: formatConfig(currentAssignments.label),
              auto_print_invoice: autoPrint,
            },
          });
        } catch (e) {
          console.error('Failed to save config', e);
        }
      },

      setAutoPrintInvoice: async enabled => {
        set({ autoPrintInvoice: enabled });

        const currentAssignments = get().assignments;
        const formatConfig = (id: string | null) => {
          if (!id) return null;
          return { type: 'system', target: id };
        };

        try {
          await invoke('save_printer_config', {
            config: {
              receipt_printer: formatConfig(currentAssignments.receipt),
              kitchen_printer: formatConfig(currentAssignments.kitchen),
              invoice_printer: formatConfig(currentAssignments.invoice),
              bill_printer: formatConfig(currentAssignments.bill),
              bar_printer: formatConfig(currentAssignments.bar),
              waybill_printer: formatConfig(currentAssignments.waybill),
              label_printer: formatConfig(currentAssignments.label),
              auto_print_invoice: enabled,
            },
          });
        } catch (e) {
          console.error('Failed to save auto print config', e);
        }
      },

      // Print job management
      addPrintJob: job =>
        set(state => ({
          printHistory: [job, ...state.printHistory].slice(0, 50), // Keep last 50 jobs
        })),

      updatePrintJob: (jobId, updates) =>
        set(state => ({
          printHistory: state.printHistory.map(job => (job.id === jobId ? { ...job, ...updates } : job)),
          printQueue: state.printQueue.map(item => (item.id === jobId ? { ...item, ...updates } : item)),
        })),

      addToQueue: item =>
        set(state => ({
          printQueue: [...state.printQueue, item],
        })),

      removeFromQueue: jobId =>
        set(state => ({
          printQueue: state.printQueue.filter(item => item.id !== jobId),
        })),

      clearPrintHistory: () => set({ printHistory: [] }),

      getPrintJob: jobId => {
        const state = get();
        return state.printHistory.find(job => job.id === jobId);
      },
      loadConfig: async () => {
        try {
          const config = await invoke<any>('get_printer_config');
          if (!config) return;

          set(() => ({
            assignments: {
              receipt: config.receipt_printer?.target || null,
              kitchen: config.kitchen_printer?.target || null,
              invoice: config.invoice_printer?.target || null,
              bill: config.bill_printer?.target || config.receipt_printer?.target || null,
              bar: config.bar_printer?.target || null,
              waybill: config.waybill_printer?.target || config.invoice_printer?.target || null,
              label: config.label_printer?.target || null,
            },
            autoPrintInvoice: config.auto_print_invoice || false,
          }));
        } catch (e) {
          console.error('Failed to load config', e);
        }
      },
    }),
    {
      name: 'printer-config',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        assignments: state.assignments,
        printHistory: state.printHistory.slice(0, 20), // Persist only last 20
      }),
    }
  )
);
