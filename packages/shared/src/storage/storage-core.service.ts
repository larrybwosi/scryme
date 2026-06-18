import { generateShortCode } from "../utils";
import { env } from "@repo/env";

export class StorageCoreService {
  /**
   * Generates a unique short code and full short URL for an attachment.
   */
  static generateShortUrlInfo(shortCodeOverride?: string) {
    const shortCode = shortCodeOverride || generateShortCode();
    const shortUrl = `${env.NEXT_PUBLIC_API_URL}/s/${shortCode}`;
    return { shortCode, shortUrl };
  }

  /**
   * Generates a unique filename for storage.
   */
  static generateStorageFileName(originalName: string, uuid: string) {
    const fileExtension =
      originalName
        .split(".")
        .pop()
        ?.replace(/[^a-zA-Z0-9]/g, "") || "bin";
    return `${uuid}.${fileExtension}`;
  }
}
