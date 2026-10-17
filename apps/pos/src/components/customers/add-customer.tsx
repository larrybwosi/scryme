'use client';

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@repo/ui/components/ui/sheet';
import { toast } from 'sonner';
import CustomerForm from './customer-form';
import { useCreateCustomer, useUpdateCustomer } from '@/hooks/customers';
import { trackPosEvent, POS_EVENTS } from '@/lib/openpanel';

interface AddCustomerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: any;
}

export default function AddCustomerSheet({ open, onOpenChange, customer }: AddCustomerSheetProps) {
  const { mutateAsync: createCustomer, isPending: isCreating } = useCreateCustomer();
  const { mutateAsync: updateCustomer, isPending: isUpdating } = useUpdateCustomer();

  const handleAddCustomer = async (data: any) => {
    try {
      if (customer?.id) {
        await updateCustomer({ id: customer.id, ...data });
        trackPosEvent(POS_EVENTS.CUSTOMER_UPDATED, {
          customer_id: customer.id,
          customer_type: data.customerType || 'B2C',
          has_phone: !!data.phone,
          has_email: !!data.email,
          source: 'sheet',
        });
        toast.success('Customer updated successfully!');
      } else {
        await createCustomer(data);
        trackPosEvent(POS_EVENTS.CUSTOMER_CREATED, {
          customer_type: data.customerType || 'B2C',
          has_phone: !!data.phone,
          has_email: !!data.email,
          source: 'sheet',
        });
        toast.success('Customer added successfully!');
      }
      onOpenChange(false);
    } catch {
      toast.error(customer?.id ? 'Failed to update customer.' : 'Failed to add customer.');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl p-4 overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl">{customer ? 'Edit Customer' : 'Add New Customer'}</SheetTitle>
          <SheetDescription>
            {customer ? 'Update the details of the customer profile.' : 'Fill in the details below to create a new customer profile.'} Fields marked with{' '}
            <span className="text-red-500">*</span> are required.
          </SheetDescription>
        </SheetHeader>
        <CustomerForm
          customer={customer}
          onSubmit={handleAddCustomer}
          isPending={isCreating || isUpdating}
          setAddModalOpen={() => onOpenChange(false)}
          setEditModalOpen={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
