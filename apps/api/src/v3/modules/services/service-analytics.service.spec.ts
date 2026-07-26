import { Test, TestingModule } from '@nestjs/testing';
import { ServiceAnalyticsService } from './application/services/service-analytics.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BookingStatus } from '@repo/db';
import { Decimal } from 'decimal.js';

describe('ServiceAnalyticsService', () => {
  let service: ServiceAnalyticsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceAnalyticsService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              serviceBooking: {
                findMany: vi.fn(),
                groupBy: vi.fn(),
              },
            },
          },
        },
      ],
    }).compile();

    service = module.get<ServiceAnalyticsService>(ServiceAnalyticsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getResourceUtilization', () => {
    it('should calculate resource utilization without fetching service relation', async () => {
      const mockBookings = [
        {
          id: 'booking-1',
          scheduledStartTime: new Date('2026-07-21T10:00:00Z'),
          scheduledEndTime: new Date('2026-07-21T11:00:00Z'),
          resources: [{ resourceId: 'room-1' }],
        },
        {
          id: 'booking-2',
          scheduledStartTime: new Date('2026-07-21T11:30:00Z'),
          scheduledEndTime: new Date('2026-07-21T12:00:00Z'),
          resources: [{ resourceId: 'room-1' }],
        },
      ];

      vi.spyOn(prisma.client.serviceBooking, 'findMany').mockResolvedValue(mockBookings as any);

      const startDate = new Date('2026-07-21T09:00:00Z');
      const endDate = new Date('2026-07-21T13:00:00Z');

      const result = await service.getResourceUtilization('org-1', startDate, endDate);

      expect(prisma.client.serviceBooking.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: 'org-1',
          scheduledStartTime: { gte: startDate, lte: endDate },
          status: { not: BookingStatus.CANCELLED },
        },
        include: { resources: true },
      });

      // Total duration in range: 4 hours = 240 minutes
      // room-1 occupies: 60 + 30 = 90 minutes
      // expected rate: 90 / 240 = 0.375
      expect(result['room-1']).toBeDefined();
      expect(result['room-1'].occupiedMinutes).toBe(90);
      expect(result['room-1'].rate).toBe(0.375);
    });
  });

  describe('getStaffPerformance', () => {
    it('should calculate staff performance without fetching service relation', async () => {
      const mockBookings = [
        {
          id: 'booking-1',
          price: new Decimal(150),
          staff: [{ memberId: 'staff-1' }],
        },
        {
          id: 'booking-2',
          price: new Decimal(200),
          staff: [{ memberId: 'staff-1' }, { memberId: 'staff-2' }],
        },
      ];

      vi.spyOn(prisma.client.serviceBooking, 'findMany').mockResolvedValue(mockBookings as any);

      const startDate = new Date('2026-07-21T00:00:00Z');
      const endDate = new Date('2026-07-21T23:59:59Z');

      const result = await service.getStaffPerformance('org-1', startDate, endDate);

      expect(prisma.client.serviceBooking.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: 'org-1',
          actualEndTime: { gte: startDate, lte: endDate },
          status: BookingStatus.COMPLETED,
        },
        include: { staff: true },
      });

      expect(result['staff-1']).toBeDefined();
      expect(result['staff-1'].bookingCount).toBe(2);
      expect(result['staff-1'].totalRevenue).toBe(350);

      expect(result['staff-2']).toBeDefined();
      expect(result['staff-2'].bookingCount).toBe(1);
      expect(result['staff-2'].totalRevenue).toBe(200);
    });
  });

  describe('getBookingConversionFunnel', () => {
    it('should calculate booking conversion funnel using groupBy database aggregation', async () => {
      const mockGroupByResult = [
        {
          status: BookingStatus.REQUESTED,
          _count: { _all: 5 },
        },
        {
          status: BookingStatus.CONFIRMED,
          _count: { _all: 3 },
        },
        {
          status: BookingStatus.COMPLETED,
          _count: { _all: 12 },
        },
        {
          status: BookingStatus.CANCELLED,
          _count: { _all: 2 },
        },
      ];

      vi.spyOn(prisma.client.serviceBooking, 'groupBy').mockResolvedValue(mockGroupByResult as any);

      const startDate = new Date('2026-07-21T00:00:00Z');
      const endDate = new Date('2026-07-21T23:59:59Z');

      const result = await service.getBookingConversionFunnel('org-1', startDate, endDate);

      expect(prisma.client.serviceBooking.groupBy).toHaveBeenCalledWith({
        by: ['status'],
        where: {
          organizationId: 'org-1',
          createdAt: { gte: startDate, lte: endDate },
        },
        _count: {
          _all: true,
        },
      });

      // Total bookings count: 5 + 3 + 12 + 2 = 22
      // Scheduled = 22 - 5 (REQUESTED) - 2 (CANCELLED) = 15 (CONFIRMED + COMPLETED)
      // Completed = 12
      // Cancellations = 2
      expect(result.stages[0]).toEqual({ name: 'Total Requests', count: 22, percentage: 100 });
      expect(result.stages[1]).toEqual({ name: 'Scheduled', count: 15, percentage: (15 / 22) * 100 });
      expect(result.stages[2]).toEqual({ name: 'Completed', count: 12, percentage: (12 / 15) * 100 });
      expect(result.cancellations).toBe(2);
    });

    it('should handle division by zero or empty results safely', async () => {
      vi.spyOn(prisma.client.serviceBooking, 'groupBy').mockResolvedValue([] as any);

      const startDate = new Date('2026-07-21T00:00:00Z');
      const endDate = new Date('2026-07-21T23:59:59Z');

      const result = await service.getBookingConversionFunnel('org-1', startDate, endDate);

      expect(result.stages[0]).toEqual({ name: 'Total Requests', count: 0, percentage: 100 });
      expect(result.stages[1]).toEqual({ name: 'Scheduled', count: 0, percentage: 0 });
      expect(result.stages[2]).toEqual({ name: 'Completed', count: 0, percentage: 0 });
      expect(result.cancellations).toBe(0);
    });
  });
});
