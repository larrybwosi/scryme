import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean } from "class-validator";

export class CreateDeliveryPartnerDto {
  @ApiProperty({ description: "Partner name" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: "Email" })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: "Phone number" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: "Address" })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: "Commission rate percentage" })
  @IsOptional()
  @IsNumber()
  commissionRate?: number;

  @ApiPropertyOptional({ description: "Fixed fee amount" })
  @IsOptional()
  @IsNumber()
  fixedFee?: number;

  @ApiPropertyOptional({ description: "Benefit type" })
  @IsOptional()
  @IsString()
  benefitType?: string;

  @ApiPropertyOptional({ description: "Reconciliation policy" })
  @IsOptional()
  @IsString()
  reconciliationPolicy?: string;

  @ApiPropertyOptional({ description: "Is partner active", default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateDeliveryPartnerDto {
  @ApiPropertyOptional({ description: "Partner name" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: "Email" })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: "Phone number" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: "Address" })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: "Commission rate percentage" })
  @IsOptional()
  @IsNumber()
  commissionRate?: number;

  @ApiPropertyOptional({ description: "Fixed fee amount" })
  @IsOptional()
  @IsNumber()
  fixedFee?: number;

  @ApiPropertyOptional({ description: "Benefit type" })
  @IsOptional()
  @IsString()
  benefitType?: string;

  @ApiPropertyOptional({ description: "Reconciliation policy" })
  @IsOptional()
  @IsString()
  reconciliationPolicy?: string;

  @ApiPropertyOptional({ description: "Is partner active" })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AdjustWalletDto {
  @ApiProperty({ description: "Adjustment amount" })
  @IsNumber()
  amount!: number;

  @ApiPropertyOptional({ description: "Transaction type (ADJUSTMENT, TOPUP, DEDUCTION)" })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: "Notes" })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class DispatchDeliveryDto {
  @ApiProperty({ description: "Transaction ID" })
  @IsString()
  @IsNotEmpty()
  transactionId!: string;

  @ApiPropertyOptional({ description: "Delivery Partner ID" })
  @IsOptional()
  @IsString()
  partnerId?: string;

  @ApiPropertyOptional({ description: "Driver ID" })
  @IsOptional()
  @IsString()
  driverId?: string;

  @ApiPropertyOptional({ description: "Delivery notes" })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReconcileDeliveryDto {
  @ApiProperty({ description: "Fulfillment ID" })
  @IsString()
  @IsNotEmpty()
  fulfillmentId!: string;

  @ApiProperty({ description: "Fulfillment status (DELIVERED or CANCELLED)" })
  @IsString()
  @IsNotEmpty()
  status!: string;

  @ApiPropertyOptional({ description: "Notes" })
  @IsOptional()
  @IsString()
  notes?: string;
}
