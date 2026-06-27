import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { UnitSelectionDialog } from '../unit-selection-dialog';

// Mock the currency hook
vi.mock('@/lib/utils', async () => {
  const actual = await vi.importActual('@/lib/utils');
  return {
    ...actual,
    useFormattedCurrency: () => (val: number) => `KSh ${val}`,
  };
});

const mockProduct = {
  productId: 'p1',
  name: 'Test Product',
  productName: 'Test Product',
  category: 'Test Category',
  variants: [
    {
      variantId: 'v1',
      name: 'Variant 1',
      sku: 'SKU1',
      stock: 100,
      sellableUnits: [
        { unitId: 'u1', unitName: 'Piece', price: 10, isBaseUnit: true },
        { unitId: 'u2', unitName: 'Box', price: 100, isBaseUnit: false },
      ],
    },
  ],
};

describe('UnitSelectionDialog', () => {
  it('renders correctly with product info', () => {
    render(
      <UnitSelectionDialog
        open={true}
        onOpenChange={() => {}}
        product={mockProduct}
        pricingMode="retail"
        onConfirm={() => {}}
      />
    );

    expect(screen.getByText(/Select Unit: Test Product/i)).toBeInTheDocument();
    expect(screen.getByText('Piece')).toBeInTheDocument();
  });

  it('changes price and total when unit is changed', () => {
    render(
      <UnitSelectionDialog
        open={true}
        onOpenChange={() => {}}
        product={mockProduct}
        pricingMode="retail"
        onConfirm={() => {}}
      />
    );

    const boxUnit = screen.getByRole('radio', { name: /Box/i });
    fireEvent.click(boxUnit);

    // Total price is in a div with a specific class
    const totalPriceDisplay = screen.getByText((content, element) => {
      return !!element?.classList.contains('text-2xl') && content === 'KSh 100';
    });
    expect(totalPriceDisplay).toBeInTheDocument();
    expect(screen.getByText('KSh 100 per Box')).toBeInTheDocument();
  });

  it('updates total when quantity changes', () => {
    render(
      <UnitSelectionDialog
        open={true}
        onOpenChange={() => {}}
        product={mockProduct}
        pricingMode="retail"
        onConfirm={() => {}}
      />
    );

    const plusButton = screen.getAllByRole('button').find(btn => btn.querySelector('.lucide-plus'));

    if (plusButton) {
      fireEvent.click(plusButton);
    }

    const totalPriceDisplay = screen.getByText((content, element) => {
      return !!element?.classList.contains('text-2xl') && content === 'KSh 20';
    });
    expect(totalPriceDisplay).toBeInTheDocument();
  });

  it('calls onConfirm with selected variant, unit and quantity', () => {
    const onConfirm = vi.fn();
    render(
      <UnitSelectionDialog
        open={true}
        onOpenChange={() => {}}
        product={mockProduct}
        pricingMode="retail"
        onConfirm={onConfirm}
      />
    );

    const addButton = screen.getByText(/Add to Cart/i);
    fireEvent.click(addButton);

    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ variantId: 'v1' }),
      expect.objectContaining({ unitId: 'u1', price: 10 }),
      1
    );
  });
});
