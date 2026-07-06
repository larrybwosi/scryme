import {
  Controller,
  Post,
  Param,
  Headers,
  Body,
  RawBodyRequest,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from "@nestjs/swagger";
import type { Request } from "@nestjs/common";
import { StrapiWebhookService, StrapiWebhookPayload } from "../../infrastructure/services/strapi-webhook.service";

/**
 * StrapiWebhookController
 *
 * Public endpoint that receives lifecycle events from a Strapi instance.
 * No authentication guard — Strapi cannot present a bearer token.
 * Security is provided by HMAC signature verification inside StrapiWebhookService.
 *
 * URL: POST /v3/webhooks/strapi/:connectionId
 *
 * Strapi should be configured with:
 *   URL:    https://api.yourdomain.com/v3/webhooks/strapi/<connectionId>
 *   Events: entry.create, entry.update, entry.delete (for product and customer models)
 */
@ApiTags("V3 Strapi Webhooks")
@Controller("webhooks/strapi")
export class StrapiWebhookController {
  private readonly logger = new Logger(StrapiWebhookController.name);

  constructor(private readonly webhookService: StrapiWebhookService) {}

  @Post(":connectionId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Receive a Strapi v4 lifecycle webhook event",
    operationId: "Strapi_ReceiveWebhook",
    description:
      "Public endpoint. Configure this URL in your Strapi Settings → Webhooks panel. Signature verification uses HMAC-SHA256 via the X-Strapi-Signature header when a webhookSecret is configured.",
  })
  @ApiParam({ name: "connectionId", type: String, description: "Scryme EcommerceConnection ID" })
  @ApiResponse({ status: 200, description: "Accepted and queued for processing" })
  @ApiResponse({ status: 401, description: "Invalid webhook signature" })
  @ApiResponse({ status: 404, description: "Connection not found or inactive" })
  async receive(
    @Param("connectionId") connectionId: string,
    @Headers("x-strapi-signature") signature: string | undefined,
    @Req() req: any,
    @Body() payload: StrapiWebhookPayload,
  ): Promise<{ ok: boolean; webhookLogId: string }> {
    this.logger.log(
      `Strapi webhook received: conn=${connectionId} event=${payload?.event} model=${payload?.model}`,
    );

    // Use rawBody if available (requires NestJS rawBody: true in bootstrap),
    // fall back to re-serialising the parsed body for signature verification.
    const rawBody: Buffer =
      req.rawBody ??
      Buffer.from(JSON.stringify(payload), "utf-8");

    const result = await this.webhookService.handleIncoming(
      connectionId,
      rawBody,
      signature,
      payload,
    );

    return { ok: result.queued, webhookLogId: result.webhookLogId };
  }
}
