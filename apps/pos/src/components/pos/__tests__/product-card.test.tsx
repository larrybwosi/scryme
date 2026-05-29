import { render, screen, fireEvent } from '@/test/utils';
import { ProductCard } from '../product-card';
import { vi, describe, it, expect } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  convertFileSrc: vi.fn((path) => path),
}));

describe('ProductCard Component', () => {
  const mockProduct = {
    productId: 'p1',
    name: 'Latte',
    category: 'Coffee',
    imageUrl: 'latte.jpg',
    totalStock: 5,
    variants: [
      {
        variantId: 'v1',
        name: 'Standard',
        sku: 'LAT-STD',
        stock: 5,
        sellableUnits: [
          {
            unitId: 'u1',
            unitName: 'Cup',
            price: 250,
            isBaseUnit: true,
          }
        ]
      }
    ]
  };

  it('renders product information correctly', () => {
    render(
      <ProductCard
        product={mockProduct as any}
        onAddToCart={vi.fn()}
        pricingMode="retail"
      />
    );
    expect(screen.getByText('Latte')).toBeInTheDocument();
    // Price shows as KSH 250.00
    expect(screen.getByText(/250\.00/)).toBeInTheDocument();
  });

  it('shows stock level', () => {
    render(
      <ProductCard
        product={mockProduct as any}
        onAddToCart={vi.fn()}
        pricingMode="retail"
      />
    );
    // The current implementation shows "Only 5 left" for low stock (< 10)
    expect(screen.getByText(/Only 5 left/)).toBeInTheDocument();
  });

  it('triggers item addition on click', () => {
    const onAddToCart = vi.fn();
    render(
      <ProductCard
        product={mockProduct as any}
        onAddToCart={onAddToCart}
        pricingMode="retail"
      />
    );

    // The "Add" button
    const addButton = screen.getByText('Add');
    fireEvent.click(addButton);

    expect(onAddToCart).toHaveBeenCalled();
  });
});
