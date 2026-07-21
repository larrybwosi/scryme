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

interface Product {
  id: string;
  name: string;
  sku?: string;
}

export interface ProductSelectProps {
  products: Product[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

export function ProductSelect({
  products,
  value,
  onValueChange,
  placeholder = "Select product...",
  className,
  error,
}: ProductSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedProduct = products.find(p => p.id === value);

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
            {selectedProduct ? selectedProduct.name : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
        align="start">
        <Command>
          <CommandInput placeholder="Search product..." />
          <CommandList>
            <CommandEmpty>No product found.</CommandEmpty>
            <CommandGroup>
              {products.map(product => (
                <CommandItem
                  key={product.id}
                  value={
                    product.name + " " + (product.sku || "") + " " + product.id
                  }
                  onSelect={() => {
                    onValueChange(product.id === value ? "" : product.id);
                    setOpen(false);
                  }}>
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === product.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{product.name}</span>
                    {product.sku && (
                      <span className="text-xs text-muted-foreground">
                        {product.sku}
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
