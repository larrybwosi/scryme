import {Test, TestingModule} from "@nestjs/testing";
import {PosSaleService} from "../pos-sale.service";
import {PrismaService} from "@/prisma/prisma.service";
import {BadRequestException} from "@nestjs/common";
import * as sharedActions from "@repo/shared/server";
import {beforeEach, describe, expect, it, vi} from "vitest";

vi.mock("@repo/shared/server", () => ({
  processSale: vi.fn(),
  triggerStkPush: vi.fn(),
  createOrder: vi.fn(),
  ProcessSaleInputSchema: {
    safeParse: vi.fn(),
  },
  CreateOrderSchema: {
    safeParse: vi.fn(),
  },
}));

describe("PosSaleService", () => {
  let service: PosSaleService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PosSaleService,
        {
          provide: PrismaService,
          useValue: {
            client: {},
          },
        },
      ],
    }).compile();

    service = module.get<PosSaleService>(PosSaleService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("handleSale", () => {
    const mockCtx: any = {
      organizationId: "org_1",
      memberId: "member_1",
      locationId: "loc_1",
    };

    const mockBody: any = {
      cartItems: [
        {
          productId: "prod_1",
          variantId: "var_1",
          quantity: 1,
          sellingUnitId: "unit_1",
        },
      ],
      payments: [
        {
          method: "CASH",
          amount: 100,
        },
      ],
    };

    it("should process a cash sale successfully", async () => {
      vi.mocked(sharedActions.ProcessSaleInputSchema.safeParse).mockReturnValue(
        {
          success: true,
          data: {
            ...mockBody,
            locationId: "loc_1",
            enableStockTracking: true,
          } as any,
        } as any,
      );

      vi.mocked(sharedActions.processSale).mockResolvedValue({
        success: true,
        transactionId: "txn_1",
        data: {id: "txn_1", payments: []},
      } as any);

      const result = await service.handleSale(mockCtx, mockBody, true);

      expect(result.success).toBe(true);
      expect(sharedActions.processSale).toHaveBeenCalledWith(
        "org_1",
        "member_1",
        expect.any(Object),
      );
    });

    it("should throw BadRequestException if validation fails", async () => {
      vi.mocked(sharedActions.ProcessSaleInputSchema.safeParse).mockReturnValue(
        {
          success: false,
          error: {
            flatten: () => ({fieldErrors: {cartItems: ["Required"]}}),
          },
        } as any,
      );

      await expect(service.handleSale(mockCtx, mockBody, true)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
