import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { ScrymeModule } from "@/v3/modules/scryme/scryme.module";
import { ReportsService } from "./application/services/reports.service";
import { AiReportService } from "./application/services/ai-report.service";
import { ReportsScheduler } from "./application/services/reports.scheduler";
import { ReportsController } from "./interfaces/reports.controller";

@Module({
  imports: [PrismaModule, ScrymeModule],
  controllers: [ReportsController],
  providers: [ReportsService, AiReportService, ReportsScheduler],
  exports: [ReportsService, AiReportService],
})
export class ReportsModule {}
