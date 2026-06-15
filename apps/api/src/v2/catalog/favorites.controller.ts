import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import {ApiTags, ApiOperation} from "@nestjs/swagger";
import {FavoritesService} from "./favorites.service";
import {v2Context} from "../../common/decorators/v2-context.decorator";
import {RequirePermission} from "../../common/decorators/auth.decorator";
import type {V2ApiContext} from "@repo/shared/server";

@ApiTags("Favorites")
@Controller("catalog/favorites")
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({summary: "Get all favorite products for the current customer"})
  @RequirePermission("customer:read:own")
  async getFavorites(@v2Context() ctx: V2ApiContext) {
    return this.favoritesService.getFavorites(ctx);
  }

  @Post(":productId")
  @ApiOperation({summary: "Add a product to favorites"})
  @RequirePermission("customer:write:own")
  async addFavorite(
    @v2Context() ctx: V2ApiContext,
    @Param("productId") productId: string,
  ) {
    return this.favoritesService.addFavorite(ctx, productId);
  }

  @Delete(":productId")
  @ApiOperation({summary: "Remove a product from favorites"})
  @RequirePermission("customer:write:own")
  async removeFavorite(
    @v2Context() ctx: V2ApiContext,
    @Param("productId") productId: string,
  ) {
    return this.favoritesService.removeFavorite(ctx, productId);
  }

  @Get(":productId/check")
  @ApiOperation({summary: "Check if a product is in favorites"})
  @RequirePermission("customer:read:own")
  async isFavorite(
    @v2Context() ctx: V2ApiContext,
    @Param("productId") productId: string,
  ) {
    return {isFavorite: await this.favoritesService.isFavorite(ctx, productId)};
  }
}
