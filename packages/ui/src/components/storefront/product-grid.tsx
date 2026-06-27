import React from "react";
import { ProductCard } from "./product-card";
import { cn } from "../../lib/utils";

interface ProductGridProps {
  products: any[];
  onAddToCart?: (product: any) => void;
  loading?: boolean;
  className?: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onAddToCart,
  loading,
  className,
}) => {
  if (loading) {
    return (
      <div
        className={cn(
          "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
          className,
        )}
      >
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg border bg-card p-4">
            <div className="aspect-square rounded-md bg-muted" />
            <div className="mt-4 h-4 w-3/4 rounded bg-muted" />
            <div className="mt-2 h-4 w-1/2 rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
};
