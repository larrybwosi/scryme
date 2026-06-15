import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";
import {DepartmentMemberRole} from "@repo/db";
import {IsString, IsOptional, IsEnum, IsBoolean} from "class-validator";
import {PaginationQueryDto} from "@/v3/common/dto/pagination.dto";

export class DepartmentQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateDepartmentDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  headId?: string;
}

export class UpdateDepartmentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  headId?: string;
}

export class DepartmentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  headId?: string;

  @ApiProperty()
  createdAt: Date;
}

export class AddDepartmentMemberDto {
  @ApiProperty()
  @IsString()
  memberId: string;

  @ApiPropertyOptional({
    enum: DepartmentMemberRole,
    default: DepartmentMemberRole.MEMBER,
  })
  @IsOptional()
  @IsEnum(DepartmentMemberRole)
  role?: DepartmentMemberRole = DepartmentMemberRole.MEMBER;

  @ApiPropertyOptional({default: false})
  @IsOptional()
  @IsBoolean()
  canApproveExpenses?: boolean = false;

  @ApiPropertyOptional({default: false})
  @IsOptional()
  @IsBoolean()
  canManageBudget?: boolean = false;
}
