"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
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

interface ProductVariant {
  id: string;
  name: string;
  sku?: string;
  productName: string;
  stock?: number;
}

export interface ProductVariantSelectProps {
  variants: ProductVariant[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
  allowZeroStock?: boolean;
}

export function ProductVariantSelect({
  variants,
  value,
  onValueChange,
  placeholder = "Select variant...",
  className,
  error,
  allowZeroStock = false,
}: ProductVariantSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedVariant = variants.find(v => v.id === value);

  const formatLabel = (variant: ProductVariant) => {
    if (variant.name === "Default" || variant.name === "" || !variant.name) {
      return variant.productName;
    }
    return `${variant.productName} - ${variant.name}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-white",
            error && "border-red-500",
            className,
          )}>
          <span className="truncate">
            {selectedVariant ? formatLabel(selectedVariant) : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
        align="start">
        <Command>
          <CommandInput placeholder="Search product or variant..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {variants.map(variant => (
                <CommandItem
                  key={variant.id}
                  value={
                    variant.productName +
                    " " +
                    variant.name +
                    " " +
                    (variant.sku || "") +
                    " " +
                    variant.id
                  }
                  onSelect={() => {
                    if (allowZeroStock || (variant.stock ?? 0) > 0) {
                      onValueChange(variant.id === value ? "" : variant.id);
                      setOpen(false);
                    }
                  }}
                  disabled={!allowZeroStock && (variant.stock ?? 0) <= 0}
                  className={cn(
                    !allowZeroStock && (variant.stock ?? 0) <= 0 &&
                      "opacity-50 cursor-not-allowed",
                  )}>
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === variant.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="flex flex-col flex-1">
                    <div className="flex justify-between items-center w-full">
                      <span className="font-medium">
                        {formatLabel(variant)}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full font-semibold",
                          (variant.stock ?? 0) > 0
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : "bg-red-50 text-red-600 border border-red-100",
                        )}>
                        {variant.stock ?? 0} available
                      </span>
                    </div>
                    {variant.sku && (
                      <span className="text-xs text-muted-foreground">
                        {variant.sku}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
