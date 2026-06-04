import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UnpackBatchDto {
  @ApiProperty({ description: 'The bulk batch ID to unpack' })
  @IsString()
  batchId: string;

  @ApiProperty({ description: 'Number of bulk units to unpack (e.g., 2 Cartons)' })
  @IsNumber()
  quantityToUnpack: number;

  @ApiProperty({ description: 'Conversion factor (e.g., 24 pieces/carton)' })
  @IsNumber()
  unitsPerPackage: number;

  @ApiPropertyOptional({ description: 'Number of base units found damaged inside' })
  @IsNumber()
  @IsOptional()
  damagedQuantity?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  targetSystemUnitId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  targetOrgUnitId?: string;
}
