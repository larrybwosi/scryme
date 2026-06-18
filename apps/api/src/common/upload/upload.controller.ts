import {
  Controller,
  Post,
  Req,
  Res,
  BadRequestException,
} from "@nestjs/common";
import { storageService } from "@repo/shared/storage";
import { v7 as uuidv7 } from "uuid";
import { generateShortCode } from "@repo/shared/utils";
import { PrismaService } from "../../prisma/prisma.service";
import { env } from "@repo/env";

@Controller("upload")
export class UploadController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async uploadFile(@Req() req: any, @Res() res: any) {
    const data = await req.file();
    if (!data) {
      throw new BadRequestException("No file provided");
    }

    const organizationId = req.user?.organizationId;
    const memberId = req.user?.memberId;

    if (!organizationId) {
      throw new BadRequestException("Organization context missing");
    }

    const fileExtension =
      data.filename
        .split(".")
        .pop()
        ?.replace(/[^a-zA-Z0-9]/g, "") || "bin";
    const fileName = `${uuidv7()}.${fileExtension}`;

    const buffer = await data.toBuffer();
    const result = await storageService.upload(buffer, fileName, data.mimetype, {
      organizationId,
    });

    const shortCode = generateShortCode();
    const shortUrl = `${env.NEXT_PUBLIC_API_URL}/s/${shortCode}`;

    const attachment = await this.prisma.client.attachment.create({
      data: {
        id: fileName, // Use the file name as ID for easier lookup in storage
        fileName: data.filename,
        fileUrl: result.url,
        shortCode,
        shortUrl,
        mimeType: data.mimetype,
        organizationId,
        memberId: memberId || "system",
      },
    });

    return res.send({
      url: result.url,
      shortUrl: attachment.shortUrl,
      id: attachment.id,
    });
  }
}
