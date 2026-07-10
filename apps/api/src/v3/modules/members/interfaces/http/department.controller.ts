import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from "@nestjs/swagger";
import { V3AuthGuard } from "@/v3/common/guards/v3-auth.guard";
import { MultiTenancyGuard } from "@/v3/common/guards/multi-tenancy.guard";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";
import { DepartmentUseCase } from "../../application/use-cases/department.use-case";
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
  DepartmentQueryDto,
  AddDepartmentMemberDto,
  DepartmentResponseDto,
} from "../../application/dto/department.dto";
import { Permissions } from "@/v3/common/decorators/permissions.decorator";
import { PermissionsGuard } from "@/v3/common/guards/permissions.guard";
import { ApiErrorResponseDto } from "@/v3/common/dto/response.dto";

@ApiTags("V3 Departments")
@ApiBearerAuth()
@UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
@UseInterceptors(StandardResponseInterceptor)
@Controller(":orgSlug/members/departments")
@ApiParam({ name: "orgSlug", type: "string" })
export class DepartmentController {
  constructor(private readonly departmentUseCase: DepartmentUseCase) {}

  @Get()
  @Permissions("departments:read")
  @ApiOperation({
    summary: "List departments",
    operationId: "Departments_List",
  })
  @ApiResponse({ status: 200, type: [DepartmentResponseDto], description: "List of departments" })
  async getDepartments(
    @Request() req: any,
    @Query() query: DepartmentQueryDto,
  ) {
    return this.departmentUseCase.getDepartments(
      req.v3Context.organizationId,
      query,
    );
  }

  @Get(":id")
  @Permissions("departments:read")
  @ApiOperation({
    summary: "Get department details",
    operationId: "Departments_Get",
  })
  @ApiResponse({ status: 200, type: DepartmentResponseDto })
  @ApiResponse({ status: 404, type: ApiErrorResponseDto, description: "Department not found" })
  async getDepartment(@Request() req: any, @Param("id") id: string) {
    return this.departmentUseCase.getDepartment(
      req.v3Context.organizationId,
      id,
    );
  }

  @Post()
  @Permissions("departments:write")
  @ApiOperation({
    summary: "Create a department",
    operationId: "Departments_Create",
  })
  @ApiResponse({ status: 201, type: DepartmentResponseDto })
  async createDepartment(
    @Request() req: any,
    @Body() dto: CreateDepartmentDto,
  ) {
    const actorId = req.v3Context.memberId;
    return this.departmentUseCase.createDepartment(
      req.v3Context.organizationId,
      dto,
      actorId,
    );
  }

  @Patch(":id")
  @Permissions("departments:write")
  @ApiOperation({
    summary: "Update a department",
    operationId: "Departments_Update",
  })
  @ApiResponse({ status: 200, type: DepartmentResponseDto })
  async updateDepartment(
    @Request() req: any,
    @Param("id") id: string,
    @Body() dto: UpdateDepartmentDto,
  ) {
    const actorId = req.v3Context.memberId;
    return this.departmentUseCase.updateDepartment(
      req.v3Context.organizationId,
      id,
      dto,
      actorId,
    );
  }

  @Delete(":id")
  @Permissions("departments:delete")
  @ApiOperation({
    summary: "Delete a department",
    operationId: "Departments_Delete",
  })
  @ApiResponse({ status: 200, description: "Department deleted" })
  async deleteDepartment(@Request() req: any, @Param("id") id: string) {
    const actorId = req.v3Context.memberId;
    return this.departmentUseCase.deleteDepartment(
      req.v3Context.organizationId,
      id,
      actorId,
    );
  }

  @Post(":id/members")
  @Permissions("departments:write")
  @ApiOperation({
    summary: "Add a member to a department",
    operationId: "Departments_AddMember",
  })
  @ApiResponse({ status: 201, description: "Member added to department" })
  async addMember(
    @Request() req: any,
    @Param("id") id: string,
    @Body() dto: AddDepartmentMemberDto,
  ) {
    const actorId = req.v3Context.memberId;
    return this.departmentUseCase.addMemberToDepartment(
      req.v3Context.organizationId,
      id,
      dto,
      actorId,
    );
  }

  @Delete(":id/members/:memberId")
  @Permissions("departments:write")
  @ApiOperation({
    summary: "Remove a member from a department",
    operationId: "Departments_RemoveMember",
  })
  @ApiResponse({ status: 200, description: "Member removed from department" })
  async removeMember(
    @Request() req: any,
    @Param("id") id: string,
    @Param("memberId") memberId: string,
  ) {
    const actorId = req.v3Context.memberId;
    return this.departmentUseCase.removeMemberFromDepartment(
      req.v3Context.organizationId,
      id,
      memberId,
      actorId,
    );
  }
}
