import {Test, TestingModule} from "@nestjs/testing";
import {ImageService} from "../image.service";
import {BadRequestException} from "@nestjs/common";
import axios from "axios";
import {storageService} from "@repo/shared/server";

vi.mock("axios");
vi.mock("@repo/shared/server", () => ({
  storageService: {
    getSignedUrl: vi.fn(),
  },
  validateEncryptionKey: vi.fn(),
}));

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
    it("should throw BadRequestException for invalid Sanity asset ID format", async () => {
      process.env.STORAGE_PROVIDER = "sanity";
      const invalidId = "https://malicious-site.com/exploit.jpg";

      await expect(
        service.optimizeImage(invalidId, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it("should fetch image with timeout and maxContentLength for Sanity", async () => {
      process.env.STORAGE_PROVIDER = "sanity";
      process.env.SANITY_PROJECT_ID = "test-project";
      process.env.SANITY_DATASET = "test-dataset";
      const validId = "image-abcd123-100x100-jpg";

      const mockResponse = {
        data: Buffer.from("fake-image-data"),
        headers: {"content-type": "image/jpeg"},
      };
      (axios.get as any).mockResolvedValue(mockResponse);

      // We need to mock sharp as well since it will be called
      // For simplicity in this test, we just want to verify the axios call
      try {
        await service.optimizeImage(validId, {});
      } catch (e) {
        // Sharp might fail because of fake data, but we care about the axios call
      }

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining("cdn.sanity.io"),
        expect.objectContaining({
          timeout: 5000,
          maxContentLength: 10 * 1024 * 1024,
        }),
      );
    });

    it("should fetch image with timeout and maxContentLength for RustFS", async () => {
      process.env.STORAGE_PROVIDER = "rustfs";
      const validId = "some-file-id.png";
      (storageService.getSignedUrl as any).mockResolvedValue("http://signed-url.com");

      const mockResponse = {
        data: Buffer.from("fake-image-data"),
        headers: {"content-type": "image/png"},
      };
      (axios.get as any).mockResolvedValue(mockResponse);

      try {
        await service.optimizeImage(validId, {});
      } catch (e) {
        // Sharp might fail
      }

      expect(axios.get).toHaveBeenCalledWith(
        "http://signed-url.com",
        expect.objectContaining({
          timeout: 5000,
          maxContentLength: 10 * 1024 * 1024,
        }),
      );
    });
  });
});
