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

    // Find all active organizations with the stock_movement_report workflow provisioned
    const activeWorkflows = await this.prisma.client.windmillWorkflow.findMany({
      where: {
        path: "f/dealio/stock_movement_report",
        isActive: true,
      },
    });

    for (const workflow of activeWorkflows) {
      try {
        const settings = workflow.settings as any;
        const scheduleDay = settings.scheduleDay ?? 0; // Default to Sunday

        if (scheduleDay === today) {
          const recipients = settings.recipients || [];
          if (recipients.length > 0) {
            this.logger.log(`Triggering scheduled report for org ${workflow.organizationId}`);
            // Fire and forget so one failing report doesn't block others
            this.stockReportService.generateAndSendReport(workflow.organizationId, recipients, 7)
              .catch(err => this.logger.error(`Error in scheduled report for org ${workflow.organizationId}: ${err.message}`));
          }
        }
      } catch (error) {
        this.logger.error(`Failed to process scheduled report for workflow ${workflow.id}: ${error.message}`);
      }
    }
  }
}
