import { ProductController } from "../product.controller";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BadRequestException, NotFoundException, ForbiddenException } from "@nestjs/common";

describe("ProductController Reviews", () => {
  let controller: ProductController;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      client: {
        product: {
          findFirst: vi.fn(),
        },
        productReview: {
          create: vi.fn(),
          findFirst: vi.fn(),
          update: vi.fn(),
          delete: vi.fn(),
        },
      },
    };

    controller = new ProductController(
      {} as any, // getProductsUseCase
      {} as any, // createProductUseCase
      {} as any, // reviewPriceChangeUseCase
      {} as any, // pricingManagementService
      mockPrisma as any,
      {} as any, // serviceManagement
    );

    vi.clearAllMocks();
  });

  describe("createReview", () => {
    it("should throw BadRequestException if customerId is missing", async () => {
      const req = {
        organization: { id: "org-1" },
        v3Context: {},
      };

      await expect(
        controller.createReview(req, "prod-1", { rating: 5, comment: "Nice" })
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw NotFoundException if product does not exist", async () => {
      const req = {
        organization: { id: "org-1" },
        v3Context: { customerId: "cust-1" },
      };

      mockPrisma.client.product.findFirst.mockResolvedValue(null);

      await expect(
        controller.createReview(req, "prod-1", { rating: 5, comment: "Nice" })
      ).rejects.toThrow(NotFoundException);
    });

    it("should successfully create review using v3Context customerId", async () => {
      const req = {
        organization: { id: "org-1" },
        v3Context: { customerId: "cust-1" },
      };

      const mockProduct = { id: "prod-1", organizationId: "org-1" };
      const mockReview = { id: "review-1", rating: 5, comment: "Nice", customer: { id: "cust-1", name: "John" } };

      mockPrisma.client.product.findFirst.mockResolvedValue(mockProduct);
      mockPrisma.client.productReview.create.mockResolvedValue(mockReview);

      const result = await controller.createReview(req, "prod-1", { rating: 5, comment: "Nice" });

      expect(mockPrisma.client.product.findFirst).toHaveBeenCalledWith({
        where: { id: "prod-1", organizationId: "org-1" },
        select: { id: true },
      });
      expect(mockPrisma.client.productReview.create).toHaveBeenCalledWith({
        data: {
          organizationId: "org-1",
          customerId: "cust-1",
          productId: "prod-1",
          rating: 5,
          comment: "Nice",
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      expect(result).toEqual(mockReview);
    });
  });

  describe("updateReview", () => {
    it("should throw ForbiddenException if review belongs to a different customer", async () => {
      const req = {
        organization: { id: "org-1" },
        v3Context: { customerId: "cust-1" },
      };

      const mockReview = { id: "review-1", organizationId: "org-1", customerId: "cust-2" };
      mockPrisma.client.productReview.findFirst.mockResolvedValue(mockReview);

      await expect(
        controller.updateReview(req, "review-1", { rating: 4 })
      ).rejects.toThrow(ForbiddenException);
    });

    it("should successfully update review", async () => {
      const req = {
        organization: { id: "org-1" },
        v3Context: { customerId: "cust-1" },
      };

      const mockReview = { id: "review-1", organizationId: "org-1", customerId: "cust-1" };
      mockPrisma.client.productReview.findFirst.mockResolvedValue(mockReview);
      mockPrisma.client.productReview.update.mockResolvedValue({ id: "review-1", rating: 4 });

      const result = await controller.updateReview(req, "review-1", { rating: 4 });

      expect(mockPrisma.client.productReview.update).toHaveBeenCalledWith({
        where: { id: "review-1" },
        data: { rating: 4, comment: undefined },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      expect(result).toEqual({ id: "review-1", rating: 4 });
    });
  });

  describe("deleteReview", () => {
    it("should allow deleting review if owner", async () => {
      const req = {
        organization: { id: "org-1" },
        v3Context: { customerId: "cust-1", scopes: [] },
      };

      const mockReview = { id: "review-1", organizationId: "org-1", customerId: "cust-1" };
      mockPrisma.client.productReview.findFirst.mockResolvedValue(mockReview);

      const result = await controller.deleteReview(req, "review-1");

      expect(mockPrisma.client.productReview.delete).toHaveBeenCalledWith({
        where: { id: "review-1" },
      });
      expect(result).toEqual({ success: true });
    });

    it("should allow deleting review if admin via scopes", async () => {
      const req = {
        organization: { id: "org-1" },
        v3Context: { customerId: "admin-cust", scopes: ["*"] },
      };

      const mockReview = { id: "review-1", organizationId: "org-1", customerId: "cust-1" };
      mockPrisma.client.productReview.findFirst.mockResolvedValue(mockReview);

      const result = await controller.deleteReview(req, "review-1");

      expect(mockPrisma.client.productReview.delete).toHaveBeenCalledWith({
        where: { id: "review-1" },
      });
      expect(result).toEqual({ success: true });
    });
  });
});
