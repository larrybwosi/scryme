import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Res,
  UsePipes,
} from "@nestjs/common";
import { env } from "@repo/env";
import { ApiTags, ApiOperation, ApiSecurity } from "@nestjs/swagger";
import { PosService } from "./pos.service";
import { PosSaleService } from "./pos-sale.service";
import { v2Context } from "../../common/decorators/v2-context.decorator";
import { type V2ApiContext } from "@repo/shared/api/v2";
import { Permissions } from "../../common/decorators/auth.decorator";
import { FastifyReply } from "fastify";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import {
  CheckInSchema,
  CheckOutSchema,
  AdjustStockSchema,
  CreateCustomerSchema,
  RecordPaymentSchema,
  CreateStockRequestSchema,
  CreateStockTransferSchema,
  ShiftSyncSchema,
  RegisterPettyCashSchema,
  RegisterBarcodeSchema,
} from "./pos.schema";

@ApiTags("POS")
@ApiSecurity("x-api-key")
@ApiSecurity("x-member-token")
@Controller("pos")
export class PosController {
  constructor(
    private readonly posService: PosService,
    private readonly posSaleService: PosSaleService,
  ) {}

  @Post("check-in")
  @Permissions("pos:auth")
  @ApiOperation({ summary: "Member check-in" })
  @UsePipes(new ZodValidationPipe(CheckInSchema))
  async checkIn(
    @v2Context() ctx: V2ApiContext,
    @Body() body: any,
    @Res() res: any,
  ) {
    const result = await this.posService.checkIn(ctx, body);

    res.setCookie("dealio_member_token", result.token, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
      domain: env.NEXT_PUBLIC_COOKIE_DOMAIN,
    });

