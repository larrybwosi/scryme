import {
  Controller,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
  Req,
  Query,
  Param,
  Body,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from "@nestjs/swagger";
import { GetOrdersUseCase } from "../../application/use-cases/get-orders.use-case";
import { CreateOrderUseCase } from "../../application/use-cases/create-order.use-case";
import { UpdateOrderStatusUseCase } from "../../application/use-cases/update-order-status.use-case";
import { RequestB2BQuoteUseCase } from "../../application/use-cases/request-b2b-quote.use-case";
import { ConvertQuoteToOrderUseCase } from "../../application/use-cases/convert-quote-to-order.use-case";
import { MultiTenancyGuard } from "@/v3/common/guards/multi-tenancy.guard";
import { PermissionsGuard } from "@/v3/common/guards/permissions.guard";
import { AuditInterceptor } from "../../../../common/interceptors/audit.interceptor";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";
import { Permissions } from "@/v3/common/decorators/permissions.decorator";
import { PaginationQueryDto } from "@/v3/common/utils/pagination";
import { V3AuthGuard } from "@/v3/common/guards/v3-auth.guard";
import {
  UpdateOrderStatusDto,
  OrderResponseDto,
} from "../../application/dto/order.dto";
import { CreateOrderDto } from "../../application/dto/create-order.dto";
import { RequestB2BQuoteDto } from "../../application/dto/request-b2b-quote.dto";
import { ApiErrorResponseDto } from "@/v3/common/dto/response.dto";

@ApiTags("V3 Orders")
@ApiBearerAuth()
@Controller(":orgSlug/orders")
@UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor, StandardResponseInterceptor)
export class OrderController {
  constructor(
    private readonly getOrdersUseCase: GetOrdersUseCase,
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
    private readonly requestB2BQuoteUseCase: RequestB2BQuoteUseCase,
    private readonly convertQuoteToOrderUseCase: ConvertQuoteToOrderUseCase,
  ) {}

  @Post()
  @Permissions("order:create")
  @ApiOperation({
    summary: "Create a new order",
    operationId: "Orders_CreateOrder",
  })
  @ApiResponse({
    status: 201,
    type: OrderResponseDto,
    description: "Order created successfully",
  })
  @ApiResponse({
    status: 400,
    type: ApiErrorResponseDto,
    description: "Invalid input",
  })
  @ApiResponse({
    status: 401,
    type: ApiErrorResponseDto,
    description: "Unauthorized",
  })
  async createOrder(@Req() req: any, @Body() dto: CreateOrderDto) {
    return this.createOrderUseCase.execute(
      req.organization.id,
      dto,
      req.user?.memberId || req.user?.id,
    );
  }

  @Get()
  @Permissions("order:read")
  @ApiOperation({
    summary: "Get all orders for an organization (Paginated)",
    operationId: "Orders_GetOrders",
  })
  @ApiResponse({
    status: 200,
    type: [OrderResponseDto],
    description: "Paginated list of orders",
  })
  @ApiResponse({
    status: 401,
    type: ApiErrorResponseDto,
    description: "Unauthorized",
  })
  async getOrders(
    @Req() req: any,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.getOrdersUseCase.execute(req.organization.id, paginationQuery);
  }

  @Post(":id/status")
  @Permissions("order:write")
  @ApiOperation({
    summary: "Update order status and trigger notifications",
    operationId: "Orders_UpdateStatus",
  })
  @ApiResponse({
    status: 200,
    type: OrderResponseDto,
    description: "Order status updated",
  })
  @ApiResponse({
    status: 400,
    type: ApiErrorResponseDto,
    description: "Invalid status",
  })
  async updateStatus(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: UpdateOrderStatusDto,
  ) {
    return this.updateOrderStatusUseCase.execute(
      req.organization.id,
      req.user?.memberId,
      id,
      body.status,
    );
  }

  @Post("b2b/quotes")
  @Permissions("order:create")
  @ApiOperation({
    summary: "Request a B2B product quote and check availability",
    operationId: "Orders_RequestB2BQuote",
  })
  @ApiResponse({ status: 201, description: "Quote created successfully" })
  @ApiResponse({
    status: 400,
    type: ApiErrorResponseDto,
    description: "Invalid input or insufficient stock",
  })
  async requestB2BQuote(@Req() req: any, @Body() dto: RequestB2BQuoteDto) {
    return this.requestB2BQuoteUseCase.execute(req.organization.id, dto);
  }

  @Post("b2b/quotes/:id/convert")
  @Permissions("order:create")
  @ApiOperation({
    summary: "Convert a quote into a sales order",
    operationId: "Orders_ConvertQuoteToOrder",
  })
  @ApiResponse({ status: 200, description: "Quote converted to order" })
  @ApiResponse({
    status: 404,
    type: ApiErrorResponseDto,
    description: "Quote not found",
  })
  async convertQuoteToOrder(@Req() req: any, @Param("id") id: string) {
    return this.convertQuoteToOrderUseCase.execute(req.organization.id, id);
  }
}
