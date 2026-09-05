import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";
import { PrismaService } from "@/prisma/prisma.service";

export const SCHEDULING_QUEUE = "service-scheduling";

@Injectable()
export class SchedulingQueueService {
  constructor(
    @InjectQueue(SCHEDULING_QUEUE) private readonly queue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  async scheduleBooking(organizationId: string, bookingId: string) {
    const booking = await this.prisma.client.serviceBooking.findFirst({
      where: { id: bookingId, organizationId },
      include: { organization: { include: { settings: true } } },
    });
    if (!booking) return;
    await this.cancelBookingJobs(bookingId);

    const now = Date.now();
    const revision = booking.revision;
    const jobs = [
      { name: "assignment", dueAt: now, kind: "ASSIGNMENT" },
      ...(booking.organization.settings?.bookingReminderMinutes || [1440, 120]).map(minutes => ({
        name: `reminder-${minutes}`,
        dueAt: booking.scheduledStartTime.getTime() - minutes * 60_000,
        kind: "REMINDER",
      })),
      {
        name: "assignment-escalation",
        dueAt: now + (booking.organization.settings?.bookingAssignmentTimeoutMinutes || 30) * 60_000,
        kind: "ESCALATION",
      },
    ].filter(item => item.dueAt >= now - 60_000);

    await Promise.all(jobs.map(item => this.queue.add(item.name, {
      organizationId,
      bookingId,
      revision,
      kind: item.kind,
    }, {
      jobId: `booking-${bookingId}-r${revision}-${item.name}`,
      delay: Math.max(0, item.dueAt - now),
      attempts: 5,
      backoff: { type: "exponential", delay: 30_000 },
      removeOnComplete: 500,
      removeOnFail: 1000,
    })));
  }

  async cancelBookingJobs(bookingId: string) {
    const jobs = await this.queue.getJobs(["delayed", "waiting", "paused"]);
    await Promise.all(jobs.filter(job => job.data.bookingId === bookingId).map(job => job.remove()));
  }
}
