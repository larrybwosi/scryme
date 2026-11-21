import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { V3AuthGuard } from "@/v3/common/guards/v3-auth.guard";
import { MultiTenancyGuard } from "@/v3/common/guards/multi-tenancy.guard";
import { PermissionsGuard } from "@/v3/common/guards/permissions.guard";
import { QuotaGuard } from "@/v3/common/guards/quota.guard";
import { Permissions } from "@/v3/common/decorators/permissions.decorator";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";
import { V3ZodValidationPipe } from "@/v3/common/pipes/v3-zod-validation.pipe";
import { CustomermatesAdminGuard } from "../../infrastructure/customermates-admin.guard";
import { CustomermatesBackfillService } from "../../application/customermates-backfill.service";
import { CustomermatesConnectionService } from "../../application/customermates-connection.service";
import { CustomermatesFailedService } from "../../application/customermates-failed.service";
import {
  BackfillSchema,
  ConnectCustomermatesSchema,
  RetryFailedSchema,
  RotateSecretSchema,
  type BackfillInput,
  type ConnectCustomermatesInput,
  type RetryFailedInput,
  type RotateSecretInput,
} from "../../application/dto/customermates.dto";

@ApiTags("V3 CRM Customermates")
@ApiBearerAuth()
@Controller(":orgSlug/integrations/customermates")
@ApiParam({ name: "orgSlug", type: "string" })
@UseGuards(
  V3AuthGuard,
  MultiTenancyGuard,
  PermissionsGuard,
  QuotaGuard,
  CustomermatesAdminGuard,
)
@UseInterceptors(StandardResponseInterceptor)
export class CustomermatesAdminController {
  constructor(
    private readonly connection: CustomermatesConnectionService,
    private readonly backfill: CustomermatesBackfillService,
    private readonly failed: CustomermatesFailedService,
  ) {}

  @Post()
  @Permissions("webhooks:write")
  @UsePipes(new V3ZodValidationPipe(ConnectCustomermatesSchema))
  @ApiOperation({ summary: "Connect a Customermates workspace" })
  async connect(@Req() req: any, @Body() body: ConnectCustomermatesInput) {
    return this.connection.connect(this.organizationId(req), body);
  }

  @Get()
  @Permissions("webhooks:read")
  @ApiOperation({ summary: "Get Customermates connection status" })
  async status(@Req() req: any) {
    return this.connection.getStatus(this.organizationId(req));
  }

  @Post("refresh-schema")
  @Permissions("webhooks:write")
  @ApiOperation({ summary: "Refresh Customermates list and field bindings" })
  async refreshSchema(@Req() req: any) {
    return this.connection.refreshSchema(this.organizationId(req));
  }

  @Post("backfill")
  @Permissions("webhooks:write")
  @UsePipes(new V3ZodValidationPipe(BackfillSchema))
  @ApiOperation({ summary: "Start or resume a Customermates backfill" })
  async startBackfill(@Req() req: any, @Body() body: BackfillInput = {}) {
    const organizationId = this.organizationId(req);
    const integration = await this.connection.requireConnected(organizationId);
    try {
      return await this.backfill.start(organizationId, integration.id, Boolean(body.resume));
    } catch (error) {
      throw new ConflictException((error as Error).message);
    }
  }

  @Get("failed")
  @Permissions("webhooks:read")
  @ApiOperation({ summary: "List failed Customermates items" })
  async listFailed(@Req() req: any) {
    return this.failed.list(this.organizationId(req));
  }

  @Post("failed/retry")
  @Permissions("webhooks:write")
  @UsePipes(new V3ZodValidationPipe(RetryFailedSchema))
  @ApiOperation({ summary: "Retry failed Customermates items" })
  async retryFailed(@Req() req: any, @Body() body: RetryFailedInput = {}) {
    return this.failed.retry(this.organizationId(req), body.eventIds);
  }

  @Post("rotate-secret")
  @Permissions("webhooks:write")
  @UsePipes(new V3ZodValidationPipe(RotateSecretSchema))
  @ApiOperation({ summary: "Rotate the Customermates webhook secret" })
  async rotateSecret(@Req() req: any, @Body() body: RotateSecretInput) {
    return this.connection.rotateSecret(this.organizationId(req), body.webhookSecret);
  }

  @Delete()
  @Permissions("webhooks:write")
  @ApiOperation({ summary: "Disconnect Customermates while keeping synced records" })
  async disconnect(@Req() req: any) {
    return this.connection.disconnect(this.organizationId(req));
  }

  private organizationId(req: any): string {
    return req.v3Context?.organizationId || req.organization?.id;
  }
}
