import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsArray, IsBoolean } from "class-validator";
import { BookingStatus, ChecklistStage, TaskPriority } from "@repo/db";

export class TransitionBookingStatusDto {
  @ApiProperty({ enum: BookingStatus, description: "Target booking lifecycle status" })
  @IsEnum(BookingStatus)
  @IsNotEmpty()
  status!: BookingStatus;

  @ApiPropertyOptional({ description: "Reason for transition (especially for cancellations or changes)" })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ description: "Assigned staff member IDs (for ASSIGNED status)" })
  @IsArray()
  @IsOptional()
  staffMemberIds?: string[];
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
