/**
 * Recursively redacts sensitive data from an object.
 *
 * @param data The object to redact sensitive data from.
 * @param sensitiveKeys A list of keys that should be redacted.
 * @returns A new object with sensitive data redacted.
 */
export function redactSensitiveData(
  data: any,
  sensitiveKeys: string[] = [
    'password',
    'pin',
    'token',
    'clientSecret',
    'client_secret',
    'secret',
    'apiKey',
    'api_key',
    'access_token',
    'refresh_token',
    'otp',
    'passcode',
    'cvv',
  ],
): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item, sensitiveKeys));
  }

  if (typeof data === 'object') {
    const redactedData: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        if (sensitiveKeys.includes(key)) {
          redactedData[key] = '[REDACTED]';
        } else {
          redactedData[key] = redactSensitiveData(data[key], sensitiveKeys);
        }
      }
    }
    return redactedData;
  }

  return data;
}
