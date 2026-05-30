'use client';

import * as React from 'react';
import {
  Calculator,
  Settings,
  User,
  Search,
  Box,
  Receipt,
  LogOut,
  History,
  Users,
  Database,
  Printer,
  Bell,
  Monitor,
  RefreshCw,
  FileText,
  Loader2,
  Trash2,
  Pause,
  CreditCard,
  Moon,
  Sun,
} from 'lucide-react';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@repo/ui/components/ui/command';
import { useNavigate } from 'react-router';
import { invoke } from '@tauri-apps/api/core';
import { useDebounce } from 'use-debounce';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@repo/ui/components/ui/badge';
import { cn } from '@/lib/utils';
import { usePosStore } from '@/store/store';
import { useTheme } from 'next-themes';

interface GlobalSearchResult {
  products: any[];
  customers: any[];
  sales: any[];
}

// Settings items for search
const settingsItems = [
  {
    id: 'general',
    name: 'General Settings',
    description: 'Store information and preferences',
    icon: Settings,
    path: '/settings?tab=general',
  },
  {
    id: 'sync',
    name: 'Sync Settings',
    description: 'Product and customer synchronization',
    icon: RefreshCw,
    path: '/settings?tab=sync',
  },
  {
    id: 'data',
    name: 'Data Management',
    description: 'Clear local data and reset',
    icon: Database,
    path: '/settings?tab=data',
  },
  {
    id: 'receipts',
    name: 'Receipt Settings',
    description: 'Customize receipt layout',
    icon: FileText,
    path: '/settings?tab=receipts',
  },
  {
    id: 'hardware',
    name: 'Hardware Settings',
    description: 'Printers and peripherals',
    icon: Printer,
    path: '/settings?tab=hardware',
  },
  {
    id: 'notifications',
    name: 'Notification Settings',
    description: 'Configure alerts',
    icon: Bell,
    path: '/settings?tab=notifications',
  },
  {
    id: 'display',
    name: 'Customer Display',
    description: 'External display settings',
    icon: Monitor,
    path: '/settings?tab=display',
  },
];

