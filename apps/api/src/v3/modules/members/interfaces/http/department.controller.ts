import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { V3AuthGuard } from '@/v3/common/guards/v3-auth.guard';
import { MultiTenancyGuard } from '@/v3/common/guards/multi-tenancy.guard';
import { StandardResponseInterceptor } from '@/v3/common/interceptors/standard-response.interceptor';
import { DepartmentUseCase } from '../../application/use-cases/department.use-case';
import {
  CreateDepartmentDto, UpdateDepartmentDto, DepartmentQueryDto,
  AddDepartmentMemberDto
} from '../../application/dto/department.dto';
import { Permissions } from '@/v3/common/decorators/permissions.decorator';
import { PermissionsGuard } from '@/v3/common/guards/permissions.guard';

@ApiTags('V3 Departments')
@ApiBearerAuth()
@UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
@UseInterceptors(StandardResponseInterceptor)
@Controller(':orgSlug/members/departments')
export class DepartmentController {
  constructor(private readonly departmentUseCase: DepartmentUseCase) {}

  @Get()
  @Permissions('departments:read')
  @ApiOperation({ summary: 'List departments' })
  async getDepartments(@Request() req: any, @Query() query: DepartmentQueryDto) {
    return this.departmentUseCase.getDepartments(req.v3Context.organizationId, query);
  }

  @Get(':id')
  @Permissions('departments:read')
  @ApiOperation({ summary: 'Get department details' })
  async getDepartment(@Request() req: any, @Param('id') id: string) {
    return this.departmentUseCase.getDepartment(req.v3Context.organizationId, id);
  }

  @Post()
  @Permissions('departments:write')
  @ApiOperation({ summary: 'Create a department' })
  async createDepartment(@Request() req: any, @Body() dto: CreateDepartmentDto) {
    const actorId = req.v3Context.memberId;
    return this.departmentUseCase.createDepartment(req.v3Context.organizationId, dto, actorId);
  }

  @Patch(':id')
  @Permissions('departments:write')
  @ApiOperation({ summary: 'Update a department' })
  async updateDepartment(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    const actorId = req.v3Context.memberId;
    return this.departmentUseCase.updateDepartment(req.v3Context.organizationId, id, dto, actorId);
  }

  @Delete(':id')
  @Permissions('departments:delete')
  @ApiOperation({ summary: 'Delete a department' })
  async deleteDepartment(@Request() req: any, @Param('id') id: string) {
    const actorId = req.v3Context.memberId;
    return this.departmentUseCase.deleteDepartment(req.v3Context.organizationId, id, actorId);
  }

  @Post(':id/members')
  @Permissions('departments:write')
  @ApiOperation({ summary: 'Add a member to a department' })
  async addMember(@Request() req: any, @Param('id') id: string, @Body() dto: AddDepartmentMemberDto) {
    const actorId = req.v3Context.memberId;
    return this.departmentUseCase.addMemberToDepartment(req.v3Context.organizationId, id, dto, actorId);
  }

  @Delete(':id/members/:memberId')
  @Permissions('departments:write')
  @ApiOperation({ summary: 'Remove a member from a department' })
  async removeMember(@Request() req: any, @Param('id') id: string, @Param('memberId') memberId: string) {
    const actorId = req.v3Context.memberId;
    return this.departmentUseCase.removeMemberFromDepartment(req.v3Context.organizationId, id, memberId, actorId);
  }
}
