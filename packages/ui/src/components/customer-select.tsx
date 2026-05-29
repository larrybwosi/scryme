'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, User, Loader2, Plus } from 'lucide-react';

import { cn } from '../lib/utils';
import { Button } from './ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

// --- Types ---

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
}

interface CustomerSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  excludeCustomer?: string;
  showAddress?: boolean;
  customers: Customer[];
  isLoading?: boolean;
  error?: any;
  /**
   * Callback for a custom action at the bottom of the list.
   * Useful for "Create New Customer" or "Manage Customers".
   */
  onCreateAction?: () => void;
}

// --- Component ---

export const CustomerSelect: React.FC<CustomerSelectProps> = ({
  value,
  onValueChange,
  placeholder = 'Select a customer...',
  disabled = false,
  required = false,
  excludeCustomer,
  showAddress = false,
  customers,
  isLoading = false,
  error,
  onCreateAction,
}) => {
  const [open, setOpen] = React.useState(false);

  // Filter out excluded customers
  const filteredCustomers = React.useMemo(() => {
    if (!customers) return [];
    return excludeCustomer ? customers.filter(c => c.id !== excludeCustomer) : customers;
  }, [customers, excludeCustomer]);

  // Find the currently selected customer object for display
  const selectedCustomer = React.useMemo(() => {
    return filteredCustomers.find(c => c.id === value);
  }, [filteredCustomers, value]);

  // Helper to check if address exists
  const hasAddressDetails = (customer: Customer): boolean => {
    return !!(
      customer.address &&
      (customer.address.street || customer.address.city || customer.address.state || customer.address.zipCode)
    );
  };

  // Helper to format details (Address vs Contact Info)
  const formatCustomerDetails = (customer: Customer): string => {
    if (showAddress && hasAddressDetails(customer) && customer.address) {
      const addressParts = [customer.address.city, customer.address.state].filter(Boolean);

      // If city/state are empty, try street
      if (addressParts.length === 0 && customer.address.street) {
        return customer.address.street;
      }

      return addressParts.join(', ');
    }

    // Fallback to Contact Info
    const details = [customer.company, customer.email || customer.phone].filter(Boolean);
    return details.join(' • ');
  };

  // --- Loading State ---
  if (isLoading) {
    return (
      <Button variant="outline" disabled className="w-full justify-between cursor-not-allowed opacity-70">
        <span className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading customers...
        </span>
        <ChevronsUpDown className="h-4 w-4 opacity-50" />
      </Button>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <Button
        variant="outline"
        className="w-full justify-between border-destructive text-destructive hover:bg-destructive/10"
      >
        <span className="flex items-center gap-2">Error loading customers</span>
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || filteredCustomers.length === 0}
          className={cn(
            'w-full justify-between bg-background hover:bg-accent hover:text-accent-foreground',
            !value && 'text-muted-foreground'
          )}
        >
          {selectedCustomer ? (
            <span className="flex items-center gap-2 truncate">
              <User className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="font-medium">{selectedCustomer.name}</span>
            </span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          {/* Native filtering input */}
          <CommandInput placeholder="Search customers..." className="h-9" />

          <CommandList>
            <CommandEmpty>No customer found.</CommandEmpty>

            <CommandGroup heading="Customers">
              {filteredCustomers.map(customer => (
                <CommandItem
                  key={customer.id}
                  value={customer.name} // Used for search filtering
                  onSelect={() => {
                    onValueChange?.(customer.id);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <div className="flex flex-col w-full overflow-hidden">
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium text-foreground truncate">{customer.name}</span>
                      {value === customer.id && <Check className="h-4 w-4 text-primary shrink-0 ml-2" />}
                    </div>
                    <span className="text-xs text-muted-foreground truncate">{formatCustomerDetails(customer)}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>

            {/* Actions Section */}
            {onCreateAction && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Actions">
                  <CommandItem
                    onSelect={() => {
                      onCreateAction();
                      setOpen(false);
                    }}
                    className="text-primary cursor-pointer aria-selected:bg-primary/10"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    <span>Create New Customer</span>
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
