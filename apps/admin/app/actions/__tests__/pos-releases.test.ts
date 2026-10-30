import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@repo/db", () => ({
  db: {
    globalSetting: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    posReleaseBinary: {
      findMany: vi.fn(),
      delete: vi.fn(),
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
import { updatePosReleaseSettings } from "../pos-releases";

describe("Admin POS Releases Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updatePosReleaseSettings", () => {
    it("should upsert 7 GitHub setting entries concurrently via Promise.all", async () => {
      (db.globalSetting.upsert as any).mockResolvedValue({ id: "setting_1" });

      const input = {
        appId: "app-123",
        clientId: "client-456",
        clientSecret: "secret-789",
        webhookSecret: "wh-secret",
        owner: "my-org",
        repo: "my-repo",
        token: "ghp_token_123",
      };

      const result = await updatePosReleaseSettings(input);

      expect(result).toEqual({ success: true });
      expect(db.globalSetting.upsert).toHaveBeenCalledTimes(7);
      expect(db.globalSetting.upsert).toHaveBeenCalledWith({
        where: { key: "github_app_id" },
        update: { value: "app-123" },
        create: { key: "github_app_id", value: "app-123" },
      });
      expect(db.globalSetting.upsert).toHaveBeenCalledWith({
        where: { key: "github_owner" },
        update: { value: "my-org" },
        create: { key: "github_owner", value: "my-org" },
      });
      expect(db.globalSetting.upsert).toHaveBeenCalledWith({
        where: { key: "github_token" },
        update: { value: "ghp_token_123" },
        create: { key: "github_token", value: "ghp_token_123" },
      });
    });
  });
});
