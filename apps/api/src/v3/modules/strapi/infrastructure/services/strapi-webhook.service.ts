import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { PrismaService } from "@/prisma/prisma.service";
import { StrapiWebhookVerifierService } from "./strapi-webhook-verifier.service";
import {
  STRAPI_QUEUE,
  StrapiWebhookJobData,
} from "../workers/strapi-sync.processor";

export interface StrapiWebhookPayload {
  event: string; // "entry.create" | "entry.update" | "entry.delete" | "media.create" etc.
  createdAt: string;
  model: string; // e.g. "product", "customer"
  uid?: string; // e.g. "api::product.product"
  entry?: Record<string, unknown>;
  media?: Record<string, unknown>;
}

@Injectable()
export class StrapiWebhookService {
  private readonly logger = new Logger(StrapiWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly verifier: StrapiWebhookVerifierService,
    @InjectQueue(STRAPI_QUEUE) private readonly strapiQueue: Queue,
  ) {}

  /**
   * Main entry point called by StrapiWebhookController.
   * 1. Looks up connection + config
   * 2. Optionally verifies HMAC signature
   * 3. Logs the event to EcommerceWebhookLog
   * 4. Enqueues async processing job
   */
  async handleIncoming(
    connectionId: string,
    rawBody: Buffer,
    signature: string | undefined,
    payload: StrapiWebhookPayload,
  ): Promise<{ queued: boolean; webhookLogId: string }> {
    // 1. Load connection
    const connection = await this.prisma.client.ecommerceConnection.findUnique({
      where: { id: connectionId },
      include: { strapiConfig: true },
    });

    if (!connection || !connection.isActive) {
      throw new NotFoundException(
        `Strapi connection ${connectionId} not found or inactive`,
      );
    }

    const strapiConfig = connection.strapiConfig;

    // 2. Verify signature if a webhookSecret is configured
    if (strapiConfig?.webhookSecret) {
      try {
        this.verifier.verify(rawBody, signature, strapiConfig.webhookSecret);
      } catch (err: any) {
        this.logger.warn(
          `Signature verification failed for connection ${connectionId}: ${err.message}`,
        );
        throw err; // propagates 401 to caller
      }
    } else {
      this.logger.debug(
        `No webhookSecret configured for connection ${connectionId} — skipping signature check`,
      );
    }

    // 3. Validate payload structure
    if (!payload.event || !payload.model) {
      throw new BadRequestException(
        "Invalid Strapi webhook payload: missing event or model",
      );
    }

    // 4. Log the webhook
    const webhookLog = await this.prisma.client.ecommerceWebhookLog.create({
      data: {
        connectionId,
        organizationId: connection.organizationId,
        topic: `${payload.model}.${payload.event}`,
        payload: payload as any,
        headers: signature ? { "X-Strapi-Signature": signature } : undefined,
        status: "PENDING",
        receivedAt: new Date(),
      },
    });

    // 5. Enqueue job (fire-and-forget from controller perspective)
    const jobData: StrapiWebhookJobData = {
      webhookLogId: webhookLog.id,
      connectionId,
      organizationId: connection.organizationId,
      event: payload.event,
      model: payload.uid ?? payload.model,
      entry: payload.entry ?? payload.media ?? {},
    };

    await this.strapiQueue.add("strapi.webhook.process", jobData, {
      attempts: 3,
      backoff: { type: "exponential", delay: 5_000 },
      removeOnComplete: { count: 500 },
      removeOnFail: { count: 200 },
    });

    this.logger.log(
      `Queued Strapi webhook [${payload.event}] model=${payload.model} conn=${connectionId}`,
    );

    return { queued: true, webhookLogId: webhookLog.id };
  }

  // ─────────────────────────────────────────────────────────────────
  // Enqueue manual / scheduled sync jobs
  // ─────────────────────────────────────────────────────────────────

  async enqueueSyncJob(
    jobName:
      | "strapi.product.sync.outbound"
      | "strapi.product.sync.inbound"
      | "strapi.customer.sync.outbound",
    connectionId: string,
    organizationId: string,
    triggeredBy = "manual",
  ): Promise<string> {
    const job = await this.strapiQueue.add(
      jobName,
      { connectionId, organizationId, triggeredBy },
      {
        attempts: 2,
        backoff: { type: "fixed", delay: 10_000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    );

    this.logger.log(
      `Enqueued ${jobName} for connection ${connectionId} (jobId=${job.id})`,
    );

    return job.id as string;
  }

  // ─────────────────────────────────────────────────────────────────
  // List recent webhook logs for a connection
  // ─────────────────────────────────────────────────────────────────

  async getWebhookLogs(
    organizationId: string,
    connectionId: string,
    limit = 50,
  ) {
    return this.prisma.client.ecommerceWebhookLog.findMany({
      where: { connectionId, organizationId },
      orderBy: { receivedAt: "desc" },
      take: limit,
      select: {
        id: true,
        topic: true,
        status: true,
        receivedAt: true,
        processedAt: true,
        processingError: true,
        retryCount: true,
      },
    });
  }

  async getSyncLogs(organizationId: string, connectionId: string, limit = 50) {
    return this.prisma.client.ecommerceSyncLog.findMany({
      where: { connectionId, organizationId },
      orderBy: { startedAt: "desc" },
      take: limit,
    });
  }
}
