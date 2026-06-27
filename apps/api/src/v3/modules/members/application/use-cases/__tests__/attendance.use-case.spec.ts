import { Test, TestingModule } from "@nestjs/testing";
import { AttendanceUseCase } from "../attendance.use-case";
import { PrismaService } from "@/prisma/prisma.service";
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("AttendanceUseCase", () => {
  let useCase: AttendanceUseCase;
  let prisma: PrismaService;

  const mockPrisma = {
    client: {
      attendanceLog: {
        findMany: vi.fn(),
        count: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      member: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      $transaction: vi.fn(cb => cb(mockPrisma.client)),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceUseCase,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    useCase = module.get<AttendanceUseCase>(AttendanceUseCase);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(useCase).toBeDefined();
  });

  describe("getAttendanceLogs", () => {
    it("should return paginated attendance logs with selected fields", async () => {
      const mockLogs = [
        {
          id: "1",
          memberId: "m1",
          checkInTime: new Date(),
          checkInLocationId: "l1",
          member: {
            id: "m1",
            user: { name: "Test Member" },
          },
          checkInLocation: { name: "Location 1" },
        },
      ];

      mockPrisma.client.attendanceLog.count.mockResolvedValue(1);
      mockPrisma.client.attendanceLog.findMany.mockResolvedValue(mockLogs);

      const result = await useCase.getAttendanceLogs("org1", {
        page: 1,
        limit: 10,
      });

      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.items[0].member.user.name).toBe("Test Member");

      // Verify that findMany was called with select
      expect(mockPrisma.client.attendanceLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            id: true,
            memberId: true,
            member: expect.objectContaining({
              select: expect.objectContaining({
                user: expect.objectContaining({
                  select: { name: true },
                }),
              }),
            }),
          }),
        }),
      );
    });
  });
});
