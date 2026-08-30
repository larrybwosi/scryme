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

  it('should set isService on OrderItem when adding a service product', () => {
    const store = usePosStore.getState();
    const serviceProduct = {
      productId: 's1',
      productName: 'General Consultation',
      variantId: 'sv1',
      variantName: 'Default',
      category: 'Services',
      sku: 'SRV-01',
      stock: 0,
      isService: true,
      sellableUnits: [
        { unitId: 'su1', unitName: 'Session', price: 50, conversion: 1, isBaseUnit: true },
      ],
      variants: [{ variantId: 'sv1', name: 'Default' }]
    };

    store.setProducts([serviceProduct as any]);
    store.addItemToOrder(serviceProduct as any, 'sv1', serviceProduct.sellableUnits[0], 1);

    const items = usePosStore.getState().currentOrder.items;
    expect(items).toHaveLength(1);
    expect(items[0].isService).toBe(true);
    expect(items[0].productName).toBe('General Consultation');
  });

  it('should bypass stock deduction for service items', () => {
    const store = usePosStore.getState();
    const productItem = {
      productId: 'p1',
      productName: 'Physical Good',
      stock: 10,
      isService: false,
      sellableUnits: [{ unitId: 'u1', unitName: 'Unit', price: 10, conversion: 1, isBaseUnit: true }]
    };
    const serviceItem = {
      productId: 's1',
      productName: 'Repair Service',
      stock: 0,
      isService: true,
      sellableUnits: [{ unitId: 'su1', unitName: 'Service', price: 100, conversion: 1, isBaseUnit: true }]
    };

    store.setProducts([productItem, serviceItem] as any);

    store.deductStockForOrderItems([
      { productId: 'p1', quantity: 2, selectedUnit: { conversion: 1 } },
      { productId: 's1', quantity: 1, isService: true, selectedUnit: { conversion: 1 } }
    ]);

    const products = usePosStore.getState().products;
    const updatedProduct = products.find(p => p.productId === 'p1');
    const updatedService = products.find(p => p.productId === 's1');

    expect(updatedProduct?.stock).toBe(8); // 10 - 2
    expect(updatedService?.stock).toBe(0); // Bypassed
  });

  it('should exclude service items from low stock alerts', () => {
    const store = usePosStore.getState();
    store.setProducts([
      { productId: 'p1', productName: 'Low Stock Product', stock: 2, isService: false },
      { productId: 's1', productName: 'Service Item', stock: 0, isService: true }
    ] as any);

    const alerts = store.getLowStockProducts();
    expect(alerts).toHaveLength(1);
    expect(alerts[0].productId).toBe('p1');
  });
});
