'use client';

import { useState, useEffect } from 'react';
import posthog from 'posthog-js';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Badge } from '@repo/ui/components/ui/badge';
import { Avatar, AvatarFallback } from '@repo/ui/components/ui/avatar';
import { Search, Mail, Phone, Edit, User, Plus, RefreshCw, ChevronRight } from 'lucide-react';
import AddCustomerSheet from '@/components/customers/add-customer';
import { useFormattedCurrency } from '@/lib/utils';
import { usePosCustomers } from '@/hooks/customers';

export default function CustomersPage() {
  const { customers, isSyncing, triggerSync } = usePosCustomers();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredCustomers = customers.filter(
    customer =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer?.phone?.includes(searchQuery)
  );

  useEffect(() => {
    if (searchQuery) {
      const timer = setTimeout(() => {
        posthog.capture('customer_search', { query: searchQuery.substring(0, 50) });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  const formatCurrency = useFormattedCurrency();

  function getInitials(name: string) {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{customers.length} total customers</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={triggerSync} disabled={isSyncing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync
          </Button>
          <Button size="sm" onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      <AddCustomerSheet open={isDialogOpen} onOpenChange={setIsDialogOpen} />

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email or phone..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[2fr_2fr_1fr_1fr_auto] gap-4 px-4 py-3 bg-muted/40 border-b text-xs font-medium text-muted-foreground uppercase tracking-wide">
          <span>Customer</span>
          <span>Contact</span>
          <span>Total Spend</span>
          <span>Last Visit</span>
          <span />
        </div>

        {/* Rows */}
        {filteredCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No customers found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery ? 'Try a different search term.' : 'Add your first customer to get started.'}
            </p>
            {!searchQuery && (
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Customer
              </Button>
            )}
          </div>
        ) : (
          <ul className="divide-y">
            {filteredCustomers.map(customer => (
              <li
                key={customer.id}
                className="grid grid-cols-[2fr_2fr_1fr_1fr_auto] gap-4 px-4 py-3.5 items-center hover:bg-muted/30 transition-colors group"
              >
                {/* Name + loyalty */}
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                      {getInitials(customer.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{customer.name}</p>
                    {!!customer?.loyaltyPoints && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 mt-0.5">
                        {customer.loyaltyPoints} pts
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Contact */}
                <div className="min-w-0 space-y-0.5">
                  {customer.email && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground truncate">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  {!customer.email && !customer.phone && <span className="text-sm text-muted-foreground/50">—</span>}
                </div>

                {/* Total spend */}
                <div className="text-sm font-medium tabular-nums">{formatCurrency(customer?.totalPurchases || 0)}</div>

                {/* Last visit */}
                <div className="text-sm text-muted-foreground">
                  {customer?.lastVisit
                    ? new Date(customer.lastVisit).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—'}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Footer */}
        {filteredCustomers.length > 0 && (
          <div className="px-4 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
            Showing {filteredCustomers.length} of {customers.length} customers
          </div>
        )}
      </div>
    </div>
  );
}
