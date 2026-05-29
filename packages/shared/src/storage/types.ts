export interface StorageUploadResult {
  url: string;
  id: string;
}

export interface StorageProvider {
  upload(file: Buffer, filename: string, contentType: string, options?: { uploadAsFile?: boolean }): Promise<StorageUploadResult>;
  delete(id: string): Promise<void>;
}
