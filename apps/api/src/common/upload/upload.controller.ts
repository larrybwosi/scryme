import {
  Controller,
  Post,
  Req,
  Res,
  BadRequestException,
} from "@nestjs/common";
import { storageService, StorageCoreService } from "@repo/shared/storage";
import { v7 as uuidv7 } from "uuid";
import { PrismaService } from "../../prisma/prisma.service";

@Controller("upload")
export class UploadController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async uploadFile(@Req() req: any, @Res() res: any) {
    const data = await req.file();
    if (!data) {
      throw new BadRequestException("No file provided");
    }

    const organizationId = req.v2Context?.organizationId;
    const memberId = req.v2Context?.memberId;

    if (!organizationId) {
      throw new BadRequestException("Organization context missing");
    }

    const fileName = StorageCoreService.generateStorageFileName(
      data.filename,
      uuidv7(),
    );

    const buffer = await data.toBuffer();
    const result = await storageService.upload(
      buffer,
      fileName,
      data.mimetype,
      {
        organizationId,
      },
    );

    const { shortCode, shortUrl } = StorageCoreService.generateShortUrlInfo();

    const attachment = await this.prisma.client.attachment.create({
      data: {
        id: fileName, // Use the file name as ID for easier lookup in storage
        fileName: data.filename,
        fileUrl: result.url,
        shortCode,
        shortUrl,
        mimeType: data.mimetype,
        isPublic: true, // Defaulting to public for now, as per requirement "Public but obfuscated links by default"
        organizationId,
        memberId: memberId || "system",
      },
    });

    return res.send({
      url: attachment.shortUrl,
      shortUrl: attachment.shortUrl,
      id: attachment.id,
    });
  }
}
