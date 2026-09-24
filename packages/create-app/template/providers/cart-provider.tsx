'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { scrymeClient } from '@/lib/scryme';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  variantId?: string;
  serviceId?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  syncWithSdk: () => Promise<void>;
  totalItems: number;
  subtotal: number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = 'scryme_cart_items';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to parse stored cart:', e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isInitialized]);

  const syncWithSdk = async () => {
    try {
      setIsLoading(true);
      const res = await scrymeClient.cart.getCart();
      if (res && (res as any).data && Array.isArray((res as any).data.items)) {
        const sdkItems = (res as any).data.items.map((i: any) => ({
          id: i.id || i.productId || i.variantId,
          name: i.name || i.productName || 'Item',
          price: Number(i.price || i.unitPrice || 0),
          quantity: Number(i.quantity || 1),
          imageUrl: i.imageUrl || i.image,
          variantId: i.variantId,
          serviceId: i.serviceId,
        }));
        setItems(sdkItems);
      }
    } catch (err) {
      console.warn('SDK Cart sync unavailable, using local cart state:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = async (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    const qty = item.quantity || 1;
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      return [...prev, { ...item, quantity: qty }];
    });

    try {
      await scrymeClient.cart.addItem({
        productId: item.id,
        variantId: item.variantId,
        serviceId: item.serviceId,
        quantity: qty,
      } as any);
    } catch (err) {
      // SDK call is secondary to keep client snappy
    }
  };

  const removeItem = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await scrymeClient.cart.removeItem({ itemId: id } as any);
    } catch (err) {
      // Fail gracefully for local cart state
    }
  };

  const updateQuantity = async (id: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity } : i))
    );
    try {
      await scrymeClient.cart.updateQuantity({ itemId: id, quantity } as any);
    } catch (err) {
      // Fail gracefully for local cart state
    }
  };

  const clearCart = async () => {
    setItems([]);
    try {
      await scrymeClient.cart.clearCart();
    } catch (err) {
      // Fail gracefully
    }
  };

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        syncWithSdk,
        totalItems,
        subtotal,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
