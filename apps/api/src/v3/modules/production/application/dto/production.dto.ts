import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsEnum,
  ArrayMinSize,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateRecipeIngredientDto {
  @ApiProperty({ description: "Product variant ID of the ingredient" })
  @IsString()
  @IsNotEmpty()
  ingredientVariantId!: string;

  @ApiProperty({ description: "Quantity required" })
  @IsNumber()
  quantity!: number;

  @ApiPropertyOptional({ description: "System unit ID" })
  @IsOptional()
  @IsString()
  systemUnitId?: string;

  @ApiPropertyOptional({ description: "Org unit ID" })
  @IsOptional()
  @IsString()
  orgUnitId?: string;

  @ApiPropertyOptional({ description: "Preparation notes" })
  @IsOptional()
  @IsString()
  preparationNotes?: string;
}

export class CreateRecipeDto {
  @ApiProperty({ description: "Recipe name" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: "Category ID" })
  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @ApiProperty({ description: "Variant ID produced by this recipe" })
  @IsString()
  @IsNotEmpty()
  producesVariantId!: string;

  @ApiProperty({ description: "Yield quantity" })
  @IsNumber()
  yieldQuantity!: number;

  @ApiPropertyOptional({ description: "System unit ID" })
  @IsOptional()
  @IsString()
  systemUnitId?: string;

  @ApiPropertyOptional({ description: "Org unit ID" })
  @IsOptional()
  @IsString()
  orgUnitId?: string;

  @ApiPropertyOptional({ description: "Cost price" })
  @IsOptional()
  @IsNumber()
  costPrice?: number;

  @ApiPropertyOptional({ description: "Recipe description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: "Preparation time in minutes" })
  @IsOptional()
  @IsNumber()
  prepTime?: number;

  @ApiPropertyOptional({ description: "Bake time in minutes" })
  @IsOptional()
  @IsNumber()
  bakeTime?: number;

  @ApiPropertyOptional({ description: "Total time in minutes" })
  @IsOptional()
  @IsNumber()
  totalTime?: number;

  @ApiPropertyOptional({ description: "Recipe difficulty" })
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiPropertyOptional({ description: "Baking temperature in Celsius" })
  @IsOptional()
  @IsNumber()
  temperatureCelsius?: number;

  @ApiPropertyOptional({ description: "Serving size" })
  @IsOptional()
  @IsString()
  servingSize?: string;

  @ApiPropertyOptional({ description: "Instructions text" })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional({ description: "Notes text" })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: "Recipe tags", type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ description: "List of recipe ingredients", type: [CreateRecipeIngredientDto] })
  @IsArray()
  @ArrayMinSize(1, { message: "At least one ingredient is required" })
  @ValidateNested({ each: true })
  @Type(() => CreateRecipeIngredientDto)
  ingredients!: CreateRecipeIngredientDto[];
}

export class UpdateRecipeDto {
  @ApiPropertyOptional({ description: "Recipe name" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: "Category ID" })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: "Variant ID produced by this recipe" })
  @IsOptional()
  @IsString()
  producesVariantId?: string;

  @ApiPropertyOptional({ description: "Yield quantity" })
  @IsOptional()
  @IsNumber()
  yieldQuantity?: number;

  @ApiPropertyOptional({ description: "System unit ID" })
  @IsOptional()
  @IsString()
  systemUnitId?: string;

  @ApiPropertyOptional({ description: "Org unit ID" })
  @IsOptional()
  @IsString()
  orgUnitId?: string;

  @ApiPropertyOptional({ description: "Cost price" })
  @IsOptional()
  @IsNumber()
  costPrice?: number;

  @ApiPropertyOptional({ description: "Recipe description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: "Prep time in minutes" })
  @IsOptional()
  @IsNumber()
  prepTime?: number;

  @ApiPropertyOptional({ description: "Bake time in minutes" })
  @IsOptional()
  @IsNumber()
  bakeTime?: number;

  @ApiPropertyOptional({ description: "Total time in minutes" })
  @IsOptional()
  @IsNumber()
  totalTime?: number;

  @ApiPropertyOptional({ description: "Recipe difficulty" })
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiPropertyOptional({ description: "Baking temperature in Celsius" })
  @IsOptional()
  @IsNumber()
  temperatureCelsius?: number;

  @ApiPropertyOptional({ description: "Serving size" })
  @IsOptional()
  @IsString()
  servingSize?: string;

  @ApiPropertyOptional({ description: "Instructions text" })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional({ description: "Notes text" })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: "Recipe tags", type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: "List of recipe ingredients", type: [CreateRecipeIngredientDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: "Ingredients list cannot be empty" })
  @ValidateNested({ each: true })
  @Type(() => CreateRecipeIngredientDto)
  ingredients?: CreateRecipeIngredientDto[];
}

