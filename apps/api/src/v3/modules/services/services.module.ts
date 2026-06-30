import { Module } from "@nestjs/common";
import { ServicesController } from "./interfaces/http/services.controller";
import { PublicServicesController } from "./interfaces/http/public-services.controller";
import { ServiceManagementService } from "./application/services/service-management.service";
import { BookingService } from "./application/services/booking.service";
import { OtpService } from "./application/services/otp.service";
import { InventoryMovementService } from "../inventory/application/services/inventory-movement.service";

@Module({
  controllers: [ServicesController, PublicServicesController],
  providers: [
    ServiceManagementService,
    BookingService,
    OtpService,
    InventoryMovementService,
  ],
  exports: [ServiceManagementService, BookingService, OtpService],
})
export class ServicesModule {}
