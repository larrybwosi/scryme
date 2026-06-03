import { z } from 'zod';
import { BatchStatus, ExpirationStatus, DisposalReason, RecipeDifficulty, ProductType } from './bakery-fix';

export { BatchStatus, ExpirationStatus, DisposalReason, RecipeDifficulty, ProductType };

export interface SystemUnit {
  id: string;
  name: string;
  symbol: string;
  category: string;
  description?: string;
}

export interface OrganizationUnit {
  id: string;
  name: string;
  symbol: string;
  baseUnitId: string;
  conversionFactor: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  sellingPrice: string | number;
  buyingPrice: string | number;
  retailPrice?: number | string | null;
  wholesalePrice?: number;
  baseUnitId?: string;
  baseUnit?:
    | SystemUnit
    | {
        id: string;
        name: string;
        symbol: string;
      };
  product: {
    name: string;
  };
}

export interface BakeryCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  organizationId: string;
  recipesCount?: number;
  templatesCount?: number;
  batchesCount?: number;
  recipes?: any[];
  templates?: any[];
  batches?: any[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RecipeIngredient {
  id: string;
  recipeId: string;
  ingredientVariantId: string;
  ingredientVariant: ProductVariant;
  quantity: number;
  systemUnitId?: string;
  systemUnit?: SystemUnit;
  orgUnitId?: string;
  orgUnit?: OrganizationUnit;
  preparationNotes?: string;
  unit?: { name?: string; symbol?: string };
  conversionFactor?: number;
  name?: string;
  currentStock?: number;
  unitPrice?: number;
  buyingPrice?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Recipe {
  id: string;
  name: string;
  categoryId: string;
  category: BakeryCategory;
  ingredients: RecipeIngredient[];
  producesVariantId: string;
  producesVariant: ProductVariant;
  yieldQuantity: number;
  systemUnitId?: string;
  systemUnit?: SystemUnit;
  orgUnitId?: string;
  orgUnit?: OrganizationUnit;
  costPrice?: number;
  description?: string | null;
  prepTime?: number;
  bakeTime?: number;
  totalTime?: number;
  difficulty?: RecipeDifficulty;
  temperatureCelsius?: number;
  servingSize?: string;
  instructions?: string;
  notes?: string;
  tags?: string[];
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  yieldUnitId?: string;
  totalCost?: number;
  conversionFactor?: number;
  yieldUnit?: string | { name: string; symbol: string };
}

export interface TemplateSchedule {
  id: string;
  templateId: string;
  dayOfWeek: number;
  time: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Template {
  id: string;
  name: string;
  recipeId: string;
  recipe: Recipe;
  quantity: number;
  systemUnitId?: string;
  systemUnit?: SystemUnit;
  orgUnitId?: string;
  orgUnit?: OrganizationUnit;
  recipeMultiplier?: number;
  duration?: number;
  leadBakerId?: string;
  leadBaker?: BakeryBaker;
  assistantBakers?: BakeryBaker[];
  notes?: string;
  isActive?: boolean;
  shelfLifeDays?: number;
  schedules?: TemplateSchedule[];
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  scheduleDays?: number[];
  scheduleTime?: string;
  unitId?: string;
}

export interface Batch {
  id: string;
  batchNumber: string;
  organizationId: string;
  recipeId: string;
  recipe: Recipe;
  plannedQuantity: number;
  actualQuantity?: number;
  systemUnitId?: string;
  systemUnit?: SystemUnit;
  orgUnitId?: string;
  orgUnit?: OrganizationUnit;
  recipeMultiplier: number;
  status: BatchStatus;
  scheduledStartAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  leadBakerId?: string;
  leadBaker?: BakeryBaker;
  assistantBakers?: BakeryBaker[];
  notes?: string;
  createdFromTemplateId?: string;
  createdFromTemplate?: Template;
  cancelledAt?: Date;
  canceledById?: string;
  canceledBy?: BakeryBaker;
  outputLocationId?: string;
  productionDate?: Date;
  expiresAt?: Date;
  shelfLifeDays?: number;
  expirationStatus: ExpirationStatus;
  expiryAlertSentAt?: Date;
  disposedAt?: Date;
  disposedById?: string;
  disposedBy?: BakeryBaker;
  disposalReason?: DisposalReason;
  disposalNotes?: string;
  tags?: string[];
  qcData?: any;
  wasteQuantity?: number;
  wasteReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BakeryBaker {
  id: string;
  bakerySettingsId?: string;
  memberId?: string;
  member?: {
    user: {
      id: string;
      name: string;
      email?: string;
    };
  };
  specialties: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  leadBatches?: Batch[];
  assistantBatches?: Batch[];
  canceledBatches?: Batch[];
  disposedBatches?: Batch[];
  defaultBakerFor?: BakerySettings[];
  name?: string;
  email?: string;
  isDefault?: boolean;
  role?: string;
}

export interface BakeryBranding {
  name: string;
  logoUrl?: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export interface BakerySettings {
  id: string;
  organizationId: string;
  defaultBakerId?: string;
  defaultBaker?: BakeryBaker;
  bakers?: BakeryBaker[];
  autoCreateDailyBatches: boolean;
  expiryWarningDays: number;
  authMode: 'SSO' | 'CARD_PIN';
  apiKey?: string;
  createdAt: Date;
  updatedAt: Date;
  batchPrefix?: string;
  batchSeparator?: string;
  batchDateFormat?: string;
  batchSequence?: string;
  autoApproveBatches?: boolean;
  lowStockAlerts?: boolean;
  timezone?: string;
  isEnabled?: boolean;
  defaultLocationId?: string | null;
}

export interface FormattedBatch {
  id: string;
  batchNumber: string;
  name: string;
  recipe: {
    id: string;
    name: string;
    yield: number;
    yieldUnitId: string;
    ingredients?: any[];
  };
  unit: {
    id: string;
    name: string;
    symbol: string;
  };
  plannedQuantity: number;
  actualQuantity?: number;
  status: BatchStatus;
  scheduledStartAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  duration?: number;
  baker?: string;
  leadBaker?: BakeryBaker;
  assistantBakers?: string[] | BakeryBaker[];
  notes?: string;
  createdFromTemplate?: { id: string; name: string };
  createdAt: Date;
  updatedAt: Date;
  productionDate?: Date;
  expiresAt?: Date;
  expirationStatus: ExpirationStatus;
  shelfLifeDays?: number;
  productionCost?: number;
  costPerUnit?: number;
  retailPrice?: number;
  wholesalePrice?: number;
  totalRetailValue?: number;
  totalWholesaleValue?: number;
  retailProfit?: number;
  wholesaleProfit?: number;
  retailMargin?: number;
  wholesaleMargin?: number;
  calculationError?: boolean;
  tags?: string[];
  financials?: any;
  recipeName?: string;
  bakerName?: string;
  ingredients?: any[];
  recipeMultiplier?: number;
}

// Form interfaces for creating/editing
export interface CreateRecipeForm {
  name: string;
  categoryId: string;
  producesVariantId: string;
  ingredients: any[];
  yieldQuantity: number;
  systemUnitId?: string;
  orgUnitId?: string;
  description?: string;
  prepTime?: number;
  bakeTime?: number;
  totalTime?: number;
  difficulty?: RecipeDifficulty;
  temperatureCelsius?: number;
  servingSize?: string;
  instructions?: string;
  notes?: string;
  tags?: string[];
}

export interface CreateTemplateForm {
  name: string;
  recipeId: string;
  quantity: number;
  systemUnitId?: string;
  orgUnitId?: string;
  recipeMultiplier?: number;
  duration?: number;
  leadBakerId?: string;
  assistantBakerIds: string[];
  notes?: string;
  isActive?: boolean;
  shelfLifeDays?: number;
  schedules?: any[];
}

export interface CreateBatchForm {
  recipeId: string;
  plannedQuantity: number;
  systemUnitId?: string;
  orgUnitId?: string;
  recipeMultiplier?: number;
  date: Date;
  time: string;
  leadBakerId?: string;
  assistantBakerIds?: string[];
  duration?: number;
  notes?: string;
  tags?: string[];
  createdFromTemplateId?: string;
  outputLocationId?: string;
  shelfLifeDays?: number;
}

export interface UpdateBatchForm {
  actualQuantity?: number;
  status?: BatchStatus;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  leadBakerId?: string;
  assistantBakerIds?: string[];
  notes?: string;
  productionDate?: Date;
  expiresAt?: Date;
  outputLocationId?: string;
}

export interface DisposeBatchForm {
  disposalReason: DisposalReason;
  disposalNotes?: string;
  disposedById: string;
}

export interface UnifiedBatchDetails {
  batchNumber: string;
  internalId: string;
  sourceType: 'SUPPLIER' | 'PRODUCTION';
  status: 'active' | 'expired' | 'depleted' | 'quality_failed';
  qualityStatus: string;
  receivedOrProducedDate: Date;
  expiryDate: Date | null;
  currentQuantity: number;
  initialQuantity: number;
  location: {
    id: string;
    name: string;
    storageUnit?: string;
  };
  product: {
    name: string;
    sku: string;
    variantName: string;
  };
  supplierInfo?: {
    name: string;
    supplierBatchNumber: string | null;
    receivedDate: Date;
    poNumber?: string;
  };
  productionInfo?: {
    bakerName: string;
    assistantBakers?: string[];
    recipeName: string;
    startedAt: Date | null;
    completedAt: Date | null;
    notes: string | null;
  };
}

export interface Ingredient {
  id: string;
  ingredientId: string;
  currentStock: number;
  reorderLevel: number;
  maxStock: number;
  unitsPerContainer?: number;
  unitId: string;
  unit: SystemUnit & {
    id: string;
    description: string | null;
    createdAt: Date;
    isActive?: boolean;
    updatedAt: Date;
    category?: any;
  };
  lastRestocked: Date | string;
  totalUsed: number;
  averageUsagePerWeek: number;
  name: string;
  sku: string;
  category: {
    name: string;
    id: string;
  };
  unitPrice: number;
  tags?: string[];
}

export interface StockItem {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  unit: string;
  reorderLevel: number;
  current?: number;
  reorder?: number;
  max?: number;
}

export interface OverviewData {
  summary: {
    totalBatches: number;
    activeBatches: number;
    completedToday: number;
    lowStockItems: number;
  };
  recentBatches: FormattedBatch[];
  lowStockIngredients: StockItem[];
  batches?: any[];
  recipes?: any[];
  ingredients?: any[];
  stockData?: any[];
  averageRecipeCost?: number;
  recipesByCategory?: Record<string, number>;
  totalInventoryValue?: number;
}
