import { describe, it, expect, vi, beforeEach } from "vitest";
import { UploadController } from "../upload.controller";
import { BadRequestException } from "@nestjs/common";

// Mock storageService
vi.mock("@repo/shared/storage/service", () => ({
  storageService: {
    upload: vi.fn().mockResolvedValue({ url: "http://example.com/test.png" }),
  },
}));

describe("UploadController", () => {
  let controller: UploadController;

  beforeEach(() => {
    controller = new UploadController();
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
