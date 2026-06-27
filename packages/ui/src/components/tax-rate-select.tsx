"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Skeleton } from "./ui/skeleton";

interface TaxRate {
  id: string;
  name: string;
  rate: number;
}

interface TaxRateSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  taxRates: TaxRate[];
  isLoading?: boolean;
}

export function TaxRateSelect({
  value,
  onValueChange,
  placeholder = "Select tax rate",
  disabled,
  taxRates,
  isLoading = false,
}: TaxRateSelectProps) {
  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="w-full bg-background border-input text-foreground">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-background border-border text-foreground">
        <SelectItem value="none">No Tax (0%)</SelectItem>
        {taxRates.map((rate) => (
          <SelectItem key={rate.id} value={rate.id}>
            {rate.name} ({(Number(rate.rate) * 100).toFixed(1)}%)
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
