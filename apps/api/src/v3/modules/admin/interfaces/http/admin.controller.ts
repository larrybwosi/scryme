import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { AdminService } from "../../infrastructure/services/admin.service";
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  BanUserDto,
  SetGlobalSettingDto,
  DefineTierDto,
  UpdateSubscriptionDto,
  RecordCustomPaymentDto,
  CreateIntegrationDefinitionDto,
  UpdateIntegrationDefinitionDto,
} from "../../application/dto/admin.dto";
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

  // --- Global Settings ---

  @Get("settings")
  @ApiOperation({ summary: "List all global system settings" })
  async listGlobalSettings() {
    return this.adminService.listGlobalSettings();
  }

  @Post("settings")
  @ApiOperation({ summary: "Set or update a global system setting" })
  async setGlobalSetting(@Body() dto: SetGlobalSettingDto) {
    return this.adminService.setGlobalSetting(dto);
  }

  @Delete("settings/:key")
  @ApiOperation({ summary: "Delete a global system setting" })
  async deleteGlobalSetting(@Param("key") key: string) {
    return this.adminService.deleteGlobalSetting(key);
  }

  // --- Global Tiers (Plan limits/attributes) ---

  @Get("tiers")
  @ApiOperation({ summary: "List all system-wide organization plans and tiers" })
  async listTiers() {
    return this.adminService.listTiers();
  }

  @Post("tiers")
  @ApiOperation({ summary: "Define or update a global plan / tier limits and attributes" })
  async defineTier(@Body() dto: DefineTierDto) {
    return this.adminService.defineTier(dto);
  }

  @Delete("tiers/:slug")
  @ApiOperation({ summary: "Delete a global plan / tier definition" })
  async deleteTier(@Param("slug") slug: string) {
    return this.adminService.deleteTier(slug);
  }

  // --- Organization Subscriptions ---

  @Get("organizations/:id/subscription")
  @ApiOperation({ summary: "Get subscription details for a specific organization" })
  async getOrganizationSubscription(@Param("id") id: string) {
    return this.adminService.getOrganizationSubscription(id);
  }

  @Put("organizations/:id/subscription")
  @ApiOperation({ summary: "Update subscription / plan details for a specific organization" })
  async updateOrganizationSubscription(
    @Param("id") id: string,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    return this.adminService.updateOrganizationSubscription(id, dto);
  }

  // --- System Payments Tracking ---

  @Get("payments")
  @ApiOperation({ summary: "List all system payments for organization plans" })
  async listSystemPayments() {
    return this.adminService.listSystemPayments();
  }

  @Post("payments/record")
  @ApiOperation({ summary: "Record a custom plan payment (e.g. M-Pesa / Manual verification)" })
  async recordCustomPayment(@Body() dto: RecordCustomPaymentDto) {
    return this.adminService.recordCustomPayment(dto);
  }

  // --- Integration Definitions ---

  @Get("integrations/definitions")
  @ApiOperation({ summary: "List all globally available integration definitions" })
  async listIntegrationDefinitions() {
    return this.adminService.listIntegrationDefinitions();
  }

  @Post("integrations/definitions")
  @ApiOperation({ summary: "Create a globally available integration definition" })
  async createIntegrationDefinition(@Body() dto: CreateIntegrationDefinitionDto) {
    return this.adminService.createIntegrationDefinition(dto);
  }

  @Patch("integrations/definitions/:id")
  @ApiOperation({ summary: "Update a global integration definition" })
  async updateIntegrationDefinition(
    @Param("id") id: string,
    @Body() dto: UpdateIntegrationDefinitionDto,
  ) {
    return this.adminService.updateIntegrationDefinition(id, dto);
  }

  @Delete("integrations/definitions/:id")
  @ApiOperation({ summary: "Delete a global integration definition" })
  async deleteIntegrationDefinition(@Param("id") id: string) {
    return this.adminService.deleteIntegrationDefinition(id);
  }

  // --- Active Organization Integrations ---

  @Get("integrations/active")
  @ApiOperation({ summary: "List all active organization integrations system-wide" })
  async listActiveOrganizationIntegrations() {
    return this.adminService.listActiveOrganizationIntegrations();
  }
}
