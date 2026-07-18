'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerSchema, type CustomerFormValues } from '../../../lib/validations';
import { createCustomer, updateCustomer, getLocations } from '../../actions/customers';
import { useOrg } from '../../../components/org-context';
import useSWR from 'swr';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/components/ui/form';
import { Input } from '@repo/ui/components/ui/input';
import { Button } from '@repo/ui/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/ui/select';
import { Textarea } from '@repo/ui/components/ui/textarea';

interface CustomerFormProps {
  initialData?: CustomerFormValues & { id: string };
  onSuccess: () => void;
  type?: 'B2C' | 'CONTACT';
}

export function CustomerForm({ initialData, onSuccess, type = 'B2C' }: CustomerFormProps) {
  const { organizationId } = useOrg();
  const { data: locations = [] } = useSWR(
    organizationId ? ['locations-for-select', organizationId] : null,
    () => getLocations(organizationId)
  );

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      company: initialData?.company || '',
      customerType: initialData?.customerType || type,
      taxId: initialData?.taxId || '',
      isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
      deliveryNotes: initialData?.deliveryNotes || '',
      customId: initialData?.customId || '',
      creationType: initialData?.creationType || 'MEMBER_CREATED',
      defaultLocationId: initialData?.defaultLocationId || '',
    },
  });

  const onSubmit = async (values: CustomerFormValues) => {
    try {
      const payload = {
        ...values,
        businessAccountId: initialData?.businessAccountId,
        customerType: initialData?.customerType || type,
        isActive: values.isActive ?? initialData?.isActive ?? true,
      };
      if (initialData?.id) {
        await updateCustomer(initialData.id, payload);
      } else {
        await createCustomer(payload, organizationId);
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save customer', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="john@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input placeholder="+1234567890" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="company"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>Company</FormLabel>
              <FormControl>
                <Input placeholder="Acme Inc" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* For B2C individuals, the type is fixed as B2C to maintain view consistency */}
        <FormField
          control={form.control}
          name="customId"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>Custom Customer ID / Code</FormLabel>
              <FormControl>
                <Input placeholder="e.g. CUST-5001 (Leave blank to auto-generate)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="taxId"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>Tax ID (PIN)</FormLabel>
              <FormControl>
                <Input placeholder="KRA PIN" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="creationType"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>Acquisition Channel</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select channel" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="MEMBER_CREATED">Member Created</SelectItem>
                  <SelectItem value="SELF_REGISTERED">Self Registered</SelectItem>
                  <SelectItem value="IMPORTED">Imported</SelectItem>
                  <SelectItem value="API_CREATED">API Created</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="defaultLocationId"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>Default Branch</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || "none"}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select default branch" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">No default branch</SelectItem>
                  {locations.map((loc: any) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={(val) => field.onChange(val === 'true')} value={field.value ? 'true' : 'false'}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="deliveryNotes"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>Delivery Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Specific instructions for delivery..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="pt-4 flex justify-end gap-3">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {initialData ? 'Update' : 'Create'} Customer
          </Button>
        </div>
      </form>
    </Form>
  );
}
