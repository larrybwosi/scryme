import { Module } from "@nestjs/common";
import { RealtimeController } from "./realtime.controller";
import { RealtimeGateway } from "./realtime.gateway";
import { RealtimeRedisService } from "./realtime-redis.service";
import { RedisModule } from "../../redis/redis.module";

@Module({
  imports: [RedisModule],
  controllers: [RealtimeController],
  providers: [RealtimeGateway, RealtimeRedisService],
  exports: [RealtimeGateway, RealtimeRedisService],
})
export class RealtimeModule {}
