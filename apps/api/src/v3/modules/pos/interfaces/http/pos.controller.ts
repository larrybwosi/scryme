import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  UseInterceptors,
  Query,
  Param,
  Req,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from "@nestjs/swagger";
import { V3AuthCoreService } from "../../../auth-core/infrastructure/services/v3-auth-core.service";
import { V3AuthGuard } from "@/v3/common/guards/v3-auth.guard";
import { v3Context } from "@/v3/common/decorators/v3-context.decorator";
import {
  type V3ApiContext,
  getPosProducts,
  getPosProductsDelta,
  type V2ApiContext,
} from "@repo/shared/api/v2";
import { ProcessSaleDto } from "../../application/dto/sale.dto";
import { ProcessSaleUseCase } from "../../application/use-cases/process-sale.use-case";
import { SyncUseCase } from "../../application/use-cases/sync.use-case";
import { GetTransactionsUseCase } from "../../application/use-cases/get-transactions.use-case";
import { RegisterPettyCashUseCase } from "../../application/use-cases/register-petty-cash.use-case";
import { RegisterPettyCashDto } from "../../application/dto/petty-cash.dto";
import { StandardResponseInterceptor } from "@/v3/common/interceptors/standard-response.interceptor";
import {
  ProvisionDeviceDto,
  PosLoginDto,
  PosLoginResponseDto,
  ProvisionResponseDto,
  PosCheckOutDto,
  PosRecordPaymentDto,
  PosAdjustStockDto,
  PosCreateCustomerDto,
  PosDispatchDeliveryDto,
  PosReconcileDeliveryDto,
  PosCreateStockRequestDto,
  PosCreateStockTransferDto,
  PosShiftSyncDto,
  PosRegisterBarcodeDto,
} from "../../application/dto/pos.dto";
import { ApiErrorResponseDto } from "@/v3/common/dto/response.dto";
import { MultiTenancyGuard } from "@/v3/common/guards/multi-tenancy.guard";
import { RequireMember } from "@/v3/common/decorators/require-member.decorator";
import { PrismaService } from "@/prisma/prisma.service";
import { PosService } from "@/v2/pos/pos.service";
import { PosSaleService } from "@/v2/pos/pos-sale.service";
import { PosCustomerService } from "@/v2/pos/pos-customer.service";
import { AllowPublic } from "@/common/decorators/auth.decorator";

@ApiTags("V3 POS")
@Controller(":orgSlug/pos")
@ApiParam({ name: "orgSlug", type: "string" })
@UseInterceptors(StandardResponseInterceptor)
export class PosController {
  constructor(
    private readonly authCore: V3AuthCoreService,
    private readonly processSaleUseCase: ProcessSaleUseCase,
    private readonly syncUseCase: SyncUseCase,
    private readonly getTransactionsUseCase: GetTransactionsUseCase,
    private readonly registerPettyCashUseCase: RegisterPettyCashUseCase,
    private readonly prisma: PrismaService,
    private readonly posService: PosService,
    private readonly posSaleService: PosSaleService,
    private readonly posCustomerService: PosCustomerService,
  ) {}

  @Post("provision")
  @ApiOperation({
    summary: "Provision a new POS device using a setup token",
    operationId: "POS_Provision",
  })
  @ApiResponse({
    status: 201,
    type: ProvisionResponseDto,
    description: "Device provisioned",
  })
  @ApiResponse({
    status: 400,
    type: ApiErrorResponseDto,
    description: "Invalid token",
  })
  async provision(@Body() body: ProvisionDeviceDto) {
    return this.authCore.provisionDevice(body.token);
  }

  @Post("login")
  @ApiOperation({
    summary: "Login staff member to a provisioned POS device",
    operationId: "POS_Login",
  })
  @ApiResponse({
    status: 200,
    type: PosLoginResponseDto,
    description: "Login successful",
  })
  @ApiResponse({
    status: 401,
    type: ApiErrorResponseDto,
    description: "Invalid credentials",
  })
  async login(@Body() body: PosLoginDto, @Req() req: any) {
    const apiKeyHeader = req.headers["x-api-key"] || req.headers["X-API-KEY"];
    let clientId = body.clientId;
    if (!clientId && apiKeyHeader) {
      const apiKeyStr = Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader;
      clientId = apiKeyStr.includes(".") ? apiKeyStr.split(".")[0] : apiKeyStr;
    }
    if (!clientId && body.deviceKey) {
      const devKey = body.deviceKey;
      clientId = devKey.includes(".") ? devKey.split(".")[0] : devKey;
    }
    if (!clientId) {
      throw new BadRequestException("clientId or X-API-KEY header is required");
    }

    return this.authCore.loginMember(
      clientId,
      body.pin || "",
      body.cardId,
    );
  }

