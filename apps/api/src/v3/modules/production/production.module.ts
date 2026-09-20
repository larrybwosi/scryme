import { Module } from "@nestjs/common";
import { ProductionController } from "./interfaces/http/production.controller";
import { ProductionService } from "./application/services/production.service";
import { BakeryReportService } from "@/v2/bakery/reports/bakery-report.service";
import { AuthModule } from "../../../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [ProductionController],
  providers: [ProductionService, BakeryReportService],
  exports: [ProductionService],
})
export class ProductionModule {}
