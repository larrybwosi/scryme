import { render, screen, fireEvent, waitFor } from '@/test/utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupermarketPOS } from '@/pages/supermarket-pos';
import { usePosStore } from '@/store/store';
import { useScanner } from '@/hooks/use-scanner';
import { invoke } from '@tauri-apps/api/core';

// Mock dependencies
vi.mock('@/store/store', () => ({
  usePosStore: vi.fn(selector =>
    selector({
      currentOrder: { items: [], customerId: null },
      addItemToOrder: vi.fn(),
      removeItemFromOrder: vi.fn(),
      updateItemInOrder: vi.fn(),
      resetOrder: vi.fn(),
      settings: { enableBarcodeScanner: true, taxRate: 16 },
      taxRate: 16,
      heldOrders: [],
      holdCurrentOrder: vi.fn(),
      retrieveHeldOrder: vi.fn(),
      deleteHeldOrder: vi.fn(),
      getBusinessConfig: vi.fn(() => ({ type: 'supermarket', features: {} })),
    })
  ),
}));

vi.mock('@/hooks/use-scanner', () => ({
  useScanner: vi.fn(),
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
  convertFileSrc: vi.fn(src => src),
}));

vi.mock('@/hooks/products', () => ({
  usePosProducts: () => ({ products: [] }),
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ checkOut: vi.fn(), isAuthenticated: true }),
}));

vi.mock('@/hooks/use-pricing-sync', () => ({
  usePosPricingSync: vi.fn(),
}));

vi.mock('@/components/pos/payment-dialog', () => ({
  default: () => <div data-testid="payment-modal" />,
}));

vi.mock('@/components/receipt-dialog', () => ({
  ReceiptDialog: () => <div data-testid="receipt-dialog" />,
}));

vi.mock('@/components/settings-dialog', () => ({
  SettingsDialog: () => <div data-testid="settings-dialog" />,
}));

describe('SupermarketPOS', () => {
  const mockAddItemToOrder = vi.fn();
  const mockResetOrder = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (usePosStore as any).mockImplementation((selector: any) =>
      selector({
        currentOrder: { items: [], customerId: null },
        addItemToOrder: mockAddItemToOrder,
        removeItemFromOrder: vi.fn(),
        updateItemInOrder: vi.fn(),
        resetOrder: mockResetOrder,
        settings: { enableBarcodeScanner: true, taxRate: 16 },
        taxRate: 16,
        heldOrders: [],
        holdCurrentOrder: vi.fn(),
        retrieveHeldOrder: vi.fn(),
        deleteHeldOrder: vi.fn(),
        getBusinessConfig: vi.fn(() => ({ type: 'supermarket', features: {} })),
      })
    );

    (useScanner as any).mockReturnValue({
      startScanner: vi.fn(),
      stopScanner: vi.fn(),
      isConnected: true,
      lastScanned: null,
      clearLastScanned: vi.fn(),
    });
  });

  it('renders supermarket POS layout', () => {
    render(<SupermarketPOS />);
    expect(screen.getByText('Supermarket POS')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search products manually/i)).toBeInTheDocument();
  });

  it('processes barcode scanning to add items', async () => {
    const mockClearLastScanned = vi.fn();
    (useScanner as any).mockReturnValue({
      startScanner: vi.fn(),
      stopScanner: vi.fn(),
      isConnected: true,
      lastScanned: 'BARCODE123',
      clearLastScanned: mockClearLastScanned,
    });

    (invoke as any).mockImplementation((cmd: string) => {
      if (cmd === 'get_product_by_barcode_command') {
        return Promise.resolve({
          productId: 'p1',
          productName: 'Scanned Item',
          variants: [{ variantId: 'v1', barcode: 'BARCODE123', variantName: 'Default' }],
          sellableUnits: [{ unitId: 'u1', unitName: 'Piece', price: 100, isBaseUnit: true }],
        });
      }
      if (cmd === 'resolve_price_batch_command') {
        return Promise.resolve([100]);
      }
      return Promise.resolve();
    });

    render(<SupermarketPOS />);

    await waitFor(() => {
      expect(mockClearLastScanned).toHaveBeenCalled();
      expect(mockAddItemToOrder).toHaveBeenCalledWith(
        expect.objectContaining({ productName: 'Scanned Item' }),
        'v1',
        expect.objectContaining({ unitId: 'u1', price: 100 }),
        1
      );
    });
  });

  it('allows clearing the entire sale', () => {
    (usePosStore as any).mockImplementation((selector: any) =>
      selector({
        currentOrder: { items: [{ productId: 'p1', quantity: 1, selectedUnit: { price: 50 } }], customerId: null },
        addItemToOrder: mockAddItemToOrder,
        removeItemFromOrder: vi.fn(),
        updateItemInOrder: vi.fn(),
        resetOrder: mockResetOrder,
        settings: { enableBarcodeScanner: true, taxRate: 16 },
        taxRate: 16,
        heldOrders: [],
        holdCurrentOrder: vi.fn(),
        retrieveHeldOrder: vi.fn(),
        deleteHeldOrder: vi.fn(),
        getBusinessConfig: vi.fn(() => ({ type: 'supermarket', features: {} })),
      })
    );

    render(<SupermarketPOS />);

    const clearButton = screen.getByText('Clear Sale');
    fireEvent.click(clearButton);

    expect(mockResetOrder).toHaveBeenCalled();
  });
});
