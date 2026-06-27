import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "@/prisma/prisma.service";
import { BakeryReportService } from "./bakery-report.service";
import { toZonedTime } from "date-fns-tz";

@Injectable()
export class BakeryReportScheduler {
  private readonly logger = new Logger(BakeryReportScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bakeryReportService: BakeryReportService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlyCheck() {
    this.logger.log("Checking for scheduled bakery production reports...");

    const now = new Date();

    // Find all bakery settings where scryme reports are enabled
    const allBakerySettings = await this.prisma.client.bakerySettings.findMany({
      where: {
        scrymeReportEnabled: true,
      },
    });

    for (const settings of allBakerySettings) {
      try {
        // Convert current UTC time to organization's timezone
        const zonedDate = toZonedTime(now, settings.timezone || "UTC");
        const currentDay = zonedDate.getDay();
        const currentHour = zonedDate.getHours();

        const [reportHour] = settings.scrymeReportTime.split(":").map(Number);

        if (
          settings.scrymeReportDay === currentDay &&
          reportHour === currentHour
        ) {
          this.logger.log(
            `Triggering weekly bakery report for org ${settings.organizationId} (TZ: ${settings.timezone})`,
          );

          // Fire and forget
          this.bakeryReportService
            .generateAndSendReport(settings.organizationId, 7)
            .catch(err =>
              this.logger.error(
                `Error in scheduled bakery report for org ${settings.organizationId}: ${err.message}`,
              ),
            );
        }
      } catch (error) {
        this.logger.error(
          `Failed to process scheduled report for organization ${settings.organizationId}: ${error.message}`,
        );
      }
    }
  }
}
