import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { BookingAssignmentStatus, BookingStatus } from "@repo/db";
import { Job } from "bullmq";
import { PrismaService } from "@/prisma/prisma.service";
import { SchedulingNotificationService, SchedulingNotificationKind } from "../../application/services/scheduling-notification.service";
import { SCHEDULING_QUEUE } from "./scheduling-queue.service";

interface SchedulingJob {
  organizationId: string;
  bookingId: string;
  revision: number;
  kind: SchedulingNotificationKind;
}

@Processor(SCHEDULING_QUEUE)
export class SchedulingProcessor extends WorkerHost {
  private readonly logger = new Logger(SchedulingProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: SchedulingNotificationService,
  ) { super(); }

  async process(job: Job<SchedulingJob>) {
    const { organizationId, bookingId, revision, kind } = job.data;
    const booking = await this.prisma.client.serviceBooking.findFirst({
      where: { id: bookingId, organizationId },
      include: { staff: true },
    });
    if (!booking || booking.revision !== revision) return { skipped: "STALE_REVISION" };
    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.NOSHOW) {
      return { skipped: "BOOKING_CLOSED" };
    }
    if (kind === "ESCALATION" && !booking.staff.some(item => item.status === BookingAssignmentStatus.PENDING)) {
      return { skipped: "ASSIGNMENT_RESPONDED" };
    }
    const eventType = `NOTIFICATION_${kind}_R${revision}`;
    const sent = await this.prisma.client.bookingEvent.findFirst({
      where: { bookingId, organizationId, type: eventType },
    });
    if (sent) return { skipped: "ALREADY_SENT" };

    const result = await this.notifications.send(organizationId, bookingId, kind);
    await this.prisma.client.bookingEvent.create({
      data: { organizationId, bookingId, source: "SYSTEM", type: eventType, metadata: { jobId: job.id } },
    });
    this.logger.log(`Processed ${kind} for booking ${bookingId}`);
    return result;
  }
}
