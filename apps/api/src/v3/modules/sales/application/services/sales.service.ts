import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import {
  SalesAnalyticsDto,
  OrderItemDto,
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

    const transactions = await this.prisma.client.transaction.findMany({
      where: whereCondition,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        customer: { select: { name: true } },
        items: { select: { productName: true, quantity: true } },
      },
    });

    return transactions.map((txn) => {
      const primaryItem = txn.items[0];
      const title =
        primaryItem?.productName ||
        txn.customer?.name ||
        `Order ${txn.number}`;
      const totalQty = txn.items.reduce((sum, item) => sum + item.quantity, 0);
      const itemCountText = `${totalQty} Item${totalQty === 1 ? "" : "s"}`;
      const timeText = this.formatTime(txn.createdAt);
      const status = this.mapStatus(txn.status);
      const orderCode = `#${txn.number}`;
      const groupDate = this.getGroupDate(txn.createdAt);

      return {
        id: txn.id,
        title,
        itemCountText,
        timeText,
        status,
        orderCode,
        groupDate,
      };
    });
  }

  private mapStatus(status: string): string {
    const s = (status || "").toUpperCase();
    if (["COMPLETED", "DELIVERED"].includes(s)) return "FULFILLED";
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
