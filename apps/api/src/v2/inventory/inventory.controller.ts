import { Controller, Get, Query, Param, Post, Body, Patch, Delete, StreamableFile } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { v2Context } from '../../common/decorators/v2-context.decorator';
import { RequirePermission } from '../../common/decorators/auth.decorator';
import type { V2ApiContext } from '@repo/shared/api/v2/types';
import { DocumentService } from '../../common/documents/document.service';
import { PurchaseOrderUseCase } from '../../v3/modules/stocking/application/use-cases/purchase-order.use-case';
import { StockTransferUseCase } from '../../v3/modules/stocking/application/use-cases/stock-transfer.use-case';

@ApiTags('Inventory')
@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly documentService: DocumentService,
    private readonly purchaseOrderUseCase: PurchaseOrderUseCase,
    private readonly stockTransferUseCase: StockTransferUseCase,
  ) {}

  @Get()
  @RequirePermission('product:view:stock_levels')
  async getInventory(@v2Context() ctx: V2ApiContext, @Query() query: any) {
    return this.inventoryService.getInventory(ctx, query);
  }

  @Post()
  @RequirePermission('product:manage:stock')
  async createInventoryItem(@v2Context() ctx: V2ApiContext, @Body() data: any) {
    return this.inventoryService.createInventoryItem(ctx, data);
  }

  @Get('locations')
  @RequirePermission('inventory_location:read:all')
  async getLocations(@v2Context() ctx: V2ApiContext) {
    return this.inventoryService.getLocations(ctx);
  }

  @Post('locations')
  @RequirePermission('inventory_location:create')
  async createLocation(@v2Context() ctx: V2ApiContext, @Body() data: any) {
    return this.inventoryService.createLocation(ctx, data);
  }

  @Get('locations/:id')
  @RequirePermission('inventory_location:read:all')
  async getLocation(@v2Context() ctx: V2ApiContext, @Param('id') id: string) {
    return this.inventoryService.getLocation(ctx, id);
  }

  @Patch('locations/:id')
  @RequirePermission('inventory_location:update')
  async updateLocation(@v2Context() ctx: V2ApiContext, @Param('id') id: string, @Body() data: any) {
    return this.inventoryService.updateLocation(ctx, id, data);
  }

  @Delete('locations/:id')
  @RequirePermission('inventory_location:delete')
  async deleteLocation(@v2Context() ctx: V2ApiContext, @Param('id') id: string) {
    return this.inventoryService.deleteLocation(ctx, id);
  }

  @Get(':id')
  @RequirePermission('product:view:stock_levels')
  async getInventoryItem(@v2Context() ctx: V2ApiContext, @Param('id') id: string) {
    return this.inventoryService.getInventoryItem(ctx, id);
  }

  @Patch(':id')
  @RequirePermission('product:manage:stock')
  async updateInventoryItem(@v2Context() ctx: V2ApiContext, @Param('id') id: string, @Body() data: any) {
    return this.inventoryService.updateInventoryItem(ctx, id, data);
  }

  @Delete(':id')
  @RequirePermission('product:manage:stock')
  async deleteInventoryItem(@v2Context() ctx: V2ApiContext, @Param('id') id: string) {
    return this.inventoryService.deleteInventoryItem(ctx, id);
  }

  @Get(':id/movements')
  @RequirePermission('product:view:stock_levels')
  async getInventoryMovements(@v2Context() ctx: V2ApiContext, @Param('id') id: string) {
    return this.inventoryService.getInventoryMovements(ctx, id);
  }

  @Post(':id/movements')
  @RequirePermission('product:manage:stock')
  async createInventoryMovement(@v2Context() ctx: V2ApiContext, @Param('id') id: string, @Body() data: any) {
    return this.inventoryService.createInventoryMovement(ctx, id, data);
  }

  @Get(':id/adjustments')
  @RequirePermission('product:view:stock_levels')
  async getInventoryAdjustments(@v2Context() ctx: V2ApiContext, @Param('id') id: string) {
    return this.inventoryService.getInventoryAdjustments(ctx, id);
  }

  @Post(':id/adjustments/:adjustmentId/approve')
  @RequirePermission('product:manage:stock')
  async approveInventoryAdjustment(
    @v2Context() ctx: V2ApiContext,
    @Param('id') inventoryId: string,
    @Param('adjustmentId') adjustmentId: string,
  ) {
    return this.inventoryService.approveInventoryAdjustment(ctx, inventoryId, adjustmentId);
  }

  @Get('requests')
  @RequirePermission('product:view:stock_levels')
  @ApiOperation({ summary: 'Get stock requests' })
  async getStockRequests(@v2Context() ctx: V2ApiContext, @Query() query: any) {
    return this.inventoryService.getStockRequests(ctx, query);
  }

  @Get('transfers')
  @RequirePermission('product:view:stock_levels')
  @ApiOperation({ summary: 'Get stock transfers' })
  async getStockTransfers(@v2Context() ctx: V2ApiContext, @Query() query: any) {
    return this.inventoryService.getStockTransfers(ctx, query);
  }

  @Get('requests/:id/download')
  @RequirePermission('product:view:stock_levels')
  @ApiOperation({ summary: 'Download stock request PDF' })
  async downloadStockRequest(@v2Context() ctx: V2ApiContext, @Param('id') id: string) {
    const request = await this.inventoryService.getStockRequest(ctx, id);
    const stream = await this.documentService.generateStockRequestPDF({
      requestNumber: request.requestNumber,
      status: request.status,
      priority: request.priority,
      requestDate: request.requestDate.toLocaleDateString(),
      fromLocation: request.fromLocation.name,
      toLocation: request.toLocation.name,
      requestedBy: request.requestedBy.user.name,
      justification: request.justification,
      organizationName: request.organization.name,
      logoUrl: request.organization.logo,
      items: request.items.map(item => ({
        sku: item.variant.sku,
        productName: item.variant.product.name,
        variantName: item.variant.name,
        quantity: Number(item.requestedQuantity),
        reason: item.reason,
      })),
    });

    return new StreamableFile(stream, {
      type: 'application/pdf',
      disposition: `attachment; filename=StockRequest-${request.requestNumber}.pdf`,
    });
  }

  @Post('transfers/:id/approve')
  @RequirePermission('product:manage:stock')
  @ApiOperation({ summary: 'Approve a stock transfer' })
  async approveStockTransfer(@v2Context() ctx: V2ApiContext, @Param('id') id: string) {
    return this.stockTransferUseCase.approve(ctx.organizationId, ctx.memberId!, id);
  }

  @Post('transfers/:id/ship')
  @RequirePermission('product:manage:stock')
  @ApiOperation({ summary: 'Ship a stock transfer' })
  async shipStockTransfer(@v2Context() ctx: V2ApiContext, @Param('id') id: string, @Body() body: any) {
    return this.stockTransferUseCase.ship(ctx.organizationId, ctx.memberId!, id, body);
  }

  @Post('transfers/:id/receive')
  @RequirePermission('product:manage:stock')
  @ApiOperation({ summary: 'Receive a stock transfer' })
  async receiveStockTransfer(@v2Context() ctx: V2ApiContext, @Param('id') id: string, @Body() body: any) {
    return this.stockTransferUseCase.receive(ctx.organizationId, ctx.memberId!, id, body);
  }

  @Post('purchases/:id/approve')
  @RequirePermission('product:manage:stock')
  @ApiOperation({ summary: 'Approve a purchase order' })
  async approvePurchaseOrder(@v2Context() ctx: V2ApiContext, @Param('id') id: string) {
    return this.purchaseOrderUseCase.approve(ctx.organizationId, ctx.memberId!, id);
  }

  @Post('purchases/:id/receive')
  @RequirePermission('product:manage:stock')
  @ApiOperation({ summary: 'Receive a purchase order' })
  async receivePurchaseOrder(@v2Context() ctx: V2ApiContext, @Param('id') id: string, @Body() body: any) {
    return this.purchaseOrderUseCase.receive(ctx.organizationId, ctx.memberId!, id, body);
  }

  @Get('transfers/:id/download')
  @RequirePermission('product:view:stock_levels')
  @ApiOperation({ summary: 'Download stock transfer PDF' })
  async downloadStockTransfer(@v2Context() ctx: V2ApiContext, @Param('id') id: string) {
    const transfer = await this.inventoryService.getStockTransfer(ctx, id);
    const stream = await this.documentService.generateStockTransferPDF({
      transferNumber: transfer.transferNumber,
      status: transfer.status,
      requestedDate: transfer.requestedDate.toLocaleDateString(),
      shippedDate: transfer.shippedDate?.toLocaleDateString(),
      receivedDate: transfer.receivedDate?.toLocaleDateString(),
      fromLocation: transfer.fromLocation.name,
      toLocation: transfer.toLocation.name,
      requestedBy: transfer.requestedBy.user.name,
      approvedBy: transfer.approvedBy?.user.name,
      shippedBy: transfer.shippedBy?.user.name,
      receivedBy: transfer.receivedBy?.user.name,
      carrier: transfer.carrier,
      trackingNumber: transfer.trackingNumber,
      notes: transfer.notes,
      organizationName: transfer.organization.name,
      logoUrl: transfer.organization.logo,
      items: transfer.items.map(item => ({
        sku: item.variant.sku,
        productName: item.variant.product.name,
        variantName: item.variant.name,
        requestedQuantity: Number(item.requestedQuantity),
        shippedQuantity: item.shippedQuantity ? Number(item.shippedQuantity) : undefined,
        receivedQuantity: item.receivedQuantity ? Number(item.receivedQuantity) : undefined,
      })),
    });

    return new StreamableFile(stream, {
      type: 'application/pdf',
      disposition: `attachment; filename=StockTransfer-${transfer.transferNumber}.pdf`,
    });
  }
}
