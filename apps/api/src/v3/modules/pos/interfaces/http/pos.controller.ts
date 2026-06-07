import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  UseInterceptors,
  Query,
  Req,
  Param,
  Patch,
  StreamableFile,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger';
import { V3AuthService } from '../../../auth/infrastructure/services/v3-auth.service';
import { V3AuthGuard } from '@/v3/common/guards/v3-auth.guard';
import { v3Context } from '@/v3/common/decorators/v3-context.decorator';
import { type V3ApiContext, getDocumentUrl } from '@repo/shared/server';
import { ProcessSaleDto } from '../../application/dto/sale.dto';
import { ProcessSaleUseCase } from '../../application/use-cases/process-sale.use-case';
import { SyncUseCase } from '../../application/use-cases/sync.use-case';
import { GetTransactionsUseCase } from '../../application/use-cases/get-transactions.use-case';
import { ShiftUseCase } from '../../application/use-cases/shift.use-case';
import { StandardResponseInterceptor } from '@/v3/common/interceptors/standard-response.interceptor';
import {
  ProvisionDeviceDto,
  PosLoginDto,
  PosLoginResponseDto,
  ProvisionResponseDto,
} from '../../application/dto/pos.dto';
import { ApiErrorResponseDto } from '@/v3/common/dto/response.dto';
import { MultiTenancyGuard } from '@/v3/common/guards/multi-tenancy.guard';
import { PermissionsGuard } from '@/v3/common/guards/permissions.guard';
import { Permissions } from '@/v3/common/decorators/permissions.decorator';
import { AuditInterceptor } from '@/v3/common/interceptors/audit.interceptor';
import { PaginationQueryDto } from '@/v3/common/utils/pagination';

// Use Cases from other modules
import { StockTransferUseCase } from '../../../stocking/application/use-cases/stock-transfer.use-case';
import { StockRequestUseCase } from '../../../stocking/application/use-cases/stock-request.use-case';
import { DeliveryReconciliationUseCase } from '../../../stocking/application/use-cases/delivery-reconciliation.use-case';
import { UnpackBatchUseCase } from '../../../inventory/application/use-cases/unpack-batch.use-case';
import { PackBatchUseCase } from '../../../inventory/application/use-cases/pack-batch.use-case';
import { InvoiceUseCase } from '../../../finance/application/use-cases/invoice.use-case';
import { PettyCashUseCase } from '../../../finance/application/use-cases/petty-cash.use-case';
import { ExpenseUseCase } from '../../../finance/application/use-cases/expense.use-case';

// DTOs from other modules
import { CreateTransferDto, ShipTransferDto, ReceiveTransferDto } from '../../../stocking/application/dto/transfer.dto';
import { CreateStockRequestDto } from '../../../stocking/application/dto/create-stock-request.dto';
import { DispatchOrderDto, ReconcilePodDto } from '../../../stocking/application/dto/delivery.dto';
import { UnpackBatchDto } from '../../../inventory/application/dto/unpack-batch.dto';
import { PackBatchDto } from '../../../inventory/application/dto/pack-batch.dto';
import { CreateExpenseDto, TopUpPettyCashFundDto } from '../../../finance/application/dto/finance.dto';

import * as Fastify from 'fastify';

@ApiTags('V3 POS')
@Controller(':orgSlug/pos')
@UseInterceptors(StandardResponseInterceptor)
export class PosController {
  constructor(
    private readonly authService: V3AuthService,
    private readonly processSaleUseCase: ProcessSaleUseCase,
    private readonly syncUseCase: SyncUseCase,
    private readonly getTransactionsUseCase: GetTransactionsUseCase,
    private readonly shiftUseCase: ShiftUseCase,
    private readonly stockTransferUseCase: StockTransferUseCase,
    private readonly stockRequestUseCase: StockRequestUseCase,
    private readonly deliveryReconciliationUseCase: DeliveryReconciliationUseCase,
    private readonly unpackBatchUseCase: UnpackBatchUseCase,
    private readonly packBatchUseCase: PackBatchUseCase,
    private readonly invoiceUseCase: InvoiceUseCase,
    private readonly pettyCashUseCase: PettyCashUseCase,
    private readonly expenseUseCase: ExpenseUseCase
  ) {}

