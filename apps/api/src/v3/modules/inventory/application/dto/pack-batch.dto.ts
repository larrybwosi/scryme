import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PackBatchDto {
  @ApiProperty({ description: 'The base unit batch ID to pack' })
  @IsString()
  batchId: string;

  @ApiProperty({ description: 'Number of base units to pack (e.g., 24 pieces)' })
  @IsNumber()
  quantityToPack: number;

  @ApiProperty({ description: 'Conversion factor (e.g., 24 pieces/carton)' })
  @IsNumber()
  unitsPerPackage: number;

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
