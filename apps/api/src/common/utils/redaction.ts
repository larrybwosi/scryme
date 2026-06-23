/**
 * Recursively redacts sensitive data from an object.
 *
 * @param data The object to redact sensitive data from.
 * @param sensitiveKeys A list of keys that should be redacted.
 * @returns A new object with sensitive data redacted.
 *
 * @security This utility is critical for preventing accidental exposure of
 * credentials, secrets, and PII in server logs and external monitoring tools.
 */
export function redactSensitiveData(
  data: any,
  sensitiveKeys: string[] = [
    "password",
    "pin",
    "token",
    "clientSecret",
    "client_secret",
    "secret",
    "apiKey",
    "api_key",
    "access_token",
    "refresh_token",
    "otp",
    "passcode",
    "cvv",
    "cvc",
    "cardNumber",
    "card_number",
    "ssn",
    "dob",
    "birthday",
    "authorization",
    "x-api-key",
    "x-member-token",
    "cookie",
    "signature",
    "mpesaPassKey",
    "secret_key",
    "access_key",
    "client_id",
    "clientId",
  ],
  depth = 0,
  maxDepth = 5,
): any {
  if (data === null || data === undefined || depth > maxDepth) {
    return data;
  }

  // Handle Error objects specifically as they have non-enumerable properties
  if (data instanceof Error) {
    const redactedError: any = {
      name: data.name,
      message: data.message, // Consider if message needs string-based redaction
      stack: data.stack,
    };

    // Capture all other properties (both enumerable and non-enumerable)
    const allProps = Object.getOwnPropertyNames(data);
    for (const key of allProps) {
      if (["name", "message", "stack"].includes(key)) continue;

      if (sensitiveKeys.includes(key)) {
        redactedError[key] = "[REDACTED]";
      } else {
        redactedError[key] = redactSensitiveData(
          (data as any)[key],
          sensitiveKeys,
          depth + 1,
          maxDepth,
        );
      }
    }
    return redactedError;
  }

  if (Array.isArray(data)) {
    if (data.length > 100) {
      return `[Array of ${data.length} items]`;
    }
    return data.map((item) =>
      redactSensitiveData(item, sensitiveKeys, depth + 1, maxDepth),
    );
  }

  if (typeof data === "object") {
    const redactedData: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        if (sensitiveKeys.includes(key)) {
          redactedData[key] = "[REDACTED]";
        } else {
          redactedData[key] = redactSensitiveData(
            data[key],
            sensitiveKeys,
            depth + 1,
            maxDepth,
          );
        }
      }
    }
    return redactedData;
  }

  return data;
}
