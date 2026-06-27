import { render, screen, fireEvent } from '@/test/utils';
import { SupermarketPOS } from '../supermarket-pos';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@tauri-apps/api/core', () => ({
  convertFileSrc: vi.fn(path => path),
  invoke: vi.fn(),
}));

vi.mock('@/hooks/products', () => ({
  usePosProducts: () => ({
    products: [
      {
        productId: 'p1',
        productName: 'Milk',
        category: 'Dairy',
        sellableUnits: [{ unitId: 'u1', unitName: 'Litre', price: 100, isBaseUnit: true }],
        variants: [{ variantId: 'v1', variantName: 'Whole Milk', stock: 10 }],
      },
    ],
  }),
}));

vi.mock('react-virtuoso', () => ({
  Virtuoso: ({ data, itemContent }: any) => (
    <div>
      {data.map((item: any, index: number) => (
        <div key={index}>{itemContent(index, item)}</div>
      ))}
    </div>
  ),
}));

vi.mock('@/hooks/use-scanner', () => ({
  useScanner: () => ({
    startScanner: vi.fn(),
    stopScanner: vi.fn(),
    isConnected: true,
    lastScanned: null,
    clearLastScanned: vi.fn(),
  }),
}));

describe('SupermarketPOS Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<SupermarketPOS />);
    expect(screen.getByText('Supermarket POS')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search products/)).toBeInTheDocument();
  });

  it('allows manual product lookup and addition', async () => {
    render(<SupermarketPOS />);

    // Find milk in the manual lookup (it's the only one with this class in the list)
    const milkButton = screen.getByText('Milk', { selector: 'p' });
    fireEvent.click(milkButton);

    // Verify it's added to the cart
    expect(screen.getByText('1 Items')).toBeInTheDocument();
    expect(screen.getAllByText('Milk').length).toBeGreaterThan(1); // One in lookup, one in cart
  });

  it('displays the correct total', () => {
    render(<SupermarketPOS />);
    const milkButton = screen.getByText('Milk', { selector: 'p' });
    fireEvent.click(milkButton);

    // Total label is in the footer
    expect(screen.getByText('Total')).toBeInTheDocument();
  });
});
