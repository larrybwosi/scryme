import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from "@nestjs/common";
import {ApiTags, ApiOperation} from "@nestjs/swagger";
import {ReviewsService} from "./reviews.service";
import {v2Context} from "../../common/decorators/v2-context.decorator";
import {
  RequirePermission,
  AllowPublic,
} from "../../common/decorators/auth.decorator";
import type {V2ApiContext} from "@repo/shared/server";

@ApiTags("Product Reviews")
@Controller("catalog")
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get("products/:productId/reviews")
  @AllowPublic()
  @ApiOperation({summary: "Get all reviews for a product"})
  async getProductReviews(
    @v2Context() ctx: V2ApiContext,
    @Param("productId") productId: string,
    @Query() query: any,
  ) {
    return this.reviewsService.getProductReviews(ctx, productId, query);
  }

  @Post("products/:productId/reviews")
  @RequirePermission("customer:write:own")
  @ApiOperation({summary: "Create a new review for a product"})
  async createReview(
    @v2Context() ctx: V2ApiContext,
    @Param("productId") productId: string,
    @Body() data: any,
  ) {
    return this.reviewsService.createReview(ctx, productId, data);
  }

  @Patch("reviews/:reviewId")
  @RequirePermission("customer:write:own")
  @ApiOperation({summary: "Update an existing review"})
  async updateReview(
    @v2Context() ctx: V2ApiContext,
    @Param("reviewId") reviewId: string,
    @Body() data: any,
  ) {
    return this.reviewsService.updateReview(ctx, reviewId, data);
  }

  @Delete("reviews/:reviewId")
  @RequirePermission("customer:write:own")
  @ApiOperation({summary: "Delete a review"})
  async deleteReview(
    @v2Context() ctx: V2ApiContext,
    @Param("reviewId") reviewId: string,
  ) {
    return this.reviewsService.deleteReview(ctx, reviewId);
  }
}
