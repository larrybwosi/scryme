import {Test, TestingModule} from "@nestjs/testing";
import {PublicController} from "../public.controller";
import {PublicService} from "../public.service";
import {beforeEach, describe, expect, it, vi} from "vitest";

describe("PublicController", () => {
  let controller: PublicController;
  let service: PublicService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicController],
      providers: [
        {
          provide: PublicService,
          useValue: {
            getDocument: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PublicController>(PublicController);
    service = module.get<PublicService>(PublicService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("getDocument", () => {
    it("should stream the document successfully", async () => {
      const mockResult = {
        stream: "mock-stream",
        contentType: "application/pdf",
        filename: "invoice.pdf",
      };

      vi.mocked(service.getDocument).mockResolvedValue(mockResult as any);

      const mockRes = {
        header: vi.fn(),
        send: vi.fn(),
      };

      await controller.getDocument(
        "invoice",
        "123",
        "token",
        "pdf",
        "template",
        mockRes as any,
      );

      expect(mockRes.header).toHaveBeenCalledWith(
        "Content-Type",
        "application/pdf",
      );
      expect(mockRes.send).toHaveBeenCalledWith("mock-stream");
    });
  });
});
