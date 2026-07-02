'use client';

import { Check, ChevronsUpDown, Loader2, Package, AlertCircle } from 'lucide-react';
import { FC, useMemo, useState } from 'react';

import { cn } from '.@repo/ui/components/ui/lib/utils';
import { Button } from '@repo/ui/components/ui/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/components/ui/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/components/ui/ui/popover';

// --- Types ---

type ProductType = 'FINISHED_GOOD' | 'RAW_MATERIAL' | 'SERVICE' | 'ASSET';

interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  productType: ProductType;
  retailPrice: number;
  wholesalePrice: number;
  location?: {
    id: string;
    name: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      zipCode?: string;
    };
  };
}

interface ProductVariantsSelectProps {
  value?: string;
  onValueChange?: (variantId: string, variant?: ProductVariant) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  productType?: ProductType | 'ALL';
  includeLocation?: boolean;
  showLocationInfo?: boolean;
  excludeVariant?: string;
  excludeVariantIds?: string[];
  variants: ProductVariant[];
  isLoading?: boolean;
  isFetching?: boolean;
  error?: any;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
}

// --- Component ---

export const ProductVariantsSelect: FC<ProductVariantsSelectProps> = ({
  value,
  onValueChange,
  placeholder = 'Select a product variant...',
  disabled = false,
  productType = 'FINISHED_GOOD',
  showLocationInfo = true,
  excludeVariant,
  excludeVariantIds = [],
  variants,
  isLoading = false,
  isFetching = false,
  error,
  searchTerm = '',
  onSearchChange,
}) => {
  const [open, setOpen] = useState(false);

  // Combine excluded variant IDs
  const allExcludedIds = useMemo(
    () => [...(excludeVariant ? [excludeVariant] : []), ...excludeVariantIds],
    [excludeVariant, excludeVariantIds]
  );

  // Filter out excluded variants
  const filteredVariants = useMemo(() => {
    if (!variants) return [];
    return allExcludedIds.length > 0
      ? variants.filter(variant => !allExcludedIds.includes(variant.id))
      : variants;
  }, [variants, allExcludedIds]);

  // Find the currently selected variant object for display
  const selectedVariant = useMemo(() => {
    return filteredVariants.find(v => v.id === value);
  }, [filteredVariants, value]);

  // Group variants by product type if type is 'ALL'
  const groupedVariants = useMemo(() => {
    if (productType !== 'ALL') return null;

    return filteredVariants.reduce(
      (acc, variant) => {
        const type = variant.productType;
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(variant);
        return acc;
      },
      {} as Record<ProductType, ProductVariant[]>
    );
  }, [filteredVariants, productType]);

  // Helper function to format location info
  const formatLocationInfo = (variant: ProductVariant): string => {
    if (!variant.location) return 'No location';

    const location = variant.location;
    if (location.address) {
      const { city, state, country } = location.address;
      const parts = [city, state, country].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : location.name;
    }
    return location.name;
  };

  // --- Initial Loading State ---
  if (isLoading && !variants?.length) {
    return (
      <Button variant="outline" disabled className="w-full justify-between cursor-not-allowed opacity-70">
        <span className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading variants...
        </span>
        <ChevronsUpDown className="h-4 w-4 opacity-50" />
      </Button>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <Button
        variant="destructive"
        className="w-full justify-between border-destructive text-destructive hover:bg-destructive/10"
      >
        <span className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Error loading products
        </span>
      </Button>
    );
  }

  // --- Helper Component for Items ---
  const VariantItem = ({ variant }: { variant: ProductVariant }) => (
    <CommandItem
      key={variant.id}
      value={variant.id}
      onSelect={() => {
        onValueChange?.(variant.id, variant);
        setOpen(false);
      }}
      className="cursor-pointer"
    >
      <div className="flex flex-col w-full">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{variant.name}</span>
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{variant.sku}</span>
          </div>
          {value === variant.id && <Check className="h-4 w-4 text-primary" />}
        </div>
        {showLocationInfo && variant.location && (
          <span className="text-xs text-muted-foreground mt-1 truncate">Location: {formatLocationInfo(variant)}</span>
        )}
      </div>
    </CommandItem>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between bg-background hover:bg-accent hover:text-accent-foreground h-auto min-h-[40px] py-2',
            !value && 'text-muted-foreground'
          )}
        >
          {selectedVariant ? (
            <div className="flex flex-col items-start text-left">
              <span className="flex items-center gap-2 font-medium">
                <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
                {selectedVariant.name}
              </span>
              <span className="text-xs text-muted-foreground ml-6">SKU: {selectedVariant.sku}</span>
            </div>
          ) : (
            <span className="flex items-center gap-2">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <CommandInput
              placeholder="Search by name, SKU, or location..."
              className="h-9 flex-1"
              value={searchTerm}
              onValueChange={onSearchChange}
            />
            {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-2" />}
          </div>
          <CommandList>
            <CommandEmpty>{isFetching ? 'Searching...' : 'No product found.'}</CommandEmpty>

            {productType === 'ALL' && groupedVariants ? (
              Object.entries(groupedVariants).map(([type, typeVariants]) => (
                <CommandGroup key={type} heading={type.replace('_', ' ')}>
                  {(typeVariants as ProductVariant[])?.map(variant => (
                    <VariantItem key={variant.id} variant={variant} />
                  ))}
                </CommandGroup>
              ))
            ) : (
              <CommandGroup heading="Available Variants">
                {filteredVariants.map(variant => (
                  <VariantItem key={variant.id} variant={variant} />
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
