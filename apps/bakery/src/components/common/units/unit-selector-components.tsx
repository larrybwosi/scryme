/**
 * Reusable Unit Selector Components with Search
 * Using shadcn/ui components and Tailwind CSS
 */

"use client";

import * as React from "react";
import { useState, useMemo, useCallback } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";

// ============================================================================
// TYPES
// ============================================================================

export type UnitType =
  | "MASS"
  | "VOLUME"
  | "LENGTH"
  | "AREA"
  | "COUNT"
  | "TIME"
  | "TEMPERATURE"
  | "ENERGY"
  | "CUSTOM";

export type IndustryCategory =
  | "UNIVERSAL"
  | "FOOD_SERVICE"
  | "RETAIL"
  | "MANUFACTURING"
  | "HEALTHCARE"
  | "CONSTRUCTION"
  | "AGRICULTURE"
  | "HOSPITALITY"
  | "OTHER";

export interface BaseUnit {
  id: string;
  name: string;
  symbol: string;
  abbreviation?: string | null;
  type: UnitType;
  category?: IndustryCategory;
  isActive: boolean;
  description?: string | null;
}

export interface SystemUnit extends BaseUnit {
  isBaseUnit: boolean;
  isMetric: boolean;
}

export interface OrganizationUnit extends BaseUnit {
  organizationId: string;
  baseSystemUnitId?: string | null;
}

export type AnyUnit = SystemUnit | OrganizationUnit;

// ============================================================================
// BASIC UNIT SELECTOR (Combobox with Search)
// ============================================================================

interface UnitSelectorProps {
  units: AnyUnit[];
  value?: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  filterByType?: UnitType | UnitType[];
  filterByCategory?: IndustryCategory | IndustryCategory[];
  showBadges?: boolean;
}

