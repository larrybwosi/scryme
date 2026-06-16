import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { MemberRole, InvitationStatus } from "@repo/db";
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
  IsDateString,
  IsBoolean,
} from "class-validator";
import { PaginationQueryDto } from "@/v3/common/dto/pagination.dto";

export class InvitationQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: InvitationStatus })
  @IsOptional()
  @IsEnum(InvitationStatus)
  status?: InvitationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;
}

export class CreateInvitationDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ enum: MemberRole })
  @IsEnum(MemberRole)
  role: MemberRole;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  departmentIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  customRoleIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleGroupIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isGuestInvite?: boolean;
}

export class InvitationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: MemberRole })
  role: MemberRole;

  @ApiProperty({ enum: InvitationStatus })
  status: InvitationStatus;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  inviterId: string;

  @ApiProperty()
  createdAt: Date;
}

export class AcceptInvitationDto {
  @ApiProperty()
  @IsString()
  token: string;
}
