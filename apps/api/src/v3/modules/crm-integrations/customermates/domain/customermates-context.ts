import { PrismaService } from "@/prisma/prisma.service";
import { decryptV3, encryptV3 } from "@repo/shared/api/v3";
import {
  CUSTOMERMATES_DEFINITION_SLUG,
  CUSTOMERMATES_PROVIDER,
  parseSettings,
  type CustomermatesCredentials,
  type CustomermatesListKind,
  type CustomermatesListType,
  type CustomermatesSettings,
  type DiscoverResult,
} from "@repo/customermates";

export { CUSTOMERMATES_DEFINITION_SLUG, CUSTOMERMATES_PROVIDER };

export async function ensureDefinition(prisma: PrismaService) {
  return prisma.client.integrationDefinition.upsert({
    where: { slug: CUSTOMERMATES_DEFINITION_SLUG },
    create: {
      name: "Customermates",
      slug: CUSTOMERMATES_DEFINITION_SLUG,
      description: "Two way sync of contacts, organizations, deals and messages with Customermates",
      category: "CRM",
      authType: "API_KEY",
      isActive: true,
    },
    update: { isActive: true },
  });
}

export async function findIntegration(prisma: PrismaService, organizationId: string) {
  return prisma.client.organizationIntegration.findFirst({
    where: {
      organizationId,
      integrationDefinition: { slug: CUSTOMERMATES_DEFINITION_SLUG },
    },
  });
}

export function decryptCredentials(raw: unknown): CustomermatesCredentials {
  const value = (raw || {}) as Record<string, string>;
  return {
    baseUrl: decryptV3(value.baseUrl || ""),
    apiKey: decryptV3(value.apiKey || ""),
    webhookSecret: decryptV3(value.webhookSecret || ""),
    previousWebhookSecret: value.previousWebhookSecret ? decryptV3(value.previousWebhookSecret) : undefined,
  };
}

export function encryptCredentials(credentials: CustomermatesCredentials): Record<string, string> {
  const encrypted: Record<string, string> = {
    baseUrl: encryptV3(credentials.baseUrl),
    apiKey: encryptV3(credentials.apiKey),
    webhookSecret: encryptV3(credentials.webhookSecret),
  };
  if (credentials.previousWebhookSecret) {
    encrypted.previousWebhookSecret = encryptV3(credentials.previousWebhookSecret);
  }
  return encrypted;
}

export function getSettings(raw: unknown): CustomermatesSettings {
  return parseSettings(raw);
}

const LIST_KIND_PATTERNS: Array<[CustomermatesListKind, RegExp]> = [
  ["contact", /contact|person|people|lead/i],
  ["organization", /organi[sz]ation|compan(y|ies)|account/i],
  ["deal", /deal|opportunit|pipeline/i],
  ["message", /message|conversation|thread|inbox/i],
];

const FIELD_PATTERNS: Array<[keyof CustomermatesSettings["fieldIds"], RegExp]> = [
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

export function inferListKinds(types: CustomermatesListType[]): Partial<Record<CustomermatesListKind, string>> {
  const result: Partial<Record<CustomermatesListKind, string>> = {};
  for (const [kind, pattern] of LIST_KIND_PATTERNS) {
    const match = types.find((type) => pattern.test(`${type.name || ""} ${type.label || ""}`));
    if (match) result[kind] = match.id;
  }
  return result;
}

export function inferFieldIds(types: CustomermatesListType[]): CustomermatesSettings["fieldIds"] {
  const fieldIds: CustomermatesSettings["fieldIds"] = {};
  for (const type of types) {
    for (const field of type.fields || []) {
      const label = `${field.name || ""} ${field.label || ""} ${field.id}`;
      for (const [key, pattern] of FIELD_PATTERNS) {
        if (fieldIds[key]) continue;
        if (pattern.test(label)) fieldIds[key] = field.id;
      }
    }
  }
  return fieldIds;
}

export function buildSettings(
  discovery: DiscoverResult,
  listKinds?: Partial<Record<CustomermatesListKind, string>>,
): CustomermatesSettings {
  const resolvedKinds = listKinds && Object.keys(listKinds).length ? listKinds : inferListKinds(discovery.types);
  const selectedTypes = discovery.types.filter((type) => Object.values(resolvedKinds).includes(type.id));
  return {
    listKinds: resolvedKinds,
    fieldIds: inferFieldIds(selectedTypes.length ? selectedTypes : discovery.types),
    schemaRevision: discovery.schemaRevision,
    types: discovery.types,
  };
}

export function assertDiscoveryComplete(settings: CustomermatesSettings) {
  if (!settings.listKinds.contact || !settings.listKinds.organization) {
    throw new Error("Customermates discovery needs at least one contact list and one organization list");
  }
  if (!settings.schemaRevision || settings.schemaRevision <= 0) {
    throw new Error("Customermates discovery did not return a schema revision");
  }
}

export function safeEventLog(context: { organizationId: string; eventId?: string }) {
  return { organizationId: context.organizationId, eventId: context.eventId || "none" };
}
