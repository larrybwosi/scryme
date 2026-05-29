import * as Minio from 'minio';
import { StorageProvider, StorageUploadResult } from './types';

export class MinioStorageProvider implements StorageProvider {
  private getClient() {
    const endPoint = process.env.MINIO_ENDPOINT;
    const accessKey = process.env.MINIO_ACCESS_KEY;
    const secretKey = process.env.MINIO_SECRET_KEY;
    const useSSL = process.env.MINIO_USE_SSL === 'true';

    if (!endPoint || !accessKey || !secretKey) {
      throw new Error("Minio configuration missing in environment variables.");
    }

    return new Minio.Client({
      endPoint,
      accessKey,
      secretKey,
      useSSL,
    });
  }

  private getBucketName() {
    return process.env.MINIO_BUCKET || 'dealio-uploads';
  }

  async upload(file: Buffer, filename: string, contentType: string): Promise<StorageUploadResult> {
    const client = this.getClient();
    const bucketName = this.getBucketName();

    // Ensure bucket exists
    const bucketExists = await client.bucketExists(bucketName);
    if (!bucketExists) {
      await client.makeBucket(bucketName);
      // Set policy for public read if needed, or handle signed URLs.
      // For now, let's assume the user handles bucket permissions or we use public policy.
      const policy = {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${bucketName}/*`],
          },
        ],
      };
      await client.setBucketPolicy(bucketName, JSON.stringify(policy));
    }

    await client.putObject(bucketName, filename, file, file.length, {
      'Content-Type': contentType,
    });

    const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
    const endpoint = process.env.MINIO_ENDPOINT;
    const port = process.env.MINIO_PORT ? `:${process.env.MINIO_PORT}` : '';

    // Support custom public URL if provided, otherwise construct from endpoint
    const publicUrlBase = process.env.MINIO_PUBLIC_URL || `${protocol}://${endpoint}${port}`;
    const url = `${publicUrlBase}/${bucketName}/${filename}`;

    return {
      url,
      id: filename,
    };
  }

  async delete(id: string): Promise<void> {
    const client = this.getClient();
    const bucketName = this.getBucketName();
    await client.removeObject(bucketName, id);
  }
}
