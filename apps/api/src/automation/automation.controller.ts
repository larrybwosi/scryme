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
  UsePipes,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from "@nestjs/swagger";
import { AutomationService } from "./automation.service";
import type {
  CreateWorkflowDefinitionDto,
  TriggerWorkflowDto,
  CreateWebhookDto,
  SimulateWorkflowDto,
  ReplayWorkflowDto,
  ProvisionWorkflowDto,
  ProvisionDefinitionsDto,
  CancelWorkflowDto,
  RetryJobDto,
  HitlActionDto,
} from "./dto/automation.dto";
import {
  CancelWorkflowSchema,
  CreateWebhookSchema,
  CreateWorkflowDefinitionSchema,
  HitlActionSchema,
  ProvisionDefinitionsSchema,
  ProvisionWorkflowSchema,
  ReplayWorkflowSchema,
  RetryJobSchema,
  SimulateWorkflowSchema,
  TriggerWorkflowSchema,
} from "./dto/automation.dto";
import { V3ZodValidationPipe } from "../v3/common/pipes/v3-zod-validation.pipe";
import { AllowPublic } from "../common/decorators/auth.decorator";
import { v3Context } from "../v3/common/decorators/v3-context.decorator";
import type { V3ApiContext } from "@repo/shared/api/v3";
import { V3AuthGuard } from "../v3/common/guards/v3-auth.guard";
import { MultiTenancyGuard } from "../v3/common/guards/multi-tenancy.guard";
import { PermissionsGuard } from "../v3/common/guards/permissions.guard";
import { Permissions } from "../v3/common/decorators/permissions.decorator";
import { AuditInterceptor } from "../v3/common/interceptors/audit.interceptor";
import { StandardResponseInterceptor } from "../v3/common/interceptors/standard-response.interceptor";

