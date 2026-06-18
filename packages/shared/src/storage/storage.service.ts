import { StorageProvider } from "./types";
import { SanityStorageProvider } from "./sanity.provider";
import { RustfsStorageProvider } from "./rustfs.provider";
import { env } from "@repo/env";

export class StorageService implements StorageProvider {
  private provider: StorageProvider;

  constructor() {
    const providerType = env.STORAGE_PROVIDER || "sanity";
    console.log("STORAGE, :", providerType);

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
    options?: { uploadAsFile?: boolean; encrypt?: boolean },
  ) {
    // Ensure dealio- prefix as requested
    const finalFilename = filename.startsWith("dealio-")
      ? filename
      : `dealio-${filename}`;
    return this.provider.upload(file, finalFilename, contentType, options);
  }

  async delete(id: string) {
    return this.provider.delete(id);
  }

  async getSignedUrl(id: string, expiresIn?: number) {
    if (this.provider.getSignedUrl) {
      return this.provider.getSignedUrl(id, expiresIn);
    }
    throw new Error(
      "Signed URLs are not supported by the current storage provider",
    );
  }

  async startMultipartUpload(filename: string, contentType: string) {
    if (this.provider.startMultipartUpload) {
      return this.provider.startMultipartUpload(filename, contentType);
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
  ) {
    if (this.provider.uploadPart) {
      return this.provider.uploadPart(filename, uploadId, partNumber, body);
    }
    throw new Error(
      "Multipart uploads are not supported by the current storage provider",
    );
  }

  async completeMultipartUpload(
    filename: string,
    uploadId: string,
    parts: { ETag: string; PartNumber: number }[],
  ) {
    if (this.provider.completeMultipartUpload) {
      return this.provider.completeMultipartUpload(filename, uploadId, parts);
    }
    throw new Error(
      "Multipart uploads are not supported by the current storage provider",
    );
  }
}

export const storageService = new StorageService();
