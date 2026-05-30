import { renderHook, act } from '@testing-library/react';
import { usePdfActions } from '../use-pdf-actions';
import { mockInvoke } from '@/test/setup';
import { toast } from 'sonner';
import React from 'react';
import * as tauriCore from '@tauri-apps/api/core';

vi.mock('sonner', () => ({
  toast: {
    loading: vi.fn().mockReturnValue('loading-id'),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@react-pdf/renderer', async (importOriginal) => {
    const actual = await importOriginal<any>();
    return {
        ...actual,
        pdf: vi.fn().mockReturnValue({
            toBlob: vi.fn().mockResolvedValue({
                arrayBuffer: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4]).buffer),
            }),
        }),
    };
});

vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: any[]) => mockInvoke(...args),
  convertFileSrc: vi.fn((path) => path),
  isTauri: vi.fn().mockReturnValue(false),
}));

// Mock usePosStore
vi.mock('@/store/store', () => ({
    usePosStore: {
        getState: () => ({
            settings: {
                receiptConfig: { paperSize: 'A4' },
                printers: [{ type: 'receipt', enabled: true, isDefault: true, name: 'Mock Printer' }]
            }
        })
    }
}));

// Mock usePrinterStore
vi.mock('@/store/printer-store', () => ({
    usePrinterStore: () => ({
        assignments: { receipt: 'printer_1' },
        addPrintJob: vi.fn(),
        updatePrintJob: vi.fn(),
        setPrinters: vi.fn(),
        loadConfig: vi.fn(),
    })
}));

describe('usePdfActions Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvoke.mockReset();
    mockInvoke.mockImplementation(async (cmd) => {
        if (cmd === 'get_system_printers') return [];
        if (cmd === 'discover_network_printers') return [];
        return { success: true };
    });
    vi.mocked(tauriCore.isTauri).mockReturnValue(false);
  });

  it('should handle printing in Tauri environment', async () => {
    vi.mocked(tauriCore.isTauri).mockReturnValue(true);

    const { result } = renderHook(() => usePdfActions());

    const mockDoc = React.createElement('div');
    await act(async () => {
        await result.current.handlePrint(mockDoc, 'test-prefix', { id: 'txn_1', orderNumber: 'ORD-1' });
    });

    expect(toast.loading).toHaveBeenCalledWith('Preparing print job...');
    expect(toast.success).toHaveBeenCalledWith('Sent to printer!', expect.anything());
  });

  it('should handle downloading', async () => {
    const { result } = renderHook(() => usePdfActions());
    const mockDoc = React.createElement('div');

    // We expect an error due to jsdom's createObjectURL, but the hook should complete
    await act(async () => {
        await result.current.handleDownload(mockDoc, 'test-prefix');
    });

    expect(toast.loading).toHaveBeenCalledWith('Generating PDF...');
    expect(result.current.isDownloading).toBe(false);
  });
});
