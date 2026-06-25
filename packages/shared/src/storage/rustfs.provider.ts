import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  GetObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { StorageProvider, StorageUploadResult } from "./types";
import { env } from "@repo/env";

export class RustfsStorageProvider implements StorageProvider {
  private getClient() {
    const endPoint = env.RUSTFS_ENDPOINT;
    const accessKeyId = env.RUSTFS_ACCESS_KEY;
    const secretAccessKey = env.RUSTFS_SECRET_KEY;
    const region = env.RUSTFS_REGION || "us-east-1";
    const forcePathStyle = env.RUSTFS_FORCE_PATH_STYLE;

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

  private getBucketName(organizationId?: string) {
    if (organizationId) {
      const bucketName = `dealio-org-${organizationId.toLowerCase()}`;
      return bucketName;
    }
    return env.RUSTFS_BUCKET || "dealio-uploads";
  }

  private async ensureBucketExists(client: S3Client, bucketName: string) {
    try {
      await client.send(new HeadBucketCommand({ Bucket: bucketName }));
    } catch (error: any) {
      if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
        await client.send(new CreateBucketCommand({ Bucket: bucketName }));
      } else {
        throw error;
      }
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
  ): Promise<StorageUploadResult> {
    const client = this.getClient();
    const bucketName = this.getBucketName(options?.organizationId);

    if (options?.organizationId) {
      console.log(
        `[RustfsStorageProvider] Uploading to organization bucket: ${bucketName}`,
      );
      await this.ensureBucketExists(client, bucketName);
    }

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: filename,
      Body: file,
      ContentType: contentType,
      ServerSideEncryption: options?.encrypt ? "AES256" : undefined,
    });

    await client.send(command);

    const publicUrlBase = env.RUSTFS_PUBLIC_URL || env.RUSTFS_ENDPOINT;
    const url = `${publicUrlBase}/${bucketName}/${filename}`;

    return {
      url,
      id: filename,
    };
  }

  async delete(id: string, organizationId?: string): Promise<void> {
    const client = this.getClient();
    const bucketName = this.getBucketName(organizationId);

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: id,
    });

    await client.send(command);
  }

  async getSignedUrl(
    id: string,
    expiresIn = 3600,
    organizationId?: string,
  ): Promise<string> {
    const client = this.getClient();
    const bucketName = this.getBucketName(organizationId);

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: id,
    });

    return getSignedUrl(client, command, { expiresIn });
  }

  async startMultipartUpload(
    filename: string,
    contentType: string,
    organizationId?: string,
  ): Promise<string> {
    const client = this.getClient();
    const bucketName = this.getBucketName(organizationId);

    if (organizationId) {
      await this.ensureBucketExists(client, bucketName);
    }

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
    organizationId?: string,
  ): Promise<string> {
    const client = this.getClient();
    const bucketName = this.getBucketName(organizationId);

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
    organizationId?: string,
  ): Promise<StorageUploadResult> {
    const client = this.getClient();
    const bucketName = this.getBucketName(organizationId);

    const command = new CompleteMultipartUploadCommand({
      Bucket: bucketName,
      Key: filename,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts,
      },
    });

    await client.send(command);

    const publicUrlBase = env.RUSTFS_PUBLIC_URL || env.RUSTFS_ENDPOINT;
    const url = `${publicUrlBase}/${bucketName}/${filename}`;

    return {
      url,
      id: filename,
    };
  }
}
