import { z } from "zod";
import {
  BatchStatus,
  DisposalReason,
  ExpirationStatus,
  RecipeDifficulty,
} from "@/prisma/enums";

// --- Shared Helper Schemas ---

export const ingredientSchema = z
  .object({
    id: z.string().optional(),
    ingredientVariantId: z
      .string()
      .min(1, "A valid product variant must be selected"),
    quantity: z.coerce.number().positive("Quantity must be a positive number"),
    systemUnitId: z.string().optional().nullable(),
    orgUnitId: z.string().optional().nullable(),
    preparationNotes: z.string().optional().nullable(),
  })
  .refine((data) => data.systemUnitId || data.orgUnitId, {
    message:
      "At least one unit (system or organization) must be selected for the ingredient",
  });

export const scheduleDaysSchema = z
  .array(
    z.union([
      z.enum([
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ]),
      z.number().int().min(0).max(6),
    ]),
  )
  .min(1, "At least one day must be selected")
  .optional()
  .nullable();

// --- Recipe Schemas ---

const baseRecipeSchema = z.object({
  name: z.string().min(1, "Recipe name is required"),
  categoryId: z.string().min(1, "A valid category must be selected"),
  yieldQuantity: z.coerce
    .number()
    .positive("Yield quantity must be a positive number"),
  systemUnitId: z.string().optional().nullable(),
  orgUnitId: z.string().optional().nullable(),
  costPrice: z.coerce.number().optional().nullable(),
  prepTime: z.coerce.number().int().optional().nullable(),
  bakeTime: z.coerce.number().int().optional().nullable(),
  totalTime: z.coerce.number().int().optional().nullable(),
  difficulty: z.nativeEnum(RecipeDifficulty).optional().nullable(),
  temperatureCelsius: z.coerce.number().int().optional().nullable(),
  ingredients: z.array(ingredientSchema).optional().default([]),
  description: z.string().optional().nullable(),
  servingSize: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  producesVariantId: z.string().min(1, "A production variant is required"),
  tags: z.array(z.string()).optional().default([]),
  isArchived: z.boolean().optional().default(false),
});

export const recipeSchema = baseRecipeSchema.refine(
  (data) => data.systemUnitId || data.orgUnitId,
  {
    message:
      "At least one yield unit (system or organization) must be selected for the recipe",
  },
);

export const updateRecipeSchema = baseRecipeSchema.partial();

export const createRecipeSchema = baseRecipeSchema
  .extend({
    ingredients: z
      .array(ingredientSchema)
      .min(1, "At least one ingredient is required"),
  })
  .refine((data) => data.systemUnitId || data.orgUnitId, {
    message:
      "At least one yield unit (system or organization) must be selected for the recipe",
  });

// --- Batch Schemas ---

const baseBatchSchema = z.object({
  recipeId: z.string().min(1, "A valid recipe must be selected"),
  plannedQuantity: z.coerce
    .number()
    .positive("Planned quantity must be a positive number"),
  systemUnitId: z.string().optional().nullable(),
  orgUnitId: z.string().optional().nullable(),
  actualQuantity: z.coerce.number().positive().optional().nullable(),
  recipeMultiplier: z.coerce.number().positive().default(1.0).optional(),
  status: z.nativeEnum(BatchStatus).default(BatchStatus.PLANNED),
  date: z.coerce.date(),
  time: z.string().min(1, "Time is required"),
  startedAt: z.coerce.date().optional().nullable(),
  duration: z.coerce.number().int().optional().nullable(),
  leadBakerId: z.string().optional().nullable(),
  assistantBakerIds: z.array(z.string()).optional().default([]),
  notes: z.string().optional().nullable(),
  createdFromTemplateId: z.string().optional().nullable(),
  outputLocationId: z.string().optional().nullable(),

  // Expiration fields
  productionDate: z.coerce.date().optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
  shelfLifeDays: z.coerce.number().int().optional().nullable(),
  expirationStatus: z
    .nativeEnum(ExpirationStatus)
    .default(ExpirationStatus.FRESH)
    .optional(),
  expiryAlertSentAt: z.coerce.date().optional().nullable(),

  // Disposal fields
  disposedAt: z.coerce.date().optional().nullable(),
  disposedById: z.string().optional().nullable(),
  disposalReason: z.nativeEnum(DisposalReason).optional().nullable(),
  disposalNotes: z.string().optional().nullable(),
});

