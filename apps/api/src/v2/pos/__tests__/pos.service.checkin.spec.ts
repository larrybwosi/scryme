import { Test, TestingModule } from "@nestjs/testing";
import { PosService } from "../pos.service";
import { PrismaService } from "@/prisma/prisma.service";
import { RedisService } from "@/redis/redis.service";
import { InventoryService } from "../../inventory/inventory.service";
import { PosCustomerService } from "../pos-customer.service";
import { V2ApiContext } from "@repo/shared/api/v2";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnauthorizedException, BadRequestException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import * as apiV2Shared from "@repo/shared/api/v2";

vi.mock("bcryptjs", async () => {
  const original = await vi.importActual<typeof import("bcryptjs")>("bcryptjs");
  return {
    ...original,
    compare: vi.fn(),
  };
});

vi.mock("@repo/shared/api/v2", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    createMemberToken: vi.fn().mockResolvedValue("mock_member_token_123"),
  };
});

describe("PosService.checkIn", () => {
  let service: PosService;
  let prisma: PrismaService;
  let redis: RedisService;

  const mockCtx: V2ApiContext = {
    organizationId: "org_123",
    locationId: "loc_123",
    permissions: [],
  };

  const mockPrisma = {
    member: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    attendanceLog: {
      create: vi.fn(),
    },
    actionAuditLog: {
      create: vi.fn(),
    },
  };

  const mockRedis = {
    get: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
    del: vi.fn(),
    ttl: vi.fn(),
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
        { provide: RedisService, useValue: mockRedis },
        { provide: InventoryService, useValue: {} },
        { provide: PosCustomerService, useValue: {} },
      ],
    }).compile();

    service = module.get<PosService>(PosService);
    prisma = module.get<PrismaService>(PrismaService);
    redis = module.get<RedisService>(RedisService);

    vi.clearAllMocks();
  });

  it("should successfully check in with a correct PIN and existing cardId", async () => {
    const mockMember = {
      id: "mem_123",
      pinHash: "$2b$10$hashed_pin_123",
      role: "CASHIER",
      isCheckedIn: false,
      currentAttendanceLogId: null,
      organizationId: "org_123",
      user: { id: "usr_123", name: "Jane Cashier", email: "jane@example.com", image: null },
    };

    vi.mocked(redis.get).mockResolvedValue(0 as any);
    vi.mocked(prisma.client.member.findFirst).mockResolvedValue(mockMember as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as any);
    vi.mocked(prisma.client.attendanceLog.create).mockResolvedValue({ id: "att_123" } as any);

    const result = await service.checkIn(mockCtx, {
      cardId: "card_123",
      pin: "1234",
    });

    expect(redis.get).toHaveBeenCalledWith("pin_attempts:org_123:card_123");
    expect(prisma.client.member.findFirst).toHaveBeenCalledWith({
      where: { cardId: "card_123", organizationId: "org_123" },
      select: expect.any(Object),
    });
    expect(bcrypt.compare).toHaveBeenCalledWith("1234", "$2b$10$hashed_pin_123");
    expect(redis.del).toHaveBeenCalledWith("pin_attempts:org_123:card_123");
    expect(prisma.client.attendanceLog.create).toHaveBeenCalled();
    expect(prisma.client.member.update).toHaveBeenCalledWith({
      where: { id: "mem_123" },
      data: {
        isCheckedIn: true,
        currentCheckInLocationId: "loc_123",
        currentAttendanceLogId: "att_123",
      },
    });

    expect(result).toEqual({
      member: {
        id: "mem_123",
        role: "CASHIER",
        user: mockMember.user,
      },
      token: "mock_member_token_123",
      restoredSession: false,
    });
  });

  it("should run comparison against dummyPinHash and rate limit if member is non-existent to avoid timing attacks", async () => {
    vi.mocked(redis.get).mockResolvedValue(0 as any);
    vi.mocked(prisma.client.member.findFirst).mockResolvedValue(null);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as any);
    vi.mocked(redis.incr).mockResolvedValue(1 as any);

    await expect(
      service.checkIn(mockCtx, {
        cardId: "non_existent_card",
        pin: "1111",
      }),
    ).rejects.toThrow(UnauthorizedException);

    // Verify bcrypt.compare was called with the dummy pin hash
    const expectedDummyHash = "$2b$10$vI8tYnK6YKMH3O84S4eXQuKBLN3F3k4pXFmF0a.a2H88tM8vO6PzO";
    expect(bcrypt.compare).toHaveBeenCalledWith("1111", expectedDummyHash);
    expect(redis.incr).toHaveBeenCalledWith("pin_attempts:org_123:non_existent_card");
    expect(redis.expire).toHaveBeenCalledWith("pin_attempts:org_123:non_existent_card", 900);
  });

  it("should fail and increment rate limit if member exists but PIN is incorrect", async () => {
    const mockMember = {
      id: "mem_123",
      pinHash: "$2b$10$hashed_pin_123",
      role: "CASHIER",
      isCheckedIn: false,
      currentAttendanceLogId: null,
      organizationId: "org_123",
      user: { id: "usr_123", name: "Jane Cashier", email: "jane@example.com", image: null },
    };

    vi.mocked(redis.get).mockResolvedValue(0 as any);
    vi.mocked(prisma.client.member.findFirst).mockResolvedValue(mockMember as any);
    vi.mocked(bcrypt.compare).mockResolvedValue(false as any);
    vi.mocked(redis.incr).mockResolvedValue(2 as any);

    await expect(
      service.checkIn(mockCtx, {
        cardId: "card_123",
        pin: "wrong_pin",
      }),
    ).rejects.toThrow(UnauthorizedException);

    expect(bcrypt.compare).toHaveBeenCalledWith("wrong_pin", "$2b$10$hashed_pin_123");
    expect(redis.incr).toHaveBeenCalledWith("pin_attempts:org_123:card_123");
    // Ensure we do not set expiration if incr return count is not 1
    expect(redis.expire).not.toHaveBeenCalled();
  });

  it("should fail fast if the rate limit key has exceeded maximum attempts limit", async () => {
    vi.mocked(redis.get).mockResolvedValue(3 as any);
    vi.mocked(redis.ttl).mockResolvedValue(600 as any);

    await expect(
      service.checkIn(mockCtx, {
        cardId: "card_123",
        pin: "1234",
      }),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.client.member.findFirst).not.toHaveBeenCalled();
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });
});
