import crypto from 'crypto';

/**
 * Perform a timing-safe match between a plaintext value and a hashed/stored value.
 * To prevent length leakage, both inputs are hashed with SHA-256 before comparison.
 *
 * @param plaintext The secret provided by the user/client
 * @param stored The expected value (should be a hash or encrypted value)
 */
export function timingSafeMatch(plaintext: string, stored: string): boolean {
  const expectedHash = crypto.createHash('sha256').update(stored).digest();
  const actualHash = crypto.createHash('sha256').update(plaintext).digest();

  if (expectedHash.length !== actualHash.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedHash, actualHash);
}

/**
 * Perform a timing-safe match for a bearer token.
 */
export function timingSafeBearerMatch(token: string, expected: string): boolean {
  return timingSafeMatch(token, expected);
}
