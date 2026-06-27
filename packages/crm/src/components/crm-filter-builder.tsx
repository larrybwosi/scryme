"use client";

import { useState } from "react";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/ui/popover";
import { Calendar } from "@repo/ui/components/ui/calendar";
import {
  Filter,
  Plus,
  X,
  Search,
  Save,
  CalendarIcon,
  ChevronDown,
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { format } from "date-fns";
import { CrmFieldType } from "../types";

export interface FilterCondition {
  id: string;
  field: string;
  operator: string;
  value: any;
}

export interface SavedView {
  id: string;
  name: string;
  filters: FilterCondition[];
}

export interface CrmFilterBuilderProps {
  fields: Array<{
    name: string;
    label: string;
    type: CrmFieldType;
    options?: Array<{ label: string; value: string }>;
  }>;
  filters: FilterCondition[];
  onFiltersChange: (filters: FilterCondition[]) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  savedViews?: SavedView[];
  onSaveView?: (name: string, filters: FilterCondition[]) => void;
  onLoadView?: (view: SavedView) => void;
  onDeleteView?: (viewId: string) => void;
}

const OPERATORS: Record<
  CrmFieldType | "default",
  Array<{ value: string; label: string }>
> = {
  [CrmFieldType.TEXT]: [
    { value: "contains", label: "Contains" },
    { value: "not_contains", label: "Does not contain" },
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Does not equal" },
    { value: "starts_with", label: "Starts with" },
    { value: "ends_with", label: "Ends with" },
    { value: "is_empty", label: "Is empty" },
    { value: "is_not_empty", label: "Is not empty" },
  ],
  [CrmFieldType.NUMBER]: [
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Does not equal" },
    { value: "greater_than", label: "Greater than" },
    { value: "less_than", label: "Less than" },
    { value: "greater_or_equal", label: "Greater or equal" },
    { value: "less_or_equal", label: "Less or equal" },
    { value: "between", label: "Between" },
    { value: "is_empty", label: "Is empty" },
  ],
  [CrmFieldType.DATE]: [
    { value: "equals", label: "On" },
    { value: "before", label: "Before" },
    { value: "after", label: "After" },
    { value: "between", label: "Between" },
    { value: "last_7_days", label: "Last 7 days" },
    { value: "last_30_days", label: "Last 30 days" },
    { value: "this_month", label: "This month" },
    { value: "is_empty", label: "Is empty" },
  ],
  [CrmFieldType.SELECT]: [
    { value: "equals", label: "Is" },
    { value: "not_equals", label: "Is not" },
    { value: "in", label: "Is any of" },
    { value: "is_empty", label: "Is empty" },
  ],
  [CrmFieldType.MULTI_SELECT]: [
    { value: "contains", label: "Contains" },
    { value: "not_contains", label: "Does not contain" },
    { value: "is_empty", label: "Is empty" },
  ],
  [CrmFieldType.BOOLEAN]: [{ value: "equals", label: "Is" }],
  [CrmFieldType.EMAIL]: [
    { value: "contains", label: "Contains" },
    { value: "equals", label: "Equals" },
    { value: "is_empty", label: "Is empty" },
  ],
  [CrmFieldType.PHONE]: [
    { value: "contains", label: "Contains" },
    { value: "equals", label: "Equals" },
    { value: "is_empty", label: "Is empty" },
  ],
  [CrmFieldType.URL]: [
    { value: "contains", label: "Contains" },
    { value: "equals", label: "Equals" },
    { value: "is_empty", label: "Is empty" },
  ],
  [CrmFieldType.JSON]: [
    { value: "contains", label: "Contains" },
    { value: "is_empty", label: "Is empty" },
  ],
  default: [
    { value: "contains", label: "Contains" },
    { value: "equals", label: "Equals" },
    { value: "is_empty", label: "Is empty" },
  ],
};

function generateId() {
  return Math.random().toString(36).slice(2, 11);
}

export function CrmFilterBuilder({
  fields,
  filters,
  onFiltersChange,
  searchQuery,
  onSearchChange,
  savedViews = [],
  onSaveView,
  onLoadView,
  onDeleteView: _onDeleteView,
}: CrmFilterBuilderProps) {
  const [isExpanded, setIsExpanded] = useState(filters.length > 0);
  const [saveViewName, setSaveViewName] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);

  const addFilter = () => {
    const newFilter: FilterCondition = {
      id: generateId(),
      field: fields[0]?.name || "",
      operator: "contains",
      value: "",
    };
    onFiltersChange([...filters, newFilter]);
    setIsExpanded(true);
  };

  const removeFilter = (id: string) => {
    onFiltersChange(filters.filter((f) => f.id !== id));
  };

  const updateFilter = (id: string, updates: Partial<FilterCondition>) => {
    onFiltersChange(
      filters.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    );
  };

  const clearAllFilters = () => {
    onFiltersChange([]);
    onSearchChange("");
  };

  const handleSaveView = () => {
    if (saveViewName.trim() && onSaveView) {
      onSaveView(saveViewName.trim(), filters);
      setSaveViewName("");
      setShowSaveInput(false);
    }
  };

  const getOperatorsForField = (fieldName: string) => {
    const field = fields.find((f) => f.name === fieldName);
    if (!field) return OPERATORS.default;
    return OPERATORS[field.type] || OPERATORS.default;
  };

  const renderValueInput = (filter: FilterCondition) => {
    const field = fields.find((f) => f.name === filter.field);
    if (!field) return null;

    // No value input needed for empty checks
    if (filter.operator === "is_empty" || filter.operator === "is_not_empty") {
      return null;
    }

    switch (field.type) {
      case CrmFieldType.DATE:
        if (filter.operator === "between") {
          return (
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-[110px] justify-start"
                  >
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {filter.value?.from
                      ? format(new Date(filter.value.from), "MMM d")
                      : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      filter.value?.from
                        ? new Date(filter.value.from)
                        : undefined
                    }
                    onSelect={(date) =>
                      updateFilter(filter.id, {
                        value: { ...filter.value, from: date?.toISOString() },
                      })
                    }
                  />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground">-</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-[110px] justify-start"
                  >
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {filter.value?.to
                      ? format(new Date(filter.value.to), "MMM d")
                      : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      filter.value?.to ? new Date(filter.value.to) : undefined
                    }
                    onSelect={(date) =>
                      updateFilter(filter.id, {
                        value: { ...filter.value, to: date?.toISOString() },
                      })
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          );
        }
        if (
          ["last_7_days", "last_30_days", "this_month"].includes(
            filter.operator,
          )
        ) {
          return null;
        }
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-[140px] justify-start"
              >
                <CalendarIcon className="mr-2 h-3 w-3" />
                {filter.value
                  ? format(new Date(filter.value), "MMM d, yyyy")
                  : "Pick date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filter.value ? new Date(filter.value) : undefined}
                onSelect={(date) =>
                  updateFilter(filter.id, { value: date?.toISOString() })
                }
              />
            </PopoverContent>
          </Popover>
        );

      case CrmFieldType.SELECT:
        return (
          <Select
            value={filter.value || ""}
            onValueChange={(value) => updateFilter(filter.id, { value })}
          >
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case CrmFieldType.BOOLEAN:
        return (
          <Select
            value={filter.value?.toString() || ""}
            onValueChange={(value) =>
              updateFilter(filter.id, { value: value === "true" })
            }
          >
            <SelectTrigger className="h-8 w-[100px]">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        );

      case CrmFieldType.NUMBER:
        if (filter.operator === "between") {
          return (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Min"
                className="h-8 w-[80px]"
                value={filter.value?.min || ""}
                onChange={(e) =>
                  updateFilter(filter.id, {
                    value: { ...filter.value, min: e.target.value },
                  })
                }
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="number"
                placeholder="Max"
                className="h-8 w-[80px]"
                value={filter.value?.max || ""}
                onChange={(e) =>
                  updateFilter(filter.id, {
                    value: { ...filter.value, max: e.target.value },
                  })
                }
              />
            </div>
          );
        }
        return (
          <Input
            type="number"
            placeholder="Value"
            className="h-8 w-[120px]"
            value={filter.value || ""}
            onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
          />
        );

      default:
        return (
          <Input
            type="text"
            placeholder="Value"
            className="h-8 w-[160px]"
            value={filter.value || ""}
            onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
          />
        );
    }
  };

  const hasActiveFilters = filters.length > 0 || searchQuery.trim() !== "";

  return (
    <div className="space-y-3">
      {/* Search and Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search records..."
            className="pl-9 h-9"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <Button
          variant={hasActiveFilters ? "secondary" : "outline"}
          size="sm"
          className="gap-2 h-9"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Filter className="h-4 w-4" />
          Filters
          {filters.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
              {filters.length}
            </Badge>
          )}
          <ChevronDown
            className={cn(
              "h-3 w-3 transition-transform",
              isExpanded && "rotate-180",
            )}
          />
        </Button>

        {savedViews.length > 0 && (
          <Select
            value=""
            onValueChange={(viewId) => {
              const view = savedViews.find((v) => v.id === viewId);
              if (view && onLoadView) onLoadView(view);
            }}
          >
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="Saved views" />
            </SelectTrigger>
            <SelectContent>
              {savedViews.map((view) => (
                <SelectItem key={view.id} value={view.id}>
                  {view.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-muted-foreground"
            onClick={clearAllFilters}
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Expanded Filter Builder */}
      {isExpanded && (
        <div className="p-4 bg-muted/30 rounded-lg border space-y-3">
          {filters.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-3">
                No filters applied
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={addFilter}
                className="gap-2"
              >
                <Plus className="h-3 w-3" />
                Add filter
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {filters.map((filter, index) => (
                  <div
                    key={filter.id}
                    className="flex items-center gap-2 flex-wrap"
                  >
                    {index > 0 && (
                      <Badge variant="outline" className="text-xs">
                        AND
                      </Badge>
                    )}
                    <Select
                      value={filter.field}
                      onValueChange={(value) =>
                        updateFilter(filter.id, { field: value, value: "" })
                      }
                    >
                      <SelectTrigger className="h-8 w-[140px]">
                        <SelectValue placeholder="Field" />
                      </SelectTrigger>
                      <SelectContent>
                        {fields.map((field) => (
                          <SelectItem key={field.name} value={field.name}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={filter.operator}
                      onValueChange={(value) =>
                        updateFilter(filter.id, { operator: value })
                      }
                    >
                      <SelectTrigger className="h-8 w-[140px]">
                        <SelectValue placeholder="Operator" />
                      </SelectTrigger>
                      <SelectContent>
                        {getOperatorsForField(filter.field).map((op) => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {renderValueInput(filter)}

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeFilter(filter.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addFilter}
                  className="gap-2"
                >
                  <Plus className="h-3 w-3" />
                  Add filter
                </Button>

                {onSaveView && (
                  <div className="flex items-center gap-2">
                    {showSaveInput ? (
                      <>
                        <Input
                          placeholder="View name"
                          className="h-8 w-[140px]"
                          value={saveViewName}
                          onChange={(e) => setSaveViewName(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && handleSaveView()
                          }
                        />
                        <Button
                          size="sm"
                          onClick={handleSaveView}
                          disabled={!saveViewName.trim()}
                        >
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowSaveInput(false);
                            setSaveViewName("");
                          }}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSaveInput(true)}
                        className="gap-2"
                      >
                        <Save className="h-3 w-3" />
                        Save view
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Quick Filters */}
      {filters.length > 0 && !isExpanded && (
        <div className="flex items-center gap-2 flex-wrap">
          {filters.map((filter) => {
            const field = fields.find((f) => f.name === filter.field);
            const operators = getOperatorsForField(filter.field);
            const operator = operators.find((o) => o.value === filter.operator);

            return (
              <Badge
                key={filter.id}
                variant="secondary"
                className="gap-1.5 cursor-pointer hover:bg-destructive/20 group"
                onClick={() => removeFilter(filter.id)}
              >
                <span className="font-medium">
                  {field?.label || filter.field}
                </span>
                <span className="text-muted-foreground">
                  {operator?.label || filter.operator}
                </span>
                {filter.value && (
                  <span className="font-medium truncate max-w-[100px]">
                    {typeof filter.value === "object" ? "range" : filter.value}
                  </span>
                )}
                <X className="h-3 w-3 opacity-50 group-hover:opacity-100" />
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
