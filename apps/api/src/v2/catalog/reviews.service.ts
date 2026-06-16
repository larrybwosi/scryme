import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import type { V2ApiContext } from "@repo/shared/api/v2/types";
import { paginate } from "../../v3/common/utils/pagination";

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async getProductReviews(ctx: V2ApiContext, productId: string, query: any) {
    const { organizationId } = ctx;
    const { page = 1, limit = 10 } = query;
    const offset = (Number(page) - 1) * Number(limit);

    const result = await paginate(
      this.prisma.client.productReview,
      { offset, limit: Number(limit) },
      {
        organizationId,
        productId,
        isVisible: true,
      },
      { createdAt: "desc" },
      {
        include: {
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    );

    return {
      data: result.data,
      totalCount: result.total,
      currentPage: Number(page),
      totalPages: Math.ceil(result.total / Number(limit)),
      limit: Number(limit),
    };
  }

  async createReview(ctx: V2ApiContext, productId: string, data: any) {
    const { organizationId, customerId } = ctx;
    if (!customerId) throw new BadRequestException("Customer ID is required");

    const { rating, comment } = data;

    return this.prisma.client.productReview.create({
      data: {
        organizationId,
        customerId,
        productId,
        rating: Number(rating),
        comment,
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
  }

  async updateReview(ctx: V2ApiContext, reviewId: string, data: any) {
    const { customerId } = ctx;
    if (!customerId) throw new BadRequestException("Customer ID is required");

    const review = await this.prisma.client.productReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) throw new NotFoundException("Review not found");
    if (review.customerId !== customerId)
      throw new ForbiddenException("Not authorized to update this review");

    const { rating, comment } = data;

    return this.prisma.client.productReview.update({
      where: { id: reviewId },
      data: {
        rating: rating !== undefined ? Number(rating) : undefined,
        comment,
      },
    });
  }

  async deleteReview(ctx: V2ApiContext, reviewId: string) {
    const { customerId, permissions } = ctx;
    if (!customerId) throw new BadRequestException("Customer ID is required");

    const review = await this.prisma.client.productReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) throw new NotFoundException("Review not found");

    const isOwner = review.customerId === customerId;
    const canManageAll =
      permissions.includes("*") ||
      permissions.includes("product:manage:reviews");

    if (!isOwner && !canManageAll) {
      throw new ForbiddenException("Not authorized to delete this review");
    }

    return this.prisma.client.productReview.delete({
      where: { id: reviewId },
    });
  }
}
