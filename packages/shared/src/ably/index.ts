import { Rest } from "ably";

// Lazily-initialised singleton — the guard runs at call-time (inside a request
// handler) rather than at module-evaluation time so the build never throws even
// when ABLY_API_KEY is absent from the build environment.
let _ably: Rest | null = null;

function getAbly(): Rest {
  if (_ably) return _ably;

  const key = process.env.ABLY_API_KEY;
  if (!key) {
    throw new Error("Missing ABLY_API_KEY environment variable");
  }

  _ably = new Rest({ key, logLevel: 0 });
  return _ably;
}

/**
 * REST client for server-side operations (e.g., in API routes).
 * This uses the full API key and should only be used on the server.
 *
 * Access via `ably` which is a Proxy that lazily initialises the REST client
 * on first property access, keeping module-level evaluation side-effect free.
 */
export const ably = new Proxy({} as Rest, {
  get(_target, prop) {
    return (getAbly() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
