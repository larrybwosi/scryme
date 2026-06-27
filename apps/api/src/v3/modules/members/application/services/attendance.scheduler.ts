import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "@/prisma/prisma.service";
import { AttendanceUseCase } from "../use-cases/attendance.use-case";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

@Injectable()
export class AttendanceScheduler {
  private readonly logger = new Logger(AttendanceScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly attendanceUseCase: AttendanceUseCase,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleAutoCheckout() {
    this.logger.log("Checking for members to auto-checkout...");

    // 1. Get all organizations that have active check-ins
    const activeOrgIds = await this.prisma.client.attendanceLog.findMany({
      where: { checkOutTime: null },
      distinct: ["organizationId"],
      select: { organizationId: true },
    });

    if (!activeOrgIds || activeOrgIds.length === 0) return;

    // 2. Get settings only for these organizations
    const orgs = await this.prisma.client.organization.findMany({
      where: { id: { in: activeOrgIds.map(o => o.organizationId) } },
      select: {
        id: true,
        settings: {
          select: {
            enableAutoCheckout: true,
            autoCheckoutTime: true,
            defaultTimezone: true,
          },
        },
      },
    });

    for (const org of orgs) {
      try {
        const settings = org.settings;
        const timezone = settings?.defaultTimezone || "UTC";
        const now = new Date();
        const zonedNow = toZonedTime(now, timezone);
        const currentTimeStr = format(zonedNow, "HH:mm");

        let shouldCheckout = false;
        const autoCheckoutTime = settings?.autoCheckoutTime || "00:00"; // Default to midnight

        // If auto-checkout is NOT explicitly enabled, we only auto-checkout at midnight
        if (!settings?.enableAutoCheckout) {
          // Check if we are within 5 minutes of midnight
          if (currentTimeStr >= "00:00" && currentTimeStr < "00:05") {
            shouldCheckout = true;
          }
        } else {
          // If enabled, we checkout at the configured time
          // Check if we are within 5 minutes of the configured time
          if (
            currentTimeStr >= autoCheckoutTime &&
            currentTimeStr < this.addMinutes(autoCheckoutTime, 5)
          ) {
            shouldCheckout = true;
          }
        }

        if (shouldCheckout) {
          await this.processAutoCheckoutForOrg(org.id);
        }
      } catch (error) {
        this.logger.error(
          `Error processing auto-checkout for org ${org.id}: ${error.message}`,
        );
      }
    }
  }

  private addMinutes(timeStr: string, mins: number): string {
    const [h, m] = timeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(h, m + mins);
    return format(date, "HH:mm");
  }

  private async processAutoCheckoutForOrg(organizationId: string) {
    const activeLogs = await this.prisma.client.attendanceLog.findMany({
      where: {
        organizationId,
        checkOutTime: null,
      },
      select: {
        id: true,
        memberId: true,
      },
    });

    if (activeLogs.length === 0) return;

    this.logger.log(
      `Auto-checking out ${activeLogs.length} members for org ${organizationId}`,
    );

    for (const log of activeLogs) {
      try {
        await this.attendanceUseCase.checkOut(organizationId, log.memberId, {
          notes: "Auto-checkout by system",
          isAutoCheckout: true,
        });
      } catch (error) {
        this.logger.error(
          `Failed to auto-checkout member ${log.memberId} in org ${organizationId}: ${error.message}`,
        );
      }
    }
  }
}
