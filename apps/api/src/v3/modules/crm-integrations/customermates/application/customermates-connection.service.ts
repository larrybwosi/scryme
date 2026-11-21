import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { lookup } from "node:dns/promises";
import {
  assertSafeBaseUrlResolved,
  CustomermatesClient,
  CustomermatesError,
  UnsafeUrlError,
  type CustomermatesListKind,
} from "@repo/customermates";
import { PrismaService } from "@/prisma/prisma.service";
import {
  assertDiscoveryComplete,
  buildSettings,
  decryptCredentials,
  encryptCredentials,
  ensureDefinition,
  findIntegration,
  getSettings,
  inferListKinds,
} from "../domain/customermates-context";
import { CUSTOMERMATES_QUEUE_NAME, type CustomermatesJobData } from "../infrastructure/customermates-job.types";
import type { ConnectCustomermatesInput } from "./dto/customermates.dto";

@Injectable()
export class CustomermatesConnectionService {
  private readonly logger = new Logger(CustomermatesConnectionService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(CUSTOMERMATES_QUEUE_NAME) private readonly queue: Queue<CustomermatesJobData>,
  ) {}

  async connect(organizationId: string, input: ConnectCustomermatesInput) {
    const definition = await ensureDefinition(this.prisma);
    const existing = await findIntegration(this.prisma, organizationId);
    if (existing?.isActive) {
      throw new ConflictException("Customermates is already connected for this organization");
    }

    try {
      await assertSafeBaseUrlResolved(input.baseUrl, async (host) => {
        const results = await lookup(host, { all: true });
        return results.map((result) => result.address);
      });
    } catch (error) {
      if (error instanceof UnsafeUrlError) {
        throw new UnprocessableEntityException(error.message);
      }
      throw new UnprocessableEntityException("Customermates base URL could not be verified");
    }

    const client = new CustomermatesClient({
      baseUrl: input.baseUrl,
      apiKey: input.apiKey,
    });

    let discovery;
    try {
      const found = await client.modelDiscover();
      const read = await client.modelRead(found.types.map((type) => type.id));
      discovery = { ...found, types: read.types.length ? read.types : found.types, schemaRevision: read.schemaRevision || found.schemaRevision };
    } catch (error) {
      throw this.mapUpstreamError(error);
    }

    const settings = buildSettings(discovery, input.listKinds as Partial<Record<CustomermatesListKind, string>> | undefined);
    try {
      assertDiscoveryComplete(settings);
    } catch (error) {
      throw new UnprocessableEntityException((error as Error).message);
    }

    const credentials = encryptCredentials({
      baseUrl: input.baseUrl,
      apiKey: input.apiKey,
      webhookSecret: input.webhookSecret,
    });

    const data = {
      credentials,
      settings: settings as unknown as object,
      isActive: true,
      syncStatus: "SYNCING",
      syncMessage: "Backfill queued",
    };

    const integration = existing
      ? await this.prisma.client.organizationIntegration.update({
          where: { id: existing.id },
          data,
        })
      : await this.prisma.client.organizationIntegration.create({
          data: {
            organizationId,
            integrationDefinitionId: definition.id,
            ...data,
          },
        });

    await this.enqueueBackfill(organizationId, integration.id, settings.schemaRevision);

    this.logger.log(`Customermates connected for organization ${organizationId}`);
    return {
      id: integration.id,
      status: integration.syncStatus,
      listKinds: settings.listKinds,
      fieldIds: settings.fieldIds,
      schemaRevision: settings.schemaRevision,
      discoveredLists: settings.types.map((type) => ({ id: type.id, name: type.name })),
    };
  }

  async getStatus(organizationId: string) {
    const integration = await this.requireConnected(organizationId);
    const counts = await this.prisma.client.integrationEvent.groupBy({
      by: ["status"],
      where: { organizationIntegrationId: integration.id },
      _count: { _all: true },
    });
    const settings = getSettings(integration.settings);
    return {
      id: integration.id,
      syncStatus: integration.syncStatus || "NOT_CONNECTED",
      syncMessage: integration.syncMessage,
      lastSyncAt: integration.lastSyncAt,
      schemaRevision: settings.schemaRevision,
      listKinds: settings.listKinds,
      fieldIds: settings.fieldIds,
      eventCounts: Object.fromEntries(counts.map((count) => [count.status, count._count._all])),
    };
  }

