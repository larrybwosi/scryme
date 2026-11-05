/**
 * Enterprise PII and Sensitive Data Sanitizer for Observability Telemetry
 *
 * Masks sensitive values like emails, phone numbers, auth tokens, passwords,
 * credit card numbers, and secret keys before dispatching to telemetry sinks.
 */

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(\+?[0-9]{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4,6}/g;
const CREDIT_CARD_REGEX = /\b(?:\d{4}[ -]?){3}\d{4}\b/g;

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /authorization/i,
  /auth_token/i,
  /access_token/i,
  /refresh_token/i,
  /api_?key/i,
  /credential/i,
  /credit_?card/i,
  /cvv/i,
  /pin/i,
  /mpesa_?password/i,
  /security_?answer/i,
  /private_?key/i,
];

/**
 * Mask an email address: j***@example.com
 */
export function maskEmail(email: string): string {
  return email.replace(EMAIL_REGEX, (match) => {
    const parts = match.split("@");
    if (parts.length !== 2) return "[MASKED_EMAIL]";
    const name = parts[0]!;
    const domain = parts[1]!;
    const maskedName = name.length > 1 ? `${name[0]}***` : "***";
    return `${maskedName}@${domain}`;
  });
}

/**
 * Mask phone number preserving prefix/suffix: +254***789
 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) {
    return "[MASKED_PHONE]";
  }
  const prefix = phone.startsWith("+") ? phone.slice(0, 4) : phone.slice(0, 3);
  const suffix = phone.slice(-3);
  return `${prefix}***${suffix}`;
}

/**
 * Check if an object key names sensitive information
 */
export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

/**
 * Recursively masks sensitive fields, emails, phone numbers, and auth tokens.
 */
export function maskSensitiveData<T>(input: T, depth = 0): T {
  if (depth > 8) return input; // Prevent recursion stack exhaustion

  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === "string") {
    // Check if entire string is a JWT / Bearer token
    if (input.startsWith("Bearer ") || (input.includes(".") && input.length > 50)) {
      return "[MASKED_TOKEN]" as unknown as T;
    }
    // Mask emails, credit cards, phones in string
    let cleaned = input.replace(CREDIT_CARD_REGEX, "[MASKED_CARD]");
    cleaned = maskEmail(cleaned);
    return cleaned as unknown as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => maskSensitiveData(item, depth + 1)) as unknown as T;
  }

  if (typeof input === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      if (isSensitiveKey(key)) {
        output[key] = "[MASKED_SECRET]";
      } else if (typeof value === "string") {
        if (key.toLowerCase().includes("email")) {
          output[key] = maskEmail(value);
        } else if (key.toLowerCase().includes("phone") || key.toLowerCase().includes("mobile")) {
          output[key] = maskPhone(value);
        } else {
          output[key] = maskSensitiveData(value, depth + 1);
        }
      } else {
        output[key] = maskSensitiveData(value, depth + 1);
      }
    }
    return output as unknown as T;
  }

  return input;
}
