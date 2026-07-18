import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  Res,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { ImageService } from "./image.service";
import { AllowPublic } from "../decorators/auth.decorator";
import { PrismaService } from "../../prisma/prisma.service";
import { storageService } from "@repo/shared/storage";
import { isSafeUrl } from "@repo/shared/server";
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
    @Req() req: any,
    @Res() res: any,
    @Query("w") w?: string,
    @Query("h") h?: string,
    @Query("q") q?: string,
    @Query("fm") fm?: string,
    @Query("download") download?: string,
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

      // Check for link expiration
      if (attachment.expiresAt && new Date(attachment.expiresAt) < new Date()) {
        res.header("Content-Type", "text/html");
        return res.status(HttpStatus.GONE).send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Link Expired - Scryme</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: #fafafa;
      color: #1a1a1a;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
    }
    .card {
      background: white;
      padding: 2.5rem;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      text-align: center;
      max-width: 400px;
      width: 100%;
      border: 1px solid #eaeaea;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: #e11d48;
    }
    p {
      font-size: 0.95rem;
      color: #666;
      line-height: 1.5;
      margin-bottom: 1.5rem;
    }
    .btn {
      display: inline-block;
      background-color: #18181b;
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      transition: background-color 0.2s;
    }
    .btn:hover {
      background-color: #27272a;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>Link Expired</h1>
    <p>This document link has expired or is no longer valid. Please request a new link from the organization.</p>
    <a href="https://scryme.tech" class="btn">Go to Scryme</a>
  </div>
</body>
</html>
        `);
      }

      const { organizationId, mimeType, id: attachmentId, isPublic } = attachment;

      // 1. Check Authorization for private attachments
      // We check organization settings for forced privacy or if the attachment itself is private
      const orgSettingsCacheKey = `org_settings:${organizationId}`;
      let orgSettings = await this.redis.get<any>(orgSettingsCacheKey);
      if (!orgSettings) {
        orgSettings = await this.prisma.client.organizationSettings.findUnique({
          where: { organizationId },
        });
        if (orgSettings) {
          await this.redis.setex(orgSettingsCacheKey, 3600, orgSettings);
        }
      }

      const isPrivate = orgSettings?.forcePrivateAttachments || !isPublic;

      if (isPrivate) {
        const v2Context = req.v2Context;
        // In production, we might want to be stricter, but for now, we allow access if the organization matches
        if (!v2Context || v2Context.organizationId !== organizationId) {
          return res
            .status(HttpStatus.UNAUTHORIZED)
            .send("Unauthorized: Private document");
        }
      }

      const cacheControl = isPrivate
        ? "private, no-cache, no-store, must-revalidate"
        : "public, max-age=31536000, immutable";

      const isImage = mimeType.startsWith("image/");

      // For RustFS/S3, we need the storage key.
      // We prioritize the ID if it looks like a UUID/Storage key (contains a dot or is long enough)
      // Otherwise we fallback to fileName.
      // Actually, looking at the upload logic, we usually store the storage key in the 'id' field of Attachment.
      let storageKey = attachmentId;

      // If id is a CUID (starts with c) and fileName exists and looks like a storage key (has extension)
      // we might need to be careful. But standardizing on 'id' being the storage key is the goal.
      if (
        attachmentId.startsWith("c") &&
        attachment.fileName &&
        attachment.fileName.includes(".")
      ) {
        // Legacy or specific cases where fileName was used for storage key
        // If fileName contains a dot, it's likely the storage key (e.g. uuid.jpg)
        storageKey = attachment.fileName;
      }

      // @robustness: Ensure the storageKey has the mandatory 'dealio-' prefix
      if (
        process.env.STORAGE_PROVIDER === "rustfs" &&
        !storageKey.startsWith("dealio-")
      ) {
        storageKey = `dealio-${storageKey}`;
      }

      if (isImage) {
        const width = w ? parseInt(w, 10) : undefined;
        const height = h ? parseInt(h, 10) : undefined;
        const quality = q ? parseInt(q, 10) : undefined;
        const format = fm;

        const { data, contentType } = await this.imageService.optimizeImage(
          storageKey,
          {
            width,
            height,
            quality,
            format,
            organizationId, // Pass the org context
          },
        );

        res.header("Content-Type", contentType);
        res.header("Cache-Control", cacheControl);
        return res.status(HttpStatus.OK).send(data);
      } else {
        // For non-images, we attempt to use a streaming cache
        const fileCacheKey = `file_content:${attachmentId}`;
        const cachedFile = await this.redis.get<{
          content: string;
          mimeType: string;
        }>(fileCacheKey);

        const disposition = (download === "true" || download === "1" || download === "") ? "attachment" : "inline";

        res.header("Content-Type", mimeType);
        res.header("Cache-Control", cacheControl);
        res.header(
          "Content-Disposition",
          `${disposition}; filename="${attachment.fileName || "file"}"`,
        );

        if (cachedFile) {
          const buffer = Buffer.from(cachedFile.content, "base64");
          return res.status(HttpStatus.OK).send(buffer);
        }

        const signedUrl = await storageService.getSignedUrl(
          storageKey,
          60,
          organizationId,
        );

        if (!(await isSafeUrl(signedUrl))) {
          throw new Error(`Potentially unsafe storage URL: ${signedUrl}`);
        }

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
