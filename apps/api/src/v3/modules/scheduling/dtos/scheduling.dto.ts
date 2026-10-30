import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ScheduleOverrideType, BookingStatus } from "@repo/db";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export class CreateShiftDto {
  @ApiProperty({ example: "cuid_member_id" })
  @IsString()
  @IsNotEmpty()
  memberId!: string;

  @ApiProperty({ example: 1, description: "Day of week: 0 (Sunday) to 6 (Saturday)" })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @ApiProperty({ example: "08:00", description: "Format HH:mm" })
  @IsString()
  @IsNotEmpty()
  startTime!: string;

  @ApiProperty({ example: "17:00", description: "Format HH:mm" })
  @IsString()
  @IsNotEmpty()
  endTime!: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: "cuid_location_id" })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional({ example: "cuid_department_id" })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ example: ["cashier", "barista"], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleTags?: string[];
}

export class UpdateShiftDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @ApiPropertyOptional({ example: "08:00" })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({ example: "17:00" })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: "cuid_location_id" })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional({ example: "cuid_department_id" })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ example: ["cashier"], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleTags?: string[];
}

export class ShiftBreakDto {
  @ApiProperty({ example: "12:00" })
  @IsString()
  @IsNotEmpty()
  startTime!: string;

  @ApiProperty({ example: "13:00" })
  @IsString()
  @IsNotEmpty()
  endTime!: string;

  @ApiPropertyOptional({ example: "Lunch break" })
  @IsOptional()
  @IsString()
  description?: string;
}

export class RequestShiftTradeDto {
  @ApiProperty({ example: "cuid_shift_id" })
  @IsString()
  @IsNotEmpty()
  shiftId!: string;

  @ApiPropertyOptional({ example: "cuid_offered_shift_id" })
  @IsOptional()
  @IsString()
  offeredShiftId?: string;

  @ApiPropertyOptional({ example: "cuid_target_member_id" })
  @IsOptional()
  @IsString()
  targetMemberId?: string;

  @ApiPropertyOptional({ example: "SWAP", enum: ["SWAP", "OFFER", "BID"] })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: "Personal commitment" })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ProcessShiftTradeDto {
  @ApiProperty({ example: "APPROVE", enum: ["APPROVE", "REJECT", "CANCEL"] })
  @IsString()
  @IsNotEmpty()
  action!: "APPROVE" | "REJECT" | "CANCEL";
}

export class CreateScheduleOverrideDto {
  @ApiProperty({ example: "cuid_member_id" })
  @IsString()
  @IsNotEmpty()
  memberId!: string;

  @ApiProperty({ enum: ScheduleOverrideType, example: ScheduleOverrideType.UNAVAILABLE })
  @IsEnum(ScheduleOverrideType)
  type!: ScheduleOverrideType;

  @ApiProperty({ example: "2026-10-15T08:00:00.000Z" })
  @Type(() => Date)
  @IsDate()
  startTime!: Date;

  @ApiProperty({ example: "2026-10-15T17:00:00.000Z" })
  @Type(() => Date)
  @IsDate()
  endTime!: Date;

  @ApiPropertyOptional({ example: "Medical appointment" })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ example: "cuid_location_id" })
  @IsOptional()
  @IsString()
  locationId?: string;
}

export class CreateScheduledBookingDto {
  @ApiProperty({ example: "cuid_member_id" })
  @IsString()
  @IsNotEmpty()
  memberId!: string;

  @ApiProperty({ example: "cuid_service_id" })
  @IsString()
  @IsNotEmpty()
  serviceId!: string;

  @ApiProperty({ example: "2026-10-15T10:00:00.000Z" })
  @Type(() => Date)
  @IsDate()
  scheduledStartTime!: Date;

  @ApiPropertyOptional({ example: "2026-10-15T11:00:00.000Z" })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  scheduledEndTime?: Date;

  @ApiPropertyOptional({ example: "cuid_location_id" })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional({ example: "John Doe" })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ example: "john@example.com" })
  @IsOptional()
  @IsString()
  customerEmail?: string;

  @ApiPropertyOptional({ example: "+254700000000" })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiPropertyOptional({ example: "Customer requested quiet room" })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class TransitionBookingDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  revision!: number;

  @ApiProperty({ example: "IN_PROGRESS", enum: ["IN_PROGRESS", "COMPLETED", "CANCELLED", "NOSHOW"] })
  @IsString()
  status!: "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NOSHOW";
}

export class ManualAttendanceCheckInDto {
  @ApiProperty({ example: "cuid_member_id" })
  @IsString()
  @IsNotEmpty()
  memberId!: string;

  @ApiProperty({ example: "cuid_location_id" })
  @IsString()
  @IsNotEmpty()
  locationId!: string;

  @ApiPropertyOptional({ example: "Manager manual override check-in" })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ManualAttendanceCheckOutDto {
  @ApiProperty({ example: "cuid_member_id" })
  @IsString()
  @IsNotEmpty()
  memberId!: string;

  @ApiPropertyOptional({ example: "Manager manual override check-out" })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BranchCoordinatesDto {
  @ApiPropertyOptional({ example: -1.286389 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 36.817223 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  radiusMeters?: number;

  @ApiPropertyOptional({ example: "NRB-01" })
  @IsOptional()
  @IsString()
  branchCode?: string;
}
