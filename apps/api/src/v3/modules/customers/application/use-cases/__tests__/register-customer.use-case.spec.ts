import { describe, it, expect, beforeEach, vi } from "vitest";
import { RegisterCustomerUseCase } from "../register-customer.use-case";
import { PrismaService } from "@/prisma/prisma.service";
import { ZitadelService } from "@repo/zitadel/server";
import { CrmSyncService } from "../../../../crm/infrastructure/services/crm-sync.service";

vi.mock("@repo/zitadel/server", () => ({
  ZitadelService: vi.fn().mockImplementation(function (this: any) {
    this.getUser = vi.fn().mockResolvedValue({ id: "zit-123" });
    return this;
  }),
}));

vi.mock("@repo/windmill/server", () => ({
  emitCustomerCreated: vi.fn().mockResolvedValue({}),
}));

describe("RegisterCustomerUseCase", () => {
  let useCase: RegisterCustomerUseCase;
  let prisma: PrismaService;
  let customerRepository: any;
  let crmSyncService: CrmSyncService;

  beforeEach(() => {
    prisma = {
      client: {
        $transaction: vi.fn((cb) => cb(prisma.client)),
        externalMapping: {
          findFirst: vi.fn(),
          create: vi.fn(),
        },
        customer: {
          upsert: vi.fn(),
        },
        address: {
          findFirst: vi.fn(),
          create: vi.fn(),
        },
      },
    } as any;

    customerRepository = {};
    crmSyncService = {
      enqueueSyncCustomer: vi.fn().mockResolvedValue({}),
    } as any;

    useCase = new RegisterCustomerUseCase(
      customerRepository,
      prisma,
      crmSyncService,
    );
  });

  it("should register a customer successfully", async () => {
    const organizationId = "org-123";
    const dto = {
      zitadelUserId: "zit-123",
      name: "John Doe",
      email: "john@example.com",
    };

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
    expect(prisma.client.customer.upsert).toHaveBeenCalled();
    expect(crmSyncService.enqueueSyncCustomer).toHaveBeenCalled();
  });
});
