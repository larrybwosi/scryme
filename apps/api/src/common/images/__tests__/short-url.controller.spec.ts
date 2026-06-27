import { describe, it, expect, vi, beforeEach } from "vitest";
import { ShortUrlController } from "../short-url.controller";
import { HttpStatus } from "@nestjs/common";

// Mocks
vi.mock("@repo/shared/storage", () => ({
  storageService: {
    getSignedUrl: vi.fn().mockResolvedValue("http://signed.url"),
  },
}));

vi.mock("axios", () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: Buffer.from("test content"),
      headers: { "content-type": "application/pdf" },
    }),
  },
}));

describe("ShortUrlController", () => {
  let controller: ShortUrlController;
  let mockPrisma: any;
  let mockRedis: any;
  let mockImageService: any;

  beforeEach(() => {
    mockPrisma = {
      client: {
        attachment: {
          findUnique: vi.fn(),
        },
      },
    };
    mockRedis = {
      get: vi.fn(),
      setex: vi.fn(),
    };
    mockImageService = {
      optimizeImage: vi.fn(),
    };
    controller = new ShortUrlController(
      mockImageService,
      mockPrisma,
      mockRedis,
    );
  });

  it("should return from cache if available", async () => {
    const mockAttachment = {
      id: "att-1",
      organizationId: "org-1",
      mimeType: "application/pdf",
      fileName: "test.pdf",
      isPublic: true,
    };
    mockRedis.get.mockResolvedValueOnce(mockAttachment); // Metadata cache
    mockRedis.get.mockResolvedValueOnce({
      content: Buffer.from("cached content").toString("base64"),
      mimeType: "application/pdf",
    }); // File content cache

    const res = {
      header: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };

    await controller.handleShortUrl("short123", {} as any, res as any);

    expect(mockRedis.get).toHaveBeenCalledWith("attachment:short123");
    expect(mockRedis.get).toHaveBeenCalledWith("file_content:att-1");
    expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
    expect(res.send).toHaveBeenCalled();
    expect(mockPrisma.client.attachment.findUnique).not.toHaveBeenCalled();
  });

  it("should fetch from DB and cache if not in cache", async () => {
    const mockAttachment = {
      id: "att-1",
      organizationId: "org-1",
      mimeType: "application/pdf",
      fileName: "test.pdf",
      isPublic: true,
    };
    mockRedis.get.mockResolvedValue(null);
    mockPrisma.client.attachment.findUnique.mockResolvedValue(mockAttachment);

    const res = {
      header: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };

    await controller.handleShortUrl("short123", {} as any, res as any);

    expect(mockRedis.get).toHaveBeenCalledWith("attachment:short123");
    expect(mockPrisma.client.attachment.findUnique).toHaveBeenCalledWith({
      where: { shortCode: "short123" },
    });
    expect(mockRedis.setex).toHaveBeenCalledWith(
      "attachment:short123",
      expect.any(Number),
      mockAttachment,
    );
  });
});
