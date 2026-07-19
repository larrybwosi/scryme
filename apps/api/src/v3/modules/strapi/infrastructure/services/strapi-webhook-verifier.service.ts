import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import * as crypto from "crypto";

/**
 * StrapiWebhookVerifierService
 *
 * Validates that incoming HTTP requests actually originated from a trusted
 * Strapi instance.  Strapi v4 signs the request body with HMAC-SHA256
 * using the webhook secret configured in Strapi Settings → Webhooks.
 *
 * Strapi sends the signature in the header:
 *   X-Strapi-Signature: <hex-digest>
 *
 * We compare it against our stored webhookSecret using a timing-safe equal.
 */
@Injectable()
export class StrapiWebhookVerifierService {
  private readonly logger = new Logger(StrapiWebhookVerifierService.name);

  /**
   * Verifies the HMAC-SHA256 signature on an incoming Strapi webhook.
   *
   * @param rawBody   The raw (unprocessed) request body Buffer
   * @param signature The value of the X-Strapi-Signature header
   * @param secret    The webhookSecret stored in StrapiConnectionConfig
   * @throws UnauthorizedException if verification fails
   */
  verify(rawBody: Buffer, signature: string | undefined, secret: string): void {
    if (!signature) {
      this.logger.warn("Strapi webhook received without X-Strapi-Signature header");
      throw new UnauthorizedException("Missing X-Strapi-Signature header");
    }

    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    // Use SHA-256 pre-hashing to ensure both buffers have identical length,
    // preventing timing attacks and leakage of the secret signature length.
    const expectedHash = crypto
      .createHash("sha256")
      .update(expected)
      .digest();
    const actualHash = crypto
      .createHash("sha256")
      .update(signature)
      .digest();

    if (!crypto.timingSafeEqual(expectedHash, actualHash)) {
      this.logger.warn(`Strapi webhook signature mismatch. Received: ${signature}`);
      throw new UnauthorizedException("Invalid Strapi webhook signature");
    }
  }

  /**
   * Returns true if the signature is valid without throwing.
   * Useful for logging-only mode (when webhookSecret is not set).
   */
  isValid(rawBody: Buffer, signature: string | undefined, secret: string): boolean {
    try {
      this.verify(rawBody, signature, secret);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generates the expected signature for a payload.
   * Useful for debugging and outbound webhook calls.
   */
  sign(payload: object | string, secret: string): string {
    const body = typeof payload === "string" ? payload : JSON.stringify(payload);
    return crypto.createHmac("sha256", secret).update(body).digest("hex");
  }
}
