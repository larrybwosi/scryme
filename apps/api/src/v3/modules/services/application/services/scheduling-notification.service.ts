import { Injectable, Logger } from "@nestjs/common";
import { BookingStatus } from "@repo/db";
import { ScrymeChatAction, ScrymeChatApiClient } from "@repo/chat";
import { notificationEngine } from "@repo/notifications";
import { PrismaService } from "@/prisma/prisma.service";

export type SchedulingNotificationKind =
  | "ASSIGNMENT"
  | "REMINDER"
  | "ESCALATION"
  | "CHANGE"
  | "CANCELLATION";

@Injectable()
export class SchedulingNotificationService {
  private readonly logger = new Logger(SchedulingNotificationService.name);
  private readonly scryme = new ScrymeChatApiClient();

  constructor(private readonly prisma: PrismaService) {}

  async send(organizationId: string, bookingId: string, kind: SchedulingNotificationKind) {
    const booking = await this.prisma.client.serviceBooking.findFirst({
      where: { id: bookingId, organizationId },
      include: {
        organization: { include: { scrymeConfiguration: true } },
        service: true,
        location: true,
        customer: true,
        staff: { include: { member: { include: { user: true } } } },
      },
    });
    if (!booking) return { skipped: "BOOKING_NOT_FOUND" };
    if (
      (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.NOSHOW) &&
      kind !== "CANCELLATION"
    ) return { skipped: "BOOKING_CLOSED" };

    const title: Record<SchedulingNotificationKind, string> = {
      ASSIGNMENT: "New booking assignment",
      REMINDER: "Upcoming booking reminder",
      ESCALATION: "Assignment needs attention",
      CHANGE: "Booking schedule changed",
      CANCELLATION: "Booking cancelled",
    };
    const when = new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    }).format(booking.scheduledStartTime);
    const content = `*${title[kind]}*\n\n${booking.serviceName}\n${when} UTC\n${booking.location?.name || "Location not set"}\nBooking: ${booking.id}`;
    const actions: ScrymeChatAction[] = kind === "CANCELLATION" ? [] : [
      ...(kind === "ASSIGNMENT" ? [
        { id: `booking_accept:${booking.id}:${booking.revision}`, label: "Accept", type: "button" as const, style: "primary" as const },
        { id: `booking_decline:${booking.id}:${booking.revision}`, label: "Decline", type: "button" as const, style: "danger" as const },
      ] : []),
      { id: `booking_view:${booking.id}:${booking.revision}`, label: "View", type: "button", style: "secondary" },
      ...(booking.status === BookingStatus.SCHEDULED ? [
        { id: `booking_start:${booking.id}:${booking.revision}`, label: "Start", type: "button" as const, style: "primary" as const },
      ] : []),
      ...(booking.status === BookingStatus.IN_PROGRESS ? [
        { id: `booking_complete:${booking.id}:${booking.revision}`, label: "Complete", type: "button" as const, style: "primary" as const },
      ] : []),
    ];

    try {
      await notificationEngine.notify({
        organizationId,
        templateName: `SERVICE_BOOKING_${kind}`,
        data: { bookingId, serviceName: booking.serviceName, startTime: booking.scheduledStartTime },
        recipients: { memberIds: booking.staff.map(item => item.memberId) },
      });
    } catch (error: any) {
      this.logger.warn(`Notification fallback failed: ${error.message}`);
    }

    const workspaceSlug = booking.organization.scrymeConfiguration?.workspaceSlug;
    if (!workspaceSlug || !booking.organization.scrymeConfiguration?.isActive) {
      return { delivered: "NOTIFICATION_ENGINE" };
    }

    const deliveries = await Promise.allSettled(
      booking.staff.map(async assignment => {
        const user = await this.scryme.findUserByEmail(workspaceSlug, assignment.member.user.email);
        if (!user) throw new Error(`Scryme user not found for ${assignment.member.user.email}`);
        const channel = await this.scryme.getDirectMessageChannel(workspaceSlug, user.id);
        const message = await this.scryme.sendMessage(workspaceSlug, channel.id, { content, actions });
        await this.prisma.client.scrymeMessage.create({
          data: {
            organizationId,
            workspaceSlug,
            channelSlug: channel.id,
            messageId: message.id,
            content,
            eventType: `BOOKING_${kind}`,
            relatedId: bookingId,
            metadata: { revision: booking.revision, memberId: assignment.memberId },
          },
        });
      }),
    );
    const failed = deliveries.filter(item => item.status === "rejected").length;
    if (failed === deliveries.length && deliveries.length) throw new Error("All Scryme deliveries failed");
    return { delivered: deliveries.length - failed, failed };
  }
}
