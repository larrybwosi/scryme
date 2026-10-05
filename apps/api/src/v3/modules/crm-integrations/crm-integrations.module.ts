import { Module, OnModuleInit } from "@nestjs/common";
import { CommunicationIntegrationService } from "./application/use-cases/communication-integration.service";
import { CommunicationController } from "./interfaces/http/communication.controller";
import { WhatsappCloudApiProvider } from "./domain/whatsapp-cloud-api.provider";
import { WhatsappService } from "./application/use-cases/whatsapp.service";
import { WhatsappCrmController, WhatsappPublicWebhookController } from "./interfaces/http/whatsapp.controller";

@Module({
  providers: [
    CommunicationIntegrationService,
    WhatsappCloudApiProvider,
    WhatsappService,
  ],
  controllers: [
    CommunicationController,
    WhatsappCrmController,
    WhatsappPublicWebhookController,
  ],
  exports: [
    CommunicationIntegrationService,
    WhatsappService,
    WhatsappCloudApiProvider,
  ],
})
export class CrmIntegrationsModule implements OnModuleInit {
  constructor(
    private readonly commService: CommunicationIntegrationService,
    private readonly whatsappProvider: WhatsappCloudApiProvider,
  ) {}

  onModuleInit() {
    this.commService.registerProvider(this.whatsappProvider);
  }
}
