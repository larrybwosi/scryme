import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { StorageProvider, StorageUploadResult } from "./types";

export class RustfsStorageProvider implements StorageProvider {
  private getClient() {
    const endPoint = process.env.RUSTFS_ENDPOINT;
    const accessKeyId = process.env.RUSTFS_ACCESS_KEY;
    const secretAccessKey = process.env.RUSTFS_SECRET_KEY;
    const region = process.env.RUSTFS_REGION || "us-east-1";
    const forcePathStyle = process.env.RUSTFS_FORCE_PATH_STYLE !== "false";

    if (!endPoint || !accessKeyId || !secretAccessKey) {
      throw new Error("RustFS configuration missing in environment variables.");
    }

    return new S3Client({
      endpoint: endPoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      region,
      forcePathStyle,
    });
  }

  private getBucketName() {
    return process.env.RUSTFS_BUCKET || "dealio-uploads";
  }

  async upload(
    file: Buffer,
    filename: string,
    contentType: string,
    options?: { uploadAsFile?: boolean; encrypt?: boolean },
  ): Promise<StorageUploadResult> {
    const client = this.getClient();
    const bucketName = this.getBucketName();

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: filename,
      Body: file,
      ContentType: contentType,
      ServerSideEncryption: options?.encrypt ? "AES256" : undefined,
    });

    await client.send(command);

    const publicUrlBase =
      process.env.RUSTFS_PUBLIC_URL || process.env.RUSTFS_ENDPOINT;
    const url = `${publicUrlBase}/${bucketName}/${filename}`;

    return {
      url,
      id: filename,
    };
  }

  async delete(id: string): Promise<void> {
    const client = this.getClient();
    const bucketName = this.getBucketName();

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: id,
    });

    await client.send(command);
  }

  async getSignedUrl(id: string, expiresIn = 3600): Promise<string> {
    const client = this.getClient();
    const bucketName = this.getBucketName();

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: id,
    });

    return getSignedUrl(client, command, { expiresIn });
  }

  async startMultipartUpload(
    filename: string,
    contentType: string,
  ): Promise<string> {
    const client = this.getClient();
    const bucketName = this.getBucketName();

    const command = new CreateMultipartUploadCommand({
      Bucket: bucketName,
      Key: filename,
      ContentType: contentType,
    });

    const result = await client.send(command);
    return result.UploadId!;
  }

  async uploadPart(
    filename: string,
    uploadId: string,
    partNumber: number,
    body: Buffer,
  ): Promise<string> {
    const client = this.getClient();
    const bucketName = this.getBucketName();

    const command = new UploadPartCommand({
      Bucket: bucketName,
      Key: filename,
      UploadId: uploadId,
      PartNumber: partNumber,
      Body: body,
    });

    const result = await client.send(command);
    return result.ETag!;
  }

  async completeMultipartUpload(
    filename: string,
    uploadId: string,
    parts: { ETag: string; PartNumber: number }[],
  ): Promise<StorageUploadResult> {
    const client = this.getClient();
    const bucketName = this.getBucketName();

    const command = new CompleteMultipartUploadCommand({
      Bucket: bucketName,
      Key: filename,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts,
      },
    });

    await client.send(command);

    const publicUrlBase =
      process.env.RUSTFS_PUBLIC_URL || process.env.RUSTFS_ENDPOINT;
    const url = `${publicUrlBase}/${bucketName}/${filename}`;

    return {
      url,
      id: filename,
    };
  }
}
