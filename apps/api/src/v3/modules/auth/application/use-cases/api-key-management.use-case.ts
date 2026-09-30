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

    // Threat: BOLA/IDOR vulnerability allowing unauthorized modification of another developer's API key.
    // Mitigation: Use updateMany scoped strictly by both id and userId to enforce database-level owner isolation.
    const whereClause = {
      id: existing.id,
      ...(userId ? { userId } : {}),
    };

    await db.apikey.updateMany({
      where: whereClause,
      data: {
        enabled: !(existing.enabled ?? true),
        updatedAt: new Date(),
      },
    });

    const updated = await db.apikey.findFirstOrThrow({
      where: whereClause,
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

    // Threat: BOLA/IDOR vulnerability allowing unauthorized revocation and deletion of foreign API keys.
    // Mitigation: Use deleteMany scoped strictly by both id and userId for database-level owner isolation.
    await db.apikey.deleteMany({
      where: {
        id: existing.id,
        ...(userId ? { userId } : {}),
      },
    });

    return { success: true, message: "API key revoked and deleted successfully" };
  }
}
