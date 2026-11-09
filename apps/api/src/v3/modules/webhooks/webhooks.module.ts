import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import {
  WebhookController,
  PublicIncomingWebhookController,
} from "./interfaces/http/webhook.controller";
import { PublicSentryWebhookController } from "./interfaces/http/sentry-webhook.controller";
import { GitHubWebhookController } from "./interfaces/http/github-webhook.controller";
import { GitHubReleaseService } from "./infrastructure/services/github-release.service";
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
    GitHubWebhookController,
  ],
  providers: [WebhookService, WebhookProcessor, GitHubReleaseService],
  exports: [WebhookService, GitHubReleaseService],
})
export class WebhooksModule {}
