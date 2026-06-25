import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
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
import { V3AuthGuard } from "@/v3/common/guards/v3-auth.guard";
import { MultiTenancyGuard } from "@/v3/common/guards/multi-tenancy.guard";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";
import { CartUseCase } from "../../application/use-cases/cart.use-case";
import {
  AddToCartDto,
  RemoveFromCartDto,
  CartResponseDto,
} from "../../application/dto/cart.dto";

@ApiTags("V3 Cart")
@ApiBearerAuth()
@UseGuards(V3AuthGuard, MultiTenancyGuard)
@UseInterceptors(StandardResponseInterceptor)
@Controller(":orgSlug/cart")
export class CartController {
  constructor(private readonly cartUseCase: CartUseCase) {}

  @Get()
  @ApiOperation({ summary: "Get current cart" })
  @ApiResponse({ status: 200, type: CartResponseDto })
  async getCart(@Request() req: any, @Query("sessionId") sessionId?: string) {
    const customerId = req.user?.id; // Assuming user id is customer id if logged in
    return this.cartUseCase.getCart(req.organization.id, customerId, sessionId);
  }

  @Post("items")
  @ApiOperation({ summary: "Add item to cart" })
  async addToCart(@Request() req: any, @Body() dto: AddToCartDto) {
    const customerId = req.user?.id;
    return this.cartUseCase.addToCart(req.organization.id, {
      ...dto,
      customerId: customerId || dto.customerId,
    });
  }

  @Delete("items")
  @ApiOperation({ summary: "Remove item from cart" })
  async removeFromCart(@Request() req: any, @Body() dto: RemoveFromCartDto) {
    const customerId = req.user?.id;
    return this.cartUseCase.removeFromCart(req.organization.id, {
      ...dto,
      customerId: customerId || dto.customerId,
    });
  }
}
