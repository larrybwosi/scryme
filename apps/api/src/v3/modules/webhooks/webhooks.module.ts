import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import {
  WebhookController,
  PublicIncomingWebhookController,
} from "./interfaces/http/webhook.controller";
import { PublicSentryWebhookController } from "./interfaces/http/sentry-webhook.controller";
import { WebhookService } from "./infrastructure/services/webhook.service";
import { WebhookProcessor } from "./infrastructure/workers/webhook.processor";

@Module({
  imports: [
    BullModule.registerQueue({
      name: "webhooks",
    }),
  ],
  controllers: [
    WebhookController,
    PublicIncomingWebhookController,
    PublicSentryWebhookController,
  ],
  providers: [WebhookService, WebhookProcessor],
  exports: [WebhookService],
})
export class WebhooksModule {}
