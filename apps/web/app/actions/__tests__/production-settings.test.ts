import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@repo/auth/server", () => ({
  getServerAuth: vi.fn(),
}));

vi.mock("@repo/db", () => ({
  db: {
    productionSettings: {
      findUnique: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
    bakerySettings: {
      findUnique: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import { getServerAuth } from "@repo/auth/server";
import { db } from "@repo/db";
import {
  getProductionSettingsAction,
  updateProductionSettingsAction,
} from "../production-settings";

describe("production-settings server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return Unauthorized when session is missing", async () => {
    (getServerAuth as any).mockResolvedValue(null);
    const res = await getProductionSettingsAction();
    expect(res.success).toBe(false);
    expect(res.error).toBe("Unauthorized");
  });

  it("should fetch production settings for valid organization", async () => {
    (getServerAuth as any).mockResolvedValue({ organizationId: "org-1" });
    (db.productionSettings.findUnique as any).mockResolvedValue({
      id: "ps-1",
      organizationId: "org-1",
      batchPrefix: "PRD",
      defaultOperatorId: "op-1",
      operators: [],
    });

    const res = await getProductionSettingsAction();
    expect(res.success).toBe(true);
    expect(res.settings.batchPrefix).toBe("PRD");
    expect(res.settings.defaultOperatorId).toBe("op-1");
  });

  it("should update production settings and sync to database", async () => {
    (getServerAuth as any).mockResolvedValue({ organizationId: "org-1" });
    (db.productionSettings.upsert as any).mockResolvedValue({
      id: "ps-1",
      organizationId: "org-1",
      batchPrefix: "LOT",
      batchSeparator: "-",
    });
    (db.bakerySettings.upsert as any).mockResolvedValue({});

    const res = await updateProductionSettingsAction({
      batchPrefix: "LOT",
      batchSeparator: "-",
    });

    expect(res.success).toBe(true);
    expect(res.settings.batchPrefix).toBe("LOT");
    expect(db.productionSettings.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: "org-1" },
      }),
    );
  });
});
