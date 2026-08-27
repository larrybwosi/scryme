import { Test, TestingModule } from "@nestjs/testing";
import { AndroidController } from "./android.controller";
import { PrismaService } from "@/prisma/prisma.service";
import { AuthService } from "@/auth/auth.service";
import { MemberUseCase } from "../v3/modules/members/application/use-cases/member.use-case";
import { AttendanceUseCase } from "../v3/modules/members/application/use-cases/attendance.use-case";
import { ExpenseUseCase } from "../v3/modules/finance/application/use-cases/expense.use-case";
import { GetTransactionsUseCase } from "../v3/modules/pos/application/use-cases/get-transactions.use-case";
import { RegisterPettyCashUseCase } from "../v3/modules/pos/application/use-cases/register-petty-cash.use-case";
import { ReviewPriceChangeUseCase } from "../v3/modules/catalog/application/use-cases/review-price-change.use-case";
import {
  GetStockAdjustmentsUseCase,
  ApproveStockAdjustmentUseCase,
  RejectStockAdjustmentUseCase,
} from "../v3/modules/inventory/application/use-cases/adjustment-workflow.use-case";
import { StaffSchedulingService } from "../v3/modules/services/application/services/staff-scheduling.service";

describe("AndroidController", () => {
  let controller: AndroidController;
  let prisma: PrismaService;

  const mockPrisma = {
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
  };

  const mockAuthService = {};
  const mockMemberUseCase = {};
  const mockAttendanceUseCase = {};
  const mockExpenseUseCase = {};
  const mockGetTransactionsUseCase = {};
  const mockRegisterPettyCashUseCase = {};
  const mockReviewPriceChangeUseCase = {};
  const mockGetStockAdjustmentsUseCase = {};
  const mockApproveStockAdjustmentUseCase = {};
  const mockRejectStockAdjustmentUseCase = {};
  const mockStaffSchedulingService = {
    getShifts: vi.fn(),
    createShift: vi.fn(),
    addBreak: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AndroidController],
      providers: [
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuthService, useValue: mockAuthService },
        { provide: MemberUseCase, useValue: mockMemberUseCase },
        { provide: AttendanceUseCase, useValue: mockAttendanceUseCase },
        { provide: ExpenseUseCase, useValue: mockExpenseUseCase },
        { provide: GetTransactionsUseCase, useValue: mockGetTransactionsUseCase },
        { provide: RegisterPettyCashUseCase, useValue: mockRegisterPettyCashUseCase },
        { provide: ReviewPriceChangeUseCase, useValue: mockReviewPriceChangeUseCase },
        { provide: GetStockAdjustmentsUseCase, useValue: mockGetStockAdjustmentsUseCase },
        { provide: ApproveStockAdjustmentUseCase, useValue: mockApproveStockAdjustmentUseCase },
        { provide: RejectStockAdjustmentUseCase, useValue: mockRejectStockAdjustmentUseCase },
        { provide: StaffSchedulingService, useValue: mockStaffSchedulingService },
      ],
    }).compile();

    controller = module.get<AndroidController>(AndroidController);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getDashboardAnalytics", () => {
    it("should fetch dashboard analytics correctly and use Map-based O(N+M) branch stats calculation", async () => {
      const mockReq = {
        v3Context: {
          organizationId: "org-123",
          memberId: "mem-456",
        },
      };

      mockPrisma.client.member.count.mockResolvedValue(5);

      const mockLogs = [
        { checkInTime: new Date("2023-01-01T08:30:00.000Z") },
        { checkInTime: new Date("2023-01-01T08:45:00.000Z") },
        { checkInTime: new Date("2023-01-01T09:15:00.000Z") },
      ];
      mockPrisma.client.attendanceLog.findMany
        .mockResolvedValueOnce(mockLogs) // First call (logs for hour counts)
        .mockResolvedValueOnce([
          { checkInLocationId: "loc-1", durationMinutes: 60 },
          { checkInLocationId: "loc-1", durationMinutes: 120 },
        ]); // Second call (completed logs)

      const mockLocations = [
        {
          id: "loc-1",
          name: "Lagos Branch",
          checkInAttendanceLogs: [{ id: "presence-1" }],
        },
        {
          id: "loc-2",
          name: "Nairobi Branch",
          checkInAttendanceLogs: [],
        },
      ];
      mockPrisma.client.inventoryLocation.findMany.mockResolvedValue(mockLocations);

      const result = await controller.getDashboardAnalytics(mockReq);

      expect(mockPrisma.client.member.count).toHaveBeenCalledWith({
        where: { organizationId: "org-123", isCheckedIn: true, deletedAt: null },
      });

      expect(result.success).toBe(true);
      expect(result.data.totalCheckedInNow).toBe(5);

      // Verify peak hours categorization
      expect(result.data.peakHours).toEqual([
        { hour: 8, count: 2 },
        { hour: 9, count: 1 },
      ]);

      // Verify Lagos stats (average: (60 + 120) / 2 = 90)
      expect(result.data.branchStats).toHaveLength(2);
      expect(result.data.branchStats[0]).toEqual({
        locationId: "loc-1",
        locationName: "Lagos Branch",
        activePresenceCount: 1,
        averageDurationMinutes: 90,
      });

      // Verify Nairobi stats (no completed logs -> average: 0)
      expect(result.data.branchStats[1]).toEqual({
        locationId: "loc-2",
        locationName: "Nairobi Branch",
        activePresenceCount: 0,
        averageDurationMinutes: 0,
      });
    });
  });
});
