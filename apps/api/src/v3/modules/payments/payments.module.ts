import {V3AuthModule} from "../auth/auth.module";
import {Module, Global, forwardRef} from "@nestjs/common";
import {PrismaModule} from "../../../prisma/prisma.module";
import {OrdersModule} from "../orders/orders.module";
import {PaymentsController} from "./interfaces/http/payments.controller";
import {CheckoutUseCase} from "./application/use-cases/checkout.use-case";

@Module({
  imports: [forwardRef(() => V3AuthModule), PrismaModule, OrdersModule],
  controllers: [PaymentsController],
  providers: [CheckoutUseCase],
  exports: [CheckoutUseCase],
})
export class PaymentsModule {}
