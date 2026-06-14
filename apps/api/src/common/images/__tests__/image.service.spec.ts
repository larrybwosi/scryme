import { Test, TestingModule } from "@nestjs/testing";
import { ImageService } from "../image.service";
import { storageService } from "@repo/shared/server";
import axios from "axios";
import { Mock, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@repo/shared/server", () => ({
  storageService: {
    getSignedUrl: vi.fn(),
  },
}));

vi.mock("axios");

describe("ImageService", () => {
  let service: ImageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageService],
    }).compile();

    service = module.get<ImageService>(ImageService);
    vi.clearAllMocks();
  });

  describe("optimizeImage", () => {
    it("should throw an error for invalid Sanity asset ID when provider is sanity", async () => {
      process.env.STORAGE_PROVIDER = "sanity";
      const id = "http://malicious.com/ssrf";

      await expect(service.optimizeImage(id, {})).rejects.toThrow(
        "Invalid Sanity asset ID format",
      );
    });

    it("should include timeout and maxContentLength in axios calls", async () => {
      process.env.STORAGE_PROVIDER = "rustfs";
      const id = "test-id";
      const signedUrl = "http://signed-url.com";
      (storageService.getSignedUrl as Mock).mockResolvedValue(signedUrl);
      (axios.get as Mock).mockResolvedValue({
        data: Buffer.from(""),
        headers: { "content-type": "image/jpeg" },
      });

      try {
        await service.optimizeImage(id, {});
      } catch (e) {
        // We expect it to fail later because of sharp being mocked or not,
        // but we want to check the axios call
      }

      expect(axios.get).toHaveBeenCalledWith(
        signedUrl,
        expect.objectContaining({
          timeout: 5000,
          maxContentLength: 10485760,
        }),
      );
    });
  });
});
