import { Module } from "@nestjs/common";
import { BakeryController } from "./bakery.controller";
import { BakeryAuthController } from "./bakery-auth.controller";
import { BakeryService } from "./bakery.service";
import { AuthModule } from "../../auth/auth.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { BakeryReportService } from "./reports/bakery-report.service";
import { ScrymeModule } from "../scryme/scryme.module";
import { BakeryReportScheduler } from "./reports/bakery-report.scheduler";

@Module({
  imports: [AuthModule, PrismaModule, ScrymeModule],
  controllers: [BakeryController, BakeryAuthController],
  providers: [BakeryService, BakeryReportService, BakeryReportScheduler],
  exports: [BakeryService, BakeryReportService],
})
export class BakeryModule {}
