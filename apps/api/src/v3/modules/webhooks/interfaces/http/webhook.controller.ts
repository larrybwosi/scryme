import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Param,
  Delete,
  Patch,
  UseInterceptors,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from "@nestjs/swagger";
import * as crypto from "crypto";
import { isSafeUrl } from "@repo/shared/server";
import { V3AuthGuard } from "@/v3/common/guards/v3-auth.guard";
import { PrismaService } from "@/prisma/prisma.service";
import { WebhookService } from "../../infrastructure/services/webhook.service";
import {
  CreateWebhookDto,
  UpdateWebhookDto,
  CreateIncomingWebhookDto,
  TestWebhookDto,
  WebhookResponseDto,
} from "../../application/dto/webhook.dto";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";
import { ApiErrorResponseDto } from "@/v3/common/dto/response.dto";
import { MultiTenancyGuard } from "@/v3/common/guards/multi-tenancy.guard";
import { PermissionsGuard } from "@/v3/common/guards/permissions.guard";
import { Permissions } from "@/v3/common/decorators/permissions.decorator";
import { AllowPublic } from "@/common/decorators/auth.decorator";

@ApiTags("V3 Webhooks")
@ApiBearerAuth()
@Controller(":orgSlug/webhooks")
@ApiParam({ name: "orgSlug", type: "string" })
@UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
@UseInterceptors(StandardResponseInterceptor)
export class WebhookController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly webhookService: WebhookService,
  ) {}

  @Post()
  @Permissions("webhooks:write")
  @ApiOperation({
    summary: "Register a new outgoing webhook subscription",
    operationId: "Webhooks_Create",
  })
  @ApiResponse({
    status: 201,
    type: WebhookResponseDto,
    description: "Webhook registered",
  })
  @ApiResponse({
    status: 400,
    type: ApiErrorResponseDto,
    description: "Invalid input",
  })
  async create(@Req() req: any, @Body() body: CreateWebhookDto) {
    const { organizationId, clientId } = req.v3Context;

    // @security Validate URL to prevent SSRF at registration
    if (!(await isSafeUrl(body.url))) {
      throw new BadRequestException("Insecure webhook URL blocked");
    }

    // Generate a secure random secret using crypto instead of Math.random()
    const secret = "whsec_" + crypto.randomBytes(24).toString("hex");

    return this.prisma.client.webhookSubscription.create({
      data: {
        name: body.name,
        url: body.url,
        events: body.events,
        organizationId,
        apiClientId: clientId,
        secret,
      },
    });
  }

  @Get()
  @Permissions("webhooks:read")
  @ApiOperation({
    summary: "List all outgoing webhooks",
    operationId: "Webhooks_List",
  })
  @ApiResponse({
    status: 200,
    type: [WebhookResponseDto],
    description: "List of webhooks",
  })
  async list(@Req() req: any) {
    return this.prisma.client.webhookSubscription.findMany({
      where: { organizationId: req.v3Context.organizationId },
      orderBy: { createdAt: "desc" },
    });
  }

  @Patch(":id")
  @Permissions("webhooks:write")
  @ApiOperation({
    summary: "Update an outgoing webhook subscription",
    operationId: "Webhooks_Update",
  })
  async update(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: UpdateWebhookDto,
  ) {
    return this.webhookService.updateSubscription(
      id,
      req.v3Context.organizationId,
      body,
    );
  }

  @Delete(":id")
  @Permissions("webhooks:write")
  @ApiOperation({
    summary: "Delete a webhook subscription",
    operationId: "Webhooks_Delete",
  })
  @ApiResponse({ status: 200, description: "Webhook deleted" })
  async delete(
    @Req() req: any,
    @Param("id") id: string,
  ): Promise<{ count: number }> {
    const result = await this.prisma.client.webhookSubscription.deleteMany({
      where: {
        id,
        organizationId: req.v3Context.organizationId,
      },
    });
    return { count: result.count };
  }

  @Post(":id/test")
  @Permissions("webhooks:write")
  @ApiOperation({
    summary: "Trigger a test webhook dispatch",
    operationId: "Webhooks_TestDispatch",
  })
  async testDispatch(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: TestWebhookDto,
  ) {
    return this.webhookService.dispatchTestPayload(
      id,
      req.v3Context.organizationId,
      body.event,
      body.payload,
    );
  }

  @Get("logs")
  @Permissions("webhooks:read")
  @ApiOperation({
    summary: "Get global delivery logs for webhooks",
    operationId: "Webhooks_GetLogs",
  })
  async getLogs(@Req() req: any) {
    return this.webhookService.getLogs(req.v3Context.organizationId);
  }

  @Get(":id/logs")
  @Permissions("webhooks:read")
  @ApiOperation({
    summary: "Get delivery logs for a specific webhook subscription",
    operationId: "Webhooks_GetSubscriptionLogs",
  })
  async getSubscriptionLogs(@Req() req: any, @Param("id") id: string) {
    return this.webhookService.getLogs(req.v3Context.organizationId, id);
  }

  @Post("logs/:logId/redeliver")
  @Permissions("webhooks:write")
  @ApiOperation({
    summary: "Redeliver a failed webhook dispatch log",
    operationId: "Webhooks_RedeliverLog",
  })
  async redeliverLog(@Req() req: any, @Param("logId") logId: string) {
    return this.webhookService.redeliverLog(
      logId,
      req.v3Context.organizationId,
    );
  }

  // --- Incoming Webhook Endpoints ---

  @Post("incoming")
  @Permissions("webhooks:write")
  @ApiOperation({
    summary: "Create an incoming webhook receiver endpoint",
    operationId: "Webhooks_CreateIncomingEndpoint",
  })
  async createIncomingEndpoint(
    @Req() req: any,
    @Body() body: CreateIncomingWebhookDto,
  ) {
    return this.webhookService.createIncomingEndpoint(
      req.v3Context.organizationId,
      body,
    );
  }

  @Get("incoming")
  @Permissions("webhooks:read")
  @ApiOperation({
    summary: "List incoming webhook endpoints",
    operationId: "Webhooks_ListIncomingEndpoints",
  })
  async listIncomingEndpoints(@Req() req: any) {
    return this.webhookService.listIncomingEndpoints(
      req.v3Context.organizationId,
    );
  }

  @Delete("incoming/:id")
  @Permissions("webhooks:write")
  @ApiOperation({
    summary: "Delete an incoming webhook endpoint",
    operationId: "Webhooks_DeleteIncomingEndpoint",
  })
  async deleteIncomingEndpoint(@Req() req: any, @Param("id") id: string) {
    return this.webhookService.deleteIncomingEndpoint(
      id,
      req.v3Context.organizationId,
    );
  }
}

// Separate Public Controller for receiving external incoming webhooks
@ApiTags("V3 Webhooks Receiver")
@Controller("v3/webhooks")
export class PublicIncomingWebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @AllowPublic()
  @Post("incoming/:orgSlug/:endpointId")
  @ApiOperation({
    summary: "Public receiver for external incoming webhooks",
    operationId: "Webhooks_ReceiveIncomingPayload",
  })
  async receiveIncomingPayload(
    @Param("orgSlug") orgSlug: string,
    @Param("endpointId") endpointId: string,
    @Req() req: any,
    @Body() body: any,
  ) {
    return this.webhookService.handleIncomingPayload(
      orgSlug,
      endpointId,
      req.headers,
      body,
    );
  }
}
