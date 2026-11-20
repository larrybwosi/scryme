import { describe, expect, it } from "vitest";
import { parseSettings, serializeSettings } from "../src/settings";

describe("settings parsing", () => {
  it("defaults missing settings and preserves pending work flags", () => {
    expect(parseSettings(null)).toMatchObject({
      listKinds: {},
      fieldIds: {},
      schemaRevision: 0,
      types: [],
      backfillPending: false,
      retryPending: false,
    });

    const parsed = parseSettings({
      listKinds: { contact: "contacts" },
      fieldIds: { email: "email" },
      schemaRevision: 7,
      types: [{ id: "contacts" }],
      backfillPending: true,
      retryPending: true,
      previousSecretExpiresAt: "2026-11-21T12:00:00.000Z",
    });

    expect(parsed.backfillPending).toBe(true);
    expect(parsed.retryPending).toBe(true);
    expect(serializeSettings(parsed)).toMatchObject({
      backfillPending: true,
      retryPending: true,
      schemaRevision: 7,
    });
  });
});
