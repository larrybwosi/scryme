import { Module, Global, forwardRef } from "@nestjs/common";
import { PrismaModule } from "../../../prisma/prisma.module";
import { OrdersModule } from "../orders/orders.module";
import { WebhooksModule } from "../webhooks/webhooks.module";
import { PaymentsController } from "./interfaces/http/payments.controller";
import { CheckoutUseCase } from "./application/use-cases/checkout.use-case";

@Module({
  imports: [WebhooksModule],
  controllers: [PaymentsController],
  providers: [CheckoutUseCase],
  exports: [CheckoutUseCase],
})
export class PaymentsModule {}
