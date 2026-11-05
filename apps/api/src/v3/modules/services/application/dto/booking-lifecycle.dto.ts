import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsArray, IsBoolean } from "class-validator";
import { BookingStatus, ChecklistStage, TaskPriority } from "@repo/db";

export class TransitionBookingStatusDto {
  @ApiProperty({ enum: BookingStatus, description: "Target booking lifecycle status" })
  @IsEnum(BookingStatus)
  @IsNotEmpty()
  status!: BookingStatus;

  @ApiPropertyOptional({ description: "Reason for transition (especially for cancellations or overrides)" })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ description: "Assigned staff member IDs (for ASSIGNED status or re-assignment)" })
  @IsArray()
  @IsOptional()
  staffMemberIds?: string[];

  @ApiPropertyOptional({ description: "Allow manager override on detected soft conflicts" })
  @IsBoolean()
  @IsOptional()
  overrideConflict?: boolean;
}

export class CheckBookingConflictsDto {
  @ApiProperty({ description: "Start time of booking" })
  @IsNotEmpty()
  startTime!: string;

  @ApiProperty({ description: "End time of booking" })
  @IsNotEmpty()
  endTime!: string;

  @ApiPropertyOptional({ description: "Staff member IDs to check" })
  @IsArray()
  @IsOptional()
  staffMemberIds?: string[];

  @ApiPropertyOptional({ description: "Customer ID to check for double bookings" })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ description: "Location ID to check capacity" })
  @IsString()
  @IsOptional()
  locationId?: string;

  @ApiPropertyOptional({ description: "Booking ID to exclude from conflict overlap" })
  @IsString()
  @IsOptional()
  excludeBookingId?: string;
}

export class UpdateChecklistItemDto {
  @ApiProperty({ description: "Whether the checklist item is completed" })
  @IsBoolean()
  isCompleted!: boolean;
}

export class GenerateBookingTasksRequestDto {
  @ApiPropertyOptional({ description: "Target Project ID for Task" })
  @IsString()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({ description: "Assignee member ID" })
  @IsString()
  @IsOptional()
  assigneeMemberId?: string;

  @ApiPropertyOptional({ description: "Include checklist templates" })
  @IsBoolean()
  @IsOptional()
  includeChecklist?: boolean;
}

export class AssignBookingStaffDto {
  @ApiProperty({ description: "List of staff member IDs to assign" })
  @IsArray()
  @IsString({ each: true })
  staffMemberIds!: string[];

  @ApiPropertyOptional({ description: "Optional manager note or reassignment reason" })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ description: "Allow manager override on conflicts" })
  @IsBoolean()
  @IsOptional()
  overrideConflict?: boolean;
}

export class CreateChecklistTemplateDto {
  @ApiProperty({ description: "Template title" })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ description: "Template description" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: "Associated service ID" })
  @IsString()
  @IsOptional()
  serviceId?: string;

  @ApiPropertyOptional({ description: "Template checklist items" })
  @IsArray()
  @IsOptional()
  items?: {
    title: string;
    description?: string;
    stage: ChecklistStage;
    isRequired?: boolean;
    order?: number;
  }[];
}
