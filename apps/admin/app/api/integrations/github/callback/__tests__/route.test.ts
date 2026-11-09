import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@repo/db", () => ({
  db: {
    globalSetting: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock("@/app/actions/integrations", () => ({
  getSystemIntegrationSettings: vi.fn().mockResolvedValue({
    githubClientId: "test_client_id",
    githubClientSecret: "test_client_secret",
  }),
}));

import { db } from "@repo/db";
import { GET } from "../route";

describe("GitHub Callback Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles installation_id and updates global settings", async () => {
    (db.globalSetting.upsert as any).mockResolvedValue({ id: "1" });

    const req = new NextRequest(
      "https://admin.scryme.tech/api/integrations/github/callback?installation_id=987654&setup_action=install",
    );

    const res = await GET(req);

    expect(db.globalSetting.upsert).toHaveBeenCalledWith({
      where: { key: "system:integration:github:installationId" },
      update: { value: "987654" },
      create: { key: "system:integration:github:installationId", value: "987654" },
    });

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/integrations/github");
    expect(res.headers.get("location")).toContain("connected=true");
  });
});
