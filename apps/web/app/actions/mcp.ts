"use server";

import { createHash, randomBytes } from "crypto";
import { db } from "@repo/db";
import { getServerAuth } from "@repo/auth/server";
import { revalidatePath } from "next/cache";

async function ensureOrgContext() {
  const context = await getServerAuth();
  if (!context || !context.organizationId) {
    throw new Error("Unauthorized");
  }
  return context;
}

export async function createMcpApiKeyAction(data: { name: string; scopes?: string[] }) {
  const context = await ensureOrgContext();
  const name = data.name?.trim() || "MCP Integration Key";
  const scopes = data.scopes && data.scopes.length > 0 ? data.scopes : ["mcp:read", "mcp:write"];

  // Generate random token mcp_live_<random_32_chars>
  const randomHex = randomBytes(24).toString("hex");
  const rawKey = `mcp_live_${randomHex}`;
  const keyPrefix = rawKey.substring(0, 16);
  const hashedKey = createHash("sha256").update(rawKey).digest("hex");

  const mcpKey = await db.mcpApiKey.create({
    data: {
      organizationId: context.organizationId,
      createdById: context.memberId || null,
      name,
      keyPrefix,
      hashedKey,
      scopes,
      isActive: true,
    },
  });

  revalidatePath("/settings/mcp");
  revalidatePath("/settings/integrations");

  return {
    id: mcpKey.id,
    name: mcpKey.name,
    keyPrefix: mcpKey.keyPrefix,
    rawKey, // Returned once so user can copy it
    scopes: mcpKey.scopes,
    createdAt: mcpKey.createdAt,
  };
}

export async function getMcpApiKeysAction() {
  const context = await ensureOrgContext();

  const keys = await db.mcpApiKey.findMany({
    where: {
      organizationId: context.organizationId,
      revokedAt: null,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      scopes: true,
      isActive: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  return keys;
}

export async function revokeMcpApiKeyAction(id: string) {
  const context = await ensureOrgContext();

  await db.mcpApiKey.updateMany({
    where: {
      id,
      organizationId: context.organizationId,
    },
    data: {
      isActive: false,
      revokedAt: new Date(),
    },
  });

  revalidatePath("/settings/mcp");
  revalidatePath("/settings/integrations");
  return { success: true };
}
