import { Module, Global, forwardRef } from "@nestjs/common";
import { CommunicationIntegrationService } from "./application/use-cases/communication-integration.service";
import { CommunicationController } from "./interfaces/http/communication.controller";

@Module({
  providers: [CommunicationIntegrationService],
  controllers: [CommunicationController],
  exports: [CommunicationIntegrationService],
})
export class CrmIntegrationsModule {}
