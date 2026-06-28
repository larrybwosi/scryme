import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { PrismaService } from "@/prisma/prisma.service";
import {
  StrapiV4Provider,
  StrapiClientConfig,
} from "../providers/strapi-v4.provider";
import { StrapiProductSyncUseCase } from "../../application/use-cases/strapi-product-sync.use-case";
import { StrapiCustomerSyncUseCase } from "../../application/use-cases/strapi-customer-sync.use-case";

// ─────────────────────────────────────────────────────────────────────────────
// Job type definitions
// ─────────────────────────────────────────────────────────────────────────────

export type StrapiJobName =
  | "strapi.webhook.process"
  | "strapi.product.sync.outbound"
  | "strapi.product.sync.inbound"
  | "strapi.customer.sync.outbound"
  | "strapi.product.stock.push";

export interface StrapiWebhookJobData {
  webhookLogId: string;
  connectionId: string;
  organizationId: string;
  event: string; // e.g. "entry.create", "entry.update", "entry.delete"
  model: string; // e.g. "product", "customer"
  entry: Record<string, unknown>;
}

export interface StrapiProductSyncJobData {
  connectionId: string;
  organizationId: string;
  triggeredBy?: string;
}

export interface StrapiStockPushJobData {
  connectionId: string;
  organizationId: string;
  productId: string;
  locationStock: Record<string, number>;
}

export const STRAPI_QUEUE = "strapi-sync";

// ─────────────────────────────────────────────────────────────────────────────
// Processor
// ─────────────────────────────────────────────────────────────────────────────

