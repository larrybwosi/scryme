import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { storageService } from "@repo/shared/storage";
import { env } from "@repo/env";
import axios from "axios";
import * as crypto from "crypto";
import { isSafeUrl } from "@repo/shared/server";

@Injectable()
export class PosReleaseService {
  private readonly logger = new Logger(PosReleaseService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verify HMAC signature from GitHub webhook
   */
  async verifyGithubSignature(
    rawBody: string | Buffer,
    signatureHeader: string | undefined,
  ): Promise<boolean> {
    const secretSetting = await this.prisma.client.globalSetting.findUnique({
      where: { key: "github_webhook_secret" },
    });
    const secret = secretSetting?.value || process.env.GITHUB_WEBHOOK_SECRET || "";

    if (!secret) {
      this.logger.warn("No GitHub webhook secret configured");
      return true;
    }

    if (!signatureHeader) {
      return false;
    }

    const hmac = crypto.createHmac("sha256", secret);
    const bodyBuffer = typeof rawBody === "string" ? Buffer.from(rawBody) : rawBody;
    const digest = "sha256=" + hmac.update(bodyBuffer).digest("hex");

    try {
      return crypto.timingSafeEqual(
        Buffer.from(digest),
        Buffer.from(signatureHeader),
      );
    } catch {
      return false;
    }
  }

  /**
   * Parse asset platform from filename
   */
  detectPlatform(fileName: string): "windows" | "macos" | "linux" | null {
    const name = fileName.toLowerCase();
    if (name.endsWith(".msi") || name.endsWith(".exe")) return "windows";
    if (
      name.endsWith(".dmg") ||
      name.endsWith(".pkg") ||
      (name.endsWith(".zip") && name.includes("mac"))
    )
      return "macos";
    if (name.endsWith(".appimage") || name.endsWith(".deb")) return "linux";
    return null;
  }

  /**
   * Parse asset variant from filename
   */
  detectVariant(
    fileName: string,
  ): "retail" | "restaurant" | "supermarket" | "pharmacy" | "standalone" {
    const name = fileName.toLowerCase();
    if (name.includes("pharmacy")) return "pharmacy";
    if (name.includes("restaurant")) return "restaurant";
    if (name.includes("supermarket")) return "supermarket";
    if (name.includes("standalone")) return "standalone";
    return "retail";
  }

  /**
   * Process release asset binary from URL and save to RustFS storage
   */
  async processAndSaveAsset(
    version: string,
    releaseTag: string,
    asset: { name: string; browser_download_url: string; size?: number },
  ) {
    const platform = this.detectPlatform(asset.name);
    if (!platform) return null;

    const variant = this.detectVariant(asset.name);

    this.logger.log(
      `Fetching POS binary asset ${asset.name} (${platform}/${variant}) for release ${releaseTag}...`,
    );

    if (!(await isSafeUrl(asset.browser_download_url))) {
      throw new BadRequestException(`Unsafe download URL: ${asset.browser_download_url}`);
    }

    const response = await axios({
      method: "get",
      url: asset.browser_download_url,
      responseType: "arraybuffer",
      headers: {
        Accept: "application/octet-stream",
        "User-Agent": "Scryme-API",
      },
    });

    const buffer = Buffer.from(response.data);
    const contentTypeHeader = response.headers ? response.headers["content-type"] : null;
    const contentType = typeof contentTypeHeader === "string" ? contentTypeHeader : "application/octet-stream";
    const storageFilename = `pos-binaries/${version}/${platform}/${variant}/${asset.name}`;

    const uploadResult = await storageService.upload(
      buffer,
      storageFilename,
      contentType,
    );

    // Unmark existing latest for this platform & variant
    await this.prisma.client.posReleaseBinary.updateMany({
      where: { platform, variant, isLatest: true },
      data: { isLatest: false },
    });

    // Upsert record
    const record = await this.prisma.client.posReleaseBinary.upsert({
      where: {
        platform_variant_version: {
          platform,
          variant,
          version,
        },
      },
      update: {
        fileName: asset.name,
        fileUrl: uploadResult.url,
        storageKey: uploadResult.id,
        sizeBytes: BigInt(buffer.length),
        mimeType: contentType,
        releaseTag,
        isLatest: true,
      },
      create: {
        version,
        platform,
        variant,
        fileName: asset.name,
        fileUrl: uploadResult.url,
        storageKey: uploadResult.id,
        sizeBytes: BigInt(buffer.length),
        mimeType: contentType,
        releaseTag,
        isLatest: true,
      },
    });

    this.logger.log(`Saved POS binary ${asset.name} to RustFS: ${uploadResult.url}`);
    return record;
  }

  /**
   * Handle GitHub release webhook event
   */
  async handleWebhookReleasePayload(payload: any) {
    const action = payload.action;
    if (action !== "published" && action !== "released" && action !== "created") {
      this.logger.log(`Ignoring release action "${action}"`);
      return { processed: false, reason: `Ignored action ${action}` };
    }

    const release = payload.release;
    if (!release || !release.assets || !Array.isArray(release.assets)) {
      throw new BadRequestException("Invalid release payload format");
    }

    const releaseTag = release.tag_name || "v1.0.0";
    const version = releaseTag.replace(/^v/, "");

    const savedAssets = [];
    for (const asset of release.assets) {
      try {
        const saved = await this.processAndSaveAsset(version, releaseTag, asset);
        if (saved) savedAssets.push(saved);
      } catch (err: any) {
        this.logger.error(`Failed to process asset ${asset.name}: ${err.message}`);
      }
    }

    return { processed: true, releaseTag, savedCount: savedAssets.length };
  }

  /**
   * Sync release binaries directly from GitHub API
   */
  async syncReleaseFromGithub(tagOrVersion?: string) {
    const ownerSetting = await this.prisma.client.globalSetting.findUnique({
      where: { key: "github_owner" },
    });
    const repoSetting = await this.prisma.client.globalSetting.findUnique({
      where: { key: "github_repo" },
    });
    const tokenSetting = await this.prisma.client.globalSetting.findUnique({
      where: { key: "github_token" },
    });

    const owner = ownerSetting?.value || env.GITHUB_OWNER;
    const repo = repoSetting?.value || env.GITHUB_REPO;
    const token = tokenSetting?.value || env.GITHUB_TOKEN;

    if (!owner || !repo) {
      throw new BadRequestException("GitHub owner/repo not configured");
    }

    const url = tagOrVersion
      ? `https://api.github.com/repos/${owner}/${repo}/releases/tags/${tagOrVersion.startsWith("v") ? tagOrVersion : "v" + tagOrVersion}`
      : `https://api.github.com/repos/${owner}/${repo}/releases/latest`;

    const headers: any = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Scryme-API",
    };
    if (token) {
      headers["Authorization"] = `token ${token}`;
    }

    const { data: release } = await axios.get(url, { headers });
    return this.handleWebhookReleasePayload({ action: "published", release });
  }

  /**
   * Retrieve the latest binary for a platform and variant
   */
  async getLatestBinary(platform: string, variant: string = "retail") {
    const normalizedPlatform = platform.toLowerCase();
    const normalizedVariant = variant.toLowerCase();

    return this.prisma.client.posReleaseBinary.findFirst({
      where: {
        platform: normalizedPlatform,
        variant: normalizedVariant,
        isLatest: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * List all stored POS release binaries
   */
  async listBinaries() {
    const binaries = await this.prisma.client.posReleaseBinary.findMany({
      orderBy: [{ platform: "asc" }, { variant: "asc" }, { createdAt: "desc" }],
    });

    return binaries.map((b) => ({
      ...b,
      sizeBytes: b.sizeBytes ? Number(b.sizeBytes) : null,
    }));
  }

  /**
   * Delete a stored binary record
   */
  async deleteBinary(id: string) {
    const existing = await this.prisma.client.posReleaseBinary.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Binary record ${id} not found`);
    }

    try {
      await storageService.delete(existing.storageKey);
    } catch (e: any) {
      this.logger.warn(`Failed to delete binary from storage: ${e.message}`);
    }

    await this.prisma.client.posReleaseBinary.delete({ where: { id } });
    return { success: true };
  }
}
