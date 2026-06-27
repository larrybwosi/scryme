import { z } from "zod";

export const createRawMaterialSchema = z
  .object({
    // Product details
    name: z.string().min(1, "Product name is required"),
    categoryId: z.string().min(1, "Invalid category ID"),
    description: z.string().optional().nullable(),

    // Default variant details
    sku: z.string().min(1, "SKU is required").optional(),
    buyingPrice: z.coerce.number().min(0).default(0),
    reorderPoint: z.coerce.number().int().min(0).default(5),

    // Base Unit (Mutually Exclusive)
    baseUnitId: z.string().optional(),
    baseOrgUnitId: z.string().optional(),

    // Stocking Unit (Optional, Mutually Exclusive)
    stockingUnitId: z.string().optional(),
    stockingOrgUnitId: z.string().optional(),
    unitsPerContainer: z.coerce.number().min(0).optional(),

    // Optional Initial Stock
    initialStock: z.coerce.number().int().min(0).optional().nullable(),
    initialStockLocationId: z.string().optional(),
  })
  .refine(
    (data) => {
      // Enforce mutual exclusion for unit IDs
      return (
        (data.baseUnitId && !data.baseOrgUnitId) ||
        (!data.baseUnitId && data.baseOrgUnitId)
      );
    },
    {
      message:
        "Either a baseUnitId (system unit) or a baseOrgUnitId (organization unit) must be provided, but not both.",
      path: ["baseUnitId"],
    },
  )
  .refine(
    (data) => {
      // If initialStock is provided (and > 0), locationId must also be provided.
      if (data.initialStock && data.initialStock > 0) {
        return !!data.initialStockLocationId;
      }
      // If initialStockLocationId is provided, initialStock > 0 must be provided.
      if (data.initialStockLocationId) {
        return data.initialStock && data.initialStock > 0;
      }
      // If neither is provided, or stock is 0, it's valid.
      return true;
    },
    {
      message:
        "If providing initialStock > 0, initialStockLocationId is required, and vice-versa.",
      path: ["initialStock"],
    },
  );

// Assuming CreateRawMaterialInput type
export type CreateRawMaterialInput = z.infer<typeof createRawMaterialSchema>;

// (updateRawMaterialSchema remains unchanged as requested, but if you want to update
// units, you'd apply a similar .refine() logic there too)
export const updateRawMaterialSchema = z
  .object({
    // Made optional so the function can default to the first variant
    variantId: z.string().optional(),

    // Fields for the Product model
    name: z.string().min(1).optional(),
    categoryId: z.string().optional(),
    description: z.string().nullable().optional(),

    // Fields for the ProductVariant model
    sku: z.string().min(1).optional(),
    buyingPrice: z.coerce.number().min(0).optional(),
    reorderPoint: z.coerce.number().int().min(0).optional(),

    // Updated unit fields for the update schema
    baseUnitId: z.string().optional(),
    baseOrgUnitId: z.string().optional(),

    // Stocking unit fields
    stockingUnitId: z.string().optional(),
    stockingOrgUnitId: z.string().optional(),
    unitsPerContainer: z.coerce.number().min(0).optional(),
  })
  .refine(
    (data) => {
      // Prevent setting both at the same time during an update
      if (data.baseUnitId && data.baseOrgUnitId) {
        return false;
      }
      if (data.stockingUnitId && data.stockingOrgUnitId) {
        return false;
      }
      return true;
    },
    {
      message:
        "Cannot provide both baseUnitId and baseOrgUnitId in a single update.",
      path: ["baseUnitId"],
    },
  );

/**
 * Schema for UPDATING a raw material.
 * This allows updating fields on both the Product and its
 * specific ProductVariant.
 */

export type UpdateRawMaterialInput = z.infer<typeof updateRawMaterialSchema>;

/**
 * Schema for fetching or deleting a single raw material.
 * We use the Product ID.
 */
export const rawMaterialIdSchema = z.object({
  id: z.string().min(1, "Invalid product ID"),
  organizationId: z.string().min(1, "Invalid organization ID"),
});

export type RawMaterialIdInput = z.infer<typeof rawMaterialIdSchema>;

/**
 * Schema for listing/searching raw materials.
 */
export const listRawMaterialsSchema = z.object({
  organizationId: z.string().min(1, "Invalid organization ID"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  categoryId: z.string().optional(),
});

export type ListRawMaterialsInput = z.infer<typeof listRawMaterialsSchema>;

/**
 * Schema for the AI generation endpoint.
 * It just takes the organizationId and the user's natural language prompt.
 */
export const generateRawMaterialFromPromptSchema = z.object({
  organizationId: z.string().min(1, "Invalid organization ID"),
  memberId: z.string().min(1, "Invalid member ID"),
  prompt: z.string().min(10, "Prompt must be at least 10 characters long"),
});

export type GenerateRawMaterialFromPromptInput = z.infer<
  typeof generateRawMaterialFromPromptSchema
>;

// Helper to sanitize strings from AI output
const sanitizeString = (str: string | undefined) => {
  if (!str) return str;
  // Simple HTML tag removal. For true XSS prevention, use a library like DOMPurify.
  return str.replace(/<[^>]*>?/gm, "");
};

/**
 * NEW: Schema for the AI's direct output.
 * We expect names, not IDs. We also sanitize and clamp values.
 */
export const aiGenerationSchema = z.object({
  name: z.string().min(1).transform(sanitizeString),
  categoryName: z
    .string()
    .min(1, "Category name is required")
    .transform(sanitizeString),
  description: z.string().transform(sanitizeString).optional().nullable(),
  sku: z.string().optional().nullable(),
  buyingPrice: z.coerce.number().min(0).max(10000000),
  reorderPoint: z.coerce.number().int().min(0).max(100000),
  baseUnitName: z
    .string()
    .min(1, "Base unit name is required (e.g., kg, item, L)"),
  initialStock: z.coerce
    .number()
    .int()
    .min(0)
    .max(1000000)
    .optional()
    .nullable(),
});

export type AiGenerationOutput = z.infer<typeof aiGenerationSchema>;
