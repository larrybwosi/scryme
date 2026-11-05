import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getKRAConfigAction,
  saveKRAConfigAction,
  validateKRAPinAction,
  retryKRAAction,
} from "../kra";
import { getServerAuth } from "@repo/auth/server";
import { prisma as db } from "@repo/db";
import { kraService } from "@repo/shared/kra";

vi.mock("@repo/auth/server", () => ({
  getServerAuth: vi.fn(),
}));

vi.mock("@repo/db", () => ({
  prisma: {
    kRAComplianceLog: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock("@repo/shared/kra", () => ({
  kraService: {
    getConfiguration: vi.fn(),
    saveConfiguration: vi.fn(),
    validatePin: vi.fn(),
    retrySubmission: vi.fn(),
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("KRA Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should enforce tenant authentication on getKRAConfigAction", async () => {
    vi.mocked(getServerAuth).mockResolvedValue(null as any);
    await expect(getKRAConfigAction()).rejects.toThrow("Unauthorized");
  });

  it("should get KRA configuration for authenticated organization", async () => {
    vi.mocked(getServerAuth).mockResolvedValue({
      organizationId: "org-1",
      user: { id: "user-1" },
    } as any);

    const mockConfig = {
      organizationId: "org-1",
      kraPin: "P051123456Z",
      provider: "NAVARI",
    };
    vi.mocked(kraService.getConfiguration).mockResolvedValue(mockConfig as any);

    const res = await getKRAConfigAction();
    expect(res).toEqual(mockConfig);
    expect(kraService.getConfiguration).toHaveBeenCalledWith("org-1");
  });

  it("should save KRA configuration and validate required PIN", async () => {
    vi.mocked(getServerAuth).mockResolvedValue({
      organizationId: "org-1",
      user: { id: "user-1" },
    } as any);

    await expect(
      saveKRAConfigAction({
        provider: "NAVARI",
        environment: "SANDBOX",
        enforcementMode: "ASYNC",
        kraPin: "",
      }),
    ).rejects.toThrow("KRA PIN is required");
  });

  it("should prevent unauthorized log retry if tenant does not own the log", async () => {
    vi.mocked(getServerAuth).mockResolvedValue({
      organizationId: "org-1",
      user: { id: "user-1" },
    } as any);

    vi.mocked(db.kRAComplianceLog.findFirst).mockResolvedValue(null);

    await expect(retryKRAAction("log-other-tenant")).rejects.toThrow(
      "Log not found or unauthorized",
    );
  });
});
