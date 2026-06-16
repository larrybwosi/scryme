import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsEmail,
  IsBoolean,
} from "class-validator";
import { BenefitType, ReconciliationPolicy } from "@repo/db";

export class CreatePartnerDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ enum: BenefitType })
  @IsEnum(BenefitType)
  @IsOptional()
  benefitType?: BenefitType;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  commissionRate?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  fixedFee?: number;

  @ApiPropertyOptional({ enum: ReconciliationPolicy })
  @IsEnum(ReconciliationPolicy)
  @IsOptional()
  reconciliationPolicy?: ReconciliationPolicy;
}

export class UpdatePartnerDto extends CreatePartnerDto {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class PartnerWalletActionDto {
  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
