import { Module } from "@nestjs/common";
import { SalesController } from "./interfaces/http/sales.controller";
import { SalesService } from "./application/services/sales.service";

@Module({
  imports: [],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
