import { Injectable, Logger } from "@nestjs/common";
import { db } from "@repo/db";

@Injectable()
export class McpToolsService {
  private readonly logger = new Logger(McpToolsService.name);

  /**
   * Get tool definitions for MCP clients
   */
  getToolDefinitions() {
    return [
      {
        name: "query_inventory",
        description: "Query product inventory levels, variant stock, and location details in Scryme.",
        inputSchema: {
          type: "object",
          properties: {
            search: { type: "string", description: "Search query by product name, SKU, or barcode" },
            locationId: { type: "string", description: "Filter stock levels by specific location ID" },
            limit: { type: "number", description: "Max records to return (default 20, max 100)" },
          },
        },
      },
      {
        name: "search_products",
        description: "Search product catalog, pricing, category, and status in Scryme.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search term for product name or SKU" },
            categoryId: { type: "string", description: "Filter products by category ID" },
            limit: { type: "number", description: "Max records to return (default 20)" },
          },
        },
      },
      {
        name: "list_orders",
        description: "List transactions and sales orders with filter by status, date range, or customer.",
        inputSchema: {
          type: "object",
          properties: {
            status: { type: "string", description: "Order status (COMPLETED, PENDING, CANCELLED)" },
            customerId: { type: "string", description: "Filter orders by customer ID" },
            startDate: { type: "string", description: "Start date filter (ISO format)" },
            endDate: { type: "string", description: "End date filter (ISO format)" },
            limit: { type: "number", description: "Max records to return (default 20)" },
          },
        },
      },
      {
        name: "get_order_details",
        description: "Retrieve complete breakdown of a specific sales transaction / order by ID or order number.",
        inputSchema: {
          type: "object",
          properties: {
            transactionId: { type: "string", description: "The transaction ID or order number" },
          },
          required: ["transactionId"],
        },
      },
      {
        name: "search_customers",
        description: "Search customer profiles, loyalty points, and contact information.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search term for customer name, email, or phone" },
            limit: { type: "number", description: "Max records to return (default 20)" },
          },
        },
      },
      {
        name: "get_sales_analytics",
        description: "Get financial revenue summaries, average order value, and order counts for a timeframe.",
        inputSchema: {
          type: "object",
          properties: {
            timeframe: {
              type: "string",
              enum: ["today", "week", "month", "year"],
              description: "Timeframe period for financial aggregation (default: month)",
            },
          },
        },
      },
      {
        name: "get_top_selling_products",
        description: "Get list of top-performing products by total revenue or quantity sold.",
        inputSchema: {
          type: "object",
          properties: {
            limit: { type: "number", description: "Number of top products to retrieve (default 10)" },
          },
        },
      },
      {
        name: "list_staff_tasks",
        description: "View staff tasks, status, priority, and assigned staff members.",
        inputSchema: {
          type: "object",
          properties: {
            status: { type: "string", description: "Task status filter (PENDING, IN_PROGRESS, COMPLETED)" },
            assignedMemberId: { type: "string", description: "Filter by assigned staff member ID" },
            limit: { type: "number", description: "Max tasks to return (default 20)" },
          },
        },
      },
      {
        name: "get_shift_schedules",
        description: "View staff shift schedules and attendance logs for a given date.",
        inputSchema: {
          type: "object",
          properties: {
            date: { type: "string", description: "Target date in YYYY-MM-DD format (defaults to today)" },
            locationId: { type: "string", description: "Filter shifts by location ID" },
          },
        },
      },
    ];
  }

  async executeTool(name: string, args: Record<string, any>, organizationId: string) {
    this.logger.log(`Executing MCP Tool name=${name} orgId=${organizationId}`);

    switch (name) {
      case "query_inventory":
        return this.queryInventory(args, organizationId);
      case "search_products":
        return this.searchProducts(args, organizationId);
      case "list_orders":
        return this.listOrders(args, organizationId);
      case "get_order_details":
        return this.getOrderDetails(args, organizationId);
      case "search_customers":
        return this.searchCustomers(args, organizationId);
      case "get_sales_analytics":
        return this.getSalesAnalytics(args, organizationId);
      case "get_top_selling_products":
        return this.getTopSellingProducts(args, organizationId);
      case "list_staff_tasks":
        return this.listStaffTasks(args, organizationId);
      case "get_shift_schedules":
        return this.getShiftSchedules(args, organizationId);
      default:
        throw new Error(`Unknown tool name: ${name}`);
    }
  }

  private async queryInventory(args: Record<string, any>, organizationId: string) {
    const limit = Math.min(Number(args.limit) || 20, 100);
    const search = args.search?.trim();
    const locationId = args.locationId;

    const where: any = { organizationId, isArchived: false };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
      ];
    }

    const products = await db.product.findMany({
      where,
      take: limit,
      select: {
        id: true,
        name: true,
        sku: true,
        barcode: true,
        variants: {
          select: {
            id: true,
            name: true,
            sku: true,
            retailPrice: true,
            wholesalePrice: true,
            buyingPrice: true,
            variantStocks: locationId ? { where: { locationId } } : true,
          },
        },
      },
    });

    return {
      count: products.length,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        variants: p.variants.map((v) => {
          const totalStock = v.variantStocks ? v.variantStocks.reduce((acc, s) => acc + Number(s.currentStock || 0), 0) : 0;
          const price = Number(v.retailPrice || v.wholesalePrice || v.buyingPrice || 0);
          return {
            id: v.id,
            name: v.name,
            sku: v.sku,
            price,
            totalStock,
            locations: v.variantStocks?.map((s) => ({ locationId: s.locationId, quantity: Number(s.currentStock) })),
          };
        }),
      })),
    };
  }

  private async searchProducts(args: Record<string, any>, organizationId: string) {
    const limit = Math.min(Number(args.limit) || 20, 100);
    const query = args.query?.trim();
    const categoryId = args.categoryId;

    const where: any = { organizationId, isArchived: false };
    if (categoryId) where.categoryId = categoryId;
    if (query) {
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { sku: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ];
    }

    const products = await db.product.findMany({
      where,
      take: limit,
      select: {
        id: true,
        name: true,
        sku: true,
        description: true,
        isActive: true,
        category: { select: { id: true, name: true } },
        variants: { select: { id: true, name: true, retailPrice: true, wholesalePrice: true, buyingPrice: true, sku: true } },
      },
    });

    return {
      count: products.length,
      products: products.map((p) => ({
        ...p,
        variants: p.variants.map((v) => ({
          id: v.id,
          name: v.name,
          sku: v.sku,
          price: Number(v.retailPrice || v.wholesalePrice || v.buyingPrice || 0),
        })),
      })),
    };
  }

  private async listOrders(args: Record<string, any>, organizationId: string) {
    const limit = Math.min(Number(args.limit) || 20, 100);
    const where: any = { organizationId };

    if (args.status) where.status = args.status;
    if (args.customerId) where.customerId = args.customerId;
    if (args.startDate || args.endDate) {
      where.createdAt = {};
      if (args.startDate) where.createdAt.gte = new Date(args.startDate);
      if (args.endDate) where.createdAt.lte = new Date(args.endDate);
    }

    const transactions = await db.transaction.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        number: true,
        finalTotal: true,
        subtotal: true,
        taxTotal: true,
        status: true,
        paymentStatus: true,
        createdAt: true,
        customer: { select: { id: true, name: true, email: true } },
      },
    });

    return { count: transactions.length, orders: transactions };
  }

  private async getOrderDetails(args: Record<string, any>, organizationId: string) {
    const { transactionId } = args;
    if (!transactionId) throw new Error("transactionId is required");

    const transaction = await db.transaction.findFirst({
      where: {
        organizationId,
        OR: [{ id: transactionId }, { number: transactionId }],
      },
      include: {
        customer: true,
        items: true,
        payments: true,
        fulfillments: true,
      },
    });

    if (!transaction) throw new Error(`Transaction ${transactionId} not found`);
    return transaction;
  }

  private async searchCustomers(args: Record<string, any>, organizationId: string) {
    const limit = Math.min(Number(args.limit) || 20, 100);
    const query = args.query?.trim();

    const where: any = { organizationId, isActive: true };
    if (query) {
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
      ];
    }

    const customers = await db.customer.findMany({
      where,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        loyaltyPoints: true,
        createdAt: true,
      },
    });

    return { count: customers.length, customers };
  }

  private async getSalesAnalytics(args: Record<string, any>, organizationId: string) {
    const timeframe = args.timeframe || "month";
    const now = new Date();
    const startDate = new Date();

    if (timeframe === "today") {
      startDate.setHours(0, 0, 0, 0);
    } else if (timeframe === "week") {
      startDate.setDate(now.getDate() - 7);
    } else if (timeframe === "year") {
      startDate.setFullYear(now.getFullYear() - 1);
    } else {
      startDate.setDate(now.getDate() - 30);
    }

    const transactions = await db.transaction.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate },
        status: "COMPLETED",
      },
      select: {
        finalTotal: true,
        subtotal: true,
        taxTotal: true,
        discountTotal: true,
      },
    });

    const totalOrders = transactions.length;
    const grossRevenue = transactions.reduce((acc, t) => acc + Number(t.finalTotal || 0), 0);
    const netRevenue = transactions.reduce((acc, t) => acc + Number(t.subtotal || 0), 0);
    const totalTax = transactions.reduce((acc, t) => acc + Number(t.taxTotal || 0), 0);
    const avgOrderValue = totalOrders > 0 ? grossRevenue / totalOrders : 0;

    return {
      timeframe,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      metrics: {
        totalOrders,
        grossRevenue,
        netRevenue,
        totalTax,
        avgOrderValue,
      },
    };
  }

  private async getTopSellingProducts(args: Record<string, any>, organizationId: string) {
    const limit = Math.min(Number(args.limit) || 10, 50);

    const items = await db.transactionItem.findMany({
      where: {
        transaction: {
          organizationId,
          status: "COMPLETED",
        },
      },
      select: {
        variantId: true,
        productName: true,
        quantity: true,
        lineTotal: true,
      },
    });

    const productMap = new Map<string, { name: string; totalQuantity: number; totalRevenue: number }>();

    for (const item of items) {
      const key = item.variantId || item.productName || "unknown";
      const existing = productMap.get(key) || {
        name: item.productName || "Unknown Product",
        totalQuantity: 0,
        totalRevenue: 0,
      };

      existing.totalQuantity += Number(item.quantity || 0);
      existing.totalRevenue += Number(item.lineTotal || 0);
      productMap.set(key, existing);
    }

    const topProducts = Array.from(productMap.entries())
      .map(([id, data]) => ({ productId: id, ...data }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);

    return { topProducts };
  }

  private async listStaffTasks(args: Record<string, any>, organizationId: string) {
    const limit = Math.min(Number(args.limit) || 20, 100);
    const where: any = { organizationId };

    if (args.status) where.status = args.status;
    if (args.assignedMemberId) where.memberId = args.assignedMemberId;

    const tasks = await db.staffTask.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        createdAt: true,
        member: { select: { id: true, user: { select: { name: true, email: true } } } },
      },
    });

    return { count: tasks.length, tasks };
  }

  private async getShiftSchedules(args: Record<string, any>, organizationId: string) {
    const targetDate = args.date ? new Date(args.date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const where: any = {
      organizationId,
      startTime: { gte: startOfDay, lte: endOfDay },
    };
    if (args.locationId) where.locationId = args.locationId;

    const shifts = await db.staffShift.findMany({
      where,
      select: {
        id: true,
        startTime: true,
        endTime: true,
        isActive: true,
        member: { select: { id: true, user: { select: { name: true, email: true } } } },
        locationId: true,
      },
    });

    return { count: shifts.length, date: targetDate.toISOString().split("T")[0], shifts };
  }
}
