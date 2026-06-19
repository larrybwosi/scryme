import { redactSensitiveData } from "../redaction";

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
});
