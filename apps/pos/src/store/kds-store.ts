import { createWithEqualityFn as create } from 'zustand/traditional';

export type OrderStatus = "new" | "in_progress" | "done" | "urgent" | "voided";
export type OrderType = "dine" | "takeout" | "delivery" | "drive";
export type ItemStatus = "pending" | "cooking" | "ready";
export type Station = "all" | "hot" | "cold" | "grill" | "dessert" | "bar";

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  modifiers: string;
  isAllergy: boolean;
  status: ItemStatus;
  course?: string; // e.g. "Appetizer", "Main", "Dessert"
  isFired?: boolean;
}

export interface KdsOrder {
  id: string;
  num: string;
  type: OrderType;
  station: Exclude<Station, "all">;
  table: string;
  status: OrderStatus;
  createdAt: number;
  bumpedAt?: number;
  items: OrderItem[];
  note: string | null;
  server: string;
  covers: number | null;
  isFired?: boolean;
}

export type ConnectionStatus = "connected" | "disconnected" | "connecting" | "error";

export interface AggregatedItemSummary {
  name: string;
  totalQuantity: number;
  pendingCount: number;
  cookingCount: number;
  readyCount: number;
}

interface KdsStore {
  orders: KdsOrder[];
  connectionStatus: ConnectionStatus;
  assignedStation: Station;
  addOrder: (order: KdsOrder) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateItemStatus: (orderId: string, itemId: string, status: ItemStatus) => void;
  toggleCourseFire: (orderId: string, courseName?: string) => void;
  bumpOrder: (orderId: string) => void;
  recallOrder: (orderId: string) => void;
  setOrders: (orders: KdsOrder[]) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setAssignedStation: (station: Station) => void;
  getAggregatedPrepItems: (filterStation?: Station) => AggregatedItemSummary[];
}

export const useKdsStore = create<KdsStore>((set, get) => ({
  orders: [],
  connectionStatus: 'disconnected',
  assignedStation: (localStorage.getItem('KDS_STATION') as Station) || 'all',

  addOrder: (order) => set((state) => {
    // Prevent duplicates
    if (state.orders.find(o => o.id === order.id)) return state;
    return { orders: [...state.orders, order] };
  }),

  updateOrderStatus: (orderId, status) => set((state) => ({
    orders: state.orders.map(o => o.id === orderId ? { ...o, status } : o)
  })),

  updateItemStatus: (orderId, itemId, status) => set((state) => ({
    orders: state.orders.map(o => o.id === orderId ? {
      ...o,
      items: o.items.map(i => i.id === itemId ? { ...i, status } : i)
    } : o)
  })),

  toggleCourseFire: (orderId, courseName) => set((state) => ({
    orders: state.orders.map(o => {
      if (o.id !== orderId) return o;
      if (!courseName) {
        const nextFired = !o.isFired;
        return {
          ...o,
          isFired: nextFired,
          items: o.items.map(i => ({ ...i, isFired: nextFired }))
        };
      }
      return {
        ...o,
        items: o.items.map(i => i.course === courseName ? { ...i, isFired: !i.isFired } : i)
      };
    })
  })),

  bumpOrder: (orderId) => set((state) => ({
    orders: state.orders.map(o => o.id === orderId ? { ...o, status: 'done', bumpedAt: Date.now() } : o)
  })),

  recallOrder: (orderId) => set((state) => ({
    orders: state.orders.map(o => o.id === orderId ? { ...o, status: 'in_progress', bumpedAt: undefined } : o)
  })),

  setOrders: (orders) => set({ orders }),

  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  setAssignedStation: (station) => {
    localStorage.setItem('KDS_STATION', station);
    set({ assignedStation: station });
  },

  getAggregatedPrepItems: (filterStation = 'all') => {
    const { orders } = get();
    const map = new Map<string, AggregatedItemSummary>();

    const activeOrders = orders.filter(o => o.status === 'new' || o.status === 'in_progress' || o.status === 'urgent');

    for (const order of activeOrders) {
      if (filterStation !== 'all' && order.station !== filterStation) continue;

      for (const item of order.items) {
        if (item.status === 'ready') continue; // only items being prepared or pending

        const key = item.name.trim();
        const existing = map.get(key) || {
          name: key,
          totalQuantity: 0,
          pendingCount: 0,
          cookingCount: 0,
          readyCount: 0,
        };

        existing.totalQuantity += item.quantity;
        if (item.status === 'pending') existing.pendingCount += item.quantity;
        if (item.status === 'cooking') existing.cookingCount += item.quantity;

        map.set(key, existing);
      }
    }

    return Array.from(map.values()).sort((a, b) => b.totalQuantity - a.totalQuantity);
  },
}));
