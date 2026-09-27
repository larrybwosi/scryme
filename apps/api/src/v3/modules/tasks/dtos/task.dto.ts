import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DependencyType, ProjectTaskPriority, ProjectTaskStatus } from '@repo/db';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ example: 'cuid_project_id' })
  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @ApiProperty({ example: 'Implement user authentication' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ example: 'Detailed task requirements and acceptance criteria' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ProjectTaskStatus, default: ProjectTaskStatus.TODO })
  @IsOptional()
  @IsEnum(ProjectTaskStatus)
  status?: ProjectTaskStatus;

  @ApiPropertyOptional({ enum: ProjectTaskPriority, default: ProjectTaskPriority.MEDIUM })
  @IsOptional()
  @IsEnum(ProjectTaskPriority)
  priority?: ProjectTaskPriority;

  @ApiPropertyOptional({ example: '2026-10-15T00:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({ example: '2026-10-20T00:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;

  @ApiPropertyOptional({ example: 8.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  estimatedHours?: number;

  @ApiPropertyOptional({ example: 'cuid_parent_task_id' })
  @IsOptional()
  @IsString()
  parentTaskId?: string;

  @ApiPropertyOptional({ example: ['cuid_member_1', 'cuid_member_2'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assigneeIds?: string[];

  @ApiPropertyOptional({ example: ['cuid_label_1'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labelIds?: string[];
}

export class UpdateTaskDto {
  @ApiPropertyOptional({ example: 'Updated title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ProjectTaskStatus })
  @IsOptional()
  @IsEnum(ProjectTaskStatus)
  status?: ProjectTaskStatus;

  @ApiPropertyOptional({ enum: ProjectTaskPriority })
  @IsOptional()
  @IsEnum(ProjectTaskPriority)
  priority?: ProjectTaskPriority;

  @ApiPropertyOptional({ example: '2026-10-15T00:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({ example: '2026-10-20T00:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;

  @ApiPropertyOptional({ example: 8.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  estimatedHours?: number;

  @ApiPropertyOptional({ example: 4.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  actualHours?: number;

  @ApiPropertyOptional({ example: 'cuid_parent_task_id' })
  @IsOptional()
  @IsString()
  parentTaskId?: string;
}

export class ManageTaskAssigneesDto {
  @ApiProperty({ example: ['cuid_member_1', 'cuid_member_2'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  memberIds!: string[];
}

export class AddTaskDependencyDto {
  @ApiProperty({ example: 'cuid_depends_on_task_id' })
  @IsString()
  @IsNotEmpty()
  dependsOnTaskId!: string;

  @ApiPropertyOptional({ enum: DependencyType, default: DependencyType.BLOCKS })
  @IsOptional()
  @IsEnum(DependencyType)
  type?: DependencyType;
}

export class AddTaskCommentDto {
  @ApiProperty({ example: 'I have updated the design docs according to feedback.' })
  @IsString()
  @IsNotEmpty()
  content!: string;
}

export class CreateTaskLabelDto {
  @ApiProperty({ example: 'Bug' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: '#EF4444' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 'cuid_project_id' })
  @IsOptional()
  @IsString()
  projectId?: string;
}

export class TaskFilterDto {
  @ApiPropertyOptional({ example: 'cuid_project_id' })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ enum: ProjectTaskStatus })
  @IsOptional()
  @IsEnum(ProjectTaskStatus)
  status?: ProjectTaskStatus;

  @ApiPropertyOptional({ enum: ProjectTaskPriority })
  @IsOptional()
  @IsEnum(ProjectTaskPriority)
  priority?: ProjectTaskPriority;

  @ApiPropertyOptional({ example: 'cuid_assignee_member_id' })
  @IsOptional()
  @IsString()
  assigneeId?: string;

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
