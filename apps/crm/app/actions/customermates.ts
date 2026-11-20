"use server";

import { lookup } from "node:dns/promises";
import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { decryptV3, encryptV3 } from "@repo/shared/api/v3";
import {
  assertSafeBaseUrlResolved,
  CustomermatesClient,
  UnsafeUrlError,
  type CustomermatesFieldMap,
  type CustomermatesListKind,
  type CustomermatesListType,
} from "@repo/customermates";

const DEFINITION_SLUG = "customermates";
const PROVIDER = "CUSTOMERMATES";

export interface CustomermatesConnectInput {
  baseUrl: string;
  apiKey: string;
  webhookSecret: string;
  listKinds?: Partial<Record<CustomermatesListKind, string>>;
}

async function requireAdmin() {
  const auth = await getServerAuth();
  if (!auth) throw new Error("Sign in required");
  if (auth.orgRole !== "OWNER" && auth.orgRole !== "ADMIN") {
    throw new Error("Only organization admins can manage integrations");
  }
  return auth;
}

async function findIntegration(organizationId: string) {
  return db.organizationIntegration.findFirst({
    where: {
      organizationId,
      integrationDefinition: { slug: DEFINITION_SLUG },
    },
  });
}

async function getOrganizationSlug(organizationId: string) {
  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    select: { slug: true },
  });
  return organization?.slug || organizationId;
}

export async function getCustomermatesStatus() {
  const auth = await getServerAuth();
  if (!auth) return { success: false, error: "Sign in required" };
  const integration = await findIntegration(auth.organizationId);
  const settings = (integration?.settings || {}) as Record<string, any>;
  const slug = await getOrganizationSlug(auth.organizationId);
  const baseUrl = process.env.API_BASE_URL || "https://api.scryme.tech";
  const failed = integration
    ? await db.integrationEvent.count({
        where: { organizationIntegrationId: integration.id, status: "FAILED" },
      })
    : 0;
  return {
    success: true,
    data: {
      connected: !!integration?.isActive,
      syncStatus: integration?.syncStatus || "NOT_CONNECTED",
      syncMessage: integration?.syncMessage || "",
      lastSyncAt: integration?.lastSyncAt || null,
      schemaRevision: settings.schemaRevision || 0,
      listKinds: settings.listKinds || {},
      fieldIds: settings.fieldIds || {},
      failedCount: failed,
      webhookUrl: `${baseUrl.replace(/\/+$/, "")}/api/v3/webhooks/customermates/${slug}`,
    },
  };
}

export async function connectCustomermates(data: CustomermatesConnectInput) {
  const auth = await requireAdmin();
  if (data.webhookSecret.length < 16) {
    throw new Error("Webhook secret must be at least 16 characters");
  }
  await assertSafeBaseUrlResolved(data.baseUrl, async (host) => {
    const results = await lookup(host, { all: true });
    return results.map((result) => result.address);
  }).catch((error) => {
    if (error instanceof UnsafeUrlError) throw error;
    throw new Error("Customermates base URL could not be verified");
  });

  const client = new CustomermatesClient({
    baseUrl: data.baseUrl,
    apiKey: data.apiKey,
  });
  const discovered = await client.modelDiscover();
  const read = await client.modelRead(discovered.types.map((type) => type.id));
  const types = read.types.length ? read.types : discovered.types;
  const schemaRevision = read.schemaRevision || discovered.schemaRevision;
  const listKinds = data.listKinds && Object.keys(data.listKinds).length
    ? data.listKinds
    : inferListKinds(types);
  if (!listKinds.contact || !listKinds.organization) {
    throw new Error("Choose a contact list and an organization list before connecting");
  }
  if (!schemaRevision) {
    throw new Error("Customermates did not return a schema revision");
  }

  const definition = await db.integrationDefinition.upsert({
    where: { slug: DEFINITION_SLUG },
    create: {
      name: "Customermates",
      slug: DEFINITION_SLUG,
      description: "Two way sync of contacts, organizations, deals and messages",
      category: "CRM",
      authType: "API_KEY",
      isActive: true,
    },
    update: { isActive: true },
  });

  const existing = await findIntegration(auth.organizationId);
  const payload = {
    credentials: JSON.parse(JSON.stringify({
      baseUrl: encryptV3(data.baseUrl),
      apiKey: encryptV3(data.apiKey),
      webhookSecret: encryptV3(data.webhookSecret),
    })),
    settings: JSON.parse(JSON.stringify({
      listKinds,
      fieldIds: inferFieldIds(types),
      schemaRevision,
      types,
      backfillCursor: undefined,
      backfillPending: true,
    })),
    isActive: true,
    syncStatus: "SYNCING",
    syncMessage: "Backfill queued",
  };

  const integration = existing
    ? await db.organizationIntegration.update({
        where: { id: existing.id },
        data: payload,
      })
    : await db.organizationIntegration.create({
        data: {
          organizationId: auth.organizationId,
          integrationDefinitionId: definition.id,
          ...payload,
        },
      });

  return { success: true, data: { id: integration.id, schemaRevision, listKinds } };
}

export async function refreshCustomermatesSchema() {
  const auth = await requireAdmin();
  const integration = await findIntegration(auth.organizationId);
  if (!integration?.isActive) throw new Error("Customermates is not connected");
  const credentials = (integration.credentials || {}) as Record<string, string>;
  const client = new CustomermatesClient({
    baseUrl: credentials.baseUrl ? decryptV3(credentials.baseUrl) : "",
    apiKey: credentials.apiKey ? decryptV3(credentials.apiKey) : "",
  });
  const discovered = await client.modelDiscover();
  const read = await client.modelRead(discovered.types.map((type) => type.id));
  const types = read.types.length ? read.types : discovered.types;
  const settings = (integration.settings || {}) as Record<string, any>;
  await db.organizationIntegration.update({
    where: { id: integration.id },
    data: {
      settings: JSON.parse(JSON.stringify({
        ...settings,
        types,
        schemaRevision: read.schemaRevision || discovered.schemaRevision,
      })),
      syncStatus: "SYNCED",
      syncMessage: "Schema refreshed",
    },
  });
  return { success: true };
}

