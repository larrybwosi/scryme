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
  ManageTaskAssigneesDto,
  TaskFilterDto,
  UpdateTaskDto,
} from '../../dtos/task.dto';

@ApiTags('V3 Enterprise Tasks')
@ApiBearerAuth()
@UseGuards(V3AuthGuard, PermissionsGuard)
@Controller('v3/tasks')
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
}
