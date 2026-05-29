import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, ValidateNested, IsNumber, IsOptional, IsEnum, IsDateString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

// fallow-ignore-next-line unused-exports
export class DispatchAddressDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  zip?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  country?: string;
}

// fallow-ignore-next-line unused-exports
export class ManualBatchSelectionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  batchId: string;

  @ApiProperty()
  @IsNumber()
  quantity: number;
}

export class DispatchOrderDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  driverId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  deliveryPartnerId?: string;

  @ApiPropertyOptional({ type: DispatchAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DispatchAddressDto)
  deliveryAddress?: DispatchAddressDto;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  estimatedTime?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  deliveryFee?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ type: [ManualBatchSelectionDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ManualBatchSelectionDto)
  manualBatches?: ManualBatchSelectionDto[];
}

export enum ReconciliationOutcome {
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  PARTIAL = 'PARTIAL',
}

export class ReconcilePodDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fulfillmentId: string;

  @ApiProperty({ enum: ReconciliationOutcome })
  @IsEnum(ReconciliationOutcome)
  outcome: ReconciliationOutcome;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  quantityDelivered?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  proofOfDeliveryUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  receivedBy?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  failureReason?: string;
}
