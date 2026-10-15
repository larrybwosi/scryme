import {
  Controller,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { V3AuthGuard } from "@/v3/common/guards/v3-auth.guard";
import { MultiTenancyGuard } from "@/v3/common/guards/multi-tenancy.guard";
import { PermissionsGuard } from "@/v3/common/guards/permissions.guard";
import { Permissions } from "@/v3/common/decorators/permissions.decorator";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";
import { v3Context } from "@/v3/common/decorators/v3-context.decorator";
import { type V3ApiContext } from "@repo/shared/api/v3";
import { SalesService } from "../../application/services/sales.service";
import { SalesAnalyticsDto, OrderItemDto } from "../../dto/sales.dto";

@ApiTags("V3 Sales")
@ApiBearerAuth()
@UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
@UseInterceptors(StandardResponseInterceptor)
@Controller(":orgSlug/sales")
@ApiParam({ name: "orgSlug", type: "string" })
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get("analytics")
  @Permissions("sales:read")
  @ApiOperation({
    summary: "Get sales analytics",
    operationId: "Sales_GetAnalytics",
  })
  @ApiResponse({
    status: 200,
    type: SalesAnalyticsDto,
    description: "Sales analytics data",
  })
  async getAnalytics(@v3Context() ctx: V3ApiContext) {
    return this.salesService.getAnalytics(ctx.organizationId, ctx.memberId);
  }

  @Get("orders")
  @Permissions("sales:read")
  @ApiOperation({
    summary: "List sales orders",
    operationId: "Sales_GetOrders",
  })
  @ApiQuery({ name: "query", required: false, type: String })
  @ApiResponse({
    status: 200,
    type: [OrderItemDto],
    description: "Sales orders list",
  })
  async getOrders(
    @v3Context() ctx: V3ApiContext,
    @Query("query") query?: string,
  ) {
    return this.salesService.getOrders(ctx.organizationId, query);
  }
}
