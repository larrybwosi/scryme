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
});
