import { Module, Global } from "@nestjs/common";
import { MpesaService } from "@repo/shared/mpesa/server";

@Global()
@Module({
  providers: [MpesaService],
  exports: [MpesaService],
})
export class MpesaModule {}
