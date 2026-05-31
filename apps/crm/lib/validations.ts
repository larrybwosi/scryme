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
