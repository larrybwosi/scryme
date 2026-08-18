import { Test, TestingModule } from "@nestjs/testing";
import { PosService } from "../pos.service";
import { PrismaService } from "@/prisma/prisma.service";
import { RedisService } from "@/redis/redis.service";
import { InventoryService } from "../../inventory/inventory.service";
import { PosCustomerService } from "../pos-customer.service";
import { V2ApiContext } from "@repo/shared/api/v2";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BadRequestException, UnauthorizedException } from "@nestjs/common";

describe("PosService.checkOut Security (IDOR)", () => {
  let service: PosService;

  const mockCtx: V2ApiContext = {
    organizationId: "org_123",
    memberId: "mem_123",
    locationId: "loc_123",
    permissions: [],
  };

  const mockTx = {
    member: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    attendanceLog: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    actionAuditLog: {
      create: vi.fn(),
    },
  };

  const mockPrisma = {
    $transaction: vi.fn((cb) => cb(mockTx)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PosService,
        {
          provide: PrismaService,
          useValue: {
            client: mockPrisma,
          },
        },
        { provide: RedisService, useValue: {} },
        { provide: InventoryService, useValue: {} },
        { provide: PosCustomerService, useValue: {} },
      ],
    }).compile();

    service = module.get<PosService>(PosService);
    vi.clearAllMocks();
  });

  it("should scope attendanceLog lookup by organizationId to prevent IDOR", async () => {
    mockTx.member.findUnique.mockResolvedValue({
      id: "mem_123",
      isCheckedIn: true,
      currentAttendanceLogId: "att_123",
    });

    const checkInTime = new Date(Date.now() - 3600000);
    mockTx.attendanceLog.findFirst.mockResolvedValue({
      id: "att_123",
      organizationId: "org_123",
      checkInTime,
      checkOutTime: null,
    });

    const result = await service.checkOut(mockCtx, { locationId: "loc_123" });

    expect(mockTx.attendanceLog.findFirst).toHaveBeenCalledWith({
      where: { id: "att_123", organizationId: "org_123" },
    });
    expect(result).toEqual({ message: "Check-out successful." });
  });

  it("should fail if active attendance log belongs to another organization", async () => {
    mockTx.member.findUnique.mockResolvedValue({
      id: "mem_123",
      isCheckedIn: true,
      currentAttendanceLogId: "att_foreign_123",
    });

    // findFirst returns null because organizationId: "org_123" does not match the foreign log
    mockTx.attendanceLog.findFirst.mockResolvedValue(null);

    await expect(
      service.checkOut(mockCtx, { locationId: "loc_123" }),
    ).rejects.toThrow(BadRequestException);

    expect(mockTx.attendanceLog.findFirst).toHaveBeenCalledWith({
      where: { id: "att_foreign_123", organizationId: "org_123" },
    });
  });
});
