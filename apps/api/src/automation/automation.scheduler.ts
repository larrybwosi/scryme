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

      await Promise.all(
        activeDefinitions.map(async (def: any) => {
          const threshold = def.config?.threshold ?? 10;
          const lowStockVariants = await (this.prisma.client as any).productVariant.findMany({
            where: {
              product: { organizationId: def.organizationId },
              OR: [
                { variantStocks: { some: { currentStock: { lte: threshold } } } },
                { variantStocks: { none: {} } },
              ],
            },
            include: {
              product: {
                include: {
                  suppliers: {
                    include: { supplier: true },
                  },
                },
              },
              suppliers: {
                include: { supplier: true },
              },
              variantStocks: true,
            },
            take: 50,
          });

          await Promise.all(
            lowStockVariants.map(async (variant: any) => {
              const currentStock =
                variant.variantStocks?.reduce(
                  (acc: number, curr: any) => acc + (Number(curr.currentStock) || 0),
                  0,
                ) ?? 0;

              if (currentStock <= threshold) {
                // Priority supplier resolution: variant-level suppliers first, then product-level suppliers
                const candidateSuppliers =
                  variant.suppliers?.length > 0
                    ? variant.suppliers
                    : variant.product?.suppliers || [];

                const preferredSupplierRel =
                  candidateSuppliers.find((s: any) => s.isPreferred) || candidateSuppliers[0];

                const supplier = preferredSupplierRel?.supplier;
                const supplierId = supplier?.id;
                const supplierName = supplier?.name;

                let existingPoId: string | undefined;
                let existingPoNumber: string | undefined;

                if (supplierId) {
                  const existingPo = await (this.prisma.client as any).purchase.findFirst({
                    where: {
                      organizationId: def.organizationId,
                      supplierId,
                      status: { in: ["DRAFT", "PENDING_APPROVAL", "ORDERED"] },
                    },
                    orderBy: { createdAt: "desc" },
                    select: { id: true, purchaseNumber: true },
                  });

                  if (existingPo) {
                    existingPoId = existingPo.id;
                    existingPoNumber = existingPo.purchaseNumber;
                  }
                }

                await this.automationService.triggerWorkflow(def.organizationId, {
                  key: def.key,
                  inputs: {
                    variantId: variant.id,
                    productId: variant.productId || variant.product?.id,
                    productName: variant.product?.name || "Product",
                    variantName: variant.name,
                    currentStock,
                    threshold,
                    supplierId,
                    supplierName,
                    existingPoId,
                    existingPoNumber,
                  },
                });
              }
            }),
          );
        }),
      );
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

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      /**
       * ⚡ Bolt Optimization: Parallelize DB read queries and organization definitions.
       * Combining order count and aggregate queries using Promise.all collapses 2 sequential DB roundtrips
       * per organization down to 1 flat parallel roundtrip, while processing active definitions concurrently.
       */
      await Promise.all(
        activeDefinitions.map(async (def: any) => {
          const [salesCount, salesSum] = await Promise.all([
            (this.prisma.client as any).order.count({
              where: {
                organizationId: def.organizationId,
                createdAt: { gte: todayStart },
              },
            }),
            (this.prisma.client as any).order.aggregate({
              where: {
                organizationId: def.organizationId,
                createdAt: { gte: todayStart },
              },
              _sum: { totalAmount: true },
            }),
          ]);

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
        }),
      );
    } catch (error: any) {
      this.logger.error(`Error executing daily sales report cron check: ${error.message}`);
    }
  }

  /**
   * Daily check for inventory batches nearing expiration or already expired.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiryCleanupCronCheck() {
    this.logger.log("Executing daily expiry cleanup cron check across organizations...");

    try {
      const activeDefinitions = await (this.prisma.client as any).workflowEngineDefinition.findMany({
        where: {
          key: { in: ["expiry_cleanup", "f/dealio/expiry_cleanup"] },
          isActive: true,
        },
      });

      const now = new Date();

      await Promise.all(
        activeDefinitions.map(async (def: any) => {
          const daysBeforeExpiry = def.config?.daysBeforeExpiry ?? 7;
          const warningCutoff = new Date(now.getTime() + daysBeforeExpiry * 24 * 60 * 60 * 1000);

          const expiringBatches = await (this.prisma.client as any).stockBatch.findMany({
            where: {
              organizationId: def.organizationId,
              currentQuantity: { gt: 0 },
              expiryDate: {
                not: null,
                lte: warningCutoff,
              },
            },
            include: {
              variant: {
                include: { product: true },
              },
              location: true,
            },
            take: 100,
          });

          await Promise.all(
            expiringBatches.map(async (batch: any) => {
              const expiry = new Date(batch.expiryDate);
              const isExpired = expiry <= now;
              const diffMs = expiry.getTime() - now.getTime();
              const daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

              await this.automationService.triggerWorkflow(def.organizationId, {
                key: def.key,
                inputs: {
                  batchId: batch.id,
                  batchNumber: batch.batchNumber || batch.id,
                  variantId: batch.variantId,
                  productName: batch.variant?.product?.name || "Product",
                  variantName: batch.variant?.name || "Default",
                  currentQuantity: Number(batch.currentQuantity) || 0,
                  expiryDate: batch.expiryDate,
                  daysUntilExpiry,
                  isExpired,
                  locationId: batch.locationId,
                  locationName: batch.location?.name || "Default Warehouse",
                  notificationEmail: def.config?.notificationEmail || "",
                },
              });
            }),
          );
        }),
      );
    } catch (error: any) {
      this.logger.error(`Error executing expiry cleanup cron check: ${error.message}`);
    }
  }

}
