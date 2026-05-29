import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePosStore } from '../store';

// Mocking dependencies if necessary
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('usePosStore - Order Item Updates', () => {
  beforeEach(() => {
    usePosStore.getState().resetOrder();
    usePosStore.getState().setProducts([
      {
        productId: 'p1',
        productName: 'Product 1',
        variantId: 'v1',
        variantName: 'Variant 1',
        category: 'cat',
        sku: 'sku1',
        stock: 100,
        sellableUnits: [
          { unitId: 'u1', unitName: 'Unit 1', price: 10, conversion: 1, isBaseUnit: true },
          { unitId: 'u2', unitName: 'Unit 2', price: 18, conversion: 2, isBaseUnit: false },
        ],
        variants: [{ variantId: 'v1', name: 'Variant 1' }]
      }
    ] as any);
  });

  it('should add an item to the order', () => {
    const store = usePosStore.getState();
    const product = store.products[0];
    const unit = product.sellableUnits[0];

    store.addItemToOrder(product, 'v1', unit, 1);

    expect(usePosStore.getState().currentOrder.items).toHaveLength(1);
    expect(usePosStore.getState().currentOrder.items[0].quantity).toBe(1);
    expect(usePosStore.getState().currentOrder.items[0].selectedUnit.unitId).toBe('u1');
  });

  it('should update unit and merge if identical item exists', () => {
    const store = usePosStore.getState();
    const product = store.products[0];
    const unit1 = product.sellableUnits[0];
    const unit2 = product.sellableUnits[1];

    // Add 1 of Unit 1
    store.addItemToOrder(product, 'v1', unit1, 1);
    // Add 1 of Unit 2
    store.addItemToOrder(product, 'v1', unit2, 1);

    expect(usePosStore.getState().currentOrder.items).toHaveLength(2);

    const itemToEdit = usePosStore.getState().currentOrder.items[0]; // This is Unit 1

    // Change Unit 1 to Unit 2
    usePosStore.getState().updateItemInOrder({
      ...itemToEdit,
      selectedUnit: unit2,
      originalUnitId: unit1.unitId
    } as any);

    const finalItems = usePosStore.getState().currentOrder.items;
    expect(finalItems).toHaveLength(1);
    expect(finalItems[0].selectedUnit.unitId).toBe('u2');
    expect(finalItems[0].quantity).toBe(2);
  });

  it('should update root price when unit is updated', () => {
    const store = usePosStore.getState();
    const product = store.products[0];
    const unit1 = product.sellableUnits[0]; // Price 10
    const unit2 = product.sellableUnits[1]; // Price 18

    // Add 1 of Unit 1
    store.addItemToOrder(product, 'v1', unit1, 1);
    const itemToEdit = usePosStore.getState().currentOrder.items[0];
    expect(itemToEdit.price).toBe(10);

    // Change Unit 1 to Unit 2 (simulating Cart component logic)
    usePosStore.getState().updateItemInOrder({
      ...itemToEdit,
      selectedUnit: unit2,
      price: unit2.price, // Manual update like in component
      originalUnitId: unit1.unitId
    } as any);

    const finalItems = usePosStore.getState().currentOrder.items;
    expect(finalItems[0].price).toBe(18);
  });

  it('should remove item using variantId and unitId', () => {
    const store = usePosStore.getState();
    const product = store.products[0];
    const unit1 = product.sellableUnits[0];

    store.addItemToOrder(product, 'v1', unit1, 1);
    expect(usePosStore.getState().currentOrder.items).toHaveLength(1);

    store.removeItemFromOrder('p1', 'v1', 'u1');
    expect(usePosStore.getState().currentOrder.items).toHaveLength(0);
  });

  it('should update unit and not merge if no duplicate exists', () => {
    const store = usePosStore.getState();
    const product = store.products[0];
    const unit1 = product.sellableUnits[0];
    const unit2 = product.sellableUnits[1];

    // Add 1 of Unit 1
    store.addItemToOrder(product, 'v1', unit1, 1);

    const itemToEdit = usePosStore.getState().currentOrder.items[0];

    // Change Unit 1 to Unit 2
    usePosStore.getState().updateItemInOrder({
      ...itemToEdit,
      selectedUnit: unit2,
      originalUnitId: unit1.unitId
    } as any);

    const finalItems = usePosStore.getState().currentOrder.items;
    expect(finalItems).toHaveLength(1);
    expect(finalItems[0].selectedUnit.unitId).toBe('u2');
    expect(finalItems[0].quantity).toBe(1);
  });
});
