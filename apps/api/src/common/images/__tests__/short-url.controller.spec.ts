import { describe, it, expect, vi, beforeEach } from "vitest";
import { ShortUrlController } from "../short-url.controller";
import { HttpStatus } from "@nestjs/common";

// Mocks
vi.mock("@repo/shared/storage", () => ({
  storageService: {
    getSignedUrl: vi.fn().mockResolvedValue("https://safe-url.com/file.pdf"),
  },
}));

vi.mock("@repo/shared/server", () => ({
  isSafeUrl: vi.fn().mockResolvedValue(true),
  optimizeImage: vi.fn(),
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
        organizationSettings: {
          findUnique: vi.fn(),
        },
      },
    };
    mockRedis = {
      get: vi.fn().mockResolvedValue(null),
      setex: vi.fn(),
    };
    mockImageService = {
      optimizeImage: vi.fn(),
    };
    controller = new ShortUrlController(mockImageService, mockPrisma, mockRedis);
  });

  it("should return from cache if available", async () => {
    const mockAttachment = {
      id: "att-1",
      organizationId: "org-1",
      mimeType: "application/pdf",
      fileName: "test.pdf",
      isPublic: true,
    };

    mockRedis.get.mockImplementation((key: string) => {
      if (key === "attachment:short123") return Promise.resolve(mockAttachment);
      if (key === "org_settings:org-1") return Promise.resolve({ forcePrivateAttachments: false });
      if (key === "file_content:att-1") return Promise.resolve({
        content: Buffer.from("cached content").toString("base64"),
        mimeType: "application/pdf"
      });
      return Promise.resolve(null);
    });

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

  it("should return secure Cache-Control for private attachments", async () => {
    const mockAttachment = {
      id: "att-1",
      organizationId: "org-1",
      mimeType: "application/pdf",
      fileName: "test.pdf",
      isPublic: false,
    };
    mockRedis.get.mockResolvedValue(null);
    mockPrisma.client.attachment.findUnique.mockResolvedValue(mockAttachment);
    mockRedis.get.mockResolvedValueOnce(null); // Settings cache
    mockPrisma.client.organizationSettings.findUnique.mockResolvedValue({
      forcePrivateAttachments: false,
    });

    const res = {
      header: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };

    const req = {
      v2Context: { organizationId: "org-1" },
    };

    await controller.handleShortUrl("short123", req as any, res as any);

    expect(res.header).toHaveBeenCalledWith(
      "Cache-Control",
      "private, no-cache, no-store, must-revalidate",
    );
  });

  it("should return public Cache-Control for public attachments", async () => {
    const mockAttachment = {
      id: "att-1",
      organizationId: "org-1",
      mimeType: "application/pdf",
      fileName: "test.pdf",
      isPublic: true,
    };
    mockRedis.get.mockResolvedValue(null);
    mockPrisma.client.attachment.findUnique.mockResolvedValue(mockAttachment);
    mockRedis.get.mockResolvedValueOnce(null); // Settings cache
    mockPrisma.client.organizationSettings.findUnique.mockResolvedValue({
      forcePrivateAttachments: false,
    });

    const res = {
      header: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };

    await controller.handleShortUrl("short123", {} as any, res as any);

    expect(res.header).toHaveBeenCalledWith(
      "Cache-Control",
      "public, max-age=31536000, immutable",
    );
  });

  it("should set Content-Disposition to attachment if download parameter is provided", async () => {
    const mockAttachment = {
      id: "att-1",
      organizationId: "org-1",
      mimeType: "application/pdf",
      fileName: "test.pdf",
      isPublic: true,
    };
    mockRedis.get.mockResolvedValue(null);
    mockPrisma.client.attachment.findUnique.mockResolvedValue(mockAttachment);
    mockRedis.get.mockResolvedValueOnce(null); // Settings cache
    mockPrisma.client.organizationSettings.findUnique.mockResolvedValue({
      forcePrivateAttachments: false,
    });

    const res = {
      header: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };

    await controller.handleShortUrl("short123", {} as any, res as any, undefined, undefined, undefined, undefined, "true");

    expect(res.header).toHaveBeenCalledWith(
      "Content-Disposition",
      'attachment; filename="test.pdf"',
    );
  });
});
