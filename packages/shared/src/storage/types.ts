export interface StorageUploadResult {
  url: string;
  id: string;
}

export interface StorageProvider {
  upload(
    file: Buffer,
    filename: string,
    contentType: string,
    options?: { uploadAsFile?: boolean; organizationId?: string },
  ): Promise<StorageUploadResult>;
  delete(id: string, organizationId?: string): Promise<void>;
}
