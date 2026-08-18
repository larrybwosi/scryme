import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Res,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from "@nestjs/swagger";
import { CommunicationIntegrationService } from "../../application/use-cases/communication-integration.service";
import { V3AuthGuard } from "@/v3/common/guards/v3-auth.guard";
import { CurrentUser } from "@/v3/common/decorators/current-user.decorator";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";
import { ApiErrorResponseDto } from "@/v3/common/dto/response.dto";
import { env } from "@repo/env";

@ApiTags("V3 CRM")
@ApiBearerAuth()
@Controller(":orgSlug/crm-integrations")
@ApiParam({ name: "orgSlug", type: "string" })
@UseInterceptors(StandardResponseInterceptor)
export class CommunicationController {
  constructor(private readonly service: CommunicationIntegrationService) {}

  @Get(":provider/auth")
  @ApiOperation({
    summary: "Get OAuth2 authorization URL",
    operationId: "CrmIntegrations_GetAuthUrl",
  })
  @UseGuards(V3AuthGuard)
  @ApiResponse({ status: 200, description: "Returns the OAuth2 URL" })
  getAuthUrl(@Param("provider") provider: string, @CurrentUser() user: any) {
    return {
      url: this.service.getProvider(provider).getAuthUrl(user.organizationId),
    };
  }

  @Get(":provider/callback")
  @ApiOperation({
    summary: "OAuth2 callback",
    operationId: "CrmIntegrations_HandleCallback",
  })
  async handleCallback(
    @Param("provider") provider: string,
    @Query("code") code: string,
    @Query("state") organizationId: string,
    @Res() res: any,
  ) {
    await this.service.handleOAuthCallback(provider, organizationId, code);

    // SECURITY (Sentinel): Redirect back to configured application URL
    const baseUrl = env.NEXT_PUBLIC_CRM_URL || env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    res.redirect(
      `${baseUrl}/crm/integrations/${provider}?success=true`,
    );
  }

  @Post(":provider/webhook")
  @ApiOperation({
    summary: "Generic webhook receiver for providers",
    operationId: "CrmIntegrations_HandleWebhook",
  })
  async handleWebhook(
    @Param("provider") provider: string,
    @Body() payload: any,
    @Query() query: any,
  ) {
    // Special handling for Slack challenge
    if (payload.type === "url_verification") {
      return { challenge: payload.challenge };
    }

    return this.service.handleWebhook(provider, payload, query);
  }

  @Post("activities/:id/reply")
  @ApiOperation({
    summary: "Reply to a communication activity",
    operationId: "CrmIntegrations_ReplyToActivity",
  })
  @UseGuards(V3AuthGuard)
  @ApiResponse({ status: 201, description: "Reply sent" })
  @ApiResponse({ status: 400, type: ApiErrorResponseDto, description: "Failed to send reply" })
  async reply(
    @Param("id") activityId: string,
    @Body("text") text: string,
    @CurrentUser() user: any,
  ) {
    return this.service.replyToActivity(user.organizationId, activityId, text);
  }
}
