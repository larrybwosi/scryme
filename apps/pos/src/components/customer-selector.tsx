'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, User, Building2, MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { usePosStore } from '@/store/store';
import { usePosCustomers } from '@/hooks/customers';

// Define the shape based on your Prisma return type
type SearchResultCustomer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  loyaltyPoints: number;
  customerType?: string | null;
  businessAccountId?: string | null;
  company?: string | null;
  type: 'B2B' | 'B2C'; // The computed field from backend
  primaryAddress: string | null; // The computed address
};

// Custom debounce hook to avoid extra dependencies
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function CustomerSelector() {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Debounce the search term by 500ms
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Store access
  const currentOrder = usePosStore(state => state.currentOrder);
  const setCustomer = usePosStore(state => state.setCustomer);
  // const getBusinessConfig = usePosStore(state => state.getBusinessConfig);

  // -------------------------------------------------------
  // 1. Local Store Query (via usePosCustomers)
  // -------------------------------------------------------
  const { customers: localCustomers, isSyncing } = usePosCustomers({
    search: debouncedSearchTerm,
    enabled: open, // Only filter/search when open
  });

  const searchResults: SearchResultCustomer[] = localCustomers.map(c => ({
    id: c.id,
    name: c.name,
    email: c.email || null,
    phone: c.phone || null,
    loyaltyPoints: c.loyaltyPoints || 0,
    customerType: c.customerType || null,
    businessAccountId: c.businessAccountId || null,
    company: c.company || null,
    // Derive type if not present. simplified logic:
    type: c.customerType === 'business' || c.businessAccountId ? 'B2B' : 'B2C',
    // Derive primary address
    primaryAddress: c.addresses?.find((a: any) => a.isDefault)?.street1 || c.addresses?.[0]?.street1 || null,
  }));

  const isLoading = isSyncing && localCustomers.length === 0;
  const isFetching = isSyncing;

  // -------------------------------------------------------
  // 2. Selection Logic
  // -------------------------------------------------------
  // Find the selected customer object. Check search results first, then fallback to store.
  const selectedCustomer = searchResults.find(c => c.id === currentOrder.customerId);

  const handleSelectCustomer = (customer: SearchResultCustomer | 'walk-in') => {
    if (customer === 'walk-in') {
      setCustomer({
        id: '',
        name: '',
        email: '',
        phone: '',
        totalPurchases: 0,
        lastVisit: new Date(),
        loyaltyPoints: 0,
        customerType: 'retail',
      });
    } else {
      // Map SearchResultCustomer to Customer interface
      const mappedCustomer: any = {
        id: customer.id,
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone || '',
        totalPurchases: 0, // Default for search result
        lastVisit: new Date(), // Default
        loyaltyPoints: customer.loyaltyPoints,
        customerType: customer.type === 'B2B' ? 'b2b' : 'retail',
        businessName: customer.company || undefined,
      };
      setCustomer(mappedCustomer);
    }
    setOpen(false);
  };

  // -------------------------------------------------------
  // 3. Filtering for UI (B2B vs Retail)
  // -------------------------------------------------------
  const retailResults = searchResults.filter(c => c.type === 'B2C');
  const b2bResults = searchResults.filter(c => c.type === 'B2B');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-transparent"
        >
          {selectedCustomer ? (
            <div className="flex items-center gap-2 overflow-hidden">
              {/* Icon based on Type */}
              {(selectedCustomer as SearchResultCustomer).type === 'B2B' || selectedCustomer.customerType === 'b2b' ? (
                <Building2 className="w-4 h-4 text-primary shrink-0" />
              ) : (
                <User className="w-4 h-4 shrink-0" />
              )}

              <span className="truncate">{selectedCustomer.name}</span>

              {/* B2B Badge */}
              {((selectedCustomer as SearchResultCustomer).type === 'B2B' ||
                selectedCustomer.customerType === 'b2b') && (
                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200 font-medium">
                  B2B
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-4 h-4" />
              <span>Select customer...</span>
            </div>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
            <User className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Search by name, email, phone or address..."
              value={searchTerm}
              onValueChange={setSearchTerm}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            {(isLoading || isFetching) && <Loader2 className="ml-2 h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <CommandList>
            {/* Empty State */}
            {!isLoading && !isFetching && searchResults.length === 0 && (
              <CommandEmpty>{searchTerm ? 'No customer found.' : 'Type to search...'}</CommandEmpty>
            )}

            {/* Walk-In Option */}
            <CommandGroup heading="Quick Select">
              <CommandItem
                value="walk-in-customer"
                onSelect={() => handleSelectCustomer('walk-in')}
                className="cursor-pointer"
              >
                <Check className={cn('mr-2 h-4 w-4', !selectedCustomer ? 'opacity-100' : 'opacity-0')} />
                <div className="flex flex-col">
                  <span className="font-medium">Walk-in Customer</span>
                  <span className="text-xs text-muted-foreground">Guest checkout</span>
                </div>
              </CommandItem>
            </CommandGroup>

            {/* Retail Group */}
            {retailResults.length > 0 && (
              <CommandGroup heading="Retail Customers">
                {retailResults.map(customer => (
                  <CommandItem
                    key={customer.id}
                    value={`${customer.name}-${customer.email || ''}-${customer.phone || ''}-${customer.id}`}
                    onSelect={() => handleSelectCustomer(customer)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn('mr-2 h-4 w-4', selectedCustomer?.id === customer.id ? 'opacity-100' : 'opacity-0')}
                    />
                    <div className="flex flex-col flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">{customer.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{customer.loyaltyPoints} pts</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                        {customer.phone && <span>{customer.phone}</span>}
                        {customer.phone && customer.email && <span>•</span>}
                        {customer.email && <span className="truncate">{customer.email}</span>}
                      </div>

                      {/* Address Display */}
                      {customer.primaryAddress && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{customer.primaryAddress}</span>
                        </div>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* B2B Group */}
            {b2bResults.length > 0 && (
              <CommandGroup heading="B2B Customers">
                {b2bResults.map(customer => (
                  <CommandItem
                    key={customer.id}
                    value={`${customer.name}-${customer.company || ''}-${customer.email || ''}-${customer.phone || ''}-${customer.id}`}
                    onSelect={() => handleSelectCustomer(customer)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn('mr-2 h-4 w-4', selectedCustomer?.id === customer.id ? 'opacity-100' : 'opacity-0')}
                    />
                    <div className="flex flex-col flex-1 overflow-hidden">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="font-medium truncate">{customer.name}</span>
                        </div>
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200 shrink-0">
                          B2B
                        </span>
                      </div>

                      {customer.company && (
                        <div className="text-xs text-muted-foreground font-medium">{customer.company}</div>
                      )}

                      <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                        {customer.phone && <span>{customer.phone}</span>}
                        {customer.phone && customer.email && <span>•</span>}
                        {customer.email && <span className="truncate">{customer.email}</span>}
                      </div>

                      {customer.primaryAddress && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{customer.primaryAddress}</span>
                        </div>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
