import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { BookingStatus } from "@repo/db";
import { PrismaService } from "@/prisma/prisma.service";
import { SchedulingQueueService } from "./scheduling-queue.service";

@Injectable()
export class SchedulingReconcilerService {
  private readonly logger = new Logger(SchedulingReconcilerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly schedulingQueue: SchedulingQueueService,
  ) {}

  @Cron("0 */15 * * * *")
  async reconcile() {
    const from = new Date(Date.now() - 5 * 60_000);
    const to = new Date(Date.now() + 25 * 60 * 60_000);
    const bookings = await this.prisma.client.serviceBooking.findMany({
      where: {
        status: { in: [BookingStatus.REQUESTED, BookingStatus.SCHEDULED] },
        scheduledStartTime: { gte: from, lte: to },
      },
      select: { id: true, organizationId: true },
      take: 500,
    });
    await Promise.all(bookings.map(item =>
      this.schedulingQueue.scheduleBooking(item.organizationId, item.id),
    ));
    if (bookings.length) this.logger.log(`Reconciled ${bookings.length} booking schedules`);
  }
}
