import { describe, it, expect, beforeEach } from 'vitest';
import { useKdsStore } from '../kds-store';

describe('KdsStore', () => {
  beforeEach(() => {
    useKdsStore.getState().setOrders([]);
    useKdsStore.getState().setConnectionStatus('disconnected');
  });

  it('should initialize with empty orders and disconnected status', () => {
    const state = useKdsStore.getState();
    expect(state.orders).toEqual([]);
    expect(state.connectionStatus).toBe('disconnected');
  });

  it('should update connection status', () => {
    useKdsStore.getState().setConnectionStatus('connected');
    expect(useKdsStore.getState().connectionStatus).toBe('connected');
  });

  it('should add an order and prevent duplicates', () => {
    const order = {
      id: 'order-1',
      num: 'TKT-1',
      type: 'dine',
      station: 'hot',
      table: '5',
      status: 'new',
      createdAt: Date.now(),
      items: [],
      note: '',
      server: 'John',
      covers: 2
    } as any;

    useKdsStore.getState().addOrder(order);
    expect(useKdsStore.getState().orders).toHaveLength(1);

    // Try to add same order again
    useKdsStore.getState().addOrder(order);
    expect(useKdsStore.getState().orders).toHaveLength(1);
  });

  it('should update order status', () => {
    const order = { id: 'order-1', status: 'new' } as any;
    useKdsStore.getState().setOrders([order]);

    useKdsStore.getState().updateOrderStatus('order-1', 'in_progress');
    expect(useKdsStore.getState().orders[0].status).toBe('in_progress');
  });

  it('should update assigned station and persist in localStorage', () => {
    useKdsStore.getState().setAssignedStation('grill');
    expect(useKdsStore.getState().assignedStation).toBe('grill');
    expect(localStorage.getItem('KDS_STATION')).toBe('grill');
  });

  it('should toggle course fire status correctly', () => {
    const order = {
      id: 'order-1',
      status: 'new',
      isFired: false,
      items: [
        { id: 'i1', name: 'Steak', quantity: 1, course: 'Main', isFired: false, status: 'pending' },
        { id: 'i2', name: 'Soup', quantity: 1, course: 'Appetizer', isFired: false, status: 'pending' }
      ]
    } as any;

    useKdsStore.getState().setOrders([order]);

    // Toggle whole order fire
    useKdsStore.getState().toggleCourseFire('order-1');
    expect(useKdsStore.getState().orders[0].isFired).toBe(true);
    expect(useKdsStore.getState().orders[0].items[0].isFired).toBe(true);

    // Toggle specific course
    useKdsStore.getState().toggleCourseFire('order-1', 'Appetizer');
    expect(useKdsStore.getState().orders[0].items[1].isFired).toBe(false);
  });

  it('should calculate aggregated item prep summary correctly', () => {
    const order1 = {
      id: 'o1',
      status: 'new',
      station: 'grill',
      items: [
        { id: 'i1', name: 'Beef Burger', quantity: 2, status: 'pending' },
        { id: 'i2', name: 'Fries', quantity: 1, status: 'cooking' }
      ]
    } as any;

    const order2 = {
      id: 'o2',
      status: 'in_progress',
      station: 'grill',
      items: [
        { id: 'i3', name: 'Beef Burger', quantity: 3, status: 'cooking' },
        { id: 'i4', name: 'Fries', quantity: 2, status: 'pending' }
      ]
    } as any;

    const completedOrder = {
      id: 'o3',
      status: 'done',
      station: 'grill',
      items: [
        { id: 'i5', name: 'Beef Burger', quantity: 5, status: 'ready' }
      ]
    } as any;

    useKdsStore.getState().setOrders([order1, order2, completedOrder]);

    const summary = useKdsStore.getState().getAggregatedPrepItems('grill');
    expect(summary).toHaveLength(2);

    const burgerSummary = summary.find(s => s.name === 'Beef Burger');
    expect(burgerSummary).toBeDefined();
    expect(burgerSummary?.totalQuantity).toBe(5);
    expect(burgerSummary?.pendingCount).toBe(2);
    expect(burgerSummary?.cookingCount).toBe(3);

    const friesSummary = summary.find(s => s.name === 'Fries');
    expect(friesSummary?.totalQuantity).toBe(3);
  });
});
