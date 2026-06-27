import { createWithEqualityFn as create } from 'zustand/traditional';

export type OrderStatus = 'new' | 'in_progress' | 'done' | 'urgent' | 'voided';
export type OrderType = 'dine' | 'takeout' | 'delivery' | 'drive';
export type ItemStatus = 'pending' | 'cooking' | 'ready';
export type Station = 'all' | 'hot' | 'cold' | 'grill' | 'dessert' | 'bar';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  modifiers: string;
  isAllergy: boolean;
  status: ItemStatus;
}

export interface KdsOrder {
  id: string;
  num: string;
  type: OrderType;
  station: Exclude<Station, 'all'>;
  table: string;
  status: OrderStatus;
  createdAt: number;
  bumpedAt?: number;
  items: OrderItem[];
  note: string | null;
  server: string;
  covers: number | null;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

interface KdsStore {
  orders: KdsOrder[];
  connectionStatus: ConnectionStatus;
  addOrder: (order: KdsOrder) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateItemStatus: (orderId: string, itemId: string, status: ItemStatus) => void;
  bumpOrder: (orderId: string) => void;
  recallOrder: (orderId: string) => void;
  setOrders: (orders: KdsOrder[]) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
}

export const useKdsStore = create<KdsStore>(set => ({
  orders: [],
  connectionStatus: 'disconnected',
  addOrder: order =>
    set(state => {
      // Prevent duplicates
      if (state.orders.find(o => o.id === order.id)) return state;
      return { orders: [...state.orders, order] };
    }),
  updateOrderStatus: (orderId, status) =>
    set(state => ({
      orders: state.orders.map(o => (o.id === orderId ? { ...o, status } : o)),
    })),
  updateItemStatus: (orderId, itemId, status) =>
    set(state => ({
      orders: state.orders.map(o =>
        o.id === orderId
          ? {
              ...o,
              items: o.items.map(i => (i.id === itemId ? { ...i, status } : i)),
            }
          : o
      ),
    })),
  bumpOrder: orderId =>
    set(state => ({
      orders: state.orders.map(o => (o.id === orderId ? { ...o, status: 'done', bumpedAt: Date.now() } : o)),
    })),
  recallOrder: orderId =>
    set(state => ({
      orders: state.orders.map(o => (o.id === orderId ? { ...o, status: 'in_progress', bumpedAt: undefined } : o)),
    })),
  setOrders: orders => set({ orders }),
  setConnectionStatus: connectionStatus => set({ connectionStatus }),
}));
