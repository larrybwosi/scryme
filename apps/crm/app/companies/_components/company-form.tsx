'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray } from 'react-hook-form';
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
import { Plus, Trash2, Contact, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";

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
      contacts: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "contacts",
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
              <FormLabel>Company Name <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input placeholder="Acme Corp" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="logoUrl"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>Logo URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/logo.png" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="customTheme"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Custom Theme/Color (Hex)</FormLabel>
                <FormControl>
                  <Input placeholder="#000000" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isEnterprise"
            render={({ field }: { field: any }) => (
              <FormItem className="flex flex-col pt-2.5">
                <FormLabel className="mb-2">Enterprise Plan</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!field.value}
                      onChange={field.onChange}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30"
                    />
                    <span className="text-[13px] text-muted-foreground">Enable enterprise SLA & customization</span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="discountPercentage"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>B2B Discount (%)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" max="100" placeholder="0.00" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="paymentTermsDays"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Payment Terms (Days)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" placeholder="e.g. 30" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
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

        {!initialData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-2">
                <Contact size={16} className="text-muted-foreground" />
                <h3 className="text-sm font-semibold">Contacts</h3>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ name: '', email: '', phone: '' })}
                className="h-8 text-[12px]"
              >
                <Plus size={14} className="mr-1" /> Add Contact
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="p-3 border border-border rounded-lg bg-muted/30 space-y-3 relative group">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove contact"
                      >
                        <Trash2 size={14} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Remove contact</TooltipContent>
                  </Tooltip>
                  <FormField
                    control={form.control}
                    name={`contacts.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Contact Name" {...field} className="h-8 text-[13px]" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name={`contacts.${index}.email`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Email" {...field} className="h-8 text-[13px]" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`contacts.${index}.phone`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Phone" {...field} className="h-8 text-[13px]" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 flex justify-end gap-3">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {initialData ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>{initialData ? 'Update' : 'Create'} Company</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
