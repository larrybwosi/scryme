import { Controller, Get, Post, Body, Param, Query, Req, Headers, UseGuards } from "@nestjs/common";
import { AutomationService } from "./automation.service";
import { CreateWorkflowDefinitionDto, TriggerWorkflowDto, CreateWebhookDto } from "./dto/automation.dto";
import { AllowPublic } from "../common/decorators/auth.decorator";
import { v2Context } from "../common/decorators/v2-context.decorator";
import type { V2ApiContext } from "@repo/shared/api/v2";

@Controller("v3/automation")
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Get("definitions")
  async getDefinitions(@v2Context() ctx: V2ApiContext) {
    return this.automationService.getDefinitions(ctx.organizationId);
  }

  @Post("definitions")
  async createDefinition(@v2Context() ctx: V2ApiContext, @Body() dto: CreateWorkflowDefinitionDto) {
    return this.automationService.createDefinition(ctx.organizationId, dto);
  }

  @Post("trigger")
  async triggerWorkflow(@v2Context() ctx: V2ApiContext, @Body() dto: TriggerWorkflowDto) {
    return this.automationService.triggerWorkflow(ctx.organizationId, dto);
  }

  @Get("executions")
  async getExecutions(@v2Context() ctx: V2ApiContext, @Query("key") key?: string) {
    return this.automationService.getExecutions(ctx.organizationId, key);
  }

  @Get("audit-logs")
  async getAuditLogs(@v2Context() ctx: V2ApiContext, @Query("executionId") executionId?: string) {
    return this.automationService.getAuditLogs(ctx.organizationId, executionId);
  }

  @Get("webhooks")
  async getWebhooks(@v2Context() ctx: V2ApiContext) {
    return this.automationService.getWebhooks(ctx.organizationId);
  }

  @Post("webhooks")
  async createWebhook(@v2Context() ctx: V2ApiContext, @Body() dto: CreateWebhookDto) {
    return this.automationService.createWebhook(ctx.organizationId, dto);
  }

  @AllowPublic()
  @Post("webhooks/incoming/:organizationId/:endpointId")
  async handleIncomingWebhook(
    @Param("organizationId") organizationId: string,
    @Param("endpointId") endpointId: string,
    @Headers() headers: any,
    @Body() body: any,
  ) {
    return this.automationService.handleIncomingWebhook(organizationId, endpointId, headers, body);
  }
}
