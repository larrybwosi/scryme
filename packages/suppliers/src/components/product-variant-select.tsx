'use client';

import { Check, ChevronsUpDown, Loader2, Package } from 'lucide-react';
import { FC, useMemo, useState } from 'react';
import { cn } from '../lib/utils';
import { Button } from '@repo/ui/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/components/ui/popover';

interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  productType: string;
  retailPrice: number;
  wholesalePrice: number;
}

interface ProductVariantsSelectProps {
  value?: string;
  onValueChange?: (variantId: string, variant?: ProductVariant) => void;
  placeholder?: string;
  productType?: string | 'ALL';
  includeLocation?: boolean;
  showLocationInfo?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export const ProductVariantsSelect: FC<ProductVariantsSelectProps> = ({
  value,
  onValueChange,
  placeholder = 'Search products...',
  disabled = false,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const variants: any[] = [];
  const isLoading = false;

  const selectedVariant = useMemo(() =>
    variants.find(v => v.id === value),
    [value, variants]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isLoading}
          className={cn('w-full justify-between font-normal', className)}
        >
          {selectedVariant ? (
            <div className="flex items-center gap-2 truncate">
              <Package className="h-4 w-4 shrink-0 opacity-50" />
              <span>{selectedVariant.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          {isLoading ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search by name or SKU..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? 'Searching...' : 'No products found.'}
            </CommandEmpty>
            <CommandGroup>
              {variants.map((variant) => (
                <CommandItem
                  key={variant.id}
                  value={variant.id}
                  onSelect={() => {
                    onValueChange?.(variant.id, variant);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === variant.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{variant.name}</span>
                    <span className="text-xs text-muted-foreground">SKU: {variant.sku}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
