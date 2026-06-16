import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsNumber,
  IsOptional,
  IsEnum,
} from "class-validator";
import { Type } from "class-transformer";
import { StockRequestPriority } from "@repo/db";

export class CreateTransferItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @ApiProperty()
  @IsNumber()
  requestedQuantity: number;
}

export class CreateTransferDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fromLocationId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  toLocationId: string;

  @ApiPropertyOptional({ enum: StockRequestPriority })
  @IsEnum(StockRequestPriority)
  @IsOptional()
  priority?: StockRequestPriority = StockRequestPriority.MEDIUM;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ type: [CreateTransferItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTransferItemDto)
  items: CreateTransferItemDto[];
}

export class ShipTransferItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  transferItemId: string;

  @ApiProperty()
  @IsNumber()
  shippedQuantity: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  stockBatchId?: string;
}

export class ShipTransferDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  carrier?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  trackingNumber?: string;

  @ApiProperty({ type: [ShipTransferItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShipTransferItemDto)
  items: ShipTransferItemDto[];
}

export class ReceiveTransferItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  transferItemId: string;

  @ApiProperty()
  @IsNumber()
  receivedQuantity: number;
}

export class ReceiveTransferDto {
  @ApiProperty({ type: [ReceiveTransferItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiveTransferItemDto)
  items: ReceiveTransferItemDto[];
}
