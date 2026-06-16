import { V3AuthModule } from "../auth/auth.module";
import { Module, Global, forwardRef } from "@nestjs/common";
import { CommunicationIntegrationService } from "./application/use-cases/communication-integration.service";
import { CommunicationController } from "./interfaces/http/communication.controller";
import { SlackProvider } from "./infrastructure/providers/slack.provider";
import { PrismaModule } from "@/prisma/prisma.module";

@Module({
  imports: [forwardRef(() => V3AuthModule), PrismaModule],
  providers: [CommunicationIntegrationService, SlackProvider],
  controllers: [CommunicationController],
  exports: [CommunicationIntegrationService],
})
export class CrmIntegrationsModule {}
