import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { storageService } from "@repo/shared/storage";
import { isSafeUrl } from "@repo/shared/server";
import axios from "axios";
import * as crypto from "crypto";

@Injectable()
export class GitHubReleaseService {
  private readonly logger = new Logger(GitHubReleaseService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verify HMAC signature from GitHub webhook using configured secret
   */
  async verifyGithubSignature(
    rawBody: string | Buffer,
    signatureHeader: string | undefined,
  ): Promise<boolean> {
    const settings = await this.prisma.client.globalSetting.findMany({
      where: {
        key: {
          in: ["system:integration:github:webhookSecret", "github_webhook_secret"],
        },
      },
    });

    const secretSetting =
      settings.find((s) => s.key === "system:integration:github:webhookSecret") ||
      settings.find((s) => s.key === "github_webhook_secret");

    const secret =
      secretSetting?.value || process.env.GITHUB_WEBHOOK_SECRET || "";

    if (!secret) {
      this.logger.warn("No GitHub webhook secret configured; accepting webhook");
      return true;
    }

    if (!signatureHeader) {
      return false;
    }

    const hmac = crypto.createHmac("sha256", secret);
    const bodyBuffer =
      typeof rawBody === "string" ? Buffer.from(rawBody) : rawBody;
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

  async processAndSaveAsset(
    version: string,
    releaseTag: string,
    asset: { name: string; browser_download_url: string; size?: number },
  ) {
    const platform = this.detectPlatform(asset.name);
    if (!platform) return null;

    const variant = this.detectVariant(asset.name);

    this.logger.log(
      `[V3] Processing GitHub binary ${asset.name} (${platform}/${variant}) for tag ${releaseTag}...`,
    );

    if (!(await isSafeUrl(asset.browser_download_url))) {
      throw new BadRequestException(
        `Unsafe download URL: ${asset.browser_download_url}`,
      );
    }

    const response = await axios({
      method: "get",
      url: asset.browser_download_url,
      responseType: "arraybuffer",
      headers: {
        Accept: "application/octet-stream",
        "User-Agent": "Scryme-V3-API",
      },
    });

    const buffer = Buffer.from(response.data);
    const contentTypeHeader = response.headers
      ? response.headers["content-type"]
      : null;
    const contentType =
      typeof contentTypeHeader === "string"
        ? contentTypeHeader
        : "application/octet-stream";
    const storageFilename = `pos-binaries/${version}/${platform}/${variant}/${asset.name}`;

    const uploadResult = await storageService.upload(
      buffer,
      storageFilename,
      contentType,
    );

    // Unmark existing latest
    await this.prisma.client.posReleaseBinary.updateMany({
      where: { platform, variant, isLatest: true },
      data: { isLatest: false },
    });

    // Upsert release binary record
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

    this.logger.log(`[V3] Successfully stored ${asset.name} in RustFS: ${uploadResult.url}`);
    return record;
  }

  /**
   * Handle incoming GitHub webhook payloads (release, push tags, create tags)
   */
  async handleWebhookPayload(event: string, payload: any) {
    this.logger.log(`[V3] Processing GitHub webhook event: ${event}`);

    // 1. Release events
    if (event === "release") {
      const action = payload.action;
      if (
        action &&
        action !== "published" &&
        action !== "released" &&
        action !== "created"
      ) {
        return { processed: false, reason: `Ignored release action: ${action}` };
      }

      const release = payload.release;
      if (!release || !Array.isArray(release.assets)) {
        if (payload.ref) {
          const tag = payload.ref.replace("refs/tags/", "");
          return this.syncReleaseFromGithub(tag);
        }
        throw new BadRequestException("Invalid release payload format");
      }

      const releaseTag = release.tag_name || "v1.0.0";
      const version = releaseTag.replace(/^v/, "");

      const savedAssets = [];
      for (const asset of release.assets) {
        try {
          const saved = await this.processAndSaveAsset(
            version,
            releaseTag,
            asset,
          );
          if (saved) savedAssets.push(saved);
        } catch (err: any) {
          this.logger.error(
            `Failed to process asset ${asset.name}: ${err.message}`,
          );
        }
      }

      return {
        processed: true,
        releaseTag,
        savedCount: savedAssets.length,
      };
    }

    // 2. Tag push event: ref e.g. "refs/tags/v1.2.3"
    if (
      event === "push" &&
      typeof payload.ref === "string" &&
      payload.ref.startsWith("refs/tags/")
    ) {
      const tag = payload.ref.replace("refs/tags/", "");
      this.logger.log(`[V3] Detected tag push for ${tag}. Initiating release sync...`);
      return this.syncReleaseFromGithub(tag);
    }

    // 3. Create event (tag created)
    if (event === "create" && payload.ref_type === "tag") {
      const tag = payload.ref;
      this.logger.log(`[V3] Detected tag creation for ${tag}. Initiating release sync...`);
      return this.syncReleaseFromGithub(tag);
    }

    return {
      received: true,
      processed: false,
      reason: `Event "${event}" does not require release binary updates`,
    };
  }

  /**
   * Sync release binaries from GitHub API directly
   */
  async syncReleaseFromGithub(tagOrVersion?: string) {
    const settings = await this.prisma.client.globalSetting.findMany({
      where: {
        key: {
          in: [
            "system:integration:github:owner",
            "system:integration:github:repo",
            "system:integration:github:token",
            "github_owner",
            "github_repo",
            "github_token",
          ],
        },
      },
    });

    const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

    const owner =
      settingsMap.get("system:integration:github:owner") ||
      settingsMap.get("github_owner") ||
      process.env.GITHUB_OWNER ||
      "dealio-org";

    const repo =
      settingsMap.get("system:integration:github:repo") ||
      settingsMap.get("github_repo") ||
      process.env.GITHUB_REPO ||
      "scryme";

    const token =
      settingsMap.get("system:integration:github:token") ||
      settingsMap.get("github_token") ||
      process.env.GITHUB_TOKEN;

    const formattedTag = tagOrVersion
      ? tagOrVersion.startsWith("v")
        ? tagOrVersion
        : "v" + tagOrVersion
      : null;

    const url = formattedTag
      ? `https://api.github.com/repos/${owner}/${repo}/releases/tags/${formattedTag}`
      : `https://api.github.com/repos/${owner}/${repo}/releases/latest`;

    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Scryme-V3-API",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const { data: release } = await axios.get(url, { headers });
    return this.handleWebhookPayload("release", {
      action: "published",
      release,
    });
  }
}
