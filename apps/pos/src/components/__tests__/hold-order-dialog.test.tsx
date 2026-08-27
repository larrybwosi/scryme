import { render, screen, fireEvent } from '@/test/utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HoldOrderDialog } from '@/components/hold-order-dialog';
import { usePosStore } from '@/store/store';

// Mock store
vi.mock('@/store/store', () => ({
  usePosStore: vi.fn(),
}));

describe('HoldOrderDialog', () => {
  const mockHoldCurrentOrder = vi.fn();
  const mockOnOpenChange = vi.fn();

  const mockOrder = {
    items: [
      {
        productId: 'p1',
        productName: 'Test Product',
        quantity: 2,
        selectedUnit: { price: 100, unitId: 'u1', unitName: 'Piece' },
      },
    ],
    customerName: 'Alice',
  };

  const mockSettings = {
    maxHeldOrders: 5,
    requireHoldReason: true,
    currency: 'USD',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (usePosStore as any).mockImplementation((selector: any) =>
      selector({
        currentOrder: mockOrder,
        holdCurrentOrder: mockHoldCurrentOrder,
        heldOrders: [],
        settings: mockSettings,
      })
    );
  });

  it('renders correctly when open', () => {
    render(<HoldOrderDialog open={true} onOpenChange={mockOnOpenChange} />);
    expect(screen.getByRole('heading', { name: 'Hold Order' })).toBeInTheDocument();
    expect(
      screen.getByText('Temporarily save this order and clear the cart. You can recall it later.')
    ).toBeInTheDocument();
  });

  it('renders and selects quick reasons with correct accessibility attributes', () => {
    render(<HoldOrderDialog open={true} onOpenChange={mockOnOpenChange} />);

    // Quick Reasons should be rendered as buttons
    const customerSteppedAwayButton = screen.getByRole('button', { name: 'Customer stepped away' });
    expect(customerSteppedAwayButton).toBeInTheDocument();
    expect(customerSteppedAwayButton).toHaveAttribute('aria-pressed', 'false');

    // Click to select the reason
    fireEvent.click(customerSteppedAwayButton);
    expect(customerSteppedAwayButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders and selects priority options with correct accessibility attributes', () => {
    render(<HoldOrderDialog open={true} onOpenChange={mockOnOpenChange} />);

    const urgentButton = screen.getByRole('button', { name: /Urgent/i });
    expect(urgentButton).toBeInTheDocument();
    expect(urgentButton).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(urgentButton);
    expect(urgentButton).toHaveAttribute('aria-pressed', 'true');
  });
});
