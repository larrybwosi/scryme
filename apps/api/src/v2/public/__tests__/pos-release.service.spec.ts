import { Test, TestingModule } from "@nestjs/testing";
import { PosReleaseService } from "../pos-release.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { storageService } from "@repo/shared/storage";
import axios from "axios";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("axios");
vi.mock("@repo/shared/storage", () => ({
  storageService: {
    upload: vi.fn().mockResolvedValue({ url: "http://rustfs/test.msi", id: "key-1" }),
    delete: vi.fn().mockResolvedValue(undefined),
  },
}));
vi.mock("@repo/shared/server", () => ({
  isSafeUrl: vi.fn().mockResolvedValue(true),
}));

describe("PosReleaseService", () => {
  let service: PosReleaseService;

  const mockPrismaClient = {
    globalSetting: {
      findUnique: vi.fn(),
    },
    posReleaseBinary: {
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      upsert: vi.fn().mockResolvedValue({ id: "bin-1" }),
      findFirst: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue({ success: true }),
      findUnique: vi.fn(),
    },
  };

  const mockPrismaService = {
    client: mockPrismaClient,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PosReleaseService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PosReleaseService>(PosReleaseService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should detect platform and variant correctly", () => {
    expect(service.detectPlatform("scryme-pos-1.0.0.msi")).toBe("windows");
    expect(service.detectPlatform("scryme-pos-1.0.0.dmg")).toBe("macos");
    expect(service.detectPlatform("scryme-pos-1.0.0.AppImage")).toBe("linux");

    expect(service.detectVariant("scryme-pos-pharmacy.msi")).toBe("pharmacy");
    expect(service.detectVariant("scryme-pos-restaurant.dmg")).toBe("restaurant");
    expect(service.detectVariant("scryme-pos-supermarket.AppImage")).toBe("supermarket");
    expect(service.detectVariant("scryme-pos.msi")).toBe("retail");
  });

  it("should process and save asset to RustFS", async () => {
    (axios as any).mockResolvedValueOnce({
      data: Buffer.from("dummy-binary-data"),
      headers: { "content-type": "application/x-msi" },
    });

    const asset = {
      name: "scryme-pos-pharmacy.msi",
      browser_download_url: "https://github.com/releases/scryme-pos-pharmacy.msi",
      size: 1000,
    };

    const record = await service.processAndSaveAsset("1.0.0", "v1.0.0", asset);

    expect(storageService.upload).toHaveBeenCalled();
    expect(mockPrismaClient.posReleaseBinary.updateMany).toHaveBeenCalledWith({
      where: { platform: "windows", variant: "pharmacy", isLatest: true },
      data: { isLatest: false },
    });
    expect(mockPrismaClient.posReleaseBinary.upsert).toHaveBeenCalled();
    expect(record).toEqual({ id: "bin-1" });
  });

  it("should handle release webhook payload", async () => {
    (axios as any).mockResolvedValue({
      data: Buffer.from("dummy-binary-data"),
      headers: { "content-type": "application/x-msi" },
    });

    const payload = {
      action: "published",
      release: {
        tag_name: "v2.0.0",
        assets: [
          {
            name: "scryme-pos-retail.msi",
            browser_download_url: "https://github.com/releases/scryme-pos-retail.msi",
          },
        ],
      },
    };

    const result = await service.handleWebhookReleasePayload(payload);

    expect(result.processed).toBe(true);
    expect(result.releaseTag).toBe("v2.0.0");
    expect(result.savedCount).toBe(1);
  });
});
