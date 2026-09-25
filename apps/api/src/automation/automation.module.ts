import { Module, forwardRef } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { AutomationController } from "./automation.controller";
import { AutomationService } from "./automation.service";
import { AutomationWorkerService } from "./automation-worker.service";
import { AutomationScheduler } from "./automation.scheduler";
import { WebhookDispatcherService } from "./webhook-dispatcher.service";
import { WorkflowHandlers } from "./handlers/workflow-handlers";
import { PrismaModule } from "../prisma/prisma.module";
import { ServicesModule } from "../v3/modules/services/services.module";

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(),
    forwardRef(() => ServicesModule),
  ],
  controllers: [AutomationController],
  providers: [
    AutomationService,
    AutomationWorkerService,
    AutomationScheduler,
    WebhookDispatcherService,
    WorkflowHandlers,
  ],
  exports: [
    AutomationService,
    AutomationWorkerService,
    AutomationScheduler,
    WebhookDispatcherService,
  ],
})
export class AutomationModule {}
