import { Test, TestingModule } from "@nestjs/testing";
import { PosSaleService } from "../pos-sale.service";
import { PrismaService } from "@/prisma/prisma.service";
import { BadRequestException } from "@nestjs/common";
import * as sharedActions from "@repo/shared/actions";
import * as sharedValidations from "@repo/shared/lib";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@repo/shared/lib", () => ({
  ProcessSaleInputSchema: { safeParse: vi.fn() },
  CreateOrderInputSchema: { safeParse: vi.fn() },
}));
vi.mock("@repo/shared/actions", () => ({
  processSale: vi.fn(),
  triggerStkPush: vi.fn(),
  createOrder: vi.fn(),
}));

describe("PosSaleService", () => {
  let service: PosSaleService;
  let prisma: PrismaService;

  beforeEach(async () => {
    vi.clearAllMocks();
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
      vi.mocked(
        sharedValidations.ProcessSaleInputSchema.safeParse,
      ).mockReturnValueOnce({
        success: true,
        data: {
          ...mockBody,
          locationId: "loc_1",
          enableStockTracking: true,
        } as any,
      } as any);

      vi.mocked(sharedActions.processSale).mockResolvedValue({
        success: true,
        transactionId: "txn_1",
        data: { id: "txn_1", payments: [] },
      } as any);

      const result = await service.handleSale(mockCtx, mockBody, true);

      expect(result.success).toBe(true);
      expect(sharedActions.processSale).toHaveBeenCalledWith(
        "org_1",
        "member_1",
        expect.any(Object),
      );
    });

    it("should trigger concurrent STK pushes for multiple M-Pesa payments", async () => {
      const mockMpesaBody = {
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
            method: "MPESA",
            amount: 100,
            payerPhone: "254712345678",
            mpesaFlowType: "STK_PUSH",
          },
          {
            method: "MPESA",
            amount: 200,
            payerPhone: "254787654321",
            mpesaFlowType: "STK_PUSH",
          },
        ],
      };

      vi.mocked(
        sharedValidations.ProcessSaleInputSchema.safeParse,
      ).mockReturnValueOnce({
        success: true,
        data: {
          ...mockMpesaBody,
          locationId: "loc_1",
          enableStockTracking: true,
        } as any,
      } as any);

      vi.mocked(sharedActions.processSale).mockResolvedValue({
        success: true,
        data: {
          id: "txn_1",
          payments: [
            {
              id: "pay_1",
              method: "MPESA",
              status: "PENDING",
              amount: 100,
              payerPhone: "254712345678",
            },
            {
              id: "pay_2",
              method: "MPESA",
              status: "PENDING",
              amount: 200,
              payerPhone: "254787654321",
            },
          ],
        },
      } as any);

      vi.mocked(sharedActions.triggerStkPush).mockResolvedValue({
        success: true,
      } as any);

      const result = await service.handleSale(mockCtx, mockMpesaBody, true);

      expect(result.success).toBe(true);
      expect(sharedActions.triggerStkPush).toHaveBeenCalledTimes(2);
      expect(sharedActions.triggerStkPush).toHaveBeenCalledWith({
        organizationId: "org_1",
        amount: 100,
        phoneNumber: "254712345678",
        transactionId: "txn_1",
        paymentId: "pay_1",
      });
      expect(sharedActions.triggerStkPush).toHaveBeenCalledWith({
        organizationId: "org_1",
        amount: 200,
        phoneNumber: "254787654321",
        transactionId: "txn_1",
        paymentId: "pay_2",
      });
    });

    it("should handle individual STK push failures gracefully without failing other operations", async () => {
      const mockMpesaBody = {
        cartItems: [],
        payments: [
          {
            method: "MPESA",
            amount: 100,
            payerPhone: "254712345678",
            mpesaFlowType: "STK_PUSH",
          },
          {
            method: "MPESA",
            amount: 200,
            payerPhone: "254787654321",
            mpesaFlowType: "STK_PUSH",
          },
        ],
      };

      vi.mocked(
        sharedValidations.ProcessSaleInputSchema.safeParse,
      ).mockReturnValueOnce({
        success: true,
        data: {
          ...mockMpesaBody,
          locationId: "loc_1",
          enableStockTracking: true,
        } as any,
      } as any);

      vi.mocked(sharedActions.processSale).mockResolvedValue({
        success: true,
        data: {
          id: "txn_2",
          payments: [
            {
              id: "pay_1",
              method: "MPESA",
              status: "PENDING",
              amount: 100,
              payerPhone: "254712345678",
            },
            {
              id: "pay_2",
              method: "MPESA",
              status: "PENDING",
              amount: 200,
              payerPhone: "254787654321",
            },
          ],
        },
      } as any);

      vi.mocked(sharedActions.triggerStkPush)
        .mockRejectedValueOnce(new Error("STK Push error"))
        .mockResolvedValueOnce({ success: true } as any);

      const result = await service.handleSale(mockCtx, mockMpesaBody, true);

      expect(result.success).toBe(true);
      expect(sharedActions.triggerStkPush).toHaveBeenCalledTimes(2);
    });

    it("should throw BadRequestException if validation fails", async () => {
      vi.mocked(
        sharedValidations.ProcessSaleInputSchema.safeParse,
      ).mockReturnValueOnce({
        success: false,
        error: {
          flatten: () => ({ fieldErrors: { cartItems: ["Required"] } }),
        },
      } as any);

      await expect(service.handleSale(mockCtx, mockBody, true)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