  @Post("check-out")
  @RequireMember()
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Member check-out",
    operationId: "POS_CheckOut",
  })
  @ApiResponse({ status: 200, description: "Check-out successful" })
  async checkOut(@v3Context() ctx: V3ApiContext, @Body() body: PosCheckOutDto) {
    return this.posService.checkOut(ctx as unknown as V2ApiContext, body);
  }

  @Get("attendance/status")
  @RequireMember()
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get member attendance status",
    operationId: "POS_GetAttendanceStatus",
  })
  @ApiResponse({ status: 200, description: "Attendance status" })
  async getAttendanceStatus(@v3Context() ctx: V3ApiContext) {
    return this.posService.getAttendanceStatus(ctx as unknown as V2ApiContext);
  }

  @Get("me")
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get current POS device and staff context",
    operationId: "POS_GetMe",
  })
  @ApiResponse({ status: 200, description: "Current context" })
  async getMe(@v3Context() ctx: V3ApiContext) {
    return {
      ...ctx,
      isCheckedIn: !!ctx.memberId,
    };
  }

  @Get("locations")
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get POS active inventory locations",
    operationId: "POS_GetLocations",
  })
  @ApiResponse({ status: 200, description: "Active locations" })
  async getLocations(@v3Context() ctx: V3ApiContext) {
    const locations = await this.prisma.client.inventoryLocation.findMany({
      where: {
        organizationId: ctx.organizationId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        code: true,
        address: true,
        locationType: true,
        isDefault: true,
      },
      orderBy: { name: "asc" },
    });
    return { locations };
  }

  @Get("products")
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get POS products for full or delta sync",
    operationId: "POS_GetProducts",
  })
  @ApiResponse({ status: 200, description: "POS products list" })
  async getProducts(@v3Context() ctx: V3ApiContext, @Query() query: any) {
    const { lastSync, locationId: queryLocationId, page, limit, search, categoryId } = query;
    const locationId = ctx.locationId || queryLocationId;

    if (!locationId) {
      throw new BadRequestException("Location ID is required.");
    }

    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 2000;

    return lastSync
      ? getPosProductsDelta({
          prisma: this.prisma.client,
          organizationId: ctx.organizationId,
          locationId,
          lastSync,
          page: pageNum,
          limit: limitNum,
        })
      : getPosProducts({
          prisma: this.prisma.client,
          organizationId: ctx.organizationId,
          locationId,
          page: pageNum,
          limit: limitNum,
          search,
          categoryId,
        });
  }

  @Get("sale")
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "List sales history / transactions",
    operationId: "POS_GetSalesHistory",
  })
  @ApiResponse({ status: 200, description: "Sales history" })
  async getSalesHistory(@v3Context() ctx: V3ApiContext, @Query() query: any) {
    return this.getTransactionsUseCase.execute(ctx, query);
  }

  @AllowPublic()
  @Post("ably-auth")
  @ApiOperation({
    summary: "Get token for realtime communication",
    operationId: "POS_AblyAuth",
  })
  @ApiResponse({ status: 200, description: "Realtime Auth token" })
  async ablyAuthPublic(@Req() req: any) {
    const authHeader = req.headers["x-member-token"] || req.headers["authorization"] || req.headers["x-api-key"];
    if (authHeader) {
      const rawToken = Array.isArray(authHeader) ? authHeader[0] : authHeader;
      const cleanToken = rawToken.startsWith("Bearer ") ? rawToken.split(" ")[1] : rawToken;
      if (cleanToken) {
        try {
          const verified = await this.authCore.verifyToken(cleanToken);
          if (verified) {
            return {
              data: {
                tokenRequest: { token: cleanToken },
                metadata: {
                  paymentChannel: `organization:${verified.organizationId}:payments`,
                  organizationId: verified.organizationId,
                },
              },
            };
          }
        } catch {
          // Token verification failed, fallback to default
        }
      }
    }

    return {
      data: {
        tokenRequest: { token: "socket-io-realtime" },
        metadata: { paymentChannel: "public" },
      },
    };
  }

  @Get("sale/:id")
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get POS sale by ID",
    operationId: "POS_GetSaleById",
  })
  @ApiResponse({ status: 200, description: "Sale transaction details" })
  async getSaleById(@v3Context() ctx: V3ApiContext, @Param("id") id: string) {
    const sale = await this.prisma.client.transaction.findFirst({
      where: {
        id,
        organizationId: ctx.organizationId,
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        items: true,
        payments: true,
        serviceItems: true,
      },
    });
    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found`);
    }
    return sale;
  }

  @Post("sale")
  @RequireMember()
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Process a new POS sale",
    operationId: "POS_ProcessSale",
  })
  @ApiResponse({ status: 201, description: "Sale processed" })
  @ApiResponse({
    status: 400,
    type: ApiErrorResponseDto,
    description: "Invalid sale data",
  })
  async processSale(
    @v3Context() ctx: V3ApiContext,
    @Body() body: ProcessSaleDto,
    @Query("locationId") queryLocationId?: string,
  ) {
    const saleCtx = {
      ...ctx,
      locationId: ctx.locationId || queryLocationId || body?.locationId,
    };
    return this.processSaleUseCase.execute(saleCtx, body);
  }

  @Post("sale/payments")
  @RequireMember()
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Record payment for a sale",
    operationId: "POS_RecordPayment",
  })
  @ApiResponse({ status: 200, description: "Payment recorded" })
  async recordPayment(
    @v3Context() ctx: V3ApiContext,
    @Body() body: PosRecordPaymentDto | any,
  ) {
    if (body.transactionId && body.amount && body.method && !body.saleId) {
      body.saleId = body.transactionId;
    }
    return this.posService.recordPayment(ctx as unknown as V2ApiContext, body);
  }

  @Get("incoming")
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "List incoming shipments and transfers",
    operationId: "POS_GetIncoming",
  })
  @ApiResponse({ status: 200, description: "Incoming shipments" })
  async getIncoming(@v3Context() ctx: V3ApiContext, @Query() query: any) {
    return this.posService.getIncoming(ctx as unknown as V2ApiContext, query);
  }

  @Post("transaction/scan")
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Scan transaction QR code",
    operationId: "POS_ScanTransaction",
  })
  @ApiResponse({ status: 200, description: "Transaction QR payload" })
  async scanTransaction(
    @v3Context() ctx: V3ApiContext,
    @Body("code") code: string,
  ) {
    return this.posService.scanTransaction(ctx as unknown as V2ApiContext, code);
  }

  @Post("transactions/scan")
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Scan transaction QR code (plural alias)",
    operationId: "POS_ScanTransactionsAlias",
  })
  @ApiResponse({ status: 200, description: "Transaction QR payload" })
  async scanTransactionsAlias(
    @v3Context() ctx: V3ApiContext,
    @Body("code") code: string,
  ) {
    return this.posService.scanTransaction(ctx as unknown as V2ApiContext, code);
  }

  @Post("ably-auth/context")
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Realtime messaging token/auth for POS websocket channel",
    operationId: "POS_AblyAuthContext",
  })
  @ApiResponse({ status: 200, description: "Realtime token details" })
  async ablyAuthContext(@v3Context() ctx: V3ApiContext) {
    return this.posService.ablyAuth(ctx as unknown as V2ApiContext);
  }

  @Get("inventory")
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get POS stock inventory levels",
    operationId: "POS_GetInventory",
  })
  @ApiResponse({ status: 200, description: "POS inventory" })
  async getInventory(@v3Context() ctx: V3ApiContext, @Query() query: any) {
    return this.posService.getInventory(ctx as unknown as V2ApiContext, query);
  }

  @Post("inventory")
  @RequireMember()
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Adjust POS stock level",
    operationId: "POS_AdjustStock",
  })
  @ApiResponse({ status: 200, description: "Stock adjusted" })
  async adjustStock(
    @v3Context() ctx: V3ApiContext,
    @Body() body: PosAdjustStockDto,
  ) {
    return this.posService.adjustStock(ctx as unknown as V2ApiContext, body);
  }

  @Get("sync")
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Full or delta POS sync",
    operationId: "POS_Sync",
  })
  @ApiResponse({ status: 200, description: "Sync data" })
  async sync(@v3Context() ctx: V3ApiContext, @Query() query: any) {
    return this.syncUseCase.execute(ctx, query);
  }

  @Get("transactions")
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "List POS transactions",
    operationId: "POS_GetTransactions",
  })
  @ApiResponse({ status: 200, description: "Transactions" })
  async getTransactions(@v3Context() ctx: V3ApiContext, @Query() query: any) {
    return this.getTransactionsUseCase.execute(ctx, query);
  }

  @Get("customers")
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "POS customer delta sync",
    operationId: "POS_GetCustomersDelta",
  })
  @ApiResponse({ status: 200, description: "Customer list/delta" })
  async getCustomersDelta(
    @v3Context() ctx: V3ApiContext,
    @Query("lastSync") lastSync?: string,
  ) {
    return this.posCustomerService.getCustomersDelta(ctx.organizationId, lastSync);
  }

  @Post("customers")
  @RequireMember()
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Create a new customer via POS",
    operationId: "POS_CreateCustomer",
  })
  @ApiResponse({ status: 201, description: "Customer created" })
  async createCustomer(
    @v3Context() ctx: V3ApiContext,
    @Body() body: PosCreateCustomerDto,
  ) {
    return this.posService.createCustomer(ctx as unknown as V2ApiContext, body);
  }

  @Post("deliveries/dispatch")
  @RequireMember()
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Dispatch order delivery",
    operationId: "POS_DispatchDelivery",
  })
  @ApiResponse({ status: 200, description: "Delivery dispatched" })
  async dispatchDelivery(
    @v3Context() ctx: V3ApiContext,
    @Query("transactionId") transactionId: string,
    @Body() body: PosDispatchDeliveryDto,
  ) {
    return this.posService.dispatchDelivery(ctx as unknown as V2ApiContext, transactionId, body);
  }

  @Post("deliveries/reconcile-pod")
  @RequireMember()
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Reconcile delivery proof of delivery (POD)",
    operationId: "POS_ReconcileDelivery",
  })
  @ApiResponse({ status: 200, description: "Delivery reconciled" })
  async reconcileDelivery(
    @v3Context() ctx: V3ApiContext,
    @Body() body: PosReconcileDeliveryDto,
  ) {
    return this.posService.reconcileDelivery(ctx as unknown as V2ApiContext, body);
  }

  @Get("stock-requests")
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "List POS stock requests",
    operationId: "POS_ListStockRequests",
  })
  @ApiResponse({ status: 200, description: "Stock requests" })
  async listStockRequests(@v3Context() ctx: V3ApiContext) {
    return this.posService.listStockRequests(ctx as unknown as V2ApiContext);
  }

  @Post("stock-requests")
  @RequireMember()
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Create a POS stock request",
    operationId: "POS_CreateStockRequest",
  })
  @ApiResponse({ status: 201, description: "Stock request created" })
  async createStockRequest(
    @v3Context() ctx: V3ApiContext,
    @Body() body: PosCreateStockRequestDto,
  ) {
    return this.posService.createStockRequest(ctx as unknown as V2ApiContext, body);
  }

  @Post("stock-requests/:id/cancel")
  @RequireMember()
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Cancel POS stock request",
    operationId: "POS_CancelStockRequest",
  })
  @ApiResponse({ status: 200, description: "Stock request cancelled" })
  async cancelStockRequest(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
  ) {
    return this.posService.cancelStockRequest(ctx as unknown as V2ApiContext, id);
  }

  @Get("pricing")
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get POS pricing data and price lists",
    operationId: "POS_GetPricing",
  })
  @ApiResponse({ status: 200, description: "Pricing data" })
  async getPricing(
    @v3Context() ctx: V3ApiContext,
    @Query("lastSync") lastSync?: string,
  ) {
    return this.posService.getPricing(ctx as unknown as V2ApiContext, lastSync);
  }

  @Get("pricing/sync")
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Sync POS pricing delta",
    operationId: "POS_SyncPricing",
  })
  @ApiResponse({ status: 200, description: "Pricing sync data" })
  async syncPricing(
    @v3Context() ctx: V3ApiContext,
    @Query("lastSync") lastSync?: string,
  ) {
    return this.posService.getPricing(ctx as unknown as V2ApiContext, lastSync);
  }

  @Post("shifts/sync")
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Sync POS shifts",
    operationId: "POS_SyncShifts",
  })
  @ApiResponse({ status: 200, description: "Shift synchronized" })
  async syncShifts(
    @v3Context() ctx: V3ApiContext,
    @Body() body: PosShiftSyncDto,
  ) {
    return this.posService.syncShifts(ctx as unknown as V2ApiContext, body);
  }

  @Get("waybill/:id")
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get transaction waybill document URL",
    operationId: "POS_GetWaybill",
  })
  @ApiResponse({ status: 200, description: "Waybill document details" })
  async getWaybill(@v3Context() ctx: V3ApiContext, @Param("id") id: string) {
    return this.posService.getWaybill(ctx as unknown as V2ApiContext, id);
  }

  @Get("packing-list/:id")
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get transaction packing list document URL",
    operationId: "POS_GetPackingList",
  })
  @ApiResponse({ status: 200, description: "Packing list document details" })
  async getPackingList(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
  ) {
    return this.posService.getPackingList(ctx as unknown as V2ApiContext, id);
  }

  @Get("inventory/requests")
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "List inventory requests (alias)",
    operationId: "POS_ListInventoryRequests",
  })
  @ApiResponse({ status: 200, description: "Inventory requests" })
  async listInventoryRequests(@v3Context() ctx: V3ApiContext) {
    return this.posService.listStockRequests(ctx as unknown as V2ApiContext);
  }

  @Post("inventory/requests")
  @RequireMember()
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Create inventory request (alias)",
    operationId: "POS_CreateInventoryRequest",
  })
  @ApiResponse({ status: 201, description: "Inventory request created" })
  async createInventoryRequest(
    @v3Context() ctx: V3ApiContext,
    @Body() body: PosCreateStockRequestDto,
  ) {
    return this.posService.createStockRequest(ctx as unknown as V2ApiContext, body);
  }

  @Post("inventory/process")
  @RequireMember()
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Process inventory adjustment (alias)",
    operationId: "POS_ProcessInventory",
  })
  @ApiResponse({ status: 200, description: "Inventory processed" })
  async processInventory(
    @v3Context() ctx: V3ApiContext,
    @Body() body: PosAdjustStockDto,
  ) {
    return this.posService.adjustStock(ctx as unknown as V2ApiContext, body);
  }

  @Post("purchases/:id/receive")
  @RequireMember()
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Receive purchase order shipment",
    operationId: "POS_ReceivePurchase",
  })
  @ApiResponse({ status: 200, description: "Purchase order received" })
  async receivePurchase(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.posService.receivePurchase(ctx as unknown as V2ApiContext, id, body);
  }

  @Post("inventory/transfers/:id/receive")
  @RequireMember()
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Receive stock transfer shipment",
    operationId: "POS_ReceiveTransfer",
  })
  @ApiResponse({ status: 200, description: "Stock transfer received" })
  async receiveTransfer(
    @v3Context() ctx: V3ApiContext,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.posService.receiveTransfer(ctx as unknown as V2ApiContext, id, body);
  }

  @Post("orders")
  @RequireMember()
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Create sale order via POS",
    operationId: "POS_CreateOrder",
  })
  @ApiResponse({ status: 201, description: "Order created" })
  async createOrder(@v3Context() ctx: V3ApiContext, @Body() body: any) {
    return this.posSaleService.handleOrder(ctx as unknown as V2ApiContext, body);
  }

  @Get("drivers")
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "List available delivery drivers",
    operationId: "POS_GetDrivers",
  })
  @ApiResponse({ status: 200, description: "List of drivers" })
  async getDrivers(@v3Context() ctx: V3ApiContext) {
    return this.posService.getDrivers(ctx as unknown as V2ApiContext);
  }

  @Post("inventory/transfers")
  @RequireMember()
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Create stock transfer",
    operationId: "POS_CreateStockTransfer",
  })
  @ApiResponse({ status: 201, description: "Stock transfer created" })
  async createStockTransfer(
    @v3Context() ctx: V3ApiContext,
    @Body() body: PosCreateStockTransferDto,
  ) {
    return this.posService.createStockTransfer(ctx as unknown as V2ApiContext, body);
  }

  @Post("petty-cash")
  @RequireMember()
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Register a new petty cash expense",
    operationId: "POS_RegisterPettyCash",
  })
  @ApiResponse({ status: 201, description: "Petty cash expense registered" })
  async registerPettyCash(
    @v3Context() ctx: V3ApiContext,
    @Body() body: RegisterPettyCashDto,
  ) {
    return this.registerPettyCashUseCase.execute(ctx, body);
  }

  @Get("petty-cash/funds")
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "List available petty cash funds",
    operationId: "POS_GetPettyCashFunds",
  })
  @ApiResponse({ status: 200, description: "Petty cash funds" })
  async getPettyCashFunds(@v3Context() ctx: V3ApiContext) {
    return this.registerPettyCashUseCase.getFunds(ctx);
  }

  @Get("petty-cash/transactions")
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "List recent petty cash transactions",
    operationId: "POS_GetPettyCashTransactions",
  })
  @ApiResponse({ status: 200, description: "Petty cash transactions" })
  async getPettyCashTransactions(
    @v3Context() ctx: V3ApiContext,
    @Query("limit") limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.registerPettyCashUseCase.getRecentTransactions(ctx, parsedLimit);
  }

  @Post("inventory/barcode")
  @RequireMember()
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Register or update product variant barcode",
    operationId: "POS_RegisterBarcode",
  })
  @ApiResponse({ status: 200, description: "Barcode registered/updated" })
  async registerBarcode(
    @v3Context() ctx: V3ApiContext,
    @Body() body: PosRegisterBarcodeDto,
  ) {
    return this.posService.registerBarcode(ctx as unknown as V2ApiContext, body);
  }
}
