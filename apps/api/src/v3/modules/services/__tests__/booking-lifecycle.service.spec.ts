import { describe, it, expect, vi, beforeEach } from "vitest";
import { BookingLifecycleService } from "../application/services/booking-lifecycle.service";
import { BookingConflictDetectionService } from "../application/services/booking-conflict-detection.service";
import { BookingTaskGeneratorService } from "../application/services/booking-task-generator.service";
import { BookingStatus, ChecklistStage, TaskStatus } from "@repo/db";

describe("BookingLifecycleService & Conflict Detection", () => {
  let lifecycleService: BookingLifecycleService;
  let conflictDetector: BookingConflictDetectionService;
  let taskGenerator: BookingTaskGeneratorService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      client: {
        serviceBooking: {
          findFirst: vi.fn(),
          update: vi.fn(),
          count: vi.fn(),
          findMany: vi.fn(),
        },
        bookingEvent: {
          create: vi.fn(),
        },
        bookingStaff: {
          findFirst: vi.fn(),
          deleteMany: vi.fn(),
          create: vi.fn(),
        },
        staffScheduleOverride: {
          findFirst: vi.fn(),
        },
        staffShift: {
          findMany: vi.fn(),
        },
        member: {
          findFirst: vi.fn(),
        },
        inventoryLocation: {
          findFirst: vi.fn(),
        },
        bookingTask: {
          create: vi.fn(),
          update: vi.fn(),
          count: vi.fn(),
          updateMany: vi.fn(),
        },
        staffTask: {
          create: vi.fn(),
          updateMany: vi.fn(),
        },
        task: {
          create: vi.fn(),
          count: vi.fn(),
          updateMany: vi.fn(),
        },
        project: {
          findFirst: vi.fn(),
          create: vi.fn(),
        },
        bookingChecklistItem: {
          create: vi.fn(),
          findFirst: vi.fn(),
          update: vi.fn(),
          count: vi.fn(),
        },
        checklistTemplate: {
          create: vi.fn(),
          findMany: vi.fn(),
        },
      },
    };

    conflictDetector = new BookingConflictDetectionService(mockPrisma);
    taskGenerator = new BookingTaskGeneratorService(mockPrisma);
    lifecycleService = new BookingLifecycleService(mockPrisma, conflictDetector, taskGenerator);
  });

  describe("Lifecycle state transitions", () => {
    it("transitions booking from PENDING to CONFIRMED and triggers task generation", async () => {
      const mockBooking = {
        id: "bkg-1",
        organizationId: "org-1",
        status: BookingStatus.PENDING,
        serviceName: "Full Grooming",
        scheduledStartTime: new Date("2026-11-10T10:00:00Z"),
        scheduledEndTime: new Date("2026-11-10T11:00:00Z"),
        locationId: "loc-1",
        staff: [{ memberId: "mem-1" }],
        service: { checklistTemplates: [] },
      };

      mockPrisma.client.serviceBooking.findFirst.mockResolvedValue(mockBooking);
      mockPrisma.client.serviceBooking.update.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
      });
      mockPrisma.client.member.findFirst.mockResolvedValue({ id: "mem-1", name: "Alice" });
      mockPrisma.client.staffScheduleOverride.findFirst.mockResolvedValue(null);
      mockPrisma.client.bookingStaff.findFirst.mockResolvedValue(null);
      mockPrisma.client.serviceBooking.findMany.mockResolvedValue([]);
      mockPrisma.client.staffShift.findMany.mockResolvedValue([]);
      mockPrisma.client.inventoryLocation.findFirst.mockResolvedValue({ id: "loc-1", name: "Salon Room A" });
      mockPrisma.client.bookingTask.count.mockResolvedValue(0);
      mockPrisma.client.bookingTask.create.mockResolvedValue({ id: "task-1" });
      mockPrisma.client.project.findFirst.mockResolvedValue({ id: "prj-1", key: "SRV" });
      mockPrisma.client.task.count.mockResolvedValue(0);
      mockPrisma.client.task.create.mockResolvedValue({ id: "tsk-1" });

      const result = await lifecycleService.transitionStatus({
        orgId: "org-1",
        bookingId: "bkg-1",
        targetStatus: BookingStatus.CONFIRMED,
        actorMemberId: "actor-1",
      });

      expect(result.status).toBe(BookingStatus.CONFIRMED);
      expect(mockPrisma.client.bookingEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            toStatus: BookingStatus.CONFIRMED,
          }),
        }),
      );
      expect(mockPrisma.client.bookingTask.create).toHaveBeenCalled();
    });

    it("rejects invalid state transition from COMPLETED to IN_PROGRESS", async () => {
      const mockBooking = {
        id: "bkg-1",
        organizationId: "org-1",
        status: BookingStatus.COMPLETED,
        staff: [],
      };
      mockPrisma.client.serviceBooking.findFirst.mockResolvedValue(mockBooking);

      await expect(
        lifecycleService.transitionStatus({
          orgId: "org-1",
          bookingId: "bkg-1",
          targetStatus: BookingStatus.IN_PROGRESS,
        }),
      ).rejects.toThrow("Invalid status transition from COMPLETED to IN_PROGRESS");
    });

    it("permits manager override on soft conflict warning during transition", async () => {
      const mockBooking = {
        id: "bkg-1",
        organizationId: "org-1",
        status: BookingStatus.ASSIGNED,
        serviceName: "Hair Treatment",
        scheduledStartTime: new Date("2026-11-10T10:00:00Z"),
        scheduledEndTime: new Date("2026-11-10T11:00:00Z"),
        staff: [{ memberId: "mem-1" }],
      };

      mockPrisma.client.serviceBooking.findFirst.mockResolvedValue(mockBooking);
      mockPrisma.client.serviceBooking.update.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.IN_PROGRESS,
      });
      mockPrisma.client.bookingTask.count.mockResolvedValue(1);

      const result = await lifecycleService.transitionStatus({
        orgId: "org-1",
        bookingId: "bkg-1",
        targetStatus: BookingStatus.IN_PROGRESS,
        actorMemberId: "manager-1",
        overrideConflict: true,
      });

      expect(result.status).toBe(BookingStatus.IN_PROGRESS);
    });
  });

  describe("Conflict detection", () => {
    it("flags a conflict when staff member has an active leave schedule override", async () => {
      mockPrisma.client.member.findFirst.mockResolvedValue({ id: "mem-1", user: { name: "Bob Staff" } });
      mockPrisma.client.staffScheduleOverride.findFirst.mockResolvedValue({
        id: "ovr-1",
        type: "LEAVE",
        reason: "Annual vacation",
      });
      mockPrisma.client.serviceBooking.findMany.mockResolvedValue([]);
      mockPrisma.client.staffShift.findMany.mockResolvedValue([]);

      const conflictResult = await conflictDetector.detectConflicts({
        orgId: "org-1",
        startTime: new Date("2026-11-10T10:00:00Z"),
        endTime: new Date("2026-11-10T11:00:00Z"),
        staffMemberIds: ["mem-1"],
      });

      expect(conflictResult.hasConflict).toBe(true);
      expect(conflictResult.canOverride).toBe(true);
      expect(conflictResult.conflicts[0].type).toBe("STAFF_UNAVAILABLE");
      expect(conflictResult.conflicts[0].message).toContain("Bob Staff is marked leave");
    });

    it("flags a conflict when customer already has an active overlapping booking", async () => {
      mockPrisma.client.serviceBooking.findFirst.mockResolvedValue({
        id: "bkg-prior",
        serviceName: "Spa Massage",
        scheduledStartTime: new Date("2026-11-10T10:00:00Z"),
        scheduledEndTime: new Date("2026-11-10T11:00:00Z"),
      });

      const conflictResult = await conflictDetector.detectConflicts({
        orgId: "org-1",
        startTime: new Date("2026-11-10T10:00:00Z"),
        endTime: new Date("2026-11-10T11:00:00Z"),
        customerId: "cust-99",
      });

      expect(conflictResult.hasConflict).toBe(true);
      expect(conflictResult.conflicts[0].type).toBe("CUSTOMER_DOUBLE_BOOKING");
      expect(conflictResult.conflicts[0].message).toContain("Spa Massage");
    });

    it("flags a conflict when location capacity is exceeded", async () => {
      mockPrisma.client.inventoryLocation.findFirst.mockResolvedValue({
        id: "loc-1",
        name: "Station 1",
        customFields: { capacity: 2 },
      });
      mockPrisma.client.serviceBooking.count.mockResolvedValue(2);

      const conflictResult = await conflictDetector.detectConflicts({
        orgId: "org-1",
        startTime: new Date("2026-11-10T10:00:00Z"),
        endTime: new Date("2026-11-10T11:00:00Z"),
        locationId: "loc-1",
      });

      expect(conflictResult.hasConflict).toBe(true);
      expect(conflictResult.conflicts[0].type).toBe("LOCATION_CAPACITY_EXCEEDED");
    });
  });

  describe("Checklist Item progress & Auto-advance", () => {
    it("marks task COMPLETED and auto-advances booking to COMPLETED when all items are done", async () => {
      mockPrisma.client.bookingChecklistItem.findFirst.mockResolvedValue({
        id: "chk-1",
        taskId: "task-100",
        isCompleted: false,
      });
      mockPrisma.client.bookingChecklistItem.update.mockResolvedValue({
        id: "chk-1",
        isCompleted: true,
      });
      mockPrisma.client.bookingChecklistItem.count
        .mockResolvedValueOnce(0) // remaining incomplete items for taskId
        .mockResolvedValueOnce(3) // total items for booking
        .mockResolvedValueOnce(3); // total completed items for booking

      mockPrisma.client.serviceBooking.findFirst.mockResolvedValue({
        id: "bkg-1",
        organizationId: "org-1",
        status: BookingStatus.IN_PROGRESS,
      });

      const result = await lifecycleService.updateChecklistItem({
        orgId: "org-1",
        bookingId: "bkg-1",
        itemId: "chk-1",
        isCompleted: true,
        memberId: "mem-1",
      });

      expect(mockPrisma.client.bookingTask.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "task-100" },
          data: expect.objectContaining({ status: TaskStatus.COMPLETED }),
        }),
      );
      expect(mockPrisma.client.serviceBooking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "bkg-1" },
          data: expect.objectContaining({ status: BookingStatus.COMPLETED }),
        }),
      );
      expect(result.progress.isAllCompleted).toBe(true);
    });
  });
});
