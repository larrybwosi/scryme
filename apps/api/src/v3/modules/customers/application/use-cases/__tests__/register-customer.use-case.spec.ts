import { describe, it, expect, beforeEach, vi } from "vitest";
import { RegisterCustomerUseCase } from "../register-customer.use-case";
import { PrismaService } from "@/prisma/prisma.service";

vi.mock("@repo/shared/server", () => ({
  emitCustomerCreated: vi.fn().mockResolvedValue({}),
}));

describe("RegisterCustomerUseCase", () => {
  let useCase: RegisterCustomerUseCase;
  let prisma: PrismaService;
  let customerRepository: any;
  let crmSyncService: any;
  let loyaltyService: any;

  beforeEach(() => {
    prisma = {
      client: {
        $transaction: vi.fn(cb => cb(prisma.client)),
        customer: {
          findFirst: vi.fn(),
          findUnique: vi.fn(),
          upsert: vi.fn(),
        },
        user: {
          upsert: vi.fn(),
        },
        address: {
          findFirst: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
        },
        v3ApiClient: {
          findUnique: vi.fn(),
        },
        organizationIntegration: {
          findFirst: vi.fn(),
        },
        externalMapping: {
          upsert: vi.fn(),
        },
      },
    } as any;

    customerRepository = {} as any;
    crmSyncService = {
      enqueueSyncCustomer: vi.fn().mockResolvedValue({}),
    } as any;
    loyaltyService = {
      handleCustomerSignup: vi.fn().mockResolvedValue({}),
    } as any;

    useCase = new RegisterCustomerUseCase(
      customerRepository,
      prisma,
      crmSyncService,
      loyaltyService,
    );
  });

  it("should register a customer successfully", async () => {
    const orgId = "org-123";
    const dto = {
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
    };

    vi.mocked(prisma.client.customer.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.client.customer.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.client.customer.upsert).mockResolvedValue({
      id: "cust-123",
      name: dto.name,
      email: dto.email,
      organizationId: orgId,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const result = await useCase.execute(orgId, dto);

    expect(result.name).toBe("John Doe");
    expect(result.email).toBe("john@example.com");
    expect(prisma.client.user.upsert).toHaveBeenCalled();
    expect(prisma.client.customer.upsert).toHaveBeenCalled();
  });
});
