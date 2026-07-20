'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { campaignWorkflowSchema, type CampaignWorkflowFormValues } from '@/lib/validations';
import { createWorkflow } from '@/app/actions/campaigns';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@repo/ui/components/ui/form';
import { Input } from '@repo/ui/components/ui/input';
import { Button } from '@repo/ui/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface WorkflowFormProps {
  onSuccess: (id: string) => void;
}

export function WorkflowForm({ onSuccess }: WorkflowFormProps) {
  const router = useRouter();
  const form = useForm<CampaignWorkflowFormValues>({
    resolver: zodResolver(campaignWorkflowSchema),
    defaultValues: {
      name: '',
      nodes: [
        {
          id: '1',
          type: 'trigger',
          data: { label: 'New Customer Created', description: 'Triggers when a new customer is added to CRM' },
          position: { x: 250, y: 50 },
        }
      ],
      edges: [],
      isActive: false,
    },
  });

  const onSubmit = async (values: CampaignWorkflowFormValues) => {
    try {
      const result = await createWorkflow(values);
      if (result.success) {
        toast.success('Workflow created successfully');
        onSuccess(result.data.id);
      } else {
        toast.error(result.error || 'Failed to create workflow');
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
              <FormLabel>Workflow Name</FormLabel>
              <FormControl>
                <Input placeholder="Welcome Sequence" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Creating...' : 'Create & Open Editor'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
