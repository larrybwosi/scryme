import { createClient } from 'next-sanity';
import { StorageProvider, StorageUploadResult } from './types';

export class SanityStorageProvider implements StorageProvider {
  private getClient() {
    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID;
    const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET;
    const apiToken = process.env.SANITY_API_TOKEN;

    if (!projectId || !dataset || !apiToken) {
      throw new Error("Sanity client configuration missing in environment variables.");
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
    options?: { uploadAsFile?: boolean; organizationId?: string },
  ): Promise<StorageUploadResult> {
    const client = this.getClient();
    const assetType = options?.uploadAsFile ? 'file' : 'image';

    const result = await client.assets.upload(assetType, file, {
      filename,
      contentType,
    });

    return {
      url: assetType === 'file' ? result.url : `${result.url}?fm=webp&q=75&auto=format`,
      id: result._id,
    };
  }

  async delete(id: string, _organizationId?: string): Promise<void> {
    const client = this.getClient();
    await client.delete(id);
  }
}
