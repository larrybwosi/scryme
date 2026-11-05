import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsArray, IsDateString, IsBoolean } from "class-validator";

export interface BookingConflictWarning {
  code:
    | "STAFF_SHIFT_CONFLICT"
    | "STAFF_BOOKING_OVERLAP"
    | "STAFF_CAPACITY_OVERLOAD"
    | "RESOURCE_OVERLAP"
    | "CUSTOMER_DOUBLE_BOOKING"
    | "LOCATION_HOURS_VIOLATION";
  message: string;
  memberId?: string;
  resourceId?: string;
  customerId?: string;
  details?: Record<string, any>;
}

export class CheckBookingConflictsDto {
  @ApiProperty({ description: "Service ID" })
  @IsString()
  serviceId: string;

  @ApiPropertyOptional({ description: "Customer ID" })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ description: "Location ID" })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiProperty({ description: "Scheduled start time" })
  @IsDateString()
  scheduledStartTime: string;

  @ApiPropertyOptional({ description: "Scheduled end time" })
  @IsOptional()
  @IsDateString()
  scheduledEndTime?: string;

  @ApiPropertyOptional({ description: "Assigned staff IDs" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  staffIds?: string[];

  @ApiPropertyOptional({ description: "Assigned resource IDs" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  resourceIds?: string[];

  @ApiPropertyOptional({ description: "Exclude booking ID when rescheduling" })
  @IsOptional()
  @IsString()
  excludeBookingId?: string;
}

export class GenerateBookingTasksDto {
  @ApiPropertyOptional({ description: "Target Project ID for Task" })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ description: "Custom task title prefix or override" })
  @IsOptional()
  @IsString()
  titleOverride?: string;

  @ApiPropertyOptional({ description: "Include checklist items" })
  @IsOptional()
  @IsBoolean()
  includeChecklist?: boolean;
}
