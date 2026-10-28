import { ModuleAccessService } from "../module-access.service";

describe("ModuleAccessService", () => {
  let service: ModuleAccessService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      client: {
        globalSetting: {
          findUnique: jest.fn(),
        },
        organization: {
          findUnique: jest.fn(),
        },
      },
    };
    service = new ModuleAccessService(prisma);
  });

  it("should evaluate all modules as enabled by default when no settings exist", async () => {
    prisma.client.globalSetting.findUnique.mockResolvedValue(null);
    prisma.client.organization.findUnique.mockResolvedValue(null);

    const res = await service.getAllModulesAccess("org-123");
    expect(res.length).toBeGreaterThan(0);
    expect(res.every((m) => m.isEnabled)).toBe(true);
  });

  it("should disable module when globally disabled in system settings", async () => {
    prisma.client.globalSetting.findUnique.mockResolvedValue({
      value: JSON.stringify({ finance: false }),
    });
    prisma.client.organization.findUnique.mockResolvedValue(null);

    const res = await service.getAllModulesAccess("org-123");
    const finance = res.find((m) => m.moduleKey === "finance");
    expect(finance?.isEnabled).toBe(false);
    expect(finance?.systemEnabled).toBe(false);
  });

  it("should respect payment check override on organization", async () => {
    prisma.client.globalSetting.findUnique.mockResolvedValue({
      value: JSON.stringify({ finance: false }),
    });
    prisma.client.organization.findUnique.mockResolvedValue({
      quotaOverrides: { bypassPaymentCheck: true },
    });

    const res = await service.getAllModulesAccess("org-123");
    const finance = res.find((m) => m.moduleKey === "finance");
    expect(finance?.isEnabled).toBe(true);
    expect(finance?.reason).toBe("Organization payment override enabled");
  });
});
