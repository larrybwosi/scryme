import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsEmail, Length, IsEnum } from "class-validator";

export enum PublicBookingPaymentOption {
  PAY_AT_VENUE = "PAY_AT_VENUE",
  MPESA = "MPESA",
}

export class RequestOtpDto {
  @ApiPropertyOptional({ description: "Phone number to send OTP to" })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: "Email address to send OTP to" })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class VerifyOtpDto {
  @ApiPropertyOptional({ description: "Phone number used" })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: "Email address used" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: "OTP code" })
  @IsString()
  @Length(6, 6)
  code: string;
}

export class PublicBookingDto {
  @ApiProperty({ description: "Service ID" })
  @IsString()
  serviceId: string;

  @ApiProperty({ description: "Verification ID (from OTP verification)" })
  @IsString()
  verificationId: string;

  @ApiProperty({ description: "Scheduled start time" })
  @IsString()
  scheduledStartTime: string;

  @ApiPropertyOptional({ description: "Scheduled end time (optional)" })
  @IsOptional()
  @IsString()
  scheduledEndTime?: string;

  @ApiPropertyOptional({ description: "Location ID for the service appointment" })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional({
    enum: PublicBookingPaymentOption,
    default: PublicBookingPaymentOption.PAY_AT_VENUE,
    description: "Payment preference: PAY_AT_VENUE or MPESA",
  })
  @IsOptional()
  @IsEnum(PublicBookingPaymentOption)
  paymentOption?: PublicBookingPaymentOption;

  @ApiPropertyOptional({ description: "Phone number for M-Pesa STK push if chosen" })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: "Booking notes" })
  @IsOptional()
  @IsString()
  notes?: string;
}
