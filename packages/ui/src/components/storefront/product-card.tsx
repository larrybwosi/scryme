import React from 'react';
import { cn } from '../../lib/utils';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description?: string;
    price: number;
    imageUrl?: string;
  };
  onAddToCart?: (product: any) => void;
  onClick?: () => void;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onClick, className }) => {
  return (
    <div
      className={cn("group relative flex flex-col overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow-md", className)}
      onClick={onClick}
    >
      <div className="aspect-square overflow-hidden bg-muted">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-semibold text-foreground">{product.name}</h3>
        {product.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-4">
          <span className="text-lg font-bold text-primary">
            ${product.price.toFixed(2)}
          </span>
          <button
            onClick={() => onAddToCart?.(product)}
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};
