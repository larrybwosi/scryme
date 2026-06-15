import {
  Controller,
  UseGuards,
  UseInterceptors,
  Post,
  Body,
  Req,
  Param,
  Patch,
  Get,
  Query,
  StreamableFile,
} from "@nestjs/common";
import {ApiTags, ApiBearerAuth, ApiOperation} from "@nestjs/swagger";
import {MultiTenancyGuard} from "@/v3/common/guards/multi-tenancy.guard";
import {PermissionsGuard} from "@/v3/common/guards/permissions.guard";
import {AuditInterceptor} from "@/v3/common/interceptors/audit.interceptor";
import {StandardResponseInterceptor} from "@/v3/common/interceptors/standard-response.interceptor";
import {V3AuthGuard} from "@/v3/common/guards/v3-auth.guard";
import {Permissions} from "@/v3/common/decorators/permissions.decorator";
import {PaginationQueryDto} from "@/v3/common/utils/pagination";
import {PurchaseOrderUseCase} from "../../application/use-cases/purchase-order.use-case";
import {
  CreatePurchaseDto,
  ReceivePurchaseDto,
} from "../../application/dto/purchase.dto";
import {StockTransferUseCase} from "../../application/use-cases/stock-transfer.use-case";
import {StockRequestUseCase} from "../../application/use-cases/stock-request.use-case";
import {
  CreateTransferDto,
  ShipTransferDto,
  ReceiveTransferDto,
} from "../../application/dto/transfer.dto";
import {DeliveryReconciliationUseCase} from "../../application/use-cases/delivery-reconciliation.use-case";
import {
  DispatchOrderDto,
  ReconcilePodDto,
} from "../../application/dto/delivery.dto";
import {DeliveryPartnerUseCase} from "../../application/use-cases/delivery-partner.use-case";
import {PhysicalReconciliationUseCase} from "../../application/use-cases/physical-reconciliation.use-case";
import {
  CreatePartnerDto,
  UpdatePartnerDto,
  PartnerWalletActionDto,
} from "../../application/dto/partner.dto";
import {SubmitReconciliationDto} from "../../application/dto/reconciliation.dto";
import {DocumentService} from "@/common/documents/document.service";

@ApiTags("V3 Stocking")
@ApiBearerAuth()
@Controller(":orgSlug/stocking")
@UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor, StandardResponseInterceptor)
export class StockingController {
  constructor(
    private readonly purchaseOrderUseCase: PurchaseOrderUseCase,
    private readonly stockTransferUseCase: StockTransferUseCase,
    private readonly stockRequestUseCase: StockRequestUseCase,
    private readonly deliveryReconciliationUseCase: DeliveryReconciliationUseCase,
    private readonly deliveryPartnerUseCase: DeliveryPartnerUseCase,
    private readonly physicalReconciliationUseCase: PhysicalReconciliationUseCase,
    private readonly documentService: DocumentService,
  ) {}

  @Get("purchases")
  @Permissions("stock:read")
  @ApiOperation({
    summary: "Get purchase orders",
    operationId: "Stocking_GetPurchases",
  })
  async getPurchases(@Req() req: any, @Query() pagination: PaginationQueryDto) {
    return this.purchaseOrderUseCase.findAll(req.organization.id, pagination);
  }

  @Post("purchases")
  @Permissions("stock:write")
  @ApiOperation({
    summary: "Create a new purchase order",
    operationId: "Stocking_CreatePurchase",
  })
  async createPurchase(@Req() req: any, @Body() body: CreatePurchaseDto) {
    return this.purchaseOrderUseCase.create(
      req.organization.id,
      req.user.memberId,
      body,
    );
  }

  @Post("purchases/:id/receive")
  @Permissions("stock:write")
  @ApiOperation({
    summary: "Receive items for a purchase order",
    operationId: "Stocking_ReceivePurchase",
  })
  async receivePurchase(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: ReceivePurchaseDto,
  ) {
    return this.purchaseOrderUseCase.receive(
      req.organization.id,
      id,
      req.user.memberId,
      body,
    );
  }

  @Get("transfers")
  @Permissions("stock:read")
  @ApiOperation({
    summary: "Get stock transfers",
    operationId: "Stocking_GetTransfers",
  })
  async getTransfers(@Req() req: any, @Query() pagination: PaginationQueryDto) {
    return this.stockTransferUseCase.findAll(req.organization.id, pagination);
  }

  @Post("transfers")
  @Permissions("stock:write")
  @ApiOperation({
    summary: "Create a stock transfer",
    operationId: "Stocking_CreateTransfer",
  })
  async createTransfer(@Req() req: any, @Body() body: CreateTransferDto) {
    return this.stockTransferUseCase.create(
      req.organization.id,
      req.user.memberId,
      body,
    );
  }

  @Post("transfers/:id/ship")
  @Permissions("stock:write")
  @ApiOperation({
    summary: "Ship a stock transfer",
    operationId: "Stocking_ShipTransfer",
  })
  async shipTransfer(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: ShipTransferDto,
  ) {
    return this.stockTransferUseCase.ship(
      req.organization.id,
      id,
      req.user.memberId,
      body,
    );
  }

