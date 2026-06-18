import { Module, Global, forwardRef } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { CartController } from "./interfaces/http/cart.controller";
import { CartUseCase } from "./application/use-cases/cart.use-case";
import { CartProcessor } from "./infrastructure/jobs/cart.processor";
import { PrismaModule } from "../../../prisma/prisma.module";

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: "cart-sync",
    }),
  ],
  controllers: [CartController],
  providers: [CartUseCase, CartProcessor],
  exports: [CartUseCase],
})
export class EcommerceCartModule {}
