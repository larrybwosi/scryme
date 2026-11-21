import { Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import {
  buildIdempotencyKey,
  buildMutationFields,
  CustomermatesClient,
  RateLimitExceededError,
  SchemaRevisionMismatchError,
  type FieldChangeSet,
} from "@repo/customermates";
import { PrismaService } from "@/prisma/prisma.service";
import {
  CUSTOMERMATES_PROVIDER,
  decryptCredentials,
  getSettings,
} from "../domain/customermates-context";
import { CUSTOMERMATES_QUEUE_NAME, type CustomermatesJobData } from "../infrastructure/customermates-job.types";
import { CustomermatesMetricsService } from "./customermates-metrics.service";

@Injectable()
export class CustomermatesWritebackService {
  private readonly logger = new Logger(CustomermatesWritebackService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly metrics: CustomermatesMetricsService,
    @InjectQueue(CUSTOMERMATES_QUEUE_NAME) private readonly queue: Queue<CustomermatesJobData>,
  ) {}

  async assertWritable(organizationId: string, customerId: string) {
    const mapping = await this.prisma.client.externalMapping.findFirst({
      where: {
        organizationId,
        provider: CUSTOMERMATES_PROVIDER,
        entityType: "CUSTOMER",
        internalId: customerId,
      },
      select: { organizationIntegrationId: true },
    });
    if (!mapping?.organizationIntegrationId) return;
    const integration = await this.prisma.client.organizationIntegration.findFirst({
      where: { id: mapping.organizationIntegrationId, organizationId },
      select: { syncStatus: true },
    });
    if (integration?.syncStatus === "ERROR") {
      throw new Error("Customermates integration is in error state");
    }
  }

  async enqueueFromCustomerUpdate(
    organizationId: string,
    customerId: string,
    changes: FieldChangeSet,
  ) {
    if (!Object.keys(changes).length) return { enqueued: false };

    const mapping = await this.prisma.client.externalMapping.findFirst({
      where: {
        organizationId,
        provider: CUSTOMERMATES_PROVIDER,
        entityType: "CUSTOMER",
        internalId: customerId,
      },
      select: {
        id: true,
        organizationIntegrationId: true,
        externalId: true,
        externalData: true,
      },
    });
    if (!mapping?.organizationIntegrationId) return { enqueued: false };

    const integration = await this.prisma.client.organizationIntegration.findFirst({
      where: { id: mapping.organizationIntegrationId, organizationId },
    });
    if (!integration?.isActive) return { enqueued: false };
    if (integration.syncStatus === "ERROR") {
      throw new Error("Customermates integration is in error state");
    }

    const idempotencyKey = buildIdempotencyKey(
      integration.id,
      customerId,
      new Date(),
    );
    await this.queue.add(
      "writeback",
      {
        organizationId,
        integrationId: integration.id,
        mappingId: mapping.id,
        changes,
        idempotencyKey,
        source: "webhook",
      },
      { attempts: 5, backoff: { type: "exponential", delay: 1000 }, removeOnComplete: true },
    );
    return { enqueued: true, idempotencyKey };
  }

  async applyWriteback(data: CustomermatesJobData, attemptsMade = 1) {
    const { organizationId, integrationId, mappingId, changes, idempotencyKey } = data;
    if (!integrationId || !mappingId || !changes || !idempotencyKey) return { applied: false };

    const mapping = await this.prisma.client.externalMapping.findFirst({
      where: { id: mappingId, organizationId, organizationIntegrationId: integrationId },
    });
    if (!mapping) return { applied: false };

    const integration = await this.prisma.client.organizationIntegration.findFirst({
      where: { id: integrationId, organizationId },
    });
    if (!integration?.isActive) return { applied: false };

    const settings = getSettings(integration.settings);
    const credentials = decryptCredentials(integration.credentials);
    const client = new CustomermatesClient({
      baseUrl: credentials.baseUrl,
      apiKey: credentials.apiKey,
      expectedRevision: settings.schemaRevision,
    });
    const external = (mapping.externalData || {}) as Record<string, unknown>;
    const remoteState = String(external.state || external.recordState || "").toLowerCase();
    if (remoteState.includes("trash")) {
      await this.metrics.recordFailure(organizationId, "writeback", {
        integrationId,
        eventId: idempotencyKey,
        error: "remote_record_trashed",
      });
      return { applied: false, reason: "remote_record_trashed" };
    }
    const ref = {
      typeId: String(external.typeId || settings.listKinds.contact || ""),
      recordId: mapping.externalId,
    };
    if (!ref.typeId) return { applied: false, reason: "missing_list_type" };

    const fields = buildMutationFields(settings.fieldIds, changes);
    if (!fields.length) return { applied: false, reason: "no_mapped_fields" };

    const state = await this.prisma.client.customermatesRecordState.findFirst({
      where: {
        organizationId,
        organizationIntegrationId: integrationId,
        typeId: ref.typeId,
        recordId: mapping.externalId,
      },
    });
    if (state?.processingState === "SKIPPED") {
      return { applied: false, reason: "remote_record_not_active" };
    }

    try {
      const result = await client.recordsMutate({
        ref,
        expectedVersion: state?.externalVersion ?? null,
        expectedRevision: settings.schemaRevision,
        fields,
        idempotencyKey,
      });

      if (state) {
        await this.prisma.client.customermatesRecordState.update({
          where: { id: state.id },
          data: {
            externalVersion: result.version === undefined ? state.externalVersion : String(result.version),
            lastSyncedAt: new Date(),
            processingState: "APPLIED",
            lastError: null,
          },
        });
      }
      await this.prisma.client.externalMapping.update({
        where: { id: mapping.id },
        data: { lastSyncedAt: new Date() },
      });
      await this.prisma.client.organizationIntegration.update({
        where: { id: integrationId },
        data: { lastSyncAt: new Date(), syncStatus: "SYNCED", syncMessage: "Write back applied" },
      });
      return { applied: true, version: result.version };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (state) {
        await this.prisma.client.customermatesRecordState.update({
          where: { id: state.id },
          data: { processingState: "FAILED", lastError: message },
        });
      }
      await this.metrics.recordFailure(organizationId, "writeback", {
        integrationId,
        eventId: idempotencyKey,
        error: message,
      });
      if (
        error instanceof RateLimitExceededError ||
        error instanceof SchemaRevisionMismatchError
      ) {
        await this.prisma.client.organizationIntegration.update({
          where: { id: integrationId },
          data: { syncStatus: "ERROR", syncMessage: message },
        });
      } else if (attemptsMade >= 5) {
        await this.prisma.client.organizationIntegration.update({
          where: { id: integrationId },
          data: { syncStatus: "ERROR", syncMessage: message },
        });
      }
      this.logger.error(`Write back failed for organization ${organizationId}: ${message}`);
      throw error;
    }
  }
}