export const batchSchema = baseBatchSchema.refine(
  (data) => data.systemUnitId || data.orgUnitId,
  {
    message:
      "At least one unit (system or organization) must be selected for the batch quantity",
  },
);

export const updateBatchSchema = baseBatchSchema
  .extend({
    batchNumber: z.string().min(1, "Batch number is required").optional(),
    completedAt: z.coerce.date().optional().nullable(),
    cancelledAt: z.coerce.date().optional().nullable(),
    canceledById: z.string().optional().nullable(),
  })
  .partial();

export const batchDisposalSchema = z.object({
  batchId: z.string(),
  disposalReason: z.nativeEnum(DisposalReason),
  disposalNotes: z.string().optional().nullable(),
  disposedById: z.string(),
  disposedAt: z.coerce.date().optional(),
});

// --- Template Schemas ---

const baseTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  recipeId: z.string().min(1, "A valid recipe must be selected"),
  quantity: z.coerce.number().positive("Quantity must be a positive number"),
  systemUnitId: z.string().optional().nullable(),
  orgUnitId: z.string().optional().nullable(),
  recipeMultiplier: z.coerce.number().positive().default(1.0).optional(),
  duration: z.coerce.number().int().optional().nullable(),
  leadBakerId: z.string().optional().nullable(),
  assistantBakerIds: z.array(z.string()).optional().default([]),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  scheduleTime: z
    .string()
    .regex(
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      "Time must be in HH:MM format (e.g., 08:00, 14:30)",
    )
    .optional()
    .nullable(),
  scheduleDays: scheduleDaysSchema,
  shelfLifeDays: z.coerce
    .number()
    .int()
    .positive("Shelf life must be a positive number")
    .optional()
    .nullable(),
});

export const templateSchema = baseTemplateSchema.refine(
  (data) => data.systemUnitId || data.orgUnitId,
  {
    message:
      "At least one unit (system or organization) must be selected for the template quantity",
  },
);

export const updateTemplateSchema = baseTemplateSchema.partial();

export const templateScheduleSchema = z.object({
  templateId: z.string().min(1, "A valid template must be selected"),
  dayOfWeek: z.number().int().min(0).max(6),
  time: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"),
});

// --- Bakery Settings & Baker Schemas ---

export const bakerySettingsSchema = z.object({
  id: z.string().optional(),
  organizationId: z.string(),
  defaultBakerId: z.string().optional().nullable(),
  autoCreateDailyBatches: z.boolean().default(false),
  expiryWarningDays: z.coerce.number().int().positive().default(3),
  authMode: z.enum(["SSO", "CARD_PIN", "LOCAL"]).default("CARD_PIN"),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const createBakerySettingsSchema = bakerySettingsSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateBakerySettingsSchema = bakerySettingsSchema.partial().omit({
  createdAt: true,
  updatedAt: true,
});

export const bakeryBakerSchema = z.object({
  id: z.string().optional(),
  bakerySettingsId: z.string(),
  memberId: z.string().optional().nullable(),
  specialties: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

export const createBakeryBakerSchema = bakeryBakerSchema.omit({
  id: true,
});

export const updateBakeryBakerSchema = bakeryBakerSchema.partial().omit({
  id: true,
  bakerySettingsId: true,
  memberId: true,
});

export const bakeryCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional().nullable(),
  organizationId: z.string().min(1, "A valid organization ID is required"),
});

export const updateBakeryCategorySchema = bakeryCategorySchema.partial();

// --- Exported Types ---

export type RecipeFormData = z.infer<typeof recipeSchema>;
export type TemplateFormData = z.infer<typeof templateSchema>;
export type TemplateScheduleFormData = z.infer<typeof templateScheduleSchema>;
export type BatchFormData = z.infer<typeof batchSchema>;
export type BakerySettingsFormData = z.infer<typeof bakerySettingsSchema>;
export type BakeryBakerFormData = z.infer<typeof bakeryBakerSchema>;
export type IngredientFormData = z.infer<typeof ingredientSchema>;
export type UpdateTemplateData = z.infer<typeof updateTemplateSchema>;
export type BatchDisposalFormData = z.infer<typeof batchDisposalSchema>;
export type UpdateBatchData = z.infer<typeof updateBatchSchema>;
export type BatchInput = z.infer<typeof batchSchema>;
export type BakeryCategoryFormData = z.infer<typeof bakeryCategorySchema>;
