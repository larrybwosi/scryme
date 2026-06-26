import { Test, TestingModule } from "@nestjs/testing";
import { AttendanceScheduler } from "../attendance.scheduler";
import { PrismaService } from "@/prisma/prisma.service";
import { AttendanceUseCase } from "../../use-cases/attendance.use-case";
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("AttendanceScheduler", () => {
  let scheduler: AttendanceScheduler;
  let prisma: PrismaService;
  let attendanceUseCase: AttendanceUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceScheduler,
        {
          provide: PrismaService,
          useValue: {
            client: {
              organization: {
                findMany: vi.fn(),
              },
              attendanceLog: {
                findMany: vi.fn(),
                update: vi.fn(),
              },
            },
          },
        },
        {
          provide: AttendanceUseCase,
          useValue: {
            checkOut: vi.fn(),
          },
        },
      ],
    }).compile();

    scheduler = module.get<AttendanceScheduler>(AttendanceScheduler);
    prisma = module.get<PrismaService>(PrismaService);
    attendanceUseCase = module.get<AttendanceUseCase>(AttendanceUseCase);
  });

  it("should be defined", () => {
    expect(scheduler).toBeDefined();
  });

  it("should process auto-checkout for organizations at midnight", async () => {
    const orgId = "org-1";

    // Mock active orgs search
    vi.mocked(prisma.client.attendanceLog.findMany).mockResolvedValueOnce([
      { organizationId: orgId },
    ] as any);

    vi.mocked(prisma.client.organization.findMany).mockResolvedValue([
      {
        id: orgId,
        settings: {
          enableAutoCheckout: false,
          autoCheckoutTime: null,
          defaultTimezone: "UTC",
        },
      },
    ] as any);

    // Mock Date to be exactly midnight
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));

    // Mock fetching active logs for the org
    vi.mocked(prisma.client.attendanceLog.findMany).mockResolvedValueOnce([
      { id: "log-1", memberId: "member-1" },
    ] as any);

    await scheduler.handleAutoCheckout();

    expect(attendanceUseCase.checkOut).toHaveBeenCalledWith(orgId, "member-1", {
      notes: "Auto-checkout by system",
      isAutoCheckout: true,
    });

    vi.useRealTimers();
  });

  it("should not process auto-checkout if it's not the scheduled time", async () => {
    const orgId = "org-1";

    // Mock active orgs search
    vi.mocked(prisma.client.attendanceLog.findMany).mockResolvedValueOnce([
      { organizationId: orgId },
    ] as any);

    vi.mocked(prisma.client.organization.findMany).mockResolvedValue([
      {
        id: orgId,
        settings: {
          enableAutoCheckout: false,
          autoCheckoutTime: null,
          defaultTimezone: "UTC",
        },
      },
    ] as any);

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T12:00:00Z"));

    await scheduler.handleAutoCheckout();

    expect(attendanceUseCase.checkOut).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it("should use custom auto-checkout time if enabled", async () => {
    const orgId = "org-1";

    // Mock active orgs search
    vi.mocked(prisma.client.attendanceLog.findMany).mockResolvedValueOnce([
      { organizationId: orgId },
    ] as any);

    vi.mocked(prisma.client.organization.findMany).mockResolvedValue([
      {
        id: orgId,
        settings: {
          enableAutoCheckout: true,
          autoCheckoutTime: "17:00",
          defaultTimezone: "UTC",
        },
      },
    ] as any);

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T17:00:00Z"));

    // Mock fetching active logs for the org
    vi.mocked(prisma.client.attendanceLog.findMany).mockResolvedValueOnce([
      { id: "log-1", memberId: "member-1" },
    ] as any);

    await scheduler.handleAutoCheckout();

    expect(attendanceUseCase.checkOut).toHaveBeenCalledWith(orgId, "member-1", {
      notes: "Auto-checkout by system",
      isAutoCheckout: true,
    });

    vi.useRealTimers();
  });
});