    return res.send(result);
  }

  @Post("check-out")
  @Permissions("pos:auth")
  @ApiOperation({ summary: "Member check-out" })
  @UsePipes(new ZodValidationPipe(CheckOutSchema))
  async checkOut(@v2Context() ctx: V2ApiContext, @Body() body: any) {
    return this.posService.checkOut(ctx, body);
  }

  @Get("locations")
  @Permissions("pos:location:read")
  @ApiOperation({ summary: "List active locations" })
  async listLocations(@v2Context() ctx: V2ApiContext) {
    return this.posService.listLocations(ctx);
  }

  @Get("products")
  @Permissions("pos:product:read")
  @ApiOperation({ summary: "Get POS products" })
  async getProducts(@v2Context() ctx: V2ApiContext, @Query() query: any) {
    return this.posService.getProducts(ctx, query);
  }

  @Get("sale")
  @Permissions("pos:sale:read")
  @ApiOperation({ summary: "List sales history" })
  async getSalesHistory(@v2Context() ctx: V2ApiContext, @Query() query: any) {
    return this.posService.getTransactions(ctx, query);
  }

  @Get("transactions")
  @Permissions("pos:sale:read")
  @ApiOperation({ summary: "List transactions (alias)" })
  async getTransactions(@v2Context() ctx: V2ApiContext, @Query() query: any) {
    return this.posService.getTransactions(ctx, query);
  }

  @Post("sale")
  @Permissions("pos:sale:create")
  @ApiOperation({ summary: "Process a new sale" })
  async processSale(
    @v2Context() ctx: V2ApiContext,
    @Body() body: any,
    @Query("enableStockTracking") enableStockTracking: string,
  ) {
    return this.posSaleService.handleSale(
      ctx,
      body,
      enableStockTracking === "true",
    );
  }

  @Post("sale/payments")
  @Permissions("pos:sale:update")
  @ApiOperation({ summary: "Record payment for a sale" })
  @UsePipes(new ZodValidationPipe(RecordPaymentSchema))
  async recordPayment(@v2Context() ctx: V2ApiContext, @Body() body: any) {
    return this.posService.recordPayment(ctx, body);
  }

  @Get("incoming")
  @Permissions("pos:sale:read")
  @ApiOperation({ summary: "List incoming shipments" })
  async getIncoming(@v2Context() ctx: V2ApiContext, @Query() query: any) {
    return this.posService.getIncoming(ctx, query);
  }

  @Post("transaction/scan")
  @Permissions("pos:sale:read")
  @ApiOperation({ summary: "Scan transaction QR" })
  async scanTransaction(
    @v2Context() ctx: V2ApiContext,
    @Body("code") code: string,
  ) {
    return this.posService.scanTransaction(ctx, code);
  }

  @Post("ably-auth")
  @Permissions("pos:auth")
  @ApiOperation({ summary: "Ably realtime auth" })
  async ablyAuth(@v2Context() ctx: V2ApiContext) {
    return this.posService.ablyAuth(ctx);
  }

  @Get("inventory")
  @Permissions("pos:product:read")
  @ApiOperation({ summary: "Get POS inventory" })
  async getInventory(@v2Context() ctx: V2ApiContext, @Query() query: any) {
    return this.posService.getInventory(ctx, query);
  }

  @Post("inventory")
  @Permissions("pos:product:update")
  @ApiOperation({ summary: "Adjust stock levels" })
  @UsePipes(new ZodValidationPipe(AdjustStockSchema))
  async adjustStock(@v2Context() ctx: V2ApiContext, @Body() body: any) {
    return this.posService.adjustStock(ctx, body);
  }

  @Get("sync")
  @Permissions("pos:sync")
  @ApiOperation({ summary: "Full or delta POS sync" })
  async sync(@v2Context() ctx: V2ApiContext, @Query() query: any) {
    return this.posService.sync(ctx, query);
  }

  @Get("customers")
  @Permissions("pos:sync")
  @ApiOperation({ summary: "POS customer delta sync" })
  async getCustomersDelta(
    @v2Context() ctx: V2ApiContext,
    @Query("lastSync") lastSync: string,
  ) {
    return this.posService.getCustomersDelta(ctx, lastSync);
  }

  @Post("customers")
  @Permissions("pos:sale:create")
  @ApiOperation({ summary: "Create POS customer" })
  @UsePipes(new ZodValidationPipe(CreateCustomerSchema))
  async createCustomer(@v2Context() ctx: V2ApiContext, @Body() body: any) {
    return this.posService.createCustomer(ctx, body);
  }

  @Post("deliveries/dispatch")
  @Permissions("pos:sale:update")
  @ApiOperation({ summary: "Dispatch delivery" })
  async dispatchDelivery(
    @v2Context() ctx: V2ApiContext,
    @Query("transactionId") transactionId: string,
    @Body() body: any,
  ) {
    return this.posService.dispatchDelivery(ctx, transactionId, body);
  }

  @Post("deliveries/reconcile-pod")
  @Permissions("pos:sale:update")
  @ApiOperation({ summary: "Reconcile delivery (POD)" })
  async reconcileDelivery(@v2Context() ctx: V2ApiContext, @Body() body: any) {
    const proofImage = body.proofImage?.value;
    return this.posService.reconcileDelivery(ctx, body, proofImage);
  }

  @Get("stock-requests")
  @Permissions("pos:product:read")
  @ApiOperation({ summary: "List stock requests" })
  async listStockRequests(@v2Context() ctx: V2ApiContext) {
    return this.posService.listStockRequests(ctx);
  }

  @Post("stock-requests")
  @Permissions("pos:stock:manage")
  @ApiOperation({ summary: "Create stock request" })
  @UsePipes(new ZodValidationPipe(CreateStockRequestSchema))
  async createStockRequest(@v2Context() ctx: V2ApiContext, @Body() body: any) {
    return this.posService.createStockRequest(ctx, body);
  }

  @Post("stock-requests/:id/cancel")
  @Permissions("pos:stock:manage")
  @ApiOperation({ summary: "Cancel stock request" })
  async cancelStockRequest(
    @v2Context() ctx: V2ApiContext,
    @Param("id") id: string,
  ) {
    return this.posService.cancelStockRequest(ctx, id);
  }

  @Get("pricing")
  @Permissions("pos:product:read")
  @ApiOperation({ summary: "Get POS pricing data" })
  async getPricing(@v2Context() ctx: V2ApiContext) {
    return this.posService.getPricing(ctx);
  }

  @Get("pricing/sync")
  @Permissions("pos:product:read")
  @ApiOperation({ summary: "Sync POS pricing data" })
  async syncPricing(
    @v2Context() ctx: V2ApiContext,
    @Query("lastSync") lastSync: string,
  ) {
    return this.posService.getPricing(ctx, lastSync);
  }

  @Post("shifts/sync")
  @Permissions("pos:sync")
  @ApiOperation({ summary: "Sync POS shifts" })
  @UsePipes(new ZodValidationPipe(ShiftSyncSchema))
  async syncShifts(@v2Context() ctx: V2ApiContext, @Body() body: any) {
    return this.posService.syncShifts(ctx, body);
  }

  @Get("waybill/:id")
  @Permissions("pos:sale:read")
  @ApiOperation({ summary: "Get transaction waybill" })
  async getWaybill(@v2Context() ctx: V2ApiContext, @Param("id") id: string) {
    return this.posService.getWaybill(ctx, id);
  }

  @Get("inventory/requests")
  @Permissions("pos:stock:manage")
  @ApiOperation({ summary: "List inventory requests" })
  async listInventoryRequests(@v2Context() ctx: V2ApiContext) {
    return this.posService.listStockRequests(ctx);
  }

  @Post("inventory/requests")
  @Permissions("pos:stock:manage")
  @ApiOperation({ summary: "Create inventory request" })
  @UsePipes(new ZodValidationPipe(CreateStockRequestSchema))
  async createInventoryRequest(
    @v2Context() ctx: V2ApiContext,
    @Body() body: any,
  ) {
    return this.posService.createStockRequest(ctx, body);
  }

  @Post("inventory/process")
  @Permissions("pos:product:update")
  @ApiOperation({ summary: "Process inventory adjustments" })
  @UsePipes(new ZodValidationPipe(AdjustStockSchema))
  async processInventory(@v2Context() ctx: V2ApiContext, @Body() body: any) {
    return this.posService.adjustStock(ctx, body);
  }

  @Post("purchases/:id/receive")
  @Permissions("pos:sale:update")
  @ApiOperation({ summary: "Receive purchase order" })
  async receivePurchase(
    @v2Context() ctx: V2ApiContext,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.posService.receivePurchase(ctx, id, body);
  }

  @Post("inventory/transfers/:id/receive")
  @Permissions("pos:sale:update")
  @ApiOperation({ summary: "Receive stock transfer" })
  async receiveTransfer(
    @v2Context() ctx: V2ApiContext,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.posService.receiveTransfer(ctx, id, body);
  }

  @Post("orders")
  @Permissions("pos:sale:create")
  @ApiOperation({ summary: "Create order" })
  async createOrder(@v2Context() ctx: V2ApiContext, @Body() body: any) {
    return this.posSaleService.handleOrder(ctx, body);
  }

  @Get("drivers")
  @Permissions("pos:sale:read")
  @ApiOperation({ summary: "List drivers" })
  async getDrivers(@v2Context() ctx: V2ApiContext) {
    return this.posService.getDrivers(ctx);
  }

  @Post("inventory/transfers")
  @Permissions("pos:stock:manage")
  @ApiOperation({ summary: "Create stock transfer" })
  @UsePipes(new ZodValidationPipe(CreateStockTransferSchema))
  async createStockTransfer(@v2Context() ctx: V2ApiContext, @Body() body: any) {
    return this.posService.createStockTransfer(ctx, body);
  }

  @Post("petty-cash")
  @Permissions("pos:petty-cash:create")
  @ApiOperation({ summary: "Register a new petty cash expense" })
  @UsePipes(new ZodValidationPipe(RegisterPettyCashSchema))
  async registerPettyCash(@v2Context() ctx: V2ApiContext, @Body() body: any) {
    return this.posService.registerPettyCash(ctx, body);
  }

  @Get("petty-cash/funds")
  @Permissions("pos:petty-cash:read")
  @ApiOperation({ summary: "List available petty cash funds" })
  async getPettyCashFunds(@v2Context() ctx: V2ApiContext) {
    return this.posService.getPettyCashFunds(ctx);
  }

  @Get("petty-cash/transactions")
  @Permissions("pos:petty-cash:read")
  @ApiOperation({ summary: "List recent petty cash transactions" })
  async getPettyCashTransactions(
    @v2Context() ctx: V2ApiContext,
    @Query("limit") limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.posService.getPettyCashTransactions(ctx, parsedLimit);
  }

  @Post("inventory/barcode")
  @Permissions("pos:product:update")
  @ApiOperation({ summary: "Register or update product variant barcode" })
  @UsePipes(new ZodValidationPipe(RegisterBarcodeSchema))
  async registerBarcode(@v2Context() ctx: V2ApiContext, @Body() body: any) {
    return this.posService.registerBarcode(ctx, body);
  }
}