function readPagination(limit?: string, offset?: string) {
  return {
    limit: limit !== undefined ? Number(limit) : undefined,
    offset: offset !== undefined ? Number(offset) : undefined,
  };
}


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
  @UsePipes(new V3ZodValidationPipe(CreateWorkflowDefinitionSchema))
  @ApiOperation({ summary: "Create or update custom workflow definition" })
  async createDefinition(
    @v3Context() ctx: V3ApiContext,
    @Body() dto: CreateWorkflowDefinitionDto,
  ) {
    return this.automationService.createDefinition(ctx.organizationId, dto);
  }

  @Post("provision")
  @Permissions("workflow:manage")
  @UsePipes(new V3ZodValidationPipe(ProvisionWorkflowSchema))
  @ApiOperation({ summary: "Provision a workflow definition for organization" })
  async provisionWorkflow(
    @v3Context() ctx: V3ApiContext,
    @Body() body: ProvisionWorkflowDto,
  ) {
    return this.automationService.provisionWorkflow(
      ctx.organizationId,
      body.path,
      body.settings,
    );
  }

  @Post("definitions/provision")
  @Permissions("workflow:manage")
  @UsePipes(new V3ZodValidationPipe(ProvisionDefinitionsSchema))
  @ApiOperation({ summary: "Batch provision definitions" })
  async provisionDefinitions(
    @v3Context() ctx: V3ApiContext,
    @Body() body: ProvisionDefinitionsDto,
  ) {
    return this.automationService.provisionDefinitions(
      ctx.organizationId,
      body.customConfigs,
    );
  }

  @Post("trigger")
  @Permissions("workflow:execute")
  @UsePipes(new V3ZodValidationPipe(TriggerWorkflowSchema))
  @ApiOperation({ summary: "Manually trigger workflow execution" })
  async triggerWorkflow(
    @v3Context() ctx: V3ApiContext,
    @Body() body: TriggerWorkflowDto,
  ) {
    return this.automationService.triggerWorkflow(ctx.organizationId, body);
  }

  @Post("simulate")
  @Permissions("workflow:view")
  @UsePipes(new V3ZodValidationPipe(SimulateWorkflowSchema))
  @ApiOperation({ summary: "Simulate a dry-run execution of a workflow DAG without side effects" })
  async simulateWorkflow(
    @v3Context() ctx: V3ApiContext,
    @Body() body: SimulateWorkflowDto,
  ) {
    return this.automationService.simulateWorkflow(ctx.organizationId, body);
  }

  @Post("replay")
  @Permissions("workflow:execute")
  @UsePipes(new V3ZodValidationPipe(ReplayWorkflowSchema))
  @ApiOperation({ summary: "Replay a past execution with optional payload overrides" })
  async replayExecution(
    @v3Context() ctx: V3ApiContext,
    @Body() body: ReplayWorkflowDto,
  ) {
    return this.automationService.replayExecution(ctx.organizationId, body);
  }

  @Post("cancel")
  @Permissions("workflow:execute")
  @UsePipes(new V3ZodValidationPipe(CancelWorkflowSchema))
  @ApiOperation({ summary: "Cancel a running workflow job or execution" })
  async cancelJob(
    @v3Context() ctx: V3ApiContext,
    @Body() body: CancelWorkflowDto,
  ) {
    return this.automationService.cancelJob(ctx.organizationId, body.jobId);
  }

  @Get("history")
  @Permissions("workflow:view")
  @ApiOperation({ summary: "Get execution history for workflows" })
  async getExecutionHistory(
    @v3Context() ctx: V3ApiContext,
    @Query("path") path?: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    return this.automationService.getExecutionHistory(
      ctx.organizationId,
      path,
      readPagination(limit, offset),
    );
  }

  @Get("logs")
  @Permissions("workflow:view")
  @ApiOperation({ summary: "Get detailed logs for a workflow job or execution" })
  async getLogs(
    @v3Context() ctx: V3ApiContext,
    @Query("jobId") jobId: string,
  ) {
    return this.automationService.getLogs(ctx.organizationId, jobId);
  }

  @Get("executions/:executionId/steps")
  @Permissions("workflow:view")
  @ApiOperation({ summary: "Get structured step execution history for a run" })
  async getExecutionSteps(
    @v3Context() ctx: V3ApiContext,
    @Param("executionId") executionId: string,
  ) {
    return this.automationService.getExecutionSteps(ctx.organizationId, executionId);
  }

  @Get("executions")
  @Permissions("workflow:view")
  @ApiOperation({ summary: "Get detailed execution records" })
  async getExecutions(
    @v3Context() ctx: V3ApiContext,
    @Query("key") key?: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    return this.automationService.getExecutions(
      ctx.organizationId,
      key,
      readPagination(limit, offset),
    );
  }

  @Get("audit-logs")
  @Permissions("workflow:view")
  @ApiOperation({ summary: "Get audit logs for workflow executions" })
  async getAuditLogs(
    @v3Context() ctx: V3ApiContext,
    @Query("executionId") executionId?: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    return this.automationService.getAuditLogs(
      ctx.organizationId,
      executionId,
      readPagination(limit, offset),
    );
  }

  @Get("dead-letter")
  @Permissions("workflow:view")
  @ApiOperation({ summary: "List failed jobs waiting in the dead letter queue" })
  async getDeadLetterJobs(
    @v3Context() ctx: V3ApiContext,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    return this.automationService.getDeadLetterJobs(
      ctx.organizationId,
      readPagination(limit, offset),
    );
  }

  @Post("dead-letter/:jobId/retry")
  @Permissions("workflow:execute")
  @ApiOperation({ summary: "Retry a failed job from the dead letter queue" })
  async retryDeadLetterJob(
    @v3Context() ctx: V3ApiContext,
    @Param("jobId") jobId: string,
  ) {
    return this.automationService.retryJob(ctx.organizationId, jobId);
  }

  @Post("jobs/retry")
  @Permissions("workflow:execute")
  @UsePipes(new V3ZodValidationPipe(RetryJobSchema))
  @ApiOperation({ summary: "Retry a failed job by id" })
  async retryJob(
    @v3Context() ctx: V3ApiContext,
    @Body() body: RetryJobDto,
  ) {
    return this.automationService.retryJob(ctx.organizationId, body.jobId);
  }

  @Get("webhooks")
  @Permissions("workflow:view")
  @ApiOperation({ summary: "List webhooks" })
  async getWebhooks(@v3Context() ctx: V3ApiContext) {
    return this.automationService.getWebhooks(ctx.organizationId);
  }

  @Post("webhooks")
  @Permissions("workflow:manage")
  @UsePipes(new V3ZodValidationPipe(CreateWebhookSchema))
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

  @Post("actions/hitl")
  @Permissions("workflow:execute")
  @UsePipes(new V3ZodValidationPipe(HitlActionSchema))
  @ApiOperation({ summary: "Execute Human-In-The-Loop (HITL) action button from ScrymeChat or UI" })
  async executeHitlAction(
    @v3Context() ctx: V3ApiContext,
    @Body() body: HitlActionDto,
  ) {
    if (body.action === "remove_expired_stock" && body.batchId) {
      return this.automationService.removeExpiredStock(ctx.organizationId, {
        batchId: body.batchId,
        memberId: ctx.memberId,
        notes: body.notes,
      });
    }

    return {
      success: true,
      message: `Action ${body.action} processed.`,
      action: body.action,
    };
  }

  @AllowPublic()
  @Post("actions/scryme-chat/:organizationId")
  @ApiOperation({ summary: "Public webhook for ScrymeChat action button callbacks" })
  async handleScrymeChatActionCallback(
    @Param("organizationId") organizationId: string,
    @Body() body: any,
  ) {
    let actionData: any = {};
    if (typeof body.value === "string") {
      try {
        actionData = JSON.parse(body.value);
      } catch {
        actionData = { action: body.value };
      }
    } else if (typeof body.value === "object" && body.value !== null) {
      actionData = body.value;
    } else {
      actionData = body;
    }

    if (actionData.action === "remove_expired_stock" && actionData.batchId) {
      const result = await this.automationService.removeExpiredStock(organizationId, {
        batchId: actionData.batchId,
        memberId: body.userId || body.memberId,
        notes: "ScrymeChat HITL button click",
      });

      return {
        content: `✅ **Expired Stock Removed**\n\nStock batch **${result.batchNumber || result.batchId}** (${result.productName} - ${result.variantName}) has been zeroed out (${result.removedQuantity} units removed).`,
        result,
      };
    }

    return {
      content: `Action ${actionData.action || "unknown"} executed successfully.`,
      actionData,
    };
  }
}
