import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from "@nestjs/swagger";
import {V3AuthGuard} from "@/v3/common/guards/v3-auth.guard";
import {MultiTenancyGuard} from "@/v3/common/guards/multi-tenancy.guard";
import {StandardResponseInterceptor} from "@/v3/common/interceptors/standard-response.interceptor";
import {FavoritesUseCase} from "../../application/use-cases/favorites.use-case";
import {
  FavoriteDto,
  FavoriteResponseDto,
} from "../../application/dto/favorite.dto";

@ApiTags("V3 Favorites")
@ApiBearerAuth()
@UseGuards(V3AuthGuard, MultiTenancyGuard)
@UseInterceptors(StandardResponseInterceptor)
@Controller(":orgSlug/favorites")
export class FavoritesController {
  constructor(private readonly favoritesUseCase: FavoritesUseCase) {}

  @Get()
  @ApiOperation({summary: "Get customer favorites"})
  @ApiResponse({status: 200, type: [FavoriteResponseDto]})
  async getFavorites(@Request() req: any) {
    const customerId = req.v3Context?.memberId; // In V3, memberId is used for the authenticated user/customer
    return this.favoritesUseCase.getFavorites(req.organization.id, customerId);
  }

  @Post()
  @ApiOperation({summary: "Add product to favorites"})
  async addFavorite(@Request() req: any, @Body() dto: FavoriteDto) {
    const customerId = req.v3Context?.memberId;
    return this.favoritesUseCase.addFavorite(req.organization.id, {
      ...dto,
      customerId,
    });
  }

  @Delete()
  @ApiOperation({summary: "Remove product from favorites"})
  async removeFavorite(@Request() req: any, @Body() dto: FavoriteDto) {
    const customerId = req.v3Context?.memberId;
    return this.favoritesUseCase.removeFavorite(req.organization.id, {
      ...dto,
      customerId,
    });
  }
}
