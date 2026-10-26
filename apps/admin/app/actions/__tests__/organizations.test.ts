import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@repo/db", () => ({
  db: {
    organization: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    subscription: {
      upsert: vi.fn(),
    },
    globalSetting: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("../auth", () => ({
  requireSuperAdmin: vi.fn().mockResolvedValue({ id: "admin_1" }),
}));

import { db } from "@repo/db";
import { toggleOrganizationPaymentOverride } from "../organizations";

describe("Admin Organization Payment Override Action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should enable payment override, set bypassPaymentCheck to true, enable all platform modules, and set subscription to ACTIVE", async () => {
    (db.organization.findUnique as any).mockResolvedValue({
      id: "org_1",
      quotaOverrides: { modules: { pos: true } },
    });
    (db.organization.update as any).mockResolvedValue({
      id: "org_1",
      quotaOverrides: { bypassPaymentCheck: true },
    });
    (db.subscription.upsert as any).mockResolvedValue({
      id: "sub_1",
      status: "ACTIVE",
    });

    await toggleOrganizationPaymentOverride("org_1", true);

    expect(db.organization.update).toHaveBeenCalledWith({
      where: { id: "org_1" },
      data: {
        quotaOverrides: expect.objectContaining({
          bypassPaymentCheck: true,
          modules: expect.objectContaining({
            pos: true,
            finance: true,
            crm: true,
            deliveries: true,
            ecommerce: true,
            services: true,
            scryme: true,
            android_app: true,
            bakery: true,
          }),
        }),
      },
    });

    expect(db.subscription.upsert).toHaveBeenCalledWith({
      where: { organizationId: "org_1" },
      update: { status: "ACTIVE" },
      create: {
        organizationId: "org_1",
        status: "ACTIVE",
      },
    });
  });

  it("should disable payment override when bypassPaymentCheck is false", async () => {
    (db.organization.findUnique as any).mockResolvedValue({
      id: "org_1",
      quotaOverrides: { bypassPaymentCheck: true, modules: {} },
    });
    (db.organization.update as any).mockResolvedValue({
      id: "org_1",
      quotaOverrides: { bypassPaymentCheck: false },
    });

    await toggleOrganizationPaymentOverride("org_1", false);

    expect(db.organization.update).toHaveBeenCalledWith({
      where: { id: "org_1" },
      data: {
        quotaOverrides: expect.objectContaining({
          bypassPaymentCheck: false,
        }),
      },
    });

    expect(db.subscription.upsert).not.toHaveBeenCalled();
  });
});
