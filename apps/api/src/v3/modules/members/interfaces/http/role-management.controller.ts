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
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { V3AuthGuard } from "@/v3/common/guards/v3-auth.guard";
import { MultiTenancyGuard } from "@/v3/common/guards/multi-tenancy.guard";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";
import { RoleManagementUseCase } from "../../application/use-cases/role-management.use-case";
import {
  CreateCustomRoleDto,
  UpdateCustomRoleDto,
  CustomRoleQueryDto,
  CreatePermissionSetDto,
  CreateRoleGroupDto,
} from "../../application/dto/role-management.dto";
import { Permissions } from "@/v3/common/decorators/permissions.decorator";
import { PermissionsGuard } from "@/v3/common/guards/permissions.guard";

@ApiTags("V3 Role Management")
@ApiBearerAuth()
@UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
@UseInterceptors(StandardResponseInterceptor)
@Controller(":orgSlug/members/roles")
export class RoleManagementController {
  constructor(private readonly roleUseCase: RoleManagementUseCase) {}

  // --- Custom Roles ---

  @Get("custom")
  @Permissions("roles:read")
  @ApiOperation({ summary: "List custom roles" })
  async getCustomRoles(
    @Request() req: any,
    @Query() query: CustomRoleQueryDto,
  ) {
    return this.roleUseCase.getCustomRoles(req.v3Context.organizationId, query);
  }

  @Post("custom")
  @Permissions("roles:write")
  @ApiOperation({ summary: "Create a custom role" })
  async createCustomRole(
    @Request() req: any,
    @Body() dto: CreateCustomRoleDto,
  ) {
    const actorId = req.v3Context.memberId;
    return this.roleUseCase.createCustomRole(
      req.v3Context.organizationId,
      dto,
      actorId,
    );
  }

  @Patch("custom/:id")
  @Permissions("roles:write")
  @ApiOperation({ summary: "Update a custom role" })
  async updateCustomRole(
    @Request() req: any,
    @Param("id") id: string,
    @Body() dto: UpdateCustomRoleDto,
  ) {
    const actorId = req.v3Context.memberId;
    return this.roleUseCase.updateCustomRole(
      req.v3Context.organizationId,
      id,
      dto,
      actorId,
    );
  }

  @Delete("custom/:id")
  @Permissions("roles:delete")
  @ApiOperation({ summary: "Delete a custom role" })
  async deleteCustomRole(@Request() req: any, @Param("id") id: string) {
    const actorId = req.v3Context.memberId;
    return this.roleUseCase.deleteCustomRole(
      req.v3Context.organizationId,
      id,
      actorId,
    );
  }

  // --- Permission Sets ---

  @Get("permission-sets")
  @Permissions("roles:read")
  @ApiOperation({ summary: "List permission sets" })
  async getPermissionSets(@Request() req: any) {
    return this.roleUseCase.getPermissionSets(req.v3Context.organizationId);
  }

  @Post("permission-sets")
  @Permissions("roles:write")
  @ApiOperation({ summary: "Create a permission set" })
  async createPermissionSet(
    @Request() req: any,
    @Body() dto: CreatePermissionSetDto,
  ) {
    const actorId = req.v3Context.memberId;
    return this.roleUseCase.createPermissionSet(
      req.v3Context.organizationId,
      dto,
      actorId,
    );
  }

  // --- Role Groups ---

  @Get("groups")
  @Permissions("roles:read")
  @ApiOperation({ summary: "List role groups" })
  async getRoleGroups(@Request() req: any) {
    return this.roleUseCase.getRoleGroups(req.v3Context.organizationId);
  }

  @Post("groups")
  @Permissions("roles:write")
  @ApiOperation({ summary: "Create a role group" })
  async createRoleGroup(@Request() req: any, @Body() dto: CreateRoleGroupDto) {
    const actorId = req.v3Context.memberId;
    return this.roleUseCase.createRoleGroup(
      req.v3Context.organizationId,
      dto,
      actorId,
    );
  }

  // --- Member Role Assignment ---

  @Post("member/:memberId/assign")
  @Permissions("members:write")
  @ApiOperation({ summary: "Assign custom roles to a member" })
  async assignRoles(
    @Request() req: any,
    @Param("memberId") memberId: string,
    @Body("roleIds") roleIds: string[],
  ) {
    const actorId = req.v3Context.memberId;
    return this.roleUseCase.assignRolesToMember(
      req.v3Context.organizationId,
      memberId,
      roleIds,
      actorId,
    );
  }

  @Post("member/:memberId/remove")
  @Permissions("members:write")
  @ApiOperation({ summary: "Remove custom roles from a member" })
  async removeRoles(
    @Request() req: any,
    @Param("memberId") memberId: string,
    @Body("roleIds") roleIds: string[],
  ) {
    const actorId = req.v3Context.memberId;
    return this.roleUseCase.removeRolesFromMember(
      req.v3Context.organizationId,
      memberId,
      roleIds,
      actorId,
    );
  }
}
