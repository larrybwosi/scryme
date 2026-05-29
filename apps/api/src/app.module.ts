import { Module, MiddlewareConsumer, RequestMethod, NestModule } from '@nestjs/common';
import { APP_GUARD, RouterModule } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusDriver, MercuriusDriverConfig } from '@nestjs/mercurius';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { V2Module } from './v2/v2.module';
import { V3Module } from './v3/v3.module';
import { UploadModule } from './common/upload/upload.module';
import { WindmillModule } from './common/Windmill/WindmillModule';
import { ZitadelModule } from './zitadel/zitadel.module';
import { MpesaModule } from './common/mpesa.module';
import { V2AuthGuard } from './auth/v2-auth.guard';
import { AuthorizationGuard } from './common/guards/authorization.guard';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    GraphQLModule.forRoot<MercuriusDriverConfig>({
      driver: MercuriusDriver,
      autoSchemaFile: true,
      graphiql: true,
      path: '/graphql',
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    V2Module,
    V3Module,
    UploadModule,
    WindmillModule,
    ZitadelModule,
    MpesaModule,
    RouterModule.register([
      {
        path: 'v2',
        module: V2Module,
      },
      {
        path: 'v3',
        module: V3Module,
      },
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
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
    consumer.apply(CorrelationIdMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
