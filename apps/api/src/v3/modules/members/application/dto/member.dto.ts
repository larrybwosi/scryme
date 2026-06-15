import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";
import {MemberRole, MembershipStatus, Status} from "@repo/db";
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
  IsBoolean,
} from "class-validator";
import {PaginationQueryDto} from "@/v3/common/dto/pagination.dto";

export class MemberQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({enum: MemberRole})
  @IsOptional()
  @IsEnum(MemberRole)
  role?: MemberRole;

  @ApiPropertyOptional({enum: MembershipStatus})
  @IsOptional()
  @IsEnum(MembershipStatus)
  membershipStatus?: MembershipStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateMemberDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({enum: MemberRole})
  @IsEnum(MemberRole)
  role: MemberRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cardId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({type: [String]})
  @IsOptional()
  @IsArray()
  @IsString({each: true})
  departmentIds?: string[];

  @ApiPropertyOptional({type: [String]})
  @IsOptional()
  @IsArray()
  @IsString({each: true})
  customRoleIds?: string[];

  @ApiPropertyOptional({type: [String]})
  @IsOptional()
  @IsArray()
  @IsString({each: true})
  roleGroupIds?: string[];
}

export class UpdateMemberDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({enum: MemberRole})
  @IsOptional()
  @IsEnum(MemberRole)
  role?: MemberRole;

  @ApiPropertyOptional({enum: MembershipStatus})
  @IsOptional()
  @IsEnum(MembershipStatus)
  membershipStatus?: MembershipStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cardId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({enum: Status})
  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @ApiPropertyOptional({type: [String]})
  @IsOptional()
  @IsArray()
  @IsString({each: true})
  departmentIds?: string[];

  @ApiPropertyOptional({type: [String]})
  @IsOptional()
  @IsArray()
  @IsString({each: true})
  customRoleIds?: string[];

  @ApiPropertyOptional({type: [String]})
  @IsOptional()
  @IsArray()
  @IsString({each: true})
  roleGroupIds?: string[];
}

export class UserSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  image?: string;
}

export class MemberDepartmentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  role: string;
}

export class MemberRoleDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class TerminalLoginDto {
  @ApiProperty()
  @IsString()
  cardId: string;

  @ApiProperty()
  @IsString()
  pin: string;
}

export class MemberResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  user: UserSummaryDto;

  @ApiProperty({enum: MemberRole})
  role: MemberRole;

  @ApiProperty({enum: MembershipStatus})
  membershipStatus: MembershipStatus;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({enum: Status})
  status: Status;

  @ApiPropertyOptional()
  cardId?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({type: [MemberDepartmentDto]})
  departments?: MemberDepartmentDto[];

  @ApiPropertyOptional({type: [MemberRoleDto]})
  customRoles?: MemberRoleDto[];

  @ApiPropertyOptional({type: [MemberRoleDto]})
  roleGroups?: MemberRoleDto[];
}

export class TerminalLoginResponseDto {
  @ApiProperty()
  token: string;

  @ApiProperty()
  member: MemberResponseDto;

  @ApiPropertyOptional()
  restoredSession?: boolean;
}
