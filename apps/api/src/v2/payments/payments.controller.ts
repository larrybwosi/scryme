import { Controller, Body, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { v2Context } from '../../common/decorators/v2-context.decorator';
import type { V2ApiContext } from '@repo/shared/server';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('validate')
  @ApiOperation({ summary: 'Validate an M-Pesa payment' })
  async validate(@v2Context() ctx: V2ApiContext, @Body() body: any) {
    return this.paymentsService.validateMpesaPayment(ctx, body.transactionCode, body.saleId);
  }
}
