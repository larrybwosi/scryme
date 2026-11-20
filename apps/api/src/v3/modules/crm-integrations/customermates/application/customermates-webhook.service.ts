import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { classifyEvent, verifyWebhookSignature, type CustomermatesWebhookEvent } from "@repo/customermates";
import { PrismaService } from "@/prisma/prisma.service";
import { decryptCredentials, findIntegration, getSettings } from "../domain/customermates-context";
import { CUSTOMERMATES_QUEUE_NAME, type CustomermatesJobData } from "../infrastructure/customermates-job.types";

@Injectable()
export class CustomermatesWebhookService {
  private readonly logger = new Logger(CustomermatesWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(CUSTOMERMATES_QUEUE_NAME) private readonly queue: Queue<CustomermatesJobData>,
  ) {}

  async receive(
    orgSlug: string,
    signature: string | undefined,
    rawBody: string,
    payload: CustomermatesWebhookEvent,
  ) {
    const organization = await this.prisma.client.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true },
    });
    if (!organization) throw new UnauthorizedException("Unknown organization");

    const integration = await findIntegration(this.prisma, organization.id);
    if (!integration?.isActive) throw new UnauthorizedException("Customermates is not connected");

    const credentials = decryptCredentials(integration.credentials);
    const settings = getSettings(integration.settings);
    const secrets = [credentials.webhookSecret];
    if (
      credentials.previousWebhookSecret &&
      settings.previousSecretExpiresAt &&
      new Date(settings.previousSecretExpiresAt).getTime() > Date.now()
    ) {
      secrets.push(credentials.previousWebhookSecret);
    }

    if (!verifyWebhookSignature(signature, rawBody, secrets)) {
      this.logger.warn(`Rejected Customermates delivery with invalid signature for organization ${organization.id}`);
      throw new UnauthorizedException("Invalid webhook signature");
    }

    const eventId = payload?.id;
    if (!eventId || typeof eventId !== "string") {
      throw new BadRequestException("Webhook event id is required");
    }

    const classification = classifyEvent(payload, settings.listKinds);
    const status = classification.kind === "skip" ? "COMPLETED" : "PENDING";

    try {
      const event = await this.prisma.client.integrationEvent.create({
        data: {
          organizationIntegrationId: integration.id,
          eventType: String(payload.event || "unknown"),
          externalEventId: eventId,
          payload: payload as object,
          status,
          processedAt: status === "COMPLETED" ? new Date() : null,
        },
      });

      if (classification.kind !== "skip") {
        await this.queue.add(
          "apply-event",
          {
            organizationId: organization.id,
            integrationId: integration.id,
            eventId: event.id,
            source: "webhook",
          },
          { attempts: 5, backoff: { type: "exponential", delay: 1000 }, removeOnComplete: true },
        );
      }

      return { received: true, eventId, eventType: payload.event, applied: classification.kind !== "skip" };
    } catch (error: any) {
      if (error?.code === "P2002") {
        return { received: true, eventId, duplicate: true };
      }
      throw error;
    }
  }
}
