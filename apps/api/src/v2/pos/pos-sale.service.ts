import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { V2ApiContext } from '@repo/shared/server';
// Proxy to the shared actions in @repo/shared/server
import { processSale, ProcessSaleInputSchema, createOrder, CreateOrderInputSchema } from '@repo/shared/server';
import { triggerStkPush } from '@repo/mpesa/server';

@Injectable()
export class PosSaleService {
  private readonly logger = new Logger(PosSaleService.name);

  constructor(private prisma: PrismaService) {}

  async handleSale(ctx: V2ApiContext, body: any, enableStockTracking: boolean) {
    const { organizationId, memberId, locationId: ctxLocationId } = ctx;
    const locationId = ctxLocationId || body.locationId;

    if (!locationId) {
      throw new BadRequestException('locationId is required (set on the device API key or pass it in the request body)');
    }

    // 1. Validate Input
    const preCheck = ProcessSaleInputSchema.safeParse({ ...body, enableStockTracking, locationId });
    if (!preCheck.success) {
      this.logger.error(`Validation Failed: ${JSON.stringify(preCheck.error.flatten())}`);
      throw new BadRequestException({
        message: 'Invalid sale data',
        details: preCheck.error.flatten().fieldErrors,
      });
    }

    // 2. Process Sale via Shared Action
    const result = await processSale(organizationId, memberId ?? 'api', preCheck.data);

    if (!result.success || !result.data) {
      throw new BadRequestException(result.message || 'Failed to process sale');
    }

    const transaction = result.data;
    const payments = (transaction as any).payments || [];

    // 3. Handle M-Pesa STK Pushes
    const mpesaPayments = payments.filter((p: any) => p.method === 'MPESA' && p.status === 'PENDING');

    for (const payment of mpesaPayments) {
      if (payment.payerPhone) {
        const mpesaInput = (preCheck.data as any).payments.find(
          (p: any) => p.method === 'MPESA' && Math.abs(Number(p.amount) - Number(payment.amount)) < 0.01
        );

        const flowType = mpesaInput?.mpesaFlowType || 'STK_PUSH';

        if (flowType === 'STK_PUSH') {
          try {
            await triggerStkPush({
              organizationId,
              amount: Number(payment.amount),
              phoneNumber: payment.payerPhone,
              transactionId: transaction.id,
              paymentId: payment.id,
            });
          } catch (stkError: any) {
            this.logger.error(`STK Push Failed for payment ${payment.id}: ${stkError.message}`);
          }
        }
      }
    }

    return result;
  }

  async handleOrder(ctx: V2ApiContext, body: any) {
    const { organizationId, memberId, locationId: ctxLocationId } = ctx;
    const locationId = ctxLocationId || body.locationId;

    if (!locationId) {
      throw new BadRequestException('locationId is required');
    }

    // 1. Validate Input
    const preCheck = CreateOrderInputSchema.safeParse({ ...body, locationId });
    if (!preCheck.success) {
      this.logger.error(`Order Validation Failed: ${JSON.stringify(preCheck.error.flatten())}`);
      throw new BadRequestException({
        message: 'Invalid order data',
        details: preCheck.error.flatten().fieldErrors,
      });
    }

    // 2. Process Order via Shared Action
    const result = await createOrder(organizationId, memberId ?? 'api', preCheck.data);

    if (!result.success) {
      throw new BadRequestException(result.message || 'Failed to process order');
    }

    return result;
  }
}
