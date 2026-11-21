import type { CustomermatesSettings } from "./types";

export const CUSTOMERMATES_DEFINITION_SLUG = "customermates";
export const CUSTOMERMATES_PROVIDER = "CUSTOMERMATES";
export const CUSTOMERMATES_QUEUE = "customermates";
export const CUSTOMERMATES_FAILURE_COUNTER = "customermates_event_failed_total";

const EMPTY_SETTINGS: CustomermatesSettings = {
  listKinds: {},
  fieldIds: {},
  schemaRevision: 0,
  types: [],
  backfillPending: false,
  retryPending: false,
};

export function parseSettings(raw: unknown): CustomermatesSettings {
  if (!raw || typeof raw !== "object") return { ...EMPTY_SETTINGS };
  const value = raw as Partial<CustomermatesSettings>;
  return {
    listKinds: value.listKinds && typeof value.listKinds === "object" ? value.listKinds : {},
    fieldIds: value.fieldIds && typeof value.fieldIds === "object" ? value.fieldIds : {},
    schemaRevision: typeof value.schemaRevision === "number" ? value.schemaRevision : 0,
    types: Array.isArray(value.types) ? value.types : [],
    backfillCursor: value.backfillCursor,
    backfillPending: value.backfillPending === true,
    retryPending: value.retryPending === true,
    previousSecretExpiresAt: value.previousSecretExpiresAt,
  };
}

export function serializeSettings(settings: CustomermatesSettings): Record<string, unknown> {
  return { ...settings } as unknown as Record<string, unknown>;
}
