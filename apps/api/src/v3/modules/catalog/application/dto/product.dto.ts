import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsNumber, IsOptional, ValidateNested, IsArray, IsObject, IsEnum, IsUrl, MaxLength } from "class-validator";
import { Type } from "class-transformer";

export class ImageItemDto {
  @ApiProperty({ example: "img_cover_9921", description: "Unique image ID for reordering and DOM reconciliation keys" })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: "https://images.unsplash.com/photo-1509440159596-0249088772ff", description: "Direct URL of the image asset" })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  url: string;

  @ApiPropertyOptional({ example: "Fresh sourdough cooling on wire rack", description: "Alt text / caption for image" })
  @IsString()
  @IsOptional()
  caption?: string;
}

export class SeoMetadataDto {
  @ApiPropertyOptional({ example: "Master Sourdough Class", maxLength: 80 })
  @IsString()
  @IsOptional()
  @MaxLength(80)
  title?: string;

  @ApiPropertyOptional({ example: "Book a 4-hour sourdough masterclass", maxLength: 200 })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  description?: string;

  @ApiPropertyOptional({ example: "sourdough, baking, learn" })
  @IsString()
  @IsOptional()
  keywords?: string;
}

export class CmsCustomFieldsDto {
  @ApiPropertyOptional({ example: "# Sourdough Masterclass\nLearn bread baking." })
  @IsString()
  @IsOptional()
  markdownDescription?: string;

  @ApiPropertyOptional({ type: [ImageItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageItemDto)
  images?: ImageItemDto[];

  @ApiPropertyOptional({ type: SeoMetadataDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SeoMetadataDto)
  seo?: SeoMetadataDto;

  @ApiPropertyOptional({ example: { material: "Cane", origin: "Indonesia" } })
  @IsOptional()
  @IsObject()
  customAttributes?: Record<string, string>;

  @ApiPropertyOptional({ enum: ["Draft", "Published", "Scheduled", "Archived"] })
  @IsOptional()
  @IsEnum(["Draft", "Published", "Scheduled", "Archived"])
  publishStatus?: "Draft" | "Published" | "Scheduled" | "Archived";

  @ApiPropertyOptional({ example: "2026-03-01T08:00:00.000Z", nullable: true })
  @IsString()
  @IsOptional()
  publishedAt?: string | null;

  @ApiPropertyOptional({ example: "2026-03-01T08:00:00.000Z", nullable: true })
  @IsString()
  @IsOptional()
  archivedAt?: string | null;

  @ApiPropertyOptional({ example: "Hero Showcase" })
  @IsString()
  @IsOptional()
  layoutTemplate?: string;

  @ApiPropertyOptional({ example: "learn-artisan-sourdough" })
  @IsString()
  @IsOptional()
  customSlugOverride?: string;
}

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

  @ApiPropertyOptional({ type: () => CmsCustomFieldsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CmsCustomFieldsDto)
  customFields?: CmsCustomFieldsDto;
}

export class UpdateProductDto {
  @ApiPropertyOptional({ example: "Espresso Beans" })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: "High-quality arabica beans" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 15.99 })
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ example: "SKU-123" })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({ type: () => CmsCustomFieldsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CmsCustomFieldsDto)
  customFields?: CmsCustomFieldsDto;
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

export class ProductReviewCustomerDto {
  @ApiProperty({ example: "cust_123" })
  id: string;

  @ApiProperty({ example: "John Doe" })
  name: string;
}

export class ProductReviewResponseDto {
  @ApiProperty({ example: "rev_123" })
  id: string;

  @ApiProperty({ type: ProductReviewCustomerDto })
  customer: ProductReviewCustomerDto;

  @ApiProperty({ example: 5 })
  rating: number;

  @ApiProperty({ example: "Great product!", nullable: true })
  comment: string | null;

  @ApiProperty({ example: "2026-03-01T08:00:00.000Z" })
  createdAt: string;
}

export class ProductMetaDto {
  @ApiPropertyOptional({ example: 4.5 })
  averageRating?: number;

  @ApiPropertyOptional({ example: 12 })
  reviewCount?: number;
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

  @ApiPropertyOptional({ type: () => CmsCustomFieldsDto })
  customFields?: CmsCustomFieldsDto;

  @ApiPropertyOptional({ example: "Acme Corp", nullable: true })
  brand?: string | null;

  @ApiPropertyOptional({ example: 4.5, nullable: true })
  rating?: number | null;

  @ApiPropertyOptional({ example: true })
  isNew?: boolean;

  @ApiPropertyOptional({ example: "Detailed info about the product.", nullable: true })
  detailedDescription?: string | null;

  @ApiPropertyOptional({ example: ["coffee", "beans"] })
  tags?: string[];

  @ApiPropertyOptional({ example: true })
  isFeatured?: boolean;

  @ApiPropertyOptional({ example: true })
  isActive?: boolean;

  @ApiPropertyOptional({ example: 10, nullable: true })
  pointsOnPurchase?: number | null;

  @ApiPropertyOptional({ type: [ProductReviewResponseDto] })
  reviews?: ProductReviewResponseDto[];

  @ApiPropertyOptional({ example: 10 })
  favoritesCount?: number;

  @ApiPropertyOptional({ example: 10 })
  favouritesCount?: number;

  @ApiPropertyOptional({ type: ProductMetaDto })
  meta?: ProductMetaDto;
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

  @ApiPropertyOptional({ type: () => CmsCustomFieldsDto })
  customFields?: CmsCustomFieldsDto;
}
