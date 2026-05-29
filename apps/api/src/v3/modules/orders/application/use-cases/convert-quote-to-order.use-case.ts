import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { WebhookService } from '../../../webhooks/infrastructure/services/webhook.service';
import { V3RealtimeGateway } from '../../../../common/realtime/v3-realtime.gateway';

@Injectable()
export class ConvertQuoteToOrderUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly webhookService: WebhookService,
    private readonly realtimeGateway: V3RealtimeGateway
  ) {}

  async execute(organizationId: string, quoteId: string) {
    // 1. Find the quote
    const quote = await this.prisma.client.transaction.findUnique({
      where: { id: quoteId, organizationId },
      include: { items: true },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    if (quote.type !== 'QUOTE') {
      throw new BadRequestException('Transaction is not a quote');
    }

    if (quote.status === 'CANCELLED' || quote.status === 'COMPLETED') {
      throw new BadRequestException(`Quote cannot be converted in its current status: ${quote.status}`);
    }

    // 2. Update Transaction to Order
    const updatedTransaction = await this.prisma.client.transaction.update({
      where: { id: quoteId },
      data: {
        type: 'SALES_ORDER',
        status: 'PENDING_CONFIRMATION',
        confirmedAt: new Date(),
      },
    });

    // 3. Trigger events
    this.realtimeGateway.sendToOrder(quote.id, 'order.created', updatedTransaction);
    await this.webhookService.dispatch('order.created', organizationId, updatedTransaction);

    return updatedTransaction;
  }
}
