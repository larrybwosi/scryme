import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Param,
  Post,
  Req,
  UseInterceptors,
} from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { AllowPublic } from "@/v3/common/decorators/auth.decorator";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";
import { CustomermatesWebhookService } from "../../application/customermates-webhook.service";
import type { CustomermatesWebhookEvent } from "@repo/customermates";

@ApiTags("V3 CRM Customermates Webhook")
@Controller("webhooks/customermates")
@UseInterceptors(StandardResponseInterceptor)
export class CustomermatesWebhookController {
  constructor(private readonly service: CustomermatesWebhookService) {}

  @AllowPublic()
  @Post(":orgSlug")
  @ApiParam({ name: "orgSlug", type: "string" })
  @ApiOperation({ summary: "Receive a signed Customermates webhook delivery" })
  async receive(
    @Param("orgSlug") orgSlug: string,
    @Headers("x-webhook-signature") signature: string | undefined,
    @Req() req: any,
    @Body() payload: CustomermatesWebhookEvent,
  ) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new BadRequestException("Webhook body must be a JSON object");
    }
    const rawBody = typeof req?.rawBody === "string"
      ? req.rawBody
      : JSON.stringify(payload);
    return this.service.receive(orgSlug, signature, rawBody, payload);
  }
}
