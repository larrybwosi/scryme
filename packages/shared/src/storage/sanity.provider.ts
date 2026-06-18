import { createClient } from "@sanity/client";
import { StorageProvider, StorageUploadResult } from "./types";
import { env } from "@repo/env";

export class SanityStorageProvider implements StorageProvider {
  private getClient() {
    const projectId = env.SANITY_PROJECT_ID;
    const dataset = env.SANITY_DATASET;
    const apiToken = env.SANITY_API_TOKEN;

    if (!projectId || !dataset || !apiToken) {
      throw new Error(
        "Sanity client configuration missing in environment variables.",
      );
    }

    return createClient({
      projectId,
      dataset,
      apiVersion: "1",
      token: apiToken,
      useCdn: false,
    });
  }

  async upload(
    file: Buffer,
    filename: string,
    contentType: string,
    options?: { uploadAsFile?: boolean },
  ): Promise<StorageUploadResult> {
    const client = this.getClient();
    const assetType = options?.uploadAsFile ? "file" : "image";

    const result = await client.assets.upload(assetType, file, {
      filename,
      contentType,
    });

    return {
      url:
        assetType === "file"
          ? result.url
          : `${result.url}?fm=webp&q=75&auto=format`,
      id: result._id,
    };
  }

  async delete(id: string): Promise<void> {
    const client = this.getClient();
    await client.delete(id);
  }

  async getSignedUrl(id: string): Promise<string> {
    // Sanity assets are generally public via their CDN if you have the ID/URL.
    // For "signed" URLs, Sanity has a different mechanism, but for this provider
    // we'll return a proxy-able URL or the original URL.
    // Since our goal is to proxy everything, we might just return the ID or a placeholder.
    return id;
  }
}