@Processor(STRAPI_QUEUE)
export class StrapiSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(StrapiSyncProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly strapiProvider: StrapiV4Provider,
    private readonly productSyncUseCase: StrapiProductSyncUseCase,
    private readonly customerSyncUseCase: StrapiCustomerSyncUseCase,
  ) {
    super();
  }

  async process(job: Job<unknown, unknown, StrapiJobName>): Promise<void> {
    this.logger.log(`Processing Strapi job [${job.name}] id=${job.id}`);

    switch (job.name as StrapiJobName) {
      case "strapi.webhook.process":
        return this.handleWebhookEvent(job as Job<StrapiWebhookJobData>);

      case "strapi.product.sync.outbound":
        return this.handleProductOutbound(job as Job<StrapiProductSyncJobData>);

      case "strapi.product.sync.inbound":
        return this.handleProductInbound(job as Job<StrapiProductSyncJobData>);

      case "strapi.customer.sync.outbound":
        return this.handleCustomerOutbound(job as Job<StrapiProductSyncJobData>);

      case "strapi.product.stock.push":
        return this.handleStockPush(job as Job<StrapiStockPushJobData>);

      default:
        this.logger.warn(`Unknown Strapi job name: ${job.name}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Webhook event handler
  // ─────────────────────────────────────────────────────────────────

  private async handleWebhookEvent(job: Job<StrapiWebhookJobData>): Promise<void> {
    const { webhookLogId, connectionId, organizationId, event, model, entry } = job.data;

    try {
      await this.prisma.client.ecommerceWebhookLog.update({
        where: { id: webhookLogId },
        data: { status: "PROCESSING" },
      });

      // Route by model + event
      if (model === "product" || model === "api::product.product") {
        await this.handleProductWebhook(event, entry, connectionId, organizationId);
      } else if (model === "customer" || model === "api::customer.customer") {
        await this.handleCustomerWebhook(event, entry, connectionId, organizationId);
      } else {
        this.logger.log(`Strapi model '${model}' not mapped — skipping`);
      }

      await this.prisma.client.ecommerceWebhookLog.update({
        where: { id: webhookLogId },
        data: { status: "PROCESSED", processedAt: new Date() },
      });
    } catch (err: any) {
      this.logger.error(`Strapi webhook job failed: ${err.message}`, err.stack);

      await this.prisma.client.ecommerceWebhookLog.update({
        where: { id: webhookLogId },
        data: {
          status: "FAILED",
          processingError: err.message,
          retryCount: { increment: 1 },
        },
      });

      // Re-throw so BullMQ retries the job
      throw err;
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Product webhook dispatcher
  // ─────────────────────────────────────────────────────────────────

  private async handleProductWebhook(
    event: string,
    entry: Record<string, unknown>,
    connectionId: string,
    organizationId: string,
  ): Promise<void> {
    const strapiProductId = entry.id as number;

    if (event === "entry.delete") {
      // Mark associated product mapping as inactive / remove
      const mapping = await this.prisma.client.ecommerceProductMapping.findFirst({
        where: { connectionId, externalProductId: String(strapiProductId) },
      });

      if (mapping) {
        await this.prisma.client.ecommerceProductMapping.delete({
          where: { id: mapping.id },
        });
        this.logger.log(
          `Removed product mapping for deleted Strapi product ${strapiProductId}`,
        );
      }
      return;
    }

    if (event === "entry.create" || event === "entry.update") {
      const attrs = entry as any;

      const mapping = await this.prisma.client.ecommerceProductMapping.findFirst({
        where: { connectionId, externalProductId: String(strapiProductId) },
      });

      if (mapping) {
        // Update existing Scryme product
        await this.prisma.client.product.update({
          where: { id: mapping.productId },
          data: {
            name: attrs.name ?? undefined,
            description: attrs.description ?? undefined,
          },
        });

        await this.prisma.client.ecommerceProductMapping.update({
          where: { id: mapping.id },
          data: {
            externalData: attrs,
            lastSyncedAt: new Date(),
          },
        });

        this.logger.log(
          `Updated Scryme product ${mapping.productId} from Strapi webhook`,
        );
      } else {
        // New product coming from Strapi — trigger a targeted inbound sync
        await this.productSyncUseCase.syncInbound(
          organizationId,
          connectionId,
          "webhook",
        );
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Customer webhook dispatcher
  // ─────────────────────────────────────────────────────────────────

  private async handleCustomerWebhook(
    event: string,
    entry: Record<string, unknown>,
    connectionId: string,
    organizationId: string,
  ): Promise<void> {
    const attrs = entry as any;
    const email: string | undefined = attrs.email;

    if (!email) {
      this.logger.warn("Strapi customer webhook missing email — skipping");
      return;
    }

    if (event === "entry.create" || event === "entry.update") {
      const existing = await this.prisma.client.customer.findFirst({
        where: { organizationId, email },
      });

      if (existing) {
        await this.prisma.client.customer.update({
          where: { id: existing.id },
          data: {
            name:
              [attrs.firstName, attrs.lastName].filter(Boolean).join(" ") ||
              existing.name,
            phone: attrs.phone ?? existing.phone,
          },
        });
      } else {
        // Auto-register the customer inbound
        await this.customerSyncUseCase.registerCustomer({
          connectionId,
          organizationId,
          email,
          firstName: attrs.firstName,
          lastName: attrs.lastName,
          phone: attrs.phone,
        });
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Full sync handlers
  // ─────────────────────────────────────────────────────────────────

  private async handleProductOutbound(
    job: Job<StrapiProductSyncJobData>,
  ): Promise<void> {
    const { organizationId, connectionId, triggeredBy } = job.data;
    await this.productSyncUseCase.syncOutbound(
      organizationId,
      connectionId,
      triggeredBy ?? "queue",
    );
  }

  private async handleProductInbound(
    job: Job<StrapiProductSyncJobData>,
  ): Promise<void> {
    const { organizationId, connectionId, triggeredBy } = job.data;
    await this.productSyncUseCase.syncInbound(
      organizationId,
      connectionId,
      triggeredBy ?? "queue",
    );
  }

  private async handleCustomerOutbound(
    job: Job<StrapiProductSyncJobData>,
  ): Promise<void> {
    const { organizationId, connectionId, triggeredBy } = job.data;
    await this.customerSyncUseCase.bulkSyncOutbound(
      organizationId,
      connectionId,
      triggeredBy ?? "queue",
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // Stock push handler
  // ─────────────────────────────────────────────────────────────────

  private async handleStockPush(
    job: Job<StrapiStockPushJobData>,
  ): Promise<void> {
    const { connectionId, organizationId, productId, locationStock } = job.data;

    const config = await this.getClientConfig(organizationId, connectionId);

    const mapping = await this.prisma.client.ecommerceProductMapping.findFirst({
      where: { connectionId, productId },
    });

    if (!mapping) {
      this.logger.warn(
        `No Strapi mapping for product ${productId} — skipping stock push`,
      );
      return;
    }

    await this.strapiProvider.pushStockToStrapi(
      config,
      Number(mapping.externalProductId),
      locationStock,
    );

    this.logger.log(
      `Pushed stock for product ${productId} to Strapi entry ${mapping.externalProductId}`,
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // Private utilities
  // ─────────────────────────────────────────────────────────────────

  private async getClientConfig(
    organizationId: string,
    connectionId: string,
  ): Promise<StrapiClientConfig> {
    const strapiConfig = await this.prisma.client.strapiConnectionConfig.findUnique({
      where: { connectionId },
    });

    if (!strapiConfig) {
      throw new Error(
        `StrapiConnectionConfig not found for connection ${connectionId}`,
      );
    }

    return {
      strapiUrl: strapiConfig.strapiUrl,
      apiToken: strapiConfig.apiToken,
      graphqlPath: strapiConfig.graphqlPath,
    };
  }
}
