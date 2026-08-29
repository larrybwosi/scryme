import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "@/prisma/prisma.service";
import { StockMovementReportService } from "./stock-movement-report.service";

@Injectable()
export class StockMovementReportScheduler {
  private readonly logger = new Logger(StockMovementReportScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stockReportService: StockMovementReportService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyCheck() {
    this.logger.log("Checking for scheduled stock movement reports...");

    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Find all active definitions for stock_movement_report
    const activeDefinitions = await this.prisma.client.workflowEngineDefinition.findMany({
      where: {
        key: "f/dealio/stock_movement_report",
        isActive: true,
      },
    });

    for (const definition of activeDefinitions) {
      try {
        const settings = (definition.config as any) || {};
        const scheduleDay = settings.scheduleDay ?? 0; // Default to Sunday

        if (scheduleDay === today) {
          const recipients = settings.recipients || [];
          if (recipients.length > 0) {
            this.logger.log(`Triggering scheduled report for org ${definition.organizationId}`);
            // Fire and forget so one failing report doesn't block others
            this.stockReportService.generateAndSendReport(definition.organizationId, recipients, 7)
              .catch(err => this.logger.error(`Error in scheduled report for org ${definition.organizationId}: ${err.message}`));
          }
        }
      } catch (error) {
        this.logger.error(`Failed to process scheduled report for workflow ${definition.id}: ${error.message}`);
      }
    }
  }
}
