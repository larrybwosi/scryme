import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";

// Infrastructure — providers
import { StrapiV4Provider } from "./infrastructure/providers/strapi-v4.provider";

// Infrastructure — services
import { StrapiWebhookVerifierService } from "./infrastructure/services/strapi-webhook-verifier.service";
import { StrapiWebhookService } from "./infrastructure/services/strapi-webhook.service";

// Infrastructure — workers
import { StrapiSyncProcessor, STRAPI_QUEUE } from "./infrastructure/workers/strapi-sync.processor";

// Application — use-cases
import { StrapiConnectionUseCase } from "./application/use-cases/strapi-connection.use-case";
import { StrapiProductSyncUseCase } from "./application/use-cases/strapi-product-sync.use-case";
import { StrapiCustomerSyncUseCase } from "./application/use-cases/strapi-customer-sync.use-case";

// Interfaces — controllers
import { StrapiConnectionController } from "./interfaces/http/strapi-connection.controller";
import { StrapiWebhookController } from "./interfaces/http/strapi-webhook.controller";

@Module({
  imports: [
    BullModule.registerQueue({
      name: STRAPI_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5_000 },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 500 },
      },
    }),
  ],
  controllers: [
    StrapiConnectionController,
    StrapiWebhookController,
  ],
  providers: [
    // Infra
    StrapiV4Provider,
    StrapiWebhookVerifierService,
    StrapiWebhookService,
    StrapiSyncProcessor,
    // Application
    StrapiConnectionUseCase,
    StrapiProductSyncUseCase,
    StrapiCustomerSyncUseCase,
  ],
  exports: [
    StrapiConnectionUseCase,
    StrapiProductSyncUseCase,
    StrapiCustomerSyncUseCase,
    StrapiWebhookService,
    StrapiV4Provider,
  ],
})
export class StrapiModule {}
