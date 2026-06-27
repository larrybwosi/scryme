import { z } from "zod";

export const RecipeIngredientSchema = z
  .object({
    ingredientVariantId: z.string().min(1),
    quantity: z.number().positive(),
    systemUnitId: z.string().optional().nullable(),
    orgUnitId: z.string().optional().nullable(),
    preparationNotes: z.string().optional().nullable(),
  })
  .refine(data => data.systemUnitId || data.orgUnitId, {
    message:
      "At least one unit (system or organization) must be selected for the ingredient",
  });

const RecipeSchemaObject = z.object({
  name: z.string().min(1),
  categoryId: z.string().min(1),
  producesVariantId: z.string().min(1),
  yieldQuantity: z.number().positive(),
  systemUnitId: z.string().optional().nullable(),
  orgUnitId: z.string().optional().nullable(),
  costPrice: z.number().optional().nullable(),
  description: z.string().optional().nullable(),
  prepTime: z.number().int().optional().nullable(),
  bakeTime: z.number().int().optional().nullable(),
  totalTime: z.number().int().optional().nullable(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD", "EXPERT"]).optional(),
  temperatureCelsius: z.number().int().optional().nullable(),
  servingSize: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  ingredients: z.array(RecipeIngredientSchema).optional(),
});

export const CreateRecipeSchema = RecipeSchemaObject.refine(
  data => data.systemUnitId || data.orgUnitId,
  {
    message:
      "At least one yield unit (system or organization) must be selected for the recipe",
  },
);

export const UpdateRecipeSchema = RecipeSchemaObject.partial();

const BatchSchemaObject = z.object({
  recipeId: z.string().min(1),
  plannedQuantity: z.number().positive(),
  systemUnitId: z.string().optional().nullable(),
  orgUnitId: z.string().optional().nullable(),
  recipeMultiplier: z.number().positive().optional(),
  scheduledStartAt: z.string().or(z.date()).optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  leadBakerId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  outputLocationId: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
});

export const CreateBatchSchema = BatchSchemaObject.refine(
  data => data.systemUnitId || data.orgUnitId,
  {
    message:
      "At least one unit (system or organization) must be selected for the batch quantity",
  },
);

export const UpdateBatchSchema = BatchSchemaObject.partial().extend({
  status: z
    .enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
    .optional(),
});

export const CompleteBatchSchema = z.object({
  actualQuantity: z.number().nonnegative(),
  wasteQuantity: z.number().nonnegative().optional(),
  wasteReason: z.string().optional().nullable(),
  qcData: z.any().optional(),
  notes: z.string().optional().nullable(),
  ingredientConsumptions: z
    .array(
      z.object({
        stockBatchId: z.string().min(1),
        quantity: z.number().positive(),
      }),
    )
    .optional(),
});

const TemplateSchemaObject = z.object({
  name: z.string().min(1),
  recipeId: z.string().min(1),
  quantity: z.number().positive(),
  systemUnitId: z.string().optional().nullable(),
  orgUnitId: z.string().optional().nullable(),
  recipeMultiplier: z.number().positive().optional(),
  duration: z.number().int().optional().nullable(),
  leadBakerId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  shelfLifeDays: z.number().int().optional().nullable(),
});

export const CreateTemplateSchema = TemplateSchemaObject.refine(
  data => data.systemUnitId || data.orgUnitId,
  {
    message:
      "At least one unit (system or organization) must be selected for the template quantity",
  },
);

export const UpdateTemplateSchema = TemplateSchemaObject.partial();

export const CreateBakeryCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
});

export const UpdateBakeryCategorySchema = CreateBakeryCategorySchema.partial();

export const UpdateBakerySettingsSchema = z.object({
  defaultBakerId: z.string().optional().nullable(),
  autoCreateDailyBatches: z.boolean().optional(),
  expiryWarningDays: z.number().int().optional(),
  authMode: z.enum(["SSO", "CARD_PIN"]).optional(),
  batchPrefix: z.string().optional(),
  batchSeparator: z.string().optional(),
  batchDateFormat: z.string().optional(),
  batchSequence: z.string().optional(),
  autoApproveBatches: z.boolean().optional(),
  lowStockAlerts: z.boolean().optional(),
  timezone: z.string().optional(),
  scrymeReportEnabled: z.boolean().optional(),
  scrymeReportDay: z.number().int().min(0).max(6).optional(),
  scrymeReportTime: z.string().optional(),
  scrymeReportSections: z.any().optional(),
  scrymeReportChannel: z.string().optional().nullable(),
});

export const AddBakerSchema = z.object({
  memberId: z.string().min(1),
  specialties: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const UpdateBakerSchema = AddBakerSchema.partial();

export const CreateDeliveryPartnerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  commissionRate: z.number().optional().nullable(),
  fixedFee: z.number().optional().nullable(),
  benefitType: z
    .enum(["COMMISSION", "FIXED_FEE", "PROFIT_MARGIN", "NONE"])
    .optional(),
  reconciliationPolicy: z
    .enum(["RETURN_TO_STOCK", "MARK_AS_WASTE", "PARTNER_CHARGED"])
    .optional(),
  isActive: z.boolean().optional(),
});

export const UpdateDeliveryPartnerSchema =
  CreateDeliveryPartnerSchema.partial();

export const AdjustPartnerWalletSchema = z.object({
  amount: z.number(),
  type: z
    .enum([
      "BENEFIT_ACCRUAL",
      "WITHDRAWAL",
      "ADJUSTMENT",
      "RECONCILIATION_CHARGE",
      "DEPOSIT",
    ])
    .optional(),
  notes: z.string().optional().nullable(),
});

export const ReceiveIngredientsSchema = z.object({
  receiptReference: z.string().min(1),
  receiptDate: z.string().or(z.date()).optional(),
  notes: z.string().optional().nullable(),
  lines: z
    .array(
      z.object({
        ingredientId: z.string().min(1),
        quantity: z.number().positive(),
        unitCost: z.number().nonnegative(),
        lotNumber: z.string().optional().nullable(),
        expiryDate: z.string().or(z.date()).optional().nullable(),
        supplier: z.string().optional().nullable(),
      }),
    )
    .min(1),
});

export const DispatchDeliverySchema = z.object({
  transactionId: z.string().min(1),
  partnerId: z.string().min(1),
  driverId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const ReconcileDeliverySchema = z.object({
  fulfillmentId: z.string().min(1),
  status: z.enum(["DELIVERED", "FAILED", "RETURNED"]),
  notes: z.string().optional().nullable(),
});
