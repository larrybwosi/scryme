import { describe, it, expect } from "vitest";
import { timingSafeMatch, timingSafeBearerMatch } from "../crypto";

describe("crypto timing-safe matching", () => {
  describe("timingSafeMatch", () => {
    it("should return true for identical matching strings", () => {
      expect(timingSafeMatch("secret_token_123", "secret_token_123")).toBe(true);
    });

    it("should return false for different strings", () => {
      expect(timingSafeMatch("secret_token_123", "different_token")).toBe(false);
    });

    it("should return false and not crash when plaintext is undefined or null", () => {
      expect(timingSafeMatch(undefined, "stored_secret")).toBe(false);
      expect(timingSafeMatch(null, "stored_secret")).toBe(false);
    });

    it("should return false and not crash when stored is undefined or null", () => {
      expect(timingSafeMatch("user_secret", undefined)).toBe(false);
      expect(timingSafeMatch("user_secret", null)).toBe(false);
    });

    it("should return false and not crash when both are undefined or null", () => {
      expect(timingSafeMatch(undefined, undefined)).toBe(false);
      expect(timingSafeMatch(null, null)).toBe(false);
    });

    it("should return false and not crash if given non-string parameters", () => {
      expect(timingSafeMatch({} as any, "stored_secret")).toBe(false);
      expect(timingSafeMatch("user_secret", 12345 as any)).toBe(false);
    });
  });

  describe("timingSafeBearerMatch", () => {
    it("should return true for matching tokens", () => {
      expect(timingSafeBearerMatch("my_bearer_token", "my_bearer_token")).toBe(true);
    });

    it("should return false for mismatched tokens", () => {
      expect(timingSafeBearerMatch("my_bearer_token", "other_token")).toBe(false);
    });

    it("should return false and not crash when token is undefined or null", () => {
      expect(timingSafeBearerMatch(undefined, "expected_token")).toBe(false);
      expect(timingSafeBearerMatch(null, "expected_token")).toBe(false);
    });
  });
});
