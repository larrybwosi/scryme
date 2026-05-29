'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Textarea } from '@repo/ui/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/ui/select';
import { Checkbox } from '@repo/ui/components/ui/checkbox';
import { CrmFieldType } from '../types';
import { cn } from '@repo/ui/lib/utils';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface CrmRecordFormProps {
  object: any;
  fields: any[];
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  mode?: 'create' | 'edit';
  autoSave?: boolean;
}

export function CrmRecordForm({
  object,
  fields,
  initialData,
  onSubmit,
  mode = 'create',
  autoSave = false,
}: CrmRecordFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);

  // Build dynamic schema based on object definition
  const schemaShape: Record<string, any> = {};
  fields.forEach((field: any) => {
    let fieldSchema: any = z.string();

    if (field.type === CrmFieldType.NUMBER) {
      fieldSchema = z.coerce.number();
    } else if (field.type === CrmFieldType.BOOLEAN) {
      fieldSchema = z.boolean();
    } else if (field.type === CrmFieldType.DATE) {
      fieldSchema = z.coerce.date();
    } else if (field.type === CrmFieldType.EMAIL) {
      fieldSchema = z.string().email();
    } else if (field.type === CrmFieldType.URL) {
      fieldSchema = z.string().url();
    }

    if (!field.isRequired) {
      fieldSchema = fieldSchema.optional().nullable();
    }

    schemaShape[field.name] = fieldSchema;
  });

  const schema = z.object(schemaShape);

  const form = useForm({
    resolver: zodResolver(schema as any),
    defaultValues: initialData || {},
  });

  // Handle auto-save
  useEffect(() => {
    if (!autoSave || mode !== 'edit') return;

    // eslint-disable-next-line react-hooks/incompatible-library
    const subscription = form.watch(async (value) => {
      if (form.formState.isDirty && !isSubmitting && !autoSaving) {
        setAutoSaving(true);
        try {
          await onSubmit(value);
          form.reset(value, { keepDirty: false });
        } catch (error) {
          console.error('Auto-save failed:', error);
        } finally {
          setAutoSaving(false);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [autoSave, mode, form, onSubmit, isSubmitting, autoSaving]);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      if (mode === 'create') {
        form.reset();
      }
      toast.success(`Record ${mode === 'create' ? 'created' : 'updated'} successfully`);
    } catch (error) {
      toast.error(`Failed to ${mode === 'create' ? 'create' : 'update'} record`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFieldInput = (field: any, formField: any) => {
    switch (field.type) {
      case 'TEXTAREA' as any:
        return <Textarea {...formField} value={formField.value || ''} />;
      case CrmFieldType.BOOLEAN:
        return (
          <Checkbox
            checked={formField.value}
            onCheckedChange={formField.onChange}
          />
        );
      case CrmFieldType.SELECT:
        return (
          <Select onValueChange={formField.onChange} value={formField.value}>
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: any) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return (
          <Input
            type={field.type === CrmFieldType.NUMBER ? 'number' : 'text'}
            {...formField}
            value={formField.value || ''}
          />
        );
    }
  };

  // Group fields into columns for longer forms
  const groupedFields = fields.reduce(
    (acc: any[][], field: any, index: number) => {
      if (fields.length <= 4) {
        // Single column for short forms
        acc[0].push(field);
      } else {
        // Two columns for longer forms
        const columnIndex = index % 2;
        acc[columnIndex].push(field);
      }
      return acc;
    },
    [[], []]
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Form Fields */}
        <div className={cn(
          'gap-6',
          fields.length > 4 ? 'grid grid-cols-1 md:grid-cols-2' : 'space-y-4'
        )}>
          {fields.length <= 4 ? (
            // Single column layout
            fields.map((field: any) => (
              <FormField
                key={field.id}
                control={form.control}
                name={field.name}
                render={({ field: formField }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      {field.label}
                      {field.isRequired && (
                        <span className="text-destructive">*</span>
                      )}
                    </FormLabel>
                    <FormControl>{renderFieldInput(field, formField)}</FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))
          ) : (
            // Two column layout
            groupedFields.map((columnFields: any[], columnIndex: number) => (
              <div key={columnIndex} className="space-y-4">
                {columnFields.map((field: any) => (
                  <FormField
                    key={field.id}
                    control={form.control}
                    name={field.name}
                    render={({ field: formField }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          {field.label}
                          {field.isRequired && (
                            <span className="text-destructive">*</span>
                          )}
                        </FormLabel>
                        <FormControl>{renderFieldInput(field, formField)}</FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            ))
          )}
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between pt-4 border-t">
          {mode === 'edit' && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {autoSaving ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving changes...
                </>
              ) : (
                <>
                  <Save className="h-3 w-3" />
                  All changes saved
                </>
              )}
            </div>
          )}
          <Button
            type="submit"
            className="ml-auto"
            disabled={isSubmitting || (autoSave && !form.formState.isDirty)}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? 'Create Record' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
