import { Injectable, Logger } from "@nestjs/common";
import {
  classifyEvent,
  CustomermatesClient,
  extractEventTimestamp,
  extractEventVersion,
  extractRecordRef,
  mapRecordValues,
  SchemaRevisionMismatchError,
  shouldApplyIncoming,
  type CustomermatesListKind,
  type CustomermatesRecord,
  type CustomermatesSettings,
  type CustomermatesWebhookEvent,
  type MappedRecordValues,
} from "@repo/customermates";
import { PrismaService } from "@/prisma/prisma.service";
import { decryptCredentials, getSettings } from "../domain/customermates-context";
import { CustomermatesMetricsService } from "./customermates-metrics.service";

const ENTITY_TYPE: Record<string, string> = {
  contact: "CUSTOMER",
  organization: "BUSINESS_ACCOUNT",
  deal: "DEAL",
  message: "MESSAGE",
};

export interface SyncRecordInput {
  organizationId: string;
  integration: any;
  settings: CustomermatesSettings;
  client: CustomermatesClient;
  kind: CustomermatesListKind;
  typeId: string;
  recordId: string;
  version: number | string | null;
  remoteTimestamp: Date | string | null;
  values: MappedRecordValues;
  raw: unknown;
  receivedAt: Date;
  eventId?: string;
  source: string;
  changes?: Array<{ fieldId: string; before?: unknown; after?: unknown }>;
}

type SyncOutcome = { status: "applied" | "skipped"; reason: string; internalId?: string };

@Injectable()
export class CustomermatesSyncService {
  private readonly logger = new Logger(CustomermatesSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly metrics: CustomermatesMetricsService,
  ) {}

