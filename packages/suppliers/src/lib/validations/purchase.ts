import { z } from "zod";

const attachmentSchema = z.object({
  fileUrl: z.string().url(),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive().optional(),
});

const isoDateTransformer = z
  .union([z.string().datetime(), z.date(), z.null(), z.undefined()])
  .transform((val) => {
    if (val instanceof Date) {
      return val.toISOString();
    }
    return val;
  });

export const purchaseItemInputSchema = z.object({
  variantId: z.string().min(1),
  orderedQuantity: z.number().int().min(1),
  orderedUnitId: z.string().min(1),
  taxRateId: z.string().optional().nullable(),
});

export const createPurchaseSchema = z.object({
  supplierId: z.string().min(1),
  expectedDate: isoDateTransformer.optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  items: z.array(purchaseItemInputSchema).min(1),
  attachments: z.array(attachmentSchema).optional(),
  deliveryCost: z.number().min(0).optional().nullable(),
  deliveryExpenseCategoryId: z.string().optional().nullable(),
});

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;