export class CreateBatchDto {
  @ApiProperty({ description: "Recipe ID" })
  @IsString()
  @IsNotEmpty()
  recipeId!: string;

  @ApiProperty({ description: "Planned quantity" })
  @IsNumber()
  plannedQuantity!: number;

  @ApiPropertyOptional({ description: "System unit ID" })
  @IsOptional()
  @IsString()
  systemUnitId?: string;

  @ApiPropertyOptional({ description: "Org unit ID" })
  @IsOptional()
  @IsString()
  orgUnitId?: string;

  @ApiPropertyOptional({ description: "Recipe multiplier", default: 1.0 })
  @IsOptional()
  @IsNumber()
  recipeMultiplier?: number;

  @ApiPropertyOptional({ description: "Lead baker ID" })
  @IsOptional()
  @IsString()
  leadBakerId?: string;

  @ApiPropertyOptional({ description: "Assistant baker IDs", type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assistantBakerIds?: string[];

  @ApiPropertyOptional({ description: "Notes" })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: "Output inventory location ID" })
  @IsOptional()
  @IsString()
  outputLocationId?: string;

  @ApiPropertyOptional({ description: "Tags", type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: "Scheduled start date/time ISO string" })
  @IsOptional()
  @IsString()
  scheduledStartAt?: string;

  @ApiPropertyOptional({ description: "Date string YYYY-MM-DD" })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ description: "Time string HH:mm" })
  @IsOptional()
  @IsString()
  time?: string;
}

export class UpdateBatchDto {
  @ApiPropertyOptional({ description: "Planned quantity" })
  @IsOptional()
  @IsNumber()
  plannedQuantity?: number;

  @ApiPropertyOptional({ description: "Actual quantity" })
  @IsOptional()
  @IsNumber()
  actualQuantity?: number;

  @ApiPropertyOptional({ description: "Recipe multiplier" })
  @IsOptional()
  @IsNumber()
  recipeMultiplier?: number;

  @ApiPropertyOptional({ description: "Lead baker ID" })
  @IsOptional()
  @IsString()
  leadBakerId?: string;

  @ApiPropertyOptional({ description: "Assistant baker IDs", type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assistantBakerIds?: string[];

  @ApiPropertyOptional({ description: "Notes" })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: "Output location ID" })
  @IsOptional()
  @IsString()
  outputLocationId?: string;

  @ApiPropertyOptional({ description: "Status" })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: "Tags", type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class IngredientConsumptionItemDto {
  @ApiProperty({ description: "Stock batch ID" })
  @IsString()
  @IsNotEmpty()
  stockBatchId!: string;

  @ApiProperty({ description: "Consumed quantity" })
  @IsNumber()
  quantity!: number;
}

export class CompleteBatchDto {
  @ApiProperty({ description: "Actual quantity produced" })
  @IsNumber()
  actualQuantity!: number;

  @ApiPropertyOptional({ description: "Waste quantity" })
  @IsOptional()
  @IsNumber()
  wasteQuantity?: number;

  @ApiPropertyOptional({ description: "Waste reason" })
  @IsOptional()
  @IsString()
  wasteReason?: string;

  @ApiPropertyOptional({ description: "Quality control data (JSON)" })
  @IsOptional()
  qcData?: any;

  @ApiPropertyOptional({ description: "Notes" })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: "Ingredient consumptions", type: [IngredientConsumptionItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IngredientConsumptionItemDto)
  ingredientConsumptions?: IngredientConsumptionItemDto[];
}

export class CreateTemplateDto {
  @ApiProperty({ description: "Template name" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: "Recipe ID" })
  @IsString()
  @IsNotEmpty()
  recipeId!: string;

