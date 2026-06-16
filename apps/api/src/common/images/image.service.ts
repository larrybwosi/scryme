import {Injectable, Logger, BadRequestException} from "@nestjs/common";
import {storageService} from "@repo/shared/server";
import sharp from "sharp";
import axios from "axios";

const SANITY_ASSET_ID_REGEX = /^image-[a-fA-F0-9]+-\d+x\d+-[a-z0-9]+$/i;

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);

  async optimizeImage(
    id: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: string;
    },
  ) {
    try {
      const providerType = process.env.STORAGE_PROVIDER || "sanity";
      let imageBuffer: Buffer;
      let contentType: string;

      if (providerType === "sanity") {
        if (!SANITY_ASSET_ID_REGEX.test(id)) {
          throw new BadRequestException("Invalid Sanity asset ID format");
        }

        const originalUrl = await this.getOriginalUrl(id);
        const response = await axios.get(originalUrl, {
          responseType: "arraybuffer",
          timeout: 5000,
          maxContentLength: 10 * 1024 * 1024, // 10MB limit
        });
        imageBuffer = Buffer.from(response.data);
        contentType = response.headers["content-type"] as string;
      } else {
        // RustFS / S3
        const url = await storageService.getSignedUrl(id, 60);
        const response = await axios.get(url, {
          responseType: "arraybuffer",
          timeout: 5000,
          maxContentLength: 10 * 1024 * 1024, // 10MB limit
        });
        imageBuffer = Buffer.from(response.data);
        contentType = response.headers["content-type"] as string;
      }

      let transformer = sharp(imageBuffer);

      if (options.width || options.height) {
        transformer = transformer.resize({
          width: options.width,
          height: options.height,
          fit: "cover",
        });
      }

      const format = (options.format || "webp") as keyof sharp.FormatEnum;
      const quality = options.quality || 75;

      if (format === "webp") {
        transformer = transformer.webp({quality});
      } else if (format === "jpeg" || (format as string) === "jpg") {
        transformer = transformer.jpeg({quality});
      } else if (format === "png") {
        transformer = transformer.png({quality});
      }

      const {data, info} = await transformer.toBuffer({
        resolveWithObject: true,
      });

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
    const providerType = process.env.STORAGE_PROVIDER || "sanity";
    if (providerType === "sanity") {
      // Typical Sanity asset ID: image-02983740298374-1200x800-jpg
      const parts = id.split("-");
      const assetId = parts[1];
      const dimensions = parts[2];
      const extension = parts[3];
      const projectId =
        process.env.SANITY_PROJECT_ID ||
        process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
      const dataset =
        process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET;

      if (!projectId || !dataset) {
        throw new Error("Sanity configuration missing");
      }

      return `https://cdn.sanity.io/images/${projectId}/${dataset}/${assetId}-${dimensions}.${extension}`;
    } else {
      return await storageService.getSignedUrl(id, 60);
    }
  }
}
