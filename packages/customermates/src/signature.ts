import crypto from "node:crypto";

export function computeWebhookSignature(secret: string, rawBody: string | Buffer): string {
  return crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
}

export function verifyWebhookSignature(
  signature: string | undefined | null,
  rawBody: string | Buffer,
  secrets: Array<string | undefined | null>,
): boolean {
  if (!signature || !secrets.length) return false;

  const received = String(signature).trim().toLowerCase().replace(/^sha256=/, "");
  if (!/^[0-9a-f]{64}$/.test(received)) return false;

  const receivedBuffer = Buffer.from(received, "hex");
  const candidates = secrets.filter((secret): secret is string => !!secret);
  if (!candidates.length) return false;

  return candidates.some((secret) => {
    const expectedBuffer = Buffer.from(computeWebhookSignature(secret, rawBody), "hex");
    if (expectedBuffer.length !== receivedBuffer.length) return false;
    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
  });
}
