import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  customerType: z.string().optional(),
  taxId: z.string().optional(),
  isActive: z.boolean().default(true),
  deliveryNotes: z.string().optional(),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

export const businessAccountSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  taxId: z.string().optional(),
});

export type BusinessAccountFormValues = z.infer<typeof businessAccountSchema>;

export const crmNoteSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  recordId: z.string().min(1, 'Record ID is required'),
});

export type CrmNoteFormValues = z.infer<typeof crmNoteSchema>;

export const crmActivitySchema = z.object({
  type: z.string().min(1, 'Type is required'),
  description: z.string().optional(),
  recordId: z.string().min(1, 'Record ID is required'),
  metadata: z.any().optional(),
});

export type CrmActivityFormValues = z.infer<typeof crmActivitySchema>;

export const crmObjectDefinitionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  label: z.string().min(1, 'Label is required'),
  labelPlural: z.string().min(1, 'Plural label is required'),
  description: z.string().optional(),
  icon: z.string().optional(),
});

export type CrmObjectDefinitionFormValues = z.infer<typeof crmObjectDefinitionSchema>;

export const crmFollowUpSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  dueDate: z.coerce.date(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  status: z.enum(['PENDING', 'COMPLETED', 'OVERDUE', 'CANCELLED']).default('PENDING'),
  recordId: z.string().min(1, 'Record ID is required'),
  assignedToId: z.string().optional().nullable(),
});

export type CrmFollowUpFormValues = z.infer<typeof crmFollowUpSchema>;
