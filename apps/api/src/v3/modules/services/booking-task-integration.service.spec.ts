import { describe, it, expect, vi, beforeEach } from "vitest";
import { BookingTaskIntegrationService } from "./application/services/booking-task-integration.service";
import { BookingStatus, ProjectTaskStatus, TaskStatus } from "@repo/db";

describe("BookingTaskIntegrationService", () => {
  let service: BookingTaskIntegrationService;
  let mockPrisma: any;
  let mockBookingService: any;
  let mockModuleRef: any;

  beforeEach(() => {
    mockPrisma = {
      client: {
        project: {
          findFirst: vi.fn(),
          create: vi.fn(),
        },
        serviceBooking: {
          findFirst: vi.fn(),
        },
        task: {
          count: vi.fn(),
          create: vi.fn(),
          updateMany: vi.fn(),
          findFirst: vi.fn(),
        },
        staffTask: {
          create: vi.fn(),
          updateMany: vi.fn(),
          findFirst: vi.fn(),
        },
      },
    };

    mockBookingService = {
      completeBooking: vi.fn().mockResolvedValue({ id: "bk_1", status: BookingStatus.COMPLETED }),
    };

    mockModuleRef = {
      get: vi.fn().mockReturnValue(mockBookingService),
    };

    service = new BookingTaskIntegrationService(mockPrisma, mockModuleRef as any);
  });

  it("should generate Task and StaffTask with cloned checklist items from Service template", async () => {
    mockPrisma.client.serviceBooking.findFirst.mockResolvedValue({
      id: "bk_100",
      serviceName: "Deluxe Hair Treatment",
      scheduledStartTime: new Date("2026-11-04T10:00:00.000Z"),
      scheduledEndTime: new Date("2026-11-04T11:00:00.000Z"),
      locationId: "loc_1",
      status: BookingStatus.SCHEDULED,
      service: {
        estimatedDuration: 60,
        taskChecklistTemplate: [
          { title: "Sanitize equipment", required: true },
          { title: "Consultation and hair wash", required: true },
          { title: "Post-care advice" },
        ],
      },
      customer: { name: "Alice Wonderland" },
      staff: [{ memberId: "staff_99" }],
    });

    mockPrisma.client.project.findFirst.mockResolvedValue({
      id: "prj_srv",
      key: "SRV",
      name: "Service Operations",
    });

    mockPrisma.client.task.count.mockResolvedValue(5);
    mockPrisma.client.task.create.mockImplementation(({ data }: any) => ({
      id: "tsk_created_1",
      ...data,
    }));
    mockPrisma.client.staffTask.create.mockImplementation(({ data }: any) => ({
      id: "stsk_created_1",
      ...data,
    }));

    const result = await service.generateTasksForBooking("org_1", "bk_100", {
      includeChecklist: true,
    }, "actor_1");

    expect(result.success).toBe(true);
    expect(mockPrisma.client.task.create).toHaveBeenCalled();
    expect(mockPrisma.client.staffTask.create).toHaveBeenCalled();

    const staffTaskCall = mockPrisma.client.staffTask.create.mock.calls[0][0];
    expect(staffTaskCall.data.bookingId).toBe("bk_100");
    expect(staffTaskCall.data.checklist).toHaveLength(3);
    expect(staffTaskCall.data.checklist[0].title).toBe("Sanitize equipment");
    expect(staffTaskCall.data.checklist[0].completed).toBe(false);
  });

  it("should sync task statuses on booking status change", async () => {
    mockPrisma.client.task.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.client.staffTask.updateMany.mockResolvedValue({ count: 1 });

    await service.onBookingStatusChanged("org_1", "bk_100", BookingStatus.IN_PROGRESS);

    expect(mockPrisma.client.task.updateMany).toHaveBeenCalledWith({
      where: { organizationId: "org_1", bookingId: "bk_100" },
      data: { status: ProjectTaskStatus.IN_PROGRESS },
    });
    expect(mockPrisma.client.staffTask.updateMany).toHaveBeenCalledWith({
      where: { organizationId: "org_1", bookingId: "bk_100" },
      data: { status: TaskStatus.IN_PROGRESS },
    });
  });

  it("should complete linked ServiceBooking when Task is marked completed", async () => {
    mockPrisma.client.task.findFirst.mockResolvedValue({
      bookingId: "bk_100",
    });
    mockPrisma.client.serviceBooking.findFirst.mockResolvedValue({
      id: "bk_100",
      status: BookingStatus.IN_PROGRESS,
    });

    const result = await service.onTaskCompleted("org_1", "tsk_1", "member_1", "project");

    expect(result.updated).toBe(true);
    expect(mockBookingService.completeBooking).toHaveBeenCalledWith(
      "org_1",
      "bk_100",
      "member_1",
      expect.objectContaining({ actualEndTime: expect.any(String) }),
    );
  });
});
