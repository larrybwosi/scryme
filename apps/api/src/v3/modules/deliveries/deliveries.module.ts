import { Module } from "@nestjs/common";
import { DeliveriesController } from "./interfaces/http/deliveries.controller";
import { DeliveriesService } from "./application/services/deliveries.service";
import { V3AuthModule } from "../auth/auth.module";
import { WebhooksModule } from "../webhooks/webhooks.module";

@Module({
  imports: [V3AuthModule, WebhooksModule],
  controllers: [DeliveriesController],
  providers: [DeliveriesService],
  exports: [DeliveriesService],
})
export class DeliveriesModule {}
