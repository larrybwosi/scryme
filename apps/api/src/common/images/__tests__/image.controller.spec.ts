import { describe, it, expect, vi, beforeEach } from "vitest";
import { ImageController } from "../image.controller";
import { HttpStatus } from "@nestjs/common";

describe("ImageController", () => {
  let controller: ImageController;
  let mockPrisma: any;
  let mockImageService: any;

  beforeEach(() => {
    mockPrisma = {
      client: {
        attachment: {
          findUnique: vi.fn(),
        },
      },
    };
    mockImageService = {
      optimizeImage: vi.fn().mockResolvedValue({
        data: Buffer.from("test image data"),
        contentType: "image/webp",
      }),
    };
    controller = new ImageController(mockImageService, mockPrisma);
  });

  it("should return public image with public Cache-Control", async () => {
    const mockAttachment = {
      id: "img-1",
      organizationId: "org-1",
      isPublic: true,
      organization: { settings: { forcePrivateAttachments: false } },
    };
    mockPrisma.client.attachment.findUnique.mockResolvedValue(mockAttachment);

    const res = {
      header: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };

    await controller.getImage("img-1", {} as any, res as any);

    expect(res.header).toHaveBeenCalledWith("Cache-Control", "public, max-age=31536000, immutable");
    expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
  });

  it("should return private image with secure Cache-Control if authorized", async () => {
    const mockAttachment = {
      id: "img-1",
      organizationId: "org-1",
      isPublic: false,
      organization: { settings: { forcePrivateAttachments: false } },
    };
    mockPrisma.client.attachment.findUnique.mockResolvedValue(mockAttachment);

    const res = {
      header: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };
    const req = {
      v2Context: { organizationId: "org-1" },
    };

    await controller.getImage("img-1", req as any, res as any);

    expect(res.header).toHaveBeenCalledWith("Cache-Control", "private, no-cache, no-store, must-revalidate");
    expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
  });

  it("should return 401 if unauthorized to view private image", async () => {
    const mockAttachment = {
      id: "img-1",
      organizationId: "org-1",
      isPublic: false,
      organization: { settings: { forcePrivateAttachments: false } },
    };
    mockPrisma.client.attachment.findUnique.mockResolvedValue(mockAttachment);

    const res = {
      header: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };
    const req = {
      v2Context: { organizationId: "org-wrong" },
    };

    await controller.getImage("img-1", req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
  });
});
