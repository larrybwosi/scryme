import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsDateString, IsBoolean, IsNumber, IsEnum } from "class-validator";
import { PaginationQueryDto } from "@/v3/common/dto/pagination.dto";

export enum ShiftAttendanceStatus {
  ON_TIME = "ON_TIME",
  LATE = "LATE",
  EARLY = "EARLY",
  UNSCHEDULED = "UNSCHEDULED",
  NO_SHOW = "NO_SHOW",
}

export enum AttendanceVerificationMethod {
  POS_DEVICE = "POS_DEVICE",
  GPS_GEOFENCE = "GPS_GEOFENCE",
  QR_SCAN = "QR_SCAN",
  MANAGER_OVERRIDE = "MANAGER_OVERRIDE",
  WEB_PORTAL = "WEB_PORTAL",
}

export class AttendanceQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  memberId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class CheckInDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branchCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(AttendanceVerificationMethod)
  verificationMethod?: AttendanceVerificationMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CheckOutDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isAutoCheckout?: boolean;
}

export class AttendanceLogResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  memberId: string;

  @ApiProperty()
  checkInTime: Date;

  @ApiPropertyOptional()
  checkOutTime?: Date;

  @ApiProperty()
  checkInLocationId: string;

  @ApiPropertyOptional()
  checkOutLocationId?: string;

  @ApiPropertyOptional()
  durationMinutes?: number;

  @ApiPropertyOptional()
  notes?: string;

  @ApiPropertyOptional()
  shiftId?: string;

  @ApiPropertyOptional()
  shiftStatus?: ShiftAttendanceStatus;

  @ApiPropertyOptional()
  verificationMethod?: AttendanceVerificationMethod;

  @ApiPropertyOptional()
  isLocationVerified?: boolean;

  @ApiPropertyOptional()
  distanceMeters?: number;
}
