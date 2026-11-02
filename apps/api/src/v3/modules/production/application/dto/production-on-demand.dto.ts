import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class IngredientProjectionItemDto {
  @ApiProperty({ description: "Ingredient variant ID" })
  @IsString()
  @IsNotEmpty()
  variantId!: string;

  @ApiProperty({ description: "Ingredient name" })
  @IsString()
  ingredientName!: string;

  @ApiPropertyOptional({ description: "SKU" })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ description: "Required quantity for the batch" })
  @IsNumber()
  @Type(() => Number)
  requiredQuantity!: number;

  @ApiProperty({ description: "Currently available stock across inventory" })
  @IsNumber()
  @Type(() => Number)
  currentStock!: number;

  @ApiProperty({ description: "Projected shortage quantity" })
  @IsNumber()
  @Type(() => Number)
  shortageQuantity!: number;

  @ApiProperty({ description: "Unit of measurement symbol or name" })
  @IsString()
  unit!: string;

  @ApiPropertyOptional({ description: "Unit buying/cost price" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  unitCost?: number;

  @ApiPropertyOptional({ description: "Total estimated cost to purchase shortage" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  projectedCost?: number;

  @ApiPropertyOptional({ description: "Preferred supplier ID" })
  @IsOptional()
  @IsString()
  preferredSupplierId?: string;

  @ApiPropertyOptional({ description: "Supplier lead time in days" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  leadTimeDays?: number;
}

export class ProductionProjectionDto {
  @ApiProperty({ description: "Recipe ID" })
  @IsString()
  recipeId!: string;

  @ApiProperty({ description: "Recipe Name" })
  @IsString()
  recipeName!: string;

  @ApiProperty({ description: "Batch Planned Quantity" })
  @IsNumber()
  @Type(() => Number)
  plannedQuantity!: number;

  @ApiProperty({ description: "Estimated production time in minutes" })
  @IsNumber()
  @Type(() => Number)
  estimatedProductionMinutes!: number;

  @ApiProperty({ description: "Maximum supplier lead time in days for missing ingredients" })
  @IsNumber()
  @Type(() => Number)
  maxLeadTimeDays!: number;

  @ApiPropertyOptional({ description: "Suggested earliest completion date" })
  @IsOptional()
  @IsString()
  earliestCompletionDate?: string;

  @ApiProperty({ description: "Total estimated shortage cost" })
  @IsNumber()
  @Type(() => Number)
  totalShortageCost!: number;

  @ApiProperty({ description: "Whether all ingredients are in stock" })
  hasSufficientStock!: boolean;

  @ApiProperty({ description: "Ingredient projection breakdowns", type: [IngredientProjectionItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IngredientProjectionItemDto)
  ingredients!: IngredientProjectionItemDto[];
}

export class PlanPurchaseOrderDto {
  @ApiPropertyOptional({ description: "Batch ID" })
  @IsOptional()
  @IsString()
  batchId?: string;

  @ApiPropertyOptional({ description: "Recipe ID" })
  @IsOptional()
  @IsString()
  recipeId?: string;

  @ApiPropertyOptional({ description: "Planned Quantity" })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  plannedQuantity?: number;

  @ApiPropertyOptional({ description: "Destination Location ID for PO" })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional({ description: "Supplier ID override" })
  @IsOptional()
  @IsString()
  supplierId?: string;

  @ApiPropertyOptional({ description: "Auto-approve generated PO" })
  @IsOptional()
  autoApprove?: boolean;
}
