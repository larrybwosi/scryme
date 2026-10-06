import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsDateString, IsEnum } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class AndroidEmailLoginDto {
  @ApiProperty({ description: "User email address", example: "staff@scryme.com" })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: "User password" })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({ description: "Optional organization slug to target" })
  @IsString()
  @IsOptional()
  orgSlug?: string;
}

export class AndroidEmailSignUpDto {
  @ApiProperty({ description: "User email address", example: "newstaff@scryme.com" })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: "User password" })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ description: "Full user name" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: "Optional organization slug to auto-join or scope" })
  @IsString()
  @IsOptional()
  orgSlug?: string;
}

export class AndroidMemberLoginDto {
  @ApiPropertyOptional({ description: "Staff PIN code" })
  @IsString()
  @IsOptional()
  pin?: string;

  @ApiPropertyOptional({ description: "NFC/RFID Card ID" })
  @IsString()
  @IsOptional()
  cardId?: string;
}

export class AndroidTokenExchangeDto {
  @ApiProperty({ description: "Client ID for token exchange" })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({ description: "Client secret for token exchange" })
  @IsString()
  @IsNotEmpty()
  clientSecret: string;
}

export class AndroidUpdateMemberStatusDto {
  @ApiProperty({ description: "Duty status: ONLINE, BUSY, OFFLINE", example: "ONLINE" })
  @IsString()
  @IsNotEmpty()
  dutyStatus: string;

  @ApiPropertyOptional({ description: "Availability boolean flag" })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;
}

export class AndroidUpdateMemberDto {
  @ApiPropertyOptional({ description: "Updated display name" })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: "Updated phone number" })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: "Updated member role" })
  @IsString()
  @IsOptional()
  role?: string;
}

export class AndroidCreateShiftDto {
  @ApiPropertyOptional({ description: "Location ID for the shift" })
  @IsString()
  @IsOptional()
  locationId?: string;

  @ApiProperty({ description: "Shift start ISO timestamp" })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ description: "Shift end ISO timestamp" })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiPropertyOptional({ description: "Role assigned for shift" })
  @IsString()
  @IsOptional()
  role?: string;

  @ApiPropertyOptional({ description: "Shift notes" })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class AndroidShiftBreakDto {
  @ApiPropertyOptional({ description: "Break type (e.g., MEAL, REST)" })
  @IsString()
  @IsOptional()
  breakType?: string;

  @ApiProperty({ description: "Break start ISO timestamp" })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiPropertyOptional({ description: "Break end ISO timestamp" })
  @IsString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({ description: "Is break paid" })
  @IsBoolean()
  @IsOptional()
  paid?: boolean;
}

export class AndroidRequestShiftTradeDto {
  @ApiProperty({ description: "Shift ID to trade" })
  @IsString()
  @IsNotEmpty()
  shiftId: string;

  @ApiPropertyOptional({ description: "Target member ID to trade with" })
  @IsString()
  @IsOptional()
  targetMemberId?: string;

  @ApiPropertyOptional({ description: "Reason for shift trade" })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class AndroidProcessShiftTradeDto {
  @ApiProperty({ description: "Action: ACCEPT, REJECT, CANCEL" })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiPropertyOptional({ description: "Optional notes" })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class AndroidCreateTaskDto {
  @ApiProperty({ description: "Task title" })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: "Task description" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: "Due date ISO string" })
  @IsString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ description: "Assigned member ID" })
  @IsString()
  @IsOptional()
  assignedMemberId?: string;

  @ApiPropertyOptional({ description: "Priority level: LOW, MEDIUM, HIGH, URGENT" })
  @IsString()
  @IsOptional()
  priority?: string;
}

export class AndroidUpdateTaskDto {
  @ApiPropertyOptional({ description: "Updated task title" })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: "Updated task description" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: "Updated status: PENDING, IN_PROGRESS, COMPLETED" })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: "Updated priority" })
  @IsString()
  @IsOptional()
  priority?: string;
}

export class AndroidPosPairDto {
  @ApiPropertyOptional({ description: "Session ID for pairing" })
  @IsString()
  @IsOptional()
  sessionId?: string;

  @ApiPropertyOptional({ description: "Pairing code" })
  @IsString()
  @IsOptional()
  pairingCode?: string;

  @ApiPropertyOptional({ description: "Location ID" })
  @IsString()
  @IsOptional()
  locationId?: string;

  @ApiPropertyOptional({ description: "Device Name" })
  @IsString()
  @IsOptional()
  deviceName?: string;

  @ApiPropertyOptional({ description: "Device Type" })
  @IsString()
  @IsOptional()
  deviceType?: string;
}
