import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsEnum } from "class-validator";

export enum DeliveryStatus {
  PENDING = "PENDING",
  ASSIGNED = "ASSIGNED",
  PICKED_UP = "PICKED_UP",
  IN_TRANSIT = "IN_TRANSIT",
  DELIVERED = "DELIVERED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
  RETURNED = "RETURNED",
}

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

  @ApiPropertyOptional({ description: "Delivery Partner ID (3PL)" })
  @IsOptional()
  @IsString()
  partnerId?: string;

  @ApiPropertyOptional({ description: "Driver ID (Internal)" })
  @IsOptional()
  @IsString()
  driverId?: string;

  @ApiPropertyOptional({ description: "Delivery notes / instructions" })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AssignDriverPartnerDto {
  @ApiPropertyOptional({ description: "Driver ID" })
  @IsOptional()
  @IsString()
  driverId?: string;

  @ApiPropertyOptional({ description: "Delivery Partner ID" })
  @IsOptional()
  @IsString()
  partnerId?: string;
}

export class UpdateDeliveryStatusDto {
  @ApiProperty({
    description: "New status (PENDING, ASSIGNED, PICKED_UP, IN_TRANSIT, DELIVERED, FAILED, CANCELLED, RETURNED)",
    enum: DeliveryStatus,
  })
  @IsEnum(DeliveryStatus)
  @IsNotEmpty()
  status!: DeliveryStatus;

  @ApiPropertyOptional({ description: "Failure or cancellation reason" })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: "Delivery notes" })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ProofOfDeliveryDto {
  @ApiPropertyOptional({ description: "Recipient Signature (Base64 string or URL)" })
  @IsOptional()
  @IsString()
  signatureUrl?: string;

  @ApiPropertyOptional({ description: "Proof photo URL" })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional({ description: "Delivery PIN/Code" })
  @IsOptional()
  @IsString()
  deliveryPin?: string;

  @ApiPropertyOptional({ description: "Recipient Name" })
  @IsOptional()
  @IsString()
  recipientName?: string;
}

export class ReconcileDeliveryDto {
  @ApiProperty({ description: "Fulfillment ID" })
  @IsString()
  @IsNotEmpty()
  fulfillmentId!: string;

  @ApiProperty({ description: "Fulfillment status (DELIVERED, FAILED, CANCELLED, RETURNED)" })
  @IsEnum(DeliveryStatus)
  @IsNotEmpty()
  status!: DeliveryStatus;

  @ApiPropertyOptional({ description: "Delivered quantity" })
  @IsOptional()
  @IsNumber()
  quantityDelivered?: number;

  @ApiPropertyOptional({ description: "Proof of delivery data" })
  @IsOptional()
  pod?: ProofOfDeliveryDto;

  @ApiPropertyOptional({ description: "Failure / reconciliation notes" })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: "Failure reason code" })
  @IsOptional()
  @IsString()
  reasonCode?: string;
}
