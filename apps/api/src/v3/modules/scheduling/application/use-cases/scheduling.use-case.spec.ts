import { describe, beforeEach, it, expect, vi } from "vitest";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { SchedulingUseCase } from "./scheduling.use-case";

describe("SchedulingUseCase", () => {
  let useCase: SchedulingUseCase;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      client: {
        serviceBooking: {
          findMany: vi.fn(),
          findFirst: vi.fn(),
          create: vi.fn(),
          updateMany: vi.fn(),
        },
        staffScheduleOverride: {
          findMany: vi.fn(),
          create: vi.fn(),
        },
        service: {
          findMany: vi.fn(),
          findFirst: vi.fn(),
        },
        inventoryLocation: {
          findMany: vi.fn(),
          findFirst: vi.fn(),
          findFirstOrThrow: vi.fn(),
          updateMany: vi.fn(),
        },
        organizationSettings: {
          findUnique: vi.fn(),
        },
        shiftTradeRequest: {
          findMany: vi.fn(),
        },
        staffTask: {
          findMany: vi.fn(),
        },
        department: {
          findMany: vi.fn(),
        },
        attendanceLog: {
          findMany: vi.fn(),
          findFirst: vi.fn(),
          create: vi.fn(),
          updateMany: vi.fn(),
        },
        member: {
          findFirst: vi.fn(),
          updateMany: vi.fn(),
        },
        customer: {
          findFirst: vi.fn(),
          create: vi.fn(),
        },
        bookingEvent: {
          create: vi.fn(),
        },
        staffShift: {
          findMany: vi.fn(),
        },
      },
    };

    useCase = new SchedulingUseCase(mockPrisma);
  });

  describe("getSchedulingWorkspace", () => {
    it("should query workspace items for date range", async () => {
      mockPrisma.client.serviceBooking.findMany.mockResolvedValue([]);
      mockPrisma.client.staffScheduleOverride.findMany.mockResolvedValue([]);
      mockPrisma.client.service.findMany.mockResolvedValue([]);
      mockPrisma.client.inventoryLocation.findMany.mockResolvedValue([]);
      mockPrisma.client.organizationSettings.findUnique.mockResolvedValue({ defaultTimezone: "UTC" });
      mockPrisma.client.shiftTradeRequest.findMany.mockResolvedValue([]);
      mockPrisma.client.staffTask.findMany.mockResolvedValue([]);
      mockPrisma.client.department.findMany.mockResolvedValue([]);
      mockPrisma.client.attendanceLog.findMany.mockResolvedValue([]);

      const result = await useCase.getSchedulingWorkspace(
        "org_1",
        new Date("2026-10-01"),
        new Date("2026-10-31"),
      );

      expect(result.timezone).toEqual("UTC");
      expect(mockPrisma.client.serviceBooking.findMany).toHaveBeenCalled();
    });
  });

  describe("createScheduledBooking", () => {
    it("should create service booking and event log", async () => {
      mockPrisma.client.member.findFirst.mockResolvedValue({ id: "member_1" });
      mockPrisma.client.service.findFirst.mockResolvedValue({
        id: "srv_1",
        name: "Haircut",
        price: "30.00",
        pricingModel: "FIXED",
        estimatedDuration: 45,
      });
      mockPrisma.client.serviceBooking.create.mockResolvedValue({
        id: "booking_1",
        price: { toString: () => "30.00" },
      });

      const dto = {
        memberId: "member_1",
        serviceId: "srv_1",
        scheduledStartTime: new Date("2026-10-15T10:00:00Z"),
      };

      const result = await useCase.createScheduledBooking("org_1", "actor_1", dto as any);

      expect(result.id).toEqual("booking_1");
      expect(mockPrisma.client.bookingEvent.create).toHaveBeenCalled();
    });
  });

  describe("updateBranchLocationCoordinates", () => {
    it("should update location coordinates using updateMany for BOLA protection", async () => {
      mockPrisma.client.inventoryLocation.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.client.inventoryLocation.findFirstOrThrow.mockResolvedValue({
        id: "loc_1",
        latitude: -1.28,
        longitude: 36.81,
      });

      const result = await useCase.updateBranchLocationCoordinates("org_1", "loc_1", {
        latitude: -1.28,
        longitude: 36.81,
      });

      expect(result.latitude).toEqual(-1.28);
      expect(mockPrisma.client.inventoryLocation.updateMany).toHaveBeenCalledWith({
        where: { id: "loc_1", organizationId: "org_1" },
        data: expect.objectContaining({ latitude: -1.28, longitude: 36.81 }),
      });
    });
  });
});
