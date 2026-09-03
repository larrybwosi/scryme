import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
  ValidateNested,
  IsOptional,
  Min,
} from "class-validator";
import { Type } from "class-transformer";

export class SaleItemDto {
  @ApiProperty({ example: "var_123", description: "Product variant ID" })
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @ApiProperty({ example: 2, description: "Quantity of the variant purchased" })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({
    example: 15.99,
    description: "Client provided price (validated against DB)",
  })
  @IsNumber()
  unitPrice: number;
}

export class SaleServiceItemDto {
  @ApiProperty({ example: "srv_123", description: "Service ID" })
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({ example: 1, description: "Quantity of the service purchased" })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({
    example: 45.00,
    description: "Optional unit price override (defaults to service base price if not provided)",
  })
  @IsNumber()
  @IsOptional()
  unitPrice?: number;

  @ApiPropertyOptional({
    example: "bk_123",
    description: "Option A: Optional existing booking ID to associate, complete, and consume materials for",
  })
  @IsString()
  @IsOptional()
  bookingId?: string;

  @ApiPropertyOptional({
    example: "Notes for service",
    description: "Optional notes for the service line item",
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class SalePaymentDto {
  @ApiProperty({ example: "CASH", description: "Payment method (e.g. CASH, CARD, MPESA)" })
  @IsString()
  @IsNotEmpty()
  method: string;

  @ApiProperty({ example: 31.98, description: "Payment amount" })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ example: "TXN12345", description: "Optional gateway transaction reference or check number" })
  @IsString()
  @IsOptional()
  reference?: string;
}

export class ProcessSaleDto {
  @ApiPropertyOptional({ type: [SaleItemDto], description: "List of physical product variants purchased" })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items?: SaleItemDto[];

  @ApiPropertyOptional({ type: [SaleItemDto], description: "Alias for items" })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  cartItems?: SaleItemDto[];

  @ApiPropertyOptional({ type: [SaleServiceItemDto], description: "List of services purchased (Option A with bookingId or Option C without)" })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SaleServiceItemDto)
  serviceItems?: SaleServiceItemDto[];

  @ApiPropertyOptional({ type: [SalePaymentDto], description: "List of payments applied to this transaction" })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SalePaymentDto)
  payments?: SalePaymentDto[];

  @ApiPropertyOptional({ example: "CASH", description: "Optional payment method if single payment method provided" })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 0, description: "Generic discount amount applied to the overall transaction" })
  @IsNumber()
  @IsOptional()
  discountAmount?: number;

  @ApiPropertyOptional({ example: "+1234567890", description: "Optional customer phone number (auto-creates or links customer)" })
  @IsString()
  @IsOptional()
  customerPhone?: string;

  @ApiPropertyOptional({ example: "Quick sale", description: "Optional transaction notes" })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: "VCH-1234", description: "Optional loyalty voucher code to apply discount" })
  @IsString()
  @IsOptional()
  loyaltyVoucherCode?: string;

  @ApiPropertyOptional({ example: "loc_123", description: "Optional location ID override" })
  @IsString()
  @IsOptional()
  locationId?: string;
}
