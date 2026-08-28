'use client';

import React, { useEffect, useState, use } from 'react';
import { scrymeClient } from '@/lib/scryme';
import { useCart } from '@/providers/cart-provider';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addItem } = useCart();

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await scrymeClient.catalog.getProduct(id);
        if (res && res.data) {
          setProduct({
            id: res.data.id || id,
            name: res.data.name,
            description: res.data.description,
            price: Number(res.data.price || res.data.unitPrice || 0),
            imageUrl: res.data.imageUrl || res.data.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60',
          });
        }
      } catch (err) {
        // Fallback for demonstration
        setProduct({
          id,
          name: `Sample Product ${id}`,
          description: 'This is a high quality product integrated seamlessly with the Scryme V3 platform.',
          price: 99.99,
          imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60',
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadProduct();
  }, [id]);

  if (isLoading) {
    return <div className="p-8 text-center">Loading product details...</div>;
  }

  if (!product) {
    return <div className="p-8 text-center">Product not found.</div>;
  }

  return (
    <div className="space-y-6">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back to Products
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8">
        <div>
          <img src={product.imageUrl} alt={product.name} className="w-full h-80 sm:h-96 object-cover rounded-xl" />
        </div>

        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{product.name}</h1>
            <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">${product.price.toFixed(2)}</p>
            <p className="text-zinc-600 dark:text-zinc-300">{product.description}</p>
          </div>

          <button
            onClick={() => addItem(product)}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold shadow-md transition"
          >
            <ShoppingCart className="w-5 h-5" />
            Add to Shopping Cart
          </button>
        </div>
      </div>
    </div>
  );
}