  @ApiProperty({ description: "Default quantity" })
  @IsNumber()
  quantity!: number;

  @ApiPropertyOptional({ description: "System unit ID" })
  @IsOptional()
  @IsString()
  systemUnitId?: string;

  @ApiPropertyOptional({ description: "Org unit ID" })
  @IsOptional()
  @IsString()
  orgUnitId?: string;

  @ApiPropertyOptional({ description: "Recipe multiplier", default: 1.0 })
  @IsOptional()
  @IsNumber()
  recipeMultiplier?: number;

  @ApiPropertyOptional({ description: "Estimated duration in minutes" })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional({ description: "Lead baker ID" })
  @IsOptional()
  @IsString()
  leadBakerId?: string;

  @ApiPropertyOptional({ description: "Notes" })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: "Active status", default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: "Shelf life in days" })
  @IsOptional()
  @IsNumber()
  shelfLifeDays?: number;
}

export class UpdateTemplateDto {
  @ApiPropertyOptional({ description: "Template name" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: "Quantity" })
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiPropertyOptional({ description: "Recipe multiplier" })
  @IsOptional()
  @IsNumber()
  recipeMultiplier?: number;

  @ApiPropertyOptional({ description: "Duration in minutes" })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional({ description: "Lead baker ID" })
  @IsOptional()
  @IsString()
  leadBakerId?: string;

  @ApiPropertyOptional({ description: "Notes" })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: "Active status" })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: "Shelf life in days" })
  @IsOptional()
  @IsNumber()
  shelfLifeDays?: number;
}

