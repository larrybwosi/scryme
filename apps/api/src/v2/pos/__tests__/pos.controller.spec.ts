import { Test, TestingModule } from "@nestjs/testing";
import { PosController } from "../pos.controller";
import { PosService } from "../pos.service";
import { PosSaleService } from "../pos-sale.service";
import { V2ApiContext } from "@repo/shared/api/v2";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("PosController", () => {
  let controller: PosController;
  let posSaleService: PosSaleService;

  let posService: PosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PosController],
      providers: [
        {
          provide: PosService,
          useValue: {
            getAttendanceStatus: vi.fn(),
          },
        },
        {
          provide: PosSaleService,
          useValue: {
            handleSale: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PosController>(PosController);
    posService = module.get<PosService>(PosService);
    posSaleService = module.get<PosSaleService>(PosSaleService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("processSale", () => {
    it("should call handleSale on PosSaleService", async () => {
      const mockCtx: any = { organizationId: "org_1" };
      const mockBody = { cartItems: [] };

      vi.mocked(posSaleService.handleSale).mockResolvedValue({
        success: true,
      } as any);

      const result = await controller.processSale(mockCtx, mockBody, "true");

      expect(result).toEqual({ success: true });
      expect(posSaleService.handleSale).toHaveBeenCalledWith(
        mockCtx,
        mockBody,
        true,
      );
    });
  });

  describe("getAttendanceStatus", () => {
    it("should delegate to posService.getAttendanceStatus", async () => {
      const mockCtx: any = { organizationId: "org_1", memberId: "member_1" };
      const expectedResult = { id: "member_1", isCheckedIn: true };

      vi.mocked(posService.getAttendanceStatus).mockResolvedValue(expectedResult);

      const result = await controller.getAttendanceStatus(mockCtx);

      expect(result).toEqual(expectedResult);
      expect(posService.getAttendanceStatus).toHaveBeenCalledWith(mockCtx);
    });
  });
});
