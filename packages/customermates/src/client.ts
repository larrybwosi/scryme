import axios, { AxiosError, AxiosInstance } from "axios";
import {
  CustomermatesError,
  RateLimitExceededError,
  SchemaRevisionMismatchError,
} from "./errors";
import { assertSafeBaseUrl } from "./url-safety";
import type {
  CustomermatesListType,
  DiscoverResult,
  MutateRecordInput,
  MutateResult,
  QueryRecordsInput,
  QueryRecordsResult,
  ReadModelResult,
  ReadRecordInput,
  CustomermatesRecord,
} from "./types";

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_MAX_RETRY_AFTER_MS = 60_000;

function unwrap(payload: any): any {
  if (payload && typeof payload === "object" && payload.data && typeof payload.data === "object") {
    return { ...payload.data, schemaRevision: payload.data.schemaRevision ?? payload.schemaRevision };
  }
  return payload;
}

function pickArray(payload: any, keys: string[]): any[] {
  for (const key of keys) {
    const value = payload?.[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function pickValue(payload: any, keys: string[]): any {
  for (const key of keys) {
    if (payload?.[key] !== undefined && payload[key] !== null) return payload[key];
  }
  return undefined;
}

function normalizeType(raw: any): CustomermatesListType | null {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.id || raw.typeId || raw.listId;
  if (!id) return null;
  const fields = pickArray(raw.fields || raw.fieldDefinitions, ["fields", "items"]).map((field: any) => ({
    id: field.id || field.fieldId,
    name: field.name,
    label: field.label,
    type: field.type || field.kind,
  }));
  return {
    id: String(id),
    name: raw.name || raw.label,
    label: raw.label || raw.name,
    kind: raw.kind,
    fields,
  };
}

function normalizeRecord(raw: any): CustomermatesRecord {
  if (!raw || typeof raw !== "object") return {};
  const ref = raw.ref || {
    typeId: raw.typeId || raw.listId,
    recordId: raw.recordId || raw.id,
  };
  return { ...raw, ref };
}

export interface CustomermatesClientOptions {
  baseUrl: string;
  apiKey: string;
  expectedRevision?: number;
  http?: AxiosInstance;
  sleep?: (milliseconds: number) => Promise<void>;
  maxAttempts?: number;
  maxRetryAfterMs?: number;
}

export class CustomermatesClient {
  private readonly http: AxiosInstance;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private readonly maxAttempts: number;
  private readonly maxRetryAfterMs: number;
  private readonly expectedRevision: number | undefined;

  constructor(options: CustomermatesClientOptions) {
    const url = assertSafeBaseUrl(options.baseUrl);
    this.expectedRevision = options.expectedRevision;
    this.http = options.http || axios.create({
      baseURL: `${url.toString().replace(/\/+$/, "")}/api/v1`,
      headers: {
        "content-type": "application/json",
        "x-api-key": options.apiKey,
        accept: "application/json",
      },
      timeout: 15_000,
      maxBodyLength: 1_000_000,
      maxContentLength: 1_000_000,
    });
    this.sleep = options.sleep || ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    this.maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
    this.maxRetryAfterMs = options.maxRetryAfterMs ?? DEFAULT_MAX_RETRY_AFTER_MS;
  }

  async modelDiscover(): Promise<DiscoverResult> {
    const payload = unwrap(await this.post("model/discover", {}));
    const types = pickArray(payload, ["types", "recordTypes", "lists", "results"])
      .map(normalizeType)
      .filter((type): type is CustomermatesListType => !!type);
    const schemaRevision = Number(pickValue(payload, ["schemaRevision", "revision", "expectedSchemaRevision"]) || 0);
    return { types, schemaRevision, raw: payload };
  }

  async modelRead(typeIds?: string[]): Promise<ReadModelResult> {
    const body = typeIds?.length ? { typeIds } : {};
    const payload = unwrap(await this.post("model/read", body));
    const types = pickArray(payload, ["types", "recordTypes", "lists", "results"])
      .map(normalizeType)
      .filter((type): type is CustomermatesListType => !!type);
    const schemaRevision = Number(pickValue(payload, ["schemaRevision", "revision", "expectedSchemaRevision"]) || 0);
    return { types, schemaRevision, raw: payload };
  }

  async recordsQuery(input: QueryRecordsInput): Promise<QueryRecordsResult> {
    const body: Record<string, unknown> = {
      typeId: input.typeId,
      page: input.page ?? 1,
      pageSize: input.pageSize ?? 100,
    };
    if (input.cursor) body.cursor = input.cursor;
    if (input.expectedRevision !== undefined) body.expectedRevision = input.expectedRevision;
    else if (this.expectedRevision !== undefined) body.expectedRevision = this.expectedRevision;

    const payload = unwrap(await this.post("records/query", body));
    const records = pickArray(payload, ["records", "items", "results", "data"])
      .map(normalizeRecord);
    const nextPageRaw = pickValue(payload, ["nextPage", "next", "pageToken"]);
    const hasMore = Boolean(
      pickValue(payload, ["hasMore", "hasNextPage"]) ??
        (typeof nextPageRaw === "number" || typeof nextPageRaw === "string" ? true : false),
    );
    return {
      records,
      hasMore,
      nextPage: typeof nextPageRaw === "number" ? nextPageRaw : undefined,
      nextCursor: typeof nextPageRaw === "string" ? nextPageRaw : undefined,
      raw: payload,
    };
  }

  async recordsRead(input: ReadRecordInput): Promise<CustomermatesRecord> {
    const body: Record<string, unknown> = { ref: input.ref };
    if (input.expectedRevision !== undefined) body.expectedRevision = input.expectedRevision;
    else if (this.expectedRevision !== undefined) body.expectedRevision = this.expectedRevision;
    return normalizeRecord(unwrap(await this.post("records/read", body)));
  }

  async recordsMutate(input: MutateRecordInput): Promise<MutateResult> {
    const body = {
      expectedRevision: input.expectedRevision,
      idempotencyKey: input.idempotencyKey,
      mutation: {
        action: "update",
        ref: input.ref,
        expectedVersion: input.expectedVersion,
        fields: input.fields,
      },
    };
    const payload = unwrap(await this.post("records/mutate", body));
    const refs = pickArray(payload, ["refs", "references"]).map((ref: any) => ({
      typeId: ref.typeId,
      recordId: ref.recordId,
    }));
    const versionRaw = pickValue(payload, ["version", "afterVersion", "externalVersion"]);
    return {
      status: String(pickValue(payload, ["status"]) || "completed"),
      refs,
      schemaRevision: Number(pickValue(payload, ["schemaRevision", "revision"]) || 0) || undefined,
      version: versionRaw ?? undefined,
      raw: payload,
    };
  }

  private async post(path: string, body: unknown): Promise<any> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      try {
        const response = await this.http.post(`/${path}`, body);
        return response.data;
      } catch (error) {
        lastError = error;
        const status = (error as AxiosError)?.response?.status;
        const responseData = (error as AxiosError)?.response?.data as any;
        const code = responseData?.error?.kind || responseData?.error?.code || responseData?.code;

        if (status === 409 && String(code).toLowerCase().includes("revision")) {
          throw new SchemaRevisionMismatchError();
        }
        if (status !== 429) {
          throw new CustomermatesError(
            `Customermates ${path} failed with status ${status ?? "unknown"}`,
            status ?? 500,
            typeof code === "string" ? code : "upstream_error",
          );
        }
        if (attempt === this.maxAttempts) {
          throw new RateLimitExceededError(undefined, this.retryAfterMs((error as AxiosError)?.response?.headers));
        }
        await this.sleep(this.retryDelay(attempt, (error as AxiosError)?.response?.headers));
      }
    }
    throw lastError;
  }

  private retryAfterMs(headers: any): number | undefined {
    const raw = headers?.["retry-after"] ?? headers?.["Retry-After"];
    if (raw === undefined || raw === null) return undefined;
    const seconds = Number(raw);
    if (Number.isFinite(seconds)) return Math.min(Math.max(0, seconds * 1000), this.maxRetryAfterMs);
    const date = new Date(String(raw)).getTime();
    if (!Number.isNaN(date)) return Math.min(Math.max(0, date - Date.now()), this.maxRetryAfterMs);
    return undefined;
  }

  private retryDelay(attempt: number, headers: any): number {
    const fromHeader = this.retryAfterMs(headers);
    if (fromHeader !== undefined) return fromHeader;
    return Math.min(1_000 * 2 ** (attempt - 1), this.maxRetryAfterMs);
  }
}
