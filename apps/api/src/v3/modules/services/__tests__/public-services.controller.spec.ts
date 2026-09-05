import { Test, TestingModule } from "@nestjs/testing";
import { PublicServicesController } from "../interfaces/http/public-services.controller";
import { ServiceManagementService } from "../application/services/service-management.service";
import { BookingService } from "../application/services/booking.service";
import { OtpService } from "../application/services/otp.service";
import { PrismaService } from "../../../../prisma/prisma.service";
import { InventoryMovementService } from "@/v3/modules/inventory/application/services/inventory-movement.service";
import { StaffSchedulingService } from "../application/services/staff-scheduling.service";
import { CalComService } from "../application/services/calcom.service";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { Decimal } from "decimal.js";
import { BookingStatus, PricingModel } from "@repo/db";

describe("PublicServicesController & getServiceAvailability Algorithm", () => {
  let controller: PublicServicesController;
  let serviceManagement: ServiceManagementService;
  let bookingService: BookingService;
  let otpService: OtpService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicServicesController],
      providers: [
        ServiceManagementService,
        BookingService,
        OtpService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              service: {
                findFirst: vi.fn(),
                findMany: vi.fn(),
              },
              serviceCategory: {
                findMany: vi.fn(),
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
              staffShift: {
                findMany: vi.fn(),
              },
              serviceBooking: {
                create: vi.fn(),
                update: vi.fn(),
                findFirst: vi.fn(),
                findMany: vi.fn(),
              },
              bookingVerificationCode: {
                findFirst: vi.fn(),
                delete: vi.fn(),
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
            checkStaffAvailability: vi.fn().mockResolvedValue({ available: true, reasons: [] }),
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

    controller = module.get<PublicServicesController>(PublicServicesController);
    serviceManagement = module.get<ServiceManagementService>(ServiceManagementService);
    bookingService = module.get<BookingService>(BookingService);
    otpService = module.get<OtpService>(OtpService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getPublicServices", () => {
    it("should list active services for the organization", async () => {
      const mockServices = [
        { id: "srv1", name: "Service 1", isActive: true },
        { id: "srv2", name: "Service 2", isActive: true },
      ];
      vi.spyOn(prisma.client.service, "findMany").mockResolvedValue(mockServices as any);

      const req = { organization: { id: "org1" } };
      const result = await controller.getPublicServices(req);

      expect(prisma.client.service.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: "org1", isActive: true }),
        }),
      );
      expect(result).toEqual(mockServices);
    });
  });

  describe("getPublicService", () => {
    it("should return detailed info for active service", async () => {
      const mockService = { id: "srv1", name: "Service 1", isActive: true };
      vi.spyOn(prisma.client.service, "findFirst").mockResolvedValue(mockService as any);

      const req = { organization: { id: "org1" } };
      const result = await controller.getPublicService(req, "srv1");

      expect(prisma.client.service.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: "srv1", organizationId: "org1" }),
        }),
      );
      expect(result).toEqual(mockService);
    });

    it("should throw NotFoundException if service does not exist or is inactive", async () => {
      vi.spyOn(prisma.client.service, "findFirst").mockResolvedValue(null);

      const req = { organization: { id: "org1" } };
      await expect(controller.getPublicService(req, "srv1")).rejects.toThrow(NotFoundException);
    });
  });

  describe("createPublicBooking", () => {
    it("should validate verification code, consume it, and create booking", async () => {
      const req = { organization: { id: "org1" } };
      const dto = {
        serviceId: "srv1",
        verificationId: "ver1",
        scheduledStartTime: "2026-10-15T10:00:00.000Z",
      };

      const mockVerification = {
        id: "ver1",
        email: "guest@example.com",
        phoneNumber: null,
        verifiedAt: new Date(),
      };

      const mockService = {
        id: "srv1",
        name: "Service 1",
        price: new Decimal(100),
        pricingModel: PricingModel.FIXED,
        estimatedDuration: 60,
        bufferTimeBefore: 0,
        bufferTimeAfter: 0,
        requiresDeposit: false,
        staff: [{ memberId: "staff-1" }],
      };

      const mockCustomer = {
        id: "cust-guest",
        email: "guest@example.com",
      };

      vi.spyOn(prisma.client.bookingVerificationCode, "findFirst").mockResolvedValue(mockVerification as any);
      vi.spyOn(prisma.client.bookingVerificationCode, "delete").mockResolvedValue({} as any);
      vi.spyOn(prisma.client.service, "findFirst").mockResolvedValue(mockService as any);
      vi.spyOn(prisma.client.customer, "findFirst").mockResolvedValue(mockCustomer as any);
      vi.spyOn(prisma.client.serviceBooking, "create").mockResolvedValue({ id: "booking1" } as any);

      const result = await controller.createPublicBooking(req, dto);

      expect(prisma.client.bookingVerificationCode.findFirst).toHaveBeenCalledWith({
        where: {
          id: "ver1",
          organizationId: "org1",
          verifiedAt: { not: null },
        },
      });
      expect(prisma.client.bookingVerificationCode.delete).toHaveBeenCalledWith({
        where: { id: "ver1" },
      });
      expect(prisma.client.serviceBooking.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            serviceId: "srv1",
            scheduledStartTime: expect.any(Date),
            serviceName: "Service 1",
          }),
        }),
      );
      expect(result).toEqual({ id: "booking1" });
    });
  });

  describe("Dynamic Slot Generation Algorithm in getServiceAvailability", () => {
    it("should calculate correct timeslots fitting shifts, excluding breaks and overlapping bookings", async () => {
      const mockService = {
        id: "srv1",
        name: "Haircut",
        estimatedDuration: 60,
        bufferTimeBefore: 15,
        bufferTimeAfter: 15,
        staff: [{ memberId: "staff-1" }],
        resources: [],
      };

      // Mock date: 2026-10-15 is Thursday (getDay() === 4)
      const dateStr = "2026-10-15";

      vi.spyOn(prisma.client.service, "findFirst").mockResolvedValue(mockService as any);

      // Staff shifts on Thursday (4): 09:00 - 12:00 (3 hours)
      // Break: 10:00 - 10:30 (Lunch/Rest break)
      const mockShift = {
        id: "shift-1",
        memberId: "staff-1",
        organizationId: "org1",
        dayOfWeek: 4,
        startTime: "09:00",
        endTime: "12:00",
        isActive: true,
        breaks: [
          { startTime: "10:00", endTime: "10:30", description: "Tea break" },
        ],
      };
      vi.spyOn(prisma.client.staffShift, "findMany").mockResolvedValue([mockShift] as any);

      // Existing booking for staff-1 from 11:00 to 12:00
      const mockBooking = {
        id: "bk-1",
        scheduledStartTime: new Date("2026-10-15T11:00:00.000Z"),
        scheduledEndTime: new Date("2026-10-15T12:00:00.000Z"),
        staff: [{ memberId: "staff-1" }],
        resources: [],
      };
      vi.spyOn(prisma.client.serviceBooking, "findMany").mockResolvedValue([mockBooking] as any);

      const result = await bookingService.getServiceAvailability("org1", "srv1", dateStr);

      // Math Analysis:
      // Shifts: 09:00 to 12:00. Candidate slot starts:
      // - 09:00 to 10:00 (60 mins duration):
      //   - Break overlap check: starts at 540 (09:00), ends at 600 (10:00). Break starts at 600, ends at 630.
      //     Is startMins < breakEnd (540 < 630) && endMins > breakStart (600 > 600)? No, 600 is not > 600. So no break overlap.
      //   - Existing Booking overlap check (service requires 15m pre/post buffer):
      //     - Booking starts at 11:00 (660), ends at 12:00 (720).
      //     - Slot: 09:00 (540) to 10:00 (600).
      //       Slot + buffers: 08:45 (525) to 10:15 (615).
      //       Overlap check: 525 < 720 (bEnd) && 615 > 660 (bStart)? No, 615 is not > 660. So no booking overlap.
      //     - Result: Slot 09:00 is AVAILABLE!
      // - 09:30 to 10:30 (60 mins duration):
      //   - Break overlap check: starts at 570 (09:30), ends at 630 (10:30). Break starts at 600, ends at 630.
      //     Is 570 < 630 && 630 > 600? Yes! Overlaps with break.
      //     - Result: UNAVAILABLE!
      // - 10:00 to 11:00 (60 mins duration):
      //   - Break overlap check: starts at 600 (10:00), ends at 660 (11:00). Break starts at 600, ends at 630.
      //     Is 600 < 630 && 660 > 600? Yes! Overlaps with break.
      //     - Result: UNAVAILABLE!
      // - 10:30 to 11:30 (60 mins duration):
      //   - Booking overlap check (with 15m pre/post buffer):
      //     - Booking starts at 11:00 (660).
      //     - Slot: 10:30 (630) to 11:30 (690).
      //       Slot + buffers: 10:15 (615) to 11:45 (705).
      //       Is 615 < 720 && 705 > 660? Yes! 705 is > 660. Overlaps with booking.
      //     - Result: UNAVAILABLE!

      expect(result.availableSlots).toContain(new Date("2026-10-15T09:00:00.000Z").toISOString());
      expect(result.availableSlots.length).toBe(1);
    });
  });
});
