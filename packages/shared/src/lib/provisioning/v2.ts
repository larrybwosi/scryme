import * as crypto from "crypto";
import * as argon2 from "argon2";
import { encrypt } from "../../api/v2/utils/encryption";

export async function provisionDeviceV2(prisma: any, token: string, extraData: { ipAddress?: string, serialNumber?: string, macAddress?: string } = {}) {
  const startTime = performance.now();
  console.log('[ProvisionV2] Starting provisioning with token');
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  console.log('[ProvisionV2] Looking up setup token');
  const dbStart = performance.now();
  const setupToken = await (prisma.client || prisma).deviceSetupToken.findUnique({
    where: {
      tokenHash,
    },
  });
  const dbEnd = performance.now();
  console.log(`[ProvisionV2] DB Lookup took ${(dbEnd - dbStart).toFixed(2)}ms`);

  if (!setupToken) {
    console.log('[ProvisionV2] Setup token not found');
    throw new Error("Invalid setup token");
  }

  if (setupToken.revokedAt) {
    console.log('[ProvisionV2] Setup token is revoked');
    throw new Error("Setup token has been revoked");
  }

  if (setupToken.usedAt) {
    console.log('[ProvisionV2] Setup token has already been used');
    throw new Error("Setup token has already been used");
  }

  if (setupToken.expiresAt < new Date()) {
    console.log('[ProvisionV2] Setup token has expired');
    throw new Error("Setup token has expired");
  }

  console.log('[ProvisionV2] Found valid setup token for device:', setupToken.deviceName);

  // 1. Generate API Key
  const secret = crypto.randomBytes(32).toString("hex");
  const uniqueId = crypto.randomBytes(8).toString("hex");
  const envSegment = setupToken.environment.toLowerCase();
  const prefix = `dealio_${setupToken.environment === "LIVE" ? "pk" : "sk"}_${envSegment}_${uniqueId}_`;

  const plaintextKey = `${prefix}${secret}`;

  // Hash the secret
  console.log('[ProvisionV2] Hashing secret with argon2...');
  const argonStart = performance.now();
  const hashedSecret = await argon2.hash(secret, {
    type: argon2.argon2id,
    memoryCost: 4096,
    timeCost: 3,
    parallelism: 4,
  });
  const argonEnd = performance.now();
  console.log(`[ProvisionV2] Argon2 hash complete in ${(argonEnd - argonStart).toFixed(2)}ms`);

  // Encrypt the hash for storage
  console.log('[ProvisionV2] Encrypting hash for storage...');
  const encryptedHash = encrypt(hashedSecret);
  console.log('[ProvisionV2] Encryption complete');

  // 2. Create API Key
  console.log('[ProvisionV2] Creating API Key in database...');
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
  console.log('[ProvisionV2] Creating Device Registry in database...');
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
  console.log('[ProvisionV2] Updating setup token as used...');
  await (prisma.client || prisma).deviceSetupToken.update({
    where: { id: setupToken.id },
    data: {
      usedAt: new Date(),
      redeemedApiKeyId: apiKey.id,
    },
  });

  const totalTime = performance.now() - startTime;
  console.log(`[ProvisionV2] Provisioning complete in ${totalTime.toFixed(2)}ms`);
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
