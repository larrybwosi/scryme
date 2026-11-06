import { BookingLifecycleController } from "./interfaces/http/booking-lifecycle.controller";
import { BookingLifecycleService } from "./application/services/booking-lifecycle.service";
import { BookingConflictDetectionService } from "./application/services/booking-conflict-detection.service";
import { BookingTaskGeneratorService } from "./application/services/booking-task-generator.service";
import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ServicesController } from "./interfaces/http/services.controller";
import { PublicServicesController } from "./interfaces/http/public-services.controller";
import { ServiceManagementService } from "./application/services/service-management.service";
import { BookingService } from "./application/services/booking.service";
import { StaffSchedulingService } from "./application/services/staff-scheduling.service";
import { CalComService } from "./application/services/calcom.service";
import { ServiceAnalyticsService } from "./application/services/service-analytics.service";
import { OtpService } from "./application/services/otp.service";
import { InventoryMovementService } from "../inventory/application/services/inventory-movement.service";
import { SchedulingNotificationService } from "./application/services/scheduling-notification.service";
import { SchedulingProcessor } from "./infrastructure/jobs/scheduling.processor";
import { BookingConflictService } from "./application/services/booking-conflict.service";
import { BookingTaskIntegrationService } from "./application/services/booking-task-integration.service";
import { SchedulingQueueService, SCHEDULING_QUEUE } from "./infrastructure/jobs/scheduling-queue.service";
import { SchedulingReconcilerService } from "./infrastructure/jobs/scheduling-reconciler.service";

@Module({
  imports: [BullModule.registerQueue({ name: SCHEDULING_QUEUE })],
  controllers: [ServicesController, PublicServicesController, BookingLifecycleController],
  providers: [
    ServiceManagementService,
    BookingService,
    StaffSchedulingService,
    CalComService,
    ServiceAnalyticsService,
    OtpService,
    InventoryMovementService,
    SchedulingNotificationService,
    SchedulingQueueService,
    SchedulingProcessor,
    SchedulingReconcilerService,
    BookingConflictService,
    BookingTaskIntegrationService,
    BookingLifecycleService,
    BookingConflictDetectionService,
    BookingTaskGeneratorService,
  ],
  exports: [ServiceManagementService, BookingService, StaffSchedulingService, CalComService, ServiceAnalyticsService, OtpService, SchedulingQueueService, BookingLifecycleService, BookingConflictDetectionService, BookingTaskGeneratorService, ],
})
export class ServicesModule {}
