import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  UseInterceptors,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from "@nestjs/swagger";
import { WhatsappService } from "../../application/use-cases/whatsapp.service";
import { V3AuthGuard } from "@/v3/common/guards/v3-auth.guard";
import { CurrentUser } from "@/v3/common/decorators/current-user.decorator";
import { AllowPublic } from "@/v3/common/decorators/auth.decorator";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";

@ApiTags("V3 CRM WhatsApp")
@Controller(["v3/webhooks/whatsapp", "api/v3/webhooks/whatsapp"])
@UseInterceptors(StandardResponseInterceptor)
export class WhatsappPublicWebhookController {
  constructor(private readonly service: WhatsappService) {}

  @Get()
  @AllowPublic()
  @ApiOperation({ summary: "Meta WhatsApp Webhook Verification Challenge" })
  verifyWebhook(
    @Query("hub.mode") mode: string,
    @Query("hub.verify_token") token: string,
    @Query("hub.challenge") challenge: string,
  ) {
    if (mode === "subscribe" && token) {
      return challenge;
    }
    throw new ForbiddenException("Invalid verification token or mode");
  }

  @Post()
  @AllowPublic()
  @ApiOperation({ summary: "Meta WhatsApp Webhook Payload Receiver" })
  async receiveWebhook(@Body() payload: any) {
    return this.service.processIncomingWebhook(payload);
  }
}

@ApiTags("V3 CRM WhatsApp")
@ApiBearerAuth()
@Controller([":orgSlug/crm/communication", "v3/:orgSlug/crm/communication", "api/v3/:orgSlug/crm/communication"])
@ApiParam({ name: "orgSlug", type: "string" })
@UseInterceptors(StandardResponseInterceptor)
@UseGuards(V3AuthGuard)
export class WhatsappCrmController {
  constructor(private readonly service: WhatsappService) {}

  @Get("whatsapp/config")
  @ApiOperation({ summary: "Get WhatsApp Integration Configuration" })
  async getConfig(@CurrentUser() user: any) {
    const integration = await this.service.getIntegration(user.organizationId);
    return {
      isConnected: !!integration?.isActive,
      credentials: integration?.credentials || null,
      syncStatus: integration?.syncStatus || "DISCONNECTED",
    };
  }

  @Post("whatsapp/config")
  @ApiOperation({ summary: "Save WhatsApp Credentials" })
  async saveConfig(
    @CurrentUser() user: any,
    @Body() body: { phoneNumberId: string; accessToken: string; verifyToken?: string; displayPhoneNumber?: string; wabaId?: string },
  ) {
    if (!body.phoneNumberId || !body.accessToken) {
      throw new BadRequestException("Phone Number ID and Access Token are required.");
    }
    return this.service.saveCredentials(user.organizationId, body);
  }

  @Get("threads")
  @ApiOperation({ summary: "List WhatsApp Communication Threads" })
  async listThreads(@CurrentUser() user: any) {
    return this.service.listThreads(user.organizationId);
  }

  @Get("threads/:threadId/messages")
  @ApiOperation({ summary: "Get Messages for a Communication Thread" })
  async getThreadMessages(@Param("threadId") threadId: string, @CurrentUser() user: any) {
    return this.service.getThreadMessages(user.organizationId, threadId);
  }

  @Post("send")
  @ApiOperation({ summary: "Send WhatsApp Message or Template" })
  async sendMessage(
    @CurrentUser() user: any,
    @Body()
    body: {
      recipientPhone: string;
      text: string;
      templateName?: string;
      templateLanguage?: string;
      components?: any[];
      crmRecordId?: string;
    },
  ) {
    if (!body.recipientPhone || (!body.text && !body.templateName)) {
      throw new BadRequestException("Recipient phone and message text or template are required.");
    }
    return this.service.sendMessage(user.organizationId, user.memberId || user.id, body);
  }

  @Get("templates")
  @ApiOperation({ summary: "List Synced WhatsApp Templates" })
  async listTemplates(@CurrentUser() user: any) {
    return this.service.listTemplates(user.organizationId);
  }

  @Post("templates/sync")
  @ApiOperation({ summary: "Sync Templates from Meta WhatsApp Cloud API" })
  async syncTemplates(@CurrentUser() user: any) {
    return this.service.syncTemplates(user.organizationId);
  }
}
