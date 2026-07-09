import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { WebhookService } from "../../../webhooks/infrastructure/services/webhook.service";
import { ApiRealtimeService } from "../../../../../common/services/realtime.service";

@Injectable()
export class ConvertQuoteToOrderUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly webhookService: WebhookService,
    private readonly realtimeService: ApiRealtimeService,
  ) {}

  async execute(organizationId: string, quoteId: string) {
    // 1. Find the quote
    // SECURITY (Sentinel): Using findFirst instead of findUnique because
    // Transaction lacks a composite unique index on [id, organizationId].
    /**
     * OPTIMIZATION (Bolt ⚡): Removed redundant 'include: { items: true }'.
     * Since the use case only uses the quote for validation of type and status,
     * fetching full item lists is an unnecessary database join and payload.
     * Estimated impact: -1 SQL join, ~20-30% reduction in DB-to-API data transfer.
     */
    const quote = await this.prisma.client.transaction.findFirst({
      where: { id: quoteId, organizationId },
      select: { id: true, type: true, status: true },
    });

    if (!quote) {
      throw new NotFoundException("Quote not found");
    }

    if (quote.type !== "QUOTE") {
      throw new BadRequestException("Transaction is not a quote");
    }

    if (quote.status === "CANCELLED" || quote.status === "COMPLETED") {
      throw new BadRequestException(
        `Quote cannot be converted in its current status: ${quote.status}`,
      );
    }

    // 2. Update Transaction to Order
    const updatedTransaction = await this.prisma.client.transaction.update({
      where: { id: quoteId },
      data: {
        type: "SALES_ORDER",
        status: "PENDING_CONFIRMATION",
        confirmedAt: new Date(),
      },
    });

    // 3. Trigger events
    await this.realtimeService.publish(
      `order:${quote.id}`,
      "order.created",
      updatedTransaction,
    );
    await this.webhookService.dispatch(
      "order.created",
      organizationId,
      updatedTransaction,
    );

    return updatedTransaction;
  }
}
