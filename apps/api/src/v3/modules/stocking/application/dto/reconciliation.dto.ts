import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsNumber,
  IsOptional,
} from "class-validator";
import { Type } from "class-transformer";

export class ReconciliationItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @ApiProperty()
  @IsNumber()
  actualQuantity: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class SubmitReconciliationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  locationId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ type: [ReconciliationItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReconciliationItemDto)
  items: ReconciliationItemDto[];
}
