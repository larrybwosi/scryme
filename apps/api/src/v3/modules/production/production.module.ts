import { Module } from "@nestjs/common";
import { ProductionController } from "./interfaces/http/production.controller";
import { ProductionService } from "./application/services/production.service";
import { ProductionReportService } from "./reports/production-report.service";
import { ProductionReportScheduler } from "./reports/production-report.scheduler";
import { AuthModule } from "../../../auth/auth.module";
import { ScrymeModule } from "@/v2/scryme/scryme.module";
import { MembersModule } from "../members/members.module";

@Module({
  imports: [AuthModule, ScrymeModule, MembersModule],
  controllers: [ProductionController],
  providers: [ProductionService, ProductionReportService, ProductionReportScheduler],
  exports: [ProductionService, ProductionReportService],
})
export class ProductionModule {}
