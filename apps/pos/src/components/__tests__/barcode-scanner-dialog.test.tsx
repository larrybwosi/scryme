import { render, screen, fireEvent, waitFor } from '@/test/utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BarcodeScannerDialog } from '@/components/barcode-scanner-dialog';
import { usePosStore } from '@/store/store';

// Mock store
vi.mock('@/store/store', () => ({
  usePosStore: vi.fn(),
}));

describe('BarcodeScannerDialog', () => {
  const mockAddItemToOrder = vi.fn();
  const mockOnOpenChange = vi.fn();
  const mockProducts = [
    {
      productId: 'p1',
      productName: 'Test Product',
      barcode: '123456',
      stock: 10,
      variantId: 'v1',
      sellableUnits: [{ unitId: 'u1', unitName: 'Piece', isBaseUnit: true, price: 100 }],
    },
    {
      productId: 'p2',
      productName: 'Out of Stock Product',
      barcode: '000000',
      stock: 0,
      variantId: 'v2',
      sellableUnits: [{ unitId: 'u2', unitName: 'Piece', isBaseUnit: true, price: 200 }],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (usePosStore as any).mockImplementation((selector: any) => selector({
      products: mockProducts,
      addItemToOrder: mockAddItemToOrder,
    }));
  });

  it('renders correctly when open', () => {
    render(<BarcodeScannerDialog open={true} onOpenChange={mockOnOpenChange} />);
    expect(screen.getByText('Scan Barcode')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Scan or enter barcode...')).toBeInTheDocument();
  });

  it('adds product to cart when valid barcode is entered manually', async () => {
    render(<BarcodeScannerDialog open={true} onOpenChange={mockOnOpenChange} />);

    const input = screen.getByPlaceholderText('Scan or enter barcode...');
    fireEvent.change(input, { target: { value: '123456' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(mockAddItemToOrder).toHaveBeenCalledWith(
        expect.objectContaining({ productId: 'p1' }),
        'v1',
        expect.objectContaining({ unitId: 'u1' }),
        1
      );
    });
  });

  it('shows error when product is not found', async () => {
    render(<BarcodeScannerDialog open={true} onOpenChange={mockOnOpenChange} />);

    const input = screen.getByPlaceholderText('Scan or enter barcode...');
    fireEvent.change(input, { target: { value: '999999' } });
    fireEvent.click(screen.getByText('Add to Cart'));

    expect(await screen.findByText('Product not found for barcode: 999999')).toBeInTheDocument();
  });

  it('shows error when product is out of stock', async () => {
    render(<BarcodeScannerDialog open={true} onOpenChange={mockOnOpenChange} />);

    const input = screen.getByPlaceholderText('Scan or enter barcode...');
    fireEvent.change(input, { target: { value: '000000' } });
    fireEvent.click(screen.getByText('Add to Cart'));

    expect(await screen.findByText('Out of Stock Product is out of stock')).toBeInTheDocument();
  });
});
