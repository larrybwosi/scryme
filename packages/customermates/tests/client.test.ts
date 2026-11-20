import { describe, expect, it, vi } from "vitest";
import { CustomermatesClient } from "../src/client";
import { RateLimitExceededError, SchemaRevisionMismatchError } from "../src/errors";

function httpError(status: number, headers: Record<string, unknown> = {}, data: unknown = {}) {
  return Object.assign(new Error(`status ${status}`), {
    response: { status, headers, data },
  });
}

describe("Customermates client", () => {
  it("retries a 429 using Retry-After then succeeds", async () => {
    const post = vi
      .fn()
      .mockRejectedValueOnce(httpError(429, { "retry-after": "0" }))
      .mockResolvedValueOnce({ data: { types: [{ id: "t1" }], schemaRevision: 4 } });
    const sleep = vi.fn().mockResolvedValue(undefined);
    const client = new CustomermatesClient({
      baseUrl: "https://crm.example.com",
      apiKey: "key",
      http: { post } as any,
      sleep,
    });

    const result = await client.modelDiscover();
    expect(result.schemaRevision).toBe(4);
    expect(result.types[0].id).toBe("t1");
    expect(post).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(0);
  });

  it("fails after five rate limited attempts", async () => {
    const post = vi.fn().mockRejectedValue(httpError(429, { "retry-after": "61" }));
    const sleep = vi.fn().mockResolvedValue(undefined);
    const client = new CustomermatesClient({
      baseUrl: "https://crm.example.com",
      apiKey: "key",
      http: { post } as any,
      sleep,
    });

    await expect(client.modelDiscover()).rejects.toBeInstanceOf(RateLimitExceededError);
    expect(post).toHaveBeenCalledTimes(5);
    expect(sleep).toHaveBeenCalledWith(60_000);
  });

  it("refuses writes with a stale schema revision", async () => {
    const post = vi.fn().mockRejectedValue(httpError(409, {}, { error: { kind: "revisionMismatch" } }));
    const client = new CustomermatesClient({
      baseUrl: "https://crm.example.com",
      apiKey: "key",
      http: { post } as any,
    });
    await expect(client.modelDiscover()).rejects.toBeInstanceOf(SchemaRevisionMismatchError);
  });

  it("sends a frozen idempotency key and expected version on mutate", async () => {
    const post = vi.fn().mockResolvedValue({ data: { status: "completed", refs: [], version: 8, schemaRevision: 4 } });
    const client = new CustomermatesClient({
      baseUrl: "https://crm.example.com",
      apiKey: "key",
      http: { post } as any,
    });

    const result = await client.recordsMutate({
      ref: { typeId: "t1", recordId: "r1" },
      expectedVersion: 7,
      expectedRevision: 4,
      idempotencyKey: "cm_fixed_key",
      fields: [{ fieldId: "f1", value: { kind: "text", value: "new" } }],
    });

    expect(result.version).toBe(8);
    expect(post.mock.calls[0][0]).toBe("/records/mutate");
    expect(post.mock.calls[0][1]).toMatchObject({
      expectedRevision: 4,
      idempotencyKey: "cm_fixed_key",
      mutation: { action: "update", expectedVersion: 7 },
    });
  });
});
