import { describe, expect, it } from "vitest";
import { computeWebhookSignature, verifyWebhookSignature } from "../src/signature";

const body = '{"event":"record.updated","id":"evt_1"}';

describe("webhook signature", () => {
  it("accepts the active secret", () => {
    const signature = computeWebhookSignature("active-secret", body);
    expect(verifyWebhookSignature(signature, body, ["active-secret"])).toBe(true);
  });

  it("accepts the previous secret during rotation", () => {
    const signature = computeWebhookSignature("old-secret", body);
    expect(verifyWebhookSignature(signature, body, ["active-secret", "old-secret"])).toBe(true);
  });

  it("rejects a changed body, a missing signature and a wrong secret", () => {
    const signature = computeWebhookSignature("active-secret", body);
    expect(verifyWebhookSignature(signature, `${body} `, ["active-secret"])).toBe(false);
    expect(verifyWebhookSignature(undefined, body, ["active-secret"])).toBe(false);
    expect(verifyWebhookSignature(signature, body, ["other-secret"])).toBe(false);
  });
});
