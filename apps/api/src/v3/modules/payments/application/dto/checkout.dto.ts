import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  ValidateIf,
} from "class-validator";

export enum CheckoutPaymentMethod {
  MPESA = "MPESA",
  CASH_ON_DELIVERY = "CASH_ON_DELIVERY",
  PAY_AT_VENUE = "PAY_AT_VENUE",
}

export class CheckoutDto {
  @ApiPropertyOptional({ example: "cart_123" })
  @IsString()
  @IsOptional()
  cartId?: string;

  @ApiPropertyOptional({ example: "sess_123" })
  @IsString()
  @IsOptional()
  sessionId?: string;

  @ApiPropertyOptional({ example: "254700000000" })
  @ValidateIf((o) => o.paymentMethod === CheckoutPaymentMethod.MPESA || !o.paymentMethod)
  @IsNotEmpty({ message: "Phone number is required for M-Pesa payments" })
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: "loc_123" })
  @IsString()
  @IsOptional()
  locationId?: string;

  @ApiPropertyOptional({
    enum: CheckoutPaymentMethod,
    default: CheckoutPaymentMethod.MPESA,
    description: "Payment method: MPESA, CASH_ON_DELIVERY, or PAY_AT_VENUE",
  })
  @IsOptional()
  @IsEnum(CheckoutPaymentMethod)
  paymentMethod?: CheckoutPaymentMethod;

  @ApiPropertyOptional({ example: "Please leave at the door" })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CheckoutResponseDto {
  @ApiProperty()
  orderId: string;

  @ApiProperty()
  paymentId: string;

  @ApiProperty()
  paymentMethod: string;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  merchantRequestID?: string;

  @ApiPropertyOptional()
  checkoutRequestID?: string;
}