  @Post('provision')
  @ApiOperation({
    summary: 'Provision a new POS device using a setup token',
    operationId: 'POS_Provision',
  })
  @ApiResponse({ status: 201, type: ProvisionResponseDto, description: 'Device provisioned' })
  @ApiResponse({ status: 400, type: ApiErrorResponseDto, description: 'Invalid token' })
  async provision(@Body() body: ProvisionDeviceDto) {
    return this.authService.provisionDevice(body.token);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Login staff member to a provisioned POS device',
    operationId: 'POS_Login',
  })
  @ApiResponse({ status: 200, type: PosLoginResponseDto, description: 'Login successful' })
  @ApiResponse({ status: 401, type: ApiErrorResponseDto, description: 'Invalid credentials' })
  async login(@Body() body: PosLoginDto) {
    return this.authService.loginMember(body.clientId, body.pin);
  }

  @Get('me')
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current POS device and staff context',
    operationId: 'POS_GetMe',
  })
  @ApiResponse({ status: 200, description: 'Current context' })
  async getMe(@v3Context() ctx: V3ApiContext) {
    return ctx;
  }

  @Post('sale')
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Process a new POS sale',
    operationId: 'POS_ProcessSale',
  })
  @ApiResponse({ status: 201, description: 'Sale processed' })
  @ApiResponse({ status: 400, type: ApiErrorResponseDto, description: 'Invalid sale data' })
  async processSale(@v3Context() ctx: V3ApiContext, @Body() body: ProcessSaleDto) {
    return this.processSaleUseCase.execute(ctx, body);
  }

  @Get('sync')
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Full or delta POS sync',
    operationId: 'POS_Sync',
  })
  @ApiResponse({ status: 200, description: 'Sync data' })
  async sync(@v3Context() ctx: V3ApiContext, @Query() query: any) {
    return this.syncUseCase.execute(ctx, query);
  }

  @Get('transactions')
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List POS transactions',
    operationId: 'POS_GetTransactions',
  })
  @ApiResponse({ status: 200, description: 'Transactions' })
  async getTransactions(@v3Context() ctx: V3ApiContext, @Query() query: any) {
    return this.getTransactionsUseCase.execute(ctx, query);
  }

  // --- Stock Transfers ---

  @Get('transfers')
  @UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permissions('stock:read')
  @ApiOperation({ summary: 'Get stock transfers', operationId: 'POS_GetTransfers' })
  async getTransfers(@v3Context() ctx: V3ApiContext, @Query() pagination: PaginationQueryDto) {
    return this.stockTransferUseCase.findAll(ctx.organizationId, pagination);
  }

  @Post('transfers')
  @UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permissions('stock:write')
  @ApiOperation({ summary: 'Create a stock transfer', operationId: 'POS_CreateTransfer' })
  async createTransfer(@v3Context() ctx: V3ApiContext, @Body() body: CreateTransferDto) {
    return this.stockTransferUseCase.create(ctx.organizationId, ctx.memberId!, body);
  }

  @Post('transfers/:id/ship')
  @UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permissions('stock:write')
  @ApiOperation({ summary: 'Ship a stock transfer', operationId: 'POS_ShipTransfer' })
  async shipTransfer(@v3Context() ctx: V3ApiContext, @Param('id') id: string, @Body() body: ShipTransferDto) {
    return this.stockTransferUseCase.ship(ctx.organizationId, id, ctx.memberId!, body);
  }

  @Post('transfers/:id/receive')
  @UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permissions('stock:write')
  @ApiOperation({ summary: 'Receive a stock transfer', operationId: 'POS_ReceiveTransfer' })
  async receiveTransfer(@v3Context() ctx: V3ApiContext, @Param('id') id: string, @Body() body: ReceiveTransferDto) {
    return this.stockTransferUseCase.receive(ctx.organizationId, id, ctx.memberId!, body);
  }

  // --- Stock Requests ---

  @Get('requests')
  @UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permissions('stock:read')
  @ApiOperation({ summary: 'Get stock requests', operationId: 'POS_GetRequests' })
  async getRequests(@v3Context() ctx: V3ApiContext, @Query() pagination: PaginationQueryDto) {
    return this.stockRequestUseCase.findAll(ctx.organizationId, pagination);
  }

  @Post('requests')
  @UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permissions('stock:write')
  @ApiOperation({ summary: 'Create a stock request', operationId: 'POS_CreateRequest' })
  async createRequest(@v3Context() ctx: V3ApiContext, @Body() body: CreateStockRequestDto) {
    return this.stockRequestUseCase.create(ctx.organizationId, ctx.memberId!, body);
  }

  // --- Deliveries & Reconciliation ---

  @Post('deliveries/dispatch')
  @UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permissions('stock:write')
  @ApiOperation({ summary: 'Dispatch orders', operationId: 'POS_DispatchOrders' })
  async dispatchOrders(@v3Context() ctx: V3ApiContext, @Body() body: DispatchOrderDto) {
    return this.deliveryReconciliationUseCase.dispatch(ctx.organizationId, ctx.memberId!, body);
  }

  @Post('deliveries/reconcile-pod')
  @UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permissions('stock:write')
  @ApiOperation({ summary: 'Reconcile POD (Proof of Delivery)', operationId: 'POS_ReconcilePod' })
  async reconcilePod(@v3Context() ctx: V3ApiContext, @Body() body: ReconcilePodDto) {
    return this.deliveryReconciliationUseCase.reconcilePod(ctx.organizationId, ctx.memberId!, body);
  }

  // --- Packing & Unpacking ---

  @Post('inventory/unpack')
  @UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permissions('inventory:write')
  @ApiOperation({ summary: 'Unpack a bulk batch into base units', operationId: 'POS_UnpackBatch' })
  async unpackBatch(@v3Context() ctx: V3ApiContext, @Body() body: UnpackBatchDto) {
    return this.unpackBatchUseCase.execute(ctx.organizationId, ctx.memberId!, body);
  }

  @Post('inventory/pack')
  @UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permissions('inventory:write')
  @ApiOperation({ summary: 'Pack base units into a bulk batch', operationId: 'POS_PackBatch' })
  async packBatch(@v3Context() ctx: V3ApiContext, @Body() body: PackBatchDto) {
    return this.packBatchUseCase.execute(ctx.organizationId, ctx.memberId!, body);
  }

  // --- Invoices & Receipts ---

  @Get('finance/invoices/:id/download')
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download invoice PDF', operationId: 'POS_DownloadInvoice' })
  async downloadInvoice(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Fastify.FastifyReply,
  ) {
    const stream = await this.invoiceUseCase.getDownloadStreamDirect(id);
    res.header('Content-Type', 'application/pdf');
    res.header('Content-Disposition', `attachment; filename=invoice-${id}.pdf`);
    return new StreamableFile(stream);
  }

  @Get('finance/receipts/:id/download')
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download receipt PDF', operationId: 'POS_DownloadReceipt' })
  async downloadReceipt(
    @Param('id') id: string, // id is transactionId here
    @Res({ passthrough: true }) res: Fastify.FastifyReply,
  ) {
    const stream = await this.invoiceUseCase.getReceiptDownloadStream(id);
    res.header('Content-Type', 'application/pdf');
    res.header('Content-Disposition', `attachment; filename=receipt-${id}.pdf`);
    return new StreamableFile(stream);
  }

  // --- Petty Cash ---

  @Get('petty-cash')
  @UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permissions('finance:read')
  @ApiOperation({ summary: 'List petty cash funds', operationId: 'POS_GetPettyCashFunds' })
  async getPettyCashFunds(@v3Context() ctx: V3ApiContext) {
    return this.pettyCashUseCase.getFunds(ctx.organizationId);
  }

  @Post('petty-cash/:id/top-up')
  @UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permissions('finance:write')
  @ApiOperation({ summary: 'Top up a petty cash fund', operationId: 'POS_TopUpPettyCash' })
  async topUpPettyCash(@v3Context() ctx: V3ApiContext, @Param('id') id: string, @Body() body: TopUpPettyCashFundDto) {
    return this.pettyCashUseCase.topUpFund(ctx.organizationId, id, body, ctx.memberId!);
  }

  @Post('petty-cash/:id/expense')
  @UseGuards(V3AuthGuard, MultiTenancyGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Permissions('finance:write')
  @ApiOperation({ summary: 'Record an expense from petty cash', operationId: 'POS_CreatePettyCashExpense' })
  async createPettyCashExpense(@v3Context() ctx: V3ApiContext, @Param('id') id: string, @Body() body: CreateExpenseDto) {
    return this.expenseUseCase.createExpense(ctx.organizationId, ctx.memberId!, {
      ...body,
      pettyCashFundId: id,
    });
  }

  // --- Shifts ---

  @Get('locations')
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List active locations', operationId: 'POS_ListLocations' })
  async listLocations(@v3Context() ctx: V3ApiContext) {
    // Reusing standard prisma query for active locations
    const locations = await this.prisma.client.inventoryLocation.findMany({
      where: { organizationId: ctx.organizationId, isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        locationType: true,
        address: true,
        isDefault: true,
      },
      orderBy: { name: 'asc' },
    });
    return { locations };
  }

  @Post('check-out')
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Member check-out', operationId: 'POS_CheckOut' })
  async checkOut(@v3Context() ctx: V3ApiContext) {
    return this.shiftUseCase.checkOut(ctx);
  }

  @Get('waybill/:id')
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get transaction waybill', operationId: 'POS_GetWaybill' })
  async getWaybill(@v3Context() ctx: V3ApiContext, @Param('id') id: string) {
    const transaction = await this.prisma.client.transaction.findFirst({
      where: { id, organizationId: ctx.organizationId },
    });

    if (!transaction) throw new BadRequestException('Transaction not found');

    const url = getDocumentUrl('waybill', id, ctx.organizationId);
    return { url };
  }

  @Get('shift-report')
  @UseGuards(V3AuthGuard, MultiTenancyGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current shift report', operationId: 'POS_GetShiftReport' })
  async getShiftReport(@v3Context() ctx: V3ApiContext) {
    return this.shiftUseCase.getShiftReport(ctx);
  }
}
