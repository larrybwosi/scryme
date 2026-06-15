import {ApiProperty} from "@nestjs/swagger";
import {IsNotEmpty, IsString, IsOptional, IsPhoneNumber} from "class-validator";

export class CheckoutDto {
  @ApiProperty({example: "cart_123"})
  @IsString()
  @IsOptional()
  cartId?: string;

  @ApiProperty({example: "sess_123"})
  @IsString()
  @IsOptional()
  sessionId?: string;

  @ApiProperty({example: "254700000000"})
  @IsPhoneNumber("KE")
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({example: "loc_123"})
  @IsString()
  @IsNotEmpty()
  locationId: string;

  @ApiProperty({example: "Please leave at the door"})
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
  status: string;

  @ApiProperty()
  merchantRequestID: string;

  @ApiProperty()
  checkoutRequestID: string;
}
