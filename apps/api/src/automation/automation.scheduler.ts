import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";
import { AutomationService } from "./automation.service";

@Injectable()
export class AutomationScheduler {
  private readonly logger = new Logger(AutomationScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly automationService: AutomationService,
  ) {}

  /**
   * Periodically check for low stock levels across active organizations
   * and trigger low stock workflow executions.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleLowStockCronCheck() {
    this.logger.log("Executing hourly low stock cron check across organizations...");

    try {
      const activeDefinitions = await (this.prisma.client as any).workflowEngineDefinition.findMany({
        where: {
          key: { in: ["lowstock_alert", "f/dealio/inventory_alert"] },
          isActive: true,
        },
      });

      for (const def of activeDefinitions) {
        const threshold = def.config?.threshold ?? 10;
        const lowStockVariants = await (this.prisma.client as any).productVariant.findMany({
          where: {
            product: { organizationId: def.organizationId },
            stockQuantity: { lte: threshold },
          },
          take: 50,
        });

        for (const variant of lowStockVariants) {
          await this.automationService.triggerWorkflow(def.organizationId, {
            key: def.key,
            inputs: {
              productId: variant.id,
              productName: variant.name || "Product Variant",
              currentStock: variant.stockQuantity,
              threshold,
            },
          });
        }
      }
    } catch (error: any) {
      this.logger.error(`Error executing low stock cron check: ${error.message}`);
    }
  }

  /**
   * Daily scheduled sales report workflow execution.
   */
  @Cron(CronExpression.EVERY_DAY_AT_6PM)
  async handleDailySalesReportCron() {
    this.logger.log("Executing daily sales report scheduled cron check...");

    try {
      const activeDefinitions = await (this.prisma.client as any).workflowEngineDefinition.findMany({
        where: {
          key: { in: ["daily_sales_report", "f/dealio/daily_sales_report"] },
          isActive: true,
        },
      });

      for (const def of activeDefinitions) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const salesCount = await (this.prisma.client as any).order.count({
          where: {
            organizationId: def.organizationId,
            createdAt: { gte: todayStart },
          },
        });

        const salesSum = await (this.prisma.client as any).order.aggregate({
          where: {
            organizationId: def.organizationId,
            createdAt: { gte: todayStart },
          },
          _sum: { totalAmount: true },
        });

        const totalRevenue = salesSum._sum?.totalAmount || 0;

        await this.automationService.triggerWorkflow(def.organizationId, {
          key: def.key,
          inputs: {
            totalSales: salesCount,
            totalRevenue,
            currency: "USD",
            recipients: def.config?.recipients || "admin@example.com",
          },
        });
      }
    } catch (error: any) {
      this.logger.error(`Error executing daily sales report cron check: ${error.message}`);
    }
  }
}