export class CreateProductionCategoryDto {
  @ApiProperty({ description: "Category name" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: "Description" })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateProductionCategoryDto {
  @ApiPropertyOptional({ description: "Category name" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: "Description" })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateProductionSettingsDto {
  @ApiPropertyOptional({ description: "Default baker ID" })
  @IsOptional()
  @IsString()
  defaultBakerId?: string;

  @ApiPropertyOptional({ description: "Auto create daily batches", default: false })
  @IsOptional()
  @IsBoolean()
  autoCreateDailyBatches?: boolean;

  @ApiPropertyOptional({ description: "Expiry warning days", default: 3 })
  @IsOptional()
  @IsNumber()
  expiryWarningDays?: number;

  @ApiPropertyOptional({ description: "Auth mode" })
  @IsOptional()
  @IsString()
  authMode?: string;

  @ApiPropertyOptional({ description: "Batch prefix", default: "BAT" })
  @IsOptional()
  @IsString()
  batchPrefix?: string;

  @ApiPropertyOptional({ description: "Batch separator", default: "-" })
  @IsOptional()
  @IsString()
  batchSeparator?: string;

  @ApiPropertyOptional({ description: "Batch date format", default: "YYYYMMDD" })
  @IsOptional()
  @IsString()
  batchDateFormat?: string;

  @ApiPropertyOptional({ description: "Batch sequence length", default: "4" })
  @IsOptional()
  @IsString()
  batchSequence?: string;

  @ApiPropertyOptional({ description: "Auto approve batches", default: false })
  @IsOptional()
  @IsBoolean()
  autoApproveBatches?: boolean;

  @ApiPropertyOptional({ description: "Low stock alerts", default: true })
  @IsOptional()
  @IsBoolean()
  lowStockAlerts?: boolean;

  @ApiPropertyOptional({ description: "Timezone", default: "UTC" })
  @IsOptional()
  @IsString()
  timezone?: string;
}

export class AddBakerDto {
  @ApiProperty({ description: "Member ID to add as baker" })
  @IsString()
  @IsNotEmpty()
  memberId!: string;

  @ApiPropertyOptional({ description: "Baker specialties", type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @ApiPropertyOptional({ description: "Is active baker", default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateBakerDto {
  @ApiPropertyOptional({ description: "Baker specialties", type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @ApiPropertyOptional({ description: "Is active baker" })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ReceiveIngredientLineDto {
  @ApiProperty({ description: "Ingredient variant ID" })
  @IsString()
  @IsNotEmpty()
  ingredientId!: string;

  @ApiProperty({ description: "Quantity received" })
  @IsNumber()
  quantity!: number;

  @ApiProperty({ description: "Unit cost" })
  @IsNumber()
  unitCost!: number;

  @ApiPropertyOptional({ description: "Supplier ID" })
  @IsOptional()
  @IsString()
  supplier?: string;

  @ApiPropertyOptional({ description: "Lot/Batch number" })
  @IsOptional()
  @IsString()
  lotNumber?: string;

  @ApiPropertyOptional({ description: "Expiry date YYYY-MM-DD" })
  @IsOptional()
  @IsString()
  expiryDate?: string;
}

export class ReceiveIngredientsDto {
  @ApiProperty({ description: "Line items received", type: [ReceiveIngredientLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiveIngredientLineDto)
  lines!: ReceiveIngredientLineDto[];

  @ApiProperty({ description: "Receipt reference / GRN" })
  @IsString()
  @IsNotEmpty()
  receiptReference!: string;

  @ApiPropertyOptional({ description: "Receipt date YYYY-MM-DD" })
  @IsOptional()
  @IsString()
  receiptDate?: string;

  @ApiPropertyOptional({ description: "Notes" })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateIngredientDto {
  @ApiProperty({ description: "Ingredient name" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: "SKU" })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ description: "Category ID" })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: "Description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: "Buying price" })
  @IsOptional()
  @IsNumber()
  buyingPrice?: number;

  @ApiPropertyOptional({ description: "Reorder point" })
  @IsOptional()
  @IsNumber()
  reorderPoint?: number;

  @ApiPropertyOptional({ description: "Reorder level" })
  @IsOptional()
  @IsNumber()
  reorderLevel?: number;

  @ApiPropertyOptional({ description: "Base unit ID" })
  @IsOptional()
  @IsString()
  baseUnitId?: string;

  @ApiPropertyOptional({ description: "Base org unit ID" })
  @IsOptional()
  @IsString()
  baseOrgUnitId?: string;

  @ApiPropertyOptional({ description: "Stocking unit ID" })
  @IsOptional()
  @IsString()
  stockingUnitId?: string;

  @ApiPropertyOptional({ description: "Stocking org unit ID" })
  @IsOptional()
  @IsString()
  stockingOrgUnitId?: string;
}

export class UpdateIngredientDto {
  @ApiPropertyOptional({ description: "Ingredient name" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: "SKU" })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ description: "Category ID" })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: "Description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: "Buying price" })
  @IsOptional()
  @IsNumber()
  buyingPrice?: number;

  @ApiPropertyOptional({ description: "Reorder point" })
  @IsOptional()
  @IsNumber()
  reorderPoint?: number;

  @ApiPropertyOptional({ description: "Reorder level" })
  @IsOptional()
  @IsNumber()
  reorderLevel?: number;

  @ApiPropertyOptional({ description: "Base unit ID" })
  @IsOptional()
  @IsString()
  baseUnitId?: string;

  @ApiPropertyOptional({ description: "Base org unit ID" })
  @IsOptional()
  @IsString()
  baseOrgUnitId?: string;

  @ApiPropertyOptional({ description: "Stocking unit ID" })
  @IsOptional()
  @IsString()
  stockingUnitId?: string;

  @ApiPropertyOptional({ description: "Stocking org unit ID" })
  @IsOptional()
  @IsString()
  stockingOrgUnitId?: string;
}

export class CreateQualityIncidentDto {
  @ApiProperty({ description: "Title of the quality incident" })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ description: "Description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: "Severity (low, medium, high, critical)" })
  @IsOptional()
  @IsString()
  severity?: string;

  @ApiPropertyOptional({ description: "Batch ID" })
  @IsOptional()
  @IsString()
  batchId?: string;

  @ApiPropertyOptional({ description: "Stock Batch ID" })
  @IsOptional()
  @IsString()
  stockBatchId?: string;

  @ApiPropertyOptional({ description: "Supplier ID" })
  @IsOptional()
  @IsString()
  supplierId?: string;
}

export class UpdateQualityIncidentDto {
  @ApiPropertyOptional({ description: "Title" })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: "Description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: "Severity" })
  @IsOptional()
  @IsString()
  severity?: string;

  @ApiPropertyOptional({ description: "Status (OPEN, INVESTIGATING, RESOLVED, CLOSED)" })
  @IsOptional()
  @IsString()
  status?: string;
}
