import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { PrismaService } from "@/prisma/prisma.service";
import { findIntegration, getSettings } from "../domain/customermates-context";
import { CUSTOMERMATES_QUEUE_NAME, type CustomermatesJobData } from "../infrastructure/customermates-job.types";

@Injectable()
export class CustomermatesFailedService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(CUSTOMERMATES_QUEUE_NAME) private readonly queue: Queue<CustomermatesJobData>,
  ) {}

  async list(organizationId: string) {
    const integration = await this.requireConnected(organizationId);
    const [events, states] = await Promise.all([
      this.prisma.client.integrationEvent.findMany({
        where: {
          organizationIntegrationId: integration.id,
          status: "FAILED",
        },
        select: {
          id: true,
          eventType: true,
          externalEventId: true,
          processingError: true,
          receivedAt: true,
          processedAt: true,
        },
        orderBy: { receivedAt: "desc" },
        take: 100,
      }),
      this.prisma.client.customermatesRecordState.findMany({
        where: {
          organizationIntegrationId: integration.id,
          processingState: "FAILED",
        },
        select: {
          id: true,
          typeId: true,
          recordId: true,
          lastError: true,
          lastChangedAt: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 100,
      }),
    ]);
    return { events, records: states };
  }

  async retry(organizationId: string, eventIds?: string[]) {
    const integration = await this.requireConnected(organizationId);
    if (integration.syncStatus === "SYNCING") {
      throw new ConflictException("Sync is already in progress");
    }
    return this.requeueEvents(organizationId, integration.id, eventIds);
  }

  async retryPending(organizationId: string) {
    const integration = await this.requireConnected(organizationId);
    const settings = getSettings(integration.settings);
    if (!settings.retryPending) return { requeued: 0 };

    await this.prisma.client.organizationIntegration.update({
      where: { id: integration.id },
      data: {
        settings: { ...settings, retryPending: false } as unknown as object,
      },
    });
    return this.requeueEvents(organizationId, integration.id);
  }

  private async requeueEvents(organizationId: string, integrationId: string, eventIds?: string[]) {
    const events = await this.prisma.client.integrationEvent.findMany({
      where: {
        organizationIntegrationId: integrationId,
        status: "FAILED",
        ...(eventIds?.length ? { id: { in: eventIds } } : {}),
      },
      select: { id: true },
    });

    for (const event of events) {
      await this.prisma.client.integrationEvent.update({
        where: { id: event.id },
        data: { status: "PENDING", processingError: null, processedAt: null },
      });
      await this.queue.add(
        "apply-event",
        {
          organizationId,
          integrationId,
          eventId: event.id,
          source: "retry",
        },
        { attempts: 5, backoff: { type: "exponential", delay: 1000 }, removeOnComplete: true },
      );
    }

    if (events.length) {
      await this.prisma.client.organizationIntegration.update({
        where: { id: integrationId },
        data: { syncStatus: "SYNCING", syncMessage: `${events.length} failed item(s) requeued` },
      });
    }

    await this.prisma.client.customermatesRecordState.updateMany({
      where: {
        organizationIntegrationId: integrationId,
        processingState: "FAILED",
      },
      data: { processingState: "PENDING", lastError: null },
    });

    return { requeued: events.length, jobId: `customermates:retry:${integrationId}` };
  }

  private async requireConnected(organizationId: string) {
    const integration = await findIntegration(this.prisma, organizationId);
    if (!integration || !integration.isActive) {
      throw new NotFoundException("Customermates is not connected for this organization");
    }
    return integration;
  }
}
