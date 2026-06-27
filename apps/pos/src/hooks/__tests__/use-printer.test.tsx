import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePrinter } from '@/hooks/use-printer';
import { usePrinterStore } from '@/store/printer-store';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('posthog-js', () => ({
  default: {
    capture: vi.fn(),
  },
}));

describe('usePrinter and PrinterStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (invoke as any).mockImplementation((cmd: string) => {
      if (cmd === 'get_system_printers') {
        return Promise.resolve([]);
      }
      if (cmd === 'discover_network_printers') {
        return Promise.resolve([]);
      }
      if (cmd === 'get_printer_config') {
        return Promise.resolve(null);
      }
      if (cmd === 'save_printer_config') {
        return Promise.resolve();
      }
      if (cmd === 'print_job') {
        return Promise.resolve({ success: true });
      }
      return Promise.resolve();
    });

    usePrinterStore.setState({
      availablePrinters: [],
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
      printHistory: [],
      printQueue: [],
    });
  });

  it('refreshes printers and loads config', async () => {
    (invoke as any).mockImplementation((cmd: string) => {
      if (cmd === 'get_system_printers') {
        return Promise.resolve([{ id: 'p1', name: 'System Printer', type: 'system' }]);
      }
      if (cmd === 'discover_network_printers') {
        return Promise.resolve([{ id: 'p2', name: 'Network Printer', type: 'network', port_name: '9100' }]);
      }
      if (cmd === 'get_printer_config') {
        return Promise.resolve({
          receipt_printer: { target: 'p1', type: 'system' },
        });
      }
      return Promise.resolve();
    });

    let result: any;
    await act(async () => {
      const rendered = renderHook(() => usePrinter());
      result = rendered.result;
    });

    await waitFor(() => {
      expect(result.current.availablePrinters).toHaveLength(2);
      expect(result.current.assignments.receipt).toBe('p1');
    });
  });

  it('assigns a printer and persists to backend', async () => {
    let result: any;
    await act(async () => {
      const rendered = renderHook(() => usePrinter());
      result = rendered.result;
    });

    await act(async () => {
      await result.current.assignPrinter('receipt', 'p1');
    });

    expect(result.current.assignments.receipt).toBe('p1');
    expect(invoke).toHaveBeenCalledWith('save_printer_config', expect.any(Object));
  });

  it('prints a document successfully', async () => {
    (invoke as any).mockImplementation((cmd: string) => {
      if (cmd === 'get_system_printers') {
        return Promise.resolve([{ id: 'p1', name: 'System Printer', type: 'system' }]);
      }
      if (cmd === 'discover_network_printers') {
        return Promise.resolve([]);
      }
      if (cmd === 'get_printer_config') {
        return Promise.resolve({
          receipt_printer: { target: 'p1', type: 'system' },
        });
      }
      if (cmd === 'print_job') {
        return Promise.resolve({ success: true });
      }
      return Promise.resolve();
    });

    usePrinterStore.setState({
      assignments: {
        ...usePrinterStore.getState().assignments,
        receipt: 'p1',
      },
    });

    let result: any;
    await act(async () => {
      const rendered = renderHook(() => usePrinter());
      result = rendered.result;
    });

    const order = { id: 'o1', orderNumber: 'ORD-1' };
    const settings = { businessName: 'Test' };

    let printResult: any;
    await act(async () => {
      printResult = await result.current.printNative('receipt', order as any, settings as any);
    });

    expect(printResult.success).toBe(true);
    expect(invoke).toHaveBeenCalledWith(
      'print_job',
      expect.objectContaining({
        jobType: 'receipt',
        order: order,
      })
    );
  });

  it('fails if no printer is assigned for the job type', async () => {
    let result: any;
    await act(async () => {
      const rendered = renderHook(() => usePrinter());
      result = rendered.result;
    });

    const order = { id: 'o1', orderNumber: 'ORD-1' };
    const settings = { businessName: 'Test' };

    let printResult: any;
    await act(async () => {
      printResult = await result.current.printNative('kitchen', order as any, settings as any);
    });

    expect(printResult.success).toBe(false);
    expect(printResult.error).toContain('No printer assigned');
  });
});
