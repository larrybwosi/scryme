import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { V3AuthGuard } from '../../../../common/guards/v3-auth.guard';
import { v3Context } from "../../../../common/decorators/v3-context.decorator";
import type { V3ApiContext } from "@repo/shared/api/v3";
import { PermissionsGuard } from '../../../../common/guards/permissions.guard';
import { Permissions } from '../../../../common/decorators/permissions.decorator';
import { TaskUseCase } from '../../application/use-cases/task.use-case';
import {
  AddTaskCommentDto,
  AddTaskDependencyDto,
  CreateTaskDto,
  CreateTaskLabelDto,
  CreateTaskTimeEntryDto,
  ManageTaskAssigneesDto,
  MemberPerformanceFilterDto,
  ProcessTimesheetDto,
  SubmitTimesheetDto,
  TaskFilterDto,
  UpdateTaskDto,
} from '../../dtos/task.dto';

@ApiTags('V3 Enterprise Tasks')
@ApiBearerAuth()
@UseGuards(V3AuthGuard, PermissionsGuard)
@Controller([':orgSlug/tasks', 'tasks'])
export class TaskController {
  constructor(private readonly taskUseCase: TaskUseCase) {}

  @Post()
  @Permissions('tasks:manage')
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  async createTask(
    @v3Context() ctx: V3ApiContext,
    @Body() dto: CreateTaskDto,
  ) {
    return this.taskUseCase.createTask(ctx.organizationId, dto, ctx.memberId);
  }

  @Get()
  @Permissions('tasks:read')
  @ApiOperation({ summary: 'List tasks for organization' })
  async listTasks(
    @v3Context() ctx: V3ApiContext,
    @Query() filter: TaskFilterDto,
  ) {
    return this.taskUseCase.listTasks(ctx.organizationId, filter);
  }

  @Get(':id')
  @Permissions('tasks:read')
  @ApiOperation({ summary: 'Get task details' })
  async getTask(
    @v3Context() ctx: V3ApiContext,
    @Param('id') id: string,
  ) {
    return this.taskUseCase.getTask(ctx.organizationId, id);
  }

  @Patch(':id')
  @Permissions('tasks:manage')
  @ApiOperation({ summary: 'Update task details or status' })
  async updateTask(
    @v3Context() ctx: V3ApiContext,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.taskUseCase.updateTask(ctx.organizationId, id, dto, ctx.memberId);
  }

  @Delete(':id')
  @Permissions('tasks:manage')
  @ApiOperation({ summary: 'Delete task' })
  async deleteTask(
    @v3Context() ctx: V3ApiContext,
    @Param('id') id: string,
  ) {
    return this.taskUseCase.deleteTask(ctx.organizationId, id);
  }

  @Post(':id/assignees')
  @Permissions('tasks:manage')
  @ApiOperation({ summary: 'Manage task assignees' })
  async manageAssignees(
    @v3Context() ctx: V3ApiContext,
    @Param('id') id: string,
    @Body() dto: ManageTaskAssigneesDto,
  ) {
    return this.taskUseCase.manageAssignees(ctx.organizationId, id, dto, ctx.memberId);
  }

  @Post(':id/dependencies')
  @Permissions('tasks:manage')
  @ApiOperation({ summary: 'Add task dependency' })
  async addDependency(
    @v3Context() ctx: V3ApiContext,
    @Param('id') id: string,
    @Body() dto: AddTaskDependencyDto,
  ) {
    return this.taskUseCase.addDependency(ctx.organizationId, id, dto);
  }

  @Delete(':id/dependencies/:dependsOnTaskId')
  @Permissions('tasks:manage')
  @ApiOperation({ summary: 'Remove task dependency' })
  async removeDependency(
    @v3Context() ctx: V3ApiContext,
    @Param('id') id: string,
    @Param('dependsOnTaskId') dependsOnTaskId: string,
  ) {
    return this.taskUseCase.removeDependency(ctx.organizationId, id, dependsOnTaskId);
  }

  @Post(':id/comments')
  @Permissions('tasks:manage')
  @ApiOperation({ summary: 'Add comment to task' })
  async addComment(
    @v3Context() ctx: V3ApiContext,
    @Param('id') id: string,
    @Body() dto: AddTaskCommentDto,
  ) {
    if (!ctx.memberId) {
      throw new Error('Member ID required to post comments');
    }
    return this.taskUseCase.addComment(ctx.organizationId, id, dto, ctx.memberId);
  }

  @Post('labels')
  @Permissions('tasks:manage')
  @ApiOperation({ summary: 'Create a custom task label' })
  async createLabel(
    @v3Context() ctx: V3ApiContext,
    @Body() dto: CreateTaskLabelDto,
  ) {
    return this.taskUseCase.createLabel(ctx.organizationId, dto);
  }

  @Get('labels/list')
  @Permissions('tasks:read')
  @ApiOperation({ summary: 'List custom task labels' })
  async listLabels(
    @v3Context() ctx: V3ApiContext,
    @Query('projectId') projectId?: string,
  ) {
    return this.taskUseCase.listLabels(ctx.organizationId, projectId);
  }

