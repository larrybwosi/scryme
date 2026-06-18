export interface StorageUploadResult {
  url: string;
  id: string;
}

export interface StorageProvider {
  upload(
    file: Buffer,
    filename: string,
    contentType: string,
    options?: { uploadAsFile?: boolean; encrypt?: boolean; organizationId?: string },
  ): Promise<StorageUploadResult>;
  delete(id: string, organizationId?: string): Promise<void>;
  getSignedUrl?(
    id: string,
    expiresIn?: number,
    organizationId?: string,
  ): Promise<string>;
  startMultipartUpload?(
    filename: string,
    contentType: string,
    organizationId?: string,
  ): Promise<string>;
  uploadPart?(
    filename: string,
    uploadId: string,
    partNumber: number,
    body: Buffer,
    organizationId?: string,
  ): Promise<string>;
  completeMultipartUpload?(
    filename: string,
    uploadId: string,
    parts: { ETag: string; PartNumber: number }[],
    organizationId?: string,
  ): Promise<StorageUploadResult>;
}
