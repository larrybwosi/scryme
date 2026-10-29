import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MilestoneStatus, ProjectMemberRole, ProjectStatus, ProjectTaskPriority } from '@repo/db';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'Website Redesign', description: 'Name of the project' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'REDESIGN', description: 'Unique project key / code within organization' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(10)
  @Matches(/^[A-Z0-9]+$/, { message: 'Project key must contain only uppercase alphanumeric characters' })
  key!: string;

  @ApiPropertyOptional({ example: 'Redesign of corporate website with Next.js' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ProjectStatus, default: ProjectStatus.ACTIVE })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({ enum: ProjectTaskPriority, default: ProjectTaskPriority.MEDIUM })
  @IsOptional()
  @IsEnum(ProjectTaskPriority)
  priority?: ProjectTaskPriority;

  @ApiPropertyOptional({ example: '2026-10-01T00:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({ example: '2026-12-31T00:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({ example: 'cuid_member_id' })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional({ example: 'cuid_department_id' })
  @IsOptional()
  @IsString()
  departmentId?: string;
}

export class UpdateProjectDto {
  @ApiPropertyOptional({ example: 'Website Redesign V2' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'Updated project description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({ enum: ProjectTaskPriority })
  @IsOptional()
  @IsEnum(ProjectTaskPriority)
  priority?: ProjectTaskPriority;

  @ApiPropertyOptional({ example: '2026-10-01T00:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({ example: '2026-12-31T00:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({ example: 'cuid_member_id' })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional({ example: 'cuid_department_id' })
  @IsOptional()
  @IsString()
  departmentId?: string;
}

export class ManageProjectMemberDto {
  @ApiProperty({ example: 'cuid_member_id' })
  @IsString()
  @IsNotEmpty()
  memberId!: string;

  @ApiProperty({ enum: ProjectMemberRole, default: ProjectMemberRole.MEMBER })
  @IsEnum(ProjectMemberRole)
  role!: ProjectMemberRole;
}

export class ProjectFilterDto {
  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({ example: 'cuid_department_id' })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional({ example: 'Search text' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}

export class CreateProjectMilestoneDto {
  @ApiProperty({ example: "Sprint 1 Release", description: "Title of milestone" })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  title!: string;

  @ApiPropertyOptional({ example: "Complete MVP frontend and auth API integration" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: "2026-11-15T00:00:00.000Z" })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;

  @ApiPropertyOptional({ enum: MilestoneStatus, default: MilestoneStatus.OPEN })
  @IsOptional()
  @IsEnum(MilestoneStatus)
  status?: MilestoneStatus;
}

export class UpdateProjectMilestoneDto {
  @ApiPropertyOptional({ example: "Sprint 1 Release V2" })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  title?: string;

  @ApiPropertyOptional({ example: "Updated milestone description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: "2026-11-20T00:00:00.000Z" })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;

  @ApiPropertyOptional({ enum: MilestoneStatus })
  @IsOptional()
  @IsEnum(MilestoneStatus)
  status?: MilestoneStatus;
}
