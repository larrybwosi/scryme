import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PricingModel, BookingStatus } from "@repo/db";
import { IsEnum, IsString, IsNumber, IsOptional, IsArray, IsDateString, IsUUID, Min } from "class-validator";

export class CreateServiceCategoryDto {
  @ApiProperty({ description: "Category name" })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: "Category description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: "Parent category ID" })
  @IsOptional()
  @IsString()
  parentId?: string;
}

export class ServiceMaterialDto {
  @ApiProperty({ description: "Product variant ID" })
  @IsString()
  variantId: string;

  @ApiProperty({ description: "Quantity required" })
  @IsNumber()
  @Min(0)
  quantity: number;
}

export class CreateServiceDto {
  @ApiProperty({ description: "Service name" })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: "Service description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: "Service SKU" })
  @IsString()
  sku: string;

  @ApiProperty({ description: "Category ID" })
  @IsString()
  categoryId: string;

  @ApiProperty({ enum: PricingModel, description: "Pricing model" })
  @IsEnum(PricingModel)
  pricingModel: PricingModel;

  @ApiProperty({ description: "Base price" })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: "Minimum price for VARIABLE model" })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: "Estimated duration in minutes" })
  @IsOptional()
  @IsNumber()
  estimatedDuration?: number;

  @ApiPropertyOptional({ description: "Buffer time before in minutes" })
  @IsOptional()
  @IsNumber()
  bufferTimeBefore?: number;

  @ApiPropertyOptional({ description: "Buffer time after in minutes" })
  @IsOptional()
  @IsNumber()
  bufferTimeAfter?: number;

  @ApiPropertyOptional({ description: "Custom fields (JSON)", type: 'object' })
  @IsOptional()
  customFields?: Record<string, any>;

  @ApiPropertyOptional({ description: "Assigned staff member IDs" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  staffIds?: string[];

  @ApiPropertyOptional({ description: "Assigned resource IDs" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  resourceIds?: string[];

  @ApiPropertyOptional({ description: "Bill of materials", type: [ServiceMaterialDto] })
  @IsOptional()
  @IsArray()
  materials?: ServiceMaterialDto[];

  @ApiPropertyOptional({ description: "Tax rate IDs" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  taxRateIds?: string[];
}

export class CreateBookingDto {
  @ApiProperty({ description: "Service ID" })
  @IsString()
  serviceId: string;

  @ApiPropertyOptional({ description: "Customer ID" })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ description: "Location ID for stock deduction" })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiProperty({ description: "Scheduled start time" })
  @IsDateString()
  scheduledStartTime: string;

  @ApiPropertyOptional({ description: "Scheduled end time (calculated if omitted)" })
  @IsOptional()
  @IsDateString()
  scheduledEndTime?: string;

  @ApiPropertyOptional({ description: "Assigned staff IDs" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  staffIds?: string[];

  @ApiPropertyOptional({ description: "Assigned resource IDs" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  resourceIds?: string[];

  @ApiPropertyOptional({ description: "Booking notes" })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: "Custom fields", type: 'object' })
  @IsOptional()
  customFields?: Record<string, any>;

  @ApiPropertyOptional({ description: "Recurrence rule (RRULE string)" })
  @IsOptional()
  @IsString()
  recurrenceRule?: string;
}

export class CompleteBookingDto {
  @ApiPropertyOptional({ description: "Actual materials consumed", type: [ServiceMaterialDto] })
  @IsOptional()
  @IsArray()
  materials?: ServiceMaterialDto[];

  @ApiPropertyOptional({ description: "Actual start time" })
  @IsOptional()
  @IsDateString()
  actualStartTime?: string;

  @ApiPropertyOptional({ description: "Actual end time" })
  @IsOptional()
  @IsDateString()
  actualEndTime?: string;
}
