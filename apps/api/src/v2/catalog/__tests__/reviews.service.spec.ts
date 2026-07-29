import { Test, TestingModule } from "@nestjs/testing";
import { ReviewsService } from "../reviews.service";
import { PrismaService } from "@/prisma/prisma.service";
import { V2ApiContext } from "@repo/shared/api/v2";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { NotFoundException, ForbiddenException, BadRequestException } from "@nestjs/common";

describe("ReviewsService", () => {
  let service: ReviewsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              productReview: {
                findFirst: vi.fn(),
                create: vi.fn(),
                update: vi.fn(),
                delete: vi.fn(),
              },
            },
          },
        },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("updateReview", () => {
    it("should throw BadRequestException if customerId is missing", async () => {
      const ctx: V2ApiContext = { organizationId: "org-1" } as any;
      await expect(service.updateReview(ctx, "review-1", {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should look up the review scoped by organizationId and throw NotFoundException if not found", async () => {
      const ctx: V2ApiContext = { organizationId: "org-1", customerId: "cust-1" } as any;
      vi.spyOn(prisma.client.productReview, "findFirst").mockResolvedValue(null);

      await expect(service.updateReview(ctx, "review-1", {})).rejects.toThrow(
        NotFoundException,
      );

      expect(prisma.client.productReview.findFirst).toHaveBeenCalledWith({
        where: { id: "review-1", organizationId: "org-1" },
      });
    });

    it("should throw ForbiddenException if review belongs to a different customer", async () => {
      const ctx: V2ApiContext = { organizationId: "org-1", customerId: "cust-1" } as any;
      const mockReview = { id: "review-1", organizationId: "org-1", customerId: "cust-2" };
      vi.spyOn(prisma.client.productReview, "findFirst").mockResolvedValue(mockReview as any);

      await expect(service.updateReview(ctx, "review-1", {})).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("should successfully update the review if owner matches", async () => {
      const ctx: V2ApiContext = { organizationId: "org-1", customerId: "cust-1" } as any;
      const mockReview = { id: "review-1", organizationId: "org-1", customerId: "cust-1" };
      vi.spyOn(prisma.client.productReview, "findFirst").mockResolvedValue(mockReview as any);
      vi.spyOn(prisma.client.productReview, "update").mockResolvedValue({ id: "review-1" } as any);

      const result = await service.updateReview(ctx, "review-1", { rating: 5, comment: "Great!" });

      expect(prisma.client.productReview.update).toHaveBeenCalledWith({
        where: { id: "review-1" },
        data: { rating: 5, comment: "Great!" },
      });
      expect(result).toEqual({ id: "review-1" });
    });
  });

  describe("deleteReview", () => {
    it("should throw BadRequestException if customerId is missing", async () => {
      const ctx: V2ApiContext = { organizationId: "org-1" } as any;
      await expect(service.deleteReview(ctx, "review-1")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should look up the review scoped by organizationId and throw NotFoundException if not found", async () => {
      const ctx: V2ApiContext = { organizationId: "org-1", customerId: "cust-1", permissions: [] } as any;
      vi.spyOn(prisma.client.productReview, "findFirst").mockResolvedValue(null);

      await expect(service.deleteReview(ctx, "review-1")).rejects.toThrow(
        NotFoundException,
      );

      expect(prisma.client.productReview.findFirst).toHaveBeenCalledWith({
        where: { id: "review-1", organizationId: "org-1" },
      });
    });

    it("should throw ForbiddenException if review belongs to another customer and actor lacks admin permissions", async () => {
      const ctx: V2ApiContext = { organizationId: "org-1", customerId: "cust-1", permissions: [] } as any;
      const mockReview = { id: "review-1", organizationId: "org-1", customerId: "cust-2" };
      vi.spyOn(prisma.client.productReview, "findFirst").mockResolvedValue(mockReview as any);

      await expect(service.deleteReview(ctx, "review-1")).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("should successfully delete the review if owner matches", async () => {
      const ctx: V2ApiContext = { organizationId: "org-1", customerId: "cust-1", permissions: [] } as any;
      const mockReview = { id: "review-1", organizationId: "org-1", customerId: "cust-1" };
      vi.spyOn(prisma.client.productReview, "findFirst").mockResolvedValue(mockReview as any);
      vi.spyOn(prisma.client.productReview, "delete").mockResolvedValue({ id: "review-1" } as any);

      const result = await service.deleteReview(ctx, "review-1");

      expect(prisma.client.productReview.delete).toHaveBeenCalledWith({
        where: { id: "review-1" },
      });
      expect(result).toEqual({ id: "review-1" });
    });

    it("should successfully delete the review if actor has admin permission even if not the owner", async () => {
      const ctx: V2ApiContext = {
        organizationId: "org-1",
        customerId: "cust-1",
        permissions: ["product:manage:reviews"],
      } as any;
      const mockReview = { id: "review-1", organizationId: "org-1", customerId: "cust-2" };
      vi.spyOn(prisma.client.productReview, "findFirst").mockResolvedValue(mockReview as any);
      vi.spyOn(prisma.client.productReview, "delete").mockResolvedValue({ id: "review-1" } as any);

      const result = await service.deleteReview(ctx, "review-1");

      expect(prisma.client.productReview.delete).toHaveBeenCalledWith({
        where: { id: "review-1" },
      });
      expect(result).toEqual({ id: "review-1" });
    });
  });
});
