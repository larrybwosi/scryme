import {
  Module,
  MiddlewareConsumer,
  RequestMethod,
  NestModule,
} from "@nestjs/common";
import { APP_GUARD, RouterModule } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";
import { GraphQLModule } from "@nestjs/graphql";
import { MercuriusDriver, MercuriusDriverConfig } from "@nestjs/mercurius";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { V2Module, V2_SUB_MODULES } from "./v2/v2.module";
import { V3Module, V3_SUB_MODULES } from "./v3/v3.module";

import { UploadModule } from "./common/upload/upload.module";
import { ImageModule } from "./common/images/image.module";
import { WindmillModule } from "./common/Windmill/WindmillModule";
import { ZitadelModule } from "./zitadel/zitadel.module";
import { MpesaModule } from "./common/mpesa.module";
import { CommonModule } from "./common/common.module";
import { V2AuthGuard } from "./auth/v2-auth.guard";
import { AuthorizationGuard } from "./common/guards/authorization.guard";
import { CorrelationIdMiddleware } from "./common/middleware/correlation-id.middleware";
import { BullModule } from "@nestjs/bullmq";
import { ScheduleModule } from "@nestjs/schedule";
import { env } from "@repo/env";

// High demand resilience & multi-tenancy throttling imports
import { RedisService } from "./redis/redis.service";
import { RedisThrottlerStorage } from "./common/throttling/redis-throttler-storage";
import { MultiTenantThrottlerGuard } from "./common/throttling/multi-tenant-throttler.guard";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
      },
    }),
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [RedisService],
      useFactory: (redis: RedisService) => ({
        throttlers: [
          {
            ttl: 60000,
            limit: 100,
          },
        ],
        storage: new RedisThrottlerStorage(redis),
      }),
    }),
    GraphQLModule.forRoot<MercuriusDriverConfig>({
      driver: MercuriusDriver,
      autoSchemaFile: true,
      graphiql: true,
      path: "/graphql",
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    V2Module,
    V3Module,
    UploadModule,
    ImageModule,
    WindmillModule,
    ZitadelModule,
    MpesaModule,
    CommonModule,
    RouterModule.register([
      {
        path: "v2",
        module: V2Module,
        children: [
          ...V2_SUB_MODULES.map(m => ({ path: "/", module: m })),
          { path: "/", module: UploadModule },
        ],
      },
      {
        path: "v3",
        module: V3Module,
        children: V3_SUB_MODULES.map(m => ({ path: "/", module: m })),
      },
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: MultiTenantThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: V2AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AuthorizationGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware)
      .forRoutes({ path: "*", method: RequestMethod.ALL });
  }
}
