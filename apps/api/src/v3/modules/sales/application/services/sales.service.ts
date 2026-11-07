import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import {
  SalesAnalyticsDto,
  OrderItemDto,
  OrderLineItemDto,
  TransactionSummaryDto,
  MetricItemDto,
} from "../../dto/sales.dto";

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  async getAnalytics(
    organizationId: string,
    memberId?: string,
  ): Promise<SalesAnalyticsDto> {
    let userName = "Admin";
    if (memberId) {
      const member = await this.prisma.client.member.findFirst({
        where: { id: memberId, organizationId, deletedAt: null },
        include: { user: { select: { name: true } } },
      });
      if (member?.user?.name) {
        userName = member.user.name;
      }
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      aggregateResult,
      customerCount,
      productCount,
      pettyCashAggregate,
      recentTxns,
    ] = await Promise.all([
      this.prisma.client.transaction.aggregate({
        where: {
          organizationId,
          createdAt: { gte: todayStart },
          status: { notIn: ["CANCELLED", "FAILED", "DRAFT"] },
        },
        _sum: { finalTotal: true },
      }),
      this.prisma.client.customer.count({
        where: { organizationId },
      }),
      this.prisma.client.productVariant.count({
        where: { product: { organizationId, isArchived: false } },
      }),
      this.prisma.client.pettyCashTransaction.aggregate({
        where: { fund: { organizationId } },
        _sum: { amount: true },
      }),
      this.prisma.client.transaction.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          items: { take: 1 },
        },
      }),
    ]);

    const totalBalanceNum = Number(aggregateResult._sum.finalTotal || 0);
    const totalBalance = totalBalanceNum.toFixed(2);

    const expenseNum = Number(pettyCashAggregate._sum.amount || 0);

    const metrics: MetricItemDto[] = [
      {
        title: "Customer",
        value: customerCount.toLocaleString("en-US"),
        trend: "27%",
        isUp: true,
      },
      {
        title: "Product",
        value: productCount.toLocaleString("en-US"),
        trend: "8%",
        isUp: true,
      },
      {
        title: "Revenue",
        value: totalBalanceNum.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        trend: "15%",
        isUp: true,
      },
      {
        title: "Expense",
        value: expenseNum.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        trend: "10%",
        isUp: false,
      },
    ];

    const recentTransactions: TransactionSummaryDto[] = recentTxns.map((txn) => {
      const primaryItem = txn.items[0];
      const productName = primaryItem?.productName || `Sale ${txn.number}`;
      const dateText = this.formatDate(txn.createdAt);
      const status = this.mapStatus(txn.status);
      const transactionCode = `#${txn.number}`;

      return {
        id: txn.id,
        productName,
        dateText,
        status,
        transactionCode,
      };
    });

    return {
      userName,
      totalBalance,
      metrics,
      recentTransactions,
    };
  }

  async getOrders(
    organizationId: string,
    query?: string,
  ): Promise<OrderItemDto[]> {
    const whereCondition: any = {
      organizationId,
    };

    if (query && query.trim().length > 0) {
      const trimmed = query.trim();
      whereCondition.OR = [
        { number: { contains: trimmed, mode: "insensitive" } },
        { customer: { name: { contains: trimmed, mode: "insensitive" } } },
        {
          items: {
            some: {
              productName: { contains: trimmed, mode: "insensitive" },
            },
          },
        },
      ];
    }

    const [transactions, org] = await Promise.all([
      this.prisma.client.transaction.findMany({
        where: whereCondition,
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          customer: { select: { name: true, email: true, phone: true } },
          items: true,
          payments: true,
        },
      }),
      this.prisma.client.organization.findUnique({
        where: { id: organizationId },
        include: { settings: true },
      }),
    ]);

    const defaultCurrency = org?.settings?.defaultCurrency || "USD";
    const symbol = this.getCurrencySymbol(defaultCurrency);

    return transactions.map((txn) => this.mapTransactionToOrderItem(txn, symbol));
  }

  async getOrderDetails(
    organizationId: string,
    orderId: string,
  ): Promise<OrderItemDto> {
    const [txn, org] = await Promise.all([
      this.prisma.client.transaction.findFirst({
        where: {
          id: orderId,
          organizationId,
        },
        include: {
          customer: { select: { name: true, email: true, phone: true } },
          items: true,
          payments: true,
        },
      }),
      this.prisma.client.organization.findUnique({
        where: { id: organizationId },
        include: { settings: true },
      }),
    ]);

    if (!txn) {
      throw new NotFoundException(`Order '${orderId}' not found`);
    }

    const defaultCurrency = org?.settings?.defaultCurrency || "USD";
    const symbol = this.getCurrencySymbol(defaultCurrency);

    return this.mapTransactionToOrderItem(txn, symbol);
  }

  private getCurrencySymbol(currency: string): string {
    const symbolMap: Record<string, string> = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      KES: "KSh",
      NGN: "₦",
      JPY: "¥",
      CAD: "CA$",
      AUD: "A$",
      INR: "₹",
      GHS: "GH₵",
      ZAR: "R",
      UGX: "UGX",
      TZS: "TZS",
      RWF: "RF",
      ETB: "Br",
    };
    return symbolMap[currency?.toUpperCase()] || currency || "$";
  }

  private mapTransactionToOrderItem(txn: any, fallbackSymbol: string = "$"): OrderItemDto {
    const currSymbol = txn.currencyCode ? this.getCurrencySymbol(txn.currencyCode) : fallbackSymbol;
    const primaryItem = txn.items[0];
    const title =
      primaryItem?.productName ||
      txn.customer?.name ||
      `Order ${txn.number}`;
    const totalQty = txn.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
    const itemCountText = `${totalQty} Item${totalQty === 1 ? "" : "s"}`;
    const timeText = this.formatTime(txn.createdAt);
    const status = this.mapStatus(txn.status);
    const orderCode = `#${txn.number}`;
    const groupDate = this.getGroupDate(txn.createdAt);

    const lineItems: OrderLineItemDto[] = txn.items.map((item: any) => ({
      id: item.id,
      name: item.productName || "Product Item",
      quantity: item.quantity,
      unitPrice: `${currSymbol}${Number(item.unitPrice || 0).toFixed(2)}`,
      totalPrice: `${currSymbol}${Number(item.total || 0).toFixed(2)}`,
      sku: item.sku || undefined,
      notes: item.notes || undefined,
    }));

    const payment = txn.payments?.[0];
    const paymentMethod = payment?.provider ? `${payment.provider}` : "Standard Payment";
    const paymentStatus = txn.status === "COMPLETED" ? "PAID" : txn.status;

    return {
      id: txn.id,
      title,
      itemCountText,
      timeText,
      status,
      orderCode,
      groupDate,
      lineItems,
      customOrderNotes: txn.notes || undefined,
      customerName: txn.customer?.name || "Direct Customer",
      customerPhone: txn.customer?.phone || undefined,
      customerEmail: txn.customer?.email || undefined,
      fulfillmentStatus: status === "FULFILLED" ? "Delivered" : status === "SHIPPED" ? "In Transit" : "Pending Fulfillment",
      paymentMethod,
      paymentStatus,
      subtotal: `${currSymbol}${Number(txn.subtotal || txn.finalTotal || 0).toFixed(2)}`,
      tax: `${currSymbol}${Number(txn.taxTotal || 0).toFixed(2)}`,
      discount: `${currSymbol}${Number(txn.discountTotal || 0).toFixed(2)}`,
      totalAmount: `${currSymbol}${Number(txn.finalTotal || 0).toFixed(2)}`,
      deliveryAddress: txn.shippingAddress || undefined,
    };
  }

  private mapStatus(status: string): string {
    const s = (status || "").toUpperCase();
    if (["COMPLETED", "DELIVERED", "PAID"].includes(s)) return "FULFILLED";
    if (["DISPATCHED", "IN_TRANSIT", "SHIPPED"].includes(s)) return "SHIPPED";
    return "CONFIRMED";
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    const day = d.getDate();
    const month = d.toLocaleString("en-US", { month: "short" });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  }

  private formatTime(date: Date): string {
    const d = new Date(date);
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  private getGroupDate(date: Date): string {
    const d = new Date(date);
    const now = new Date();

    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    if (isToday) return "Today";

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    if (isYesterday) return "Yesterday";

    return `${d.getDate()} ${d.toLocaleString("en-US", { month: "long" })}`;
  }
}
