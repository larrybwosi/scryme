import { Module } from "@nestjs/common";
import { V3HealthController } from "./health.controller";

@Module({
  controllers: [V3HealthController],
})
export class V3HealthModule {}
