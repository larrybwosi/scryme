'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { campaignSegmentSchema, type CampaignSegmentFormValues } from '@/lib/validations';
import { createSegment } from '@/app/actions/campaigns';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@repo/ui/components/ui/form';
import { Input } from '@repo/ui/components/ui/input';
import { Textarea } from '@repo/ui/components/ui/textarea';
import { Button } from '@repo/ui/components/ui/button';
import { toast } from 'sonner';

interface SegmentFormProps {
  organizationId: string;
  onSuccess: () => void;
}

export function SegmentForm({ organizationId, onSuccess }: SegmentFormProps) {
  const form = useForm<CampaignSegmentFormValues>({
    resolver: zodResolver(campaignSegmentSchema),
    defaultValues: {
      name: '',
      description: '',
      filters: { conditions: [], logic: 'AND' },
    },
  });

  const onSubmit = async (values: CampaignSegmentFormValues) => {
    try {
      const result = await createSegment(values, organizationId);
      if (result.success) {
        toast.success('Segment created successfully');
        onSuccess();
      } else {
        toast.error(result.error || 'Failed to create segment');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>Segment Name</FormLabel>
              <FormControl>
                <Input placeholder="High Value Customers" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Customers with >$1000 spend..." {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="p-4 bg-slate-50 rounded-lg border border-dashed text-center">
           <p className="text-xs text-muted-foreground">Filter builder UI will be implemented here.</p>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Creating...' : 'Create Segment'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
