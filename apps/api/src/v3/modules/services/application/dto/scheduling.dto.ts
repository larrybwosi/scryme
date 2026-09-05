import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { BookingStatus, ScheduleOverrideType } from "@repo/db";
import { Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export class CalendarQueryDto {
  @ApiProperty({ format: "date-time" })
  @IsDateString()
  from!: string;

  @ApiProperty({ format: "date-time" })
  @IsDateString()
  to!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  memberId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiPropertyOptional({ enum: BookingStatus, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(BookingStatus, { each: true })
  status?: BookingStatus[];

  @ApiPropertyOptional({ minimum: 1, maximum: 250, default: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(250)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cursor?: string;
}

export class RescheduleBookingDto {
  @ApiProperty({ format: "date-time" })
  @IsDateString()
  scheduledStartTime!: string;

  @ApiPropertyOptional({ format: "date-time" })
  @IsOptional()
  @IsDateString()
  scheduledEndTime?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  staffIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  resourceIds?: string[];

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  revision!: number;
}

export class BookingTransitionDto {
  @ApiProperty({ enum: BookingStatus })
  @IsEnum(BookingStatus)
  status!: BookingStatus;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  revision!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class AssignmentResponseDto {
  @ApiProperty({ enum: ["ACCEPTED", "DECLINED"] })
  @IsEnum({ ACCEPTED: "ACCEPTED", DECLINED: "DECLINED" })
  response!: "ACCEPTED" | "DECLINED";

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  revision!: number;
}

export class CreateScheduleOverrideDto {
  @ApiProperty({ enum: ScheduleOverrideType })
  @IsEnum(ScheduleOverrideType)
  type!: ScheduleOverrideType;

  @ApiProperty({ format: "date-time" })
  @IsDateString()
  startTime!: string;

  @ApiProperty({ format: "date-time" })
  @IsDateString()
  endTime!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locationId?: string;
}
