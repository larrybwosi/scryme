import { Controller, Get, Post, Body, Query, Param } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { WorkflowsService } from "./workflows.service";
import { v2Context } from "../../common/decorators/v2-context.decorator";
import { RequirePermission } from "../../common/decorators/auth.decorator";
import type { V2ApiContext } from "@repo/shared/api/v2";

@ApiTags("Workflows")
@Controller("workflows")
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Get("available")
  @RequirePermission("workflow:view")
  @ApiOperation({ summary: "Get all available automation workflows" })
  async getAvailableWorkflows(@v2Context() ctx: V2ApiContext) {
    return this.workflowsService.getAvailableWorkflows(ctx);
  }

  @Post("provision")
  @RequirePermission("workflow:manage")
  @ApiOperation({ summary: "Provision a workflow for the organization" })
  async provisionWorkflow(
    @v2Context() ctx: V2ApiContext,
    @Body() body: { path: string; settings: any },
  ) {
    return this.workflowsService.provisionWorkflow(
      ctx,
      body.path,
      body.settings,
    );
  }

  @Post("trigger")
  @RequirePermission("workflow:execute")
  @ApiOperation({ summary: "Manually trigger a workflow" })
  async triggerWorkflow(
    @v2Context() ctx: V2ApiContext,
    @Body() body: { path: string; inputs: any },
  ) {
    return this.workflowsService.triggerWorkflow(ctx, body.path, body.inputs);
  }

  @Get("history")
  @RequirePermission("workflow:view")
  @ApiOperation({ summary: "Get execution history for workflows" })
  async getExecutionHistory(
    @v2Context() ctx: V2ApiContext,
    @Query("path") path?: string,
  ) {
    return this.workflowsService.getExecutionHistory(ctx, path);
  }
}
