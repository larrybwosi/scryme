import { redactSensitiveData } from "../redaction";
import { describe, it, expect } from "vitest";

describe("redactSensitiveData", () => {
  it("should redact sensitive keys at the top level", () => {
    const data = {
      username: "jules",
      password: "mypassword",
      pin: "1234",
      apiKey: "key123",
      otp: "654321",
    };
    const redacted = redactSensitiveData(data);
    expect(redacted.password).toBe("[REDACTED]");
    expect(redacted.pin).toBe("[REDACTED]");
    expect(redacted.apiKey).toBe("[REDACTED]");
    expect(redacted.otp).toBe("[REDACTED]");
    expect(redacted.username).toBe("jules");
  });

  it("should redact sensitive keys in nested objects", () => {
    const data = {
      user: {
        name: "jules",
        clientSecret: "secret123",
      },
      metadata: {
        token: "token456",
      },
    };
    const redacted = redactSensitiveData(data);
    expect(redacted.user.clientSecret).toBe("[REDACTED]");
    expect(redacted.metadata.token).toBe("[REDACTED]");
    expect(redacted.user.name).toBe("jules");
  });

  it("should redact sensitive keys in arrays", () => {
    const data = [
      { id: 1, secret: "s1" },
      { id: 2, password: "p2" },
    ];
    const redacted = redactSensitiveData(data);
    expect(redacted[0].secret).toBe("[REDACTED]");
    expect(redacted[1].password).toBe("[REDACTED]");
  });

  it("should redact newly added sensitive keys", () => {
    const data = {
      cvc: "123",
      cardNumber: "1234567812345678",
      card_number: "8765432187654321",
      ssn: "000-00-0000",
      dob: "1990-01-01",
      birthday: "1990-01-01",
      safe: "data",
    };
    const redacted = redactSensitiveData(data);
    expect(redacted.cvc).toBe("[REDACTED]");
    expect(redacted.cardNumber).toBe("[REDACTED]");
    expect(redacted.card_number).toBe("[REDACTED]");
    expect(redacted.ssn).toBe("[REDACTED]");
    expect(redacted.dob).toBe("[REDACTED]");
    expect(redacted.birthday).toBe("[REDACTED]");
    expect(redacted.safe).toBe("data");
  });

  it("should handle null and undefined", () => {
    expect(redactSensitiveData(null)).toBe(null);
    expect(redactSensitiveData(undefined)).toBe(undefined);
  });

  it("should redact enhanced sensitive keys", () => {
    const data = {
      authorization: "Bearer token123",
      "x-api-key": "secret-key",
      "x-member-token": "member-token",
      cookie: "session=123",
      signature: "sig-456",
      mpesaPassKey: "pass-789",
      secret_key: "sk-abc",
      access_key: "ak-def",
      client_id: "cid-ghi",
      clientId: "cid-jkl",
      safe: "public",
    };
    const redacted = redactSensitiveData(data);
    expect(redacted.authorization).toBe("[REDACTED]");
    expect(redacted["x-api-key"]).toBe("[REDACTED]");
    expect(redacted["x-member-token"]).toBe("[REDACTED]");
    expect(redacted.cookie).toBe("[REDACTED]");
    expect(redacted.signature).toBe("[REDACTED]");
    expect(redacted.mpesaPassKey).toBe("[REDACTED]");
    expect(redacted.secret_key).toBe("[REDACTED]");
    expect(redacted.access_key).toBe("[REDACTED]");
    expect(redacted.client_id).toBe("[REDACTED]");
    expect(redacted.clientId).toBe("[REDACTED]");
    expect(redacted.safe).toBe("public");
  });

  it("should redact additional Sentinel-added keys", () => {
    const data = {
      accessToken: "access123",
      refreshToken: "refresh456",
      mpesaConsumerKey: "ckey789",
      mpesaConsumerSecret: "csec012",
      consumerKey: "ckey345",
      consumerSecret: "csec678",
      privateKey: "pk789",
      private_key: "pk012",
      normal: "value",
    };
    const redacted = redactSensitiveData(data);
    expect(redacted.accessToken).toBe("[REDACTED]");
    expect(redacted.refreshToken).toBe("[REDACTED]");
    expect(redacted.mpesaConsumerKey).toBe("[REDACTED]");
    expect(redacted.mpesaConsumerSecret).toBe("[REDACTED]");
    expect(redacted.consumerKey).toBe("[REDACTED]");
    expect(redacted.consumerSecret).toBe("[REDACTED]");
    expect(redacted.privateKey).toBe("[REDACTED]");
    expect(redacted.private_key).toBe("[REDACTED]");
    expect(redacted.normal).toBe("value");
  });

  it("should redact confirmation and webhook keys added by Sentinel", () => {
    const data = {
      pinHash: "hash123",
      pin_hash: "hash456",
      webhookSecret: "secret789",
      webhook_secret: "secret012",
      safe: "public",
    };
    const redacted = redactSensitiveData(data);
    expect(redacted.pinHash).toBe("[REDACTED]");
    expect(redacted.pin_hash).toBe("[REDACTED]");
    expect(redacted.webhookSecret).toBe("[REDACTED]");
    expect(redacted.webhook_secret).toBe("[REDACTED]");
    expect(redacted.safe).toBe("public");
  });

  it("should redact sensitive properties on Error objects", () => {
    const error = new Error("Database connection failed") as any;
    error.secret_key = "sensitive-db-key";
    error.config = {
      apiKey: "secret-api-key",
      db: {
        password: "db-password",
      },
    };

    const redacted = redactSensitiveData(error);

    expect(redacted.name).toBe("Error");
    expect(redacted.message).toBe("Database connection failed");
    expect(redacted.stack).toBeDefined();
    expect(redacted.secret_key).toBe("[REDACTED]");
    expect(redacted.config.apiKey).toBe("[REDACTED]");
    expect(redacted.config.db.password).toBe("[REDACTED]");
  });

  it("should be case-insensitive when redacting keys", () => {
    const data = {
      Password: "mypassword",
      PASSWORD: "UPPER",
      API_KEY: "key123",
      "X-Member-Token": "token456",
      "X-AUTH-TOKEN": "token789",
      secret: "lowercasesecret",
      Nested: {
        Secret: "hidden",
      },
    };
    const redacted = redactSensitiveData(data);
    expect(redacted.Password).toBe("[REDACTED]");
    expect(redacted.PASSWORD).toBe("[REDACTED]");
    expect(redacted.API_KEY).toBe("[REDACTED]");
    expect(redacted["X-Member-Token"]).toBe("[REDACTED]");
    expect(redacted["X-AUTH-TOKEN"]).toBe("[REDACTED]");
    expect(redacted.secret).toBe("[REDACTED]");
    expect(redacted.Nested.Secret).toBe("[REDACTED]");
  });

  it("should redact Sentinel-expanded list", () => {
    const data = {
      "Set-Cookie": "session=abc",
      "Proxy-Authorization": "Basic 123",
    };
    const redactedDefault = redactSensitiveData(data);
    expect(redactedDefault["Set-Cookie"]).toBe("[REDACTED]");
    expect(redactedDefault["Proxy-Authorization"]).toBe("[REDACTED]");
  });
});