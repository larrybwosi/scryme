/**
 * Exponential Backoff with Jitter for Enterprise Retries
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
}

export const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 250,
  maxDelayMs: 5000,
  backoffFactor: 2,
};

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

export function isRetryableStatus(status: number): boolean {
  return RETRYABLE_STATUS_CODES.has(status);
}

export function isTransientError(error: unknown): boolean {
  if (!error) return false;
  if (typeof error === "object" && "status" in error && typeof (error as any).status === "number") {
    return isRetryableStatus((error as any).status);
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("fetch failed") ||
      msg.includes("network") ||
      msg.includes("econnreset") ||
      msg.includes("etimedout") ||
      msg.includes("socket") ||
      error.name === "AbortError"
    );
  }
  return false;
}

/**
 * Calculates exponential backoff with full jitter (decorrelated).
 */
export function calculateRetryDelay(
  attempt: number,
  options: Required<RetryOptions>,
  retryAfterHeaderSeconds?: number
): number {
  if (retryAfterHeaderSeconds !== undefined && retryAfterHeaderSeconds > 0) {
    return Math.min(retryAfterHeaderSeconds * 1000, options.maxDelayMs);
  }

  const baseDelay = options.initialDelayMs * Math.pow(options.backoffFactor, attempt);
  const cappedDelay = Math.min(baseDelay, options.maxDelayMs);
  // Full jitter: uniformly distributed between 0 and cappedDelay
  return Math.floor(Math.random() * cappedDelay);
}

export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      return reject(new Error("Request aborted during retry backoff"));
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      reject(new Error("Request aborted during retry backoff"));
    };

    signal?.addEventListener("abort", onAbort);
  });
}
