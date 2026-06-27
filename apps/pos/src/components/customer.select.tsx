'use client';

import { useState, useEffect, useMemo } from 'react';
import { Check, ChevronsUpDown, User, Building2, MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@repo/ui/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@repo/ui/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/components/ui/popover';
import { usePosCustomers } from '@/hooks/customers';

// Define the shape based on your Prisma return type
export type SearchResultCustomer = {
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
  addresses: any[]; // The raw addresses array
};

// Custom debounce hook
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

interface CustomerSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  /** Optional: Callback to receive the full customer object upon selection */
  onSelect?: (customer: any) => void;
  className?: string;
}

export function CustomerSelect({ value, onValueChange, onSelect, className }: CustomerSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Local state to store the full object of the selected customer
  // This ensures we can display the name even if they aren't in the current search results
  const [selectedCustomer, setSelectedCustomer] = useState<SearchResultCustomer | null>(null);

  // Debounce the search term by 500ms
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // -------------------------------------------------------
  // 1. Local Store Query (via usePosCustomers)
  // -------------------------------------------------------
  const { customers: localCustomers, isSyncing } = usePosCustomers({
    search: debouncedSearchTerm,
    enabled: open, // Only filter/search when open
  });

  // console.log("localCustomers", localCustomers);
  const searchResults: SearchResultCustomer[] = useMemo(
    () =>
      localCustomers.map(c => ({
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
        addresses: c.addresses || [],
      })),
    [localCustomers]
  );

  const isLoading = isSyncing && localCustomers.length === 0;
  const isFetching = isSyncing;

  // -------------------------------------------------------
  // 2. Sync State Logic
  // -------------------------------------------------------

  // If the parent passes a value (ID) that matches a result in our current search list,
  // update our local display object. This helps keeps the UI in sync.
  useEffect(() => {
    if (value && searchResults.length > 0) {
      const found = searchResults.find(c => c.id === value);
      // Only update if the found customer is different from the currently selected one (by ID)
      if (found && found.id !== selectedCustomer?.id) {
        setSelectedCustomer(found);
      }
    }
  }, [value, searchResults, selectedCustomer?.id]);

  // If the value is cleared externally, clear the local selection
  useEffect(() => {
    if (!value) {
      setSelectedCustomer(null);
    }
  }, [value]);

  // -------------------------------------------------------
  // 3. Selection Handler
  // -------------------------------------------------------
  const handleSelectCustomer = (customer: SearchResultCustomer | 'walk-in') => {
    if (customer === 'walk-in') {
      onValueChange('walk-in');
      setSelectedCustomer(null);

      if (onSelect) {
        onSelect({ id: 'walk-in', name: 'Walk-in Customer', customerType: 'retail' });
      }
    } else {
      // 1. Notify Parent of ID Change
      onValueChange(customer.id);

      // 2. Update Local Display
      setSelectedCustomer(customer);

      // 3. Notify Parent of Full Object (if needed)
      if (onSelect) {
        const mappedCustomer = {
          id: customer.id,
          name: customer.name,
          email: customer.email || '',
          phone: customer.phone || '',
          loyaltyPoints: customer.loyaltyPoints,
          customerType: customer.type === 'B2B' ? 'b2b' : 'retail',
          businessName: customer.company || undefined,
          primaryAddress: customer.primaryAddress,
          addresses: customer.addresses,
        };
        onSelect(mappedCustomer);
      }
    }
    setOpen(false);
  };

  // -------------------------------------------------------
  // 4. Filtering for UI (B2B vs Retail)
  // -------------------------------------------------------
  const retailResults = searchResults.filter(c => c.type === 'B2C');
  const b2bResults = searchResults.filter(c => c.type === 'B2B');

  const isWalkIn = value === 'walk-in';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between bg-transparent', className)}
        >
          {selectedCustomer ? (
            <div className="flex items-center gap-2 overflow-hidden text-left">
              {/* Icon based on Type */}
              {selectedCustomer.type === 'B2B' ? (
                <Building2 className="w-4 h-4 text-primary shrink-0" />
              ) : (
                <User className="w-4 h-4 shrink-0" />
              )}

              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm leading-none">{selectedCustomer.name}</span>
                {selectedCustomer.company && (
                  <span className="text-[10px] text-muted-foreground truncate leading-none mt-1">
                    {selectedCustomer.company}
                  </span>
                )}
              </div>

              {/* B2B Badge */}
              {selectedCustomer.type === 'B2B' && (
                <span className="ml-auto text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200 font-medium shrink-0">
                  B2B
                </span>
              )}
            </div>
          ) : isWalkIn ? (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Walk-in Customer</span>
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
                <Check className={cn('mr-2 h-4 w-4', isWalkIn ? 'opacity-100' : 'opacity-0')} />
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
                    value={customer.id}
                    onSelect={() => handleSelectCustomer(customer)}
                    className="cursor-pointer"
                  >
                    <Check className={cn('mr-2 h-4 w-4', value === customer.id ? 'opacity-100' : 'opacity-0')} />
                    <div className="flex flex-col flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">{customer.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{customer.loyaltyPoints} pts</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                        {customer.phone && <span>{customer.phone}</span>}
                        {customer.email && <span className="truncate">• {customer.email}</span>}
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

            {/* B2B Group */}
            {b2bResults.length > 0 && (
              <CommandGroup heading="B2B Customers">
                {b2bResults.map(customer => (
                  <CommandItem
                    key={customer.id}
                    value={customer.id}
                    onSelect={() => handleSelectCustomer(customer)}
                    className="cursor-pointer"
                  >
                    <Check className={cn('mr-2 h-4 w-4', value === customer.id ? 'opacity-100' : 'opacity-0')} />
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
                        {customer.email && <span className="truncate">• {customer.email}</span>}
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
