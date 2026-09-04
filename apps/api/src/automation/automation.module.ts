import { Module, forwardRef } from "@nestjs/common";
import { AutomationController } from "./automation.controller";
import { AutomationService } from "./automation.service";
import { AutomationWorkerService } from "./automation-worker.service";
import { WebhookDispatcherService } from "./webhook-dispatcher.service";
import { WorkflowHandlers } from "./handlers/workflow-handlers";
import { PrismaModule } from "../prisma/prisma.module";
import { ServicesModule } from "../v3/modules/services/services.module";

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => ServicesModule),
  ],
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