// Highlight matched text
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;

  const parts = text.split(new RegExp(`(${query})`, 'gi'));

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/50 text-foreground font-medium">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [debouncedQuery] = useDebounce(query, 300);
  const [results, setResults] = React.useState<GlobalSearchResult>({ products: [], customers: [], sales: [] });
  const [loading, setLoading] = React.useState(false);

  const navigate = useNavigate();
  const { checkOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { currentOrder, resetOrder, holdCurrentOrder } = usePosStore();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(open => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  React.useEffect(() => {
    if (!open) {
      setQuery('');
      setResults({ products: [], customers: [], sales: [] });
      return;
    }

    if (debouncedQuery.length === 0) {
      setResults({ products: [], customers: [], sales: [] });
      return;
    }

    const search = async () => {
      setLoading(true);
      try {
        const res = await invoke<GlobalSearchResult>('search_global_command', { query: debouncedQuery });
        setResults({
          products: res.products || [],
          customers: res.customers || [],
          sales: res.sales || [],
        });
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    };

    search();
  }, [debouncedQuery, open]);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  // Filter settings based on query
  const filteredSettings = React.useMemo(() => {
    if (!query) return [];
    const lowerQuery = query.toLowerCase();
    return settingsItems.filter(
      item => item.name.toLowerCase().includes(lowerQuery) || item.description.toLowerCase().includes(lowerQuery)
    );
  }, [query]);

  const hasResults =
    results.products.length > 0 ||
    results.customers.length > 0 ||
    results.sales.length > 0 ||
    filteredSettings.length > 0;

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted/50 hover:bg-muted border border-transparent hover:border-border rounded-md cursor-pointer transition-all w-64 group"
      >
        <Search className="w-4 h-4 group-hover:text-foreground" />
        <span className="flex-1 truncate">Search...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search products, customers, sales, settings..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList className="max-h-[400px]">
          {loading && (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              <span className="text-sm">Searching...</span>
            </div>
          )}

          {!loading && query.length > 0 && !hasResults && (
            <CommandEmpty>
              <div className="py-6 text-center text-sm">
                <Search className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No results found for "{query}"</p>
                <p className="text-xs text-muted-foreground mt-1">Try a different search term</p>
              </div>
            </CommandEmpty>
          )}

          {/* Default Suggestions when no query */}
          {!loading && query.length === 0 && (
            <CommandGroup heading="Quick Navigation">
              <CommandItem onSelect={() => runCommand(() => navigate('/'))}>
                <Calculator className="mr-2 h-4 w-4 text-blue-500" />
                <div className="flex flex-col">
                  <span className="font-medium">POS / Register</span>
                  <span className="text-xs text-muted-foreground">Start a new sale</span>
                </div>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate('/history'))}>
                <History className="mr-2 h-4 w-4 text-purple-500" />
                <div className="flex flex-col">
                  <span className="font-medium">Transaction History</span>
                  <span className="text-xs text-muted-foreground">View past transactions</span>
                </div>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate('/customers'))}>
                <Users className="mr-2 h-4 w-4 text-green-500" />
                <div className="flex flex-col">
                  <span className="font-medium">Customers</span>
                  <span className="text-xs text-muted-foreground">Manage customer list</span>
                </div>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate('/settings'))}>
                <Settings className="mr-2 h-4 w-4 text-gray-500" />
                <div className="flex flex-col">
                  <span className="font-medium">Settings</span>
                  <span className="text-xs text-muted-foreground">Configure application</span>
                </div>
              </CommandItem>
            </CommandGroup>
          )}

          {/* Products Results */}
          {!loading && results.products.length > 0 && (
            <CommandGroup heading="Products">
              {results.products.map(product => (
                <CommandItem
                  key={product.productId}
                  value={`product:${product.productName}`}
                  onSelect={() => runCommand(() => navigate(`/?search=${encodeURIComponent(product.productName)}`))}
                  className="flex items-center gap-3 py-3"
                >
                  <div className="flex items-center justify-center w-10 h-10 bg-muted rounded-md shrink-0">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.productName}
                        className="w-full h-full object-cover rounded-md"
                      />
                    ) : (
                      <Box className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      <HighlightText text={product.productName} query={query} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground truncate">{product.category}</span>
                      <Badge variant="secondary" className="text-xs">
                        {product.variants?.length || 0} variants
                      </Badge>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Customers Results */}
          {!loading && results.customers.length > 0 && (
            <CommandGroup heading="Customers">
              {results.customers.map(customer => (
                <CommandItem
                  key={customer.id}
                  value={`customer:${customer.name}`}
                  onSelect={() => runCommand(() => navigate(`/customers?search=${encodeURIComponent(customer.name)}`))}
                  className="flex items-center gap-3 py-3"
                >
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      <HighlightText text={customer.name} query={query} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      {customer.phone && <span>{customer.phone}</span>}
                      {customer.email && <span>• {customer.email}</span>}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Sales Results */}
          {!loading && results.sales.length > 0 && (
            <CommandGroup heading="Pending Sales">
              {results.sales.map(sale => {
                const saleNumber = sale.transactionData?.saleNumber || sale.id.slice(0, 8);
                const total = sale.transactionData?.total;
                return (
                  <CommandItem
                    key={sale.id}
                    value={`sale:${saleNumber}`}
                    onSelect={() => runCommand(() => navigate(`/history?highlight=${sale.id}`))}
                    className="flex items-center gap-3 py-3"
                  >
                    <div
                      className={cn(
                        'flex items-center justify-center w-10 h-10 rounded-md shrink-0',
                        sale.status === 'FAILED' ? 'bg-red-500/10' : 'bg-yellow-500/10'
                      )}
                    >
                      <Receipt
                        className={cn('w-5 h-5', sale.status === 'FAILED' ? 'text-red-500' : 'text-yellow-600')}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Sale #{saleNumber}</span>
                        <Badge variant={sale.status === 'FAILED' ? 'destructive' : 'secondary'} className="text-xs">
                          {sale.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {total && <span>Total: ${total.toFixed(2)}</span>}
                        {sale.retry_count > 0 && <span> • {sale.retry_count} retries</span>}
                      </div>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {/* Settings Results */}
          {!loading && filteredSettings.length > 0 && (
            <CommandGroup heading="Settings">
              {filteredSettings.map(setting => {
                const Icon = setting.icon;
                return (
                  <CommandItem
                    key={setting.id}
                    value={`setting:${setting.name}`}
                    onSelect={() => runCommand(() => navigate(setting.path))}
                    className="flex items-center gap-3 py-3"
                  >
                    <div className="flex items-center justify-center w-10 h-10 bg-muted rounded-md shrink-0">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">
                        <HighlightText text={setting.name} query={query} />
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">
                        <HighlightText text={setting.description} query={query} />
                      </div>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {!loading && query.length === 0 && (
            <>
              <CommandSeparator />

              <CommandGroup heading="Actions">
                {currentOrder.items.length > 0 && (
                  <>
                    <CommandItem onSelect={() => runCommand(() => navigate('/'))}>
                      <CreditCard className="mr-2 h-4 w-4 text-emerald-500" />
                      <span>Checkout Current Order</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => holdCurrentOrder())}>
                      <Pause className="mr-2 h-4 w-4 text-amber-500" />
                      <span>Hold Current Order</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => resetOrder())}>
                      <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                      <span>Clear Cart</span>
                    </CommandItem>
                  </>
                )}
                <CommandItem onSelect={() => runCommand(() => setTheme(theme === 'dark' ? 'light' : 'dark'))}>
                  {theme === 'dark' ? (
                    <Sun className="mr-2 h-4 w-4 text-yellow-500" />
                  ) : (
                    <Moon className="mr-2 h-4 w-4 text-slate-500" />
                  )}
                  <span>Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
                </CommandItem>
                <CommandItem onSelect={() => runCommand(() => checkOut())}>
                  <LogOut className="mr-2 h-4 w-4 text-red-500" />
                  <span>Check Out / Lock Session</span>
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
