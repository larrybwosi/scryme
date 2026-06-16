import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsNumber,
  IsOptional,
  IsDateString,
  IsEnum,
} from "class-validator";
import { Type } from "class-transformer";

export class CreatePurchaseItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @ApiProperty()
  @IsNumber()
  orderedQuantity: number;

  @ApiProperty()
  @IsNumber()
  unitCost: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  orderedUnitId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  orderedOrgUnitId?: string;
}

export class CreatePurchaseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  supplierId: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  expectedDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  currency?: string = "KES";

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  shippingCost?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ type: [CreatePurchaseItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseItemDto)
  items: CreatePurchaseItemDto[];
}

export class BatchReceiptDto {
  @ApiProperty()
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  batchNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  supplierBatchNumber?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  storageUnitId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  positionId?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  landedCost?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  serialNumbers?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  qcResults?: {
    templateId: string;
    data: any;
    status: "PASSED" | "FAILED";
    notes?: string;
  };

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  systemUnitId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  orgUnitId?: string;
}

export class ReceivePurchaseItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  purchaseItemId: string;

  @ApiProperty({ type: [BatchReceiptDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchReceiptDto)
  batches: BatchReceiptDto[];

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  rejectedQuantity?: number = 0;
}

export class ReceivePurchaseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  locationId: string;

  @ApiProperty({ type: [ReceivePurchaseItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceivePurchaseItemDto)
  items: ReceivePurchaseItemDto[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
