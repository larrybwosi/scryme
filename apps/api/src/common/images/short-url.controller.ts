import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { ImageService } from "./image.service";
import { AllowPublic } from "../decorators/auth.decorator";
import { PrismaService } from "../../prisma/prisma.service";
import { storageService } from "@repo/shared/storage";
import axios from "axios";
import { RedisService } from "../../redis/redis.service";

@Controller("s")
export class ShortUrlController {
  private readonly logger = new Logger(ShortUrlController.name);
  private readonly ATTACHMENT_CACHE_TTL = 3600; // 1 hour
  private readonly FILE_CACHE_TTL = 1800; // 30 minutes
  private readonly MAX_CACHE_SIZE = 5 * 1024 * 1024; // 5MB limit for Redis caching

  constructor(
    private readonly imageService: ImageService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get(":shortCode")
  @AllowPublic()
  async handleShortUrl(
    @Param("shortCode") shortCode: string,
    @Res() res: any,
    @Query("w") w?: string,
    @Query("h") h?: string,
    @Query("q") q?: string,
    @Query("fm") fm?: string,
  ) {
    try {
      const cacheKey = `attachment:${shortCode}`;
      let attachment = await this.redis.get<any>(cacheKey);

      if (!attachment) {
        attachment = await this.prisma.client.attachment.findUnique({
          where: { shortCode },
        });

        if (attachment) {
          await this.redis.setex(
            cacheKey,
            this.ATTACHMENT_CACHE_TTL,
            attachment,
          );
        }
      }

      if (!attachment) {
        return res.status(HttpStatus.NOT_FOUND).send("Link not found");
      }

      const { organizationId, mimeType, id: attachmentId } = attachment;
      const isImage = mimeType.startsWith("image/");

      if (isImage) {
        const width = w ? parseInt(w, 10) : undefined;
        const height = h ? parseInt(h, 10) : undefined;
        const quality = q ? parseInt(q, 10) : undefined;
        const format = fm;

        const { data, contentType } = await this.imageService.optimizeImage(
          attachmentId,
          {
            width,
            height,
            quality,
            format,
            organizationId, // Pass the org context
          },
        );

        res.header("Content-Type", contentType);
        res.header("Cache-Control", "public, max-age=31536000, immutable");
        return res.status(HttpStatus.OK).send(data);
      } else {
        // For non-images, we attempt to use a streaming cache
        const fileCacheKey = `file_content:${attachmentId}`;
        const cachedFile = await this.redis.get<{
          content: string;
          mimeType: string;
        }>(fileCacheKey);

        res.header("Content-Type", mimeType);
        res.header(
          "Content-Disposition",
          `inline; filename="${attachment.fileName || "file"}"`,
        );

        if (cachedFile) {
          const buffer = Buffer.from(cachedFile.content, "base64");
          return res.status(HttpStatus.OK).send(buffer);
        }

        const signedUrl = await storageService.getSignedUrl(
          attachmentId,
          60,
          organizationId,
        );

        // Fetch the file to stream it AND potentially cache it
        const response = await axios.get(signedUrl, {
          responseType: "arraybuffer",
          timeout: 10000,
          maxContentLength: 50 * 1024 * 1024, // 50MB total limit
        });

        const buffer = Buffer.from(response.data);

        // Cache if it's small enough
        if (buffer.length <= this.MAX_CACHE_SIZE) {
          await this.redis.setex(fileCacheKey, this.FILE_CACHE_TTL, {
            content: buffer.toString("base64"),
            mimeType,
          });
        }

        return res.status(HttpStatus.OK).send(buffer);
      }
    } catch (error) {
      this.logger.error(
        `Error handling short code ${shortCode}: ${error.message}`,
      );
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send("Error processing request");
    }
  }
}
