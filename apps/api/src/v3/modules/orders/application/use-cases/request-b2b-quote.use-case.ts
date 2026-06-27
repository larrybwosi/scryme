import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { IOrderRepository } from "../../domain/repositories/order-repository.interface";
import { RequestB2BQuoteDto } from "../dto/request-b2b-quote.dto";
import { PricingResolverService } from "../../../catalog/application/services/pricing-resolver.service";
import { WebhookService } from "../../../webhooks/infrastructure/services/webhook.service";
import { ApiRealtimeService } from "../../../../../common/services/realtime.service";

@Injectable()
export class RequestB2BQuoteUseCase {
  constructor(
    @Inject(IOrderRepository)
    private readonly orderRepository: IOrderRepository,
    private readonly prisma: PrismaService,
    private readonly pricingResolver: PricingResolverService,
    private readonly webhookService: WebhookService,
    private readonly realtimeService: ApiRealtimeService,
  ) {}

  async execute(organizationId: string, dto: RequestB2BQuoteDto) {
    // 1. Resolve Location
    let locationId = dto.locationId;

    if (locationId) {
      // Validate location belongs to organization
      const location = await this.prisma.client.inventoryLocation.findFirst({
        where: { id: locationId, organizationId },
      });
      if (!location)
        throw new BadRequestException(
          "Location not found in this organization",
        );
    } else {
      if (dto.customerId) {
        const customer = await this.prisma.client.customer.findUnique({
          where: { id: dto.customerId, organizationId },
          select: { defaultLocationId: true },
        });
        locationId = customer?.defaultLocationId || undefined;
      }

      if (!locationId && dto.businessAccountId) {
        const businessAccount =
          await this.prisma.client.businessAccount.findUnique({
            where: { id: dto.businessAccountId, organizationId },
            select: { defaultLocationId: true },
          });
        locationId = businessAccount?.defaultLocationId || undefined;
      }

      if (!locationId) {
        const defaultLocation =
          await this.prisma.client.inventoryLocation.findFirst({
            where: { organizationId, isDefault: true },
            select: { id: true },
          });
        locationId = defaultLocation?.id;
      }
    }

    if (!locationId) {
      throw new BadRequestException(
        "Location could not be resolved. Please provide a locationId.",
      );
    }

    // Aggregate quantities by variantId to handle duplicates in request
    const aggregatedItems = new Map<string, number>();
    for (const item of dto.items) {
      aggregatedItems.set(
        item.variantId,
        (aggregatedItems.get(item.variantId) || 0) + item.quantity,
      );
    }

    // 2. Validate Variants and Check Stock Availability
    const variantIds = Array.from(aggregatedItems.keys());
    const variants = await this.prisma.client.productVariant.findMany({
      where: {
        id: { in: variantIds },
        product: { organizationId },
      },
      include: {
        product: true,
        variantStocks: {
          where: { locationId },
        },
      },
    });

    if (variants.length !== variantIds.length) {
      throw new BadRequestException(
        "One or more variants not found or do not belong to this organization",
      );
    }

    const itemsData = [];

    // ⚡ Bolt Optimization: Use batched pricing resolution to prevent N+1 database queries.
    // This resolves all variant prices in a single set of optimized queries.
    const resolvedPrices = await this.pricingResolver.resolveBatchVariantPrices(
      {
        items: Array.from(aggregatedItems.entries()).map(
          ([variantId, quantity]) => ({
            variantId,
            quantity,
          }),
        ),
        organizationId,
        customerId: dto.customerId,
        businessAccountId: dto.businessAccountId,
      },
    );

    for (const [variantId, totalQuantity] of aggregatedItems) {
      const variant = variants.find(v => v.id === variantId)!;
      const stock = variant.variantStocks[0];

      if (!stock || stock.availableStock.toNumber() < totalQuantity) {
        throw new BadRequestException(
          `Insufficient stock for variant ${variant.sku} at location ${locationId}. Requested: ${totalQuantity}, Available: ${stock?.availableStock.toNumber() || 0}`,
        );
      }

      // 3. Resolve Pricing
      const resolvedPrice = resolvedPrices.get(variantId);
      const unitPrice = resolvedPrice?.unitPrice || 0;

      const subtotal = unitPrice * totalQuantity;

      itemsData.push({
        variantId: variantId,
        quantity: totalQuantity,
        productName: variant.product.name,
        variantName: variant.name,
        sku: variant.sku,
        unitPrice,
        unitCost: variant.buyingPrice.toNumber(),
        subtotal,
        lineTotal: subtotal,
      });
    }

    const totalAmount = itemsData.reduce(
      (sum, item) => sum + item.lineTotal,
      0,
    );

    // 4. Generate Quote Number
    const quoteNumber = `QT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 5. Create Transaction (QUOTE type)
    const quote = await this.prisma.client.transaction.create({
      data: {
        number: quoteNumber,
        type: "QUOTE",
        status: "QUOTE_SENT",
        organizationId,
        locationId,
        customerId: dto.customerId,
        businessAccountId: dto.businessAccountId,
        subtotal: totalAmount,
        finalTotal: totalAmount,
        baseCurrencyTotal: totalAmount,
        notes: dto.notes,
        channel: "THIRD_PARTY_API",
        items: {
          create: itemsData.map(item => ({
            variantId: item.variantId,
            quantity: item.quantity,
            productName: item.productName,
            variantName: item.variantName,
            sku: item.sku,
            listPrice: item.unitPrice,
            unitPrice: item.unitPrice,
            unitCost: item.unitCost,
            subtotal: item.subtotal,
            lineTotal: item.lineTotal,
          })),
        },
      },
    });

    // 6. Trigger events
    await this.realtimeService.publish(
      `order:${quote.id}`,
      "quote.created",
      quote,
    );
    await this.webhookService.dispatch("quote.created", organizationId, quote);

    return quote;
  }
}
