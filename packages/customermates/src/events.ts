import type { CustomermatesListKind, CustomermatesWebhookEvent } from "./types";

export type CustomermatesEventKind = CustomermatesListKind | "skip";

export interface EventClassification {
  kind: CustomermatesEventKind;
  reason: string;
}

const SKIPPED_PREFIXES = ["record.deleted", "record.restored", "record.deletedPermanently", "form.", "booking.", "webhook.received", "automation."];

export function classifyEvent(
  event: CustomermatesWebhookEvent,
  listKinds: Partial<Record<CustomermatesListKind, string>>,
): EventClassification {
  const name = event.event || "";
  const typeId = event.data?.record?.ref?.typeId || event.data?.typeId;

  if (name.startsWith("messaging.")) {
    return { kind: "message", reason: "messaging_event" };
  }
  if (SKIPPED_PREFIXES.some((prefix) => name.startsWith(prefix))) {
    return { kind: "skip", reason: "event_not_applied" };
  }
  if ((name === "record.created" || name === "record.updated") && typeId) {
    for (const kind of ["contact", "organization", "deal"] as const) {
      if (listKinds[kind] === typeId) return { kind, reason: "mapped_list_type" };
    }
    return { kind: "skip", reason: "unmapped_list_type" };
  }
  return { kind: "skip", reason: "unknown_event" };
}

export function extractRecordRef(
  event: CustomermatesWebhookEvent,
): { typeId: string; recordId: string } | null {
  const ref = event.data?.record?.ref;
  if (!ref?.typeId || !ref?.recordId) return null;
  return { typeId: ref.typeId, recordId: ref.recordId };
}

export function extractEventVersion(event: CustomermatesWebhookEvent): number | string | null {
  return event.data?.record?.afterVersion ?? event.data?.record?.version ?? null;
}

export function extractEventTimestamp(event: CustomermatesWebhookEvent): string | null {
  return event.timestamp || null;
}
