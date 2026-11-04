/**
 * Timing-safe HMAC Webhook Signature Verification
 * Works in Node.js, Cloudflare Workers, Edge Runtime, Bun, Deno, and modern browsers.
 */

import { ScrymeError } from "./errors";

export class WebhookVerificationError extends ScrymeError {
  constructor(message: string) {
    super(message);
    this.name = "WebhookVerificationError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Constant-time byte equality check to prevent timing attacks.
 */
export function timingSafeEqualBuffers(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let c = 0;
  for (let i = 0; i < a.length; i++) {
    c |= a[i] ^ b[i];
  }
  return c === 0;
}

/**
 * Computes an HMAC-SHA256 hex string using Node crypto or Web Crypto API.
 */
export async function computeHmacSha256(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const keyData = enc.encode(secret);
  const msgData = enc.encode(payload);

  if (typeof globalThis !== "undefined" && globalThis.crypto && globalThis.crypto.subtle) {
    const cryptoKey = await globalThis.crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBuffer = await globalThis.crypto.subtle.sign("HMAC", cryptoKey, msgData);
    const bytes = new Uint8Array(signatureBuffer);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  // Fallback to Node.js crypto if crypto.subtle is not present
  try {
    const nodeCrypto = await import("crypto");
    return nodeCrypto.createHmac("sha256", secret).update(payload).digest("hex");
  } catch (e) {
    throw new WebhookVerificationError("No cryptographic provider found for HMAC computation");
  }
}

export interface WebhookHeaderComponents {
  timestamp: number;
  signature: string;
}

/**
 * Parses header like `t=1620000000,v1=abcdef...` or raw hex signature.
 */
export function parseWebhookHeader(header: string): WebhookHeaderComponents {
  const parts = header.split(",");
  let timestamp = 0;
  let signature = "";

  for (const part of parts) {
    const [k, v] = part.trim().split("=");
    if (k === "t" && v) {
      timestamp = parseInt(v, 10);
    } else if (k === "v1" && v) {
      signature = v;
    }
  }

  if (!signature && parts.length === 1 && !header.includes("=")) {
    signature = header.trim();
  }

  return { timestamp, signature };
}

/**
 * Verifies a webhook signature using timing-safe comparisons and tolerance checks.
 */
export async function verifyWebhookSignature(
  rawBody: string | Uint8Array,
  signatureHeader: string,
  secret: string,
  toleranceSeconds: number = 300
): Promise<boolean> {
  if (!rawBody || !signatureHeader || !secret) {
    throw new WebhookVerificationError("Missing required parameters for webhook verification");
  }

  const bodyStr = typeof rawBody === "string" ? rawBody : new TextDecoder().decode(rawBody);
  const { timestamp, signature } = parseWebhookHeader(signatureHeader);

  if (!signature) {
    throw new WebhookVerificationError("Unable to extract signature from header");
  }

  if (timestamp > 0) {
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSeconds - timestamp) > toleranceSeconds) {
      throw new WebhookVerificationError(
        `Webhook timestamp expired. Current: ${nowSeconds}, Header: ${timestamp}, Tolerance: ${toleranceSeconds}s`
      );
    }
  }

  const payloadToSign = timestamp > 0 ? `${timestamp}.${bodyStr}` : bodyStr;
  const computedHex = await computeHmacSha256(payloadToSign, secret);

  const enc = new TextEncoder();
  const computedBytes = enc.encode(computedHex.toLowerCase());
  const signatureBytes = enc.encode(signature.toLowerCase());

  const isValid = timingSafeEqualBuffers(computedBytes, signatureBytes);
  if (!isValid) {
    throw new WebhookVerificationError("Webhook signature mismatch");
  }

  return true;
}
