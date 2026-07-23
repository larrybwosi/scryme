import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseBoolPipe,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { AdminService } from "../../infrastructure/services/admin.service";
import { CreateOrganizationDto, UpdateOrganizationDto, BanUserDto } from "../../application/dto/admin.dto";
import { SystemAdminGuard } from "../../../../common/guards/system-admin.guard";

@ApiTags("V3 Admin")
@Controller("admin")
@UseGuards(SystemAdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // --- Statistics ---

  @Get("stats")
  @ApiOperation({ summary: "Get system-wide metrics and stats" })
  async getStats() {
    return this.adminService.getStats();
  }

  // --- Organization Operations ---

  @Get("organizations")
  @ApiOperation({ summary: "List all organizations system-wide" })
  async listOrganizations() {
    return this.adminService.listOrganizations();
  }

  @Get("organizations/:id")
  @ApiOperation({ summary: "Get single organization details" })
  async getOrganizationDetails(@Param("id") id: string) {
    return this.adminService.getOrganizationDetails(id);
  }

  @Post("organizations")
  @ApiOperation({ summary: "Create a new organization system-wide" })
  async createOrganization(@Body() dto: CreateOrganizationDto) {
    return this.adminService.createOrganization(dto);
  }

  @Patch("organizations/:id")
  @ApiOperation({ summary: "Update organization details system-wide" })
  async updateOrganization(
    @Param("id") id: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.adminService.updateOrganization(id, dto);
  }

  @Delete("organizations/:id")
  @ApiOperation({ summary: "Soft-delete an organization system-wide" })
  async deleteOrganization(@Param("id") id: string) {
    return this.adminService.deleteOrganization(id);
  }

  // --- Member Operations ---

  @Get("members")
  @ApiOperation({ summary: "List all members system-wide with filters" })
  async listMembers(
    @Query("isActive") isActive?: string,
    @Query("role") role?: string,
    @Query("organizationId") organizationId?: string,
  ) {
    const isAct = isActive === undefined ? undefined : isActive === "true";
    return this.adminService.listMembers({
      isActive: isAct,
      role,
      organizationId,
    });
  }

  // --- User Operations & Banning ---

  @Get("users")
  @ApiOperation({ summary: "List all users system-wide" })
  async listUsers() {
    return this.adminService.listUsers();
  }

  @Post("users/:id/ban")
  @ApiOperation({ summary: "Globally ban a user and suspend associated members" })
  async banUser(@Param("id") id: string, @Body() dto: BanUserDto) {
    return this.adminService.banUser(id, dto);
  }

  @Post("users/:id/unban")
  @ApiOperation({ summary: "Globally unban a user and reactivate associated members" })
  async unbanUser(@Param("id") id: string) {
    return this.adminService.unbanUser(id);
  }

  // --- Connected Apps & System Logs ---

  @Get("connected-apps")
  @ApiOperation({ summary: "List connected oauth application clients" })
  async listConnectedApps() {
    return this.adminService.listConnectedApps();
  }

  @Get("system-logs")
  @ApiOperation({ summary: "Get system action audit logs" })
  async listSystemLogs() {
    return this.adminService.listSystemLogs();
  }
}
