import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { MpesaController } from "./mpesa/mpesa.controller";

@Module({
  controllers: [PaymentsController, MpesaController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
