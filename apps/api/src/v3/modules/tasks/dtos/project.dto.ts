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

export enum SprintStatusDto {
  PLANNED = "PLANNED",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export class CreateProjectSprintDto {
  @ApiProperty({ example: "Sprint 14: Core UI & Analytics Telemetry" })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: "Core UI sprint goal" })
  @IsOptional()
  @IsString()
  goal?: string;

  @ApiPropertyOptional({ enum: SprintStatusDto, default: SprintStatusDto.PLANNED })
  @IsOptional()
  @IsEnum(SprintStatusDto)
  status?: SprintStatusDto;

  @ApiPropertyOptional({ example: "2026-10-15T00:00:00.000Z" })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({ example: "2026-10-29T00:00:00.000Z" })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({ example: 92 })
  @IsOptional()
  @Type(() => Number)
  scopePoints?: number;

  @ApiPropertyOptional({ example: 66 })
  @IsOptional()
  @Type(() => Number)
  completedPoints?: number;
}

export class UpdateProjectSprintDto {
  @ApiPropertyOptional({ example: "Sprint 14 Updated" })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: "Updated goal" })
  @IsOptional()
  @IsString()
  goal?: string;

  @ApiPropertyOptional({ enum: SprintStatusDto })
  @IsOptional()
  @IsEnum(SprintStatusDto)
  status?: SprintStatusDto;

  @ApiPropertyOptional({ example: "2026-10-15T00:00:00.000Z" })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({ example: "2026-10-29T00:00:00.000Z" })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({ example: 92 })
  @IsOptional()
  @Type(() => Number)
  scopePoints?: number;

  @ApiPropertyOptional({ example: 66 })
  @IsOptional()
  @Type(() => Number)
  completedPoints?: number;
}

export enum ProjectDocumentTypeDto {
  RFC = "RFC",
  SPEC = "SPEC",
  PLAN = "PLAN",
  GUIDE = "GUIDE",
}

export enum ProjectDocumentStatusDto {
  DRAFT = "DRAFT",
  REVIEW = "REVIEW",
  APPROVED = "APPROVED",
  DEPRECATED = "DEPRECATED",
}

export class CreateProjectDocumentDto {
  @ApiProperty({ example: "Realtime Memory-Sharded Synchronization Protocol" })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ enum: ProjectDocumentTypeDto, default: ProjectDocumentTypeDto.RFC })
  @IsOptional()
  @IsEnum(ProjectDocumentTypeDto)
  type?: ProjectDocumentTypeDto;

  @ApiPropertyOptional({ enum: ProjectDocumentStatusDto, default: ProjectDocumentStatusDto.DRAFT })
  @IsOptional()
  @IsEnum(ProjectDocumentStatusDto)
  status?: ProjectDocumentStatusDto;

  @ApiPropertyOptional({ example: "Specification document contents..." })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: "Short summary..." })
  @IsOptional()
  @IsString()
  summary?: string;
}

export class UpdateProjectDocumentDto {
  @ApiPropertyOptional({ example: "Updated document title" })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ enum: ProjectDocumentTypeDto })
  @IsOptional()
  @IsEnum(ProjectDocumentTypeDto)
  type?: ProjectDocumentTypeDto;

  @ApiPropertyOptional({ enum: ProjectDocumentStatusDto })
  @IsOptional()
  @IsEnum(ProjectDocumentStatusDto)
  status?: ProjectDocumentStatusDto;

  @ApiPropertyOptional({ example: "Updated content..." })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: "Updated summary..." })
  @IsOptional()
  @IsString()
  summary?: string;
}
