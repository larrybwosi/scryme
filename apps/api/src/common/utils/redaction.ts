const DEFAULT_SENSITIVE_KEYS = [
  "password",
  "pin",
  "token",
  "clientSecret",
  "client_secret",
  "secret",
  "apiKey",
  "api_key",
  "access_token",
  "accessToken",
  "refresh_token",
  "refreshToken",
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
  "x-auth-token",
  "cookie",
  "set-cookie",
  "signature",
  "mpesaPassKey",
  "cardId",
  "card_id",
  "accountNumber",
  "account_number",
  "secret_key",
  "access_key",
  "client_id",
  "clientId",
  "mpesaConsumerKey",
  "mpesaConsumerSecret",
  "consumerKey",
  "consumerSecret",
  "privateKey",
  "private_key",
  "apiSecret",
  "api_secret",
  "botToken",
  "bot_token",
  "webhookUrl",
  "webhook_url",
  "passwordConfirmation",
  "password_confirmation",
  "idToken",
  "id_token",
  "sessionToken",
  "session_token",
  "mpesaInitiatorPass",
  "pinHash",
  "pin_hash",
  "webhookSecret",
  "webhook_secret",
  "bearer",
  "credentials",
  "proxy-authorization",
  "proxy-authenticate",
  "www-authenticate",
  "pass",
  "session",
  "secret-token",
  "api-token",
];

const DEFAULT_SENSITIVE_KEYS_SET = new Set(
  DEFAULT_SENSITIVE_KEYS.map((key) => key.toLowerCase()),
);

/**
 * Recursively redacts sensitive data from an object.
 *
 * @param data The object to redact sensitive data from.
 * @param sensitiveKeys A list of keys that should be redacted.
 * @returns A new object with sensitive data redacted.
 *
 * @security This utility is critical for preventing accidental exposure of
 * credentials, secrets, and PII in server logs and external monitoring tools.
 * This implementation is case-insensitive and uses a Set for O(1) lookups.
 */
export function redactSensitiveData(
  data: any,
  sensitiveKeys: string[] = DEFAULT_SENSITIVE_KEYS,
  depth = 0,
  maxDepth = 5,
): any {
  // Performance optimization: Use pre-calculated Set if using default keys.
  const sensitiveKeysSet =
    sensitiveKeys === DEFAULT_SENSITIVE_KEYS
      ? DEFAULT_SENSITIVE_KEYS_SET
      : new Set(sensitiveKeys.map((key) => key.toLowerCase()));

  return redactRecursive(data, sensitiveKeysSet, depth, maxDepth);
}

function redactRecursive(
  data: any,
  sensitiveKeysSet: Set<string>,
  depth: number,
  maxDepth: number,
): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (depth > maxDepth) {
    if (Array.isArray(data)) {
      return `[Array(${data.length})]`;
    }
    if (typeof data === "object" && data !== null) {
      return "[Object]";
    }
    return data;
  }

  // Handle Error objects specifically as they have non-enumerable properties
  if (data instanceof Error) {
    const redactedError: any = {
      name: data.name,
      message: data.message,
      stack: data.stack,
    };

    // Capture all other properties (both enumerable and non-enumerable)
    const allProps = Object.getOwnPropertyNames(data);
    for (const key of allProps) {
      if (["name", "message", "stack"].includes(key)) continue;

      if (sensitiveKeysSet.has(key.toLowerCase())) {
        redactedError[key] = "[REDACTED]";
      } else {
        redactedError[key] = redactRecursive(
          (data as any)[key],
          sensitiveKeysSet,
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
      redactRecursive(item, sensitiveKeysSet, depth + 1, maxDepth),
    );
  }

  if (typeof data === "object") {
    const redactedData: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        if (sensitiveKeysSet.has(key.toLowerCase())) {
          redactedData[key] = "[REDACTED]";
        } else {
          redactedData[key] = redactRecursive(
            data[key],
            sensitiveKeysSet,
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