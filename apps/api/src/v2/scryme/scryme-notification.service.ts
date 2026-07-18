import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ScrymeChatApiClient, ScrymeChatAction } from "@repo/scryme";

@Injectable()
export class ScrymeNotificationService {
  private readonly logger = new Logger(ScrymeNotificationService.name);
  private readonly scrymeClient = new ScrymeChatApiClient();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Notify about a new order.
   */
  async notifyOrderCreated(organizationId: string, orderId: string) {
    const order = await this.prisma.client.transaction.findUnique({
      where: { id: orderId, organizationId },
      include: {
        customer: true,
        businessAccount: true,
        items: true,
        organization: {
          include: {
            scrymeConfiguration: true,
          },
        },
      },
    });

    if (!order || !order.organization.scrymeConfiguration?.isActive) {
      return;
    }

    const workspaceSlug = order.organization.scrymeConfiguration.workspaceSlug;
    if (!workspaceSlug) return;

    const crmBaseUrl =
      process.env.NEXT_PUBLIC_CRM_URL || "http://localhost:3001";
    const orderUrl = `${crmBaseUrl}/orders/${order.id}`;

    // 1. Identify target channels
    const channels = new Set<string>();
    channels.add("notifications"); // Default organization channel

    // Enterprise: If it's a B2B customer, notify their specific branch/location channel
    if (order.businessAccount?.defaultLocationId) {
      const location = await this.prisma.client.inventoryLocation.findUnique({
        where: { id: order.businessAccount.defaultLocationId },
      });

      if (location?.scrymeChannelId) {
        channels.add(location.scrymeChannelId);
      }
    }

    // 2. Construct the message
    const customerName =
      order.customer?.name || order.businessAccount?.name || "Guest Customer";
    let itemsList = order.items
      .map(
        item =>
          `• ${item.productName} x ${item.quantity.toString()} (@ ${order.currencyCode} ${item.unitPrice.toString()})`,
      )
      .join("\n");

    if (order.items.length > 5) {
      const remaining = order.items.length - 5;
      itemsList =
        order.items
          .slice(0, 5)
          .map(item => `• ${item.productName} x ${item.quantity.toString()}`)
          .join("\n") + `\n... and ${remaining} more items`;
    }

    const content =
      `🛍️ *New Order Received: ${order.number}*\n\n` +
      `*Customer:* ${customerName}\n` +
      `*Total:* ${order.currencyCode} ${order.finalTotal.toString()}\n\n` +
      `*Items:*\n${itemsList}\n\n` +
      `Please review the order details in the CRM.`;

    const actions: ScrymeChatAction[] = [
      {
        id: `view_order:${order.id}`,
        label: "View in CRM",
        type: "button",
        style: "primary",
        value: orderUrl,
      },
    ];

    // 3. Send to all identified channels
    for (const channelSlug of channels) {
      try {
        const message = await this.scrymeClient.sendMessage(
          workspaceSlug,
          channelSlug,
          {
            content,
            actions,
          },
        );

        // Log the message for tracking
        await this.prisma.client.scrymeMessage.create({
          data: {
            organizationId,
            workspaceSlug,
            channelSlug,
            messageId: message.id,
            content,
            eventType: "ORDER_CREATED",
            relatedId: orderId,
            metadata: {
              orderNumber: order.number,
              customerName,
              total: order.finalTotal.toString(),
            },
          },
        });
      } catch (error: any) {
        this.logger.error(
          `Failed to send order notification to Scryme channel ${channelSlug}: ${error.message}`,
        );
      }
    }
  }
}
