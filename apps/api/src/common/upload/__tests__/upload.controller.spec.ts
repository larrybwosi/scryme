import { describe, it, expect, vi, beforeEach } from "vitest";
import { UploadController } from "../upload.controller";
import { BadRequestException } from "@nestjs/common";

// Mock storageService
vi.mock("@repo/shared/storage", () => ({
  SanityStorageProvider: vi.fn().mockImplementation(() => ({
    upload: vi.fn().mockResolvedValue({ url: "http://test.com" }),
  })),
  storageService: {
    upload: vi.fn().mockResolvedValue({ url: "http://example.com/test.png" }),
  },
  StorageCoreService: {
    generateShortUrlInfo: vi.fn().mockReturnValue({
      shortCode: "short",
      shortUrl: "http://api.test.com/s/short",
    }),
    generateStorageFileName: vi.fn().mockReturnValue("test-uuid.png"),
  },
  AllowPublic: () => () => {},
}));

describe("UploadController", () => {
  let controller: UploadController;
  const mockPrisma = {
    client: {
      attachment: {
        create: vi.fn().mockResolvedValue({
          id: "test-id",
          shortUrl: "http://api.test.com/s/short",
        }),
      },
    },
  };

  beforeEach(() => {
    controller = new UploadController(mockPrisma as any);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should throw BadRequestException if no file is provided", async () => {
    const req = {
      file: vi.fn().mockResolvedValue(null),
    };
    const res = {
      send: vi.fn(),
    };

    await expect(controller.uploadFile(req as any, res as any)).rejects.toThrow(
      BadRequestException,
    );
  });

  it("should upload file and return url", async () => {
    const mockFile = {
      filename: "test.png",
      mimetype: "image/png",
      toBuffer: vi.fn().mockResolvedValue(Buffer.from("test")),
    };
    const req = {
      file: vi.fn().mockResolvedValue(mockFile),
      user: { organizationId: "org-123", memberId: "mem-123" },
    };
    const res = {
      send: vi.fn().mockImplementation((data) => data),
    };

    const result = await controller.uploadFile(req as any, res as any);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.any(String),
      }),
    );
  });
});
