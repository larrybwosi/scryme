export type CustomermatesListKind = "contact" | "organization" | "deal" | "message";

export interface CustomermatesFieldDefinition {
  id: string;
  name?: string;
  label?: string;
  type?: string;
}

export interface CustomermatesListType {
  id: string;
  name?: string;
  label?: string;
  kind?: string;
  fields?: CustomermatesFieldDefinition[];
}

export interface CustomermatesFieldMap {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  organizationName?: string;
  dealStage?: string;
  messageContent?: string;
  participant?: string;
  relation?: string;
}

export interface CustomermatesRecordRef {
  typeId: string;
  recordId: string;
}

export interface CustomermatesValue {
  kind?: string;
  value?: unknown;
  state?: string;
}

export interface CustomermatesValueWrapper {
  state?: string;
  value?: CustomermatesValue | unknown;
}

export interface CustomermatesFieldChange {
  fieldId: string;
  before?: CustomermatesValueWrapper;
  after?: CustomermatesValueWrapper;
  value?: CustomermatesValueWrapper;
}

export interface CustomermatesRecord {
  ref?: CustomermatesRecordRef;
  typeId?: string;
  recordId?: string;
  version?: number | string | null;
  schemaRevision?: number;
  fields?: CustomermatesFieldChange[] | Record<string, unknown>;
  identities?: Array<{ kind?: string; value?: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

export interface CustomermatesBackfillCursor {
  typeId: string;
  page: number;
  lastRecordId?: string;
}

export interface CustomermatesSettings {
  listKinds: Partial<Record<CustomermatesListKind, string>>;
  fieldIds: CustomermatesFieldMap;
  schemaRevision: number;
  types: CustomermatesListType[];
  backfillCursor?: CustomermatesBackfillCursor;
  backfillPending?: boolean;
  retryPending?: boolean;
  previousSecretExpiresAt?: string;
}

export interface CustomermatesCredentials {
  baseUrl: string;
  apiKey: string;
  webhookSecret: string;
  previousWebhookSecret?: string;
}

export interface DiscoverResult {
  types: CustomermatesListType[];
  schemaRevision: number;
  raw?: unknown;
}

export interface ReadModelResult {
  types: CustomermatesListType[];
  schemaRevision: number;
  raw?: unknown;
}

export interface QueryRecordsInput {
  typeId: string;
  page?: number;
  pageSize?: number;
  cursor?: string;
  expectedRevision?: number;
}

export interface QueryRecordsResult {
  records: CustomermatesRecord[];
  hasMore: boolean;
  nextPage?: number;
  nextCursor?: string;
  raw?: unknown;
}

export interface ReadRecordInput {
  ref: CustomermatesRecordRef;
  expectedRevision?: number;
}

export interface MutationField {
  fieldId: string;
  value: { kind: string; value: unknown };
}

export interface MutateRecordInput {
  ref: CustomermatesRecordRef;
  expectedVersion: number | string | null;
  expectedRevision: number;
  fields: MutationField[];
  idempotencyKey: string;
}

export interface MutateResult {
  status: string;
  refs: CustomermatesRecordRef[];
  schemaRevision?: number;
  version?: number | string | null;
  raw?: unknown;
}

export interface CustomermatesWebhookEvent {
  event?: string;
  id?: string;
  timestamp?: string;
  companyId?: string;
  actorId?: string | null;
  data?: Record<string, any>;
  [key: string]: unknown;
}
