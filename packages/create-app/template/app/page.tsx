'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { scrymeClient } from '@/lib/scryme';
import { useCart } from '@/providers/cart-provider';
import { ShoppingCart } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addItem } = useCart();

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await scrymeClient.catalog.getProducts();
        if (res && res.data) {
          const formatted = (res.data as any[]).map((p) => ({
            id: p.id || p._id,
            name: p.name,
            description: p.description,
            price: Number(p.price || p.unitPrice || 0),
            imageUrl: p.imageUrl || p.images?.[0] || 'https://via.placeholder.com/300x300?text=Product',
          }));
          setProducts(formatted);
        }
      } catch (err) {
        console.warn('Falling back to sample products:', err);
        // Fallback sample data for starter project preview
        setProducts([
          {
            id: 'sample-1',
            name: 'Minimalist Wireless Headphones',
            description: 'High-fidelity audio with seamless Scryme order integration.',
            price: 129.99,
            imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60',
          },
          {
            id: 'sample-2',
            name: 'Smart Ceramic Coffee Mug',
            description: 'Temperature-controlled mug for your daily workspace routine.',
            price: 79.50,
            imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60',
          },
          {
            id: 'sample-3',
            name: 'Ergonomic Mechanical Keyboard',
            description: 'Custom switch mechanical keyboard engineered for performance.',
            price: 159.00,
            imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60',
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    }

    loadProducts();
  }, []);

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-8 sm:p-12 shadow-xl">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
          Welcome to Your Scryme Store
        </h1>
        <p className="mt-4 text-lg text-indigo-100 max-w-2xl">
          Instantly connect your store products, customer authentication, cart, and checkout with `@scryme/sdk`.
        </p>
      </div>

      <section>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">
          Featured Catalog
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-5">
                    <Link href={`/products/${product.id}`} className="hover:underline">
                      <h3 className="font-semibold text-lg text-zinc-900 dark:text-white">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-zinc-500 mt-2 line-clamp-2">
                      {product.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                <div className="p-5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-xl font-bold text-zinc-900 dark:text-white">
                    ${product.price.toFixed(2)}
                  </span>
                  <button
                    onClick={() => addItem(product)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
