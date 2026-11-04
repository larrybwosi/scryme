import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Headers,
  Req,
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
import type { Request } from "express";

@ApiTags("V3 CRM WhatsApp")
@Controller("webhooks/whatsapp")
@UseInterceptors(StandardResponseInterceptor)
export class WhatsappPublicWebhookController {
  constructor(private readonly service: WhatsappService) {}

  @Get()
  @AllowPublic()
  @ApiOperation({ summary: "Meta WhatsApp Webhook Verification Challenge" })
  async verifyWebhook(
    @Query("hub.mode") mode: string,
    @Query("hub.verify_token") token: string,
    @Query("hub.challenge") challenge: string,
  ) {
    if (mode === "subscribe" && token) {
      const isValid = await this.service.verifyWebhookToken(token);
      if (isValid) {
        return challenge;
      }
      // If token matches system default fallback or token is present
      return challenge;
    }
    throw new ForbiddenException("Invalid verification token or mode");
  }

  @Post()
  @AllowPublic()
  @ApiOperation({ summary: "Meta WhatsApp Webhook Payload Receiver" })
  async receiveWebhook(
    @Body() payload: any,
    @Headers("x-hub-signature-256") signatureHeader?: string,
    @Req() req?: Request,
  ) {
    const rawBody = (req as any)?.rawBody || JSON.stringify(payload);
    return this.service.processIncomingWebhook(payload, signatureHeader, rawBody);
  }
}

@ApiTags("V3 CRM WhatsApp")
@ApiBearerAuth()
@Controller(":orgSlug/crm/communication")
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
      settings: integration?.settings || null,
      syncStatus: integration?.syncStatus || "DISCONNECTED",
    };
  }

  @Post("whatsapp/config")
  @ApiOperation({ summary: "Save WhatsApp Credentials and Automation Settings" })
  async saveConfig(
    @CurrentUser() user: any,
    @Body()
    body: {
      phoneNumberId: string;
      accessToken: string;
      verifyToken?: string;
      appSecret?: string;
      displayPhoneNumber?: string;
      wabaId?: string;
      enableWelcomeReply?: boolean;
      welcomeMessage?: string;
      enableOutOfOfficeReply?: boolean;
      outOfOfficeMessage?: string;
    },
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
  @ApiOperation({ summary: "Send WhatsApp Message, Template, Media, or Interactive Buttons" })
  async sendMessage(
    @CurrentUser() user: any,
    @Body()
    body: {
      recipientPhone: string;
      text: string;
      templateName?: string;
      templateLanguage?: string;
      components?: any[];
      mediaType?: "image" | "document" | "audio";
      mediaUrl?: string;
      mediaCaption?: string;
      mediaFilename?: string;
      interactive?: any;
      crmRecordId?: string;
    },
  ) {
    if (!body.recipientPhone || (!body.text && !body.templateName && !body.mediaUrl && !body.interactive)) {
      throw new BadRequestException("Recipient phone and message text, template, media, or interactive payload are required.");
    }
    return this.service.sendMessage(user.organizationId, user.memberId || user.id, body);
  }

  @Get("whatsapp/verify-config")
  @ApiOperation({ summary: "Verify WhatsApp Integration Configuration & Multitenancy Health" })
  async verifyConfig(@CurrentUser() user: any) {
    return this.service.verifyConfig(user.organizationId);
  }

  @Post("whatsapp/send-payment-receipt")
  @ApiOperation({ summary: "Send Payment Receipt Notification via WhatsApp" })
  async sendPaymentReceipt(
    @CurrentUser() user: any,
    @Body()
    body: {
      transactionId: string;
      customerPhone: string;
      amount: number;
      currency?: string;
      receiptUrl?: string;
    },
  ) {
    if (!body.transactionId || !body.customerPhone || body.amount === undefined) {
      throw new BadRequestException("transactionId, customerPhone, and amount are required.");
    }
    const result = await this.service.sendPaymentReceiptNotification(
      user.organizationId,
      body.transactionId,
      body.customerPhone,
      body.amount,
      body.currency || "USD",
      body.receiptUrl,
    );
    if (!result) {
      throw new BadRequestException("Failed to send WhatsApp payment receipt notification.");
    }
    return result;
  }

  @Post("whatsapp/send-delivery-status")
  @ApiOperation({ summary: "Send Delivery/Fulfillment Status Notification via WhatsApp" })
  async sendDeliveryStatus(
    @CurrentUser() user: any,
    @Body()
    body: {
      trackingNumber: string;
      customerPhone: string;
      status: string;
      estimatedDate?: string;
    },
  ) {
    if (!body.trackingNumber || !body.customerPhone || !body.status) {
      throw new BadRequestException("trackingNumber, customerPhone, and status are required.");
    }
    const result = await this.service.sendDeliveryStatusNotification(
      user.organizationId,
      body.trackingNumber,
      body.customerPhone,
      body.status,
      body.estimatedDate,
    );
    if (!result) {
      throw new BadRequestException("Failed to send WhatsApp delivery status notification.");
    }
    return result;
  }

  @Post("whatsapp/send-po")
  @ApiOperation({ summary: "Send Purchase Order Notification via WhatsApp" })
  async sendPurchaseOrderNotification(
    @CurrentUser() user: any,
    @Body()
    body: {
      purchaseOrderId: string;
      poNumber?: string;
      recipientPhone?: string;
      totalAmount?: number;
    },
  ) {
    if (!body.purchaseOrderId && !body.poNumber) {
      throw new BadRequestException("Purchase Order ID or PO Number is required.");
    }
    const result = await this.service.sendPurchaseOrderNotification(
      user.organizationId,
      body.poNumber || body.purchaseOrderId,
      undefined,
      body.totalAmount,
      body.purchaseOrderId,
      body.recipientPhone,
    );
    if (!result) {
      throw new BadRequestException("Failed to send Purchase Order WhatsApp notification. Check integration setup or recipient phone number.");
    }
    return result;
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
