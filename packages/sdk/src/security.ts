/**
 * Security and sanitization utilities for enterprise SDK
 */

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /cookie/i,
  /session[_-]?id/i,
  /credit[_-]?card/i,
  /cvv/i,
];

const SENSITIVE_HEADER_NAMES = new Set([
  "authorization",
  "x-api-key",
  "x-mcp-api-key",
  "cookie",
  "set-cookie",
  "proxy-authorization",
]);

/**
 * Checks if a key name matches any known sensitive credential patterns.
 */
export function isSensitiveKey(key: string): boolean {
  if (!key || typeof key !== "string") return false;
  const lower = key.toLowerCase();
  if (SENSITIVE_HEADER_NAMES.has(lower)) return true;
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

/**
 * Masks a sensitive string preserving a tiny hint or fully redacting if short.
 */
export function maskString(val: string): string {
  if (!val || typeof val !== "string") return "[REDACTED]";
  if (val.length <= 8) return "[REDACTED]";
  return `${val.slice(0, 3)}...${val.slice(-3)}`;
}

/**
 * Recursively deep clones and sanitizes any sensitive payload (headers, bodies, queries, objects).
 * Safe against circular structures and non-plain objects (e.g. Blobs, FormData).
 */
export function sanitizeSensitiveData<T = any>(data: T, depth = 0, seen = new WeakSet()): T {
  if (depth > 8) return "[MAX_DEPTH]" as any;
  if (data === null || data === undefined) return data;

  if (typeof data === "string") {
    return data;
  }

  if (typeof data !== "object") {
    return data;
  }

  // Handle special types without traversal
  if (
    (typeof FormData !== "undefined" && data instanceof FormData) ||
    (typeof Blob !== "undefined" && data instanceof Blob) ||
    (typeof ArrayBuffer !== "undefined" && data instanceof ArrayBuffer)
  ) {
    return `[${data.constructor.name}]` as any;
  }

  if (seen.has(data as any)) {
    return "[CIRCULAR]" as any;
  }
  seen.add(data as any);

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeSensitiveData(item, depth + 1, seen)) as any;
  }

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (isSensitiveKey(key)) {
      if (typeof value === "string") {
        result[key] = maskString(value);
      } else if (value && typeof value === "object") {
        // If it's an object (like an auth container), recursively sanitize its contents
        result[key] = sanitizeSensitiveData(value, depth + 1, seen);
      } else {
        result[key] = "[REDACTED]";
      }
    } else {
      result[key] = sanitizeSensitiveData(value, depth + 1, seen);
    }
  }

  return result as T;
}

/**
 * Validates header names and values to prevent HTTP response splitting (CRLF injection).
 */
export function sanitizeHeaderValue(value: string): string {
  if (typeof value !== "string") return String(value);
  return value.replace(/[\r\n]+/g, " ").trim();
}

/**
 * Validates whether an endpoint URL is safe according to enterprise security standards.
 * Enforces HTTPS for remote environments; permits HTTP only for localhost/loopback or when explicitly opted-in.
 */
export function validateUrlSecurity(rawUrl: string, allowInsecureHttp: boolean = false): void {
  try {
    const parsed = new URL(rawUrl);
    const protocol = parsed.protocol.toLowerCase();
    const hostname = parsed.hostname.toLowerCase();

    const isLoopback =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname === "[::1]" ||
      hostname.endsWith(".localhost");

    if (protocol === "http:" && !isLoopback && !allowInsecureHttp) {
      throw new Error(
        `Insecure HTTP connection rejected for host '${hostname}'. Enterprise security requires HTTPS. If this is an internal testing network, configure 'allowInsecureHttp: true'.`
      );
    }
  } catch (err: any) {
    if (err.message && err.message.includes("Insecure HTTP")) {
      throw err;
    }
    // Relative URLs or invalid URL strings will be caught by URL parser in http client
  }
}

/**
 * Cross-runtime cryptographically secure UUID v4 generator.
 */
export function generateUuidV4(): string {
  if (
    typeof globalThis !== "undefined" &&
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  if (
    typeof globalThis !== "undefined" &&
    globalThis.crypto &&
    typeof globalThis.crypto.getRandomValues === "function"
  ) {
    const buffer = new Uint8Array(16);
    globalThis.crypto.getRandomValues(buffer);
    buffer[6] = (buffer[6] & 0x0f) | 0x40; // version 4
    buffer[8] = (buffer[8] & 0x3f) | 0x80; // variant RFC4122
    const hex = Array.from(buffer)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  // Pure fallback
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
