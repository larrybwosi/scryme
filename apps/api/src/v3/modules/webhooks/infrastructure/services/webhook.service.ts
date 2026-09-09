import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { PrismaService } from "@/prisma/prisma.service";
import * as crypto from "crypto";
import { isSafeUrl } from "@repo/shared/server";
import {
  CreateIncomingWebhookDto,
  UpdateWebhookDto,
} from "../../application/dto/webhook.dto";

@Injectable()
export class WebhookService {
  constructor(
    @InjectQueue("webhooks") private readonly webhookQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  async dispatch(event: string, organizationId: string, payload: any) {
    const subscriptions = await this.prisma.client.webhookSubscription.findMany(
      {
        where: {
          organizationId,
          isActive: true,
          events: { has: event },
        },
      },
    );

    await Promise.all(
      subscriptions.map((sub) =>
        this.webhookQueue.add(
          "deliver",
          {
            subscriptionId: sub.id,
            event,
            payload,
            url: sub.url,
            secret: sub.secret,
          },
          {
            attempts: 5,
            backoff: {
              type: "exponential",
              delay: 1000,
            },
          },
        ),
      ),
    );
  }

  async dispatchTestPayload(
    subscriptionId: string,
    organizationId: string,
    customEvent?: string,
    customPayload?: any,
  ) {
    const subscription = await this.prisma.client.webhookSubscription.findFirst({
      where: { id: subscriptionId, organizationId },
    });

    if (!subscription) {
      throw new NotFoundException("Webhook subscription not found");
    }

    const event = customEvent || "webhook.test_ping";
    const payload = customPayload || {
      event,
      subscriptionId: subscription.id,
      timestamp: new Date().toISOString(),
      message: "Test webhook payload dispatch from Scryme Developer Console",
    };

    const job = await this.webhookQueue.add(
      "deliver",
      {
        subscriptionId: subscription.id,
        event,
        payload,
        url: subscription.url,
        secret: subscription.secret,
      },
      {
        attempts: 1,
      },
    );

    return {
      jobId: job.id,
      event,
      payload,
      status: "QUEUED",
    };
  }

  async updateSubscription(
    id: string,
    organizationId: string,
    dto: UpdateWebhookDto,
  ) {
    if (dto.url && !(await isSafeUrl(dto.url))) {
      throw new BadRequestException("Insecure webhook URL blocked");
    }

    const existing = await this.prisma.client.webhookSubscription.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException("Webhook subscription not found");
    }

    return this.prisma.client.webhookSubscription.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.url !== undefined && { url: dto.url }),
        ...(dto.events !== undefined && { events: dto.events }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async getLogs(organizationId: string, subscriptionId?: string) {
    return this.prisma.client.webhookLog.findMany({
      where: {
        subscription: {
          organizationId,
          ...(subscriptionId ? { id: subscriptionId } : {}),
        },
      },
      include: {
        subscription: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async getLogById(logId: string, organizationId: string) {
    const log = await this.prisma.client.webhookLog.findFirst({
      where: {
        id: logId,
        subscription: { organizationId },
      },
      include: {
        subscription: true,
      },
    });

    if (!log) {
      throw new NotFoundException("Webhook log entry not found");
    }

    return log;
  }

  async redeliverLog(logId: string, organizationId: string) {
    const log = await this.getLogById(logId, organizationId);
    const subscription = log.subscription;

    if (!subscription || !subscription.isActive) {
      throw new BadRequestException("Associated webhook subscription is inactive or deleted");
    }

    const job = await this.webhookQueue.add(
      "deliver",
      {
        subscriptionId: subscription.id,
        event: log.event,
        payload: log.payload,
        url: subscription.url,
        secret: subscription.secret,
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
      },
    );

    return {
      message: "Redelivery enqueued successfully",
      newJobId: job.id,
      originalLogId: logId,
    };
  }

  // --- Incoming Webhook Management ---

  async createIncomingEndpoint(
    organizationId: string,
    dto: CreateIncomingWebhookDto,
  ) {
    const secret =
      dto.secret || "whsec_in_" + crypto.randomBytes(24).toString("hex");

    return (this.prisma.client as any).workflowEngineWebhook.create({
      data: {
        organizationId,
        definitionId: dto.definitionId,
        name: dto.name,
        direction: "INCOMING",
        endpointUrl: secret, // Secret token identifier for incoming route lookup
        secret,
        headers: dto.headers || {},
      },
    });
  }

  async listIncomingEndpoints(organizationId: string) {
    return (this.prisma.client as any).workflowEngineWebhook.findMany({
      where: {
        organizationId,
        direction: "INCOMING",
      },
      include: {
        organization: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async deleteIncomingEndpoint(id: string, organizationId: string) {
    const result = await (this.prisma.client as any).workflowEngineWebhook.deleteMany({
      where: {
        id,
        organizationId,
        direction: "INCOMING",
      },
    });

    if (result.count === 0) {
      throw new NotFoundException("Incoming webhook endpoint not found");
    }

    return { count: result.count };
  }

  async handleIncomingPayload(
    orgSlug: string,
    endpointId: string,
    headers: any,
    body: any,
  ) {
    const webhook = await (this.prisma.client as any).workflowEngineWebhook.findFirst({
      where: {
        id: endpointId,
        direction: "INCOMING",
        isActive: true,
      },
      include: {
        organization: true,
      },
    });

    if (
      !webhook ||
      (orgSlug !== "org" && webhook.organization?.slug !== orgSlug)
    ) {
      throw new NotFoundException("Incoming webhook endpoint not found or inactive.");
    }

    const organization = webhook.organization;
    if (!organization) {
      throw new NotFoundException("Organization not found");
    }

    if (webhook.secret) {
      const signatureHeader =
        headers["x-dealio-signature"] ||
        headers["X-Dealio-Signature"] ||
        headers["x-workflow-signature"] ||
        headers["X-Workflow-Signature"] ||
        headers["x-hub-signature-256"] ||
        headers["X-Hub-Signature-256"];

      if (!signatureHeader) {
        throw new BadRequestException("Missing required webhook HMAC signature header.");
      }

      const rawBody = typeof body === "string" ? body : JSON.stringify(body);
      const cleanSig = signatureHeader.replace(/^sha256=/, "");
      const expectedSig = crypto
        .createHmac("sha256", webhook.secret)
        .update(rawBody)
        .digest("hex");

      const expectedHash = crypto.createHash("sha256").update(expectedSig).digest();
      const actualHash = crypto.createHash("sha256").update(cleanSig).digest();

      if (!crypto.timingSafeEqual(expectedHash, actualHash)) {
        throw new BadRequestException("Invalid webhook HMAC signature.");
      }
    }

    // Log incoming audit entry
    await (this.prisma.client as any).workflowEngineAuditLog.create({
      data: {
        organizationId: organization.id,
        action: "INCOMING_WEBHOOK_RECEIVED",
        level: "INFO",
        details: {
          endpointId: webhook.id,
          name: webhook.name,
          headers,
          body,
        },
      },
    });

    return {
      received: true,
      timestamp: new Date().toISOString(),
      endpointId: webhook.id,
      organizationId: organization.id,
    };
  }

  async createLog(subscriptionId: string, event: string, payload: any) {
    return this.prisma.client.webhookLog.create({
      data: {
        subscriptionId,
        event,
        payload,
        status: "PENDING",
      },
    });
  }

  async updateLog(logId: string, data: any) {
    return this.prisma.client.webhookLog.update({
      where: { id: logId },
      data,
    });
  }

  generateSignature(payload: any, secret: string): string {
    return crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(payload))
      .digest("hex");
  }
}
