import { db } from "@repo/db";
import { env } from "@repo/env";
import * as jwt from "jsonwebtoken";
import * as crypto from "crypto";
import * as argon2 from "argon2";
// Import directly from the file to avoid circular dependencies
import { encrypt } from "../../api/v2/utils/encryption";

const JWT_SECRET = env.JWT_SECRET || "default_secret_for_provisioning";

export interface DeviceSetupTokenPayload {
  jti: string;
  organizationId: string;
  deviceName: string;
  deviceType: string;
  locationId: string;
  permissions: string[];
  environment: string;
}

/**
 * Creates a secure, JWT-backed device setup token.
 */
export async function createProvisioningToken(
  data: {
    organizationId: string;
    createdById: string;
    deviceName: string;
    deviceType: any;
    locationId: string;
    permissions?: string[];
    allowedIps?: string[];
    environment?: any;
  },
  prisma: any = db
) {
  const jti = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const payload: DeviceSetupTokenPayload = {
    jti,
    organizationId: data.organizationId,
    deviceName: data.deviceName,
    deviceType: data.deviceType,
    locationId: data.locationId,
    permissions: data.permissions || ["pos:all"],
    environment: data.environment || "LIVE",
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  await prisma.deviceSetupToken.create({
    data: {
      organizationId: data.organizationId,
      tokenHash,
      jti,
      deviceName: data.deviceName,
      deviceType: data.deviceType,
      locationId: data.locationId,
      permissions: data.permissions || ["pos:all"],
      allowedIps: data.allowedIps || [],
      environment: data.environment || "LIVE",
      expiresAt,
      createdById: data.createdById,
    },
  });

  return {
    setupToken: token,
    expiresAt,
  };
}

export async function listSetupTokens(
  organizationId: string,
  filters?: { includeUsed?: boolean; includeExpired?: boolean },
  prisma: any = db
) {
  const where: any = { organizationId };

  if (!filters?.includeUsed) {
    where.usedAt = null;
  }
  if (!filters?.includeExpired) {
    where.expiresAt = { gt: new Date() };
  }
  where.revokedAt = null;

  const tokens = await prisma.deviceSetupToken.findMany({
    where,
    include: {
      location: { select: { name: true } },
      createdBy: { select: { user: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return tokens.map((t: any) => ({
    tokenId: t.id,
    deviceName: t.deviceName,
    deviceType: t.deviceType,
    locationId: t.locationId,
    locationName: t.location?.name,
    permissions: t.permissions,
    allowedIps: t.allowedIps,
    environment: t.environment,
    expiresAt: t.expiresAt,
    usedAt: t.usedAt,
    revokedAt: t.revokedAt,
    createdAt: t.createdAt,
    createdBy: t.createdBy?.user?.name,
    redeemedApiKeyId: t.redeemedApiKeyId,
    status: t.revokedAt
      ? "revoked"
      : t.usedAt
        ? "used"
        : t.expiresAt < new Date()
          ? "expired"
          : "pending",
  }));
}

export async function revokeSetupToken(
  organizationId: string,
  tokenId: string,
  prisma: any = db
) {
  const token = await prisma.deviceSetupToken.findFirst({
    where: { id: tokenId, organizationId },
  });

  if (!token) {
    throw new Error("Setup token not found");
  }

  return prisma.deviceSetupToken.update({
    where: { id: tokenId },
    data: { revokedAt: new Date() },
  });
}

/**
 * Redeems a provisioning token and creates a V2 ApiKey and Device Registry entry.
 */
export async function redeemProvisioningToken(token: string, prisma: any = db) {
  let payload: DeviceSetupTokenPayload;
  try {
    payload = jwt.verify(token, JWT_SECRET) as DeviceSetupTokenPayload;
  } catch (err) {
    throw new Error("Invalid or expired setup token");
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const setupToken = await prisma.deviceSetupToken.findUnique({
    where: { tokenHash },
    include: { organization: { select: { id: true, slug: true } } }
  });

  if (!setupToken || setupToken.usedAt || setupToken.revokedAt || setupToken.expiresAt < new Date()) {
    throw new Error("Setup token is no longer valid");
  }

  // 1. Generate API Key (V2 Format)
  const secret = crypto.randomBytes(32).toString("hex");
  const uniqueId = crypto.randomBytes(8).toString("hex");
  const envSegment = setupToken.environment.toLowerCase();
  const prefix = `dealio_${setupToken.environment === "LIVE" ? "pk" : "sk"}_${envSegment}_${uniqueId}_`;

  const plaintextKey = `${prefix}${secret}`;

  // Hash the secret
  const hashedSecret = await argon2.hash(secret, {
    type: argon2.argon2id,
    memoryCost: 4096,
    timeCost: 3,
    parallelism: 4,
  });

  // Encrypt the hash for storage
  const encryptedHash = encrypt(hashedSecret);

  // 2. Create API Key
  const apiKey = await prisma.apiKey.create({
    data: {
      name: `${setupToken.deviceName} Key`,
      organizationId: setupToken.organizationId,
      createdById: setupToken.createdById,
      environment: setupToken.environment,
      keyType: "POS",
      permissions: setupToken.permissions,
      keyPrefix: prefix,
      hashedKey: encryptedHash,
      locationId: setupToken.locationId,
      metadata: {
        deviceName: setupToken.deviceName,
        deviceType: setupToken.deviceType,
        locationId: setupToken.locationId,
      },
    },
  });

  // 3. Create Device Registry
  const deviceRegistry = await prisma.deviceRegistry.create({
    data: {
      organizationId: setupToken.organizationId,
      apiKeyId: apiKey.id,
      deviceName: setupToken.deviceName,
      deviceType: setupToken.deviceType,
      locationId: setupToken.locationId,
      status: "ACTIVE",
    },
  });

  // 4. Mark token as used
  await prisma.deviceSetupToken.update({
    where: { id: setupToken.id },
    data: {
      usedAt: new Date(),
      redeemedApiKeyId: apiKey.id
    },
  });

  return {
    apiKey: plaintextKey,
    apiKeyId: apiKey.id,
    deviceRegistryId: deviceRegistry.id,
    device: {
      deviceName: setupToken.deviceName,
      deviceType: setupToken.deviceType,
      locationId: setupToken.locationId,
      permissions: setupToken.permissions,
      environment: setupToken.environment,
    },
    organization: {
        id: setupToken.organization.id,
        slug: setupToken.organization.slug
    },
    createdAt: new Date(),
  };
}
