import { Controller, Get, Post, Body, Query, Param, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { PosService } from './pos.service';
import { PosSaleService } from './pos-sale.service';
import { v2Context } from '../../common/decorators/v2-context.decorator';
import { type V2ApiContext } from '@repo/shared/server';
import { Permissions } from '../../common/decorators/auth.decorator';
import { FastifyReply } from 'fastify';

@ApiTags('POS')
@ApiSecurity('x-api-key')
@ApiSecurity('x-member-token')
@Controller('pos')
export class PosController {
  constructor(
    private readonly posService: PosService,
    private readonly posSaleService: PosSaleService
  ) {}

  @Post('check-in')
  @ApiOperation({ summary: 'Member check-in' })
  async checkIn(@v2Context() ctx: V2ApiContext, @Body() body: any, @Res() res: any) {
    const result = await this.posService.checkIn(ctx, body);

    res.setCookie('dealio_member_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12,
      domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined,
    });

    return res.send(result);
  }

  @Post('check-out')
  @ApiOperation({ summary: 'Member check-out' })
  async checkOut(@v2Context() ctx: V2ApiContext, @Body() body: any) {
    return this.posService.checkOut(ctx, body);
  }

  @Get('locations')
  @ApiOperation({ summary: 'List active locations' })
  async listLocations(@v2Context() ctx: V2ApiContext) {
    return this.posService.listLocations(ctx);
  }

  @Get('products')
  @Permissions('pos:product:read')
  @ApiOperation({ summary: 'Get POS products' })
  async getProducts(@v2Context() ctx: V2ApiContext, @Query() query: any) {
    return this.posService.getProducts(ctx, query);
  }

  @Post('sale')
  @Permissions('pos:sale:create')
  @ApiOperation({ summary: 'Process a new sale' })
  async processSale(
    @v2Context() ctx: V2ApiContext,
    @Body() body: any,
    @Query('enableStockTracking') enableStockTracking: string
  ) {
    return this.posSaleService.handleSale(ctx, body, enableStockTracking === 'true');
  }

  @Get('incoming')
  @ApiOperation({ summary: 'List incoming shipments' })
  async getIncoming(@v2Context() ctx: V2ApiContext, @Query() query: any) {
    return this.posService.getIncoming(ctx, query);
  }

  @Post('transaction/scan')
  @ApiOperation({ summary: 'Scan transaction QR' })
  async scanTransaction(@v2Context() ctx: V2ApiContext, @Body('code') code: string) {
    return this.posService.scanTransaction(ctx, code);
  }

  @Post('ably-auth')
  @ApiOperation({ summary: 'Ably realtime auth' })
  async ablyAuth(@v2Context() ctx: V2ApiContext) {
    return this.posService.ablyAuth(ctx);
  }

  @Get('inventory')
  @Permissions('pos:product:read')
  @ApiOperation({ summary: 'Get POS inventory' })
  async getInventory(@v2Context() ctx: V2ApiContext, @Query() query: any) {
    return this.posService.getInventory(ctx, query);
  }

  @Post('inventory')
  @Permissions('pos:product:update')
  @ApiOperation({ summary: 'Adjust stock levels' })
  async adjustStock(@v2Context() ctx: V2ApiContext, @Body() body: any) {
    return this.posService.adjustStock(ctx, body);
  }

  @Get('sync')
  @Permissions('pos:sync')
  @ApiOperation({ summary: 'Full or delta POS sync' })
  async sync(@v2Context() ctx: V2ApiContext, @Query() query: any) {
    return this.posService.sync(ctx, query);
  }

  @Get('transactions')
  @Permissions('pos:sale:read')
  @ApiOperation({ summary: 'List transactions' })
  async getTransactions(@v2Context() ctx: V2ApiContext, @Query() query: any) {
    return this.posService.getTransactions(ctx, query);
  }

  @Get('customers')
  @ApiOperation({ summary: 'POS customer delta sync' })
  async getCustomersDelta(@v2Context() ctx: V2ApiContext, @Query('lastSync') lastSync: string) {
    return this.posService.getCustomersDelta(ctx, lastSync);
  }

  @Post('customers')
  @ApiOperation({ summary: 'Create POS customer' })
  async createCustomer(@v2Context() ctx: V2ApiContext, @Body() body: any) {
    return this.posService.createCustomer(ctx, body);
  }

  @Post('deliveries/dispatch')
  @ApiOperation({ summary: 'Dispatch delivery' })
  async dispatchDelivery(
    @v2Context() ctx: V2ApiContext,
    @Query('transactionId') transactionId: string,
    @Body() body: any
  ) {
    return this.posService.dispatchDelivery(ctx, transactionId, body);
  }

  @Post('deliveries/reconcile-pod')
  @ApiOperation({ summary: 'Reconcile delivery (POD)' })
  async reconcileDelivery(@v2Context() ctx: V2ApiContext, @Body() body: any) {
    const proofImage = body.proofImage?.value;
    return this.posService.reconcileDelivery(ctx, body, proofImage);
  }

  @Get('stock-requests')
  @ApiOperation({ summary: 'List stock requests' })
  async listStockRequests(@v2Context() ctx: V2ApiContext) {
    return this.posService.listStockRequests(ctx);
  }

  @Post('stock-requests')
  @ApiOperation({ summary: 'Create stock request' })
  async createStockRequest(@v2Context() ctx: V2ApiContext, @Body() body: any) {
    return this.posService.createStockRequest(ctx, body);
  }

  @Post('stock-requests/:id/cancel')
  @ApiOperation({ summary: 'Cancel stock request' })
  async cancelStockRequest(@v2Context() ctx: V2ApiContext, @Param('id') id: string) {
    return this.posService.cancelStockRequest(ctx, id);
  }
}
