import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsEmail, Length } from "class-validator";

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

  @ApiPropertyOptional({ description: "Booking notes" })
  @IsOptional()
  @IsString()
  notes?: string;
}
