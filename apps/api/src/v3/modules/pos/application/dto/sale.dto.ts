import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
  ValidateNested,
  IsOptional,
  Min,
  IsBoolean,
} from "class-validator";
import { Type } from "class-transformer";

export class SaleItemDto {
  @ApiProperty({ example: "var_123", description: "Product variant ID" })
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @ApiPropertyOptional({ example: "prod_123", description: "Optional product ID" })
  @IsString()
  @IsOptional()
  productId?: string;

  @ApiPropertyOptional({ example: "Whole Milk 1L", description: "Optional product name" })
  @IsString()
  @IsOptional()
  productName?: string;

  @ApiPropertyOptional({ example: "1L Bottle", description: "Optional variant name" })
  @IsString()
  @IsOptional()
  variantName?: string;

  @ApiPropertyOptional({ example: "unit_123", description: "Optional selling unit ID" })
  @IsString()
  @IsOptional()
  sellingUnitId?: string;

  @ApiPropertyOptional({ example: "Bottle", description: "Optional selling unit name" })
  @IsString()
  @IsOptional()
  sellingUnitName?: string;

  @ApiProperty({ example: 2, description: "Quantity of the variant purchased" })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({
    example: 15.99,
    description: "Client provided price (validated against DB or defaults to variant retail price)",
  })
  @IsNumber()
  @IsOptional()
  unitPrice?: number;
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

  @ApiPropertyOptional({ description: "Optional payment metadata" })
  @IsOptional()
  meta?: any;
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

  @ApiPropertyOptional({ example: "mem_123", description: "Optional member ID override" })
  @IsString()
  @IsOptional()
  memberId?: string;

  @ApiPropertyOptional({ example: "SALE-123456", description: "Optional sale number" })
  @IsString()
  @IsOptional()
  saleNumber?: string;

  @ApiPropertyOptional({ example: false, description: "Whether this is a wholesale sale" })
  @IsBoolean()
  @IsOptional()
  isWholesale?: boolean;

  @ApiPropertyOptional({ example: "cust_123", description: "Optional customer ID" })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ example: "biz_123", description: "Optional business account ID" })
  @IsString()
  @IsOptional()
  businessAccountId?: string;

  @ApiPropertyOptional({ example: "COMPLETED", description: "Optional payment status" })
  @IsString()
  @IsOptional()
  paymentStatus?: string;

  @ApiPropertyOptional({ example: "STK_PUSH", description: "Optional M-Pesa transaction flow type" })
  @IsString()
  @IsOptional()
  mpesaType?: string;

  @ApiPropertyOptional({ example: "254712345678", description: "Optional M-Pesa phone number" })
  @IsString()
  @IsOptional()
  mpesaPhoneNumber?: string;

  @ApiPropertyOptional({ example: 1000, description: "Optional forced immediate sync threshold" })
  @IsNumber()
  @IsOptional()
  forcedImmediateSyncThreshold?: number;

  @ApiPropertyOptional({ example: 100, description: "Optional total transaction amount" })
  @IsNumber()
  @IsOptional()
  total?: number;

  @ApiPropertyOptional({ example: 100, description: "Optional amount received from customer" })
  @IsNumber()
  @IsOptional()
  amountReceived?: number;

  @ApiPropertyOptional({ example: 0, description: "Optional change amount returned to customer" })
  @IsNumber()
  @IsOptional()
  change?: number;

  @ApiPropertyOptional({ example: "drawer_123", description: "Optional cash drawer ID" })
  @IsString()
  @IsOptional()
  cashDrawerId?: string;

  @ApiPropertyOptional({ example: true, description: "Whether stock tracking is enabled" })
  @IsBoolean()
  @IsOptional()
  enableStockTracking?: boolean;

  @ApiPropertyOptional({ example: ["tax_123"], description: "Optional tax IDs applied" })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  taxIds?: string[];

  @ApiPropertyOptional({ example: "John Doe", description: "Optional cashier name" })
  @IsString()
  @IsOptional()
  cashierName?: string;

  @ApiPropertyOptional({ example: "123456", description: "Optional account reference number" })
  @IsString()
  @IsOptional()
  accountRef?: string;

  @ApiPropertyOptional({ example: "rx_123", description: "Optional prescription ID for pharmacy POS" })
  @IsString()
  @IsOptional()
  prescriptionId?: string;

  @ApiPropertyOptional({ example: "Dr. Smith", description: "Optional doctor name for pharmacy POS" })
  @IsString()
  @IsOptional()
  doctorName?: string;
}
