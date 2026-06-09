/**
 * Sensitive fields that should be redacted from logs.
 */
const SENSITIVE_FIELDS = [
  'password',
  'pin',
  'clientSecret',
  'token',
  'secret',
  'accessToken',
  'apiKey',
  'x-api-key',
  'authorization',
];

/**
 * Recursively redacts sensitive fields from an object.
 *
 * @param data The object to redact sensitive fields from.
 * @returns A new object with sensitive fields redacted.
 */
export function redactSensitiveData(data: any): any {
  if (data === null || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item));
  }

  const redacted: any = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_FIELDS.some((field) => lowerKey.includes(field.toLowerCase()))) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = redactSensitiveData(data[key]);
      }
    }
  }

  return redacted;
}