export function UnitSelector({
  units,
  value,
  onValueChange,
  placeholder = "Select unit...",
  emptyText = "No unit found.",
  disabled = false,
  className,
  filterByType,
  filterByCategory,
  showBadges = true,
}: UnitSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Filter units based on criteria
  const filteredUnits = useMemo(() => {
    let filtered = units.filter((u) => u.isActive);

    // Filter by type
    if (filterByType) {
      const types = Array.isArray(filterByType) ? filterByType : [filterByType];
      filtered = filtered.filter((u) => types.includes(u.type));
    }

    // Filter by category
    if (filterByCategory) {
      const categories = Array.isArray(filterByCategory)
        ? filterByCategory
        : [filterByCategory];
      filtered = filtered.filter(
        (u) => u.category && categories.includes(u.category),
      );
    }

    return filtered;
  }, [units, filterByType, filterByCategory]);

  // Get selected unit
  const selectedUnit = useMemo(
    () => filteredUnits.find((u) => u.id === value),
    [filteredUnits, value],
  );

  // Group units by type
  const groupedUnits = useMemo(() => {
    const groups: Record<string, AnyUnit[]> = {};

    filteredUnits.forEach((unit) => {
      if (!groups[unit.type]) {
        groups[unit.type] = [];
      }
      groups[unit.type].push(unit);
    });

    return groups;
  }, [filteredUnits]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <span className="flex items-center gap-2 truncate">
            {selectedUnit ? (
              <>
                <span className="font-medium">{selectedUnit.symbol}</span>
                <span className="text-muted-foreground truncate">
                  {selectedUnit.name}
                </span>
                {showBadges && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedUnit.type}
                  </Badge>
                )}
              </>
            ) : (
              placeholder
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-100 p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search units..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            {Object.entries(groupedUnits).map(([type, typeUnits]) => (
              <CommandGroup key={type} heading={type}>
                {typeUnits.map((unit) => (
                  <CommandItem
                    key={unit.id}
                    value={`${unit.name} ${unit.symbol}`}
                    onSelect={() => {
                      onValueChange(unit.id === value ? null : unit.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === unit.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <span className="font-medium">{unit.symbol}</span>
                      <span className="text-muted-foreground">{unit.name}</span>
                      {showBadges && "isMetric" in unit && (
                        <Badge
                          variant={unit.isMetric ? "default" : "outline"}
                          className="text-xs"
                        >
                          {unit.isMetric ? "Metric" : "Imperial"}
                        </Badge>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// DUAL UNIT SELECTOR (Select Two Units for Conversion)
// ============================================================================

interface DualUnitSelectorProps {
  units: AnyUnit[];
  fromValue?: string | null;
  toValue?: string | null;
  onFromChange: (value: string | null) => void;
  onToChange: (value: string | null) => void;
  filterByType?: UnitType | UnitType[];
  disabled?: boolean;
  className?: string;
}

export function DualUnitSelector({
  units,
  fromValue,
  toValue,
  onFromChange,
  onToChange,
  filterByType,
  disabled = false,
  className,
}: DualUnitSelectorProps) {
  const handleSwap = useCallback(() => {
    const tempFrom = fromValue;
    onFromChange(toValue ?? null);
    onToChange(tempFrom ?? null);
  }, [fromValue, toValue, onFromChange, onToChange]);

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <Label className="text-sm font-medium mb-2 block">From Unit</Label>
        <UnitSelector
          units={units}
          value={(fromValue ?? null) as any}
          onValueChange={onFromChange}
          placeholder="Select source unit..."
          filterByType={filterByType}
          disabled={disabled}
        />
      </div>

      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleSwap}
          disabled={disabled || !fromValue || !toValue}
          className="rounded-full"
        >
          <ChevronsUpDown className="h-4 w-4" />
        </Button>
      </div>

      <div>
        <Label className="text-sm font-medium mb-2 block">To Unit</Label>
        <UnitSelector
          units={units}
          value={toValue ?? null}
          onValueChange={onToChange}
          placeholder="Select target unit..."
          filterByType={filterByType}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

// ============================================================================
// MULTI UNIT SELECTOR (Select Multiple Units)
// ============================================================================

interface MultiUnitSelectorProps {
  units: AnyUnit[];
  values: string[];
  onValuesChange: (values: string[]) => void;
  placeholder?: string;
  maxSelections?: number;
  filterByType?: UnitType | UnitType[];
  disabled?: boolean;
  className?: string;
}

export function MultiUnitSelector({
  units,
  values = [],
  onValuesChange,
  placeholder = "Select units...",
  maxSelections,
  filterByType,
  disabled = false,
  className,
}: MultiUnitSelectorProps) {
  const [open, setOpen] = useState(false);

  const filteredUnits = useMemo(() => {
    let filtered = units.filter((u) => u.isActive);
    if (filterByType) {
      const types = Array.isArray(filterByType) ? filterByType : [filterByType];
      filtered = filtered.filter((u) => types.includes(u.type));
    }
    return filtered;
  }, [units, filterByType]);

  const selectedUnits = useMemo(
    () => filteredUnits.filter((u) => values.includes(u.id)),
    [filteredUnits, values],
  );

  const handleSelect = useCallback(
    (unitId: string) => {
      const newValues = values.includes(unitId)
        ? values.filter((id) => id !== unitId)
        : maxSelections && values.length >= maxSelections
          ? values
          : [...values, unitId];

      onValuesChange(newValues);
    },
    [values, onValuesChange, maxSelections],
  );

  const handleRemove = useCallback(
    (unitId: string) => {
      onValuesChange(values.filter((id) => id !== unitId));
    },
    [values, onValuesChange],
  );

  const groupedUnits = useMemo(() => {
    const groups: Record<string, AnyUnit[]> = {};
    filteredUnits.forEach((unit) => {
      if (!groups[unit.type]) groups[unit.type] = [];
      groups[unit.type].push(unit);
    });
    return groups;
  }, [filteredUnits]);

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between"
          >
            <span className="truncate">
              {values.length === 0
                ? placeholder
                : `${values.length} unit${values.length > 1 ? "s" : ""} selected`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-100 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search units..." />
            <CommandList>
              <CommandEmpty>No units found.</CommandEmpty>
              {Object.entries(groupedUnits).map(([type, typeUnits]) => (
                <CommandGroup key={type} heading={type}>
                  {typeUnits.map((unit) => {
                    const isSelected = values.includes(unit.id);
                    const isDisabled =
                      !isSelected &&
                      maxSelections !== undefined &&
                      values.length >= maxSelections;

                    return (
                      <CommandItem
                        key={unit.id}
                        value={`${unit.name} ${unit.symbol}`}
                        onSelect={() => !isDisabled && handleSelect(unit.id)}
                        disabled={isDisabled}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            isSelected ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <span className="font-medium">{unit.symbol}</span>
                          <span className="text-muted-foreground">
                            {unit.name}
                          </span>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedUnits.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedUnits.map((unit) => (
            <Badge
              key={unit.id}
              variant="secondary"
              className="pl-2 pr-1 py-1 gap-1"
            >
              <span className="font-medium">{unit.symbol}</span>
              <span className="text-muted-foreground">{unit.name}</span>
              <button
                type="button"
                onClick={() => handleRemove(unit.id)}
                disabled={disabled}
                className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {maxSelections && (
        <p className="text-xs text-muted-foreground">
          {values.length} / {maxSelections} units selected
        </p>
      )}
    </div>
  );
}

// ============================================================================
// UNIT TYPE FILTER SELECTOR
// ============================================================================

interface UnitTypeFilterProps {
  value: UnitType | null;
  onValueChange: (value: UnitType | null) => void;
  placeholder?: string;
  className?: string;
}

export function UnitTypeFilter({
  value,
  onValueChange,
  placeholder = "All types",
  className,
}: UnitTypeFilterProps) {
  const unitTypes: UnitType[] = [
    "MASS",
    "VOLUME",
    "LENGTH",
    "AREA",
    "COUNT",
    "TIME",
    "TEMPERATURE",
    "ENERGY",
    "CUSTOM",
  ];

  return (
    <Select
      value={value || undefined}
      onValueChange={(v) => onValueChange(v as UnitType)}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__" onClick={() => onValueChange(null)}>
          All Types
        </SelectItem>
        {unitTypes.map((type) => (
          <SelectItem key={type} value={type}>
            {type}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ============================================================================
// INLINE UNIT SELECTOR (Compact for Forms)
// ============================================================================

interface InlineUnitSelectorProps {
  units: AnyUnit[];
  value?: string | null;
  onValueChange: (value: string | null) => void;
  filterByType?: UnitType | UnitType[];
  disabled?: boolean;
  className?: string;
}

export function InlineUnitSelector({
  units,
  value,
  onValueChange,
  filterByType,
  disabled = false,
  className,
}: InlineUnitSelectorProps) {
  const filteredUnits = useMemo(() => {
    let filtered = units.filter((u) => u.isActive);
    if (filterByType) {
      const types = Array.isArray(filterByType) ? filterByType : [filterByType];
      filtered = filtered.filter((u) => types.includes(u.type));
    }
    return filtered;
  }, [units, filterByType]);

  return (
    <Select
      value={value || undefined}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder="Unit">
          {value && (
            <span className="font-medium">
              {filteredUnits.find((u) => u.id === value)?.symbol}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {filteredUnits.map((unit) => (
          <SelectItem key={unit.id} value={unit.id}>
            <div className="flex items-center gap-2">
              <span className="font-medium">{unit.symbol}</span>
              <span className="text-muted-foreground">{unit.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
