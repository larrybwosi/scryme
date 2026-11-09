import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@repo/db", () => ({
  db: {
    integrationDefinition: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    globalSetting: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
  },
  IntegrationCategory: {
    COMMUNICATION: "COMMUNICATION",
    OTHER: "OTHER",
    MONITORING: "MONITORING",
  },
  AuthType: {
    API_KEY: "API_KEY",
    WEBHOOK_SECRET: "WEBHOOK_SECRET",
    OAUTH2: "OAUTH2",
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("../auth", () => ({
  requireSuperAdmin: vi.fn().mockResolvedValue({ id: "admin_1" }),
}));

import { db } from "@repo/db";
import {
  testGitHubConnection,
  fetchGitHubAccessibleRepositories,
  triggerGitHubReleaseSyncAction,
} from "../integrations";

describe("GitHub Integration Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("testGitHubConnection", () => {
    it("should connect to github api with configured settings", async () => {
      (db.globalSetting.findMany as any).mockResolvedValue([
        { key: "system:integration:github:owner", value: "dealio-org" },
        { key: "system:integration:github:repo", value: "scryme" },
        { key: "system:integration:github:token", value: "ghp_mock_token" },
      ]);

      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          full_name: "dealio-org/scryme",
          private: false,
          description: "Enterprise POS & ERP",
          default_branch: "main",
          open_issues_count: 5,
          stargazers_count: 42,
        }),
      });

      const res = await testGitHubConnection();

      expect(res.success).toBe(true);
      expect(res.message).toContain("dealio-org/scryme");
      expect(res.repo?.defaultBranch).toBe("main");

      global.fetch = originalFetch;
    });
  });

  describe("fetchGitHubAccessibleRepositories", () => {
    it("should return repositories list when API succeeds", async () => {
      (db.globalSetting.findMany as any).mockResolvedValue([
        { key: "system:integration:github:token", value: "ghp_mock_token" },
      ]);

      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          repositories: [
            {
              id: 101,
              name: "core",
              full_name: "dealio-org/core",
              private: true,
              default_branch: "main",
              owner: { login: "dealio-org" },
            },
            {
              id: 102,
              name: "scryme",
              full_name: "dealio-org/scryme",
              private: false,
              default_branch: "main",
              owner: { login: "dealio-org" },
            },
          ],
        }),
      });

      const res = await fetchGitHubAccessibleRepositories();

      expect(res.success).toBe(true);
      expect(res.repositories?.length).toBe(2);
      expect(res.repositories?.[0].fullName).toBe("dealio-org/core");

      global.fetch = originalFetch;
    });
  });

  describe("triggerGitHubReleaseSyncAction", () => {
    it("should call the release sync endpoint and return json", async () => {
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          processed: true,
          releaseTag: "v1.5.0",
          savedCount: 3,
        }),
      });

      const result = await triggerGitHubReleaseSyncAction("v1.5.0");

      expect(result.processed).toBe(true);
      expect(result.releaseTag).toBe("v1.5.0");
      expect(result.savedCount).toBe(3);

      global.fetch = originalFetch;
    });
  });
});
