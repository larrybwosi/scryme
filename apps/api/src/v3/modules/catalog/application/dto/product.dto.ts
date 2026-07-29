import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsNumber, IsOptional } from "class-validator";

export class CreateProductDto {
  @ApiProperty({
    example: "Espresso Beans",
    description: "The name of the product",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: "High-quality arabica beans",
    description: "Product description",
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 15.99, description: "Base price of the product" })
  @IsNumber()
  price: number;

  @ApiProperty({ example: "SKU-123", description: "Stock Keeping Unit" })
  @IsString()
  @IsOptional()
  sku?: string;
}

export class ProductVariantResponseDto {
  @ApiProperty({ example: "var_123" })
  id: string;

  @ApiProperty({ example: "Espresso Beans - 1kg" })
  name: string;

  @ApiProperty({ example: "SKU-123-1" })
  sku: string;

  @ApiProperty({ example: 15.99, nullable: true })
  retailPrice: number | null;
}

export class ProductCategoryResponseDto {
  @ApiProperty({ example: "cat_123" })
  id: string;

  @ApiProperty({ example: "Beverages" })
  name: string;
}

export class ProductResponseDto {
  @ApiProperty({ example: "prod_123" })
  id: string;

  @ApiProperty({ example: "Espresso Beans" })
  name: string;

  @ApiProperty({ example: "High-quality arabica beans", nullable: true })
  description: string | null;

  @ApiProperty({ example: "SKU-123" })
  sku: string;

  @ApiProperty({ example: 15.99, nullable: true })
  retailPrice: number | null;

  @ApiProperty({ example: ["https://example.com/image.jpg"] })
  images: string[];

  @ApiProperty({ type: ProductCategoryResponseDto })
  category: ProductCategoryResponseDto;

  @ApiProperty({ example: "espresso-beans", nullable: true })
  slug: string | null;

  @ApiProperty({ type: [ProductVariantResponseDto], required: false })
  variants?: ProductVariantResponseDto[];
}

export class ServiceCategoryResponseDto {
  @ApiProperty({ example: "cat_456" })
  id: string;

  @ApiProperty({ example: "Consultation" })
  name: string;
}

export class ServiceCatalogResponseDto {
  @ApiProperty({ example: "srv_123" })
  id: string;

  @ApiProperty({ example: "Plumbing Service" })
  name: string;

  @ApiProperty({ example: "Professional plumbing repair", nullable: true })
  description: string | null;

  @ApiProperty({ example: "SRV-PLUMB" })
  sku: string;

  @ApiProperty({ example: 85.0 })
  retailPrice: number;

  @ApiProperty({ example: [] })
  images: string[];

  @ApiProperty({ type: ServiceCategoryResponseDto })
  category: ServiceCategoryResponseDto;

  @ApiProperty({ example: "plumbing-service", nullable: true })
  slug: string | null;

  @ApiProperty({ example: "FIXED" })
  pricingModel: string;

  @ApiProperty({ example: 60, nullable: true })
  estimatedDuration: number | null;

  @ApiProperty({ example: true })
  isActive: boolean;
}
