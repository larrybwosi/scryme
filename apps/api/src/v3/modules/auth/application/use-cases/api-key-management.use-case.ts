import { Injectable, NotFoundException } from "@nestjs/common";
import { db } from "@repo/db";
import { randomBytes, createHash } from "crypto";

export interface CreateApiKeyDto {
  name: string;
  environment?: "LIVE" | "TEST";
}

@Injectable()
export class ApiKeyManagementUseCase {
  async createApiKey(userId: string | undefined, dto: CreateApiKeyDto) {
    if (!userId) {
      throw new NotFoundException("User ID is required to create an API key");
    }

    const env = dto.environment || "LIVE";
    const randomSecret = randomBytes(24).toString("hex");
    const prefix = env === "LIVE" ? "sk_live_" : "sk_test_";
    const fullKey = `${prefix}${randomSecret}`;
    const start = fullKey.substring(0, 12);
    const keyHash = createHash("sha256").update(fullKey).digest("hex");
    const id = `key_${randomBytes(12).toString("hex")}`;

    const now = new Date();
    const apiKey = await db.apikey.create({
      data: {
        id,
        name: dto.name,
        prefix,
        start,
        key: keyHash,
        userId,
        enabled: true,
        metadata: JSON.stringify({ environment: env }),
        createdAt: now,
        updatedAt: now,
      },
    });

    return {
      id: apiKey.id,
      name: apiKey.name || "API Key",
      keyPrefix: apiKey.prefix || prefix,
      fullKey,
      environment: env,
      isActive: apiKey.enabled ?? true,
      createdAt: apiKey.createdAt.toISOString(),
      lastUsedAt: apiKey.lastRequest ? apiKey.lastRequest.toISOString() : undefined,
    };
  }

  async listApiKeys(userId?: string) {
    if (!userId) return [];

    const keys = await db.apikey.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return keys.map((k) => {
      let environment: "LIVE" | "TEST" = "LIVE";
      if (k.metadata) {
        try {
          const parsed = typeof k.metadata === "string" ? JSON.parse(k.metadata) : k.metadata;
          if (parsed?.environment) environment = parsed.environment;
        } catch (_) {}
      } else if (k.prefix?.includes("test")) {
        environment = "TEST";
      }

      return {
        id: k.id,
        name: k.name || "API Key",
        keyPrefix: k.prefix || k.start || "sk_",
        environment,
        isActive: k.enabled ?? true,
        createdAt: k.createdAt.toISOString(),
        lastUsedAt: k.lastRequest ? k.lastRequest.toISOString() : undefined,
      };
    });
  }

  async toggleApiKey(id: string, userId?: string) {
    const existing = await db.apikey.findFirst({
      where: { id, ...(userId ? { userId } : {}) },
    });

    if (!existing) {
      throw new NotFoundException(`API key with ID '${id}' not found`);
    }

    const updated = await db.apikey.update({
      where: { id: existing.id },
      data: {
        enabled: !(existing.enabled ?? true),
        updatedAt: new Date(),
      },
    });

    return {
      id: updated.id,
      name: updated.name || "API Key",
      isActive: updated.enabled ?? true,
    };
  }

  async deleteApiKey(id: string, userId?: string) {
    const existing = await db.apikey.findFirst({
      where: { id, ...(userId ? { userId } : {}) },
    });

    if (!existing) {
      throw new NotFoundException(`API key with ID '${id}' not found`);
    }

    await db.apikey.delete({
      where: { id: existing.id },
    });

    return { success: true, message: "API key revoked and deleted successfully" };
  }
}
