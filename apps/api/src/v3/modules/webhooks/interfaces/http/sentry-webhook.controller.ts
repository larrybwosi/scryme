import {
  Controller,
  Post,
  Req,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import * as crypto from "crypto";
import { AllowPublic } from "@/v3/common/auth";
import { PrismaService } from "@/prisma/prisma.service";

@ApiTags("V3 Sentry Webhook Receiver")
@Controller("v3/webhooks/sentry")
export class PublicSentryWebhookController {
  private readonly logger = new Logger(PublicSentryWebhookController.name);

  constructor(private readonly prisma: PrismaService) {}

  @AllowPublic()
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Public webhook receiver for Sentry error alerts and issue events",
    operationId: "Webhooks_ReceiveSentryWebhook",
  })
  @ApiResponse({ status: 200, description: "Webhook processed successfully" })
  async receiveSentryWebhook(
    @Req() req: any,
    @Headers("sentry-hook-resource") resourceHeader: string,
    @Headers("sentry-hook-signature") signatureHeader: string,
    @Body() body: any,
  ) {
    this.logger.log(`Received Sentry webhook resource: ${resourceHeader || "unknown"}`);

    // Fetch Sentry integration settings from GlobalSettings
    const settings = await this.prisma.client.globalSetting.findMany({
      where: {
        key: {
          in: [
            "system:integration:sentry:webhookSecret",
            "system:integration:sentry:enabled",
            "system:admin:chat:workspaceSlug",
            "system:admin:chat:channelSlug",
          ],
        },
      },
    });

    const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

    const isEnabled = settingsMap.get("system:integration:sentry:enabled") !== "false";
    if (!isEnabled) {
      this.logger.warn("Sentry integration is currently disabled in system settings. Skipping event.");
      return { success: true, message: "Sentry integration is disabled" };
    }

    const webhookSecret = settingsMap.get("system:integration:sentry:webhookSecret") || process.env.SENTRY_WEBHOOK_SECRET;

    // HMAC Signature verification if secret is configured
    if (webhookSecret && signatureHeader) {
      const rawBody = req.rawBody ? req.rawBody.toString("utf-8") : JSON.stringify(body);
      const computedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      if (computedSignature !== signatureHeader) {
        this.logger.error("Invalid Sentry webhook HMAC signature");
        throw new UnauthorizedException("Invalid webhook signature");
      }
    }

    const action = body.action || "created";
    const data = body.data || {};
    const issue = data.issue || data.event || {};
    const project = data.project || issue.project || {};

    const issueTitle = issue.title || issue.message || body.message || "Unknown Sentry Issue";
    const issueUrl = issue.web_url || issue.permalink || issue.url || "https://sentry.io";
    const projectName = project.name || project.slug || "Scryme System";
    const culprit = issue.culprit || issue.location || "N/A";
    const level = (issue.level || "error").toUpperCase();
    const environment = issue.environment || data.environment || process.env.NODE_ENV || "production";

    const workspaceSlug = settingsMap.get("system:admin:chat:workspaceSlug") || "system-admins";
    const channelSlug = settingsMap.get("system:admin:chat:channelSlug") || "system-alerts";

    const formattedMessage = `🚨 **Sentry Exception Alert** [${level}]
• **Title**: ${issueTitle}
• **Project**: ${projectName} (\`${environment}\`)
• **Culprit / Location**: \`${culprit}\`
• **Action**: \`${action}\`
• **Details & Trace**: ${issueUrl}`;

    try {
      const { ScrymeChatApiClient } = await import("@repo/chat");
      const scrymeClient = new ScrymeChatApiClient();

      await scrymeClient.sendMessage(workspaceSlug, channelSlug, {
        content: formattedMessage,
      });

      this.logger.log(`Dispatched Sentry error alert to Scryme Chat #${channelSlug} in workspace "${workspaceSlug}"`);
      return { success: true, message: "Alert dispatched to Scryme Chat" };
    } catch (error: any) {
      this.logger.error(`Failed to dispatch Sentry alert to Scryme Chat: ${error.message || error}`);
      return { success: true, warning: "Event received but Scryme Chat dispatch failed", error: error.message };
    }
  }
}
