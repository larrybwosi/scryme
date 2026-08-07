import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsNumber,
  IsEnum,
  IsObject,
} from "class-validator";
import { Type } from "class-transformer";
import { AddressDto } from "../../../customers/application/dto/register-customer.dto";

export class OrderItemDto {
  @ApiProperty({ example: "variant_123" })
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({ example: 15.5, required: false })
  @IsNumber()
  @IsOptional()
  unitPrice?: number;
}

export class ServiceBookingItemDto {
  @ApiProperty({ example: "service_123" })
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({ example: "2026-10-15T09:00:00Z" })
  @IsString()
  @IsNotEmpty()
  scheduledStartTime: string;

  @ApiPropertyOptional({ example: "2026-10-15T10:00:00Z" })
  @IsString()
  @IsOptional()
  scheduledEndTime?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  staffIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  resourceIds?: string[];

  @ApiPropertyOptional({ example: "Special service notes" })
  @IsString()
  @IsOptional()
  notes?: string;
}

export enum V3TransactionChannel {
  ECOMMERCE_STORE = "ECOMMERCE_STORE",
  MOBILE_APP = "MOBILE_APP",
}

export class CreateOrderDto {
  @ApiProperty({
    example: "cust_123",
    required: false,
    description:
      "Internal customer ID.",
  })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiProperty({
    example: "bus_123",
    required: false,
    description:
      "Internal business account ID.",
  })
  @IsString()
  @IsOptional()
  businessAccountId?: string;

  @ApiProperty({ example: "loc_123", description: "Inventory location ID" })
  @IsString()
  @IsNotEmpty()
  locationId: string;

  @ApiProperty({ type: [OrderItemDto], required: false })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items?: OrderItemDto[];

  @ApiPropertyOptional({ type: [ServiceBookingItemDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ServiceBookingItemDto)
  services?: ServiceBookingItemDto[];

  @ApiProperty({ type: AddressDto, required: false })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  shippingAddress?: AddressDto;

  @ApiProperty({
    enum: V3TransactionChannel,
    default: V3TransactionChannel.ECOMMERCE_STORE,
  })
  @IsEnum(V3TransactionChannel)
  @IsOptional()
  channel?: V3TransactionChannel;

  @ApiProperty({ example: "Leave at the front door", required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
