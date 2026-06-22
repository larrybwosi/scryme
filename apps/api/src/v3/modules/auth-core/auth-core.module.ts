import { Module, Global } from "@nestjs/common";
import { V3AuthCoreService } from "./infrastructure/services/v3-auth-core.service";
import { PrismaModule } from "../../../prisma/prisma.module";
import { RedisModule } from "../../../redis/redis.module";

@Global()
@Module({
  imports: [PrismaModule, RedisModule],
  providers: [V3AuthCoreService],
  exports: [V3AuthCoreService],
})
export class V3AuthCoreModule {}
