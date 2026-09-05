import { Test, TestingModule } from "@nestjs/testing";
import { BinariesController } from "../binaries.controller";
import { PosReleaseService } from "../pos-release.service";
import { NotFoundException, InternalServerErrorException, BadRequestException, UnauthorizedException } from "@nestjs/common";
import axios from "axios";
import { FastifyReply } from "fastify";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { isSafeUrl } from "@repo/shared/server";
import { storageService } from "@repo/shared/storage";

vi.mock("axios");
vi.mock("@repo/shared/server", () => ({
  isSafeUrl: vi.fn().mockResolvedValue(true),
}));
vi.mock("@repo/shared/storage", () => ({
  storageService: {
    getDownloadStream: vi.fn(),
    upload: vi.fn(),
    delete: vi.fn(),
  },
}));
vi.mock("@repo/env", () => ({
  env: {
    GITHUB_OWNER: "test-owner",
    GITHUB_REPO: "test-repo",
    GITHUB_TOKEN: "test-token",
  },
}));

describe("BinariesController", () => {
  let controller: BinariesController;
  let posReleaseService: PosReleaseService;

  const mockPosReleaseService = {
    getLatestBinary: vi.fn().mockResolvedValue(null),
    verifyGithubSignature: vi.fn().mockResolvedValue(true),
    handleWebhookReleasePayload: vi.fn().mockResolvedValue({ processed: true, releaseTag: "v1.0.0", savedCount: 1 }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BinariesController],
      providers: [
        {
          provide: PosReleaseService,
          useValue: mockPosReleaseService,
        },
      ],
    }).compile();

    controller = module.get<BinariesController>(BinariesController);
    posReleaseService = module.get<PosReleaseService>(PosReleaseService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should serve stored binary from RustFS if available", async () => {
    const mockStoredBinary = {
      id: "bin-1",
      fileName: "scryme-pos-pharmacy.msi",
      fileUrl: "http://rustfs/scryme-pos-pharmacy.msi",
      mimeType: "application/x-msi",
      sizeBytes: BigInt(2048000),
    };
    mockPosReleaseService.getLatestBinary.mockResolvedValueOnce(mockStoredBinary as any);

    const mockStream = { pipe: vi.fn() };
    (storageService.getDownloadStream as any).mockResolvedValueOnce(mockStream);

    const res = {
      header: vi.fn().mockReturnThis(),
    } as unknown as FastifyReply;

    await controller.downloadBinary("windows", res, "pharmacy");

    expect(posReleaseService.getLatestBinary).toHaveBeenCalledWith("windows", "pharmacy");
    expect(res.header).toHaveBeenCalledWith("Content-Type", "application/x-msi");
    expect(res.header).toHaveBeenCalledWith("Content-Disposition", 'attachment; filename="scryme-pos-pharmacy.msi"');
    expect(res.header).toHaveBeenCalledWith("Content-Length", 2048000);
    expect(mockStream.pipe).toHaveBeenCalledWith(res);
  });

  it("should throw NotFoundException if no asset found for platform during fallback", async () => {
    mockPosReleaseService.getLatestBinary.mockResolvedValueOnce(null);
    (axios.get as any).mockResolvedValue({
      data: {
        assets: [{ name: "other.txt", browser_download_url: "url", size: 100 }],
      },
    });

    const res = {
      header: vi.fn(),
      send: vi.fn(),
    } as unknown as FastifyReply;

    await expect(controller.downloadBinary("windows", res)).rejects.toThrow(NotFoundException);
  });

  it("should proxy the binary download for windows using pipe when not in RustFS (default: retail)", async () => {
    mockPosReleaseService.getLatestBinary.mockResolvedValueOnce(null);
    const mockRelease = {
      assets: [
        { name: "app-pharmacy.msi", browser_download_url: "http://download/app-pharmacy.msi", size: 1200 },
        { name: "app.msi", browser_download_url: "http://download/app.msi", size: 1000 },
      ],
    };

    const mockStream = { pipe: vi.fn() };

    (axios.get as any).mockResolvedValueOnce({ data: mockRelease });
    (axios as any).mockResolvedValueOnce({
      headers: { "content-type": "application/octet-stream" },
      data: mockStream,
    });

    const res = {
      header: vi.fn().mockReturnThis(),
    } as unknown as FastifyReply;

    await controller.downloadBinary("windows", res);

    expect(res.header).toHaveBeenCalledWith("Content-Type", "application/octet-stream");
    expect(res.header).toHaveBeenCalledWith("Content-Disposition", 'attachment; filename="app.msi"');
    expect(res.header).toHaveBeenCalledWith("Content-Length", 1000);
    expect(mockStream.pipe).toHaveBeenCalledWith(res);
  });

  it("should handle GitHub webhook and verify signature", async () => {
    mockPosReleaseService.verifyGithubSignature.mockResolvedValueOnce(true);

    const body = { action: "published", release: { tag_name: "v1.0.0", assets: [] } };
    const req = { rawBody: JSON.stringify(body) };

    const result = await controller.handleGithubWebhook("release", "sha256=valid", body, req);

    expect(posReleaseService.verifyGithubSignature).toHaveBeenCalledWith(JSON.stringify(body), "sha256=valid");
    expect(posReleaseService.handleWebhookReleasePayload).toHaveBeenCalledWith(body);
    expect(result).toEqual({ processed: true, releaseTag: "v1.0.0", savedCount: 1 });
  });

  it("should throw UnauthorizedException on invalid webhook signature", async () => {
    mockPosReleaseService.verifyGithubSignature.mockResolvedValueOnce(false);

    const req = { rawBody: "{}" };
    await expect(controller.handleGithubWebhook("release", "sha256=invalid", {}, req)).rejects.toThrow(UnauthorizedException);
  });
});
