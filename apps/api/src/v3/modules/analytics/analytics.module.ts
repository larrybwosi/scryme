import { Module } from "@nestjs/common";
import { AnalyticsController } from "./interfaces/http/analytics.controller";
import { ServicesModule } from "../services/services.module";

@Module({
  imports: [ServicesModule],
  controllers: [AnalyticsController],
  providers: [],
})
export class AnalyticsModule {}