  async refreshSchema(organizationId: string) {
    const integration = await this.requireConnected(organizationId);
    if (integration.syncStatus === "SYNCING") {
      throw new ConflictException("Sync is already in progress");
    }
    const credentials = decryptCredentials(integration.credentials);
    const client = new CustomermatesClient({
      baseUrl: credentials.baseUrl,
      apiKey: credentials.apiKey,
      expectedRevision: getSettings(integration.settings).schemaRevision,
    });

    let discovery;
    try {
      const found = await client.modelDiscover();
      const read = await client.modelRead(found.types.map((type) => type.id));
      discovery = { ...found, types: read.types.length ? read.types : found.types, schemaRevision: read.schemaRevision || found.schemaRevision };
    } catch (error) {
      if (error instanceof CustomermatesError && error.status === 401) {
        throw new UnauthorizedException("Customermates rejected the API key");
      }
      throw new ServiceUnavailableException("Customermates schema could not be refreshed");
    }

    const current = getSettings(integration.settings);
    const settings = {
      ...current,
      listKinds: current.listKinds.contact && current.listKinds.organization ? current.listKinds : inferListKinds(discovery.types),
      fieldIds: Object.keys(current.fieldIds).length ? current.fieldIds : settingsFieldIds(discovery.types),
      schemaRevision: discovery.schemaRevision,
      types: discovery.types,
    };

    await this.prisma.client.organizationIntegration.update({
      where: { id: integration.id },
      data: { settings: settings as unknown as object, syncStatus: "SYNCED", syncMessage: "Schema refreshed" },
    });

    const pending = await this.prisma.client.integrationEvent.findMany({
      where: { organizationIntegrationId: integration.id, status: "PENDING" },
      select: { id: true },
    });
    for (const event of pending) {
      await this.queue.add("apply-event", {
        organizationId,
        integrationId: integration.id,
        eventId: event.id,
        source: "retry",
      });
    }

    return { schemaRevision: settings.schemaRevision, requeued: pending.length };
  }

  async disconnect(organizationId: string) {
    const integration = await this.requireConnected(organizationId);
    await this.prisma.client.organizationIntegration.update({
      where: { id: integration.id },
      data: { isActive: false, syncStatus: "NOT_CONNECTED", syncMessage: "Disconnected" },
    });
    return { status: "NOT_CONNECTED" };
  }

  async rotateSecret(organizationId: string, webhookSecret: string) {
    const integration = await this.requireConnected(organizationId);
    const current = decryptCredentials(integration.credentials);
    const settings = getSettings(integration.settings);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    await this.prisma.client.organizationIntegration.update({
      where: { id: integration.id },
      data: {
        credentials: encryptCredentials({
          ...current,
          webhookSecret,
          previousWebhookSecret: current.webhookSecret,
        }) as object,
        settings: { ...settings, previousSecretExpiresAt: expiresAt.toISOString() } as unknown as object,
      },
    });
    return {
      activeSecretConfigured: true,
      previousSecretExpiresAt: expiresAt.toISOString(),
    };
  }

  async requireConnected(organizationId: string) {
    const integration = await findIntegration(this.prisma, organizationId);
    if (!integration || !integration.isActive) {
      throw new NotFoundException("Customermates is not connected for this organization");
    }
    return integration;
  }

  async enqueueBackfill(organizationId: string, integrationId: string, schemaRevision: number) {
    await this.queue.add(
      "backfill-page",
      { organizationId, integrationId, page: 1, source: "backfill" },
      { attempts: 3, backoff: { type: "exponential", delay: 5000 }, removeOnComplete: true },
    );
    return { jobId: `${CUSTOMERMATES_QUEUE_NAME}:backfill:${integrationId}:${schemaRevision}` };
  }

  private mapUpstreamError(error: unknown): Error {
    if (error instanceof CustomermatesError && error.status === 401) {
      return new UnauthorizedException("Customermates rejected the API key");
    }
    if (error instanceof CustomermatesError) {
      return new UnprocessableEntityException(error.message);
    }
    return new UnprocessableEntityException("Customermates could not be reached or verified");
  }
}

function settingsFieldIds(types: Array<{ fields?: Array<{ id: string; name?: string; label?: string }> }>) {
  const ids: Record<string, string> = {};
  const patterns: Array<[string, RegExp]> = [
    ["firstName", /first.?name/i],
    ["lastName", /last.?name|surname/i],
    ["fullName", /^(name|display.?name)$/i],
    ["email", /e.?mail/i],
    ["phone", /phone|mobile/i],
    ["organizationName", /company|organi[sz]ation/i],
    ["dealStage", /stage/i],
  ];
  for (const type of types) {
    for (const field of type.fields || []) {
      for (const [key, pattern] of patterns) {
        if (!ids[key] && pattern.test(`${field.name || ""} ${field.label || ""}`)) ids[key] = field.id;
      }
    }
  }
  return ids;
}