  @Get('workspace')
  @Permissions('tasks:read')
  @ApiOperation({
    summary: 'Get current workspace context',
    description: 'Resolves the authenticated session into its organization id, slug, and member id, so clients can build org-scoped requests to other v3 modules without hardcoding the slug.',
  })
  async getWorkspaceContext(@v3Context() ctx: V3ApiContext) {
    return {
      organizationId: ctx.organizationId,
      orgSlug: ctx.orgSlug,
      memberId: ctx.memberId || null,
    };
  }
  @Post("time-entries")
  @Permissions("tasks:manage")
  @ApiOperation({ summary: "Log operational non-task or task time entry" })
  async addOperationalTimeEntry(
    @v3Context() ctx: V3ApiContext,
    @Body() dto: CreateTaskTimeEntryDto,
  ) {
    if (!ctx.memberId) {
      throw new Error("Member ID required to log time entries");
    }
    return this.taskUseCase.addTimeEntry(ctx.organizationId, dto.taskId, dto, ctx.memberId);
  }

  @Get("time-entries")
  @Permissions("tasks:read")
  @ApiOperation({ summary: "List all time entries across tasks & operations" })
  async listAllTimeEntries(
    @v3Context() ctx: V3ApiContext,
    @Query("taskId") taskId?: string,
  ) {
    return this.taskUseCase.listTimeEntries(ctx.organizationId, taskId);
  }

  @Delete("time-entries/:entryId")
  @Permissions("tasks:manage")
  @ApiOperation({ summary: "Delete any time entry (rejects if locked)" })
  async deleteAnyTimeEntry(
    @v3Context() ctx: V3ApiContext,
    @Param("entryId") entryId: string,
  ) {
    return this.taskUseCase.deleteTimeEntry(ctx.organizationId, undefined, entryId);
  }
  @Post(":id/time-entries")
  @Permissions("tasks:manage")
  @ApiOperation({ summary: "Log time entry / hours on task" })
  async addTimeEntry(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
    @Body() dto: CreateTaskTimeEntryDto,
  ) {
    if (!ctx.memberId) {
      throw new Error("Member ID required to log time entries");
    }
    return this.taskUseCase.addTimeEntry(ctx.organizationId, id, dto, ctx.memberId);
  }

  @Get(":id/time-entries")
  @Permissions("tasks:read")
  @ApiOperation({ summary: "List logged time entries on task" })
  async listTimeEntries(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
  ) {
    return this.taskUseCase.listTimeEntries(ctx.organizationId, id);
  }

  @Delete(":id/time-entries/:entryId")
  @Permissions("tasks:manage")
  @ApiOperation({ summary: "Delete a logged time entry on task" })
  async deleteTimeEntry(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
    @Param("entryId") entryId: string,
  ) {
    return this.taskUseCase.deleteTimeEntry(ctx.organizationId, id, entryId);
  }

  @Get(":id/subtasks")
  @Permissions("tasks:read")
  @ApiOperation({ summary: "Get subtasks for a task" })
  async getSubtasks(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
  ) {
    return this.taskUseCase.getSubtasks(ctx.organizationId, id);
  }

  @Get("calendar/events")
  @Permissions("tasks:read")
  @ApiOperation({ summary: "Get aggregated calendar events (tasks, milestones, sprints)" })
  async getCalendarEvents(
    @v3Context() ctx: V3ApiContext,
    @Query("projectId") projectId?: string,
  ) {
    return this.taskUseCase.getCalendarEvents(ctx.organizationId, projectId);
  }

  @Get('team/performance')
  @Permissions('tasks:read')
  @ApiOperation({ summary: 'Get squad-wide performance metrics and leaderboard' })
  async getTeamPerformance(
    @v3Context() ctx: V3ApiContext,
    @Query() filter: MemberPerformanceFilterDto,
  ) {
    return this.taskUseCase.getTeamPerformance(ctx.organizationId, filter);
  }

  @Get('members/:memberId/performance')
  @Permissions('tasks:read')
  @ApiOperation({ summary: 'Get user performance metrics and throughput' })
  async getMemberPerformance(
    @v3Context() ctx: V3ApiContext,
    @Param('memberId') memberId: string,
    @Query() filter: MemberPerformanceFilterDto,
  ) {
    return this.taskUseCase.getMemberPerformance(ctx.organizationId, memberId, filter);
  }

  @Get('timesheets/weekly')
  @Permissions('tasks:read')
  @ApiOperation({ summary: 'Get aggregated weekly timesheets' })
  async getWeeklyTimesheets(
    @v3Context() ctx: V3ApiContext,
    @Query('memberId') memberId?: string,
    @Query('weekStartDate') weekStartDate?: string,
  ) {
    const date = weekStartDate ? new Date(weekStartDate) : undefined;
    return this.taskUseCase.getWeeklyTimesheets(ctx.organizationId, memberId, date);
  }

  @Post('timesheets/submit')
  @Permissions('tasks:manage')
  @ApiOperation({ summary: 'Submit weekly timesheet for review' })
  async submitWeeklyTimesheet(
    @v3Context() ctx: V3ApiContext,
    @Body() dto: SubmitTimesheetDto,
  ) {
    if (!ctx.memberId) {
      throw new Error('Member ID required to submit timesheet');
    }
    return this.taskUseCase.submitWeeklyTimesheet(ctx.organizationId, ctx.memberId, dto);
  }

  @Post('timesheets/:id/process')
  @Permissions('tasks:manage')
  @ApiOperation({ summary: 'Approve or reject a submitted timesheet' })
  async processWeeklyTimesheet(
    @v3Context() ctx: V3ApiContext,
    @Param('id') timesheetId: string,
    @Body() dto: ProcessTimesheetDto,
  ) {
    return this.taskUseCase.processWeeklyTimesheet(
      ctx.organizationId,
      timesheetId,
      ctx.memberId || null,
      dto,
    );
  }
}
