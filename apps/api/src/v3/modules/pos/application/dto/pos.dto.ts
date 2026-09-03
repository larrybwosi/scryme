import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, ValidateNested, IsEnum, IsBoolean } from "class-validator";
import { Type } from "class-transformer";

export class ProvisionDeviceDto {
  @ApiProperty({
    example: "setup_123",
    description: "The setup token generated in the dashboard",
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class PosLoginDto {
  @ApiPropertyOptional({
    example: "device_123",
    description: "The Client ID of the provisioned device",
  })
  @IsString()
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional({
    example: "device_key_123",
    description: "The device key of the provisioned device (alias for clientId)",
  })
  @IsString()
  @IsOptional()
  deviceKey?: string;

  @ApiPropertyOptional({
    example: "loc_123",
    description: "Optional location ID context",
  })
  @IsString()
  @IsOptional()
  locationId?: string;

  @ApiPropertyOptional({ example: "1234", description: "The staff PIN" })
  @IsString()
  @IsOptional()
  pin?: string;

  @ApiPropertyOptional({
    example: "CARD-123",
    description: "Optional card ID for optimized member lookup",
  })
  @IsString()
  @IsOptional()
  cardId?: string;
}

export class PosCheckOutDto {
  @ApiPropertyOptional({ example: "loc_123", description: "Check-out location ID" })
  @IsString()
  @IsOptional()
  locationId?: string;
}

export class PosLoginResponseDto {
  @ApiProperty({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." })
  accessToken: string;
}

export class ProvisionResponseDto {
  @ApiProperty({ example: "client_id_123" })
  clientId: string;

  @ApiProperty({ example: "client_secret_456" })
  clientSecret: string;
}

export class PosRecordPaymentDto {
  @ApiProperty({ example: "tx_123" })
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: "CASH" })
  @IsString()
  @IsNotEmpty()
  method: string;

  @ApiPropertyOptional({ example: "REF123" })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiPropertyOptional({ example: "+254700000000" })
  @IsString()
  @IsOptional()
  payerPhone?: string;
}

export class PosAdjustStockDto {
  @ApiPropertyOptional({ example: "prod_123" })
  @IsString()
  @IsOptional()
  productId?: string;

  @ApiPropertyOptional({ example: "var_123" })
  @IsString()
  @IsOptional()
  variantId?: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  quantityDelta: number;

  @ApiPropertyOptional({ example: "loc_123" })
  @IsString()
  @IsOptional()
  locationId?: string;

  @ApiPropertyOptional({ example: "Stock correction" })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class PosCreateCustomerDto {
  @ApiProperty({ example: "John Doe" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: "+254712345678" })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: "john@example.com" })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: "Acme Corp" })
  @IsString()
  @IsOptional()
  company?: string;

  @ApiPropertyOptional({ example: "B2B" })
  @IsString()
  @IsOptional()
  customerType?: string;

  @ApiPropertyOptional({ example: "male" })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({ example: "1990-01-01" })
  @IsString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: "VIP customer" })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: "No penicillin" })
  @IsString()
  @IsOptional()
  medicalHistory?: string;

  @ApiPropertyOptional({ example: "Peanuts" })
  @IsString()
  @IsOptional()
  allergies?: string;

  @ApiPropertyOptional({ example: "Hypertension" })
  @IsString()
  @IsOptional()
  chronicConditions?: string;

  @ApiPropertyOptional({ example: "Aetna" })
  @IsString()
  @IsOptional()
  insuranceProvider?: string;

  @ApiPropertyOptional({ example: "POL12345" })
  @IsString()
  @IsOptional()
  policyNumber?: string;

  @ApiPropertyOptional({ example: "Deliver to back door" })
  @IsString()
  @IsOptional()
  deliveryNotes?: string;

  @ApiPropertyOptional({ example: "mem_123" })
  @IsString()
  @IsOptional()
  memberId?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isBusiness?: boolean;

  @ApiPropertyOptional({ example: "TAX123" })
  @IsString()
  @IsOptional()
  taxId?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @IsOptional()
  loyaltyPoints?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: "tier_123" })
  @IsString()
  @IsOptional()
  loyaltyTierId?: string;

  @ApiPropertyOptional({ example: "https://example.com/avatar.jpg" })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiPropertyOptional()
  @IsOptional()
  addresses?: any;

  @ApiPropertyOptional()
  @IsOptional()
  address?: any;

  @ApiPropertyOptional()
  @IsOptional()
  pinnedLocation?: any;

  @ApiPropertyOptional({ example: ["vip", "retail"] })
  @IsArray()
  @IsOptional()
  tags?: string[];
}

export class PosDispatchDeliveryDto {
  @ApiProperty({ example: "driver_123" })
  @IsString()
  @IsNotEmpty()
  driverId: string;

  @ApiPropertyOptional({ example: "Special handling requested" })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class PosReconcileDeliveryDto {
  @ApiProperty({ example: "ful_123" })
  @IsString()
  @IsNotEmpty()
  fulfilmentId: string;

  @ApiProperty({ example: "SUCCESS" })
  @IsString()
  @IsNotEmpty()
  outcome: string;

  @ApiPropertyOptional({ example: "Jane Doe" })
  @IsString()
  @IsOptional()
  receivedBy?: string;

  @ApiPropertyOptional({ example: "https://example.com/proof.jpg" })
  @IsString()
  @IsOptional()
  proofImage?: string;

  @ApiPropertyOptional({ example: "Recipient not home" })
  @IsString()
  @IsOptional()
  failureReason?: string;
}

export class StockRequestItemDto {
  @ApiProperty({ example: "var_123" })
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @ApiProperty({ example: 5 })
  @IsNumber()
  requestedQuantity: number;

  @ApiPropertyOptional({ example: "Low stock" })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class PosCreateStockRequestDto {
  @ApiPropertyOptional({ example: "loc_456" })
  @IsString()
  @IsOptional()
  toLocationId?: string;

  @ApiPropertyOptional({ example: "HIGH" })
  @IsString()
  @IsOptional()
  priority?: string;

  @ApiPropertyOptional({ example: "Stock replenishment" })
  @IsString()
  @IsOptional()
  justification?: string;

  @ApiProperty({ type: [StockRequestItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockRequestItemDto)
  items: StockRequestItemDto[];
}

export class StockTransferItemDto {
  @ApiProperty({ example: "var_123" })
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  quantity: number;
}

export class PosCreateStockTransferDto {
  @ApiProperty({ example: "loc_1" })
  @IsString()
  @IsNotEmpty()
  fromLocationId: string;

  @ApiProperty({ example: "loc_2" })
  @IsString()
  @IsNotEmpty()
  toLocationId: string;

  @ApiPropertyOptional({ example: "Inter-branch transfer" })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ type: [StockTransferItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockTransferItemDto)
  items: StockTransferItemDto[];
}

export class PosShiftSyncDto {
  @ApiProperty({ example: "shift_123" })
  @IsString()
  @IsNotEmpty()
  shift_id: string;

  @ApiProperty({ example: "loc_123" })
  @IsString()
  @IsNotEmpty()
  location_id: string;
}

export class PosRegisterBarcodeDto {
  @ApiProperty({ example: "var_123" })
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @ApiProperty({ example: "6001234567890" })
  @IsString()
  @IsNotEmpty()
  barcode: string;
}
