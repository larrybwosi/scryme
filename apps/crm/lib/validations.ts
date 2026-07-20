import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  businessAccountId: z.string().optional().nullable(),
  customerType: z.string().optional(),
  taxId: z.string().optional(),
  isActive: z.boolean().default(true),
  deliveryNotes: z.string().optional(),
  customId: z.string().optional().or(z.literal('')),
  creationType: z.enum(['MEMBER_CREATED', 'SELF_REGISTERED', 'IMPORTED', 'API_CREATED', 'OTHER']).optional(),
  defaultLocationId: z.string().optional().nullable(),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

export const businessAccountSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  taxId: z.string().optional().nullable(),
  logoUrl: z.string().url('Invalid URL').optional().or(z.literal('')).nullable(),
  customTheme: z.string().optional().nullable(),
  isEnterprise: z.boolean().default(false),
  discountPercentage: z.coerce.number().min(0).max(100).optional().nullable(),
  paymentTermsDays: z.coerce.number().int().min(0).optional().nullable(),
  contacts: z.array(z.object({
    contactId: z.string().optional(),
    name: z.string().min(1, 'Name is required'),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
  })).optional(),
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
  type: z.enum(['CALL', 'MEETING', 'EMAIL', 'PREPARATION', 'OTHER']).default('OTHER'),
  recordId: z.string().min(1, 'Record ID is required'),
  assignedToId: z.string().optional().nullable(),
  locationId: z.string().optional().nullable(),
  isRecurring: z.boolean().default(false),
  recurringInterval: z.string().optional().nullable(),
});

export type CrmFollowUpFormValues = z.infer<typeof crmFollowUpSchema>;

export const campaignSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  channel: z.enum(['EMAIL', 'SMS', 'IN_PERSON', 'IN_APP', 'WEBHOOK']),
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']).default('DRAFT'),
  segmentId: z.string().optional().nullable(),
  workflowId: z.string().optional().nullable(),
  scheduledAt: z.coerce.date().optional().nullable(),
});

export type CampaignFormValues = z.infer<typeof campaignSchema>;

export const campaignSegmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  filters: z.any(),
});

export type CampaignSegmentFormValues = z.infer<typeof campaignSegmentSchema>;

export const campaignWorkflowSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  nodes: z.any(),
  edges: z.any(),
  isActive: z.boolean().default(false),
});

export type CampaignWorkflowFormValues = z.infer<typeof campaignWorkflowSchema>;
