import { StorageProvider } from "./types";
import { SanityStorageProvider } from "./sanity.provider";
import { RustfsStorageProvider } from "./rustfs.provider";
import { env } from "@repo/env";

export class StorageService implements StorageProvider {
  private provider: StorageProvider;

  constructor() {
    const providerType = env.STORAGE_PROVIDER || "sanity";

    if (providerType === "rustfs") {
      this.provider = new RustfsStorageProvider();
    } else {
      this.provider = new SanityStorageProvider();
    }
  }

  async upload(
    file: Buffer,
    filename: string,
    contentType: string,
    options?: {
      uploadAsFile?: boolean;
      encrypt?: boolean;
      organizationId?: string;
    },
  ) {
    // Ensure dealio- prefix as requested
    const finalFilename = filename.startsWith("dealio-")
      ? filename
      : `dealio-${filename}`;
    return this.provider.upload(file, finalFilename, contentType, options);
  }

  async delete(id: string, organizationId?: string) {
    return this.provider.delete(id, organizationId);
  }

  async getSignedUrl(id: string, expiresIn?: number, organizationId?: string) {
    if (this.provider.getSignedUrl) {
      return this.provider.getSignedUrl(id, expiresIn, organizationId);
    }
    throw new Error(
      "Signed URLs are not supported by the current storage provider",
    );
  }

  async startMultipartUpload(
    filename: string,
    contentType: string,
    organizationId?: string,
  ) {
    if (this.provider.startMultipartUpload) {
      return this.provider.startMultipartUpload(
        filename,
        contentType,
        organizationId,
      );
    }
    throw new Error(
      "Multipart uploads are not supported by the current storage provider",
    );
  }

  async uploadPart(
    filename: string,
    uploadId: string,
    partNumber: number,
    body: Buffer,
    organizationId?: string,
  ) {
    if (this.provider.uploadPart) {
      return this.provider.uploadPart(
        filename,
        uploadId,
        partNumber,
        body,
        organizationId,
      );
    }
    throw new Error(
      "Multipart uploads are not supported by the current storage provider",
    );
  }

  async completeMultipartUpload(
    filename: string,
    uploadId: string,
    parts: { ETag: string; PartNumber: number }[],
    organizationId?: string,
  ) {
    if (this.provider.completeMultipartUpload) {
      return this.provider.completeMultipartUpload(
        filename,
        uploadId,
        parts,
        organizationId,
      );
    }
    throw new Error(
      "Multipart uploads are not supported by the current storage provider",
    );
  }
}

export const storageService = new StorageService();
