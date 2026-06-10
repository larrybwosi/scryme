import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsArray, ValidateNested, IsNumber, IsEnum, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { AddressDto } from '../../../customers/application/dto/register-customer.dto';

export class OrderItemDto {
  @ApiProperty({ example: 'variant_123' })
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({ example: 15.50, required: false })
  @IsNumber()
  @IsOptional()
  unitPrice?: number;
}

export enum V3TransactionChannel {
  ECOMMERCE_STORE = 'ECOMMERCE_STORE',
  MOBILE_APP = 'MOBILE_APP',
}

export class CreateOrderDto {
  @ApiProperty({ example: 'cust_123', required: false, description: 'Internal customer ID. If omitted, it will be treated as a guest checkout.' })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiProperty({ example: 'loc_123', description: 'Inventory location ID' })
  @IsString()
  @IsNotEmpty()
  locationId: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ type: AddressDto, required: false })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  shippingAddress?: AddressDto;

  @ApiProperty({ enum: V3TransactionChannel, default: V3TransactionChannel.ECOMMERCE_STORE })
  @IsEnum(V3TransactionChannel)
  @IsOptional()
  channel?: V3TransactionChannel;

  @ApiProperty({ example: 'Leave at the front door', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: 'LPO-2023-001', required: false })
  @IsString()
  @IsOptional()
  lpoNumber?: string;

  @ApiProperty({ example: '2023-10-01T00:00:00Z', required: false })
  @IsString()
  @IsOptional()
  lpoDate?: string;

  @ApiProperty({ example: '2023-12-31T00:00:00Z', required: false })
  @IsString()
  @IsOptional()
  lpoExpiryDate?: string;

  @ApiProperty({ example: 'https://storage.example.com/lpos/lpo-001.pdf', required: false })
  @IsString()
  @IsOptional()
  lpoUrl?: string;
}
