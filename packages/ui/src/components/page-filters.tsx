'use client';

import { useEffect, useRef, useState } from 'react';
import { useDebounceValue } from 'usehooks-ts';
import { cn } from '.@repo/ui/components/ui/lib/utils';
import {
  ChevronDown,
  Search,
  X,
  Check,
  Download,
  SlidersHorizontal,
  MoreHorizontal,
  Filter,
  ArrowUpRight,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from '@repo/ui/components/ui/ui/dropdown-menu';
import { Button } from '@repo/ui/components/ui/ui/button';
import { Input } from '@repo/ui/components/ui/ui/input';
import { Badge } from '@repo/ui/components/ui/ui/badge';
import { Separator } from '@repo/ui/components/ui/ui/separator';

// --- Types ---

export interface FilterOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  count?: number;
}

export interface ExportAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
}

export interface FilterConfig {
  name: string;
  label: string;
  options: FilterOption[];
  defaultValue?: string;
  onChange: (value: string) => void;
  multiple?: boolean; // Note: UI simplified for single select logic in this version for clarity, can be expanded
  searchable?: boolean;
}

export interface FilterControlsProps {
  searchPlaceholder?: string;
  showSearch?: boolean;
  showFilterButton?: boolean; // specific toggle for a global filter drawer if needed
  filters?: FilterConfig[];
  exportActions?: ExportAction[];
  onSearch?: (value: string) => void;
  className?: string;
  variant?: 'default' | 'minimal' | 'glass';
  title?: string;
  resultCount?: number;
  loading?: boolean;
  disabled?: boolean;
  onClearAll?: () => void;
}

// --- Sub-Components ---

interface DropdownFilterProps {
  config: FilterConfig;
  className?: string;
}

const DropdownFilter = ({ config, className }: DropdownFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Derive selected state
  const selectedOption = config.options.find(opt => opt.value === config.defaultValue);
  const isFiltered = !!config.defaultValue && config.defaultValue !== '';

  const filteredOptions = config.searchable
    ? config.options.filter(
        option =>
          option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          option.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : config.options;

  useEffect(() => {
    if (isOpen && config.searchable) {
      // Small delay to allow animation to start
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen, config.searchable]);

  const handleSelect = (value: string) => {
    config.onChange(value);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-9 border-dashed text-xs sm:text-sm px-3 font-medium transition-all duration-200 group',
            isFiltered
              ? 'bg-blue-50/50 border-blue-200 text-blue-700 hover:bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 dark:text-blue-400'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800',
            className
          )}
        >
          <span className="mr-2 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">
            {config.label}
          </span>
          {isFiltered ? (
            <>
              <Separator orientation="vertical" className="mx-2 h-4 bg-blue-200 dark:bg-blue-800" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal bg-transparent text-blue-700 dark:text-blue-400 hover:bg-transparent pl-0"
              >
                {selectedOption?.label || config.defaultValue}
              </Badge>
            </>
          ) : (
            <ChevronDown className="ml-auto h-3.5 w-3.5 opacity-50" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px] p-0">
        {config.searchable && (
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder={`Filter ${config.label.toLowerCase()}...`}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="h-8 pl-8 text-xs ring-0 border-0 bg-muted/30 focus-visible:ring-0"
              />
            </div>
          </div>
        )}

        <div className="max-h-[280px] overflow-y-auto p-1">
          <DropdownMenuGroup>
            {/* "All" Option */}
            <DropdownMenuItem onSelect={() => handleSelect('')} className="text-sm py-2 cursor-pointer">
              <div
                className={cn(
                  'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                  !isFiltered ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible'
                )}
              >
                <Check className={cn('h-3 w-3')} />
              </div>
              <span>All</span>
            </DropdownMenuItem>

            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => {
                const isSelected = config.defaultValue === option.value;
                return (
                  <DropdownMenuItem
                    key={option.value}
                    onSelect={() => handleSelect(option.value)}
                    className="text-sm py-2 cursor-pointer"
                  >
                    <div
                      className={cn(
                        'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                        isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible'
                      )}
                    >
                      <Check className={cn('h-3 w-3')} />
                    </div>

                    {option.icon && <span className="mr-2 text-muted-foreground">{option.icon}</span>}

                    <div className="flex flex-col">
                      <span>{option.label}</span>
                      {option.description && (
                        <span className="text-[10px] text-muted-foreground">{option.description}</span>
                      )}
                    </div>

                    {option.count !== undefined && (
                      <span className="ml-auto text-xs text-muted-foreground font-mono">{option.count}</span>
                    )}
                  </DropdownMenuItem>
                );
              })
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">No results found.</div>
            )}
          </DropdownMenuGroup>
        </div>

        {isFiltered && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => handleSelect('')}
              className="justify-center text-xs text-muted-foreground h-8 cursor-pointer bg-muted/50"
            >
              Clear filter
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// --- Main Component ---

