import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "@/prisma/prisma.service";
import { ReportsService } from "./reports.service";
import { toZonedTime } from "date-fns-tz";

@Injectable()
export class ReportsScheduler {
  private readonly logger = new Logger(ReportsScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reportsService: ReportsService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlyScheduledReportsCheck() {
    this.logger.log("Checking scheduled report triggers across organizations...");

    const now = new Date();

    const activeSettings = await this.prisma.client.reportSettings.findMany({
      where: {
        scheduleEnabled: true,
      },
    });

    for (const settings of activeSettings) {
      try {
        const timeZone = settings.timezone || "UTC";
        const zonedDate = toZonedTime(now, timeZone);
        const currentDayOfWeek = zonedDate.getDay();
        const currentHour = zonedDate.getHours();

        const targetHour = parseInt((settings.timeOfDay || "08:00").split(":")[0], 10);

        let shouldTrigger = false;

        if (settings.frequency === "DAILY") {
          if (currentHour === targetHour) {
            shouldTrigger = true;
          }
        } else if (settings.frequency === "WEEKLY") {
          if (settings.dayOfWeek === currentDayOfWeek && currentHour === targetHour) {
            shouldTrigger = true;
          }
        } else if (settings.frequency === "MONTHLY") {
          const dayOfMonth = zonedDate.getDate();
          if (dayOfMonth === 1 && currentHour === targetHour) {
            shouldTrigger = true;
          }
        }

        if (shouldTrigger) {
          this.logger.log(`Triggering automated ${settings.frequency} report for org ${settings.organizationId} (TZ: ${timeZone})`);

          const days = settings.frequency === "DAILY" ? 1 : settings.frequency === "MONTHLY" ? 30 : 7;

          this.reportsService.generateAndDispatchReport(
            settings.organizationId,
            { days, sendEmail: settings.emailEnabled, sendScryme: settings.scrymeEnabled },
          ).catch(err => this.logger.error(`Error in scheduled report execution for org ${settings.organizationId}: ${err.message}`));
        }
      } catch (error: any) {
        this.logger.error(`Failed during scheduled report check for org ${settings.organizationId}: ${error.message}`);
      }
    }
  }
}
