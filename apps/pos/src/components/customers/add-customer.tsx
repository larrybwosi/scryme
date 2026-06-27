'use client';

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@repo/ui/components/ui/sheet';
import { toast } from 'sonner';
import CustomerForm from './customer-form';
import { useCreateCustomer } from '@/hooks/customers';
import posthog from 'posthog-js';

interface AddCustomerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddCustomerSheet({ open, onOpenChange }: AddCustomerSheetProps) {
  const { mutateAsync: createCustomer, isPending: isCreating } = useCreateCustomer();

  const handleAddCustomer = async (data: unknown) => {
    try {
      await createCustomer(data);
      posthog.capture('customer_created');
      toast.success('Customer added successfully!');
      onOpenChange(false);
    } catch {
      toast.error('Failed to add customer.');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl p-4">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl">Add New Customer</SheetTitle>
          <SheetDescription>
            Fill in the details below to create a new customer profile. Fields marked with{' '}
            <span className="text-red-500">*</span> are required.
          </SheetDescription>
        </SheetHeader>
        <CustomerForm onSubmit={handleAddCustomer} isPending={isCreating} setAddModalOpen={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}
