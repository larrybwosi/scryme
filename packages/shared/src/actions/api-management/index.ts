import { db, Prisma } from "@repo/db";
import * as crypto from "crypto";
import * as argon2 from "argon2";
import { encrypt } from "../../api/v2/utils/encryption";

// --- V3 API Client Actions ---

export async function createV3ApiClient(data: {
  name: string;
  organizationId: string;
  scopes?: string[];
  corsOrigins?: string[];
}) {
  const clientId = `v3_${crypto.randomBytes(16).toString("hex")}`;
  const rawSecret = crypto.randomBytes(32).toString("hex");
  const encryptedSecret = encrypt(rawSecret);

  const client = await db.v3ApiClient.create({
    data: {
      name: data.name,
      clientId,
      clientSecret: encryptedSecret,
      organizationId: data.organizationId,
      scopes: data.scopes || ["read", "write"],
      corsOrigins: data.corsOrigins || [],
    },
  });

  return { ...client, clientSecret: rawSecret }; // Return raw secret once for the user
}

export async function getV3ApiClients(organizationId: string) {
  return db.v3ApiClient.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteV3ApiClient(id: string, organizationId: string) {
  return db.v3ApiClient.deleteMany({
    where: { id, organizationId },
  });
}

export async function updateV3ApiClient(id: string, organizationId: string, data: Partial<{
  name: string;
  isActive: boolean;
  scopes: string[];
  corsOrigins: string[];
}>) {
  return db.v3ApiClient.updateMany({
    where: { id, organizationId },
    data,
  });
}

export async function regenerateV3ClientSecret(id: string, organizationId: string) {
  const rawSecret = crypto.randomBytes(32).toString("hex");
  const encryptedSecret = encrypt(rawSecret);

  await db.v3ApiClient.updateMany({
    where: { id, organizationId },
    data: { clientSecret: encryptedSecret },
  });

  return rawSecret;
}

// --- Webhook Subscription Actions ---

export async function createWebhookSubscription(data: {
  name?: string;
  url: string;
  events: string[];
  organizationId: string;
  apiClientId?: string;
}) {
  const secret = crypto.randomBytes(32).toString("hex");

  return db.webhookSubscription.create({
    data: {
      ...data,
      secret,
    },
  });
}

export async function getWebhookSubscriptions(organizationId: string) {
  return db.webhookSubscription.findMany({
    where: { organizationId },
    include: { apiClient: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteWebhookSubscription(id: string, organizationId: string) {
  return db.webhookSubscription.deleteMany({
    where: { id, organizationId },
  });
}

// --- V2 API Key Actions ---

export async function createV2ApiKey(data: {
  name: string;
  organizationId: string;
  createdById: string;
  environment?: "LIVE" | "TEST";
  keyType?: "POS" | "CLIENT";
  permissions?: string[];
}) {
  const keyPrefix = `dealio_sk_${data.environment === "TEST" ? "test_" : ""}${crypto.randomBytes(4).toString("hex")}_`;
  const rawKey = crypto.randomBytes(24).toString("hex");
  const fullKey = `${keyPrefix}${rawKey}`;

  // Follow the security pattern from validateDeviceKey:
  // 1. Hash the secret part with Argon2
  // 2. Encrypt the Argon2 hash with AES-256-GCM
  const argonHash = await argon2.hash(rawKey);
  const hashedKey = encrypt(argonHash);

  const apiKey = await db.apiKey.create({
    data: {
      name: data.name,
      organizationId: data.organizationId,
      createdById: data.createdById,
      keyPrefix,
      hashedKey,
      environment: data.environment || "LIVE",
      keyType: data.keyType || "CLIENT",
      permissions: data.permissions || [],
    },
  });

  return { ...apiKey, fullKey };
}

export async function getV2ApiKeys(organizationId: string) {
  return db.apiKey.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteV2ApiKey(id: string, organizationId: string) {
  return db.apiKey.deleteMany({
    where: { id, organizationId },
  });
}

// --- V2 Device Setup Token Actions ---

export async function createDeviceSetupToken(data: {
  organizationId: string;
  createdById: string;
  deviceName: string;
  deviceType: "POS_TERMINAL" | "MOBILE_POS" | "KIOSK" | "TABLET" | "BAKERY_TERMINAL";
  locationId: string;
}) {
  const jti = crypto.randomUUID();
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const setupToken = await db.deviceSetupToken.create({
    data: {
      organizationId: data.organizationId,
      createdById: data.createdById,
      deviceName: data.deviceName,
      deviceType: data.deviceType,
      locationId: data.locationId,
      jti,
      tokenHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  });

  return { ...setupToken, rawToken };
}

export async function getDeviceSetupTokens(organizationId: string) {
  return db.deviceSetupToken.findMany({
    where: { organizationId },
    include: { location: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDeviceRegistry(organizationId: string) {
    return db.deviceRegistry.findMany({
        where: { organizationId },
        include: { location: true },
        orderBy: { createdAt: "desc" },
    });
}
