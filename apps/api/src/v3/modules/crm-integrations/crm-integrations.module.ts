import { Module, OnModuleInit } from "@nestjs/common";
import { CommunicationIntegrationService } from "./application/use-cases/communication-integration.service";
import { CommunicationController } from "./interfaces/http/communication.controller";
import { WhatsappCloudApiProvider } from "./domain/whatsapp-cloud-api.provider";
import { WhatsappService } from "./application/use-cases/whatsapp.service";
import { WhatsappCrmController, WhatsappPublicWebhookController } from "./interfaces/http/whatsapp.controller";
import { CustomermatesModule } from "./customermates/customermates.module";
import { CustomermatesWritebackService } from "./customermates/application/customermates-writeback.service";

@Module({
  imports: [CustomermatesModule],
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
    CustomermatesWritebackService,
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
