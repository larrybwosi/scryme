import { Injectable, Logger } from '@nestjs/common';
import { storageService } from '@repo/shared/storage';
import sharp from 'sharp';
import axios from 'axios';

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);

  async optimizeImage(id: string, options: { width?: number; height?: number; quality?: number; format?: string }) {
    try {
      const providerType = process.env.STORAGE_PROVIDER || 'sanity';
      let imageBuffer: Buffer;
      let contentType: string;

      if (providerType === 'sanity') {
        // For Sanity, we can either proxy their CDN or fetch the original.
        // Sanity original URLs usually look like: https://cdn.sanity.io/images/PROJECT_ID/DATASET/ASSET_ID.EXTENSION
        // But since we have the ID, we might need more info to construct the URL if we don't have it.
        // However, if the ID is already a full URL or we can get the URL from the provider...
        // For simplicity, let's assume we fetch the original from the provider.
        // Actually, Sanity's `upload` returns an ID like `image-ASSET_ID-WIDTHxHEIGHT-EXTENSION`.

        // If we want to mimic Sanity's on-the-fly optimization for RustFS, we should focus on RustFS.
        // For Sanity, the user should probably just use Sanity's CDN directly.
        // But if they go through our API:
        const originalUrl = await this.getOriginalUrl(id);
        const response = await axios.get(originalUrl, { responseType: 'arraybuffer' });
        imageBuffer = Buffer.from(response.data);
        contentType = response.headers['content-type'] as string;
      } else {
        // RustFS / S3
        const url = await storageService.getSignedUrl(id, 60);
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        imageBuffer = Buffer.from(response.data);
        contentType = response.headers['content-type'] as string;
      }

      let transformer = sharp(imageBuffer);

      if (options.width || options.height) {
        transformer = transformer.resize({
          width: options.width,
          height: options.height,
          fit: 'cover',
        });
      }

      const format = (options.format || 'webp') as keyof sharp.FormatEnum;
      const quality = options.quality || 75;

      if (format === 'webp') {
        transformer = transformer.webp({ quality });
      } else if (format === 'jpeg' || (format as string) === 'jpg') {
        transformer = transformer.jpeg({ quality });
      } else if (format === 'png') {
        transformer = transformer.png({ quality });
      }

      const { data, info } = await transformer.toBuffer({ resolveWithObject: true });

      return {
        data,
        contentType: `image/${info.format}`,
      };
    } catch (error) {
      this.logger.error(`Error optimizing image ${id}: ${error.message}`);
      throw error;
    }
  }

  private async getOriginalUrl(id: string): Promise<string> {
    const providerType = process.env.STORAGE_PROVIDER || 'sanity';
    if (providerType === 'sanity') {
      // Construction logic for Sanity CDN URL if ID is provided
      // Typical Sanity asset ID: image-02983740298374-1200x800-jpg
      const parts = id.split('-');
      if (parts.length >= 4) {
        const assetId = parts[1];
        const dimensions = parts[2];
        const extension = parts[3];
        const projectId = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
        const dataset = process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET;
        return `https://cdn.sanity.io/images/${projectId}/${dataset}/${assetId}-${dimensions}.${extension}`;
      }
      return id; // Assume it's a URL if it doesn't match the pattern
    } else {
       return await storageService.getSignedUrl(id, 60);
    }
  }
}
