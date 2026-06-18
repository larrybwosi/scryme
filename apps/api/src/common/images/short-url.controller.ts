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
import { storageService } from "@repo/shared/storage/service";
import axios from "axios";

@Controller("s")
export class ShortUrlController {
  private readonly logger = new Logger(ShortUrlController.name);

  constructor(
    private readonly imageService: ImageService,
    private readonly prisma: PrismaService,
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
      const attachment = await this.prisma.client.attachment.findUnique({
        where: { shortCode },
      });

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
        // For non-images, we stream the file through
        const signedUrl = await storageService.getSignedUrl(
          attachmentId,
          60,
          organizationId,
        );
        const response = await axios.get(signedUrl, {
          responseType: "stream",
          timeout: 10000,
        });

        res.header("Content-Type", mimeType);
        res.header(
          "Content-Disposition",
          `inline; filename="${attachment.fileName || "file"}"`,
        );
        return response.data.pipe(res);
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
