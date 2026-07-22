import crypto from "crypto";

/**
 * Perform a timing-safe match between a plaintext value and a hashed/stored value.
 * To prevent length leakage, both inputs are hashed with SHA-256 before comparison.
 *
 * @security Added robust type-checking to prevent unhandled TypeError exceptions
 * (e.g. from undefined, null, or non-string inputs) and ensure secure fail-closed behavior.
 *
 * @param plaintext The secret provided by the user/client
 * @param stored The expected value (should be a hash or encrypted value)
 */
export function timingSafeMatch(
  plaintext: string | undefined | null,
  stored: string | undefined | null,
): boolean {
  if (typeof plaintext !== "string" || typeof stored !== "string") {
    return false;
  }

  const expectedHash = crypto.createHash("sha256").update(stored).digest();
  const actualHash = crypto.createHash("sha256").update(plaintext).digest();

  if (expectedHash.length !== actualHash.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedHash, actualHash);
}

/**
 * Perform a timing-safe match for a bearer token.
 */
export function timingSafeBearerMatch(
  token: string | undefined | null,
  expected: string | undefined | null,
): boolean {
  return timingSafeMatch(token, expected);
}
