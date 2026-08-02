import { describe, it, expect, beforeEach, vi } from "vitest";
import { RegisterCustomerUseCase } from "../register-customer.use-case";
import { PrismaService } from "@/prisma/prisma.service";
// import { ZitadelService } from "@repo/zitadel/server";
import { CrmSyncService } from "../../../../crm/infrastructure/services/crm-sync.service";

vi.mock("@repo/zitadel", () => {
  return {
    ZitadelService: vi.fn().mockImplementation(function () {
      return {
        getUser: vi.fn().mockResolvedValue({ id: "zit-123" }),
      };
    }),
  };
});

vi.mock("@repo/windmill/server", () => ({
  emitCustomerCreated: vi.fn().mockResolvedValue({}),
}));

describe("RegisterCustomerUseCase", () => {
  let useCase: RegisterCustomerUseCase;
  let prisma: PrismaService;
  let customerRepository: any;
  let crmSyncService: CrmSyncService;
  let loyaltyService: any;

  beforeEach(() => {
    prisma = {
      client: {
        $transaction: vi.fn(cb => cb(prisma.client)),
        externalMapping: {
          findFirst: vi.fn(),
          create: vi.fn(),
        },
        customer: {
          upsert: vi.fn(),
          findFirst: vi.fn(),
          findUnique: vi.fn(),
        },
        address: {
          findFirst: vi.fn(),
          create: vi.fn(),
        },
        zitadelConfiguration: {
          findUnique: vi.fn(),
        },
      },
    } as any;

    customerRepository = {};
    crmSyncService = {
      enqueueSyncCustomer: vi.fn().mockResolvedValue({}),
    } as any;

    loyaltyService = {
      handleCustomerSignup: vi.fn().mockResolvedValue({}),
    };

    useCase = new RegisterCustomerUseCase(
      customerRepository,
      prisma,
      crmSyncService,
      loyaltyService,
    );
  });

  it("should register a customer successfully with Zitadel CONNECTED", async () => {
    const organizationId = "org-123";
    const dto = {
      zitadelUserId: "zit-123",
      name: "John Doe",
      email: "john@example.com",
    };

    vi.mocked(prisma.client.zitadelConfiguration.findUnique).mockResolvedValue({
      id: "config-123",
      organizationId,
      connectionStatus: "CONNECTED",
    } as any);
    vi.mocked(prisma.client.externalMapping.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.client.customer.upsert).mockResolvedValue({
      id: "cust-123",
      name: "John Doe",
      email: "john@example.com",
      phone: "+254700000000",
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const result = await useCase.execute(organizationId, dto);

    expect(result.name).toBe("John Doe");
    expect(prisma.client.zitadelConfiguration.findUnique).toHaveBeenCalledWith({
      where: { organizationId },
    });
    expect(prisma.client.customer.upsert).toHaveBeenCalled();
    expect(crmSyncService.enqueueSyncCustomer).toHaveBeenCalled();
    expect(loyaltyService.handleCustomerSignup).toHaveBeenCalledWith(
      organizationId,
      expect.any(String),
    );
  });

  it("should gracefully proceed with local registration when Zitadel is disconnected or unprovisioned", async () => {
    const organizationId = "org-123";
    const dto = {
      zitadelUserId: "zit-123",
      name: "John Doe Fallback",
      email: "john_fallback@example.com",
    };

    vi.mocked(prisma.client.zitadelConfiguration.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.client.externalMapping.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.client.customer.upsert).mockResolvedValue({
      id: "cust-123",
      name: "John Doe Fallback",
      email: "john_fallback@example.com",
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const result = await useCase.execute(organizationId, dto);

    expect(result.name).toBe("John Doe Fallback");
    expect(prisma.client.customer.upsert).toHaveBeenCalled();
  });

  it("should register a customer successfully without a zitadelUserId", async () => {
    const organizationId = "org-123";
    const dto = {
      name: "Standard Customer",
      email: "standard@example.com",
    };

    vi.mocked(prisma.client.customer.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.client.customer.upsert).mockResolvedValue({
      id: "cust-standard",
      name: "Standard Customer",
      email: "standard@example.com",
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const result = await useCase.execute(organizationId, dto);

    expect(result.name).toBe("Standard Customer");
    expect(prisma.client.customer.upsert).toHaveBeenCalled();
    expect(crmSyncService.enqueueSyncCustomer).toHaveBeenCalled();
    expect(loyaltyService.handleCustomerSignup).toHaveBeenCalledWith(
      organizationId,
      expect.any(String),
    );
  });
});
