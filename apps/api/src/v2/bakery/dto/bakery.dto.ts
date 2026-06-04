import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, IsUUID, IsBoolean, Min } from 'class-validator';

export class CreateIngredientDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  categoryId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  buyingPrice?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  reorderPoint?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  baseUnitId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  baseOrgUnitId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  stockingUnitId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  stockingOrgUnitId?: string;
}

export class UpdateIngredientDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  buyingPrice?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  reorderPoint?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  baseUnitId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  baseOrgUnitId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  stockingUnitId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  stockingOrgUnitId?: string;
}
