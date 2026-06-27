'use client';

import { useState, useEffect, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/ui/tabs';
import { Input } from '@repo/ui/components/ui/input';
import { Button } from '@repo/ui/components/ui/button';
import {
  Loader2,
  RefreshCw,
  Search,
  Tag,
  Users,
  List,
  TrendingUp,
  ChevronRight,
  Activity,
  Package,
  Globe,
  Clock,
} from 'lucide-react';
import { useFormattedCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { usePosPricingSync } from '@/hooks/use-pricing-sync';
import { PosProduct } from '@/hooks/products';
import { PosCustomer } from '@/hooks/customers';
import { cn } from '@/lib/utils';

interface ClientPriceList {
  id: string;
  code: string;
  priority: number;
  isGlobal: boolean;
  isActive: boolean;
  validFrom?: string;
  validTo?: string;
  updatedAt: string;
}

interface ClientPriceListItem {
  id: string;
  priceListId: string;
  variantId: string;
  sellingUnitId?: string;
  minQuantity: number;
  price: string;
  updatedAt: string;
}

interface PosPricingData {
  lists: ClientPriceList[];
  items: ClientPriceListItem[];
  allocations: Record<string, string[]>;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number | string | undefined;
  icon: React.ReactNode;
  accent: string;
  sublabel?: string;
}

function StatCard({ label, value, icon, accent, sublabel }: StatCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border bg-white dark:bg-zinc-900',
        'border-zinc-200/80 dark:border-zinc-800 shadow-sm',
        'transition-all duration-300 hover:shadow-md hover:-translate-y-0.5'
      )}
    >
      {/* Accent bar */}
      <div className={cn('absolute inset-x-0 top-0 h-0.5', accent)} />
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500">{label}</p>
            <p className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{value ?? '—'}</p>
            {sublabel && <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{sublabel}</p>}
          </div>
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
            )}
          >
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Price List Card ──────────────────────────────────────────────────────────

interface PriceListCardProps {
  list: ClientPriceList;
  items: ClientPriceListItem[];
  lookups: { productMap: Map<string, string>; customerMap: Map<string, string> };
  formatCurrency: (n: number) => string;
}

