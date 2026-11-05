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
  CreateProjectMilestoneDto,
  ManageProjectMemberDto,
  ProjectFilterDto,
  UpdateProjectDto,
  UpdateProjectMilestoneDto,
  CreateProjectSprintDto,
  UpdateProjectSprintDto,
  CreateProjectDocumentDto,
  UpdateProjectDocumentDto,
} from '../../dtos/project.dto';

@ApiTags('V3 Enterprise Tasks')
@ApiBearerAuth()
@UseGuards(V3AuthGuard, PermissionsGuard)
@Controller([':orgSlug/projects', 'projects'])
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
  @Post(":id/milestones")
  @Permissions("tasks:manage")
  @ApiOperation({ summary: "Create a new milestone for project" })
  async createMilestone(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
    @Body() dto: CreateProjectMilestoneDto,
  ) {
    return this.projectUseCase.createMilestone(ctx.organizationId, id, dto);
  }

  @Get(":id/milestones")
  @Permissions("tasks:read")
  @ApiOperation({ summary: "List milestones for project" })
  async listMilestones(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
  ) {
    return this.projectUseCase.listMilestones(ctx.organizationId, id);
  }

  @Get("milestones/:milestoneId")
  @Permissions("tasks:read")
  @ApiOperation({ summary: "Get milestone details" })
  async getMilestone(
    @v3Context() ctx: V3ApiContext,
    @Param("milestoneId") milestoneId: string,
  ) {
    return this.projectUseCase.getMilestone(ctx.organizationId, milestoneId);
  }

  @Patch("milestones/:milestoneId")
  @Permissions("tasks:manage")
  @ApiOperation({ summary: "Update milestone" })
  async updateMilestone(
    @v3Context() ctx: V3ApiContext,
    @Param("milestoneId") milestoneId: string,
    @Body() dto: UpdateProjectMilestoneDto,
  ) {
    return this.projectUseCase.updateMilestone(ctx.organizationId, milestoneId, dto);
  }

  @Delete("milestones/:milestoneId")
  @Permissions("tasks:manage")
  @ApiOperation({ summary: "Delete milestone" })
  async deleteMilestone(
    @v3Context() ctx: V3ApiContext,
    @Param("milestoneId") milestoneId: string,
  ) {
    return this.projectUseCase.deleteMilestone(ctx.organizationId, milestoneId);
  }

  // --- SPRINT / CYCLE ENDPOINTS ---

  @Post(":id/sprints")
  @Permissions("tasks:manage")
  @ApiOperation({ summary: "Create a new sprint for project" })
  async createSprint(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
    @Body() dto: CreateProjectSprintDto,
  ) {
    return this.projectUseCase.createSprint(ctx.organizationId, id, dto);
  }

  @Get(":id/sprints")
  @Permissions("tasks:read")
  @ApiOperation({ summary: "List sprints for project" })
  async listSprints(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
  ) {
    return this.projectUseCase.listSprints(ctx.organizationId, id);
  }

  @Get("sprints/:sprintId")
  @Permissions("tasks:read")
  @ApiOperation({ summary: "Get sprint details" })
  async getSprint(
    @v3Context() ctx: V3ApiContext,
    @Param("sprintId") sprintId: string,
  ) {
    return this.projectUseCase.getSprint(ctx.organizationId, sprintId);
  }

  @Patch("sprints/:sprintId")
  @Permissions("tasks:manage")
  @ApiOperation({ summary: "Update sprint" })
  async updateSprint(
    @v3Context() ctx: V3ApiContext,
    @Param("sprintId") sprintId: string,
    @Body() dto: UpdateProjectSprintDto,
  ) {
    return this.projectUseCase.updateSprint(ctx.organizationId, sprintId, dto);
  }

  @Delete("sprints/:sprintId")
  @Permissions("tasks:manage")
  @ApiOperation({ summary: "Delete sprint" })
  async deleteSprint(
    @v3Context() ctx: V3ApiContext,
    @Param("sprintId") sprintId: string,
  ) {
    return this.projectUseCase.deleteSprint(ctx.organizationId, sprintId);
  }

  // --- DOCUMENT / RFC ENDPOINTS ---

  @Post(":id/documents")
  @Permissions("tasks:manage")
  @ApiOperation({ summary: "Create a document for project" })
  async createDocument(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
    @Body() dto: CreateProjectDocumentDto,
  ) {
    return this.projectUseCase.createDocument(ctx.organizationId, id, dto, ctx.memberId);
  }

  @Get("documents")
  @Permissions("tasks:read")
  @ApiOperation({ summary: "List documents for organization or project" })
  async listDocuments(
    @v3Context() ctx: V3ApiContext,
    @Query("projectId") projectId?: string,
  ) {
    return this.projectUseCase.listDocuments(ctx.organizationId, projectId);
  }

  @Get(":id/documents")
  @Permissions("tasks:read")
  @ApiOperation({ summary: "List documents for specific project" })
  async listProjectDocuments(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
  ) {
    return this.projectUseCase.listDocuments(ctx.organizationId, id);
  }

  @Get("documents/:documentId")
  @Permissions("tasks:read")
  @ApiOperation({ summary: "Get document details" })
  async getDocument(
    @v3Context() ctx: V3ApiContext,
    @Param("documentId") documentId: string,
  ) {
    return this.projectUseCase.getDocument(ctx.organizationId, documentId);
  }

  @Patch("documents/:documentId")
  @Permissions("tasks:manage")
  @ApiOperation({ summary: "Update document" })
  async updateDocument(
    @v3Context() ctx: V3ApiContext,
    @Param("documentId") documentId: string,
    @Body() dto: UpdateProjectDocumentDto,
  ) {
    return this.projectUseCase.updateDocument(ctx.organizationId, documentId, dto);
  }

  @Delete("documents/:documentId")
  @Permissions("tasks:manage")
  @ApiOperation({ summary: "Delete document" })
  async deleteDocument(
    @v3Context() ctx: V3ApiContext,
    @Param("documentId") documentId: string,
  ) {
    return this.projectUseCase.deleteDocument(ctx.organizationId, documentId);
  }
}
