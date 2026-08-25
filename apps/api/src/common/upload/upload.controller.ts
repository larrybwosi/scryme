import {
  Controller,
  Post,
  Req,
  Res,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { storageService, StorageCoreService } from "@repo/shared/storage";
import { v7 as uuidv7 } from "uuid";
import { PrismaService } from "../../prisma/prisma.service";

@Controller()
export class UploadController {
  constructor(private readonly prisma: PrismaService) {}

  @Post(["upload", "v2/upload"])
  async uploadFile(@Req() req: any, @Res() res: any) {
    const data = await req.file();
    if (!data) {
      throw new BadRequestException("No file provided");
    }

    const organizationId = req.v2Context?.organizationId || req.organization?.id || req.user?.organizationId;
    const memberId = req.v2Context?.memberId || req.member?.id || req.user?.memberId;

    if (!organizationId) {
      throw new BadRequestException("Organization context missing");
    }

    const org = await this.prisma.client.organization.findUnique({
      where: { id: organizationId },
      select: { quotaOverrides: true },
    });

    const overrides = (org?.quotaOverrides as Record<string, any>) || {};

    if (overrides.storageDisabled) {
      throw new ForbiddenException(
        "Storage access disabled for this organization",
      );
    }

    const buffer = await data.toBuffer();
    const incomingSizeBytes = buffer.length;

    if (overrides.storageLimitBytes != null || overrides.storageLimitMB != null) {
      const limitBytes =
        overrides.storageLimitBytes != null
          ? Number(overrides.storageLimitBytes)
          : Number(overrides.storageLimitMB) * 1024 * 1024;

      const currentUsage = await this.prisma.client.attachment.aggregate({
        where: { organizationId },
        _sum: { sizeBytes: true },
      });

      const usedBytes = currentUsage._sum.sizeBytes || 0;

      if (usedBytes + incomingSizeBytes > limitBytes) {
        throw new ForbiddenException(
          "Storage limit exceeded for this organization",
        );
      }
    }

    const fileName = StorageCoreService.generateStorageFileName(
      data.filename,
      uuidv7(),
    );

    const result = await storageService.upload(buffer, fileName, data.mimetype, {
      organizationId,
    });

    const { shortCode, shortUrl } = StorageCoreService.generateShortUrlInfo();

    const attachment = await this.prisma.client.attachment.create({
      data: {
        id: fileName, // Use the file name as ID for easier lookup in storage
        fileName: data.filename,
        fileUrl: result.url,
        shortCode,
        shortUrl,
        mimeType: data.mimetype,
        sizeBytes: incomingSizeBytes,
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
