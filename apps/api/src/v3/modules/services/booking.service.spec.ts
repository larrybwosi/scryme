import { Test, TestingModule } from '@nestjs/testing';
import { BookingService } from './application/services/booking.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { InventoryMovementService } from '@/v3/modules/inventory/application/services/inventory-movement.service';
import { StaffSchedulingService } from './application/services/staff-scheduling.service';
import { CalComService } from './application/services/calcom.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BookingStatus, DepositType, PricingModel } from '@repo/db';
import { Decimal } from 'decimal.js';

describe('BookingService', () => {
  let service: BookingService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              service: {
                findFirst: vi.fn(),
              },
              customer: {
                findFirst: vi.fn(),
              },
              inventoryLocation: {
                findFirst: vi.fn(),
              },
              member: {
                count: vi.fn(),
              },
              serviceResource: {
                count: vi.fn(),
              },
              serviceBooking: {
                create: vi.fn(),
                update: vi.fn(),
                findFirst: vi.fn(),
              },
              bookingRecurrence: {
                create: vi.fn(),
              },
              transaction: {
                create: vi.fn(),
              },
            },
          },
        },
        {
          provide: InventoryMovementService,
          useValue: {
            recordMovement: vi.fn(),
          },
        },
        {
          provide: StaffSchedulingService,
          useValue: {
            isStaffAvailable: vi.fn().mockResolvedValue(true),
          },
        },
        {
          provide: CalComService,
          useValue: {
            syncBookingToCal: vi.fn(),
            fetchAvailabilityFromCal: vi.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createBooking validations', () => {
    it('should throw BadRequestException if customer does not belong to the organization', async () => {
      vi.spyOn(prisma.client.service, 'findFirst').mockResolvedValue({
        id: 'srv1',
        name: 'Service 1',
        price: new Decimal(100),
        estimatedDuration: 60,
        bufferTimeBefore: 0,
        bufferTimeAfter: 0,
        requiresDeposit: false,
      } as any);

      vi.spyOn(prisma.client.customer, 'findFirst').mockResolvedValue(null);

      const dto = {
        serviceId: 'srv1',
        customerId: 'invalid-cust',
        scheduledStartTime: new Date().toISOString(),
      };

      await expect(service.createBooking('org1', dto))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if location does not belong to the organization', async () => {
      vi.spyOn(prisma.client.service, 'findFirst').mockResolvedValue({
        id: 'srv1',
        name: 'Service 1',
        price: new Decimal(100),
        estimatedDuration: 60,
        bufferTimeBefore: 0,
        bufferTimeAfter: 0,
        requiresDeposit: false,
      } as any);

      vi.spyOn(prisma.client.inventoryLocation, 'findFirst').mockResolvedValue(null);

      const dto = {
        serviceId: 'srv1',
        locationId: 'invalid-loc',
        scheduledStartTime: new Date().toISOString(),
      };

      await expect(service.createBooking('org1', dto))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if staff do not belong to the organization', async () => {
      vi.spyOn(prisma.client.service, 'findFirst').mockResolvedValue({
        id: 'srv1',
        name: 'Service 1',
        price: new Decimal(100),
        estimatedDuration: 60,
        bufferTimeBefore: 0,
        bufferTimeAfter: 0,
        requiresDeposit: false,
      } as any);

      vi.spyOn(prisma.client.member, 'count').mockResolvedValue(0);

      const dto = {
        serviceId: 'srv1',
        staffIds: ['member-not-in-org'],
        scheduledStartTime: new Date().toISOString(),
      };

      await expect(service.createBooking('org1', dto))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('createBooking recurrence relations', () => {
    it('should create individual bookings with nested relations for recurrent schedule', async () => {
      const mockService = {
        id: 'srv1',
        name: 'Service 1',
        price: new Decimal(100),
        pricingModel: PricingModel.FIXED,
        estimatedDuration: 60,
        bufferTimeBefore: 0,
        bufferTimeAfter: 0,
        requiresDeposit: false,
      };

      vi.spyOn(prisma.client.service, 'findFirst').mockResolvedValue(mockService as any);
      vi.spyOn(prisma.client.member, 'count').mockResolvedValue(1);

      const mockBooking = { id: 'booking1', scheduledStartTime: new Date() };
      vi.spyOn(prisma.client.serviceBooking, 'create').mockResolvedValue(mockBooking as any);
      vi.spyOn(prisma.client.bookingRecurrence, 'create').mockResolvedValue({ id: 'rec1' } as any);

      const dto = {
        serviceId: 'srv1',
        staffIds: ['member1'],
        scheduledStartTime: '2026-07-15T10:00:00.000Z',
        recurrenceRule: 'FREQ=DAILY;COUNT=3',
      };

      await service.createBooking('org1', dto);

      // Verify bookingRecurrence was created
      expect(prisma.client.bookingRecurrence.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org1',
          rule: 'FREQ=DAILY;COUNT=3',
        }),
      });

      // Verify individual occurrences were created sequentially with nested staff assignments
      expect(prisma.client.serviceBooking.create).toHaveBeenCalledTimes(3); // 1 main booking + 2 occurrences
      expect(prisma.client.serviceBooking.create).toHaveBeenLastCalledWith({
        data: expect.objectContaining({
          organizationId: 'org1',
          recurrenceId: 'rec1',
          staff: {
            create: [{ memberId: 'member1' }],
          },
        }),
      });
    });
  });
});
