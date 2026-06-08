"use client";

import {
  Check,
  ChevronsUpDown,
  Loader2,
  Package,
  AlertCircle,
} from "lucide-react";
import { FC, useMemo, useState, useEffect } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@repo/ui/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/ui/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/ui/popover";
import { useProductVariants } from "@/lib/api/products";
import { ProductType } from "@/types/bakery-fix";

// --- Custom Debounce Hook ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// --- Types ---

interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  productType?: ProductType | string;
  retailPrice?: number | null;
  wholesalePrice?: number | null;
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
  productType?: ProductType | "ALL";
  includeLocation?: boolean;
  showLocationInfo?: boolean;
  excludeVariant?: string;
  excludeVariantIds?: string[];
}

// --- Component ---

export const ProductVariantsSelect: FC<ProductVariantsSelectProps> = ({
  value,
  onValueChange,
  placeholder = "Select a product variant...",
  disabled = false,
  productType = "FINISHED_GOOD",
  includeLocation = true,
  showLocationInfo = true,
  excludeVariant,
  excludeVariantIds = [],
}) => {
  const [open, setOpen] = useState(false);

  // --- Search State ---
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const {
    data: productVariants,
    isLoading,
    isFetching,
    error,
  } = useProductVariants({
    includeLocation,
    isActive: true,
    productType: (productType === "ALL" ? undefined : productType) as any,
    search: debouncedSearchTerm,
  }) as any;

  // Combine excluded variant IDs
  const allExcludedIds = useMemo(
    () => [...(excludeVariant ? [excludeVariant] : []), ...excludeVariantIds],
    [excludeVariant, excludeVariantIds],
  );

  // Filter out excluded variants
  const filteredVariants = useMemo(() => {
    if (!productVariants) return [];
    return allExcludedIds.length > 0
      ? productVariants.filter(
          (variant: any) => !allExcludedIds.includes(variant.id),
        )
      : productVariants;
  }, [productVariants, allExcludedIds]);

  // Find the currently selected variant object for display
  const selectedVariant = useMemo(() => {
    return filteredVariants.find((v: any) => v.id === value);
  }, [filteredVariants, value]);

  // Group variants by product type if type is 'ALL'
  const groupedVariants = useMemo(() => {
    if (productType !== "ALL") return null;

    return filteredVariants.reduce(
      (acc: any, variant: any) => {
        const type = variant.productType as ProductType;
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(variant);
        return acc;
      },
      {} as Record<ProductType, ProductVariant[]>,
    );
  }, [filteredVariants, productType]);

  // Helper function to format location info
  const formatLocationInfo = (variant: ProductVariant): string => {
    if (!variant.location) return "No location";

    const location = variant.location;
    if (location.address) {
      const { city, state, country } = location.address;
      const parts = [city, state, country].filter(Boolean);
      return parts.length > 0 ? parts.join(", ") : location.name;
    }
    return location.name;
  };

  // --- Initial Loading State ---
  if (isLoading && !productVariants?.length) {
    return (
      <Button
        variant="outline"
        disabled
        className="w-full justify-between cursor-not-allowed opacity-70"
      >
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
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {variant.sku}
            </span>
          </div>
          {value === variant.id && <Check className="h-4 w-4 text-primary" />}
        </div>
        {showLocationInfo && variant.location && (
          <span className="text-xs text-muted-foreground mt-1 truncate">
            Location: {formatLocationInfo(variant)}
          </span>
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
            "w-full justify-between bg-background hover:bg-accent hover:text-accent-foreground h-auto min-h-[40px] py-2",
            !value && "text-muted-foreground",
          )}
        >
          {selectedVariant ? (
            <div className="flex flex-col items-start text-left">
              <span className="flex items-center gap-2 font-medium">
                <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
                {selectedVariant.name}
              </span>
              <span className="text-xs text-muted-foreground ml-6">
                SKU: {selectedVariant.sku}
              </span>
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
              onValueChange={setSearchTerm}
            />
            {isFetching && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-2" />
            )}
          </div>
          <CommandList>
            <CommandEmpty>
              {isFetching ? "Searching..." : "No product found."}
            </CommandEmpty>

            {productType === "ALL" && groupedVariants ? (
              Object.entries(groupedVariants).map(([type, variants]: any) => (
                <CommandGroup key={type} heading={type.replace("_", " ")}>
                  {variants?.map((variant: any) => (
                    <VariantItem key={variant.id} variant={variant} />
                  ))}
                </CommandGroup>
              ))
            ) : (
              <CommandGroup heading="Available Variants">
                {filteredVariants.map((variant: any) => (
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