  async applyEvent(organizationId: string, integrationId: string, eventId: string) {
    const event = await this.prisma.client.integrationEvent.findFirst({
      where: { id: eventId, organizationIntegrationId: integrationId, organizationIntegration: { organizationId } },
    });
    if (!event) return;

    const integration = await this.prisma.client.organizationIntegration.findUnique({
      where: { id: integrationId },
    });
    if (!integration?.isActive) {
      await this.markEvent(eventId, "FAILED", "Integration is disconnected");
      return;
    }

    const settings = getSettings(integration.settings);
    const credentials = decryptCredentials(integration.credentials);
    const client = new CustomermatesClient({
      baseUrl: credentials.baseUrl,
      apiKey: credentials.apiKey,
      expectedRevision: settings.schemaRevision,
    });
    const payload = (event.payload || {}) as CustomermatesWebhookEvent;

    try {
      const remoteRevision = payload.data?.record?.schemaRevision;
      if (typeof remoteRevision === "number" && remoteRevision !== settings.schemaRevision) {
        throw new SchemaRevisionMismatchError(
          `Webhook schema revision ${remoteRevision} does not match stored revision ${settings.schemaRevision}`,
        );
      }

      const classification = classifyEvent(payload, settings.listKinds);
      if (classification.kind === "skip") {
        await this.markEvent(eventId, "COMPLETED", null);
        return;
      }

      const ref = extractRecordRef(payload);
      if (!ref) {
        await this.markEvent(eventId, "FAILED", "Webhook payload has no record reference");
        return;
      }

      if (classification.kind === "message") {
        await this.syncMessage({
          organizationId,
          integration,
          settings,
          payload,
          receivedAt: event.receivedAt,
          eventId,
        });
      } else {
        let record: CustomermatesRecord = {};
        try {
          record = await client.recordsRead({ ref, expectedRevision: settings.schemaRevision });
        } catch (error) {
          this.logger.warn(`Could not read full Customermates record ${recordId(ref)}: ${(error as Error).message}`);
        }
        await this.syncRemoteRecord({
          organizationId,
          integration,
          settings,
          client,
          kind: classification.kind,
          typeId: ref.typeId,
          recordId: ref.recordId,
          version: extractEventVersion(payload) ?? record.version ?? null,
          remoteTimestamp: extractEventTimestamp(payload) ?? (record.updatedAt as string) ?? null,
          values: mapRecordValues(record, settings.fieldIds),
          raw: record && Object.keys(record).length ? record : payload,
          receivedAt: event.receivedAt,
          eventId,
          source: "webhook",
          changes: payload.data?.record?.fields,
        });
      }

      await this.markEvent(eventId, "COMPLETED", null);
      await this.prisma.client.organizationIntegration.update({
        where: { id: integrationId },
        data: { lastSyncAt: new Date(), syncStatus: "SYNCED", syncMessage: "Last delivery applied" },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.markEvent(eventId, "FAILED", message);
      await this.prisma.client.organizationIntegration.update({
        where: { id: integrationId },
        data: { syncStatus: "ERROR", syncMessage: message },
      });
      await this.metrics.recordFailure(organizationId, String(payload.event || "unknown"), {
        integrationId,
        eventId,
        error: message,
      });
      throw error;
    }
  }

  async syncRemoteRecord(input: SyncRecordInput): Promise<SyncOutcome> {
    const { organizationId, integration, typeId, recordId, kind, receivedAt } = input;

    const state = await this.prisma.client.customermatesRecordState.upsert({
      where: {
        organizationIntegrationId_typeId_recordId: {
          organizationIntegrationId: integration.id,
          typeId,
          recordId,
        },
      },
      create: {
        organizationId,
        organizationIntegrationId: integration.id,
        typeId,
        recordId,
        processingState: "PENDING",
      },
      update: { processingState: "PENDING", lastError: null },
    });

    const decision = shouldApplyIncoming({
      remoteVersion: input.version,
      localVersion: state.externalVersion,
      remoteTimestamp: input.remoteTimestamp,
      lastSyncedAt: state.lastSyncedAt || integration.lastSyncAt,
      receivedAt,
    });
    if (decision.skewed) {
      this.logger.warn(`Skewed timestamp for ${typeId}/${recordId} in organization ${organizationId}`);
    }
    if (!decision.apply) {
      await this.prisma.client.customermatesRecordState.update({
        where: { id: state.id },
        data: {
          processingState: "SKIPPED",
          lastError: decision.reason,
          lastChangedAt: decision.effectiveTimestamp,
        },
      });
      return { status: "skipped", reason: decision.reason };
    }

    const internalId = kind === "deal"
      ? await this.syncDeal(input)
      : await this.syncParty(input);

    await this.prisma.client.customermatesRecordState.update({
      where: { id: state.id },
      data: {
        processingState: "APPLIED",
        externalVersion: input.version === null || input.version === undefined ? state.externalVersion : String(input.version),
        lastChangedAt: decision.effectiveTimestamp,
        lastSyncedAt: new Date(),
        lastError: null,
      },
    });
    return { status: "applied", reason: decision.reason, internalId };
  }

  async syncMessage(input: {
    organizationId: string;
    integration: any;
    settings: CustomermatesSettings;
    payload: CustomermatesWebhookEvent;
    receivedAt: Date;
    eventId?: string;
  }) {
    const { organizationId, integration, payload } = input;
    const data = payload.data || {};
    const externalId = String(data.entityId || data.providerMessageId || payload.id);
    const participant = String(data.participantPhone || data.participant || data.from || "");
    const content = String(data.content || data.body || data.text || "");
    const channel = participant.includes("@") ? "EMAIL" : "OTHER";

    const existingMessage = await this.prisma.client.communicationMessage.findFirst({
      where: { externalId, organizationId },
      select: { id: true },
    });
    if (existingMessage) return { status: "skipped", reason: "duplicate_message" };

    let thread = await this.prisma.client.communicationThread.findFirst({
      where: { organizationId, channel, participantPhone: participant },
      select: { id: true },
    });
    if (!thread) {
      thread = await this.prisma.client.communicationThread.create({
        data: {
          organizationId,
          channel,
          participantPhone: participant,
          participantName: data.participantName ? String(data.participantName) : null,
        },
        select: { id: true },
      });
    }

    await this.prisma.client.communicationMessage.create({
      data: {
        organizationId,
        threadId: thread.id,
        externalId,
        direction: "INBOUND",
        content,
        status: "DELIVERED",
        metadata: { source: "CUSTOMERMATES", eventId: payload.id, integrationId: integration.id } as object,
      },
    });
    return { status: "applied", reason: "message_created" };
  }

  private async syncParty(input: SyncRecordInput): Promise<string> {
    const { organizationId, values, kind, recordId, typeId, raw } = input;
    const entityType = ENTITY_TYPE[kind];
    const mapping = await this.prisma.client.externalMapping.findFirst({
      where: {
        organizationId,
        provider: "CUSTOMERMATES",
        externalId: recordId,
        entityType,
      },
    });

    let internalId = mapping?.internalId;
    if (!internalId && kind === "contact") {
      const candidates = values.email
        ? await this.prisma.client.customer.findMany({
            where: { organizationId, email: values.email },
            select: { id: true },
          })
        : [];
      if (candidates.length > 1) {
        throw new Error(`Customermates email ${values.email} matches more than one customer`);
      }
      internalId = candidates[0]?.id;
      if (!internalId) {
        const created = await this.prisma.client.customer.create({
          data: {
            organizationId,
            name: values.name || values.email || "Customermates contact",
            email: values.email,
            phone: values.phone,
            creationType: "API_CREATED",
          },
          select: { id: true },
        });
        internalId = created.id;
      }
    } else if (!internalId && kind === "organization") {
      const candidates = values.organizationName
        ? await this.prisma.client.businessAccount.findMany({
            where: { organizationId, name: values.organizationName },
            select: { id: true },
          })
        : [];
      if (candidates.length > 1) {
        throw new Error(`Customermates organization ${values.organizationName} matches more than one business account`);
      }
      internalId = candidates[0]?.id;
      if (!internalId) {
        const created = await this.prisma.client.businessAccount.create({
          data: {
            organizationId,
            name: values.organizationName || "Customermates organization",
          },
          select: { id: true },
        });
        internalId = created.id;
      }
    }
    if (!internalId) throw new Error("Could not resolve a local record for the Customermates event");

    if (kind === "contact") {
      await this.prisma.client.customer.updateMany({
        where: { id: internalId, organizationId },
        data: {
          name: values.name || undefined,
          email: values.email || undefined,
          phone: values.phone || undefined,
        },
      });
    } else {
      await this.prisma.client.businessAccount.updateMany({
        where: { id: internalId, organizationId },
        data: { name: values.organizationName || undefined },
      });
    }

    if (mapping) {
      await this.prisma.client.externalMapping.update({
        where: { id: mapping.id },
        data: { internalId, lastSyncedAt: new Date(), externalData: raw as object },
      });
    } else {
      await this.prisma.client.externalMapping.create({
        data: {
          organizationId,
          organizationIntegrationId: input.integration.id,
          internalEntityType: entityType === "CUSTOMER" ? "Customer" : "BusinessAccount",
          internalId,
          externalId: recordId,
          externalEntityId: recordId,
          entityType,
          provider: "CUSTOMERMATES",
          externalData: { ...(raw as object), typeId },
        },
      });
    }
    return internalId;
  }

  private async syncDeal(input: SyncRecordInput): Promise<string> {
    const { organizationId, values, recordId, raw, changes } = input;
    const object = await this.ensureObject(organizationId, "deals", "Deal", "Deals");
    const mapping = await this.prisma.client.externalMapping.findFirst({
      where: { organizationId, provider: "CUSTOMERMATES", externalId: recordId, entityType: "DEAL" },
    });

    const data: Record<string, unknown> = {
      name: values.name || `Customermates deal ${recordId}`,
      stage: values.dealStage,
      externalId: recordId,
      externalData: raw,
    };

    let recordIdLocal = mapping?.internalId;
    if (!recordIdLocal) {
      const created = await this.prisma.client.crmRecord.create({
        data: { objectId: object.id, organizationId, data: data as object },
        select: { id: true },
      });
      recordIdLocal = created.id;
    } else {
      await this.prisma.client.crmRecord.updateMany({
        where: { id: recordIdLocal, organizationId },
        data: { data: data as object },
      });
    }

    const relatedRecordId = await this.findRelatedCrmRecordId(organizationId, raw, values.relation);
    const pendingLink = !relatedRecordId;
    if (relatedRecordId) {
      await this.linkAssociation(organizationId, recordIdLocal, relatedRecordId);
    }

    if (mapping) {
      await this.prisma.client.externalMapping.update({
        where: { id: mapping.id },
        data: { internalId: recordIdLocal, externalData: { ...data, pendingLink } as object, lastSyncedAt: new Date() },
      });
    } else {
      await this.prisma.client.externalMapping.create({
        data: {
          organizationId,
          organizationIntegrationId: input.integration.id,
          internalEntityType: "CrmRecord",
          internalId: recordIdLocal,
          externalId: recordId,
          externalEntityId: recordId,
          entityType: "DEAL",
          provider: "CUSTOMERMATES",
          externalData: { ...data, pendingLink },
        },
      });
    }

    await this.prisma.client.crmActivity.create({
      data: {
        recordId: recordIdLocal,
        organizationId,
        type: mapping ? "UPDATE" : "CREATION",
        description: `Customermates deal ${mapping ? "updated" : "created"}`,
        metadata: { changes: changes || [], source: "CUSTOMERMATES", eventId: input.eventId } as object,
      },
    });
    return recordIdLocal;
  }

  private async ensureObject(organizationId: string, name: string, label: string, labelPlural: string) {
    const existing = await this.prisma.client.crmObjectDefinition.findUnique({
      where: { organizationId_name: { organizationId, name } },
    });
    if (existing) return existing;
    return this.prisma.client.crmObjectDefinition.create({
      data: { organizationId, name, label, labelPlural, isSystem: true },
    });
  }

  private async linkAssociation(organizationId: string, dealRecordId: string, customerRecordId: string) {
    const customerObject = await this.ensureObject(organizationId, "customer", "Customer", "Customers");
    const dealObject = await this.ensureObject(organizationId, "deals", "Deal", "Deals");
    const relationship = await this.prisma.client.crmRelationshipDefinition.upsert({
      where: { organizationId_name: { organizationId, name: "deal_customer" } },
      create: {
        organizationId,
        name: "deal_customer",
        type: "MANY_TO_MANY",
        sourceObjectId: dealObject.id,
        targetObjectId: customerObject.id,
        sourceLabel: "Deals",
        targetLabel: "Customers and companies",
      },
      update: {},
    });
    await this.prisma.client.crmAssociation.upsert({
      where: {
        relationshipId_sourceRecordId_targetRecordId: {
          relationshipId: relationship.id,
          sourceRecordId: dealRecordId,
          targetRecordId: customerRecordId,
        },
      },
      create: {
        relationshipId: relationship.id,
        sourceRecordId: dealRecordId,
        targetRecordId: customerRecordId,
      },
      update: {},
    });
  }

  private async findRelatedCrmRecordId(organizationId: string, raw: unknown, relationId?: string | null): Promise<string | null> {
    const serialized = JSON.stringify({ raw: raw || {}, relationId });
    const mappings = await this.prisma.client.externalMapping.findMany({
      where: {
        organizationId,
        provider: "CUSTOMERMATES",
        entityType: { in: ["CUSTOMER", "BUSINESS_ACCOUNT"] },
      },
      select: { externalId: true, internalId: true, entityType: true },
    });
    for (const mapping of mappings) {
      if (!mapping.internalId || !serialized.includes(mapping.externalId)) continue;
      const record = await this.prisma.client.crmRecord.findFirst({
        where:
          mapping.entityType === "BUSINESS_ACCOUNT"
            ? { organizationId, businessAccount: { id: mapping.internalId } }
            : { organizationId, customer: { id: mapping.internalId } },
        select: { id: true },
      });
      if (record) return record.id;
    }
    return null;
  }

  private async markEvent(eventId: string, status: "COMPLETED" | "FAILED", error: string | null) {
    await this.prisma.client.integrationEvent.update({
      where: { id: eventId },
      data: { status, processingError: error, processedAt: new Date() },
    });
  }
}

function recordId(ref: { typeId: string; recordId: string }) {
  return `${ref.typeId}/${ref.recordId}`;
}
