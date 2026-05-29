import { V3AuthModule } from '../auth/auth.module';
import { Module, Global, forwardRef } from '@nestjs/common';
import { OrderController } from './interfaces/http/order.controller';
import { OrderResolver } from './interfaces/graphql/order.resolver';
import { GetOrdersUseCase } from './application/use-cases/get-orders.use-case';
import { CreateOrderUseCase } from './application/use-cases/create-order.use-case';
import { UpdateOrderStatusUseCase } from './application/use-cases/update-order-status.use-case';
import { RequestB2BQuoteUseCase } from './application/use-cases/request-b2b-quote.use-case';
import { ConvertQuoteToOrderUseCase } from './application/use-cases/convert-quote-to-order.use-case';
import { PrismaOrderRepository } from './infrastructure/persistence/prisma-order.repository';
import { IOrderRepository } from './domain/repositories/order-repository.interface';
import { PrismaModule } from '../../../prisma/prisma.module';
import { RedisModule } from '../../../redis/redis.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { CatalogModule } from '../catalog/catalog.module';
import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [forwardRef(() => V3AuthModule),
    PrismaModule,
    RedisModule,
    WebhooksModule,
    LoyaltyModule,
    CatalogModule,
    forwardRef(() => FinanceModule)
  ],
  controllers: [OrderController],
  providers: [
    OrderResolver,
    GetOrdersUseCase,
    CreateOrderUseCase,
    UpdateOrderStatusUseCase,
    RequestB2BQuoteUseCase,
    ConvertQuoteToOrderUseCase,
    {
      provide: IOrderRepository,
      useClass: PrismaOrderRepository,
    },
  ],
  exports: [IOrderRepository, CreateOrderUseCase, GetOrdersUseCase, UpdateOrderStatusUseCase, ConvertQuoteToOrderUseCase, RequestB2BQuoteUseCase],
})
export class OrdersModule {}
