import { describe, it, expect, vi, beforeEach } from "vitest";
import { SchedulingUseCase } from "../application/use-cases/scheduling.use-case";

describe("Unified Scheduling & Calendar Events", () => {
  let schedulingUseCase: SchedulingUseCase;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      client: {
        task: {
          findMany: vi.fn(),
          updateMany: vi.fn(),
        },
        projectMilestone: {
          findMany: vi.fn(),
        },
        batch: {
          findMany: vi.fn(),
          updateMany: vi.fn(),
        },
        fulfillment: {
          findMany: vi.fn(),
          updateMany: vi.fn(),
        },
        crmFollowUp: {
          findMany: vi.fn(),
          updateMany: vi.fn(),
        },
        staffShift: {
          findMany: vi.fn(),
          updateMany: vi.fn(),
        },
      },
    };

    schedulingUseCase = new SchedulingUseCase(mockPrisma);
  });

  it("should aggregate cross-system events across tasks, production, deliveries, crm, and shifts", async () => {
    const orgId = "org-123";
    const now = new Date("2026-11-02T10:00:00Z");

    // 1. Task mock
    mockPrisma.client.task.findMany.mockResolvedValue([
      {
        id: "task-1",
        title: "Frontend Refactoring",
        status: "IN_PROGRESS",
        priority: "HIGH",
        dueDate: now,
        startDate: now,
        projectId: "proj-1",
        project: { id: "proj-1", name: "Alpha", key: "ALP" },
        taskKey: "ALP-1",
        assignees: [
          {
            member: {
              id: "mem-1",
              user: { name: "Alice", email: "alice@example.com" },
            },
          },
        ],
      },
    ]);

    // 2. Milestone mock
    mockPrisma.client.projectMilestone.findMany.mockResolvedValue([
      {
        id: "ms-1",
        title: "MVP Release",
        status: "OPEN",
        dueDate: now,
        projectId: "proj-1",
        project: { id: "proj-1", name: "Alpha", key: "ALP" },
      },
    ]);

    // 3. Production Batch mock
    mockPrisma.client.batch.findMany.mockResolvedValue([
      {
        id: "batch-1",
        batchNumber: "B-2026-001",
        status: "PLANNED",
        runType: "MAKE_TO_STOCK",
        scheduledStartAt: now,
        plannedQuantity: 150,
        recipe: { id: "rec-1", name: "Sourdough Bread", category: "BREAD" },
        leadBaker: {
          id: "baker-1",
          member: { user: { name: "Baker Bob", email: "bob@example.com" } },
        },
      },
    ]);

    // 4. Fulfillment / Delivery mock
    mockPrisma.client.fulfillment.findMany.mockResolvedValue([
      {
        id: "ful-1",
        status: "IN_TRANSIT",
        trackingNumber: "TRK-9901",
        createdAt: now,
        driver: { id: "drv-1", name: "Dave Driver", phone: "+123456789" },
        transaction: {
          id: "tx-101",
          customer: { name: "Acme Groceries", phone: "+987654321" },
        },
      },
    ]);

    // 5. CRM FollowUp mock
    mockPrisma.client.crmFollowUp.findMany.mockResolvedValue([
      {
        id: "crm-1",
        type: "CALL",
        title: "Quarterly Review Call",
        status: "PENDING",
        priority: "HIGH",
        dueDate: now,
        record: {
          id: "rec-1",
          data: { name: "Enterprise Client Corp" },
          objectDefinition: { name: "Lead" },
        },
        assignedTo: {
          id: "mem-2",
          user: { name: "Charlie Sales", email: "charlie@example.com" },
        },
      },
    ]);

    // 6. Staff Shift mock
    mockPrisma.client.staffShift.findMany.mockResolvedValue([
      {
        id: "shift-1",
        dayOfWeek: now.getDay(),
        startTime: "08:00",
        endTime: "16:00",
        isActive: true,
        member: {
          id: "mem-1",
          user: { name: "Alice", email: "alice@example.com" },
        },
      },
    ]);

    const result = await schedulingUseCase.getUnifiedCalendarEvents(orgId, {
      from: "2026-11-01T00:00:00Z",
      to: "2026-11-05T00:00:00Z",
    });

    expect(result).toBeDefined();
    expect(result.counts.tasks).toBe(1);
    expect(result.counts.production).toBe(1);
    expect(result.counts.deliveries).toBe(1);
    expect(result.counts.crm).toBe(1);
    expect(result.counts.shifts).toBeGreaterThanOrEqual(1);

    const categories = result.events.map((e: any) => e.category);
    expect(categories).toContain("task");
    expect(categories).toContain("milestone");
    expect(categories).toContain("production");
    expect(categories).toContain("delivery");
    expect(categories).toContain("crm");
    expect(categories).toContain("shift");
  });

  it("should update status for unified events according to category", async () => {
    const orgId = "org-123";

    // Task transition
    mockPrisma.client.task.updateMany.mockResolvedValue({ count: 1 });
    const taskUpdate = await schedulingUseCase.updateUnifiedEventStatus(
      orgId,
      "task-abc-123",
      { category: "task", status: "DONE" }
    );
    expect(taskUpdate.success).toBe(true);
    expect(mockPrisma.client.task.updateMany).toHaveBeenCalledWith({
      where: { id: "abc", organizationId: orgId },
      data: { status: "DONE" },
    });

    // Production batch transition
    mockPrisma.client.batch.updateMany.mockResolvedValue({ count: 1 });
    const batchUpdate = await schedulingUseCase.updateUnifiedEventStatus(
      orgId,
      "production-batch-101",
      { category: "production", status: "COMPLETED" }
    );
    expect(batchUpdate.success).toBe(true);
    expect(mockPrisma.client.batch.updateMany).toHaveBeenCalled();

    // Delivery transition
    mockPrisma.client.fulfillment.updateMany.mockResolvedValue({ count: 1 });
    const deliveryUpdate = await schedulingUseCase.updateUnifiedEventStatus(
      orgId,
      "delivery-ful-55",
      { category: "delivery", status: "DELIVERED", notes: "Handed over to manager" }
    );
    expect(deliveryUpdate.success).toBe(true);
    expect(mockPrisma.client.fulfillment.updateMany).toHaveBeenCalledWith({
      where: { id: "ful", transaction: { organizationId: orgId } },
      data: { status: "DELIVERED", deliveryNotes: "Handed over to manager" },
    });
  });
});
