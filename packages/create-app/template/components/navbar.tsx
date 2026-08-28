'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, User, ShoppingCart, X } from 'lucide-react';
import { useCart } from '@/providers/cart-provider';
import { useCustomerAuth } from '@/providers/customer-auth-provider';

export const Navbar: React.FC = () => {
  const { totalItems, items, subtotal, removeItem, updateQuantity } = useCart();
  const { user, logout } = useCustomerAuth();
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-white">
            <ShoppingBag className="w-6 h-6 text-indigo-600" />
            <span>ScrymeStore</span>
          </Link>

          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm font-medium hover:text-indigo-600 transition">
              Products
            </Link>
            <Link href="/account" className="text-sm font-medium hover:text-indigo-600 transition flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{user ? user.firstName || 'Account' : 'Login'}</span>
            </Link>
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-zinc-700 dark:text-zinc-200 hover:text-indigo-600 transition"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Slide-over Cart */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 h-full shadow-2xl flex flex-col p-6">
            <div className="flex items-center justify-between border-b pb-4 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Your Cart ({totalItems})</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-zinc-500 hover:text-zinc-800 dark:hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {items.length === 0 ? (
                <p className="text-center text-zinc-500 py-10">Your cart is empty.</p>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b pb-3 dark:border-zinc-800">
                    <div>
                      <h4 className="font-medium text-zinc-900 dark:text-white">{item.name}</h4>
                      <p className="text-sm text-zinc-500">${item.price.toFixed(2)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-sm"
                        >
                          -
                        </button>
                        <span className="text-sm font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t pt-4 dark:border-zinc-800 space-y-4">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition"
                >
                  Proceed to Checkout
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
