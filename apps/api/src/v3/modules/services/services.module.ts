import { Module } from "@nestjs/common";
import { ServicesController } from "./interfaces/http/services.controller";
import { PublicServicesController } from "./interfaces/http/public-services.controller";
import { ServiceManagementService } from "./application/services/service-management.service";
import { BookingService } from "./application/services/booking.service";
import { StaffSchedulingService } from "./application/services/staff-scheduling.service";
import { CalComService } from "./application/services/calcom.service";
import { ServiceAnalyticsService } from "./application/services/service-analytics.service";
import { OtpService } from "./application/services/otp.service";
import { InventoryMovementService } from "../inventory/application/services/inventory-movement.service";

@Module({
  controllers: [ServicesController, PublicServicesController],
  providers: [
    ServiceManagementService,
    BookingService,
    StaffSchedulingService,
    CalComService,
    ServiceAnalyticsService,
    OtpService,
    InventoryMovementService,
  ],
  exports: [ServiceManagementService, BookingService, StaffSchedulingService, CalComService, ServiceAnalyticsService, OtpService],
})
export class ServicesModule {}
