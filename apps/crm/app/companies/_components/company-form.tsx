'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { businessAccountSchema, type BusinessAccountFormValues } from '../../../lib/validations';
import { createCompany, updateCompany } from '../../actions/companies';
import { useOrg } from '../../../components/org-context';
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

interface CompanyFormProps {
  initialData?: BusinessAccountFormValues & { id: string };
  onSuccess: () => void;
}

export function CompanyForm({ initialData, onSuccess }: CompanyFormProps) {
  const { organizationId } = useOrg();
  const form = useForm<BusinessAccountFormValues>({
    resolver: zodResolver(businessAccountSchema),
    defaultValues: initialData || {
      name: '',
      taxId: '',
    },
  });

  const onSubmit = async (values: BusinessAccountFormValues) => {
    try {
      if (initialData) {
        await updateCompany(initialData.id, values);
      } else {
        await createCompany(values, organizationId);
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save company', error);
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
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="Acme Corp" {...field} />
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
              <FormLabel>Tax ID</FormLabel>
              <FormControl>
                <Input placeholder="Tax ID / Registration Number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="pt-4 flex justify-end gap-3">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {initialData ? 'Update' : 'Create'} Company
          </Button>
        </div>
      </form>
    </Form>
  );
}
