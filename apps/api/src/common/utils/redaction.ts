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
    "clientsecret",
    "client_secret",
    "secret",
    "apikey",
    "api_key",
    "access_token",
    "accesstoken",
    "refresh_token",
    "refreshtoken",
    "otp",
    "passcode",
    "cvv",
    "cvc",
    "cardnumber",
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
    "mpesapasskey",
    "cardid",
    "card_id",
    "accountnumber",
    "account_number",
    "secret_key",
    "access_key",
    "client_id",
    "clientid",
    "mpesaconsumerkey",
    "mpesaconsumersecret",
    "consumerkey",
    "consumersecret",
    "privatekey",
    "private_key",
    "apisecret",
    "api_secret",
    "bottoken",
    "bot_token",
    "webhookurl",
    "webhook_url",
    "passwordconfirmation",
    "password_confirmation",
    "idtoken",
    "id_token",
    "sessiontoken",
    "session_token",
    "mpesainitiatorpass",
    "pinhash",
    "pin_hash",
    "webhooksecret",
    "webhook_secret",
    "bearer",
    "credentials",
    "proxy-authorization",
    "proxy-authenticate",
    "www-authenticate",
  ],
  depth = 0,
  maxDepth = 5,
  _lowerSensitiveKeysSet?: Set<string>,
): any {
  if (data === null || data === undefined || depth > maxDepth) {
    return data;
  }

  // Use memoized lowercase keys Set for efficiency during recursion
  const lowerSensitiveKeysSet =
    _lowerSensitiveKeysSet ||
    new Set(sensitiveKeys.map((k) => k.toLowerCase()));

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

      if (lowerSensitiveKeysSet.has(key.toLowerCase())) {
        redactedError[key] = "[REDACTED]";
      } else {
        redactedError[key] = redactSensitiveData(
          (data as any)[key],
          sensitiveKeys,
          depth + 1,
          maxDepth,
          lowerSensitiveKeysSet,
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
      redactSensitiveData(
        item,
        sensitiveKeys,
        depth + 1,
        maxDepth,
        lowerSensitiveKeysSet,
      ),
    );
  }

  if (typeof data === "object") {
    const redactedData: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        if (lowerSensitiveKeysSet.has(key.toLowerCase())) {
          redactedData[key] = "[REDACTED]";
        } else {
          redactedData[key] = redactSensitiveData(
            data[key],
            sensitiveKeys,
            depth + 1,
            maxDepth,
            lowerSensitiveKeysSet,
          );
        }
      }
    }
    return redactedData;
  }

  return data;
}
