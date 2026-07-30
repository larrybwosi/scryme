import { Test, TestingModule } from "@nestjs/testing";
import { StaffSchedulingService } from "./application/services/staff-scheduling.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("StaffSchedulingService", () => {
  let service: StaffSchedulingService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaffSchedulingService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              staffShift: {
                create: vi.fn(),
                findMany: vi.fn(),
              },
              staffBreak: {
                create: vi.fn(),
              },
            },
          },
        },
      ],
    }).compile();

    service = module.get<StaffSchedulingService>(StaffSchedulingService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("isStaffAvailable", () => {
    it("should query shifts using optimized select options", async () => {
      const memberId = "member-1";
      const startTime = new Date("2026-07-24T09:00:00"); // Use ISO-like local date
      const endTime = new Date("2026-07-24T10:00:00");
      const dayOfWeek = startTime.getDay();

      const mockShift = {
        id: "shift-1",
        startTime: "08:00",
        endTime: "17:00",
        breaks: [
          {
            id: "break-1",
            startTime: "12:00",
            endTime: "13:00",
          },
        ],
      };

      vi.spyOn(prisma.client.staffShift, "findMany").mockResolvedValue([
        mockShift,
      ] as any);

      const isAvailable = await service.isStaffAvailable(
        memberId,
        startTime,
        endTime,
      );

      expect(prisma.client.staffShift.findMany).toHaveBeenCalledWith({
        where: { memberId, dayOfWeek, isActive: true },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          breaks: {
            select: {
              id: true,
              startTime: true,
              endTime: true,
            },
          },
        },
      });

      expect(isAvailable).toBeDefined();
    });
  });

  describe("getShifts", () => {
    it("should query all shifts for the organization with no filters", async () => {
      const orgId = "org-1";
      const mockShifts = [
        {
          id: "shift-1",
          memberId: "member-1",
          dayOfWeek: 1,
          startTime: "09:00",
          endTime: "17:00",
        },
      ];

      vi.spyOn(prisma.client.staffShift, "findMany").mockResolvedValue(mockShifts as any);

      const result = await service.getShifts(orgId, {});

      expect(prisma.client.staffShift.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId },
        include: {
          breaks: true,
          member: {
            select: {
              id: true,
              role: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });
      expect(result).toEqual(mockShifts);
    });

    it("should query shifts with filters (memberId, dayOfWeek, isActive)", async () => {
      const orgId = "org-1";
      const filters = {
        memberId: "member-2",
        dayOfWeek: 3,
        isActive: true,
      };

      vi.spyOn(prisma.client.staffShift, "findMany").mockResolvedValue([] as any);

      await service.getShifts(orgId, filters);

      expect(prisma.client.staffShift.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: orgId,
          memberId: "member-2",
          dayOfWeek: 3,
          isActive: true,
        },
        include: {
          breaks: true,
          member: {
            select: {
              id: true,
              role: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });
    });
  });
});