  @Post("transfers/:id/receive")
  @Permissions("stock:write")
  @ApiOperation({
    summary: "Receive a stock transfer",
    operationId: "Stocking_ReceiveTransfer",
  })
  async receiveTransfer(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: ReceiveTransferDto,
  ) {
    return this.stockTransferUseCase.receive(
      req.organization.id,
      id,
      req.user.memberId,
      body,
    );
  }

  @Get("requests")
  @Permissions("stock:read")
  @ApiOperation({
    summary: "Get stock requests",
    operationId: "Stocking_GetRequests",
  })
  async getRequests(@Req() req: any, @Query() pagination: PaginationQueryDto) {
    return this.stockRequestUseCase.findAll(req.organization.id, pagination);
  }

  @Get("reconciliation/pending-dispatch")
  @Permissions("stock:read")
  @ApiOperation({
    summary: "Get transactions pending dispatch",
    operationId: "Stocking_GetPendingDispatch",
  })
  async getPendingDispatch(
    @Req() req: any,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.deliveryReconciliationUseCase.getPendingDispatch(
      req.organization.id,
      pagination,
    );
  }

  @Post("reconciliation/dispatch")
  @Permissions("stock:write")
  @ApiOperation({
    summary: "Dispatch orders",
    operationId: "Stocking_DispatchOrders",
  })
  async dispatchOrders(@Req() req: any, @Body() body: DispatchOrderDto) {
    return this.deliveryReconciliationUseCase.dispatch(
      req.organization.id,
      req.user.memberId,
      body,
    );
  }

  @Get("reconciliation/active-deliveries")
  @Permissions("stock:read")
  @ApiOperation({
    summary: "Get active deliveries",
    operationId: "Stocking_GetActiveDeliveries",
  })
  async getActiveDeliveries(
    @Req() req: any,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.deliveryReconciliationUseCase.getActiveDeliveries(
      req.organization.id,
      pagination,
    );
  }

  @Post("reconciliation/reconcile-pod")
  @Permissions("stock:write")
  @ApiOperation({
    summary: "Reconcile POD (Proof of Delivery)",
    operationId: "Stocking_ReconcilePod",
  })
  async reconcilePod(@Req() req: any, @Body() body: ReconcilePodDto) {
    return this.deliveryReconciliationUseCase.reconcilePod(
      req.organization.id,
      req.user.memberId,
      body,
    );
  }

  @Get("physical-reconciliations")
  @Permissions("stock:read")
  @ApiOperation({
    summary: "Get physical reconciliations",
    operationId: "Stocking_GetPhysicalReconciliations",
  })
  async getPhysicalReconciliations(
    @Req() req: any,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.physicalReconciliationUseCase.findAll(
      req.organization.id,
      pagination,
    );
  }

  @Post("physical-reconciliations")
  @Permissions("stock:write")
  @ApiOperation({
    summary: "Submit physical reconciliation",
    operationId: "Stocking_SubmitPhysicalReconciliation",
  })
  async submitPhysicalReconciliation(
    @Req() req: any,
    @Body() body: SubmitReconciliationDto,
  ) {
    return this.physicalReconciliationUseCase.submit(
      req.organization.id,
      req.user.memberId,
      body,
    );
  }

  @Get("physical-reconciliations/:id/report")
  @Permissions("stock:read")
  @ApiOperation({
    summary: "Get reconciliation report",
    operationId: "Stocking_GetReconciliationReport",
  })
  async getReconciliationReport(@Req() req: any, @Param("id") id: string) {
    const pdf = await this.documentService.generateReconciliationReport(id);
    return new StreamableFile(pdf);
  }

  // --- Delivery Partner Management ---

  @Get("partners")
  @Permissions("partners:read")
  @ApiOperation({
    summary: "Get delivery partners",
    operationId: "Stocking_GetPartners",
  })
  async getPartners(@Req() req: any) {
    return this.deliveryPartnerUseCase.getPartners(req.organization.id);
  }

  @Post("partners")
  @Permissions("partners:write")
  @ApiOperation({
    summary: "Create delivery partner",
    operationId: "Stocking_CreatePartner",
  })
  async createPartner(@Req() req: any, @Body() body: CreatePartnerDto) {
    return this.deliveryPartnerUseCase.createPartner(req.organization.id, body);
  }

  @Get("partners/:id")
  @Permissions("partners:read")
  @ApiOperation({
    summary: "Get delivery partner details",
    operationId: "Stocking_GetPartner",
  })
  async getPartner(@Req() req: any, @Param("id") id: string) {
    return this.deliveryPartnerUseCase.getPartner(req.organization.id, id);
  }

  @Patch("partners/:id")
  @Permissions("partners:write")
  @ApiOperation({
    summary: "Update delivery partner",
    operationId: "Stocking_UpdatePartner",
  })
  async updatePartner(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: UpdatePartnerDto,
  ) {
    return this.deliveryPartnerUseCase.updatePartner(
      req.organization.id,
      id,
      body,
    );
  }

  @Post("partners/:id/wallet/adjust")
  @Permissions("partners:write")
  @ApiOperation({
    summary: "Adjust partner wallet",
    operationId: "Stocking_AdjustPartnerWallet",
  })
  async adjustPartnerWallet(
    @Req() req: any,
    @Param("id") id: string,
    @Body() body: PartnerWalletActionDto,
  ) {
    return this.deliveryPartnerUseCase.adjustWallet(
      req.organization.id,
      id,
      body,
    );
  }
}
