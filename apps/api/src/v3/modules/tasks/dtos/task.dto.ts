import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DependencyType, ProjectTaskPriority, ProjectTaskStatus } from '@repo/db';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class TaskAssigneeInput {
  @ApiProperty({ example: 'cuid_member_1' })
  @IsString()
  @IsNotEmpty()
  memberId!: string;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({ example: 4.5, description: 'Allocated hours out of total estimate' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  allocatedHours?: number;
}

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

  @ApiPropertyOptional({ example: 'cuid_milestone_id' })
  @IsOptional()
  @IsString()
  milestoneId?: string;

  @ApiPropertyOptional({ example: 'cuid_sprint_id' })
  @IsOptional()
  @IsString()
  sprintId?: string;

  @ApiPropertyOptional({ example: 'cuid_booking_id' })
  @IsOptional()
  @IsString()
  bookingId?: string;

  @ApiPropertyOptional({ example: 'cuid_batch_id' })
  @IsOptional()
  @IsString()
  batchId?: string;

  @ApiPropertyOptional({ example: ['cuid_member_1', 'cuid_member_2'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assigneeIds?: string[];

  @ApiPropertyOptional({ type: [TaskAssigneeInput] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskAssigneeInput)
  assignees?: TaskAssigneeInput[];

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
  @ApiPropertyOptional({ example: ['cuid_member_1', 'cuid_member_2'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memberIds?: string[];

  @ApiPropertyOptional({ type: [TaskAssigneeInput] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskAssigneeInput)
  assignees?: TaskAssigneeInput[];
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

  @ApiPropertyOptional({ example: 'cuid_milestone_id' })
  @IsOptional()
  @IsString()
  milestoneId?: string;

  @ApiPropertyOptional({ example: 'cuid_sprint_id' })
  @IsOptional()
  @IsString()
  sprintId?: string;

  @ApiPropertyOptional({ example: 'cuid_booking_id' })
  @IsOptional()
  @IsString()
  bookingId?: string;

  @ApiPropertyOptional({ example: 'cuid_batch_id' })
  @IsOptional()
  @IsString()
  batchId?: string;

  @ApiPropertyOptional({ example: 'cuid_parent_task_id' })
  @IsOptional()
  @IsString()
  parentTaskId?: string;

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


export class CreateTaskTimeEntryDto {
  @ApiProperty({ example: 3.5, description: "Hours worked on task" })
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  hours!: number;

  @ApiPropertyOptional({ example: "Implemented JWT auth middleware and unit tests" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: "2026-10-15T00:00:00.000Z" })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  date?: Date;

  @ApiPropertyOptional({ example: "cuid_task_id", description: "Optional: leave blank for general operational hours" })
  @IsOptional()
  @IsString()
  taskId?: string;

  @ApiPropertyOptional({ example: "OPERATION", description: "OPERATION, MEETING, SUPPORT, TRAINING" })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isBillable?: boolean;
}

export class MemberPerformanceFilterDto {
  @ApiPropertyOptional({ example: '2026-10-01T00:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @ApiPropertyOptional({ example: '2026-10-31T23:59:59.999Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;
}

export class SubmitTimesheetDto {
  @ApiProperty({ example: '2026-10-12T00:00:00.000Z', description: 'Monday start date of the week' })
  @Type(() => Date)
  @IsDate()
  weekStartDate!: Date;

  @ApiPropertyOptional({ example: 'Weekly development sprint tasks', description: 'Submission notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ProcessTimesheetDto {
  @ApiProperty({ example: 'APPROVE', enum: ['APPROVE', 'REJECT'] })
  @IsString()
  @IsNotEmpty()
  action!: 'APPROVE' | 'REJECT';

  @ApiPropertyOptional({ example: 'Approved for payroll processing' })
  @IsOptional()
  @IsString()
  notes?: string;
}
