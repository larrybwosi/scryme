import { describe, it, expect, beforeEach, vi } from "vitest";
import { RegisterCustomerUseCase } from "../register-customer.use-case";
import { PrismaService } from "@/prisma/prisma.service";

vi.mock("@repo/windmill/server", () => ({
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
          findUnique: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
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
    vi.mocked(prisma.client.user.findUnique).mockResolvedValue(null);
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
    expect(prisma.client.user.create).toHaveBeenCalled();
    expect(prisma.client.customer.upsert).toHaveBeenCalled();
  });

  it("should throw BadRequestException if an account with the email already exists and has a password", async () => {
    const orgId = "org-123";
    const dto = {
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
    };

    vi.mocked(prisma.client.customer.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.client.customer.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.client.user.findUnique).mockResolvedValue({
      id: "user-123",
      email: "john@example.com",
      password: "already_hashed_password",
    } as any);

    await expect(useCase.execute(orgId, dto)).rejects.toThrowError(
      "An account with this email already exists"
    );

    expect(prisma.client.user.create).not.toHaveBeenCalled();
    expect(prisma.client.user.update).not.toHaveBeenCalled();
  });

  it("should allow setting password if user exists but has no password", async () => {
    const orgId = "org-123";
    const dto = {
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
    };

    vi.mocked(prisma.client.customer.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.client.customer.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.client.user.findUnique).mockResolvedValue({
      id: "user-123",
      email: "john@example.com",
      password: null,
    } as any);
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
    expect(prisma.client.user.update).toHaveBeenCalled();
    expect(prisma.client.user.create).not.toHaveBeenCalled();
  });
});
