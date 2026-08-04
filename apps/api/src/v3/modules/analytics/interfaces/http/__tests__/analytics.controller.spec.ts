import { AnalyticsController } from "../analytics.controller";
import { PrismaService } from "@/prisma/prisma.service";
import { ServiceAnalyticsService } from "../../../../services/application/services/service-analytics.service";
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("AnalyticsController", () => {
  let controller: AnalyticsController;
  let prisma: PrismaService;
  let serviceAnalyticsService: ServiceAnalyticsService;

  beforeEach(() => {
    prisma = {
      client: {
        member: {
          count: vi.fn(),
        },
        attendanceLog: {
          findMany: vi.fn(),
        },
        inventoryLocation: {
          findMany: vi.fn(),
        },
      },
    } as any;

    serviceAnalyticsService = {
      getResourceUtilization: vi.fn(),
    } as any;

    controller = new AnalyticsController(prisma, serviceAnalyticsService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getDashboardAnalytics", () => {
    it("should calculate correct dashboard analytics concurrently and with Map optimization", async () => {
      // Mock Data
      const mockTotalCheckedInNow = 5;

      const mockLogs = [
        { checkInTime: new Date("2026-08-02T08:15:00Z") },
        { checkInTime: new Date("2026-08-02T08:45:00Z") },
        { checkInTime: new Date("2026-08-02T14:30:00Z") },
      ];

      const mockLocations = [
        {
          id: "loc-1",
          name: "Main Location",
          checkInAttendanceLogs: [{ id: "log-active-1" }],
        },
        {
          id: "loc-2",
          name: "Sub Location",
          checkInAttendanceLogs: [],
        },
      ];

      const mockCompletedLogs = [
        { checkInLocationId: "loc-1", durationMinutes: 30 },
        { checkInLocationId: "loc-1", durationMinutes: 60 },
      ];

      vi.spyOn(prisma.client.member, "count").mockResolvedValue(mockTotalCheckedInNow);
      vi.spyOn(prisma.client.attendanceLog, "findMany")
        .mockResolvedValueOnce(mockLogs as any) // for peakHours query
        .mockResolvedValueOnce(mockCompletedLogs as any); // for branchStats completedLogs query
      vi.spyOn(prisma.client.inventoryLocation, "findMany").mockResolvedValue(mockLocations as any);

      const req = {
        v3Context: {
          organizationId: "org-123",
        },
      };

      const result = await controller.getDashboardAnalytics(req);

      // Verify Prisma queries
      expect(prisma.client.member.count).toHaveBeenCalledWith({
        where: { organizationId: "org-123", isCheckedIn: true, deletedAt: null },
      });

      expect(prisma.client.attendanceLog.findMany).toHaveBeenCalledWith({
        where: { organizationId: "org-123" },
        select: { checkInTime: true },
        take: 1000,
      });

      expect(prisma.client.inventoryLocation.findMany).toHaveBeenCalledWith({
        where: { organizationId: "org-123", isActive: true },
        include: {
          checkInAttendanceLogs: {
            where: { checkOutTime: null },
            select: { id: true },
          },
        },
      });

      // Verify returned metrics
      expect(result.totalCheckedInNow).toBe(5);

      // Peak Hours sorting and counting
      // 8 AM: 2 logs, 14 PM: 1 log
      expect(result.peakHours).toEqual([
        { hour: 8, count: 2 },
        { hour: 14, count: 1 },
      ]);

      // Branch stats
      // loc-1 has 1 active presence, 2 completed logs with durations 30 & 60. Average = 45.
      // loc-2 has 0 active presence, 0 completed logs. Average = 0.
      expect(result.branchStats).toEqual([
        {
          locationId: "loc-1",
          locationName: "Main Location",
          activePresenceCount: 1,
          averageDurationMinutes: 45.0,
        },
        {
          locationId: "loc-2",
          locationName: "Sub Location",
          activePresenceCount: 0,
          averageDurationMinutes: 0.0,
        },
      ]);
    });
  });
});
