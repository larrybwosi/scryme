import * as crypto from "crypto";
import * as argon2 from "argon2";
import { encrypt } from "../../api/v2/utils/encryption";

export async function provisionDeviceV2(prisma: any, token: string, extraData: { ipAddress?: string, serialNumber?: string, macAddress?: string } = {}) {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const setupToken = await (prisma.client || prisma).deviceSetupToken.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!setupToken) {
    throw new Error("Invalid or expired setup token");
  }

  // 1. Generate API Key
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
  const apiKey = await (prisma.client || prisma).apiKey.create({
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
  const deviceRegistry = await (prisma.client || prisma).deviceRegistry.create({
    data: {
      organizationId: setupToken.organizationId,
      apiKeyId: apiKey.id,
      deviceName: setupToken.deviceName,
      deviceType: setupToken.deviceType,
      locationId: setupToken.locationId,
      status: "ACTIVE",
      serialNumber: extraData.serialNumber,
      macAddress: extraData.macAddress,
      lastSeenAt: new Date(),
      lastSeenIp: extraData.ipAddress,
    },
  });

  // 4. Mark token as used
  await (prisma.client || prisma).deviceSetupToken.update({
    where: { id: setupToken.id },
    data: {
      usedAt: new Date(),
      redeemedApiKeyId: apiKey.id,
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
    createdAt: new Date(),
  };
}
