import { Controller, Post, Body, Param, Req, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MpesaService } from '@repo/mpesa/server';
import type { MpesaTriggerInput } from '@repo/mpesa/server';
import type { FastifyRequest } from 'fastify';
import { AllowPublic } from '../../../common/decorators/auth.decorator';

@ApiTags('M-Pesa')
@Controller('payments/mpesa')
export class MpesaController {
  constructor(private readonly mpesaService: MpesaService) {}

  @Post('stkpush')
  @ApiOperation({ summary: 'Initiate M-Pesa STK Push' })
  @ApiResponse({ status: 200, description: 'STK Push initiated successfully' })
  async initiateStkPush(@Body() input: MpesaTriggerInput & { userId?: string }) {
    return this.mpesaService.initiateStkPush(input);
  }

  @AllowPublic()
  @Post('webhooks/stkpush/:organizationId/:paymentId')
  @ApiOperation({ summary: 'M-Pesa STK Push Callback' })
  async handleStkCallback(
    @Req() req: FastifyRequest,
    @Param('organizationId') organizationId: string,
    @Param('paymentId') paymentId: string,
    @Body() payload: any
  ) {
    this.mpesaService.validateWebhookIp(req.ip || '');
    await this.mpesaService.handleStkCallback(organizationId, paymentId, payload);
    return { received: true };
  }

  @AllowPublic()
  @Post('webhooks/c2b/validation')
  @ApiOperation({ summary: 'M-Pesa C2B Validation Webhook' })
  async handleC2BValidation(@Req() req: FastifyRequest, @Body() payload: any) {
    this.mpesaService.validateWebhookIp(req.ip || '');
    return this.mpesaService.handleC2BValidation(payload);
  }

  @AllowPublic()
  @Post('webhooks/c2b/confirmation')
  @ApiOperation({ summary: 'M-Pesa C2B Confirmation Webhook' })
  async handleC2BConfirmation(@Req() req: FastifyRequest, @Body() payload: any) {
    this.mpesaService.validateWebhookIp(req.ip || '');
    return this.mpesaService.handleC2BConfirmation(payload);
  }

  @Get('verify/:transactionId')
  @ApiOperation({ summary: 'Verify M-Pesa Payment Status' })
  @ApiResponse({ status: 200, description: 'Payment status retrieved' })
  async verifyPayment(@Param('transactionId') transactionId: string) {
    return this.mpesaService.verifyPayment(transactionId);
  }
}
