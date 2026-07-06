import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { BookingStatus } from "@repo/db";

@Injectable()
export class ServiceAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getResourceUtilization(orgId: string, startDate: Date, endDate: Date) {
    const bookings = await this.prisma.client.serviceBooking.findMany({
      where: {
        organizationId: orgId,
        scheduledStartTime: { gte: startDate, lte: endDate },
        status: { not: BookingStatus.CANCELLED }
      },
      include: { resources: true, service: true }
    });

    const totalMinutes = (endDate.getTime() - startDate.getTime()) / 60000;
    const utilization: Record<string, { name: string, occupiedMinutes: number, rate: number }> = {};

    bookings.forEach(booking => {
        const duration = (booking.scheduledEndTime?.getTime() || booking.scheduledStartTime.getTime()) - booking.scheduledStartTime.getTime();
        const minutes = duration / 60000;

        booking.resources.forEach(r => {
            if (!utilization[r.resourceId]) {
                utilization[r.resourceId] = { name: r.resourceId, occupiedMinutes: 0, rate: 0 };
            }
            utilization[r.resourceId].occupiedMinutes += minutes;
        });
    });

    Object.keys(utilization).forEach(id => {
        utilization[id].rate = utilization[id].occupiedMinutes / totalMinutes;
    });

    return utilization;
  }

  async getStaffPerformance(orgId: string, startDate: Date, endDate: Date) {
      const bookings = await this.prisma.client.serviceBooking.findMany({
          where: {
              organizationId: orgId,
              actualEndTime: { gte: startDate, lte: endDate },
              status: BookingStatus.COMPLETED
          },
          include: { staff: true, service: true }
      });

      const performance: Record<string, { bookingCount: number, totalRevenue: number }> = {};

      bookings.forEach(booking => {
          booking.staff.forEach(s => {
              if (!performance[s.memberId]) {
                  performance[s.memberId] = { bookingCount: 0, totalRevenue: 0 };
              }
              performance[s.memberId].bookingCount += 1;
              performance[s.memberId].totalRevenue += Number(booking.price);
          });
      });

      return performance;
  }

  async getBookingConversionFunnel(orgId: string, startDate: Date, endDate: Date) {
      const bookings = await this.prisma.client.serviceBooking.findMany({
          where: {
              organizationId: orgId,
              createdAt: { gte: startDate, lte: endDate }
          }
      });

      const funnel = {
          requested: bookings.length,
          scheduled: bookings.filter(b => b.status !== BookingStatus.REQUESTED && b.status !== BookingStatus.CANCELLED).length,
          completed: bookings.filter(b => b.status === BookingStatus.COMPLETED).length,
          cancelled: bookings.filter(b => b.status === BookingStatus.CANCELLED).length,
      };

      return {
          stages: [
              { name: 'Total Requests', count: funnel.requested, percentage: 100 },
              { name: 'Scheduled', count: funnel.scheduled, percentage: funnel.requested > 0 ? (funnel.scheduled / funnel.requested) * 100 : 0 },
              { name: 'Completed', count: funnel.completed, percentage: funnel.scheduled > 0 ? (funnel.completed / funnel.scheduled) * 100 : 0 },
          ],
          cancellations: funnel.cancelled
      };
  }
}
