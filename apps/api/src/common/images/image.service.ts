import { Injectable, Logger } from "@nestjs/common";
import { storageService } from "@repo/shared/storage";
import { optimizeImage } from "@repo/shared/server";
import axios from "axios";
import { RedisService } from "../../redis/redis.service";
import crypto from "crypto";

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);
  private readonly IMAGE_CACHE_TTL = 86400 * 7; // 7 days

  constructor(private readonly redis: RedisService) {}

  async optimizeImage(
    id: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: string;
      organizationId?: string;
    },
  ) {
    const cacheKey = this.generateCacheKey(id, options);

    try {
      const contentTypeCacheKey = `${cacheKey}:type`;
      const [cachedData, cachedContentType] = await Promise.all([
        this.redis.getBuffer(cacheKey),
        this.redis.get<string>(contentTypeCacheKey),
      ]);

      if (cachedData && cachedContentType) {
        return {
          data: cachedData,
          contentType: cachedContentType,
        };
      }

      const providerType = process.env.STORAGE_PROVIDER || "sanity";
      let imageBuffer: Buffer;
      let contentType: string;

      if (providerType === "sanity") {
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
        const response = await axios.get(originalUrl, {
          responseType: "arraybuffer",
          timeout: 5000,
          maxContentLength: 10 * 1024 * 1024, // 10MB limit
        });
        if (!response.data) throw new Error("No data received from upstream");
        imageBuffer = Buffer.from(response.data);
        contentType = response.headers["content-type"] as string;
      } else {
        // RustFS / S3
        const url = await storageService.getSignedUrl(
          id,
          60,
          options.organizationId,
        );
        const response = await axios.get(url, {
          responseType: "arraybuffer",
          timeout: 5000,
          maxContentLength: 10 * 1024 * 1024,
        });
        if (!response.data) throw new Error("No data received from upstream");
        imageBuffer = Buffer.from(response.data);
        contentType = response.headers["content-type"] as string;
      }

      const format = (options.format || "webp") as any;
      const quality = options.quality || 75;

      const { data, info } = await optimizeImage(imageBuffer, {
        width: options.width,
        height: options.height,
        quality,
        format,
      });

      const resultContentType = `image/${info.format}`;

      // Cache the optimized image data and its content type separately
      // Using buffer for data to avoid base64 overhead
      await Promise.all([
        this.redis.setex(cacheKey, this.IMAGE_CACHE_TTL, data),
        this.redis.setex(
          `${cacheKey}:type`,
          this.IMAGE_CACHE_TTL,
          resultContentType,
        ),
      ]);

      return {
        data,
        contentType: resultContentType,
      };
    } catch (error) {
      this.logger.error(`Error optimizing image ${id}: ${error.message}`);
      throw error;
    }
  }

  private generateCacheKey(id: string, options: any): string {
    const optionsString = JSON.stringify({
      w: options.width,
      h: options.height,
      q: options.quality,
      fm: options.format,
    });
    const hash = crypto.createHash("md5").update(optionsString).digest("hex");
    return `opt_img:${id}:${hash}`;
  }

  private async getOriginalUrl(
    id: string,
    organizationId?: string,
  ): Promise<string> {
    const providerType = process.env.STORAGE_PROVIDER || "sanity";
    if (providerType === "sanity") {
      // Construction logic for Sanity CDN URL if ID is provided
      // Typical Sanity asset ID: image-02983740298374-1200x800-jpg
      const SANITY_ASSET_ID_REGEX = /^image-[a-fA-F0-9]+-\d+x\d+-[a-z0-9]+$/i;
      if (!SANITY_ASSET_ID_REGEX.test(id)) {
        throw new Error("Invalid Sanity asset ID format");
      }

      const parts = id.split("-");
      const assetId = parts[1];
      const dimensions = parts[2];
      const extension = parts[3];

      const projectId =
        process.env.SANITY_PROJECT_ID ||
        process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
      const dataset =
        process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET;
      return `https://cdn.sanity.io/images/${projectId}/${dataset}/${assetId}-${dimensions}.${extension}`;
    } else {
      return await storageService.getSignedUrl(id, 60, organizationId);
    }
  }
}
