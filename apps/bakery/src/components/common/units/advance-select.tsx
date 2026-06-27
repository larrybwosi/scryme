"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  Check,
  ChevronsUpDown,
  Search,
  X,
  Layers,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@repo/ui/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/ui/popover";
import { Button } from "@repo/ui/components/ui/button";
import { ScrollArea } from "@repo/ui/components/ui/scroll-area";
import { OrganizationUnit, SystemUnit } from "./unit-selector-components";
import { UnitType } from "@/types/bakery-fix";
import { useUnits } from "@/lib/units/hooks";

interface AdvancedUnitSelectorProps {
  value?: string | undefined;
  onValueChange: (value: string | undefined, type: "system" | "org") => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  filterByType?: UnitType | UnitType[];
  allowCustom?: boolean;
}

export function AdvancedUnitSelector({
  value,
  onValueChange,
  placeholder = "Select unit...",
  disabled = false,
  className,
  filterByType,
  allowCustom = true,
}: AdvancedUnitSelectorProps) {
  const { orgUnits, systemUnits } = useUnits();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"system" | "org">("system");
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setSearchQuery("");
    }
  }, [open, tab]);

  const filteredSystemUnits = useMemo(() => {
    let filtered = systemUnits.filter((u) => u.isActive);
    if (filterByType) {
      const types = Array.isArray(filterByType) ? filterByType : [filterByType];
      filtered = filtered.filter((u) => types.includes(u.type as any));
    }
    return filtered;
  }, [systemUnits, filterByType]);

  const filteredOrgUnits = useMemo(() => {
    let filtered = orgUnits?.filter((u) => u.isActive) || [];
    if (filterByType) {
      const types = Array.isArray(filterByType) ? filterByType : [filterByType];
      filtered = filtered.filter((u) => types.includes(u.type as any));
    }
    return filtered;
  }, [orgUnits, filterByType]);

  const selectedUnit = useMemo(() => {
    if (!value) return undefined;
    return (
      [...filteredSystemUnits, ...filteredOrgUnits].find(
        (u) => u.id === value,
      ) || undefined
    );
  }, [filteredSystemUnits, filteredOrgUnits, value]);

  const selectedUnitSource = useMemo(() => {
    if (!value) return undefined;
    if (filteredSystemUnits.find((u) => u.id === value)) return "system";
    if (filteredOrgUnits.find((u) => u.id === value)) return "org";
    return undefined;
  }, [filteredSystemUnits, filteredOrgUnits, value]);

  const groupedSystemUnits = useMemo(() => {
    const groups: Record<string, SystemUnit[]> = {};
    filteredSystemUnits.forEach((unit) => {
      if (!groups[unit.type]) groups[unit.type] = [];
      groups[unit.type].push(unit);
    });
    return groups;
  }, [filteredSystemUnits]);

  const groupedOrgUnits = useMemo(() => {
    const groups: Record<string, OrganizationUnit[]> = {};
    filteredOrgUnits?.forEach((unit) => {
      if (!groups[unit.type]) groups[unit.type] = [];
      groups[unit.type].push(unit);
    });
    return groups;
  }, [filteredOrgUnits]);

  const handleTabChange = useCallback((newTab: "system" | "org") => {
    setTab(newTab);
    setSearchQuery("");
  }, []);

  const handleSelect = useCallback(
    (unitId: string, unitType: "system" | "org") => {
      onValueChange(unitId === value ? undefined : unitId, unitType);
      setOpen(false);
      setSearchQuery("");
    },
    [value, onValueChange],
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
            "group w-full justify-between h-10 px-3",
            "border border-border/60 bg-background/80 backdrop-blur-sm",
            "hover:bg-accent/30 hover:border-border",
            "focus-visible:ring-1 focus-visible:ring-ring/50",
            "transition-all duration-200",
            !selectedUnit && "text-muted-foreground",
            open && "border-border ring-1 ring-ring/20",
            className,
          )}
        >
          <span className="flex items-center gap-2.5 truncate min-w-0">
            {selectedUnit ? (
              <>
                <span className="inline-flex items-center justify-center h-6 w-8 rounded bg-primary/10 text-primary text-xs font-semibold font-mono shrink-0">
                  {selectedUnit.symbol}
                </span>
                <span className="text-foreground text-sm truncate">
                  {selectedUnit.name}
                </span>
                <span
                  className={cn(
                    "ml-auto shrink-0 inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                    selectedUnitSource === "system"
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                      : "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400",
                  )}
                >
                  {selectedUnitSource === "system" ? (
                    <Layers className="h-2.5 w-2.5" />
                  ) : (
                    <Building2 className="h-2.5 w-2.5" />
                  )}
                  {selectedUnitSource === "system" ? "System" : "Custom"}
                </span>
              </>
            ) : (
              <span className="text-sm">{placeholder}</span>
            )}
          </span>
          <ChevronsUpDown
            className={cn(
              "ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[460px] p-0 overflow-hidden border-border/60 shadow-xl shadow-black/5"
        align="start"
        sideOffset={6}
      >
        {/* Tab bar */}
        <div className="flex border-b border-border/50 bg-muted/20">
          <button
            type="button"
            onClick={() => handleTabChange("system")}
            className={cn(
              "relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium transition-all duration-200",
              tab === "system"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground/80",
            )}
          >
            <Layers className="h-3.5 w-3.5 shrink-0" />
            <span>System Units</span>
            <span
              className={cn(
                "inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10px] font-semibold tabular-nums transition-colors",
                tab === "system"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {filteredSystemUnits.length}
            </span>
            {tab === "system" && (
              <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-primary rounded-full" />
            )}
          </button>

          {allowCustom && (
            <button
              type="button"
              onClick={() => handleTabChange("org")}
              className={cn(
                "relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium transition-all duration-200",
                tab === "org"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground/80",
              )}
            >
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span>Custom Units</span>
              <span
                className={cn(
                  "inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10px] font-semibold tabular-nums transition-colors",
                  tab === "org"
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {filteredOrgUnits?.length || 0}
              </span>
              {tab === "org" && (
                <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-primary rounded-full" />
              )}
            </button>
          )}
        </div>

        {/* Search */}
        <div className="px-3 pt-2.5 pb-2 bg-background">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, symbol, or type…"
              className={cn(
                "w-full h-8 pl-8 pr-8 text-sm",
                "bg-muted/40 border border-border/40 rounded-md",
                "placeholder:text-muted-foreground/50",
                "focus:outline-none focus:ring-1 focus:ring-ring/40 focus:border-border/80 focus:bg-background",
                "transition-all duration-150",
              )}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  inputRef.current?.focus();
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <Command shouldFilter={false} className="border-none bg-transparent">
          <CommandList className="max-h-[280px]">
            {tab === "system" && (
              <>
                {filteredSystemUnits.length === 0 ? (
                  <EmptyState label="No system units found" />
                ) : (
                  <ScrollArea className="h-full max-h-[260px]">
                    <div className="p-1.5 space-y-0.5">
                      {Object.entries(groupedSystemUnits).map(
                        ([type, typeUnits]) => {
                          const filteredUnits = typeUnits.filter((unit) => {
                            if (!searchQuery) return true;
                            const query = searchQuery.toLowerCase();
                            return (
                              unit.name.toLowerCase().includes(query) ||
                              unit.symbol.toLowerCase().includes(query) ||
                              unit.type.toLowerCase().includes(query)
                            );
                          });
                          if (filteredUnits.length === 0) return null;
                          return (
                            <UnitGroup key={type} heading={type}>
                              {filteredUnits.map((unit) => (
                                <CommandItem
                                  key={unit.id}
                                  value={unit.id}
                                  onSelect={() =>
                                    handleSelect(unit.id, "system")
                                  }
                                  className={cn(
                                    "group/item relative flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm",
                                    "cursor-pointer transition-colors duration-100",
                                    "data-[selected=true]:bg-accent/60",
                                    value === unit.id && "bg-primary/5",
                                  )}
                                >
                                  <div
                                    className={cn(
                                      "flex items-center justify-center h-5 w-5 rounded shrink-0 transition-all duration-150",
                                      value === unit.id
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-transparent border border-border/40 group-data-[selected=true]/item:border-border",
                                    )}
                                  >
                                    {value === unit.id && (
                                      <Check className="h-3 w-3" />
                                    )}
                                  </div>
                                  <span className="font-mono text-xs font-semibold text-foreground/80 shrink-0 w-8">
                                    {unit.symbol}
                                  </span>
                                  <span className="text-foreground/90 truncate flex-1">
                                    {unit.name}
                                  </span>
                                  <span
                                    className={cn(
                                      "shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                                      unit.isMetric
                                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                                        : "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
                                    )}
                                  >
                                    {unit.isMetric ? "Metric" : "Imperial"}
                                  </span>
                                </CommandItem>
                              ))}
                            </UnitGroup>
                          );
                        },
                      )}
                    </div>
                  </ScrollArea>
                )}
              </>
            )}

            {tab === "org" && allowCustom && (
              <>
                {filteredOrgUnits?.length === 0 ? (
                  <EmptyState label="No custom units found" />
                ) : (
                  <ScrollArea className="h-full max-h-[260px]">
                    <div className="p-1.5">
                      {Object.entries(groupedOrgUnits).map(
                        ([type, typeUnits]) => {
                          const filteredUnits = typeUnits.filter((unit) => {
                            if (!searchQuery) return true;
                            const query = searchQuery.toLowerCase();
                            return (
                              unit.name.toLowerCase().includes(query) ||
                              unit.symbol.toLowerCase().includes(query) ||
                              unit.type.toLowerCase().includes(query) ||
                              (unit.description &&
                                unit.description.toLowerCase().includes(query))
                            );
                          });
                          if (filteredUnits.length === 0) return null;
                          return (
                            <UnitGroup key={type} heading={type}>
                              {filteredUnits.map((unit) => (
                                <CommandItem
                                  key={unit.id}
                                  value={unit.id}
                                  onSelect={() => handleSelect(unit.id, "org")}
                                  className={cn(
                                    "group/item relative flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm",
                                    "cursor-pointer transition-colors duration-100",
                                    "data-[selected=true]:bg-accent/60",
                                    value === unit.id && "bg-primary/5",
                                  )}
                                >
                                  <div
                                    className={cn(
                                      "flex items-center justify-center h-5 w-5 rounded shrink-0 transition-all duration-150",
                                      value === unit.id
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-transparent border border-border/40 group-data-[selected=true]/item:border-border",
                                    )}
                                  >
                                    {value === unit.id && (
                                      <Check className="h-3 w-3" />
                                    )}
                                  </div>
                                  <span className="font-mono text-xs font-semibold text-foreground/80 shrink-0 w-8">
                                    {unit.symbol}
                                  </span>
                                  <span className="text-foreground/90 truncate flex-1">
                                    {unit.name}
                                  </span>
                                  {unit.description && (
                                    <span className="text-[11px] text-muted-foreground/70 shrink-0 truncate max-w-[110px]">
                                      {unit.description}
                                    </span>
                                  )}
                                </CommandItem>
                              ))}
                            </UnitGroup>
                          );
                        },
                      )}
                    </div>
                  </ScrollArea>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/* ── small sub-components ── */

function UnitGroup({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <CommandGroup
      heading={heading}
      className={cn(
        "mb-1",
        "**:[[cmdk-group-heading]]:px-2.5",
        "**:[[cmdk-group-heading]]:pb-1",
        "**:[[cmdk-group-heading]]:pt-2",
        "**:[[cmdk-group-heading]]:text-[10px]",
        "**:[[cmdk-group-heading]]:font-semibold",
        "**:[[cmdk-group-heading]]:uppercase",
        "**:[[cmdk-group-heading]]:tracking-wider",
        "**:[[cmdk-group-heading]]:text-muted-foreground/50",
      )}
    >
      {children}
    </CommandGroup>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground/50">
      <Search className="h-5 w-5" />
      <span className="text-xs">{label}</span>
    </div>
  );
}
