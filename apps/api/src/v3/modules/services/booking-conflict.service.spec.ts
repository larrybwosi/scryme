import { describe, it, expect, vi, beforeEach } from "vitest";
import { BookingConflictService } from "./application/services/booking-conflict.service";

describe("BookingConflictService", () => {
  let service: BookingConflictService;
  let mockPrisma: any;
  let mockStaffSchedulingService: any;

  beforeEach(() => {
    mockPrisma = {
      client: {
        service: {
          findFirst: vi.fn(),
        },
        serviceBooking: {
          findMany: vi.fn(),
          findFirst: vi.fn(),
        },
        staffShift: {
          findMany: vi.fn(),
        },
        inventoryLocation: {
          findFirst: vi.fn(),
        },
      },
    };

    mockStaffSchedulingService = {
      checkStaffAvailability: vi.fn().mockResolvedValue({ available: true, reasons: [] }),
    };

    service = new BookingConflictService(mockPrisma, mockStaffSchedulingService);
  });

  it("should return no conflicts for a clean slot", async () => {
    mockPrisma.client.service.findFirst.mockResolvedValue({
      id: "srv_1",
      name: "Hair styling",
      estimatedDuration: 60,
      bufferTimeBefore: 0,
      bufferTimeAfter: 0,
      staff: [{ memberId: "staff_1" }],
      resources: [],
    });

    mockPrisma.client.serviceBooking.findMany.mockResolvedValue([]);
    mockPrisma.client.staffShift.findMany.mockResolvedValue([
      { startTime: "09:00", endTime: "17:00" },
    ]);
    mockPrisma.client.serviceBooking.findFirst.mockResolvedValue(null);

    const result = await service.checkConflicts("org_1", {
      serviceId: "srv_1",
      scheduledStartTime: "2026-11-04T10:00:00.000Z",
      staffIds: ["staff_1"],
    });

    expect(result.hasConflicts).toBe(false);
    expect(result.warnings).toHaveLength(0);
    expect(result.canOverride).toBe(true);
  });

  it("should detect customer double-booking", async () => {
    mockPrisma.client.service.findFirst.mockResolvedValue({
      id: "srv_1",
      name: "Hair styling",
      estimatedDuration: 60,
      bufferTimeBefore: 0,
      bufferTimeAfter: 0,
      staff: [{ memberId: "staff_1" }],
      resources: [],
    });

    mockPrisma.client.serviceBooking.findMany.mockResolvedValue([]);
    mockPrisma.client.staffShift.findMany.mockResolvedValue([
      { startTime: "09:00", endTime: "17:00" },
    ]);

    mockPrisma.client.serviceBooking.findFirst.mockResolvedValue({
      id: "existing_booking_123",
      serviceName: "Spa Session",
      scheduledStartTime: new Date("2026-11-04T10:00:00.000Z"),
      scheduledEndTime: new Date("2026-11-04T11:00:00.000Z"),
    });

    const result = await service.checkConflicts("org_1", {
      serviceId: "srv_1",
      customerId: "cust_1",
      scheduledStartTime: "2026-11-04T10:00:00.000Z",
      staffIds: ["staff_1"],
    });

    expect(result.hasConflicts).toBe(true);
    expect(result.warnings.some((w) => w.code === "CUSTOMER_DOUBLE_BOOKING")).toBe(true);
  });

  it("should detect location operating hours violation", async () => {
    mockPrisma.client.service.findFirst.mockResolvedValue({
      id: "srv_1",
      name: "Hair styling",
      estimatedDuration: 60,
      bufferTimeBefore: 0,
      bufferTimeAfter: 0,
      staff: [{ memberId: "staff_1" }],
      resources: [],
    });

    mockPrisma.client.serviceBooking.findMany.mockResolvedValue([]);
    mockPrisma.client.staffShift.findMany.mockResolvedValue([
      { startTime: "09:00", endTime: "17:00" },
    ]);
    mockPrisma.client.serviceBooking.findFirst.mockResolvedValue(null);

    mockPrisma.client.inventoryLocation.findFirst.mockResolvedValue({
      id: "loc_1",
      name: "Main Branch",
      settings: {
        operatingHours: "08:00 - 18:00",
      },
    });

    const result = await service.checkConflicts("org_1", {
      serviceId: "srv_1",
      locationId: "loc_1",
      scheduledStartTime: "2026-11-04T20:00:00.000Z",
      staffIds: ["staff_1"],
    });

    expect(result.hasConflicts).toBe(true);
    expect(result.warnings.some((w) => w.code === "LOCATION_HOURS_VIOLATION")).toBe(true);
  });

  it("should detect staff capacity overload (>100% capacity)", async () => {
    mockPrisma.client.service.findFirst.mockResolvedValue({
      id: "srv_1",
      name: "Consultation",
      estimatedDuration: 120,
      bufferTimeBefore: 0,
      bufferTimeAfter: 0,
      staff: [{ memberId: "staff_1" }],
      resources: [],
    });

    mockPrisma.client.serviceBooking.findMany.mockResolvedValue([
      {
        scheduledStartTime: new Date("2026-11-02T09:00:00.000Z"),
        scheduledEndTime: new Date("2026-11-04T00:00:00.000Z"),
      },
    ]);
    mockPrisma.client.staffShift.findMany.mockResolvedValue([
      { startTime: "09:00", endTime: "17:00" },
      { startTime: "09:00", endTime: "17:00" },
      { startTime: "09:00", endTime: "17:00" },
      { startTime: "09:00", endTime: "17:00" },
      { startTime: "09:00", endTime: "17:00" },
    ]);
    mockPrisma.client.serviceBooking.findFirst.mockResolvedValue(null);

    const result = await service.checkConflicts("org_1", {
      serviceId: "srv_1",
      scheduledStartTime: "2026-11-04T10:00:00.000Z",
      staffIds: ["staff_1"],
    });

    expect(result.hasConflicts).toBe(true);
    expect(result.warnings.some((w) => w.code === "STAFF_CAPACITY_OVERLOAD")).toBe(true);
  });
});
