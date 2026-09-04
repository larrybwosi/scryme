import { Module, Global, forwardRef } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { WebhookController } from "./interfaces/http/webhook.controller";
import { WebhookService } from "./infrastructure/services/webhook.service";
import { WebhookProcessor } from "./infrastructure/workers/webhook.processor";

@Module({
  imports: [
    BullModule.registerQueue({
      name: "webhooks",
    }),
  ],
  controllers: [WebhookController],
  providers: [WebhookService, WebhookProcessor],
  exports: [WebhookService],
})
export class WebhooksModule {}
