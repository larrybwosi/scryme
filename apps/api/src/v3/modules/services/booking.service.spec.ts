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
  let inventoryMovementService: InventoryMovementService;

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
                create: vi.fn(),
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
    inventoryMovementService = module.get<InventoryMovementService>(InventoryMovementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createBooking with customerContact', () => {
    it('should find existing customer by email and associate the booking', async () => {
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
      vi.spyOn(prisma.client.customer, 'findFirst').mockResolvedValue({ id: 'cust-123', email: 'john@example.com' } as any);
      vi.spyOn(prisma.client.serviceBooking, 'create').mockResolvedValue({ id: 'booking1' } as any);

      const dto = {
        serviceId: 'srv1',
        customerContact: 'john@example.com',
        scheduledStartTime: new Date().toISOString(),
      };

      await service.createBooking('org1', dto);

      expect(prisma.client.customer.findFirst).toHaveBeenCalledWith({
        where: {
          organizationId: 'org1',
          OR: [
            { email: 'john@example.com' }
          ]
        }
      });
      expect(prisma.client.serviceBooking.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          customerId: 'cust-123',
        })
      }));
    });

    it('should create a new customer if email does not exist and associate the booking', async () => {
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
      vi.spyOn(prisma.client.customer, 'findFirst')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'cust-new', email: 'new@example.com' } as any);
      vi.spyOn(prisma.client.customer, 'create').mockResolvedValue({ id: 'cust-new', email: 'new@example.com' } as any);
      vi.spyOn(prisma.client.serviceBooking, 'create').mockResolvedValue({ id: 'booking1' } as any);

      const dto = {
        serviceId: 'srv1',
        customerContact: 'new@example.com',
        scheduledStartTime: new Date().toISOString(),
      };

      await service.createBooking('org1', dto);

      expect(prisma.client.customer.create).toHaveBeenCalledWith({
        data: {
          organizationId: 'org1',
          email: 'new@example.com',
          phone: undefined,
          name: 'new',
          isActive: true,
        }
      });
      expect(prisma.client.serviceBooking.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          customerId: 'cust-new',
        })
      }));
    });
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

  describe('completeBooking', () => {
    let txMock: any;

    beforeEach(() => {
      txMock = {
        bookingConsumedMaterial: {
          create: vi.fn().mockResolvedValue({}),
        },
        productVariantStock: {
          update: vi.fn().mockResolvedValue({}),
        },
        transaction: {
          create: vi.fn().mockResolvedValue({ id: 'txn1' }),
        },
        serviceBooking: {
          update: vi.fn().mockResolvedValue({ id: 'booking1', status: BookingStatus.COMPLETED }),
        },
      };

      prisma.client.$transaction = vi.fn().mockImplementation(async (callback) => {
        return callback(txMock);
      }) as any;
    });

    it('should complete booking, record materials, update stock and log inventory movements', async () => {
      const mockBooking = {
        id: 'booking1',
        organizationId: 'org1',
        status: BookingStatus.SCHEDULED,
        locationId: 'loc1',
        price: new Decimal(100),
        pricingModel: PricingModel.FIXED,
        scheduledStartTime: new Date(),
        scheduledEndTime: new Date(),
        serviceName: 'Service 1',
        customerId: 'cust1',
        serviceId: 'srv1',
        service: {
          sku: 'SKU1',
          materials: [
            { variantId: 'var1', quantity: 2 },
          ],
          taxRates: [],
        },
      };

      vi.spyOn(prisma.client.serviceBooking, 'findFirst').mockResolvedValue(mockBooking as any);

      const dto = {
        materials: [
          { variantId: 'var1', quantity: 2 },
          { variantId: 'var2', quantity: 3 },
        ],
      };

      const result = await service.completeBooking('org1', 'booking1', 'member1', dto);

      expect(result.status).toBe(BookingStatus.COMPLETED);

      // Verify that consumed materials are created
      expect(txMock.bookingConsumedMaterial.create).toHaveBeenCalledTimes(2);
      expect(txMock.bookingConsumedMaterial.create).toHaveBeenCalledWith({
        data: {
          bookingId: 'booking1',
          variantId: 'var1',
          quantity: 2,
        },
      });

      // Verify that stocks are updated
      expect(txMock.productVariantStock.update).toHaveBeenCalledTimes(2);
      expect(txMock.productVariantStock.update).toHaveBeenCalledWith({
        where: {
          variantId_locationId: {
            variantId: 'var1',
            locationId: 'loc1',
          },
        },
        data: {
          currentStock: { decrement: 2 },
          availableStock: { decrement: 2 },
        },
      });

      // Verify movement logging
      expect(inventoryMovementService.recordMovement).toHaveBeenCalledTimes(2);

      // Verify transaction creation
      expect(txMock.transaction.create).toHaveBeenCalled();
    });

    it('should consolidate duplicate materials in-memory before database updates', async () => {
      const mockBooking = {
        id: 'booking2',
        organizationId: 'org1',
        status: BookingStatus.SCHEDULED,
        locationId: 'loc1',
        price: new Decimal(150),
        pricingModel: PricingModel.FIXED,
        scheduledStartTime: new Date(),
        scheduledEndTime: new Date(),
        serviceName: 'Service 2',
        customerId: 'cust1',
        serviceId: 'srv1',
        service: {
          sku: 'SKU2',
          materials: [],
          taxRates: [],
        },
      };

      vi.spyOn(prisma.client.serviceBooking, 'findFirst').mockResolvedValue(mockBooking as any);

      const dto = {
        materials: [
          { variantId: 'var1', quantity: 2 },
          { variantId: 'var1', quantity: 3 }, // Duplicate variantId!
        ],
      };

      await service.completeBooking('org1', 'booking2', 'member1', dto);

      // Verify consolidation to 5 (2 + 3)
      expect(txMock.bookingConsumedMaterial.create).toHaveBeenCalledTimes(1);
      expect(txMock.bookingConsumedMaterial.create).toHaveBeenCalledWith({
        data: {
          bookingId: 'booking2',
          variantId: 'var1',
          quantity: 5,
        },
      });

      expect(txMock.productVariantStock.update).toHaveBeenCalledTimes(1);
      expect(txMock.productVariantStock.update).toHaveBeenCalledWith({
        where: {
          variantId_locationId: {
            variantId: 'var1',
            locationId: 'loc1',
          },
        },
        data: {
          currentStock: { decrement: 5 },
          availableStock: { decrement: 5 },
        },
      });
    });

    it('should throw NotFoundException if booking does not exist', async () => {
      vi.spyOn(prisma.client.serviceBooking, 'findFirst').mockResolvedValue(null);

      await expect(service.completeBooking('org1', 'invalid-booking', 'member1', {}))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if booking is already completed', async () => {
      const mockBooking = {
        id: 'booking1',
        organizationId: 'org1',
        status: BookingStatus.COMPLETED,
      };

      vi.spyOn(prisma.client.serviceBooking, 'findFirst').mockResolvedValue(mockBooking as any);

      await expect(service.completeBooking('org1', 'booking1', 'member1', {}))
        .rejects.toThrow(BadRequestException);
    });
  });
});
