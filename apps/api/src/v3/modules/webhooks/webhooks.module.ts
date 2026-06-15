import {V3AuthModule} from "../auth/auth.module";
import {Module, Global, forwardRef} from "@nestjs/common";
import {BullModule} from "@nestjs/bullmq";
import {WebhookController} from "./interfaces/http/webhook.controller";
import {WindmillCallbackController} from "./interfaces/http/WindmillCallbackController";
import {WebhookService} from "./infrastructure/services/webhook.service";
import {WebhookProcessor} from "./infrastructure/workers/webhook.processor";
import {WindmillCallbackUseCase} from "./application/use-cases/WindmillCallbackUseCase";

@Module({
  imports: [
    forwardRef(() => V3AuthModule),
    BullModule.registerQueue({
      name: "webhooks",
    }),
  ],
  controllers: [WebhookController, WindmillCallbackController],
  providers: [WebhookService, WebhookProcessor, WindmillCallbackUseCase],
  exports: [WebhookService],
})
export class WebhooksModule {}
