import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select';
import { cn } from '@/lib/utils';
import { Skeleton } from '@repo/ui/components/ui/skeleton';
import { Alert, AlertDescription } from '@repo/ui/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useSuppliers } from '@/lib/api/suppliers';

interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface SupplierSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export const SupplierSelect: React.FC<SupplierSelectProps> = ({
  value,
  onValueChange,
  placeholder = 'Select a supplier',
  disabled = false,
  required = false,
  className,
}) => {
  const { data: suppliersResponse, isLoading: loadingSuppliers, error } = useSuppliers();

  const suppliers: Supplier[] = ((suppliersResponse as any)?.data || suppliersResponse) || [];

  if (loadingSuppliers) {
    return <Skeleton className={cn("h-10 w-full", className)} />;
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Error loading suppliers</AlertDescription>
      </Alert>
    );
  }

  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      required={required}
    >
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {suppliers.map(supplier => (
          <SelectItem key={supplier.id} value={supplier.id}>
            <div className="flex flex-col">
              <span className="font-medium">{supplier.name}</span>
            </div>
          </SelectItem>
        ))}
        {suppliers.length === 0 && (
          <div className="p-2 text-sm text-center text-muted-foreground">
            No suppliers found
          </div>
        )}
      </SelectContent>
    </Select>
  );
};
