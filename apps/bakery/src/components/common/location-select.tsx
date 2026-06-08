"use client";

import { Check, ChevronsUpDown, MapPin, Loader2, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@repo/ui/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@repo/ui/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/ui/popover";
import { useListLocations } from "@/lib/api/locations";
import { useMemo, useState } from "react";

// --- Types ---

interface Location {
  id: string;
  name: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  city?: string;
  country?: string;
}

interface LocationSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  excludeLocation?: string;
  /**
   * Callback for the custom checkout action.
   * If provided, the checkout option will appear in the dropdown.
   */
  onCheckoutAction?: () => void;
}

// --- Component ---

export const LocationSelect: React.FC<LocationSelectProps> = ({
  value,
  onValueChange,
  placeholder = "Select a location...",
  disabled = false,
  excludeLocation,
  onCheckoutAction,
}) => {
  const [open, setOpen] = useState(false);
  const { data: locations, isLoading, error } = useListLocations() as any;

  // Filter out excluded locations
  const filteredLocations = useMemo(() => {
    if (!locations?.locations) return [];
    return excludeLocation
      ? locations.locations.filter((loc: any) => loc.id !== excludeLocation)
      : locations.locations;
  }, [locations, excludeLocation]);

  // Find the currently selected location object for display
  const selectedLocation = useMemo(() => {
    return filteredLocations.find((loc: any) => loc.id === value);
  }, [filteredLocations, value]);

  // Helper to format address
  const formatAddress = (location: Location): string => {
    if (location.address) {
      const { city, state, country } = location.address;
      // Shorter address format for the dropdown list to save space
      const parts = [city, state, country].filter(Boolean);
      return parts.join(", ");
    }
    const parts = [location.city, location.country].filter(Boolean);
    return parts.join(", ");
  };

  // --- Loading State ---
  if (isLoading) {
    return (
      <Button
        variant="outline"
        disabled
        className="w-full justify-between cursor-not-allowed opacity-70"
      >
        <span className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading locations...
        </span>
        <ChevronsUpDown className="h-4 w-4 opacity-50" />
      </Button>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <Button
        variant="destructive"
        className="w-full justify-between border-destructive text-destructive hover:bg-destructive/10"
      >
        <span className="flex items-center gap-2">Error loading locations</span>
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
          disabled={disabled || filteredLocations.length === 0}
          className={cn(
            "w-full justify-between bg-background hover:bg-accent hover:text-accent-foreground",
            !value && "text-muted-foreground",
          )}
        >
          {selectedLocation ? (
            <span className="flex items-center gap-2 truncate">
              <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="font-medium">{selectedLocation.name}</span>
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
          <CommandInput placeholder="Search location..." className="h-9" />

          <CommandList>
            <CommandEmpty>No location found.</CommandEmpty>

            <CommandGroup heading="Available Locations">
              {filteredLocations.map((location: any) => (
                <CommandItem
                  key={location.id}
                  value={location.name} // Used for search filtering
                  onSelect={() => {
                    onValueChange?.(location.id);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <div className="flex flex-col w-full">
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium text-foreground">
                        {location.name}
                      </span>
                      {value === location.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground truncate max-w-60">
                      {formatAddress(location as any)}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>

            {/* Actions Section */}
            {onCheckoutAction && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Actions">
                  {onCheckoutAction && (
                    <CommandItem
                      onSelect={() => {
                        onCheckoutAction();
                        setOpen(false);
                      }}
                      className="text-orange-600 dark:text-orange-400 cursor-pointer aria-selected:bg-orange-100 dark:aria-selected:bg-orange-900/30"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Checkout Member</span>
                    </CommandItem>
                  )}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
