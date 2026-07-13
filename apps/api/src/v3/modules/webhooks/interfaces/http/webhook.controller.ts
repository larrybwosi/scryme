import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Param,
  Delete,
  UseInterceptors,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from "@nestjs/swagger";
import * as crypto from "crypto";
import { isSafeUrl } from "@repo/shared/server";
import { V3AuthGuard } from "@/v3/common/guards/v3-auth.guard";
import { PrismaService } from "@/prisma/prisma.service";
import {
  CreateWebhookDto,
  WebhookResponseDto,
} from "../../application/dto/webhook.dto";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";
import { ApiErrorResponseDto } from "@/v3/common/dto/response.dto";
import { MultiTenancyGuard } from "@/v3/common/guards/multi-tenancy.guard";

@ApiTags("V3 Webhooks")
@ApiBearerAuth()
@Controller(":orgSlug/webhooks")
@ApiParam({ name: "orgSlug", type: "string" })
@UseGuards(V3AuthGuard, MultiTenancyGuard)
@UseInterceptors(StandardResponseInterceptor)
export class WebhookController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @ApiOperation({
    summary: "Register a new webhook subscription",
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
  @ApiOperation({
    summary: "List all webhooks",
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
    });
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete a webhook",
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
}
