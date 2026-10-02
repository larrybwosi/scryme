import { render, screen } from '@/test/utils';
import { Cart } from '../cart';
import { usePosStore } from '@/store/store';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock Tauri components and events
vi.mock('@tauri-apps/api/event', () => ({
  emitTo: vi.fn(),
}));

describe('Cart Component', () => {
  beforeEach(() => {
    usePosStore.getState().resetOrder();
  });

  it('renders empty cart message when no items', () => {
    render(<Cart />);
    expect(screen.getByText(/Your cart is empty/i)).toBeInTheDocument();
  });

  it('displays items added to the cart', async () => {
    const mockItem = {
      productId: 'p1',
      productName: 'Test Product',
      variantId: 'v1',
      variantName: 'Standard',
      quantity: 2,
      selectedUnit: {
        unitId: 'u1',
        unitName: 'Piece',
        price: 100,
      },
    };

    usePosStore.setState(state => ({
      currentOrder: {
        ...state.currentOrder,
        items: [mockItem as any],
      },
    }));

    render(<Cart />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    // Price shows as "200" for total but let's check for the exact text presence
    expect(screen.getByText('200')).toBeInTheDocument();
  });

  it('calculates totals correctly with tax', () => {
    const mockItem = {
      productId: 'p1',
      productName: 'Taxable Product',
      variantId: 'v1',
      variantName: 'Standard',
      quantity: 1,
      selectedUnit: {
        unitId: 'u1',
        unitName: 'Piece',
        price: 116, // Assuming 16% tax included
      },
    };

    usePosStore.setState(state => ({
      settings: { ...state.settings, taxRate: 16 },
      currentOrder: {
        ...state.currentOrder,
        items: [mockItem as any],
      },
    }));

    render(<Cart />);

    // Total appears in item row and footer
    expect(screen.getAllByText('116')).toHaveLength(2);
    // Tax calculation: 116 - (116 / 1.16) = 16
    expect(screen.getByText('16.00')).toBeInTheDocument(); // Tax amount
    expect(screen.getByText('100.00')).toBeInTheDocument(); // Subtotal amount
  });


  it('displays pre-order banner and allows exiting pre-order mode', () => {
    usePosStore.setState(state => ({
      currentOrder: {
        ...state.currentOrder,
        metadata: {
          isCustomOrder: true,
          dueDate: '2025-12-25',
          dueTime: '14:00',
          depositAmount: 50,
        },
      },
    }));

    render(<Cart />);

    expect(screen.getByText('Pre-Order Mode Active')).toBeInTheDocument();
    expect(screen.getByText('Due: 2025-12-25 14:00')).toBeInTheDocument();

    const exitBtn = screen.getByRole('button', { name: /Exit Pre-Order/i });
    expect(exitBtn).toBeInTheDocument();

    usePosStore.getState().cancelPreOrder();

    expect(usePosStore.getState().currentOrder.metadata?.isCustomOrder).toBeUndefined();
  });
});