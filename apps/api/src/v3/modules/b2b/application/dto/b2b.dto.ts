import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsNumber, IsArray, ValidateNested, IsOptional } from "class-validator";
import { Type } from "class-transformer";
import { PaginationMetaDto } from "@/v3/common/utils/pagination";

export class B2BOrderItemDto {
  @ApiProperty({ example: "var_123", description: "The ID of the product variant" })
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @ApiProperty({ example: 10, description: "Quantity to order" })
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({ example: 15.99, description: "Price per unit", required: false })
  @IsNumber()
  @IsOptional()
  price?: number;
}

export class CreateB2BOrderDto {
  @ApiProperty({ type: [B2BOrderItemDto], description: "List of items in the order" })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => B2BOrderItemDto)
  items: B2BOrderItemDto[];
}

export class B2BOrderResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: "B2B Order created successfully" })
  message: string;

  @ApiProperty({ example: "tx_123" })
  orderId: string;
}

export class B2BVariantStockDto {
  @ApiProperty({ example: 100 })
  availableStock: number;

  @ApiProperty({ example: "loc_123" })
  locationId: string;
}

export class B2BVariantDto {
  @ApiProperty({ example: "var_123" })
  id: string;

  @ApiProperty({ example: "Standard" })
  name: string;

  @ApiProperty({ example: "SKU-123" })
  sku: string;

  @ApiProperty({ example: 10.5 })
  unitPrice: number;

  @ApiProperty({ example: "pl_123", required: false })
  priceListId?: string;

  @ApiProperty({ type: [B2BVariantStockDto] })
  variantStocks: B2BVariantStockDto[];
}

export class B2BCatalogProductDto {
  @ApiProperty({ example: "prod_123" })
  id: string;

  @ApiProperty({ example: "Espresso Beans" })
  name: string;

  @ApiProperty({ example: "High-quality arabica beans" })
  description: string;

  @ApiProperty({ type: [B2BVariantDto] })
  variants: B2BVariantDto[];

  @ApiProperty({ example: "Coffee" })
  categoryName?: string;
}

export class PaginatedB2BCatalogDto {
  @ApiProperty({ type: [B2BCatalogProductDto] })
  data: B2BCatalogProductDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class CatalogPaginationDto {
  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiProperty({ example: 20, required: false })
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiProperty({ example: "espresso", required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ example: "cat_123", required: false })
  @IsOptional()
  @IsString()
  categoryId?: string;
}
