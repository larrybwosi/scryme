import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import axios from "axios";
import { Stream } from "stream";

@Injectable()
export class DownloadPosBinaryUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(platform: string) {
    const platforms: Record<string, { url: string; fileName: string; contentType: string }> = {
      windows: {
        url: "https://github.com/larrybwosi/scryme/releases/latest/download/Scryme_POS_x64_en-US.msi.zip",
        fileName: "Scryme_POS_x64.zip",
        contentType: "application/zip",
      },
      macos: {
        url: "https://github.com/larrybwosi/scryme/releases/latest/download/Scryme_POS_x64.dmg",
        fileName: "Scryme_POS_x64.dmg",
        contentType: "application/x-apple-diskimage",
      },
      linux: {
        url: "https://github.com/larrybwosi/scryme/releases/latest/download/scryme-pos_amd64.deb",
        fileName: "scryme-pos_amd64.deb",
        contentType: "application/vnd.debian.binary-package",
      },
    };

    const config = platforms[platform.toLowerCase()];

    if (!config) {
      throw new NotFoundException(`Binary for platform ${platform} not found`);
    }

    const response = await axios({
      method: "get",
      url: config.url,
      responseType: "stream",
    });

    return {
      stream: response.data as Stream,
      fileName: config.fileName,
      contentType: config.contentType,
    };
  }
}
