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
import { ProjectUseCase } from '../../application/use-cases/project.use-case';
import {
  CreateProjectDto,
  ManageProjectMemberDto,
  ProjectFilterDto,
  UpdateProjectDto,
} from '../../dtos/project.dto';

@ApiTags('V3 Enterprise Tasks')
@ApiBearerAuth()
@UseGuards(V3AuthGuard, PermissionsGuard)
@Controller([':orgSlug/projects', 'v3/:orgSlug/projects', 'projects'])
export class ProjectController {
  constructor(private readonly projectUseCase: ProjectUseCase) {}

  @Post()
  @Permissions('tasks:manage')
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  async createProject(
    @v3Context() ctx: V3ApiContext,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectUseCase.createProject(ctx.organizationId, dto, ctx.memberId);
  }

  @Get()
  @Permissions('tasks:read')
  @ApiOperation({ summary: 'List projects for organization' })
  async listProjects(
    @v3Context() ctx: V3ApiContext,
    @Query() filter: ProjectFilterDto,
  ) {
    return this.projectUseCase.listProjects(ctx.organizationId, filter);
  }

  @Get(':id')
  @Permissions('tasks:read')
  @ApiOperation({ summary: 'Get project details' })
  async getProject(
    @v3Context() ctx: V3ApiContext,
    @Param('id') id: string,
  ) {
    return this.projectUseCase.getProject(ctx.organizationId, id);
  }

  @Patch(':id')
  @Permissions('tasks:manage')
  @ApiOperation({ summary: 'Update project' })
  async updateProject(
    @v3Context() ctx: V3ApiContext,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectUseCase.updateProject(ctx.organizationId, id, dto);
  }

  @Delete(':id')
  @Permissions('tasks:manage')
  @ApiOperation({ summary: 'Delete project' })
  async deleteProject(
    @v3Context() ctx: V3ApiContext,
    @Param('id') id: string,
  ) {
    return this.projectUseCase.deleteProject(ctx.organizationId, id);
  }

  @Post(':id/members')
  @Permissions('tasks:manage')
  @ApiOperation({ summary: 'Add or update project member role' })
  async manageMember(
    @v3Context() ctx: V3ApiContext,
    @Param('id') id: string,
    @Body() dto: ManageProjectMemberDto,
  ) {
    return this.projectUseCase.manageProjectMember(ctx.organizationId, id, dto);
  }

  @Delete(':id/members/:memberId')
  @Permissions('tasks:manage')
  @ApiOperation({ summary: 'Remove member from project' })
  async removeMember(
    @v3Context() ctx: V3ApiContext,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.projectUseCase.removeProjectMember(ctx.organizationId, id, memberId);
  }
}
