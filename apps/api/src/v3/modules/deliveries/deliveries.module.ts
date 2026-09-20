import { Module } from "@nestjs/common";
import { DeliveriesController } from "./interfaces/http/deliveries.controller";
import { DeliveriesService } from "./application/services/deliveries.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [DeliveriesController],
  providers: [DeliveriesService],
  exports: [DeliveriesService],
})
export class DeliveriesModule {}
