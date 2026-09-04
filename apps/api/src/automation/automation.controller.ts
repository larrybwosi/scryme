import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from "@nestjs/swagger";
import { AutomationService } from "./automation.service";
import type { CreateWorkflowDefinitionDto, TriggerWorkflowDto, CreateWebhookDto } from "./dto/automation.dto";
import { AllowPublic } from "../common/decorators/auth.decorator";
import { v3Context } from "../v3/common/decorators/v3-context.decorator";
import type { V3ApiContext } from "@repo/shared/api/v2";
import { V3AuthGuard } from "../v3/common/guards/v3-auth.guard";
import { MultiTenancyGuard } from "../v3/common/guards/multi-tenancy.guard";
import { PermissionsGuard } from "../v3/common/guards/permissions.guard";
import { Permissions } from "../v3/common/decorators/permissions.decorator";
import { AuditInterceptor } from "../v3/common/interceptors/audit.interceptor";
import { StandardResponseInterceptor } from "../v3/common/interceptors/standard-response.interceptor";

@ApiTags("V3 Automation & Workflows")
@ApiBearerAuth()
@Controller(":orgSlug/automation")
@ApiParam({ name: "orgSlug", type: "string" })
@UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor, StandardResponseInterceptor)
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Get("available")
  @Permissions("workflow:view")
  @ApiOperation({ summary: "Get all available automation workflow definitions and templates" })
  async getAvailableWorkflows(@v3Context() ctx: V3ApiContext) {
    return this.automationService.getAvailableWorkflows(ctx.organizationId);
  }

  @Get("definitions")
  @Permissions("workflow:view")
  @ApiOperation({ summary: "List active workflow definitions for organization" })
  async getDefinitions(@v3Context() ctx: V3ApiContext) {
    return this.automationService.getDefinitions(ctx.organizationId);
  }

  @Post("definitions")
  @Permissions("workflow:manage")
  @ApiOperation({ summary: "Create or update custom workflow definition" })
  async createDefinition(
    @v3Context() ctx: V3ApiContext,
    @Body() dto: CreateWorkflowDefinitionDto,
  ) {
    return this.automationService.createDefinition(ctx.organizationId, dto);
  }

  @Post("provision")
  @Permissions("workflow:manage")
  @ApiOperation({ summary: "Provision a workflow definition for organization" })
  async provisionWorkflow(
    @v3Context() ctx: V3ApiContext,
    @Body() body: { path: string; settings: any },
  ) {
    return this.automationService.provisionWorkflow(
      ctx.organizationId,
      body.path,
      body.settings,
    );
  }

  @Post("definitions/provision")
  @Permissions("workflow:manage")
  @ApiOperation({ summary: "Batch provision definitions" })
  async provisionDefinitions(
    @v3Context() ctx: V3ApiContext,
    @Body() body?: { customConfigs?: Record<string, any> },
  ) {
    return this.automationService.provisionDefinitions(
      ctx.organizationId,
      body?.customConfigs,
    );
  }

  @Post("trigger")
  @Permissions("workflow:execute")
  @ApiOperation({ summary: "Manually trigger workflow execution" })
  async triggerWorkflow(
    @v3Context() ctx: V3ApiContext,
    @Body() body: TriggerWorkflowDto | { path?: string; key?: string; inputs?: any; payload?: any },
  ) {
    return this.automationService.triggerWorkflow(ctx.organizationId, body);
  }

  @Post("cancel")
  @Permissions("workflow:execute")
  @ApiOperation({ summary: "Cancel a running workflow job instance" })
  async cancelJob(
    @v3Context() ctx: V3ApiContext,
    @Body() body: { jobId: string },
  ) {
    return this.automationService.cancelJob(ctx.organizationId, body.jobId);
  }

  @Get("history")
  @Permissions("workflow:view")
  @ApiOperation({ summary: "Get execution history for workflows" })
  async getExecutionHistory(
    @v3Context() ctx: V3ApiContext,
    @Query("path") path?: string,
  ) {
    return this.automationService.getExecutionHistory(ctx.organizationId, path);
  }

  @Get("logs")
  @Permissions("workflow:view")
  @ApiOperation({ summary: "Get detailed logs for a workflow execution job" })
  async getLogs(
    @v3Context() ctx: V3ApiContext,
    @Query("jobId") jobId: string,
  ) {
    return this.automationService.getLogs(ctx.organizationId, jobId);
  }

  @Get("executions")
  @Permissions("workflow:view")
  @ApiOperation({ summary: "Get detailed execution records" })
  async getExecutions(
    @v3Context() ctx: V3ApiContext,
    @Query("key") key?: string,
  ) {
    return this.automationService.getExecutions(ctx.organizationId, key);
  }

  @Get("audit-logs")
  @Permissions("workflow:view")
  @ApiOperation({ summary: "Get audit logs for workflow executions" })
  async getAuditLogs(
    @v3Context() ctx: V3ApiContext,
    @Query("executionId") executionId?: string,
  ) {
    return this.automationService.getAuditLogs(ctx.organizationId, executionId);
  }

  @Get("webhooks")
  @Permissions("workflow:view")
  @ApiOperation({ summary: "List webhooks" })
  async getWebhooks(@v3Context() ctx: V3ApiContext) {
    return this.automationService.getWebhooks(ctx.organizationId);
  }

  @Post("webhooks")
  @Permissions("workflow:manage")
  @ApiOperation({ summary: "Create webhook endpoint" })
  async createWebhook(
    @v3Context() ctx: V3ApiContext,
    @Body() dto: CreateWebhookDto,
  ) {
    return this.automationService.createWebhook(ctx.organizationId, dto);
  }

  @AllowPublic()
  @Post("webhooks/incoming/:organizationId/:endpointId")
  @ApiOperation({ summary: "Handle incoming public webhook trigger" })
  async handleIncomingWebhook(
    @Param("organizationId") organizationId: string,
    @Param("endpointId") endpointId: string,
    @Headers() headers: any,
    @Body() body: any,
  ) {
    return this.automationService.handleIncomingWebhook(
      organizationId,
      endpointId,
      headers,
      body,
    );
  }
}
