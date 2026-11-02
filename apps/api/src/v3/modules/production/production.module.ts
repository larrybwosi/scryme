import { forwardRef } from "@nestjs/common";
import { CrmIntegrationsModule } from "../crm-integrations/crm-integrations.module";
import { CommonModule } from "../../../common/common.module";
import { TasksModule } from "../tasks/tasks.module";
import { ProductionProjectionService } from "./application/services/production-projection.service";
import { Module } from "@nestjs/common";
import { ProductionController } from "./interfaces/http/production.controller";
import { ProductionService } from "./application/services/production.service";
import { ProductionReportService } from "./reports/production-report.service";
import { ProductionReportScheduler } from "./reports/production-report.scheduler";
import { AuthModule } from "../../../auth/auth.module";
import { ScrymeModule } from "../scryme/scryme.module";
import { MembersModule } from "../members/members.module";
import { UnitsModule } from "../units/units.module";

@Module({
  imports: [AuthModule, ScrymeModule, MembersModule, UnitsModule, forwardRef(() => CrmIntegrationsModule), CommonModule, TasksModule],
  controllers: [ProductionController],
  providers: [ProductionService, ProductionProjectionService, ProductionReportService, ProductionReportScheduler],
  exports: [ProductionService, ProductionProjectionService, ProductionReportService],
})
export class ProductionModule {}
