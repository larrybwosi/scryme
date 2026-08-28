import { Module } from "@nestjs/common";
import { AutomationController } from "./automation.controller";
import { AutomationService } from "./automation.service";
import { AutomationWorkerService } from "./automation-worker.service";
import { WebhookDispatcherService } from "./webhook-dispatcher.service";
import { WorkflowHandlers } from "./handlers/workflow-handlers";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [AutomationController],
  providers: [
    AutomationService,
    AutomationWorkerService,
    WebhookDispatcherService,
    WorkflowHandlers,
  ],
  exports: [
    AutomationService,
    AutomationWorkerService,
    WebhookDispatcherService,
  ],
})
export class AutomationModule {}
