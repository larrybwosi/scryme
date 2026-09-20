import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "@/prisma/prisma.service";
import { ProductionReportService } from "./production-report.service";
import { toZonedTime } from "date-fns-tz";

@Injectable()
export class ProductionReportScheduler {
  private readonly logger = new Logger(ProductionReportScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly productionReportService: ProductionReportService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlyCheck() {
    this.logger.log("Checking for scheduled production reports...");

    const now = new Date();

    const allSettings = await this.prisma.client.bakerySettings.findMany({
      where: {
        scrymeReportEnabled: true,
      },
    });

    for (const settings of allSettings) {
      try {
        const zonedDate = toZonedTime(now, settings.timezone || "UTC");
        const currentDay = zonedDate.getDay();
        const currentHour = zonedDate.getHours();

        const [reportHour] = settings.scrymeReportTime.split(":").map(Number);

        if (settings.scrymeReportDay === currentDay && reportHour === currentHour) {
          this.logger.log(`Triggering weekly production report for org ${settings.organizationId} (TZ: ${settings.timezone})`);

          this.productionReportService.generateAndSendReport(settings.organizationId, 7)
            .catch(err => this.logger.error(`Error in scheduled production report for org ${settings.organizationId}: ${err.message}`));
        }
      } catch (error) {
        this.logger.error(`Failed to process scheduled report for organization ${settings.organizationId}: ${error.message}`);
      }
    }
  }
}
