import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { AllowPublic } from "../../common/decorators/auth.decorator";
import axios from "axios";
import { env } from "@repo/env";
import type { FastifyReply } from "fastify";

@ApiTags("Public")
@Controller("public")
export class BinariesController {
  private readonly logger = new Logger(BinariesController.name);
  private cache: { data: any; timestamp: number } | null = null;
  private readonly CACHE_TTL = 1000 * 60 * 10; // 10 minutes

  @AllowPublic()
  @Get("download/:platform")
  @ApiOperation({
    summary: "Proxy download for the latest POS binary",
  })
  async downloadBinary(
    @Param("platform") platform: string,
    @Res() res: any,
  ) {
    const owner = env.GITHUB_OWNER;
    const repo = env.GITHUB_REPO;
    const token = env.GITHUB_TOKEN;

    try {
      let release;
      const now = Date.now();

      if (this.cache && now - this.cache.timestamp < this.CACHE_TTL) {
        release = this.cache.data;
      } else {
        const headers: any = {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Scryme-API",
        };
        if (token) {
          headers["Authorization"] = `token ${token}`;
        }

        const { data } = await axios.get(
          `https://api.github.com/repos/${owner}/${repo}/releases/latest`,
          { headers },
        );
        release = data;
        this.cache = { data, timestamp: now };
      }

      let asset = null;
      for (const a of release.assets) {
        const name = a.name.toLowerCase();
        if (
          platform === "windows" &&
          (name.endsWith(".msi") || name.endsWith(".exe"))
        ) {
          asset = a;
          break;
        } else if (
          platform === "macos" &&
          (name.endsWith(".dmg") || name.endsWith(".zip"))
        ) {
          asset = a;
          break;
        } else if (
          platform === "linux" &&
          (name.endsWith(".appimage") || name.endsWith(".deb"))
        ) {
          asset = a;
          break;
        }
      }

      if (!asset) {
        throw new NotFoundException(
          `No binary found for platform: ${platform}`,
        );
      }

      const response = await axios({
        method: "get",
        url: asset.browser_download_url,
        responseType: "stream",
        // We do NOT forward the token to the download URL. GitHub redirects to S3,
        // and S3 will reject the request if an Authorization header is present.
        headers: {
          Accept: "application/octet-stream",
          "User-Agent": "Scryme-API",
        },
      });

      res.header(
        "Content-Type",
        response.headers["content-type"] || "application/octet-stream",
      );
      res.header("Content-Disposition", `attachment; filename="${asset.name}"`);
      res.header("Content-Length", asset.size);

      // Explicitly return the piped stream to bypass global interceptors (Enterprise pattern)
      return response.data.pipe(res);
    } catch (error) {
      this.logger.error(`Failed to proxy binary: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException("Failed to fetch binary from source");
    }
  }
}
