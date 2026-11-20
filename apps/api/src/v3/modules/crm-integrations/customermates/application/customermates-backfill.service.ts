import { Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import {
  CustomermatesClient,
  mapRecordValues,
  type CustomermatesListKind,
  type CustomermatesSettings,
} from "@repo/customermates";
import { PrismaService } from "@/prisma/prisma.service";
import { decryptCredentials, findIntegration, getSettings } from "../domain/customermates-context";
import { CUSTOMERMATES_QUEUE_NAME, type CustomermatesJobData } from "../infrastructure/customermates-job.types";
import { CustomermatesMetricsService } from "./customermates-metrics.service";
import { CustomermatesSyncService } from "./customermates-sync.service";

const BACKFILL_KINDS: CustomermatesListKind[] = ["contact", "organization", "deal", "message"];

@Injectable()
export class CustomermatesBackfillService {
  private readonly logger = new Logger(CustomermatesBackfillService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sync: CustomermatesSyncService,
    private readonly metrics: CustomermatesMetricsService,
    @InjectQueue(CUSTOMERMATES_QUEUE_NAME) private readonly queue: Queue<CustomermatesJobData>,
  ) {}

  async start(organizationId: string, integrationId: string, resume: boolean) {
    const integration = await this.prisma.client.organizationIntegration.findFirst({
      where: { id: integrationId, organizationId },
    });
    if (!integration) throw new Error("Customermates integration not found");
    if (integration.syncStatus === "SYNCING") throw new Error("Sync is already in progress");

    const settings = getSettings(integration.settings);
    const cursor = resume ? settings.backfillCursor : undefined;
    const kind = cursor?.typeId
      ? this.kindForTypeId(settings, cursor.typeId)
      : this.nextKind(settings, undefined);
    if (!kind) {
      await this.markSynced(integrationId);
      return { jobId: null, queued: false };
    }

    await this.prisma.client.organizationIntegration.update({
      where: { id: integrationId },
      data: {
        syncStatus: "SYNCING",
        syncMessage: "Backfill started",
        settings: {
          ...settings,
          backfillCursor: cursor || {
            typeId: settings.listKinds[kind] || "",
            page: 1,
          },
        } as unknown as object,
      },
    });

    return this.enqueuePage(organizationId, integrationId, kind, cursor?.page || 1);
  }

  async queuePending(organizationId: string) {
    const integration = await findIntegration(this.prisma, organizationId);
    if (!integration?.isActive) return { queued: false };
    const settings = getSettings(integration.settings);
    if (!settings.backfillPending) return { queued: false };

    const kind = settings.backfillCursor?.typeId
      ? this.kindForTypeId(settings, settings.backfillCursor.typeId)
      : this.nextKind(settings, undefined);
    if (!kind) {
      await this.prisma.client.organizationIntegration.update({
        where: { id: integration.id },
        data: {
          syncStatus: "SYNCED",
          syncMessage: "Backfill complete",
          lastSyncAt: new Date(),
          settings: { ...settings, backfillPending: false, backfillCursor: undefined } as unknown as object,
        },
      });
      return { queued: false };
    }

    const cursor = settings.backfillCursor || {
      typeId: settings.listKinds[kind] || "",
      page: 1,
    };
    await this.prisma.client.organizationIntegration.update({
      where: { id: integration.id },
      data: {
        syncStatus: "SYNCING",
        syncMessage: "Backfill queued",
        settings: { ...settings, backfillPending: false, backfillCursor: cursor } as unknown as object,
      },
    });
    return this.enqueuePage(organizationId, integration.id, kind, cursor.page);
  }

  async runPage(data: CustomermatesJobData) {
    const { organizationId, integrationId } = data;
    if (!integrationId) return;
    const integration = await this.prisma.client.organizationIntegration.findFirst({
      where: { id: integrationId, organizationId },
    });
    if (!integration?.isActive) return;

    const settings = getSettings(integration.settings);
    const cursor = settings.backfillCursor;
    const page = data.page || cursor?.page || 1;
    const kind = cursor?.typeId
      ? this.kindForTypeId(settings, cursor.typeId)
      : this.nextKind(settings, undefined);
    if (!kind || !settings.listKinds[kind]) {
      await this.markSynced(integrationId);
      return;
    }
    const typeId = settings.listKinds[kind] as string;
    const credentials = decryptCredentials(integration.credentials);
    const client = new CustomermatesClient({
      baseUrl: credentials.baseUrl,
      apiKey: credentials.apiKey,
      expectedRevision: settings.schemaRevision,
    });

    let result;
    try {
      result = await client.recordsQuery({
        typeId,
        page,
        pageSize: 100,
        expectedRevision: settings.schemaRevision,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.prisma.client.organizationIntegration.update({
        where: { id: integrationId },
        data: { syncStatus: "ERROR", syncMessage: `Backfill page ${page} failed: ${message}` },
      });
      await this.metrics.recordFailure(organizationId, `backfill:${kind}`, {
        integrationId,
        error: message,
      });
      throw error;
    }

    for (const record of result.records) {
      const ref = record.ref || {
        typeId: record.typeId || typeId,
        recordId: String(record.recordId || record.id || ""),
      };
      if (!ref.typeId || !ref.recordId) continue;
      const values = mapRecordValues(record, settings.fieldIds);
      try {
        if (kind === "message") {
          await this.sync.syncMessage({
            organizationId,
            integration,
            settings,
            payload: {
              id: `backfill_${ref.recordId}`,
              event: "messaging.backfill",
              data: {
                entityId: ref.recordId,
                participant: values.participant,
                content: values.messageContent,
              },
            },
            receivedAt: new Date(),
            eventId: `backfill_${ref.recordId}`,
          });
        } else {
          await this.sync.syncRemoteRecord({
            organizationId,
            integration,
            settings,
            client,
            kind,
            typeId: ref.typeId,
            recordId: ref.recordId,
            version: record.version ?? null,
            remoteTimestamp: (record.updatedAt as string) ?? null,
            values,
            raw: record,
            receivedAt: new Date(),
            source: "backfill",
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await this.markRecordFailed(integrationId, ref.typeId, ref.recordId, message);
        await this.metrics.recordFailure(organizationId, `backfill:${kind}`, {
          integrationId,
          eventId: ref.recordId,
          error: message,
        });
      }
    }

    const lastRecordId = result.records.length
      ? String(
          result.records[result.records.length - 1].ref?.recordId ||
            result.records[result.records.length - 1].recordId ||
            result.records[result.records.length - 1].id ||
            "",
        )
      : undefined;

    if (result.hasMore) {
      await this.updateCursor(integrationId, settings, {
        typeId,
        page: result.nextPage || page + 1,
        lastRecordId,
      });
      await this.enqueuePage(organizationId, integrationId, kind, result.nextPage || page + 1);
      return;
    }

    const nextKind = this.nextKind(settings, kind);
    if (nextKind && settings.listKinds[nextKind]) {
      await this.updateCursor(integrationId, settings, {
        typeId: settings.listKinds[nextKind] as string,
        page: 1,
      });
      await this.enqueuePage(organizationId, integrationId, nextKind, 1);
      return;
    }

    await this.markSynced(integrationId);
  }

  private kindForTypeId(settings: CustomermatesSettings, typeId: string): CustomermatesListKind | null {
    return BACKFILL_KINDS.find((kind) => settings.listKinds[kind] === typeId) || null;
  }

  private nextKind(settings: CustomermatesSettings, current?: CustomermatesListKind): CustomermatesListKind | null {
    const start = current ? BACKFILL_KINDS.indexOf(current) + 1 : 0;
    for (let index = start; index < BACKFILL_KINDS.length; index += 1) {
      const kind = BACKFILL_KINDS[index];
      if (settings.listKinds[kind]) return kind;
    }
    return null;
  }

  private async updateCursor(
    integrationId: string,
    settings: CustomermatesSettings,
    cursor: { typeId: string; page: number; lastRecordId?: string },
  ) {
    await this.prisma.client.organizationIntegration.update({
      where: { id: integrationId },
      data: {
        settings: { ...settings, backfillCursor: cursor } as unknown as object,
        syncMessage: `Backfill page ${cursor.page}`,
      },
    });
  }

  private async markSynced(integrationId: string) {
    const integration = await this.prisma.client.organizationIntegration.findUnique({
      where: { id: integrationId },
    });
    if (!integration) return;
    const settings = getSettings(integration.settings);
    await this.prisma.client.organizationIntegration.update({
      where: { id: integrationId },
      data: {
        syncStatus: "SYNCED",
        syncMessage: "Backfill complete",
        lastSyncAt: new Date(),
        settings: { ...settings, backfillCursor: undefined } as unknown as object,
      },
    });
  }

  private async markRecordFailed(integrationId: string, typeId: string, recordId: string, error: string) {
    const integration = await this.prisma.client.organizationIntegration.findUnique({
      where: { id: integrationId },
      select: { organizationId: true },
    });
    if (!integration) return;
    await this.prisma.client.customermatesRecordState.upsert({
      where: {
        organizationIntegrationId_typeId_recordId: {
          organizationIntegrationId: integrationId,
          typeId,
          recordId,
        },
      },
      create: {
        organizationId: integration.organizationId,
        organizationIntegrationId: integrationId,
        typeId,
        recordId,
        processingState: "FAILED",
        lastError: error,
      },
      update: { processingState: "FAILED", lastError: error },
    });
  }

  private async enqueuePage(
    organizationId: string,
    integrationId: string,
    kind: CustomermatesListKind,
    page: number,
  ) {
    this.logger.log(`Customermates backfill ${kind} page ${page} for organization ${organizationId}`);
    await this.queue.add(
      "backfill-page",
      { organizationId, integrationId, page, source: "backfill" },
      { attempts: 3, backoff: { type: "exponential", delay: 5000 }, removeOnComplete: true },
    );
    return { jobId: `${CUSTOMERMATES_QUEUE_NAME}:backfill:${integrationId}:${kind}:${page}`, queued: true };
  }
}
