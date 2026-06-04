import { IsString, IsOptional, IsNumber, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StockRequestPriority } from '@repo/db';

class StockRequestItemDto {
  @ApiProperty()
  @IsString()
  variantId: string;

  @ApiProperty()
  @IsNumber()
  requestedQuantity: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  unitCost?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reason?: string;
}

export class CreateStockRequestDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fromLocationId?: string;

  @ApiProperty()
  @IsString()
  toLocationId: string;

  @ApiPropertyOptional({ enum: StockRequestPriority })
  @IsEnum(StockRequestPriority)
  @IsOptional()
  priority?: StockRequestPriority;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  justification?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  totalEstimatedCost?: number;

  @ApiProperty({ type: [StockRequestItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockRequestItemDto)
  items: StockRequestItemDto[];
}
