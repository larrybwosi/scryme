import { Controller, Get, Post, Body, Req, UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from "@nestjs/swagger";
import { B2BUseCase } from "../../application/use-cases/b2b.use-case";
import { V3AuthGuard } from "@/v3/common/guards/v3-auth.guard";
import { MultiTenancyGuard } from "@/v3/common/guards/multi-tenancy.guard";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";
import { CreateB2BOrderDto, B2BOrderResponseDto, B2BCatalogProductDto, CatalogPaginationDto, PaginatedB2BCatalogDto } from "../../application/dto/b2b.dto";
import { ApiErrorResponseDto } from "@/v3/common/dto/response.dto";
import { Query } from "@nestjs/common";

@ApiTags("V3 B2B")
@ApiBearerAuth()
@Controller(":orgSlug/b2b")
@ApiParam({ name: "orgSlug", type: "string" })
@UseGuards(V3AuthGuard, MultiTenancyGuard)
@UseInterceptors(StandardResponseInterceptor)
export class B2BController {
  constructor(private readonly b2bUseCase: B2BUseCase) {}

  @Get("catalog")
  @ApiOperation({
    summary: "Get B2B product catalog",
    description: "Returns all active products with variants and stock information for the business account.",
    operationId: "B2B_GetCatalog",
  })
  @ApiResponse({ status: 200, type: PaginatedB2BCatalogDto, description: "Paginated list of products in the catalog" })
  async getCatalog(@Req() req: any, @Query() query: CatalogPaginationDto) {
    const businessAccountId = req.v3Context?.businessAccountId;
    const organizationId =
      req.v3Context?.organizationId || req.organization?.id;
    return this.b2bUseCase.getCatalog(organizationId, businessAccountId, query);
  }

  @Get("invoices")
  @ApiOperation({
    summary: "Get B2B invoices",
    description: "Returns a list of POS sales associated with the business account.",
    operationId: "B2B_GetInvoices",
  })
  @ApiResponse({ status: 200, description: "List of invoices" })
  async getInvoices(@Req() req: any) {
    const businessAccountId = req.v3Context?.businessAccountId;
    const organizationId =
      req.v3Context?.organizationId || req.organization?.id;
    return this.b2bUseCase.getInvoices(organizationId, businessAccountId);
  }

  @Get("orders")
  @ApiOperation({
    summary: "Get B2B orders",
    description: "Returns a list of sales orders associated with the business account.",
    operationId: "B2B_GetOrders",
  })
  @ApiResponse({ status: 200, description: "List of orders" })
  async getOrders(@Req() req: any) {
    const businessAccountId = req.v3Context?.businessAccountId;
    const organizationId =
      req.v3Context?.organizationId || req.organization?.id;
    return this.b2bUseCase.getOrders(organizationId, businessAccountId);
  }

  @Post("orders")
  @ApiOperation({
    summary: "Create a new B2B order",
    description: "Creates a sales order for the business account.",
    operationId: "B2B_CreateOrder",
  })
  @ApiResponse({
    status: 201,
    type: B2BOrderResponseDto,
    description: "Order created successfully",
  })
  @ApiResponse({
    status: 400,
    type: ApiErrorResponseDto,
    description: "Invalid input",
  })
  async createOrder(@Req() req: any, @Body() data: CreateB2BOrderDto) {
    const businessAccountId = req.v3Context?.businessAccountId;
    const organizationId =
      req.v3Context?.organizationId || req.organization?.id;
    return this.b2bUseCase.createOrder(organizationId, businessAccountId, data);
  }

  @Post("quotes")
  @ApiOperation({
    summary: "Request a B2B quote",
    description: "Creates a quote for the business account.",
    operationId: "B2B_CreateQuote",
  })
  @ApiResponse({
    status: 201,
    description: "Quote created successfully",
  })
  async createQuote(@Req() req: any, @Body() data: CreateB2BOrderDto) {
    const businessAccountId = req.v3Context?.businessAccountId;
    const organizationId =
      req.v3Context?.organizationId || req.organization?.id;
    return this.b2bUseCase.createQuote(organizationId, businessAccountId, data);
  }
}
