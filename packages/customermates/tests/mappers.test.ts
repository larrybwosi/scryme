import { describe, expect, it } from "vitest";
import {
  buildIdempotencyKey,
  buildMutationFields,
  mapRecordValues,
  normalizeEmail,
  splitName,
} from "../src/mappers";
import { classifyEvent } from "../src/events";
import { shouldApplyIncoming } from "../src/conflict";

const fieldIds = { firstName: "f1", lastName: "f2", email: "f3", phone: "f4" };

const record = {
  ref: { typeId: "t1", recordId: "r1" },
  fields: [
    { fieldId: "f1", after: { state: "value", value: { kind: "text", value: "Ada" } } },
    { fieldId: "f2", after: { state: "value", value: { kind: "text", value: "Lovelace" } } },
  ],
  identities: [
    { kind: "email", value: " ADA@Example.com " },
    { kind: "phone", value: "+254700000001" },
  ],
};

describe("field mapping", () => {
  it("normalizes values from Customermates records", () => {
    expect(splitName("Ada Lovelace")).toEqual({ firstName: "Ada", lastName: "Lovelace" });
    expect(normalizeEmail(" ADA@Example.com ")).toBe("ada@example.com");
    expect(mapRecordValues(record, fieldIds)).toMatchObject({
      name: "Ada Lovelace",
      email: "ada@example.com",
      phone: "+254700000001",
    });
  });

  it("sends only changed fields and splits a name into stored ids", () => {
    expect(buildMutationFields(fieldIds, { email: "new@example.com" })).toEqual([
      { fieldId: "f3", value: { kind: "text", value: "new@example.com" } },
    ]);
    expect(buildMutationFields(fieldIds, { name: "Grace Hopper" })).toHaveLength(2);
    expect(buildMutationFields({}, { name: "Grace" })).toEqual([]);
  });

  it("freezes a stable idempotency key", () => {
    const first = buildIdempotencyKey("int_1", "rec_1", "2026-11-20T10:00:00.000Z");
    const second = buildIdempotencyKey("int_1", "rec_1", new Date("2026-11-20T10:00:00.000Z"));
    expect(first).toBe(second);
    expect(first.length).toBeLessThanOrEqual(200);
  });

  it("maps a related record field", () => {
    const related = {
      fields: [{ fieldId: "rel", after: { state: "value", value: { kind: "text", value: "acc_1" } } }],
    };
    expect(mapRecordValues(related, { relation: "rel" }).relation).toBe("acc_1");
  });
});

describe("event classification", () => {
  it("maps record events to configured list types and skips deletes", () => {
    const kinds = { contact: "contact-type", organization: "org-type", deal: "deal-type" };
    expect(classifyEvent({ event: "record.updated", data: { record: { ref: { typeId: "contact-type", recordId: "r" } } } }, kinds).kind).toBe("contact");
    expect(classifyEvent({ event: "record.deleted", data: { record: { ref: { typeId: "contact-type", recordId: "r" } } } }, kinds).kind).toBe("skip");
    expect(classifyEvent({ event: "messaging.message.received" }, kinds).kind).toBe("message");
  });
});

describe("conflict resolution", () => {
  const receivedAt = "2026-11-20T10:05:00.000Z";

  it("uses version first and lets a tie lose", () => {
    expect(shouldApplyIncoming({ remoteVersion: 3, localVersion: 2, receivedAt }).reason).toBe("remote_version_newer");
    expect(shouldApplyIncoming({ remoteVersion: 2, localVersion: 3, receivedAt }).apply).toBe(false);
    expect(shouldApplyIncoming({ remoteVersion: 2, localVersion: 2, receivedAt }).reason).toBe("version_tie");
  });

  it("falls back to the last synced time and treats skew as receipt time", () => {
    expect(shouldApplyIncoming({ remoteTimestamp: "2026-11-20T10:04:00.000Z", lastSyncedAt: "2026-11-20T10:03:00.000Z", receivedAt }).apply).toBe(true);
    expect(shouldApplyIncoming({ remoteTimestamp: "2026-11-20T10:01:00.000Z", lastSyncedAt: "2026-11-20T10:03:00.000Z", receivedAt }).apply).toBe(false);
    const skewed = shouldApplyIncoming({ remoteTimestamp: "2026-11-20T12:00:00.000Z", lastSyncedAt: "2026-11-20T10:03:00.000Z", receivedAt });
    expect(skewed.skewed).toBe(true);
    expect(skewed.effectiveTimestamp.toISOString()).toBe(receivedAt);
  });
});