function PriceListCard({ list, items, lookups, formatCurrency }: PriceListCardProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div
      className={cn(
        'rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900',
        'shadow-sm overflow-hidden transition-all duration-300'
      )}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer select-none hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
              list.isActive
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
            )}
          >
            P{list.priority}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">{list.code}</span>
              {list.isGlobal && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                  <Globe className="h-2.5 w-2.5" /> Global
                </span>
              )}
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border',
                  list.isActive
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800'
                    : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800'
                )}
              >
                <Activity className="h-2.5 w-2.5" />
                {list.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">
              <span className="flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" />
                {list.validFrom ? format(new Date(list.validFrom), 'dd MMM yy') : 'No start'}
                {' → '}
                {list.validTo ? format(new Date(list.validTo), 'dd MMM yy') : 'No end'}
              </span>
              <span className="font-mono">{list.id.slice(0, 8)}…</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {items.length} item{items.length !== 1 ? 's' : ''}
          </span>
          <ChevronRight
            className={cn('h-4 w-4 text-zinc-400 transition-transform duration-200', expanded && 'rotate-90')}
          />
        </div>
      </div>

      {/* Table */}
      {expanded && (
        <div className="border-t border-zinc-100 dark:border-zinc-800">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-zinc-400 dark:text-zinc-500 gap-2">
              <Package className="h-6 w-6 opacity-40" />
              <p className="text-sm">No items defined in this list</p>
            </div>
          ) : (
            <div className="max-h-72 overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40">
                    <th className="text-left py-2.5 px-5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 w-[45%]">
                      Product / Variant
                    </th>
                    <th className="text-left py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      Unit
                    </th>
                    <th className="text-left py-2.5 px-4 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      Min Qty
                    </th>
                    <th className="text-right py-2.5 px-5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {items.map(item => {
                    const productName = lookups.productMap.get(item.variantId);
                    return (
                      <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3 px-5">
                          {productName ? (
                            <span className="font-medium text-zinc-800 dark:text-zinc-200 text-[13px]">
                              {productName}
                            </span>
                          ) : (
                            <span className="font-mono text-xs text-amber-600 dark:text-amber-400">
                              Product not found
                            </span>
                          )}
                          <div className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                            {item.variantId}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {item.sellingUnitId ? (
                            <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                              {item.sellingUnitId}
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-400 dark:text-zinc-500 italic">Base</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="tabular-nums text-zinc-700 dark:text-zinc-300 text-[13px]">
                            {item.minQuantity}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-right">
                          <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50 text-[13px]">
                            {formatCurrency(parseFloat(item.price))}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PricingViewPage() {
  const [data, setData] = useState<PosPricingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const formatCurrency = useFormattedCurrency();
  const { triggerSync, isSyncing } = usePosPricingSync();
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [customers, setCustomers] = useState<PosCustomer[]>([]);

  const lookups = useMemo(() => {
    const productMap = new Map<string, string>();
    const customerMap = new Map<string, string>();

    products.forEach((p: any) => {
      const pName = p.name || p.productName || 'Unknown Product';
      p.variants.forEach((v: any) => {
        const vName = v.name || v.variantName || 'Unknown Variant';
        const fullName = vName === 'Default' || vName === pName ? pName : `${pName} - ${vName}`;
        productMap.set(v.variantId, fullName);
      });
    });

    customers.forEach((c: any) => {
      const cName = c.name || c.company || 'Unknown Customer';
      customerMap.set(c.id, cName);
    });

    return { productMap, customerMap };
  }, [products, customers]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const pricingData = await invoke<PosPricingData>('get_pos_pricing_command');
      setData(pricingData);

      const variantIds = new Set<string>();
      pricingData.items.forEach(i => variantIds.add(i.variantId));
      const customerIds = new Set<string>();
      Object.keys(pricingData.allocations).forEach(id => customerIds.add(id));

      const [fetchedProducts, fetchedCustomers] = await Promise.all([
        invoke<PosProduct[]>('get_products_by_ids_command', { ids: Array.from(variantIds) }),
        invoke<PosCustomer[]>('get_customers_by_ids_command', { ids: Array.from(customerIds) }),
      ]);

      setProducts(fetchedProducts || []);
      setCustomers(fetchedCustomers || []);
    } catch (error) {
      console.error('Failed to fetch pricing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      await triggerSync();
      await fetchData();
    } catch (error) {
      console.error('Failed to refresh:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredLists =
    data?.lists.filter(
      l => l.code.toLowerCase().includes(filter.toLowerCase()) || l.id.toLowerCase().includes(filter.toLowerCase())
    ) || [];

  const activeCount = data?.lists.filter(l => l.isActive).length ?? 0;
  const globalCount = data?.lists.filter(l => l.isGlobal).length ?? 0;
  const allocationCount = Object.keys(data?.allocations || {}).length;

  if (loading && !data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-7 w-7 animate-spin text-zinc-400" />
        <p className="text-sm text-zinc-400 dark:text-zinc-500 tracking-wide">Loading pricing data…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
        <div className="mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-100">
              <TrendingUp className="h-4 w-4 text-white dark:text-zinc-900" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 leading-none">Pricing Engine</h1>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 leading-none">
                Price lists, items & customer rules
              </p>
            </div>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={loading || isSyncing}
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 border-zinc-200 dark:border-zinc-700"
          >
            {isSyncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {isSyncing ? 'Syncing…' : 'Refresh'}
          </Button>
        </div>
      </div>

      <div className="mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Price Lists"
            value={data?.lists.length}
            icon={<List className="h-4 w-4" />}
            accent="bg-violet-500"
            sublabel={`${activeCount} active`}
          />
          <StatCard
            label="Line Items"
            value={data?.items.length}
            icon={<Tag className="h-4 w-4" />}
            accent="bg-sky-500"
            sublabel="across all lists"
          />
          <StatCard
            label="Allocations"
            value={allocationCount}
            icon={<Users className="h-4 w-4" />}
            accent="bg-amber-500"
            sublabel="customer rules"
          />
          <StatCard
            label="Global Lists"
            value={globalCount}
            icon={<Globe className="h-4 w-4" />}
            accent="bg-emerald-500"
            sublabel="apply to all"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="lists" className="w-full">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <TabsList className="h-9 bg-zinc-100 dark:bg-zinc-800/60 rounded-lg p-1">
              <TabsTrigger
                value="lists"
                className="rounded-md text-xs px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-sm"
              >
                Price Lists
              </TabsTrigger>
              <TabsTrigger
                value="allocations"
                className="rounded-md text-xs px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-sm"
              >
                Allocations
              </TabsTrigger>
            </TabsList>

            {/* Filter — only shown on lists tab visually but always mounted */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <Input
                placeholder="Filter lists…"
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="pl-8 h-9 text-xs w-52 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 rounded-lg focus-visible:ring-1 focus-visible:ring-zinc-400"
              />
            </div>
          </div>

          {/* Price Lists Tab */}
          <TabsContent value="lists" className="mt-0 space-y-3">
            {filteredLists.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 py-16 flex flex-col items-center justify-center text-zinc-400 gap-2">
                <List className="h-7 w-7 opacity-40" />
                <p className="text-sm">No price lists match your filter</p>
              </div>
            ) : (
              filteredLists.map(list => (
                <PriceListCard
                  key={list.id}
                  list={list}
                  items={data?.items.filter(i => i.priceListId === list.id) || []}
                  lookups={lookups}
                  formatCurrency={formatCurrency}
                />
              ))
            )}
          </TabsContent>

          {/* Allocations Tab */}
          <TabsContent value="allocations" className="mt-0">
            <div className="rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Customer Rules</h2>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Price lists assigned per customer</p>
              </div>
              {allocationCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-zinc-400">
                  <Users className="h-7 w-7 opacity-40" />
                  <p className="text-sm">No customer allocations found</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40">
                      <th className="text-left py-2.5 px-5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 w-1/3">
                        Customer
                      </th>
                      <th className="text-left py-2.5 px-5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        Assigned Price Lists
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {Object.entries(data?.allocations || {}).map(([custId, lists]) => {
                      const customerName = lookups.customerMap.get(custId);
                      return (
                        <tr key={custId} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                          <td className="py-3.5 px-5">
                            {customerName ? (
                              <span className="font-medium text-[13px] text-zinc-800 dark:text-zinc-200">
                                {customerName}
                              </span>
                            ) : (
                              <span className="font-mono text-xs text-amber-600 dark:text-amber-400">
                                Unknown customer
                              </span>
                            )}
                            <div className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                              {custId}
                            </div>
                          </td>
                          <td className="py-3.5 px-5">
                            <div className="flex flex-wrap gap-1.5">
                              {lists.map(lid => {
                                const listName = data?.lists.find(l => l.id === lid)?.code || lid.slice(0, 8) + '…';
                                return (
                                  <span
                                    key={lid}
                                    className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                                  >
                                    {listName}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
