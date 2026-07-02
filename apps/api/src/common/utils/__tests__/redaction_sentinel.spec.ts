import { redactSensitiveData } from "../redaction";
import { describe, it, expect } from "vitest";

describe("redactSensitiveData - new keys", () => {
  it("should redact 'pass', 'session', 'secret-token', and 'api-token'", () => {
    const data = {
      pass: "mypass",
      session: "mysession",
      "secret-token": "my-secret-token",
      "api-token": "my-api-token",
      normal: "value"
    };
    const redacted = redactSensitiveData(data);
    expect(redacted.pass).toBe("[REDACTED]");
    expect(redacted.session).toBe("[REDACTED]");
    expect(redacted["secret-token"]).toBe("[REDACTED]");
    expect(redacted["api-token"]).toBe("[REDACTED]");
    expect(redacted.normal).toBe("value");
  });
});
