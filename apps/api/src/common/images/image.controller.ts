import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  HttpStatus,
  Req,
} from "@nestjs/common";
import { ImageService } from "./image.service";
import { AllowPublic } from "../decorators/auth.decorator";
import { PrismaService } from "../../prisma/prisma.service";

@Controller("images")
export class ImageController {
  constructor(
    private readonly imageService: ImageService,
    private readonly prisma: PrismaService,
  ) {}

  @Get(":id")
  @AllowPublic()
  async getImage(
    @Param("id") id: string,
    @Req() req: any,
    @Res() res: any,
    @Query("w") w?: string,
    @Query("h") h?: string,
    @Query("q") q?: string,
    @Query("fm") fm?: string,
  ) {
    const width = w ? parseInt(w, 10) : undefined;
    const height = h ? parseInt(h, 10) : undefined;
    const quality = q ? parseInt(q, 10) : undefined;
    const format = fm;

    try {
      // 1. Check Authorization for private attachments
      const attachment = await this.prisma.client.attachment.findUnique({
        where: { id },
        include: {
          organization: {
            select: {
              settings: true,
            },
          },
        },
      });

      if (!attachment) {
        return res.status(HttpStatus.NOT_FOUND).send("Image not found");
      }

      const isPrivate =
        attachment.organization?.settings?.forcePrivateAttachments ||
        !attachment.isPublic;

      if (isPrivate) {
        const v2Context = req.v2Context;
        if (!v2Context || v2Context.organizationId !== attachment.organizationId) {
          return res
            .status(HttpStatus.UNAUTHORIZED)
            .send("Unauthorized: Private image");
        }
      }

      const { data, contentType } = await this.imageService.optimizeImage(id, {
        width,
        height,
        quality,
        format,
        organizationId: attachment.organizationId,
      });

      const cacheControl = isPrivate
        ? "private, no-cache, no-store, must-revalidate"
        : "public, max-age=31536000, immutable";

      res.header("Content-Type", contentType);
      res.header("Cache-Control", cacheControl);
      return res.status(HttpStatus.OK).send(data);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send("Error processing image");
    }
  }
}
