import type {
  CustomermatesFieldChange,
  CustomermatesFieldMap,
  CustomermatesRecord,
  CustomermatesValueWrapper,
} from "./types";

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return normalized || null;
}

export function splitName(value: string): { firstName: string; lastName: string } {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts[parts.length - 1] };
}

function unwrapValue(entry: CustomermatesValueWrapper | unknown): unknown {
  if (!entry || typeof entry !== "object") return entry;
  const wrapper = entry as CustomermatesValueWrapper;
  const inner = (wrapper as any).value;
  if (inner && typeof inner === "object" && "value" in inner) {
    return (inner as any).value;
  }
  if (inner !== undefined) return inner;
  return (wrapper as any).state === "value" ? undefined : undefined;
}

export function readFieldValue(
  record: CustomermatesRecord | undefined,
  fieldId: string | undefined,
): unknown {
  if (!record || !fieldId) return undefined;
  const fields = record.fields;
  if (Array.isArray(fields)) {
    const entry = fields.find((field) => field.fieldId === fieldId) as CustomermatesFieldChange | undefined;
    if (!entry) return undefined;
    return unwrapValue(entry.after ?? entry.value);
  }
  if (fields && typeof fields === "object") {
    const entry = (fields as Record<string, unknown>)[fieldId];
    return unwrapValue(entry);
  }
  return undefined;
}

export function readIdentity(
  record: CustomermatesRecord | undefined,
  kind: string,
): string | null {
  const identities = record?.identities;
  if (!Array.isArray(identities)) return null;
  const match = identities.find(
    (identity) => (identity.kind || "").toLowerCase() === kind.toLowerCase(),
  );
  return typeof match?.value === "string" ? match.value : null;
}

export interface MappedRecordValues {
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  organizationName: string | null;
  dealStage: string | null;
  messageContent: string | null;
  participant: string | null;
  relation: string | null;
}

export function mapRecordValues(
  record: CustomermatesRecord | undefined,
  fieldIds: CustomermatesFieldMap,
): MappedRecordValues {
  const asText = (value: unknown): string | null => {
    if (typeof value === "string") return value.trim() || null;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    return null;
  };

  const firstName = asText(readFieldValue(record, fieldIds.firstName));
  const lastName = asText(readFieldValue(record, fieldIds.lastName));
  const fullName = asText(readFieldValue(record, fieldIds.fullName));
  const joinedName = [firstName, lastName].filter(Boolean).join(" ");
  const name = joinedName || fullName || null;

  return {
    name,
    firstName,
    lastName,
    email: normalizeEmail(readIdentity(record, "email") || readFieldValue(record, fieldIds.email)),
    phone: asText(readIdentity(record, "phone") || readFieldValue(record, fieldIds.phone)),
    organizationName: asText(readFieldValue(record, fieldIds.organizationName)),
    dealStage: asText(readFieldValue(record, fieldIds.dealStage)),
    messageContent: asText(readFieldValue(record, fieldIds.messageContent)),
    participant: asText(readFieldValue(record, fieldIds.participant)),
    relation: asText(readFieldValue(record, fieldIds.relation)),
  };
}

export interface FieldChangeSet {
  name?: string;
  email?: string;
  phone?: string;
}

export function buildMutationFields(
  fieldIds: CustomermatesFieldMap,
  changes: FieldChangeSet,
): Array<{ fieldId: string; value: { kind: string; value: unknown } }> {
  const fields: Array<{ fieldId: string; value: { kind: string; value: unknown } }> = [];
  const add = (fieldId: string | undefined, value: string | undefined) => {
    if (fieldId && value !== undefined) {
      fields.push({ fieldId, value: { kind: "text", value } });
    }
  };

  if (changes.name !== undefined) {
    if (fieldIds.firstName && fieldIds.lastName) {
      const split = splitName(changes.name);
      add(fieldIds.firstName, split.firstName);
      add(fieldIds.lastName, split.lastName);
    } else {
      add(fieldIds.fullName, changes.name);
    }
  }
  add(fieldIds.email, changes.email);
  add(fieldIds.phone, changes.phone);

  return fields;
}

export function buildIdempotencyKey(
  integrationId: string,
  recordId: string,
  changedAt: string | number | Date,
): string {
  const time = changedAt instanceof Date ? changedAt.toISOString() : String(changedAt);
  return `cm_${integrationId}_${recordId}_${time}`.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 200);
}
