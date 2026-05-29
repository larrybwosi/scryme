'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, User, Building, DollarSign, LayoutGrid, Clock, ArrowRight, Loader2 } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@repo/ui/components/ui/command';
import { Button } from '@repo/ui/components/ui/button';
import { Badge } from '@repo/ui/components/ui/badge';
import { cn } from '@repo/ui/lib/utils';
import { useDebouncedCallback } from 'use-debounce';

interface SearchResult {
  id: string;
  objectName: string;
  objectLabel: string;
  title: string;
  subtitle?: string;
  data: Record<string, any>;
}

interface RecentSearch {
  id: string;
  objectName: string;
  title: string;
  timestamp: number;
}

interface CrmSearchProps {
  onSearch: (query: string) => Promise<SearchResult[]>;
  objects: Array<{ name: string; label: string; labelPlural: string }>;
  className?: string;
}

const getObjectIcon = (name: string) => {
  switch (name) {
    case 'person':
      return User;
    case 'company':
      return Building;
    case 'deal':
      return DollarSign;
    default:
      return LayoutGrid;
  }
};

const RECENT_SEARCHES_KEY = 'crm-recent-searches';
const MAX_RECENT_SEARCHES = 5;

export const CrmSearch: React.FC<CrmSearchProps> = ({ onSearch, objects, className }) => {
  // const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const loadRecentSearches = () => {
      try {
        const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
        if (stored) {
          setRecentSearches(JSON.parse(stored));
        }
      } catch {
        // Ignore localStorage errors
      }
    };
    loadRecentSearches();
  }, []);

  // Save recent search
  const saveRecentSearch = useCallback((result: SearchResult) => {
    const recent: RecentSearch = {
      id: result.id,
      objectName: result.objectName,
      title: result.title,
      timestamp: Date.now(),
    };

    setRecentSearches(prev => {
      const filtered = prev.filter(r => r.id !== recent.id);
      const updated = [recent, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        // Ignore localStorage errors
      }
      return updated;
    });
  }, []);

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(open => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Debounced search
  const debouncedSearch = useDebouncedCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const searchResults = await onSearch(searchQuery);
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, 300);

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setQuery(value);
    debouncedSearch(value);
  };

  // Handle result selection
  const handleSelect = (result: SearchResult) => {
    saveRecentSearch(result);
    setOpen(false);
    setQuery('');
    setResults([]);
    // router.push(`/crm/${result.objectName}/${result.id}`);
  };

  // Handle recent search selection
  const handleRecentSelect = (recent: RecentSearch) => {
    setOpen(false);
    setQuery('');
    setResults([]);
    // router.push(`/crm/${recent.objectName}/${recent.id}`);
  };

  // Group results by object type
  const groupedResults = results.reduce<Record<string, SearchResult[]>>((acc, result) => {
    if (!acc[result.objectName]) {
      acc[result.objectName] = [];
    }
    acc[result.objectName].push(result);
    return acc;
  }, {});

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          'relative h-9 w-full justify-start rounded-lg bg-muted/40 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-64',
          className
        )}
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Search CRM...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-[0.4rem] top-[0.4rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          ref={inputRef}
          placeholder="Search contacts, companies, deals..."
          value={query}
          onValueChange={handleSearchChange}
        />
        <CommandList>
          {loading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && !query && recentSearches.length > 0 && (
            <CommandGroup heading="Recent Searches">
              {recentSearches.map(recent => {
                const Icon = getObjectIcon(recent.objectName);
                return (
                  <CommandItem
                    key={recent.id}
                    value={recent.id}
                    onSelect={() => handleRecentSelect(recent)}
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">{recent.title}</span>
                      <span className="text-xs text-muted-foreground capitalize">{recent.objectName}</span>
                    </div>
                    <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {!loading && !query && (
            <>
              {recentSearches.length > 0 && <CommandSeparator />}
              <CommandGroup heading="Quick Access">
                {objects.slice(0, 4).map(obj => {
                  const Icon = getObjectIcon(obj.name);
                  return (
                    <CommandItem
                      key={obj.name}
                      value={`go-${obj.name}`}
                      onSelect={() => {
                        setOpen(false);
                        // router.push(`/crm/${obj.name}`);
                      }}
                      className="flex items-center gap-3"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <span>View all {obj.labelPlural}</span>
                      <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </>
          )}

          {!loading && query && results.length === 0 && (
            <CommandEmpty>
              <div className="flex flex-col items-center gap-2 py-6">
                <Search className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No results found for &quot;{query}&quot;</p>
              </div>
            </CommandEmpty>
          )}

          {!loading &&
            query &&
            Object.entries(groupedResults).map(([objectName, objectResults]) => {
              const object = objects.find(o => o.name === objectName);
              const Icon = getObjectIcon(objectName);

              return (
                <CommandGroup
                  key={objectName}
                  heading={
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5" />
                      {object?.labelPlural || objectName}
                    </div>
                  }
                >
                  {objectResults.slice(0, 5).map(result => (
                    <CommandItem
                      key={result.id}
                      value={`${result.objectName}-${result.id}`}
                      onSelect={() => handleSelect(result)}
                      className="flex items-center gap-3"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-medium truncate">{result.title}</span>
                        {result.subtitle && (
                          <span className="text-xs text-muted-foreground truncate">{result.subtitle}</span>
                        )}
                      </div>
                      <Badge variant="secondary" className="ml-auto shrink-0">
                        {object?.label || objectName}
                      </Badge>
                    </CommandItem>
                  ))}
                  {objectResults.length > 5 && (
                    <CommandItem
                      value={`more-${objectName}`}
                      onSelect={() => {
                        setOpen(false);
                        // router.push(`/crm/${objectName}?search=${encodeURIComponent(query)}`);
                      }}
                      className="text-primary"
                    >
                      <span className="ml-11">View all {objectResults.length} results...</span>
                    </CommandItem>
                  )}
                </CommandGroup>
              );
            })}
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default CrmSearch;
