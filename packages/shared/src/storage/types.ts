export interface StorageUploadResult {
  url: string;
  id: string;
}

export interface StorageProvider {
  upload(
    file: Buffer,
    filename: string,
    contentType: string,
    options?: { uploadAsFile?: boolean; encrypt?: boolean },
  ): Promise<StorageUploadResult>;
  delete(id: string): Promise<void>;
  getSignedUrl?(id: string, expiresIn?: number): Promise<string>;
  startMultipartUpload?(filename: string, contentType: string): Promise<string>;
  uploadPart?(
    filename: string,
    uploadId: string,
    partNumber: number,
    body: Buffer,
  ): Promise<string>;
  completeMultipartUpload?(
    filename: string,
    uploadId: string,
    parts: { ETag: string; PartNumber: number }[],
  ): Promise<StorageUploadResult>;
}
