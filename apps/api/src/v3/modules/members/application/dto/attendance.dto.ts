import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsDateString, IsBoolean } from "class-validator";
import { PaginationQueryDto } from "@/v3/common/dto/pagination.dto";

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
  @ApiProperty()
  @IsString()
  locationId: string;

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
}
