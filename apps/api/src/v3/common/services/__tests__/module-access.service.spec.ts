import { ModuleAccessService } from "../module-access.service";
import { PrismaService } from "@/prisma/prisma.service";

describe("ModuleAccessService", () => {
  let service: ModuleAccessService;
  let prisma: PrismaService;

  beforeEach(() => {
    prisma = {
      client: {
        globalSetting: {
          findUnique: vi.fn(),
        },
        organization: {
          findUnique: vi.fn(),
        },
      },
    } as any;

    service = new ModuleAccessService(prisma);
  });

  it("should return isEnabled: true when bypassPaymentCheck is enabled on organization", async () => {
    (prisma.client.globalSetting.findUnique as any).mockResolvedValue(null);
    (prisma.client.organization.findUnique as any).mockResolvedValue({
      quotaOverrides: { bypassPaymentCheck: true },
    });

    const result = await service.checkModuleAccess("org-1", "finance");
    expect(result.isEnabled).toBe(true);
    expect(result.reason).toBe("Organization payment override enabled");
  });

  it("should respect module flags when bypassPaymentCheck is false", async () => {
    (prisma.client.globalSetting.findUnique as any).mockResolvedValue(null);
    (prisma.client.organization.findUnique as any).mockResolvedValue({
      quotaOverrides: { bypassPaymentCheck: false, modules: { finance: false } },
    });

    const result = await service.checkModuleAccess("org-1", "finance");
    expect(result.isEnabled).toBe(false);
  });
});
