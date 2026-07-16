import { Test, TestingModule } from "@nestjs/testing";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { BusinessAccountService } from "./business-account.service";
import { PrismaService } from "@/prisma/prisma.service";
import { CrmSyncService } from "../../../crm/infrastructure/services/crm-sync.service";

describe("BusinessAccountService", () => {
  let service: BusinessAccountService;
  let prisma: any;
  let crmSyncService: any;

  beforeEach(async () => {
    prisma = {
      client: {
        businessAccount: {
          create: vi.fn(),
          update: vi.fn(),
          findFirst: vi.fn(),
        },
        inventoryLocation: {
          findFirst: vi.fn(),
        },
      },
    };

    crmSyncService = {
      enqueueSyncBusinessAccount: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessAccountService,
        { provide: PrismaService, useValue: prisma },
        { provide: CrmSyncService, useValue: crmSyncService },
      ],
    }).compile();

    service = module.get<BusinessAccountService>(BusinessAccountService);
  });

  it("should create a business account and trigger CRM sync", async () => {
    const orgId = "org-123";
    const dto = {
      name: "Acme Corp",
      taxId: "TAX-123",
      crmRecordId: "hack-id",
    } as any;

    const mockBA = {
      id: "ba-123",
      name: dto.name,
      taxId: dto.taxId,
      organizationId: orgId,
    };

    prisma.client.businessAccount.create.mockResolvedValue(mockBA);
    crmSyncService.enqueueSyncBusinessAccount.mockResolvedValue({});

    const result = await service.createBusinessAccount(orgId, dto);

    expect(prisma.client.businessAccount.create).toHaveBeenCalledWith({
      data: {
        name: "Acme Corp",
        taxId: "TAX-123",
        defaultLocationId: undefined,
        organizationId: orgId,
      },
    });
    expect(crmSyncService.enqueueSyncBusinessAccount).toHaveBeenCalledWith(
      orgId,
      "ba-123",
    );
    expect(result.id).toBe("ba-123");
  });

  it("should create a business account with valid defaultLocationId", async () => {
    const orgId = "org-123";
    const dto = {
      name: "Acme Corp",
      defaultLocationId: "loc-123",
    };

    prisma.client.inventoryLocation.findFirst.mockResolvedValue({ id: "loc-123" });
    prisma.client.businessAccount.create.mockResolvedValue({
      id: "ba-123",
      ...dto,
      organizationId: orgId,
    });

    const result = await service.createBusinessAccount(orgId, dto);

    expect(prisma.client.inventoryLocation.findFirst).toHaveBeenCalledWith({
      where: { id: "loc-123", organizationId: orgId },
      select: { id: true },
    });
    expect(result.defaultLocationId).toBe("loc-123");
  });

  it("should throw NotFoundException if defaultLocationId does not belong to organization", async () => {
    const orgId = "org-123";
    const dto = {
      name: "Acme Corp",
      defaultLocationId: "loc-wrong",
    };

    prisma.client.inventoryLocation.findFirst.mockResolvedValue(null);

    await expect(service.createBusinessAccount(orgId, dto)).rejects.toThrow(
      "Location not found",
    );
  });
});
