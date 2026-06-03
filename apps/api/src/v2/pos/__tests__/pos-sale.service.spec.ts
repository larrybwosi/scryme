import { Test, TestingModule } from "@nestjs/testing";
import { PosSaleService } from "../pos-sale.service";
import { PrismaService } from "@/prisma/prisma.service";
import { BadRequestException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProcessSaleInputSchema, CreateOrderSchema, processSale } from "@repo/shared/server";

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
      (ProcessSaleInputSchema.safeParse as any).mockReturnValue({
        success: true,
        data: {
          ...mockBody,
          locationId: "loc_1",
          enableStockTracking: true,
        },
      });
      (processSale as any).mockResolvedValue({
        success: true,
        data: { id: "txn_1", ...mockBody },
      });

      const result = await service.handleSale(mockCtx, mockBody, true);

      expect(result.success).toBe(true);
      expect(processSale).toHaveBeenCalledWith(
        "org_1",
        "member_1",
        expect.any(Object),
      );
    });

    it("should throw BadRequestException if validation fails", async () => {
      (ProcessSaleInputSchema.safeParse as any).mockReturnValue({
        success: false,
        error: {
          flatten: () => ({ fieldErrors: { cartItems: ["Required"] } }),
        },
      });

      await expect(service.handleSale(mockCtx, mockBody, true)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