export async function disconnectCustomermates() {
  const auth = await requireAdmin();
  const integration = await findIntegration(auth.organizationId);
  if (!integration?.isActive) return { success: true };
  await db.organizationIntegration.update({
    where: { id: integration.id },
    data: { isActive: false, syncStatus: "NOT_CONNECTED", syncMessage: "Disconnected" },
  });
  return { success: true };
}

export async function rotateCustomermatesSecret(webhookSecret: string) {
  const auth = await requireAdmin();
  if (webhookSecret.length < 16) throw new Error("Webhook secret must be at least 16 characters");
  const integration = await findIntegration(auth.organizationId);
  if (!integration?.isActive) throw new Error("Customermates is not connected");
  const credentials = (integration.credentials || {}) as Record<string, string>;
  const settings = (integration.settings || {}) as Record<string, any>;
  const previousWebhookSecret = credentials.webhookSecret
    ? decryptV3(credentials.webhookSecret)
    : undefined;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await db.organizationIntegration.update({
    where: { id: integration.id },
    data: {
      credentials: JSON.parse(JSON.stringify({
        ...credentials,
        webhookSecret: encryptV3(webhookSecret),
        previousWebhookSecret: previousWebhookSecret ? encryptV3(previousWebhookSecret) : undefined,
      })),
      settings: JSON.parse(JSON.stringify({ ...settings, previousSecretExpiresAt: expiresAt })),
    },
  });
  return { success: true, previousSecretExpiresAt: expiresAt };
}

export async function listCustomermatesFailed() {
  const auth = await requireAdmin();
  const integration = await findIntegration(auth.organizationId);
  if (!integration) return { success: true, data: { events: [], records: [] } };

  const [events, records] = await Promise.all([
    db.integrationEvent.findMany({
      where: { organizationIntegrationId: integration.id, status: "FAILED" },
      select: {
        id: true,
        eventType: true,
        externalEventId: true,
        processingError: true,
        receivedAt: true,
      },
      orderBy: { receivedAt: "desc" },
      take: 100,
    }),
    db.customermatesRecordState.findMany({
      where: { organizationIntegrationId: integration.id, processingState: "FAILED" },
      select: { id: true, typeId: true, recordId: true, lastError: true },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
  ]);
  return { success: true, data: { events, records } };
}

export async function retryCustomermatesFailed(eventIds: string[] = []) {
  const auth = await requireAdmin();
  const integration = await findIntegration(auth.organizationId);
  if (!integration?.isActive) throw new Error("Customermates is not connected");
  const settings = (integration.settings || {}) as Record<string, any>;
  await db.organizationIntegration.update({
    where: { id: integration.id },
    data: {
      settings: JSON.parse(JSON.stringify({ ...settings, retryPending: true })),
    },
  });
  return { success: true, data: { requested: eventIds.length } };
}

export async function getCustomermatesSource(entityType: string, internalId: string) {
  const auth = await getServerAuth();
  if (!auth) return { source: null };
  const mapping = await db.externalMapping.findFirst({
    where: {
      organizationId: auth.organizationId,
      provider: PROVIDER,
      entityType,
      internalId,
    },
    select: { externalId: true },
  });
  return { source: mapping ? "Customermates" : null };
}

const LIST_PATTERNS: Array<[CustomermatesListKind, RegExp]> = [
  ["contact", /contact|person|people|lead/i],
  ["organization", /organi[sz]ation|compan(y|ies)|account/i],
  ["deal", /deal|opportunit|pipeline/i],
  ["message", /message|conversation|thread|inbox/i],
];

function inferListKinds(types: CustomermatesListType[]): Partial<Record<CustomermatesListKind, string>> {
  const result: Partial<Record<CustomermatesListKind, string>> = {};
  for (const [kind, pattern] of LIST_PATTERNS) {
    const match = types.find((type) => pattern.test(`${type.name || ""} ${type.label || ""}`));
    if (match) result[kind] = match.id;
  }
  return result;
}

const FIELD_PATTERNS: Array<[keyof CustomermatesFieldMap, RegExp]> = [
  ["firstName", /first.?name|given.?name/i],
  ["lastName", /last.?name|surname|family.?name/i],
  ["fullName", /^(full.?name|display.?name|name)$/i],
  ["email", /e.?mail/i],
  ["phone", /phone|mobile|telephone/i],
  ["organizationName", /company|organi[sz]ation|account.?name/i],
  ["dealStage", /stage|pipeline.?status/i],
  ["messageContent", /content|body|message.?text/i],
  ["participant", /participant|sender|from/i],
  ["relation", /related.?record|relation|link/i],
];

function inferFieldIds(types: CustomermatesListType[]): CustomermatesFieldMap {
  const fieldIds: CustomermatesFieldMap = {};
  for (const type of types) {
    for (const field of type.fields || []) {
      const label = `${field.name || ""} ${field.label || ""} ${field.id}`;
      for (const [key, pattern] of FIELD_PATTERNS) {
        if (!fieldIds[key] && pattern.test(label)) fieldIds[key] = field.id;
      }
    }
  }
  return fieldIds;
}