export function FilterControls({
  searchPlaceholder = 'Search...',
  showSearch = true,
  filters = [],
  exportActions = [],
  onSearch,
  className,
  variant = 'default',
  title,
  resultCount,
  loading = false,
  disabled = false,
  onClearAll,
}: FilterControlsProps) {
  const [searchValue, setSearchValue] = useState('');
  const [debouncedValue] = useDebounceValue(searchValue, 400);

  // Determine active filters count
  const activeFiltersCount = filters.reduce((acc, filter) => {
    return filter.defaultValue ? acc + 1 : acc;
  }, 0);

  useEffect(() => {
    onSearch?.(debouncedValue);
  }, [debouncedValue, onSearch]);

  // Styles based on variant
  const containerStyles = {
    default: 'bg-card border border-border/60 shadow-sm',
    minimal: 'bg-transparent border-0 shadow-none p-0',
    glass: 'bg-white/80 dark:bg-black/80 backdrop-blur-md border border-white/20 shadow-sm',
  };

  const isMinimal = variant === 'minimal';

  return (
    <div className={cn('space-y-4', className)}>
      {/* Title Header (Optional) */}
      {(title || resultCount !== undefined) && (
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            {title && <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>}
            {loading && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            )}
          </div>
          {resultCount !== undefined && (
            <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
              {resultCount.toLocaleString()} results
            </span>
          )}
        </div>
      )}

      {/* Controls Bar */}
      <div className={cn('flex flex-col lg:flex-row gap-4 p-4 rounded-xl transition-all', containerStyles[variant])}>
        {/* Left: Search */}
        {showSearch && (
          <div className={cn('relative flex-1 min-w-[240px] max-w-md', isMinimal && 'pl-0')}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              disabled={disabled}
              className={cn(
                'pl-9 h-9 bg-background border-input/80 focus:bg-background transition-colors',
                isMinimal ? 'shadow-sm' : ''
              )}
            />
            {searchValue && (
              <button
                onClick={() => setSearchValue('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        <Separator orientation="vertical" className="hidden lg:block h-9" />

        {/* Middle: Filters */}
        {filters.length > 0 && (
          <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-hide mask-linear-fade">
            <div className="flex items-center gap-2 min-w-max">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mr-1 lg:hidden">
                Filters
              </span>
              {filters.map(filter => (
                <DropdownFilter key={filter.name} config={filter} />
              ))}

              {activeFiltersCount > 0 && onClearAll && (
                <>
                  <div className="h-6 w-px bg-border mx-1" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearAll}
                    className="h-9 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    Reset
                    <X className="ml-2 h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Right: Actions */}
        {exportActions.length > 0 && (
          <div className="flex items-center gap-2 ml-auto mt-2 lg:mt-0 border-t lg:border-0 pt-3 lg:pt-0">
            {/* Show first 2 actions as buttons, rest in dropdown */}
            {exportActions.slice(0, 2).map((action, idx) => (
              <Button
                key={idx}
                variant={action.variant === 'primary' ? 'default' : 'outline'}
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled || action.loading}
                className={cn('h-9', action.variant !== 'primary' && 'border-dashed')}
              >
                {action.loading ? (
                  <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  action.icon || <Download className="mr-2 h-3.5 w-3.5" />
                )}
                {action.label}
              </Button>
            ))}

            {exportActions.length > 2 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9 border-dashed">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {exportActions.slice(2).map((action, idx) => (
                    <DropdownMenuItem key={idx} onClick={action.onClick}>
                      {action.icon || <ArrowUpRight className="mr-2 h-3.5 w-3.5" />}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
