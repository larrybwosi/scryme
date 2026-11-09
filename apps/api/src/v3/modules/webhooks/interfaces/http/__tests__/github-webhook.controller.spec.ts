import { describe, it, expect, vi, beforeEach } from "vitest";
import { GitHubWebhookController } from "../github-webhook.controller";
import { UnauthorizedException } from "@nestjs/common";

describe("GitHubWebhookController", () => {
  let controller: GitHubWebhookController;
  let mockReleaseService: any;

  beforeEach(() => {
    mockReleaseService = {
      verifyGithubSignature: vi.fn(),
      handleWebhookPayload: vi.fn(),
      syncReleaseFromGithub: vi.fn(),
    };
    controller = new GitHubWebhookController(mockReleaseService);
  });

  it("should process valid GitHub release webhook event", async () => {
    mockReleaseService.verifyGithubSignature.mockResolvedValue(true);
    mockReleaseService.handleWebhookPayload.mockResolvedValue({
      processed: true,
      releaseTag: "v1.2.0",
      savedCount: 2,
    });

    const payload = {
      action: "published",
      release: {
        tag_name: "v1.2.0",
        assets: [
          { name: "dealio-pos-windows.msi", browser_download_url: "https://github.com/dealio/releases/download/v1.2.0/app.msi" },
        ],
      },
    };

    const res = await controller.receiveGitHubWebhook(
      { rawBody: Buffer.from(JSON.stringify(payload)) },
      "release",
      "sha256=test_signature",
      payload,
    );

    expect(mockReleaseService.verifyGithubSignature).toHaveBeenCalled();
    expect(mockReleaseService.handleWebhookPayload).toHaveBeenCalledWith("release", payload);
    expect(res).toEqual({
      processed: true,
      releaseTag: "v1.2.0",
      savedCount: 2,
    });
  });

  it("should reject webhook when signature verification fails", async () => {
    mockReleaseService.verifyGithubSignature.mockResolvedValue(false);

    await expect(
      controller.receiveGitHubWebhook(
        { rawBody: Buffer.from("{}") },
        "release",
        "sha256=invalid_signature",
        {},
      ),
    ).rejects.toThrow(UnauthorizedException);

    expect(mockReleaseService.handleWebhookPayload).not.toHaveBeenCalled();
  });

  it("should trigger release sync directly via sync-release endpoint", async () => {
    mockReleaseService.syncReleaseFromGithub.mockResolvedValue({
      processed: true,
      releaseTag: "v1.3.0",
      savedCount: 3,
    });

    const result = await controller.syncRelease("v1.3.0");

    expect(mockReleaseService.syncReleaseFromGithub).toHaveBeenCalledWith("v1.3.0");
    expect(result).toEqual({
      processed: true,
      releaseTag: "v1.3.0",
      savedCount: 3,
    });
  });
});
