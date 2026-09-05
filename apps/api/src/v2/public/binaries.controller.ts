import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Res,
  Req,
  Headers,
  Body,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { AllowPublic } from "../../common/decorators/auth.decorator";
import axios from "axios";
import { env } from "@repo/env";
import { isSafeUrl } from "@repo/shared/server";
import { storageService } from "@repo/shared/storage";
import { PosReleaseService } from "./pos-release.service";

@ApiTags("Public")
@Controller("public")
export class BinariesController {
  private readonly logger = new Logger(BinariesController.name);
  private cache: { data: any; timestamp: number } | null = null;
  private readonly CACHE_TTL = 1000 * 60 * 10; // 10 minutes

  constructor(private readonly posReleaseService: PosReleaseService) {}

  @AllowPublic()
  @Post("github-webhook")
  @ApiOperation({
    summary: "Receive GitHub webhooks for new releases and store binaries to RustFS",
  })
  async handleGithubWebhook(
    @Headers("x-github-event") event: string,
    @Headers("x-hub-signature-256") signature: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    const rawBody = req.rawBody || req.body || JSON.stringify(body);
    const isValid = await this.posReleaseService.verifyGithubSignature(rawBody, signature);

    if (!isValid) {
      throw new UnauthorizedException("Invalid GitHub webhook signature");
    }

    if (event === "release") {
      return this.posReleaseService.handleWebhookReleasePayload(body);
    }

    return { received: true, ignoredEvent: event };
  }

  @AllowPublic()
  @Post("sync-release")
  @ApiOperation({
    summary: "Sync POS app binaries directly from GitHub release tag or latest",
  })
  async syncRelease(@Query("tag") tag?: string) {
    return this.posReleaseService.syncReleaseFromGithub(tag);
  }

  @AllowPublic()
  @Get(["download/:platform", "download/:platform/:variant"])
  @ApiOperation({
    summary: "Serve or proxy download for the latest POS binary",
  })
  @ApiQuery({ name: "variant", required: false, type: String })
  async downloadBinary(
    @Param("platform") platform: string,
    @Res() res: any,
    @Param("variant") variantParam?: string,
    @Query("variant") variantQuery?: string,
  ) {
    const variant = (variantParam || variantQuery || "retail").toLowerCase();

    // 1. Check if binary is stored in RustFS
    try {
      const storedBinary = await this.posReleaseService.getLatestBinary(platform, variant);

      if (storedBinary && storedBinary.fileUrl) {
        if (!(await isSafeUrl(storedBinary.fileUrl))) {
          throw new BadRequestException("Insecure download URL blocked");
        }

        const stream = await storageService.getDownloadStream(storedBinary.fileUrl);

        res.header(
          "Content-Type",
          storedBinary.mimeType || "application/octet-stream",
        );
        res.header(
          "Content-Disposition",
          `attachment; filename="${storedBinary.fileName}"`,
        );
        if (storedBinary.sizeBytes) {
          res.header("Content-Length", Number(storedBinary.sizeBytes));
        }

        return stream.pipe(res);
      }
    } catch (err: any) {
      this.logger.warn(
        `RustFS binary lookup/fetch failed: ${err.message}. Falling back to GitHub release proxy.`,
      );
    }

    // 2. Fallback to GitHub Release proxy
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

        // Standard extension filtering
        const isTargetPlatform =
          (platform === "windows" && (name.endsWith(".msi") || name.endsWith(".exe"))) ||
          (platform === "macos" && (name.endsWith(".dmg") || name.endsWith(".zip") || name.endsWith(".pkg"))) ||
          (platform === "linux" && (name.endsWith(".appimage") || name.endsWith(".deb")));

        if (!isTargetPlatform) {
          continue;
        }

        // Handle variant matching
        if (variant === "retail") {
          const hasOtherVariant =
            name.includes("pharmacy") ||
            name.includes("restaurant") ||
            name.includes("supermarket") ||
            name.includes("standalone");
          if (!hasOtherVariant) {
            asset = a;
            break;
          }
        } else {
          if (name.includes(variant)) {
            asset = a;
            break;
          }
        }
      }

      if (!asset) {
        throw new NotFoundException(
          `No binary found for platform: ${platform} and variant: ${variant}`,
        );
      }

      // @security Validate URL to prevent SSRF
      if (!(await isSafeUrl(asset.browser_download_url))) {
        throw new BadRequestException("Insecure download URL blocked");
      }

      const response = await axios({
        method: "get",
        url: asset.browser_download_url,
        responseType: "stream",
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

      return response.data.pipe(res);
    } catch (error) {
      this.logger.error(`Failed to proxy binary: ${error.message}`);
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException("Failed to fetch binary from source");
    }
  }
}
